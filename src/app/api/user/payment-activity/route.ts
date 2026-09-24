import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyFirebaseIdToken, getBearerToken } from "@/lib/firebase-verify";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function POST(request: Request) {
  try {
    const verified = await verifyFirebaseIdToken(getBearerToken(request));
    if (!verified) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const body = await request.json().catch(() => null);
    const message = String(body?.message || "Payment attempt failed.").slice(0, 500);
    const allowedStatuses = new Set(["failed", "cancelled", "info"]);
    const activityStatus = allowedStatuses.has(String(body?.status)) ? String(body.status) : "info";
    const client = await clientPromise;
    const db = client.db(dbName);
    await db.collection("user_activity").insertOne({
      id: `act-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      userId: verified.uid,
      userEmail: verified.email || null,
      kind: "payment",
      status: activityStatus,
      type: body?.type || null,
      slug: body?.slug || null,
      invoiceId: body?.invoiceId || null,
      itemSlug: body?.itemSlug || null,
      orderId: body?.orderId || null,
      paymentId: body?.paymentId || null,
      errorCode: body?.errorCode || null,
      message,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording user payment activity:", error);
    return NextResponse.json({ error: "Failed to record payment activity." }, { status: 500 });
  }
}
