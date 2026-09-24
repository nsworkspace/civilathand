import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { fulfillPayment, FulfillType } from "@/lib/paymentFulfillment";
import { recordCouponUse } from "@/lib/coupons";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

// ─────────────────────────────────────────────────────────────────────
// Server-to-server webhook from Razorpay — the reliability net for the
// whole payment system. The client-side verify-order call can simply
// never happen (user closes the tab/app right after paying, loses
// signal, browser crashes) even though the payment succeeded. This
// webhook fires independently of the browser, so a payment always gets
// fulfilled even in that case.
//
// SETUP (one-time, in the Razorpay Dashboard → Settings → Webhooks):
//   URL:     https://yourdomain.com/api/payments/webhook
//   Events:  order.paid, payment_link.paid
//   Secret:  generate one there → set it as RAZORPAY_WEBHOOK_SECRET
//            in your hosting env vars (separate from your API secret)
//
// Safe to receive the same event twice (Razorpay's retry policy, or a
// resent test event) — fulfillPayment() is idempotent on
// razorpayPaymentId, so a duplicate webhook is a no-op.
// ─────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // Read the RAW text body for signature verification before parsing —
  // Razorpay signs the exact bytes it sent, and a reserialized
  // JSON.stringify(JSON.parse(body)) can fail verification even for a
  // genuine event.
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error("Razorpay webhook: signature mismatch — rejecting.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const event = payload?.event;
  const webhookEventId = typeof payload?.id === "string" ? payload.id.trim() : "";

  // "order.paid" (Orders API / in-page Checkout) and "payment_link.paid"
  // (shareable Payment Links generated from Admin → Payments) are the
  // two ways a payment reaches this site — both carry a payment entity
  // + the notes stamped at creation time, so both are fulfilled through
  // the exact same pipeline below. Any other event is just acknowledged
  // and ignored.
  if (event !== "order.paid" && event !== "payment_link.paid") {
    return NextResponse.json({ received: true, ignored: event || "unknown" });
  }

  try {
    let notes: Record<string, any>;
    let payment: any;
    let orderId: string | null;
    let paidAmountInInr: number;
    let payerName: string | null = null;

    if (event === "order.paid") {
      const order = payload?.payload?.order?.entity;
      payment = payload?.payload?.payment?.entity;
      if (!order || !payment) {
        return NextResponse.json({ received: true, error: "Missing order/payment entity." });
      }
      notes = order.notes || {};
      orderId = order.id;
      paidAmountInInr = order.amount / 100;
    } else {
      // payment_link.paid
      const paymentLink = payload?.payload?.payment_link?.entity;
      payment = payload?.payload?.payment?.entity;
      if (!paymentLink || !payment) {
        return NextResponse.json({ received: true, error: "Missing payment_link/payment entity." });
      }
      notes = paymentLink.notes || {};
      orderId = payment.order_id || null;
      payerName = paymentLink.customer?.name || null;
      paidAmountInInr = (paymentLink.amount_paid || payment.amount || 0) / 100;
    }

    const paymentStatus = String(payment?.status || "").toLowerCase();
    if (paymentStatus && !["captured"].includes(paymentStatus)) {
      return NextResponse.json({ received: true, ignored: "payment not captured" });
    }
    const paymentAmount = Number(payment?.amount || 0) / 100;
    if (paymentAmount > 0 && Math.abs(paymentAmount - paidAmountInInr) > 0.01) {
      return NextResponse.json({ received: true, error: "Payment amount mismatch." }, { status: 400 });
    }
    if (payment?.currency && payment.currency !== "INR") {
      return NextResponse.json({ received: true, error: "Unsupported payment currency." }, { status: 400 });
    }

    const type = notes.type as FulfillType | undefined;
    if (!type || !["course", "mentorship", "invoice", "custom"].includes(type)) {
      return NextResponse.json({ received: true, ignored: "no recognizable type" });
    }

    const client = await clientPromise;
    const db = client.db(dbName);

    // Razorpay may retry the same webhook. The payment ID remains the primary
    // entitlement idempotency key, while the webhook event ID prevents
    // duplicate coupon/projection work for the exact same delivery.
    if (webhookEventId) {
      try {
        await db.collection("payment_webhook_events").createIndex(
          { eventId: 1 },
          { unique: true, name: "uniq_razorpay_webhook_event_id" }
        );
        await db.collection("payment_webhook_events").insertOne({
          eventId: webhookEventId,
          event: event || null,
          paymentId: payment?.id || null,
          orderId,
          receivedAt: new Date().toISOString(),
        });
      } catch (webhookReplayError: any) {
        if (webhookReplayError?.code === 11000) {
          return NextResponse.json({ received: true, duplicate: true });
        }
        // Auxiliary replay bookkeeping must never prevent a legitimate
        // payment from reaching the primary fulfillment pipeline.
        console.error("Non-fatal: webhook replay guard unavailable:", webhookReplayError);
      }
    }

    const result = await fulfillPayment(db, {
      type,
      slug: notes.slug,
      invoiceId: notes.invoiceId,
      itemSlug: notes.itemSlug,
      amountInInr: paidAmountInInr,
      razorpayPaymentId: payment.id,
      razorpayOrderId: orderId,
      free: false,
      offerId: notes.offerId || null,
      offerTitle: notes.offerTitle || null,
      originalAmount: notes.originalAmount ? Number(notes.originalAmount) : null,
      discountAmount: notes.discountAmount ? Number(notes.discountAmount) : 0,
      couponCode: notes.couponCode || null,
      userId: notes.userId || null,
      userEmail: notes.userEmail || payment.email || null,
      payerName,
      payerContact: payment.contact || null,
    });


    if (orderId) {
      try {
        await db.collection("payment_orders").updateOne(
          { razorpayOrderId: orderId },
          {
            $set: {
              status: "paid",
              razorpayPaymentId: payment.id,
              paidAt: new Date().toISOString(),
            },
          }
        );
      } catch (orderProjectionError) {
        console.error("Non-fatal: failed to update payment_orders from webhook:", orderProjectionError);
      }
    }

    // Mirrors the same coupon-usage bump verify-order does — guarded by
    // alreadyProcessed so a payment fulfilled by one path never double
    // counts a coupon when the other path also fires (belt & suspenders).
    if (notes.couponCode && !result.alreadyProcessed) {
      try {
        await recordCouponUse(db, notes.couponCode);
      } catch (e) {
        console.error("Non-fatal: failed to record coupon usage from webhook:", e);
      }
    }

    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    console.error("Error processing Razorpay webhook:", error);
    // 500 so Razorpay retries this event later instead of silently
    // losing a payment.
    return NextResponse.json({ received: false, error: "Internal error." }, { status: 500 });
  }
}
