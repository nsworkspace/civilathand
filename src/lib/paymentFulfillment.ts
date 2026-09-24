import { Db } from "mongodb";
import crypto from "crypto";

// ─────────────────────────────────────────────────────────────────────
// Single place that marks a purchase as "paid" and updates the right
// MongoDB collection, used by THREE places, all of which must ever only
// produce one identical record per real-world payment:
//   - src/app/api/payments/create-order/route.ts  (₹0 / free items — no
//     Razorpay call needed, but we still want the exact same records)
//   - src/app/api/payments/verify-order/route.ts   (client-side, right
//     after the Checkout modal closes)
//   - src/app/api/payments/webhook/route.ts        (Razorpay's own
//     server-to-server webhook — the reliable fallback for when a user
//     closes their browser before the client-side call fires)
//
// Because verify-order AND the webhook can both fire for the same
// payment (by design — belt and suspenders), this function is
// idempotent: if a razorpayPaymentId has already been recorded, it
// returns the existing result instead of double-crediting anything.
// ─────────────────────────────────────────────────────────────────────

export type FulfillType = "course" | "mentorship" | "invoice" | "custom";

export interface FulfillParams {
  type: FulfillType;
  slug?: string;
  invoiceId?: string;
  itemSlug?: string;
  amountInInr: number;
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
  free: boolean;
  /** Coupon code applied to this order, if any — stored on the event for the admin Payments feed. */
  couponCode?: string | null;
  offerId?: string | null;
  offerTitle?: string | null;
  originalAmount?: number | null;
  discountAmount?: number | null;
  /** The signed-in buyer — every self-serve purchase requires sign-in, so Admin → Payments can show who bought what. Null only for invoice (client-billing) payments. */
  userId?: string | null;
  userEmail?: string | null;
  payerName?: string | null;
  payerContact?: string | null;
  /** Short-lived browser entitlement for anonymous purchases (never shown to admins). */
  accessToken?: string | null;
}

export interface FulfillResult {
  kind: FulfillType;
  paid: true;
  updated: boolean;
  alreadyProcessed?: boolean;
  title?: string;
  invoice?: any;
  itemSlug?: string;
  error?: string;
  accessToken?: string | null;
}

let paymentIndexesPromise: Promise<void> | null = null;

/**
 * Razorpay payment IDs are the only values that must be unique.
 *
 * IMPORTANT: MongoDB's sparse unique index still indexes an explicit `null`
 * value. Older versions of this app wrote `razorpayPaymentId: null` for free
 * and manual events, which caused:
 *   E11000 ... uniq_razorpay_payment_id dup key: { razorpayPaymentId: null }
 *
 * We therefore use a partial unique index that only indexes real, non-empty
 * string payment IDs. On first use we also migrate the old index (same name)
 * if it has the wrong definition.
 */
export async function ensurePaymentEventIndexes(db: Db) {
  if (!paymentIndexesPromise) {
    paymentIndexesPromise = (async () => {
      const collection = db.collection("payment_events");
      const indexes = await collection.listIndexes().toArray();
      const existing = indexes.find((index: any) => index.name === "uniq_razorpay_payment_id");
      const paymentIdIndexes = indexes.filter((index: any) =>
        index.name !== "_id_" &&
        index.key &&
        Object.keys(index.key).length === 1 &&
        index.key.razorpayPaymentId === 1
      );

      const hasCorrectDefinition =
        !!existing &&
        existing.unique === true &&
        !!existing.partialFilterExpression &&
        existing.partialFilterExpression.razorpayPaymentId?.$type === "string" &&
        paymentIdIndexes.length === 1;

      // Older deployments may have created the same key under a generated
      // name such as razorpayPaymentId_1. Remove every legacy index on this
      // field before creating the single canonical partial unique index.
      if (!hasCorrectDefinition) {
        for (const index of paymentIdIndexes) {
          if (index.name && index.name !== "_id_") {
            await collection.dropIndex(index.name);
          }
        }
      }

      // If a broken historical index is being replaced, clean up duplicate
      // real Razorpay IDs before rebuilding the unique constraint. This is
      // limited to exact duplicate payment IDs; legitimate manual/free
      // records are untouched.
      if (paymentIdIndexes.length > 0 && !hasCorrectDefinition) {
        const duplicates = await collection.aggregate([
          {
            $match: {
              razorpayPaymentId: { $type: "string", $ne: "" },
            },
          },
          {
            $group: {
              _id: "$razorpayPaymentId",
              ids: { $push: "$_id" },
              count: { $sum: 1 },
            },
          },
          { $match: { count: { $gt: 1 } } },
        ]).toArray();

        for (const duplicate of duplicates as any[]) {
          const ids = duplicate.ids.slice(1);
          if (ids.length) {
            await collection.deleteMany({ _id: { $in: ids } });
          }
        }
      }

      if (!hasCorrectDefinition) {
        await collection.createIndex(
          { razorpayPaymentId: 1 },
          {
            unique: true,
            name: "uniq_razorpay_payment_id",
            partialFilterExpression: { razorpayPaymentId: { $type: "string" } },
          }
        );
      }
    })().catch((error) => {
      paymentIndexesPromise = null;
      console.error("Could not ensure payment idempotency index:", error);
      throw error;
    });
  }
  await paymentIndexesPromise;
}

