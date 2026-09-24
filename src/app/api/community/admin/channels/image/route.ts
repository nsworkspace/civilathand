import { NextRequest, NextResponse } from "next/server";
import { hasModuleAccess } from "@/lib/auth";
import { randomBytes } from "crypto";
import path from "path";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB?.trim() || "civil-at-hand";
const ALLOWED = new Map([["image/jpeg",".jpg"],["image/png",".png"],["image/webp",".webp"],["image/gif",".gif"]]);
const MAX = 8 * 1024 * 1024;
function valid(type:string,b:Buffer){if(type==="image/png")return b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));if(type==="image/jpeg")return b.subarray(0,3).equals(Buffer.from([255,216,255]));if(type==="image/gif"){const s=b.subarray(0,6).toString("ascii");return s==="GIF87a"||s==="GIF89a";}return type==="image/webp"&&b.subarray(0,4).toString("ascii")==="RIFF"&&b.subarray(8,12).toString("ascii")==="WEBP";}
export async function POST(request:NextRequest){try{if(!(await hasModuleAccess("community")))return NextResponse.json({success:false,error:"Unauthorized."},{status:401});const fd=await request.formData();const file=fd.get("file");if(!(file instanceof File))return NextResponse.json({success:false,error:"Please choose a channel image."},{status:400});const ext=ALLOWED.get(file.type);if(!ext||file.size<=0||file.size>MAX)return NextResponse.json({success:false,error:"Use a valid JPG, PNG, WEBP or GIF image up to 8 MB."},{status:415});const b=Buffer.from(await file.arrayBuffer());if(!valid(file.type,b))return NextResponse.json({success:false,error:"The image content does not match its file type."},{status:415});const base=path.basename(file.name||"channel").replace(/\.[^/.]+$/,'').replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,60)||"channel";const filename=`${Date.now()}-${randomBytes(8).toString("hex")}-${base}${ext}`;const db=(await clientPromise).db(dbName);await db.collection("uploaded_files").insertOne({filename,originalName:String(file.name||"channel-image").slice(0,180),contentType:file.type,size:b.length,data:b.toString("base64"),purpose:"community-channel-image",uploadedBy:"community-admin",createdAt:new Date()});return NextResponse.json({success:true,url:`/api/uploads/${filename}`,filename});}catch(e){console.error("Community channel image upload error:",e);return NextResponse.json({success:false,error:"Channel image upload failed. Please try again."},{status:500});}}
