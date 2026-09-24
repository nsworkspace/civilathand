import type { Db } from "mongodb";
import { verifyFirebaseIdToken } from "@/lib/firebase-verify";

export const VENDOR_REGISTRATION_SLUG = "vendor-registration";

export async function getVendorRegistrationAccess(db: Db, uid: string) {
  const paymentItem = await db.collection("payment_items").findOne({ slug: VENDOR_REGISTRATION_SLUG });
  if (!paymentItem) {
    return { allowed: false, configuredAmount: 0, paymentEvent: null, paymentItem: null, misconfigured: true };
  }
  const configuredAmount = Math.max(0, Number(paymentItem.amount || 0));

  if (paymentItem.active === false) {
    return { allowed: false, configuredAmount, paymentEvent: null, paymentItem, disabled: true };
  }

  if (configuredAmount === 0) {
    return { allowed: true, configuredAmount, paymentEvent: null, paymentItem };
  }

  const paymentEvent = await db.collection("payment_events").findOne(
    {
      itemSlug: VENDOR_REGISTRATION_SLUG,
      userId: uid,
      refunded: { $ne: true },
      $or: [
        { amount: { $gt: 0 }, free: { $ne: true } },
        { amount: 0, free: true, $or: [{ couponCode: { $type: "string" } }, { offerId: { $type: "string" } }] },
      ],
    },
    { sort: { paidAt: -1 } },
  );

  if (!paymentEvent) return { allowed: false, configuredAmount, paymentEvent: null, paymentItem };
  if (paymentEvent.vendorRegistrationId) return { allowed: false, configuredAmount, paymentEvent, paymentItem, alreadyUsed: true };

  return { allowed: true, configuredAmount, paymentEvent, paymentItem };
}

export async function requireVerifiedVendorUser(request: Request) {
  const header = request.headers.get("authorization") || request.headers.get("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : null;
  const user = await verifyFirebaseIdToken(token);
  if (!user?.uid || !user.email || !user.emailVerified) return null;
  return user;
}