async function insertPaymentEvent(db: Db, doc: Record<string, any>): Promise<boolean> {
  // Never persist explicit null Razorpay IDs. This keeps free/manual events
  // completely outside the idempotency index and makes legacy data safe.
  const cleanDoc = { ...doc };
  if (!cleanDoc.razorpayPaymentId) delete cleanDoc.razorpayPaymentId;
  if (!cleanDoc.razorpayOrderId) delete cleanDoc.razorpayOrderId;

  try {
    // The MongoDB _id itself is the final idempotency guard. This remains
    // reliable even when a legacy razorpayPaymentId index cannot be repaired.
    if (cleanDoc.razorpayPaymentId) {
      cleanDoc._id = `razorpay:${cleanDoc.razorpayPaymentId}`;
    }
    await db.collection("payment_events").insertOne(cleanDoc);
    return true;
  } catch (error: any) {
    if (error?.code === 11000 && cleanDoc.razorpayPaymentId) return false;
    throw error;
  }
}

async function markOfferUsed(db: Db, offerId: string | null, inserted: boolean) {
  if (!offerId || !inserted) return;
  try { await db.collection("payment_offers").updateOne({ id: offerId }, { $inc: { usedCount: 1 }, $set: { lastUsedAt: new Date().toISOString() } }); }
  catch (error) { console.error("Non-fatal: failed to update offer usage:", error); }
}

async function markCouponUsed(db: Db, couponCode: string | null, inserted: boolean) {
  if (!couponCode || !inserted) return;
  try {
    await db.collection("payment_coupons").updateOne(
      { code: String(couponCode).trim().toUpperCase() },
      { $inc: { usedCount: 1 }, $set: { lastUsedAt: new Date().toISOString() } }
    );
  } catch (error) {
    console.error("Non-fatal: failed to update coupon usage:", error);
  }
}

