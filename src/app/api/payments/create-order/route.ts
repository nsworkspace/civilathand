import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { createRazorpayOrder, isValidInrAmount, shortReceipt, getRazorpayKeys, MAX_AMOUNT_INR } from "@/lib/razorpay";
import { fulfillPayment, FulfillType } from "@/lib/paymentFulfillment";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { MENTORSHIP_SLUG, courseItemSlug } from "@/lib/paymentSlugs";
import { verifyFirebaseIdToken, getBearerToken } from "@/lib/firebase-verify";
import { checkCoupon } from "@/lib/coupons";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";
const VALID_TYPES: FulfillType[] = ["course", "mentorship", "invoice", "custom"];

// ─────────────────────────────────────────────────────────────────────
// Public "self-checkout" order creation, used by every RazorpayCheckout
// / PaymentButton on the site (courses, mentorship,
// invoices, and any admin-created custom payment item — a calculator
// unlock, a webinar seat, a downloadable checklist, anything).
//
// This is the Orders-API equivalent of
// src/app/api/admin/payments/create-link/route.ts (which creates a
// Payment Link and requires admin login). This route is intentionally
// public — any visitor needs to be able to call it to pay for THAT
// item — but the amount charged is ALWAYS looked up fresh from the
// database here, never trusted from the client, so nobody can tamper
// with the price from devtools.
//
// The exact item identity (type + slug/invoiceId/itemSlug) is
// stamped into the Razorpay order's `notes`. verify-order and the
// webhook read it back from there instead of trusting the client's
// body a second time — this is what stops a paid-for cheap item from
// being replayed to unlock a different, more expensive one.
//
// Supported `type` values: "course" | "mentorship" | "invoice" | "custom"
//
// FREE ITEMS (₹0): if the looked-up price is exactly 0, no Razorpay
// order is created at all — the item is fulfilled immediately and the
// response comes back with `free: true` so the client never opens the
// Checkout modal. This is how you can offer something for ₹0 today and
// switch it to a real price later from the admin Payments panel without
// touching any code.
// ─────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    // Public + unauthenticated by design, so rate-limit per IP to stop
    // scripted abuse (order-spam against your Razorpay account, or
    // probing for valid slugs/ids).
    const ip = getClientIp(request);
    const { allowed } = rateLimit(`create-order:${ip}`, { limit: 20, windowMs: 60_000 });
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment and try again." }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const type: string = body?.type;
    if (!VALID_TYPES.includes(type as FulfillType)) {
      return NextResponse.json({ error: "Invalid type. Must be course, test, mentorship, invoice, or custom." }, { status: 400 });
    }

    // Authentication is resolved up front. Every self-serve checkout,
    // including a ₹0/free claim, is tied to a verified Firebase account so
    // access and receipts always belong to a real account.
    const idToken = getBearerToken(request);
    const verified = await verifyFirebaseIdToken(idToken);
    const verifiedUser: { uid: string; email: string } | null = verified?.email
      ? { uid: verified.uid, email: verified.email }
      : null;
    if (!verifiedUser || !verified?.emailVerified) {
      return NextResponse.json({ error: "Please sign in with a verified account before starting checkout.", requiresAuth: true }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);

    let amount: number | null = null;
    let freeEnabled = true;
    let description = "Civil At Hand Payment";
    // `notes` is the authoritative record of "what was this order for" —
    // verify-order and the webhook both read identity back from here.
    let notes: Record<string, string> = {
      source: "civilathand-checkout",
      type,
      ...(verifiedUser ? { userId: verifiedUser.uid, userEmail: verifiedUser.email || "" } : {}),
    };
    let receiptBase = "order";

    if (type === "course") {
      const slug: string = String(body?.slug || "").trim();
      if (!slug) return NextResponse.json({ error: "slug is required" }, { status: 400 });
      const course = await db.collection("software_courses").findOne({ slug, source: "admin" });
      if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
      // Price is looked up from the single, central payment_items record
      // (auto-synced whenever this course is saved in Admin → Software
      // Courses; the actual ₹ amount is set from Admin → Payments) —
      // never from a per-feature field, so there is exactly one place
      // that ever decides what a visitor is actually charged.
      const item = await db.collection("payment_items").findOne({ slug: courseItemSlug(slug) });
      if (!item) {
        return NextResponse.json({ error: "Course payment is not configured yet. Please save this course in Admin → Software Courses, then set its price in Admin → Payments." }, { status: 409 });
      }
      if (item.active === false) {
        return NextResponse.json({ error: "This course is not open for enrollment right now." }, { status: 404 });
      }
      amount = Number(item.amount) || 0;
      freeEnabled = item.freeEnabled !== false;
      description = `Course Enrollment — ${course.name || course.title || slug}`;
      notes = { ...notes, slug, itemSlug: item?.slug || courseItemSlug(slug) };
      receiptBase = `course-${slug}`;
    } else if (type === "mentorship") {
      // Mentorship price now lives in the single, central `payment_items`
      // collection (slug: mentorship-program) — the same place every
      // course/test/custom item lives — so it is always managed from
      // Admin → Payments, never a separate "paste a payment link" flow.
      const item = await db.collection("payment_items").findOne({ slug: MENTORSHIP_SLUG });
      if (!item) {
        return NextResponse.json({ error: "Mentorship payment is not configured yet. Please set the price in Admin → Payments." }, { status: 409 });
      }
      if (item.active === false) {
        return NextResponse.json(
          { error: "Mentorship paid enrollment is not open right now. Please use the free application form." },
          { status: 404 }
        );
      }
      amount = Number(item.amount) || 0;
      freeEnabled = item.freeEnabled !== false;
      description = item?.title || "Civil At Hand — 1:1 Mentorship Program Enrollment";
      notes = { ...notes, itemSlug: MENTORSHIP_SLUG };
      receiptBase = "mentorship";
    } else if (type === "invoice") {
      const invoiceId: string = String(body?.invoiceId || "").trim();
      if (!invoiceId) return NextResponse.json({ error: "invoiceId is required" }, { status: 400 });
      const invoice = await db.collection("invoices").findOne({ id: invoiceId });
      if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      if (invoice.status === "Paid") {
        return NextResponse.json({ error: "This invoice is already paid." }, { status: 400 });
      }
      if (!verifiedUser) {
        return NextResponse.json(
          { error: "Please sign in with the verified account associated with this invoice.", requiresAuth: true },
          { status: 401 }
        );
      }
      const invoiceProject = invoice.projectId
        ? await db.collection("projects").findOne({ id: invoice.projectId }, { projection: { clientEmail: 1 } })
        : null;
      const invoiceOwnerEmail =
        String(invoice.clientEmail || invoiceProject?.clientEmail || "").trim().toLowerCase();
      const verifiedUserEmail = String(verifiedUser?.email ?? "").trim().toLowerCase();
      if (invoiceOwnerEmail && invoiceOwnerEmail !== verifiedUserEmail) {
        return NextResponse.json({ error: "This invoice belongs to a different account." }, { status: 403 });
      }
      amount = Number(invoice.amount) || 0;
      description = `Invoice #${String(invoice.id).toUpperCase()} — ${invoice.projectTitle || "Civil At Hand Service"}`;
      notes = { ...notes, invoiceId: invoice.id, projectId: invoice.projectId || "" };
      receiptBase = invoice.id;
    } else if (type === "custom") {
      const itemSlug: string = String(body?.itemSlug || "").trim();
      if (!itemSlug) return NextResponse.json({ error: "itemSlug is required" }, { status: 400 });
      const item = await db.collection("payment_items").findOne({ slug: itemSlug, active: true });
      if (!item) return NextResponse.json({ error: "This payment item is not available." }, { status: 404 });
      if (item.targetUserId || item.targetEmail) {
        const targetEmail = String(item.targetEmail || "").trim().toLowerCase();
        const matches = !!verifiedUser &&
          (!item.targetUserId || item.targetUserId === verifiedUser.uid) &&
          (!targetEmail || targetEmail === verifiedUser.email.trim().toLowerCase());
        if (!matches) return NextResponse.json({ error: "This payment request is assigned to a different account." }, { status: 403 });
      }
      amount = Number(item.amount) || 0;
      freeEnabled = item.freeEnabled !== false;
      description = item.title || itemSlug;
      notes = { ...notes, itemSlug };
      receiptBase = `item-${itemSlug}`;
    }

    if (amount === 0 && !freeEnabled) {
      return NextResponse.json(
        { error: "This payment setup is ₹0 but free access is not enabled in Admin → Payments." },
        { status: 409 }
      );
    }

    if (!isValidInrAmount(amount) || (amount as number) > MAX_AMOUNT_INR) {
      return NextResponse.json(
        { error: `This item's price is not set correctly (must be between ₹0 and ₹${MAX_AMOUNT_INR.toLocaleString("en-IN")}). Please contact us.` },
        { status: 400 }
      );
    }

    // Do not charge an account twice for the same active entitlement.
    // Refunds are excluded, so a refunded purchase can be bought again.
    if (type !== "invoice" && verifiedUser && notes.itemSlug) {
      const existingPurchase = await db.collection("payment_events").findOne({
        itemSlug: notes.itemSlug,
        refunded: { $ne: true },
        $and: [
          {
            $or: [
              { amount: { $gt: 0 }, free: { $ne: true } },
              { amount: 0, free: true, $or: [{ couponCode: { $type: "string" } }, { offerId: { $type: "string" } }] },
            ],
          },
          {
            $or: [
              { userId: verifiedUser.uid },
              ...(verifiedUser.email ? [{ userEmail: verifiedUser.email.trim().toLowerCase() }] : []),
            ],
          },
        ],
      });
      if (existingPurchase) {
        return NextResponse.json(
          {
            error: "This item is already unlocked on your account.",
            alreadyOwned: true,
            itemSlug: notes.itemSlug,
          },
          { status: 409 }
        );
      }
    }

    // Coupon codes are optional. If supplied, the server validates the code
    // against the canonical item price. A coupon intentionally takes
    // precedence over an automatic offer so the buyer gets one predictable
    // discount path and cannot stack discounts accidentally.
    let appliedCoupon: any = null;
    const couponCodeRaw = typeof body?.couponCode === "string" ? body.couponCode.trim() : "";
    if (couponCodeRaw && type !== "invoice") {
      const category = type === "course" ? "course" : type === "mentorship" ? "mentorship" : "custom";
      const couponResult = await checkCoupon(db, couponCodeRaw, category, Number(amount || 0));
      if (!couponResult.valid) {
        return NextResponse.json({ error: couponResult.error || "This coupon is not valid." }, { status: 409 });
      }
      appliedCoupon = couponResult;
      const originalAmount = Number(amount || 0);
      amount = Number(couponResult.discountedAmount || 0);
      notes = { ...notes, couponCode: couponResult.code || couponCodeRaw.toUpperCase(), originalAmount: String(originalAmount), discountAmount: String(couponResult.discountAmount || 0) };
      description = (couponResult.discountAmount || 0) > 0 ? `${description} — Coupon ${couponResult.code}` : description;
    }

    // Automatic offer: the client may only provide an offerId. The server
    // re-reads the offer and canonical payment item price before creating an order.
    let appliedOffer: any = null;
    if (!appliedCoupon && type !== "invoice" && typeof body?.offerId === "string" && body.offerId.trim()) {
      const offer = await db.collection("payment_offers").findOne({ id: body.offerId.trim(), active: true });
      const now = new Date();
      if (!offer) return NextResponse.json({ error: "This offer is no longer available." }, { status: 409 });
      if (offer.startsAt && now < new Date(offer.startsAt)) return NextResponse.json({ error: "This offer has not started yet." }, { status: 409 });
      if (offer.endsAt && now > new Date(offer.endsAt)) return NextResponse.json({ error: "This offer has expired." }, { status: 409 });
      if (offer.usageLimit != null && Number(offer.usedCount || 0) >= Number(offer.usageLimit)) return NextResponse.json({ error: "This offer has reached its usage limit." }, { status: 409 });
      const appliesTo = Array.isArray(offer.appliesTo) ? offer.appliesTo : ["all"];
      if (notes.itemSlug && !appliesTo.includes("all") && !appliesTo.includes(notes.itemSlug)) return NextResponse.json({ error: "This offer does not apply to this payment." }, { status: 409 });
      const originalAmount = Number(amount || 0), value = Number(offer.value || 0);
      const discountAmount = offer.type === "percent" ? Math.min(originalAmount, originalAmount * value / 100) : Math.min(originalAmount, value);
      const discountedAmount = Math.max(0, Math.round((originalAmount - discountAmount) * 100) / 100);
      appliedOffer = { id: String(offer.id), title: String(offer.title || "Offer"), originalAmount, discountAmount, discountedAmount };
      notes = { ...notes, offerId: appliedOffer.id, offerTitle: appliedOffer.title, originalAmount: String(originalAmount), discountAmount: String(discountAmount) };
      amount = discountedAmount;
      description = discountAmount > 0 ? `${description} — ${appliedOffer.title}` : description;
    }

    if (!verifiedUser || !verified?.emailVerified) {
      return NextResponse.json(
        {
          error: (amount as number) === 0
            ? "Please sign in with a verified account before using this free feature."
            : "Please sign in with a verified account before making a paid purchase.",
          requiresAuth: true,
        },
        { status: 401 }
      );
    }

    // ── FREE (₹0) — fulfill immediately, no Razorpay order needed. ──
    if (amount === 0) {
      const result = await fulfillPayment(db, {
        type: type as FulfillType,
        slug: body?.slug,
        invoiceId: body?.invoiceId,
        itemSlug: notes.itemSlug || body?.itemSlug,
        amountInInr: 0,
        free: true,
        couponCode: appliedCoupon?.code || null,
        offerId: appliedOffer?.id || null, offerTitle: appliedOffer?.title || null, originalAmount: appliedCoupon ? Number(notes.originalAmount) : (appliedOffer?.originalAmount ?? Number(amount)), discountAmount: appliedCoupon ? Number(notes.discountAmount || 0) : (appliedOffer?.discountAmount ?? 0),
        userId: verifiedUser.uid,
        userEmail: verifiedUser.email,
      });
      return NextResponse.json({ success: true, free: true, description, offer: appliedOffer, ...result });
    }

    // ── PAID — create a real Razorpay order for Checkout to open. ──
    // Razorpay credentials are intentionally checked only after the free
    // path above. A ₹0 item must remain usable even if Razorpay is not
    // configured in a preview/staging environment.
    const keys = getRazorpayKeys();
    if (!keys) {
      return NextResponse.json(
        { error: "Online payments are temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }
    const receipt = shortReceipt(receiptBase);
    const order = await createRazorpayOrder({
      amountInInr: amount as number,
      receipt,
      notes,
    });

    // Persist the server's intended purchase before the browser opens Checkout.
    // Verification later checks this record as an additional source of truth;
    // Razorpay remains authoritative for actual payment status.
    try {
      await db.collection("payment_orders").insertOne({
        razorpayOrderId: order.id,
        userId: verifiedUser.uid,
        userEmail: verifiedUser.email.trim().toLowerCase(),
        type,
        itemSlug: notes.itemSlug || null,
        slug: notes.slug || null,
        invoiceId: notes.invoiceId || null,
        amountInInr: Number(amount),
        amountPaise: Number(order.amount),
        currency: order.currency,
        couponCode: appliedCoupon?.code || null,
        offerId: appliedOffer?.id || null, offerTitle: appliedOffer?.title || null, originalAmount: appliedCoupon ? Number(notes.originalAmount) : (appliedOffer?.originalAmount ?? Number(amount)), discountAmount: appliedCoupon ? Number(notes.discountAmount || 0) : (appliedOffer?.discountAmount ?? 0),
        status: "created",
        createdAt: new Date().toISOString(),
      });
    } catch (recordError) {
      // Do not expose database internals. The order is not opened to the
      // customer if our authoritative server record could not be stored.
      console.error("Could not persist payment order:", recordError);
      return NextResponse.json({ error: "Could not prepare payment securely. Please try again." }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      free: false,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: keys.keyId,
      description,
      offer: appliedOffer,
      coupon: appliedCoupon,
    });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json({ error: error?.message || "Failed to create order." }, { status: 500 });
  }
}
