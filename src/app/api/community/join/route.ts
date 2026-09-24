import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getBearerToken, verifyFirebaseIdToken } from "@/lib/firebase-verify";
import { cleanText, ensureCommunityIndexes, generateUsername } from "@/lib/community";

const dbName = process.env.MONGODB_DB || "civil-at-hand";
async function getOrCreateUsername(db: any, uid: string): Promise<string> { const existing = await db.collection("users").findOne({ id: uid }, { projection: { username: 1 } }); if (existing?.username) return String(existing.username); for (let attempt=0;attempt<8;attempt++){ const candidate=generateUsername(); if (!(await db.collection("users").findOne({username:candidate},{projection:{_id:1}}))){ const now=new Date().toISOString(); await db.collection("users").updateOne({id:uid},{$set:{username:candidate,updatedAt:now},$setOnInsert:{id:uid,createdAt:now}},{upsert:true}); return candidate; } } throw new Error("Unable to allocate a username."); }
export async function POST(request: Request) {
 try {
  const verified=await verifyFirebaseIdToken(getBearerToken(request)); if(!verified||!verified.emailVerified)return NextResponse.json({success:false,error:"Please sign up and verify your account before joining the community."},{status:401});
  const body=await request.json(); const groupId=cleanText(body?.groupId,100); if(!groupId)return NextResponse.json({success:false,error:"Group is required."},{status:400});
  const client=await clientPromise; const db=client.db(dbName); await ensureCommunityIndexes(db); const group=await db.collection("community_groups").findOne({id:groupId,active:{$ne:false}}); if(!group)return NextResponse.json({success:false,error:"This community group is no longer available."},{status:404});
  const user=await db.collection("users").findOne({id:verified.uid}); const username=await getOrCreateUsername(db,verified.uid); const now=new Date().toISOString();
  const existing=await db.collection("community_members").findOne({groupId,userId:verified.uid},{projection:{status:1,banned:1}}); if(existing?.status==="banned"||existing?.banned)return NextResponse.json({success:false,error:"You are not allowed to join this community."},{status:403});
  const profileFields={name:cleanText(body?.name||user?.name||"",120),email:String(body?.email||user?.email||verified.email||"").trim().toLowerCase(),phone:cleanText(body?.phone||user?.phone||"",40),profession:cleanText(body?.profession||user?.profession||"",120),address:cleanText(body?.address||user?.address||"",240),joinPurpose:cleanText(body?.joinPurpose||user?.joinPurpose||"",240),username,communityProfileCompleted:true,updatedAt:now};
  if(!profileFields.name||!profileFields.email)return NextResponse.json({success:false,error:"Your account name and email are required to join the community."},{status:400}); if(profileFields.email!==verified.email?.toLowerCase())return NextResponse.json({success:false,error:"The community email must match your signed-in account."},{status:400});
  await db.collection("users").updateOne({id:verified.uid},{$set:profileFields,$setOnInsert:{id:verified.uid,createdAt:now}},{upsert:true});
  const status=group.type==="channel"?"active":(existing?.status==="active"?"active":"pending"); await db.collection("community_members").updateOne({groupId,userId:verified.uid},{$set:{username,userEmail:profileFields.email,updatedAt:now,status},$setOnInsert:{id:`member_${groupId}_${verified.uid}`,groupId,userId:verified.uid,joinedAt:now,requestedAt:now}},{upsert:true});
  return NextResponse.json({success:true,username,status,group:{id:group.id,name:group.name,type:group.type},profile:profileFields});
 }catch(error){console.error("[community/join] Failed:",error);return NextResponse.json({success:false,error:"Unable to join this group right now."},{status:500});}
}

export async function DELETE(request: Request) {
 try {
  const verified=await verifyFirebaseIdToken(getBearerToken(request)); if(!verified)return NextResponse.json({success:false,error:"Sign in to leave this community."},{status:401});
  const body=await request.json().catch(()=>({})); const groupId=cleanText(body?.groupId,100); if(!groupId)return NextResponse.json({success:false,error:"Group is required."},{status:400});
  const client=await clientPromise; const db=client.db(dbName); await ensureCommunityIndexes(db);
  const member=await db.collection("community_members").findOne({groupId,userId:verified.uid},{projection:{status:1,role:1}}); if(!member||member.status!=="active")return NextResponse.json({success:false,error:"You are not an active member of this community."},{status:400});
  if(["owner","admin"].includes(String(member.role||"").toLowerCase()))return NextResponse.json({success:false,error:"Community admins must transfer ownership or admin access before leaving."},{status:409});
  const now=new Date().toISOString(); await db.collection("community_members").updateOne({groupId,userId:verified.uid},{$set:{status:"left",leftAt:now,updatedAt:now}});
  return NextResponse.json({success:true});
 } catch(error){ console.error("[community/join] Leave failed:",error); return NextResponse.json({success:false,error:"Unable to leave this community right now."},{status:500}); }
}
