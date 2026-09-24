import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getBearerToken, verifyFirebaseIdToken } from "@/lib/firebase-verify";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function GET(request: Request) {
  try {
    const user = await verifyFirebaseIdToken(getBearerToken(request));
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    const itemSlug = new URL(request.url).searchParams.get("itemSlug")?.trim();
    const client = await clientPromise;
    const db = client.db(dbName);
    const email = user.email?.trim().toLowerCase() || "";
    const identity = email ? [{ userId: user.uid }, { userEmail: email }] : [{ userId: user.uid }];
    const filter: any = {
      refunded: { $ne: true },
      $or: identity,
    };
    if (itemSlug) {
      const legacyCourseSlug = itemSlug.startsWith("course-") ? itemSlug.slice("course-".length) : "";
      filter.$and = [{
        $or: [
          { itemSlug },
          { slug: itemSlug },
          ...(legacyCourseSlug ? [{ slug: legacyCourseSlug }] : []),
        ],
      }];
    }

    const events = await db.collection("payment_events").find(filter, {
      projection: { _id: 0, accessToken: 0 },
    }).sort({ paidAt: -1 }).limit(itemSlug ? 20 : 100).toArray();

    return NextResponse.json({
      purchases: events.map((event: any) => ({
        id: event.id,
        kind: event.kind,
        title: event.title || event.itemTitle || event.slug || event.itemSlug || event.invoiceId,
        itemSlug: event.itemSlug || null,
        slug: event.slug || null,
        amount: Number(event.amount) || 0,
        free: event.free === true,
        couponCode: event.couponCode || null,
        paidAt: event.paidAt,
        razorpayPaymentId: event.razorpayPaymentId || null,
        refunded: event.refunded === true,
        refundAmount: Number(event.refundAmount) || 0,
        status: event.refunded === true ? "refunded" : "paid",
        paymentReference: event.razorpayPaymentId || event.razorpayOrderId || null,
      })),
    }, { headers: { "Cache-Control": "no-store, no-cache" } });
  } catch (error) {
    console.error("Error loading user purchases:", error);
    return NextResponse.json({ error: "Failed to load purchases." }, { status: 500 });
  }
}
