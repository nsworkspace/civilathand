import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { checkCoupon } from "@/lib/coupons";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limited = rateLimit(`check-coupon:${ip}`, { limit: 20, windowMs: 60_000 });
    if (!limited.allowed) return NextResponse.json({ valid: false, error: "Too many attempts. Please wait a moment." }, { status: 429 });

    const body = await request.json().catch(() => null);
    const code = String(body?.code || "").trim();
    const category = String(body?.category || "custom").trim();
    const baseAmount = Number(body?.baseAmount);
    if (!code || !Number.isFinite(baseAmount) || baseAmount < 0) {
      return NextResponse.json({ valid: false, error: "Enter a valid coupon code." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const result = await checkCoupon(db, code, category, baseAmount);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Coupon validation failed:", error);
    return NextResponse.json({ valid: false, error: "Unable to validate this coupon right now." }, { status: 500 });
  }
}
