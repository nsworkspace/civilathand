import { NextResponse } from "next/server";
import { getSiteNavigation } from "@/lib/siteNavigation";
export const dynamic = "force-dynamic";
export async function GET() { const navigation = await getSiteNavigation(); return NextResponse.json(navigation, { headers: { "Cache-Control": "no-store" } }); }
