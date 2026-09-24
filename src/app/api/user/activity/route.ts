import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyFirebaseIdToken, getBearerToken } from "@/lib/firebase-verify";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";
const MAX = 100;

export async function GET(request: Request) {
  try {
    const verified = await verifyFirebaseIdToken(getBearerToken(request));
    if (!verified) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const client = await clientPromise;
    const db = client.db(dbName);
    const paymentEvents = await db.collection("payment_events")
      .find({ $or: [{ userId: verified.uid }, { userEmail: verified.email || "" }] })
      .sort({ paidAt: -1 }).limit(MAX).toArray();
    const userActivity = await db.collection("user_activity")
      .find({ userId: verified.uid })
      .sort({ createdAt: -1 }).limit(MAX).toArray();

    const purchases = paymentEvents.map(({ _id, ...e }: any) => ({
      id: e.id || String(_id),
      kind: e.kind,
      title: e.title || e.itemTitle || e.slug || e.itemSlug || "Purchase",
      amount: Number(e.amount || 0),
      paid: !e.refunded,
      refunded: !!e.refunded,
      refundAmount: Number(e.refundAmount || 0),
      paymentId: e.razorpayPaymentId || null,
      razorpayPaymentId: e.razorpayPaymentId || null,
      itemSlug: e.itemSlug || null,
      slug: e.slug || null,
      invoiceId: e.invoiceId || null,
      free: e.free === true,
      userEmail: e.userEmail || verified.email || null,
      paidAt: e.paidAt || null,
    }));
    const activities = [
      ...paymentEvents.map((e: any) => ({
        id: `payment-${e.id || e.razorpayPaymentId || Math.random()}`,
        kind: "purchase",
        status: e.refunded ? "refunded" : "success",
        title: e.title || e.itemTitle || e.slug || e.itemSlug || "Payment",
        message: e.refunded ? "Payment refunded." : "Payment completed successfully.",
        createdAt: e.paidAt || null,
      })),
      ...userActivity.map(({ _id, ...e }: any) => ({
        id: e.id || String(_id),
        kind: e.kind || "activity",
        status: e.status || "info",
        title: e.type ? `${String(e.type).replace(/_/g, " ")} activity` : "Account activity",
        message: e.message || "Activity recorded.",
        createdAt: e.createdAt || null,
      })),
    ].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))).slice(0, MAX);

    return NextResponse.json({ purchases, activities }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    return NextResponse.json({ error: "Failed to load account activity." }, { status: 500 });
  }
}
