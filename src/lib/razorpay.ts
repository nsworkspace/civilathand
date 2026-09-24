import crypto from "crypto";

// ─────────────────────────────────────────────────────────────────────
// Shared Razorpay helpers used by the Orders API checkout flow
// (src/app/api/payments/create-order + verify-order), the payment
// webhook (src/app/api/payments/webhook), and the older Payment Links
// flow (src/app/api/admin/payments/create-link).
//
// WHY ORDERS API INSTEAD OF PAYMENT LINKS / QR:
// Razorpay charges a lower fee on payments collected via the Orders API +
// Checkout ("standard checkout") than on Payment Links / QR codes. This
// file is the one place that talks to Razorpay's HTTP API, so switching
// products, retrying, and signature verification all stay consistent.
//
// SWITCHING RAZORPAY ACCOUNTS IN THE FUTURE:
// Everything here reads the key id/secret from environment variables.
// To move to a new Razorpay account, update these two variables in your
// hosting provider (e.g. Vercel → Project → Settings → Environment
// Variables) and redeploy — nothing in the code needs to change:
//   RAZORPAY_KEY_ID
//   RAZORPAY_KEY_SECRET
//   RAZORPAY_WEBHOOK_SECRET   (separate — set once in Razorpay Dashboard
//                              → Settings → Webhooks, see webhook route)
// ─────────────────────────────────────────────────────────────────────

export const MIN_AMOUNT_INR = 0; // 0 = free item, fulfilled without a Razorpay order
export const MAX_AMOUNT_INR = 1000000;

export function getRazorpayKeys(): { keyId: string; keySecret: string } | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

function authHeader(keyId: string, keySecret: string) {
  return "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
}

/**
 * Razorpay `receipt` values just need to be unique-ish and <= 40 chars —
 * unlike Payment Link reference_ids they don't need to be globally unique
 * forever, but we still keep them short + traceable.
 */
export function shortReceipt(base: string): string {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const maxBaseLen = Math.max(1, 40 - suffix.length - 1);
  return `${base.slice(0, maxBaseLen)}-${suffix}`.slice(0, 40);
}

export interface RazorpayOrder {
  id: string;
  amount: number; // paise
  currency: string;
  receipt?: string;
  status: string;
  notes?: Record<string, string>;
}


export interface RazorpayPayment {
  id: string;
  order_id?: string | null;
  amount: number;
  currency?: string;
  status?: string;
  email?: string | null;
  contact?: string | null;
  notes?: Record<string, string>;
}

/** Fetches a Razorpay payment server-side so the verified payer identity and
 * order relationship never have to come from browser-supplied data. */
export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPayment | null> {
  const keys = getRazorpayKeys();
  if (!keys || !paymentId) return null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
        headers: { Authorization: authHeader(keys.keyId, keys.keySecret) },
        cache: "no-store",
      });
      if (res.ok) return (await res.json()) as RazorpayPayment;
      if (res.status >= 500 && attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }
      return null;
    } catch (e) {
      if (attempt === 3) console.error("Failed to fetch Razorpay payment:", e);
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  return null;
}

/** Capture an authorized payment when automatic capture is not enabled.
 * The Orders API does not accept a `capture` field; capture is a separate
 * payment API operation. */
export async function captureRazorpayPayment(paymentId: string, amountInPaise: number): Promise<RazorpayPayment | null> {
  const keys = getRazorpayKeys();
  if (!keys || !paymentId || !Number.isFinite(amountInPaise) || amountInPaise <= 0) return null;
  try {
    const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader(keys.keyId, keys.keySecret) },
      body: JSON.stringify({ amount: Math.round(amountInPaise), currency: "INR" }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Razorpay capture failed:", data?.error?.description || res.status);
      return null;
    }
    return data as RazorpayPayment;
  } catch (e) {
    console.error("Razorpay capture request failed:", e);
    return null;
  }
}

export interface RazorpayPaymentLink {
  id: string;
  amount: number; // paise
  amount_paid?: number;
  currency?: string;
  status: string;
  order_id?: string | null;
  reference_id?: string;
  notes?: Record<string, string>;
  short_url?: string;
  customer?: { name?: string; email?: string; contact?: string };
}

