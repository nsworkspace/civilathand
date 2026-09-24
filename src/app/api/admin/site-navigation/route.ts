import { NextResponse } from "next/server";
import { hasModuleAccess } from "@/lib/auth";
import { getSiteNavigation, saveSiteNavigation } from "@/lib/siteNavigation";
export const dynamic = "force-dynamic";
async function allowed(){ return await hasModuleAccess("websiteNavigation"); }
export async function GET(){ if(!(await allowed())) return NextResponse.json({error:"Unauthorized"},{status:401}); return NextResponse.json(await getSiteNavigation(),{headers:{"Cache-Control":"no-store"}}); }
export async function PUT(request:Request){ if(!(await allowed())) return NextResponse.json({error:"Unauthorized"},{status:401}); try{ const body=await request.json(); if(!Array.isArray(body?.items)) return NextResponse.json({error:"Invalid navigation payload."},{status:400}); const items=await saveSiteNavigation(body.items); return NextResponse.json({success:true,items}); }catch(error){ console.error("PUT /api/admin/site-navigation",error); return NextResponse.json({error:"Failed to save navigation."},{status:500}); } }
export async function POST(request:Request){ if(!(await allowed())) return NextResponse.json({error:"Unauthorized"},{status:401}); try{ const body=await request.json(); const items=await saveSiteNavigation(body?.items || []); return NextResponse.json({success:true,items}); }catch(error){ console.error("POST /api/admin/site-navigation",error); return NextResponse.json({error:"Failed to save navigation."},{status:500}); } }
