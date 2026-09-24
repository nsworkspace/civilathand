import { Db } from "mongodb";
import { verifyFirebaseIdToken } from "@/lib/firebase-verify";
import { getCentralPaymentSeed } from "@/lib/centralPaymentCatalog";

export interface PaymentAccessResult {
  allowed: boolean;
  free: boolean;
  requiresAuth: boolean;
  user?: { uid: string; email: string | null } | null;
  reason?: string;
}

/**
 * Single server-side entitlement check used by protected features.
 * Every protected feature requires a verified Firebase account. Free items
 * require no payment; paid items additionally require a non-refunded payment
 * event belonging to that account.
 */
export async function checkPaymentAccess(
  db: Db,
  request: Request,
  itemSlug: string,
): Promise<PaymentAccessResult> {
  let item = await db.collection("payment_items").findOne({ slug: itemSlug });
  if (!item) {
    const seed = getCentralPaymentSeed(itemSlug);
    if (seed) {
      const now = new Date().toISOString();
      await db.collection("payment_items").updateOne(
        { slug: itemSlug },
        { $setOnInsert: { id: `pay-${itemSlug}`, ...seed, active: true, buttonLabel: "Pay Now", successMessage: "Access unlocked successfully.", purchaseCount: 0, createdAt: now, updatedAt: now } },
        { upsert: true },
      );
      item = await db.collection("payment_items").findOne({ slug: itemSlug });
    }
  }
  // A new calculator/test track can be protected by slug alone. Provision
  // its central Payment Center record lazily so the API and admin portal use
  // the same source of truth without a deployment-time migration.
  if (!item && itemSlug.startsWith("calculator-")) {
    const id = itemSlug.slice("calculator-".length);
    if (id && /^[a-z0-9-]+$/i.test(id)) {
      const title = id.split("-").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ") + " Calculator";
      const now = new Date().toISOString();
      await db.collection("payment_items").updateOne(
        { slug: itemSlug },
        {
          $setOnInsert: {
            id: `pay-${itemSlug}`,
            slug: itemSlug,
            title,
            description: `Payment access for the ${title}.`,
            category: "calculator",
            amount: 0,
            active: true,
            buttonLabel: "Use Calculator",
            successMessage: "Calculator access unlocked.",
            pageHint: id === "unit-converter" ? "/engineering-unit-converter" : id === "concrete" ? "/concrete-calculator" : `/calculators/${id}`,
            syncedFrom: { type: "calculator", id },
            purchaseCount: 0,
            createdAt: now,
            updatedAt: now,
          },
        },
        { upsert: true }
      );
      item = await db.collection("payment_items").findOne({ slug: itemSlug });
    }
  }

  if (!item) {
    return { allowed: false, free: false, requiresAuth: false, reason: "Payment item is not configured or is disabled." };
  }

  const amount = Number(item.amount) || 0;
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const user = await verifyFirebaseIdToken(token);

  // Every protected feature requires a verified account, even when the
  // current price is ₹0. Free means "no payment", not "anonymous access".
  if (!user?.uid || !user.email || !user.emailVerified) {
    return {
      allowed: false,
      free: amount === 0,
      requiresAuth: true,
      user: null,
      reason: amount === 0
        ? "Sign in with a verified email address to use this free feature."
        : "Sign in with a verified email address to access this paid feature.",
    };
  }

  const email = user.email.trim().toLowerCase();

  // Disabling an item stops new purchases/claims, but must not revoke access
  // from a customer who already paid. Paid entitlement is checked below.
  if (item.active === false && amount === 0) {
    return {
      allowed: false,
      free: true,
      requiresAuth: false,
      user: { uid: user.uid, email },
      reason: "This feature is temporarily unavailable.",
    };
  }

  if (amount === 0) {
    return { allowed: true, free: true, requiresAuth: false, user: { uid: user.uid, email } };
  }

  // A historical catalog-free claim must never become a paid entitlement
  // after an admin changes the item's price. Legitimate paid events and
  // fully-discounted coupon events remain valid entitlements.
  const payment = await db.collection("payment_events").findOne({
    itemSlug,
    refunded: { $ne: true },
    $and: [
      {
        $or: [
          { amount: { $gt: 0 }, free: { $ne: true }, razorpayPaymentId: { $type: "string" } },
          { amount: 0, free: true, $or: [{ couponCode: { $type: "string" } }, { offerId: { $type: "string" } }] },
        ],
      },
      {
        $or: [{ userId: user.uid }, { userEmail: email }],
      },
    ],
  });

  if (!payment) {
    return { allowed: false, free: false, requiresAuth: false, user: { uid: user.uid, email }, reason: "Payment required to access this feature." };
  }

  return { allowed: true, free: false, requiresAuth: false, user: { uid: user.uid, email } };
}
