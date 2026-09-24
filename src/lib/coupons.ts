import { Db } from "mongodb";

export interface CouponCheckResult {
  valid: boolean;
  error?: string;
  code?: string;
  type?: "percent" | "flat";
  value?: number;
  discountedAmount?: number;
  discountAmount?: number;
}

/**
 * Validates a coupon code against a given category ("course" | "mentorship" | "custom") and base amount, returning the discounted
 * price. Used by BOTH the public preview endpoint (so the checkout UI
 * can show the discount before paying) and create-order (which always
 * re-validates server-side — never trusts a client-supplied discount).
 */
export async function checkCoupon(db: Db, codeRaw: string, category: string, baseAmount: number): Promise<CouponCheckResult> {
  const code = String(codeRaw || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!code) return { valid: false, error: "Enter a coupon code." };

  const coupon = await db.collection("payment_coupons").findOne({ code });
  if (!coupon || coupon.active === false) {
    return { valid: false, error: "This coupon code is not valid." };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return { valid: false, error: "This coupon has expired." };
  }
  if (typeof coupon.maxUses === "number" && coupon.maxUses > 0 && (coupon.usedCount || 0) >= coupon.maxUses) {
    return { valid: false, error: "This coupon has reached its usage limit." };
  }
  const appliesTo: string[] = Array.isArray(coupon.appliesTo) ? coupon.appliesTo : ["all"];
  if (!appliesTo.includes("all") && !appliesTo.includes(category)) {
    return { valid: false, error: "This coupon does not apply to this item." };
  }
  if (coupon.minAmount && baseAmount < coupon.minAmount) {
    return { valid: false, error: `This coupon requires a minimum amount of ₹${coupon.minAmount.toLocaleString("en-IN")}.` };
  }

  let discountAmount = 0;
  if (coupon.type === "percent") {
    discountAmount = Math.round((baseAmount * Number(coupon.value)) / 100);
  } else {
    discountAmount = Math.round(Number(coupon.value));
  }
  discountAmount = Math.max(0, Math.min(discountAmount, baseAmount));
  const discountedAmount = Math.max(0, baseAmount - discountAmount);

  return {
    valid: true,
    code,
    type: coupon.type,
    value: coupon.value,
    discountAmount,
    discountedAmount,
  };
}

/** Bumps a coupon's usedCount by 1 — call only once fulfillment actually succeeds. */
export async function recordCouponUse(db: Db, code: string) {
  if (!code) return;
  await db.collection("payment_coupons").updateOne(
    { code: String(code).trim().toUpperCase() },
    { $inc: { usedCount: 1 } }
  );
}
