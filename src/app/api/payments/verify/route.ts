import { NextResponse } from "next/server";
import crypto from "crypto";
import clientPromise from "@/lib/mongodb";
import { fetchRazorpayPayment, fetchRazorpayPaymentLink } from "@/lib/razorpay";
import { fulfillPayment, FulfillType } from "@/lib/paymentFulfillment";
import { recordCouponUse } from "@/lib/coupons";
import { getBearerToken, verifyFirebaseIdToken } from "@/lib/firebase-verify";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";

/**
 * Payment Link callback verifier. This is kept as the compatibility endpoint
 * for old links, but it now uses the same centralized fulfillment pipeline as
 * Checkout and the Razorpay webhook. The Razorpay Payment Link itself is the
 * source of truth for amount and notes; query-string metadata is never used
 * to decide what gets fulfilled.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const paymentId = String(body?.razorpay_payment_id || "").trim();
    const linkId = String(body?.razorpay_payment_link_id || "").trim();
    const referenceId = String(body?.razorpay_payment_link_reference_id || "").trim();
    const linkStatus = String(body?.razorpay_payment_link_status || "").trim();
    const signature = String(body?.razorpay_signature || "").trim();
    if (!paymentId || !linkId || !referenceId || !linkStatus || !signature) {
      return NextResponse.json({ verified: false, error: "Missing payment parameters." }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return NextResponse.json({ verified: false, error: "Payment verification is not configured." }, { status: 500 });

    const payload = `${linkId}|${referenceId}|${linkStatus}|${paymentId}`;
    const expected = crypto.createHmac("sha256", keySecret).update(payload).digest("hex");
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      return NextResponse.json({ verified: false, error: "Signature mismatch — payment could not be verified." }, { status: 400 });
    }
    if (linkStatus !== "paid") return NextResponse.json({ verified: true, paid: false, error: "Payment was not completed." });

    const link = await fetchRazorpayPaymentLink(linkId);
    if (!link || link.status !== "paid") return NextResponse.json({ verified: false, error: "Could not confirm the Payment Link with Razorpay." }, { status: 502 });
    if (link.reference_id && link.reference_id !== referenceId) return NextResponse.json({ verified: false, error: "Payment Link reference mismatch." }, { status: 400 });
    if (link.currency && link.currency !== "INR") return NextResponse.json({ verified: false, error: "Unsupported payment currency." }, { status: 400 });

    const payment = await fetchRazorpayPayment(paymentId);
    if (!payment) return NextResponse.json({ verified: false, error: "Could not confirm the payment with Razorpay." }, { status: 502 });
    if (payment.status !== "captured") return NextResponse.json({ verified: false, error: "Razorpay has not captured this payment yet." }, { status: 400 });
    if (payment.currency && payment.currency !== "INR") return NextResponse.json({ verified: false, error: "Unsupported payment currency." }, { status: 400 });
    if (payment.order_id && link.order_id && payment.order_id !== link.order_id) {
      return NextResponse.json({ verified: false, error: "Payment/order mismatch." }, { status: 400 });
    }
    const linkPaidAmount = Number(link.amount_paid || link.amount || 0);
    if (Number(payment.amount || 0) !== linkPaidAmount) {
      return NextResponse.json({ verified: false, error: "Payment amount/link amount mismatch." }, { status: 400 });
    }

    const notes = link.notes || {};
    let type = notes.type as FulfillType | undefined;
    let slug = notes.slug;
    let invoiceId = notes.invoiceId;
    let itemSlug = notes.itemSlug;

    // Compatibility for older links that pre-date centralized notes.
    if (!type) {
      if (referenceId.startsWith("course-")) { type = "course"; slug = referenceId.replace(/^course-/, ""); }
      else if (referenceId === "mentorship") { type = "mentorship"; itemSlug = "mentorship-program"; }
      else if (referenceId.startsWith("inv-")) { type = "invoice"; invoiceId = referenceId; }
    }
    if (!type || !["course", "mentorship", "invoice", "custom"].includes(type)) {
      return NextResponse.json({ verified: false, error: "Payment Link has no recognizable payment type." }, { status: 400 });
    }

    // Protected self-serve items must be tied to a verified Firebase
    // account even when an older Payment Link is being verified. Invoices
    // remain the only intentionally shareable link type.
    let verifiedUser: any = null;
    if (type !== "invoice") {
      verifiedUser = await verifyFirebaseIdToken(getBearerToken(request));
      if (!verifiedUser?.uid || !verifiedUser.email || !verifiedUser.emailVerified) {
        return NextResponse.json({ verified: false, error: "Sign in with the verified account used for this purchase before claiming access.", requiresAuth: true }, { status: 401 });
      }
      if (notes.userId && notes.userId !== verifiedUser.uid) {
        return NextResponse.json({ verified: false, error: "This payment belongs to a different account." }, { status: 403 });
      }
      if (notes.userEmail && notes.userEmail.trim().toLowerCase() !== verifiedUser.email.trim().toLowerCase()) {
        return NextResponse.json({ verified: false, error: "This payment belongs to a different account." }, { status: 403 });
      }
      if (!notes.userId && !notes.userEmail) {
        return NextResponse.json({ verified: false, error: "This protected payment link is not bound to a buyer account. Please use the signed-in website checkout.", requiresAuth: true }, { status: 403 });
      }
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const result = await fulfillPayment(db, {
      type,
      slug,
      invoiceId,
      itemSlug,
      amountInInr: Number(link.amount_paid || link.amount || 0) / 100,
      razorpayPaymentId: paymentId,
      razorpayOrderId: payment.order_id || link.order_id || null,
      free: false,
      offerId: notes.offerId || null,
      offerTitle: notes.offerTitle || null,
      originalAmount: notes.originalAmount ? Number(notes.originalAmount) : null,
      discountAmount: notes.discountAmount ? Number(notes.discountAmount) : 0,
      couponCode: notes.couponCode || null,
      userId: verifiedUser?.uid || notes.userId || null,
      userEmail: verifiedUser?.email || notes.userEmail || payment.email || link.customer?.email || null,
      payerContact: payment.contact || link.customer?.contact || null,
    });

    if (notes.couponCode && !result.alreadyProcessed) {
      try { await recordCouponUse(db, notes.couponCode); } catch (e) { console.error("Non-fatal: failed to record coupon usage:", e); }
    }

    return NextResponse.json({ verified: true, ...result });
  } catch (error: any) {
    console.error("Error verifying Razorpay Payment Link:", error);
    const message =
      typeof error?.message === "string" && error.message.length <= 240
        ? error.message
        : "Payment verification is temporarily unavailable. Please try again.";
    return NextResponse.json({ verified: false, error: message }, { status: 500 });
  }
}
