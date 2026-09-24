import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
export async function POST(){return NextResponse.json({error:"Manual payments are disabled. All purchases must use the online payment flow."},{status:410})}
