import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getBearerToken, verifyFirebaseIdToken } from "@/lib/firebase-verify";
import { cleanText, ensureCommunityIndexes } from "@/lib/community";
import { hasModuleAccess } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";

async function getAuth(request: Request) { const verified = await verifyFirebaseIdToken(getBearerToken(request)); return verified?.emailVerified ? verified : null; }
async function getDb() { const client = await clientPromise; const db = client.db(dbName); await ensureCommunityIndexes(db); return db; }
async function canUse(db: any, groupId: string, uid: string, admin: boolean) { if (admin) return true; return !!(await db.collection("community_members").findOne({groupId,userId:uid,status:"active",banned:{$ne:true}},{projection:{_id:1}})); }
const text=(v:unknown,n:number)=>cleanText(v,n);

export async function GET(request: Request) {
 try {
  const verified=await getAuth(request); if(!verified)return NextResponse.json({success:false,error:"Please sign in and verify your account."},{status:401});
  const groupId=text(new URL(request.url).searchParams.get("groupId"),140); if(!groupId)return NextResponse.json({success:false,error:"Group is required."},{status:400});
  const db=await getDb(); const admin=await hasModuleAccess("community"); if(!(await canUse(db,groupId,verified.uid,admin)))return NextResponse.json({success:false,error:"Join this community before using Chat Pro."},{status:403});
  const [saved,pins,follows,polls,tasks,activity]=await Promise.all([
   db.collection("community_chat_saved").find({groupId,userId:verified.uid}).sort({createdAt:-1}).limit(200).toArray(),
   db.collection("community_chat_pins").find({groupId}).sort({createdAt:-1}).limit(100).toArray(),
   db.collection("community_chat_follows").find({groupId,userId:verified.uid}).sort({createdAt:-1}).limit(100).toArray(),
   db.collection("community_chat_polls").find({groupId,archived:{$ne:true}}).sort({createdAt:-1}).limit(50).toArray(),
   db.collection("community_chat_tasks").find({groupId,archived:{$ne:true}}).sort({updatedAt:-1}).limit(100).toArray(),
   db.collection("community_chat_activity").find({groupId}).sort({createdAt:-1}).limit(100).toArray()
  ]);
  return NextResponse.json({success:true,saved:saved.map((x:any)=>({id:String(x.id),messageId:String(x.messageId),createdAt:x.createdAt})),pins:pins.map((x:any)=>({id:String(x.id),messageId:String(x.messageId),createdAt:x.createdAt,pinnedBy:String(x.pinnedBy||"")})),follows:follows.map((x:any)=>({id:String(x.id),messageId:String(x.messageId),createdAt:x.createdAt})),polls:polls.map((x:any)=>({id:String(x.id),question:String(x.question||""),options:Array.isArray(x.options)?x.options.map(String):[],votes:x.votes||{},myVote:x.voters?.[verified.uid]??null,createdAt:x.createdAt})),tasks:tasks.map((x:any)=>({id:String(x.id),title:String(x.title||""),description:String(x.description||""),done:!!x.done,assignee:String(x.assignee||""),createdAt:x.createdAt,updatedAt:x.updatedAt})),activity:activity.map((x:any)=>({type:String(x.type||"activity"),text:String(x.text||""),createdAt:x.createdAt}))});
 } catch(error) { console.error("[community/features] GET failed:",error); return NextResponse.json({success:false,error:"Unable to load Chat Pro data."},{status:500}); }
}

