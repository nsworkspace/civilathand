import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";
import { refundRazorpayPayment } from "@/lib/razorpay";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";

// Refunds a Razorpay-collected payment (full or partial) and records
// the refund against the matching payment_events record so the admin
// Payments feed always reflects reality. For manually-recorded (cash /
// UPI / bank transfer) events, this just marks them refunded in the DB
// — there's no Razorpay payment to call out to.
export async function POST(request: Request) {
  try {
    const authenticated = await hasModuleAccess("paymentHistory");
    if (!authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const { razorpayPaymentId, eventId, amount, reason } = body || {};

    if (!razorpayPaymentId && !eventId) {
      return NextResponse.json({ error: "Provide either razorpayPaymentId or eventId to refund." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const events = db.collection("payment_events");

    const filter = razorpayPaymentId ? { razorpayPaymentId } : { id: eventId };
    const event = await events.findOne(filter);
    if (!event) {
      return NextResponse.json({ error: "No matching payment found to refund." }, { status: 404 });
    }
    const originalAmount = Math.max(0, Number((event as any).amount) || 0);
    const alreadyRefunded = Math.max(0, Number((event as any).refundAmount) || 0);
    const remaining = Math.max(0, originalAmount - alreadyRefunded);
    if (remaining <= 0 || (event as any).refunded) {
      return NextResponse.json({ error: "This payment has already been fully refunded." }, { status: 400 });
    }

    const requested = Number(amount);
    const refundAmount = Math.round((requested > 0 ? requested : remaining) * 100) / 100;
    if (!Number.isFinite(refundAmount) || refundAmount <= 0 || refundAmount > Math.round(remaining * 100) / 100) {
      return NextResponse.json({ error: `Refund must be between ₹0.01 and ₹${remaining.toLocaleString("en-IN", { maximumFractionDigits: 2 })}.` }, { status: 400 });
    }

    let razorpayRefundId: string | null = null;
    if ((event as any).razorpayPaymentId) {
      const refund = await refundRazorpayPayment({ paymentId: (event as any).razorpayPaymentId, amountInInr: refundAmount, notes: { reason: reason || "Refunded from Admin Panel" } });
      razorpayRefundId = refund.id;
    }

    const cumulativeRefund = Math.round((alreadyRefunded + refundAmount) * 100) / 100;
    const fullyRefunded = cumulativeRefund >= originalAmount - 0.01;
    const refundRecordedAt = new Date().toISOString();
    // MongoDB 7's TypeScript definitions cannot infer the shape of the
    // dynamic `refunds` array on an untyped collection. The update itself is
    // valid MongoDB syntax; keep the cast local rather than weakening the
    // collection type throughout the route.
    await events.updateOne(filter, {
      $set: {
        refunded: fullyRefunded,
        refundedAt: refundRecordedAt,
        refundAmount: cumulativeRefund,
        refundReason: reason?.trim() || (event as any).refundReason || "",
        lastRefundAmount: refundAmount,
        lastRefundedAt: refundRecordedAt,
        razorpayRefundId,
      },
      $push: {
        refunds: {
          id: razorpayRefundId,
          amount: refundAmount,
          reason: reason?.trim() || "",
          createdAt: refundRecordedAt,
        },
      },
    } as any);

    return NextResponse.json({ success: true, razorpayRefundId, refundAmount, cumulativeRefund, fullyRefunded });
  } catch (error: any) {
    console.error("Error issuing refund:", error);
    return NextResponse.json({ error: error?.message || "Failed to issue refund." }, { status: 500 });
  }
}
