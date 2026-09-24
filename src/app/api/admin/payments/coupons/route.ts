import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";

function cleanScopes(value: unknown): string[] {
  if (!Array.isArray(value)) return ["all"];
  const scopes = value.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map(x => x.trim().toLowerCase());
  return scopes.length ? Array.from(new Set(scopes)) : ["all"];
}

export async function GET() {
  if (!(await hasModuleAccess("paymentOffers"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const db = (await clientPromise).db(dbName);
    const rows = await db.collection("payment_coupons").find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ coupons: rows.map(({ _id, ...r }) => r) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Coupon admin GET failed:", error);
    return NextResponse.json({ error: "Failed to load coupons." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await hasModuleAccess("paymentOffers"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json().catch(() => null);
    const code = String(body?.code || "").trim().toUpperCase().replace(/\s+/g, "");
    const type = body?.type === "flat" ? "flat" : "percent";
    const value = Number(body?.value);
    const maxUses = body?.maxUses === null || body?.maxUses === "" || body?.maxUses === undefined ? null : Number(body.maxUses);
    const minAmount = body?.minAmount === null || body?.minAmount === "" || body?.minAmount === undefined ? null : Number(body.minAmount);
    if (code.length < 3 || code.length > 40 || !/^[A-Z0-9_-]+$/.test(code)) return NextResponse.json({ error: "Coupon code must be 3–40 letters/numbers and may include _ or -." }, { status: 400 });
    if (!Number.isFinite(value) || value <= 0 || (type === "percent" && value > 100)) return NextResponse.json({ error: "Invalid discount value." }, { status: 400 });
    if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) return NextResponse.json({ error: "Max uses must be a positive whole number." }, { status: 400 });
    if (minAmount !== null && (!Number.isFinite(minAmount) || minAmount < 0)) return NextResponse.json({ error: "Minimum amount is invalid." }, { status: 400 });
    const expiresAt = body?.expiresAt ? new Date(`${String(body.expiresAt).slice(0, 10)}T23:59:59.999Z`).toISOString() : null;
    const id = String(body?.id || `coupon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`);
    const now = new Date().toISOString();
    const doc = { id, code, type, value, appliesTo: cleanScopes(body?.appliesTo), maxUses, expiresAt, active: body?.active !== false, minAmount, updatedAt: now };
    const db = (await clientPromise).db(dbName);
    const collection = db.collection("payment_coupons");
    const duplicate = await collection.findOne({ code, id: { $ne: id } });
    if (duplicate) return NextResponse.json({ error: "That coupon code already exists." }, { status: 409 });
    const existing = await collection.findOne({ id });
    if (existing) await collection.updateOne({ id }, { $set: doc });
    else await collection.insertOne({ ...doc, usedCount: 0, createdAt: now });
    const saved = await collection.findOne({ id });
    const { _id, ...coupon } = saved as any;
    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    console.error("Coupon admin POST failed:", error);
    return NextResponse.json({ error: "Failed to save coupon." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await hasModuleAccess("paymentOffers"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Coupon id is required." }, { status: 400 });
    const db = (await clientPromise).db(dbName);
    await db.collection("payment_coupons").deleteOne({ id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Coupon admin DELETE failed:", error);
    return NextResponse.json({ error: "Failed to delete coupon." }, { status: 500 });
  }
}