export async function POST(request: Request) {
 try {
  const verified=await getAuth(request); if(!verified)return NextResponse.json({success:false,error:"Please sign in and verify your account."},{status:401});
  const body=await request.json().catch(()=>({})); const groupId=text(body?.groupId,140); const action=text(body?.action,40); if(!groupId||!action)return NextResponse.json({success:false,error:"Group and action are required."},{status:400});
  const db=await getDb(); const admin=await hasModuleAccess("community"); if(!(await canUse(db,groupId,verified.uid,admin)))return NextResponse.json({success:false,error:"Join this community before using Chat Pro."},{status:403});
  const limit=rateLimit(`community-chat-pro:${verified.uid}:${groupId}`,{limit:90,windowMs:60000}); if(!limit.allowed)return NextResponse.json({success:false,error:"Too many Chat Pro actions. Please wait a moment."},{status:429});
  const now=new Date(); const log=async(type:string,msg:string)=>db.collection("community_chat_activity").insertOne({id:`act_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,groupId,userId:verified.uid,type,text:cleanText(msg,300),createdAt:now});
  if(["save","unsave","pin","unpin","follow","unfollow"].includes(action)){
   const messageId=text(body?.messageId,140); if(!messageId)return NextResponse.json({success:false,error:"Message is required."},{status:400});
   const collection=action.startsWith("pin")?"community_chat_pins":action.startsWith("follow")?"community_chat_follows":"community_chat_saved"; const query=action.startsWith("pin")?{groupId,messageId}:{groupId,userId:verified.uid,messageId};
   if(["save","pin","follow"].includes(action)) await db.collection(collection).updateOne(query,{$setOnInsert:{id:`${collection}_${groupId}_${messageId}_${verified.uid}`,groupId,userId:verified.uid,messageId,pinnedBy:verified.uid,createdAt:now}},{upsert:true}); else await db.collection(collection).deleteOne(query);
   await log(action,`${action} message`); return NextResponse.json({success:true});
  }
  if(action==="poll_create"){
   const question=text(body?.question,240); const options=Array.isArray(body?.options)?body.options.map((v:unknown)=>text(v,160)).filter(Boolean).slice(0,8):[]; if(!question||options.length<2)return NextResponse.json({success:false,error:"A poll needs a question and at least two options."},{status:400});
   const poll={id:`poll_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,groupId,question,options,votes:{},voters:{},createdBy:verified.uid,createdAt:now}; await db.collection("community_chat_polls").insertOne(poll); await log("poll",`Poll created: ${question}`); return NextResponse.json({success:true,poll});
  }
  if(action==="poll_vote"){
   const pollId=text(body?.pollId,140); const optionIndex=Number(body?.optionIndex); if(!pollId||!Number.isInteger(optionIndex)||optionIndex<0)return NextResponse.json({success:false,error:"Valid poll and option are required."},{status:400}); const poll=await db.collection("community_chat_polls").findOne({id:pollId,groupId,archived:{$ne:true}}); if(!poll||!Array.isArray(poll.options)||optionIndex>=poll.options.length)return NextResponse.json({success:false,error:"Poll not found."},{status:404});
   const previous=poll.voters?.[verified.uid]; const votes={...(poll.votes||{})}; const voters={...(poll.voters||{})}; if(Number.isInteger(previous)&&previous>=0)votes[previous]=Math.max(0,Number(votes[previous]||0)-1); voters[verified.uid]=optionIndex; votes[optionIndex]=Number(votes[optionIndex]||0)+1; await db.collection("community_chat_polls").updateOne({id:pollId,groupId},{$set:{votes,voters,updatedAt:now}}); await log("poll_vote",`Voted in poll: ${String(poll.question||"poll")}`); return NextResponse.json({success:true,votes,myVote:optionIndex});
  }
  if(action==="task_create"){
   const title=text(body?.title,180); if(!title)return NextResponse.json({success:false,error:"Task title is required."},{status:400}); const task={id:`task_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,groupId,title,description:text(body?.description,800),assignee:text(body?.assignee,160),done:false,createdBy:verified.uid,createdAt:now,updatedAt:now}; await db.collection("community_chat_tasks").insertOne(task); await log("task",`Task created: ${title}`); return NextResponse.json({success:true,task});
  }
  if(action==="task_update"){
   const taskId=text(body?.taskId,140); if(!taskId)return NextResponse.json({success:false,error:"Task is required."},{status:400}); const set:Record<string,unknown>={updatedAt:now}; if(typeof body?.done==="boolean")set.done=body.done; if(typeof body?.title==="string")set.title=text(body.title,180); if(typeof body?.description==="string")set.description=text(body.description,800); if(typeof body?.assignee==="string")set.assignee=text(body.assignee,160); const result=await db.collection("community_chat_tasks").updateOne({id:taskId,groupId,archived:{$ne:true}},{$set:set}); if(!result.matchedCount)return NextResponse.json({success:false,error:"Task not found."},{status:404}); await log("task_update",`Task updated: ${taskId}`); return NextResponse.json({success:true});
  }
  if(action==="task_delete"){const taskId=text(body?.taskId,140);if(!taskId)return NextResponse.json({success:false,error:"Task is required."},{status:400});const result=await db.collection("community_chat_tasks").updateOne({id:taskId,groupId,archived:{$ne:true}},{$set:{archived:true,updatedAt:now}});if(!result.matchedCount)return NextResponse.json({success:false,error:"Task not found."},{status:404});await log("task_delete",`Task archived: ${taskId}`);return NextResponse.json({success:true});}
  if(action==="report"){const messageId=text(body?.messageId,140);const reason=text(body?.reason,300);if(!messageId||!reason)return NextResponse.json({success:false,error:"Message and report reason are required."},{status:400});await db.collection("community_chat_reports").insertOne({id:`report_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,groupId,messageId,userId:verified.uid,reason,status:"open",createdAt:now});await log("report","A message was reported for moderation review.");return NextResponse.json({success:true});}
  return NextResponse.json({success:false,error:"Unsupported Chat Pro action."},{status:400});
 } catch(error){console.error("[community/features] POST failed:",error);return NextResponse.json({success:false,error:"Unable to complete this Chat Pro action."},{status:500});}
}