export async function fulfillPayment(db: Db, params: FulfillParams): Promise<FulfillResult> {
  // Index maintenance is best-effort. A legacy MongoDB index must never
  // turn a successful, captured payment into a browser verification failure.
  try {
    await ensurePaymentEventIndexes(db);
  } catch (error) {
    console.error("Non-fatal: payment-event index maintenance failed:", error);
    paymentIndexesPromise = null;
  }
  const paidAt = new Date().toISOString();
  const { type, razorpayPaymentId = null, razorpayOrderId = null, free, amountInInr, couponCode = null, offerId = null, offerTitle = null, originalAmount = null, discountAmount = 0, userId = null, userEmail: rawUserEmail = null, payerName = null, payerContact = null } = params;
  const userEmail = rawUserEmail?.trim().toLowerCase() || null;
  const eventId = `evt-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const accessToken = params.accessToken || (!params.userId && type !== "invoice" ? crypto.randomBytes(32).toString("hex") : null);

  // ── Idempotency guard ──
  if (razorpayPaymentId) {
    const existingEvent = await db.collection("payment_events").findOne({ razorpayPaymentId });
    if (existingEvent) {
      return {
        kind: type,
        paid: true,
        updated: true,
        alreadyProcessed: true,
        title: (existingEvent as any).title || (existingEvent as any).itemTitle,
        itemSlug: (existingEvent as any).itemSlug,
        accessToken: (existingEvent as any).accessToken || null,
      };
    }
    if (type === "invoice") {
      const existingInvoice = await db.collection("invoices").findOne({ id: params.invoiceId, razorpayPaymentId });
      if (existingInvoice) {
        const { _id, ...formatted } = existingInvoice as any;
        return { kind: "invoice", paid: true, updated: true, alreadyProcessed: true, invoice: formatted };
      }
    }
  }

  if (type === "invoice") {
    const invoiceId = params.invoiceId;
    if (!invoiceId) return { kind: "invoice", paid: true, updated: false, error: "Missing invoiceId." };

    // Only transition an unpaid invoice → paid, never re-touch an already
    // paid one (guards a rare race where two requests land at once).
    const invoice = await db.collection("invoices").findOneAndUpdate(
      { id: invoiceId, status: { $ne: "Paid" } },
      { $set: { status: "Paid", razorpayPaymentId, razorpayOrderId, paidAt } },
      { returnDocument: "after" }
    );

    if (!invoice) {
      const already = await db.collection("invoices").findOne({ id: invoiceId, status: "Paid" });
      if (already) {
        const { _id, ...formatted } = already as any;
        return { kind: "invoice", paid: true, updated: true, alreadyProcessed: true, invoice: formatted };
      }
      return { kind: "invoice", paid: true, updated: false, error: "Payment verified but no matching invoice was found." };
    }

    try {
      await db.collection("projects").updateOne({ id: (invoice as any).projectId }, { $set: { invoicePaid: true } });
    } catch (e) {
      console.error("Non-fatal: failed to update project invoicePaid flag:", e);
    }

    const inserted = await insertPaymentEvent(db, {
      id: eventId,
      couponCode,
      offerId,
      offerTitle,
      originalAmount: originalAmount ?? amountInInr,
      discountAmount: discountAmount || 0,
      userId,
      userEmail,
      payerName,
      payerContact,
      kind: "invoice",
      invoiceId,
      amount: amountInInr,
      free,
      razorpayPaymentId,
      razorpayOrderId,
      paidAt,
    });
    if (!inserted && razorpayPaymentId) {
      const { _id, ...formatted } = invoice as any;
      return { kind: "invoice", paid: true, updated: true, alreadyProcessed: true, invoice: formatted };
    }

    await markOfferUsed(db, offerId, inserted);
    await markCouponUsed(db, couponCode, inserted);
    const { _id, ...formatted } = invoice as any;
    return { kind: "invoice", paid: true, updated: true, invoice: formatted };
  }

  if (type === "course") {
    const slug = params.slug;
    if (!slug) return { kind: "course", paid: true, updated: false, error: "Missing course slug." };
    const course = await db.collection("software_courses").findOne({ slug, source: "admin" });
    const title = course?.name || course?.title || slug;
    const inserted = await insertPaymentEvent(db, {
      id: eventId,
      couponCode,
      offerId,
      offerTitle,
      originalAmount: originalAmount ?? amountInInr,
      discountAmount: discountAmount || 0,
      userId,
      userEmail,
      payerName,
      payerContact,
      accessToken,
      kind: "course",
      slug,
      itemSlug: params.itemSlug || `course-${slug}`,
      title,
      amount: amountInInr,
      free,
      razorpayPaymentId,
      razorpayOrderId,
      paidAt,
    });
    if (!inserted && razorpayPaymentId) return { kind: "course", paid: true, updated: true, alreadyProcessed: true, title };
    await markOfferUsed(db, offerId, inserted);
    await markCouponUsed(db, couponCode, inserted);
    try {
      await db.collection("payment_items").updateOne(
        { slug: params.itemSlug || `course-${slug}` },
        { $inc: { purchaseCount: 1 }, $set: { lastPurchasedAt: paidAt } }
      );
    } catch (counterError) {
      // The payment event above is the entitlement source of truth.
      // Analytics counters must never turn a successful payment into a
      // false "verification failed" response.
      console.error("Non-fatal: failed to update course purchase counter:", counterError);
    }
    return { kind: "course", paid: true, updated: true, title, accessToken };
  }

  if (type === "mentorship") {
    const item = await db.collection("payment_items").findOne({ slug: params.itemSlug || "mentorship-program" });
    const title = item?.title || "1:1 Mentorship Program";
    const inserted = await insertPaymentEvent(db, {
      id: eventId,
      couponCode,
      offerId,
      offerTitle,
      originalAmount: originalAmount ?? amountInInr,
      discountAmount: discountAmount || 0,
      userId,
      userEmail,
      payerName,
      payerContact,
      accessToken,
      kind: "mentorship",
      itemSlug: params.itemSlug || "mentorship-program",
      title,
      amount: amountInInr,
      free,
      razorpayPaymentId,
      razorpayOrderId,
      paidAt,
    });
    if (!inserted && razorpayPaymentId) return { kind: "mentorship", paid: true, updated: true, alreadyProcessed: true, title };
    await markOfferUsed(db, offerId, inserted);
    await markCouponUsed(db, couponCode, inserted);
    try {
      await db.collection("payment_items").updateOne(
        { slug: params.itemSlug || "mentorship-program" },
        { $inc: { purchaseCount: 1 }, $set: { lastPurchasedAt: paidAt } }
      );
    } catch (counterError) {
      console.error("Non-fatal: failed to update mentorship purchase counter:", counterError);
    }
    return { kind: "mentorship", paid: true, updated: true, title, accessToken };
  }

  if (type === "custom") {
    const itemSlug = params.itemSlug;
    if (!itemSlug) return { kind: "custom", paid: true, updated: false, error: "Missing itemSlug." };
    const item = await db.collection("payment_items").findOne({ slug: itemSlug });
    const inserted = await insertPaymentEvent(db, {
      id: eventId,
      couponCode,
      offerId,
      offerTitle,
      originalAmount: originalAmount ?? amountInInr,
      discountAmount: discountAmount || 0,
      userId,
      userEmail,
      payerName,
      payerContact,
      accessToken,
      kind: "custom",
      itemSlug,
      itemTitle: item?.title || itemSlug,
      amount: amountInInr,
      free,
      razorpayPaymentId,
      razorpayOrderId,
      paidAt,
    });
    if (!inserted && razorpayPaymentId) return { kind: "custom", paid: true, updated: true, alreadyProcessed: true, itemSlug, title: item?.title || itemSlug };
    await markOfferUsed(db, offerId, inserted);
    await markCouponUsed(db, couponCode, inserted);
    if (item) {
      try {
        await db.collection("payment_items").updateOne(
          { slug: itemSlug },
          { $inc: { purchaseCount: 1 }, $set: { lastPurchasedAt: paidAt } }
        );
      } catch (counterError) {
        console.error("Non-fatal: failed to update custom payment counter:", counterError);
      }

      // Service payment requests are first-class client-portal payments.
      // This status update is a secondary projection; the payment event above
      // remains the authoritative entitlement record.
      if (item.syncedFrom?.type === "service-request" && item.syncedFrom?.id) {
        try {
          await db.collection("service_payment_requests").updateOne(
            { id: item.syncedFrom.id },
            {
              $set: {
                status: "Paid",
                paidAt,
                paymentId: razorpayPaymentId || null,
                razorpayOrderId: razorpayOrderId || null,
                updatedAt: paidAt,
              },
            }
          );
        } catch (serviceError) {
          console.error("Non-fatal: failed to update service payment request:", serviceError);
        }
      }
    }
    return { kind: "custom", paid: true, updated: true, itemSlug, title: item?.title || itemSlug, accessToken };
  }

  return { kind: type, paid: true, updated: false, error: "Unrecognized payment type." };
}