export async function createRazorpayOrder(params: {
  amountInInr: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const keys = getRazorpayKeys();
  if (!keys) {
    throw new Error(
      "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your hosting's environment variables."
    );
  }

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader(keys.keyId, keys.keySecret) },
    body: JSON.stringify({
      amount: Math.round(params.amountInInr * 100),
      currency: "INR",
      receipt: params.receipt,
      notes: params.notes || {},
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const message: string = data?.error?.description || "Failed to create Razorpay order.";
    throw new Error(message);
  }
  return data as RazorpayOrder;
}

// Fetches an order back from Razorpay — the authoritative source for both
// the amount actually paid and (via `notes`) what it was for. Used by
// verify-order and the webhook so neither ever has to trust the client's
// request body for what to fulfill.
export async function fetchRazorpayOrder(orderId: string): Promise<RazorpayOrder | null> {
  const keys = getRazorpayKeys();
  if (!keys || !orderId) return null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const res = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, {
        headers: { Authorization: authHeader(keys.keyId, keys.keySecret) },
        cache: "no-store",
      });
      if (res.ok) return (await res.json()) as RazorpayOrder;
      if (res.status >= 500 && attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }
      return null;
    } catch (e) {
      if (attempt === 3) console.error("Failed to fetch Razorpay order:", e);
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  return null;
}

/** Fetches a Payment Link from Razorpay so callback verification can use the
 * server-side link record (including notes and amount) instead of trusting
 * query-string metadata alone. */
export async function fetchRazorpayPaymentLink(paymentLinkId: string): Promise<RazorpayPaymentLink | null> {
  const keys = getRazorpayKeys();
  if (!keys || !paymentLinkId) return null;
  try {
    const res = await fetch(`https://api.razorpay.com/v1/payment_links/${encodeURIComponent(paymentLinkId)}`, {
      headers: { Authorization: authHeader(keys.keyId, keys.keySecret) },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as RazorpayPaymentLink;
  } catch (e) {
    console.error("Failed to fetch Razorpay payment link:", e);
    return null;
  }
}

// Issues a full or partial refund for a captured payment. Amount is
// optional — omit it for a full refund of whatever was actually paid.
export async function refundRazorpayPayment(params: {
  paymentId: string;
  amountInInr?: number;
  notes?: Record<string, string>;
}): Promise<{ id: string; status: string; amount: number }> {
  const keys = getRazorpayKeys();
  if (!keys) {
    throw new Error("Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your hosting's environment variables.");
  }
  const body: Record<string, any> = { notes: params.notes || {} };
  if (typeof params.amountInInr === "number" && params.amountInInr > 0) {
    body.amount = Math.round(params.amountInInr * 100);
  }
  const res = await fetch(`https://api.razorpay.com/v1/payments/${params.paymentId}/refund`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader(keys.keyId, keys.keySecret) },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const message: string = data?.error?.description || "Failed to issue Razorpay refund.";
    throw new Error(message);
  }
  return { id: data.id, status: data.status, amount: (data.amount || 0) / 100 };
}

function safeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/** Verifies the HMAC-SHA256 signature Razorpay Checkout returns after a successful Orders-API payment. */
export function verifyOrderSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const keys = getRazorpayKeys();
  if (!keys) return false;
  if (!params.orderId || !params.paymentId || !params.signature) return false;
  const payload = `${params.orderId}|${params.paymentId}`;
  const expected = crypto.createHmac("sha256", keys.keySecret).update(payload).digest("hex");
  return safeEqual(expected, params.signature);
}

// Verifies a raw webhook payload really came from Razorpay:
// HMAC-SHA256(rawBody, webhook_secret) must equal the
// X-Razorpay-Signature header. IMPORTANT: must be computed over the exact
// raw request bytes, not a reserialized JSON.stringify(JSON.parse(body)),
// which can differ (key order/spacing) and fail verification even for a
// genuine event.
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqual(expected, signatureHeader);
}

export function isValidInrAmount(amount: unknown): amount is number {
  const n = Number(amount);
  return Number.isFinite(n) && n >= MIN_AMOUNT_INR && n <= MAX_AMOUNT_INR;
}
