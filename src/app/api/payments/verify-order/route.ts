import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyOrderSignature, fetchRazorpayOrder, fetchRazorpayPayment, captureRazorpayPayment } from "@/lib/razorpay";
import { fulfillPayment, FulfillType } from "@/lib/paymentFulfillment";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { recordCouponUse } from "@/lib/coupons";
import { verifyFirebaseIdToken, getBearerToken } from "@/lib/firebase-verify";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

// ─────────────────────────────────────────────────────────────────────
// Verifies a Razorpay Checkout (Orders API) payment and marks the
// matching record as paid — the Orders-API counterpart of
// src/app/api/payments/verify/route.ts (which verifies Payment Link
// callbacks instead). Called client-side, from inside the Checkout
// success handler, by src/components/payments/RazorpayCheckout.tsx.
//
// SECURITY: the item identity (type/slug/invoiceId/itemSlug) is
// NEVER taken from this request's body to decide what to fulfill. It's
// read back from the Razorpay order's own `notes`, stamped in by
// create-order at the moment the price was looked up server-side. This
// is what stops someone from creating a ₹1 order, paying it, then
// calling this route again with a different itemSlug/slug to
// unlock something expensive for ₹1 — the order's notes on Razorpay's
// side are the only source of truth for "what was actually paid for".
// ─────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const { allowed } = rateLimit(`verify-order:${ip}`, { limit: 30, windowMs: 60_000 });
    if (!allowed) {
      return NextResponse.json({ verified: false, error: "Too many requests. Please wait a moment and try again." }, { status: 429 });
    }

    const verifiedUser = await verifyFirebaseIdToken(getBearerToken(request));
    if (!verifiedUser || !verifiedUser.email || !verifiedUser.emailVerified) {
      return NextResponse.json({ verified: false, error: "Please sign in with a verified email address to complete payment verification.", requiresAuth: true }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ verified: false, error: "Missing payment parameters." }, { status: 400 });
    }

    const isValid = verifyOrderSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json(
        { verified: false, error: "Signature mismatch — payment could not be verified." },
        { status: 400 }
      );
    }

    // Fetch the order back from Razorpay — authoritative source for both
    // the amount paid AND what it was actually for (via notes).
    const orderInfo = await fetchRazorpayOrder(razorpay_order_id);
    if (!orderInfo) {
      return NextResponse.json({ verified: false, error: "Could not confirm order with Razorpay." }, { status: 502 });
    }
    // Razorpay's payment resource is the authoritative capture record.
    // The order resource can briefly lag behind immediately after Checkout
    // returns. We therefore verify the actual payment below and only reject
    // if that payment is not captured.
    if (orderInfo.currency && orderInfo.currency !== "INR") {
      return NextResponse.json({ verified: false, error: "Unsupported payment currency." }, { status: 400 });
    }
    if (Number(orderInfo.amount) <= 0) {
      return NextResponse.json({ verified: false, error: "Invalid paid amount returned by Razorpay." }, { status: 400 });
    }

    const paymentInfo = await fetchRazorpayPayment(razorpay_payment_id);
    if (!paymentInfo) {
      return NextResponse.json({ verified: false, error: "Could not confirm payment with Razorpay." }, { status: 502 });
    }
    if (paymentInfo.order_id && paymentInfo.order_id !== razorpay_order_id) {
      return NextResponse.json({ verified: false, error: "Payment/order mismatch." }, { status: 400 });
    }

    // Some Razorpay accounts use manual capture. Checkout can therefore
    // legitimately return an `authorized` payment. Capture it server-side;
    // the Orders API itself must never receive a `capture` field.
    let verifiedPayment = paymentInfo;
    if (verifiedPayment.status === "authorized") {
      const captured = await captureRazorpayPayment(razorpay_payment_id, Number(orderInfo.amount));
      if (captured) verifiedPayment = captured;
      if (verifiedPayment.status !== "captured") {
        const refreshed = await fetchRazorpayPayment(razorpay_payment_id);
        if (refreshed) verifiedPayment = refreshed;
      }
    }
    if (verifiedPayment.status !== "captured") {
      return NextResponse.json({ verified: false, error: "Payment is authorized but not captured yet. Please wait a moment and try again." }, { status: 409 });
    }
    if (Number(verifiedPayment.amount) !== Number(orderInfo.amount)) {
      return NextResponse.json({ verified: false, error: "Payment amount/order amount mismatch." }, { status: 400 });
    }
    if (verifiedPayment.currency && verifiedPayment.currency !== "INR") {
      return NextResponse.json({ verified: false, error: "Unsupported payment currency." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);

    const serverOrder = await db.collection("payment_orders").findOne({ razorpayOrderId: razorpay_order_id });
    if (serverOrder) {
      if (String(serverOrder.userId) !== String(verifiedUser.uid)) {
        return NextResponse.json({ verified: false, error: "This payment belongs to a different account." }, { status: 403 });
      }
      if (String(serverOrder.userEmail || "").trim().toLowerCase() !== verifiedUser.email.trim().toLowerCase()) {
        return NextResponse.json({ verified: false, error: "This payment belongs to a different account." }, { status: 403 });
      }
      if (Number(serverOrder.amountPaise) !== Number(orderInfo.amount)) {
        return NextResponse.json({ verified: false, error: "Payment amount/order mismatch." }, { status: 400 });
      }
      if (serverOrder.currency && serverOrder.currency !== orderInfo.currency) {
        return NextResponse.json({ verified: false, error: "Payment currency/order mismatch." }, { status: 400 });
      }
    }

    const notes = orderInfo.notes || {};
    // The order was created for one verified account. Never allow another
    // signed-in account to present the same paid order and receive the
    // entitlement. This closes an account-hijacking path where a valid
    // order/payment pair could otherwise be replayed by another user.
    if (notes.userId && notes.userId !== verifiedUser.uid) {
      return NextResponse.json({ verified: false, error: "This payment belongs to a different account." }, { status: 403 });
    }
    if (notes.userEmail && notes.userEmail.trim().toLowerCase() !== verifiedUser.email.trim().toLowerCase()) {
      return NextResponse.json({ verified: false, error: "This payment belongs to a different account." }, { status: 403 });
    }

    const type = notes.type as FulfillType | undefined;
    if (!type || !["course", "mentorship", "invoice", "custom"].includes(type)) {
      return NextResponse.json({ verified: false, error: "Order has no recognizable item type." }, { status: 400 });
    }

    const paidAmountInInr = orderInfo.amount / 100;

    const result = await fulfillPayment(db, {
      type,
      slug: notes.slug,
      invoiceId: notes.invoiceId,
      itemSlug: notes.itemSlug,
      amountInInr: paidAmountInInr,
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      free: false,
      offerId: notes.offerId || null,
      offerTitle: notes.offerTitle || null,
      originalAmount: notes.originalAmount ? Number(notes.originalAmount) : null,
      discountAmount: notes.discountAmount ? Number(notes.discountAmount) : 0,
      couponCode: notes.couponCode || null,
      userId: verifiedUser.uid,
      userEmail: verifiedUser.email,
      payerName: paymentInfo.email ? null : null,
      payerContact: verifiedPayment.contact || null,
    });

    try {
      await db.collection("payment_orders").updateOne(
        { razorpayOrderId: razorpay_order_id },
        {
          $set: {
            status: "paid",
            razorpayPaymentId: razorpay_payment_id,
            paidAt: new Date().toISOString(),
            verifiedUserId: verifiedUser.uid,
          },
        }
      );
    } catch (orderProjectionError) {
      console.error("Non-fatal: failed to update payment_orders projection:", orderProjectionError);
    }

    // Coupon usage is only ever counted once a payment is confirmed paid
    // here — never at create-order (an abandoned Checkout modal must not
    // burn a limited-use coupon).
    if (notes.couponCode && !result.alreadyProcessed) {
      try {
        await recordCouponUse(db, notes.couponCode);
      } catch (e) {
        console.error("Non-fatal: failed to record coupon usage:", e);
      }
    }

    return NextResponse.json({ verified: true, ...result });
  } catch (error) {
    console.error("Error verifying Razorpay order payment:", error);
    return NextResponse.json({ verified: false, error: "Failed to verify payment." }, { status: 500 });
  }
}
