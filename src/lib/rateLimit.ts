// ─────────────────────────────────────────────────────────────────────
// Minimal in-memory rate limiter for public, unauthenticated payment
// endpoints (create-order, verify-order). These routes are intentionally
// open to any visitor, so they're the one part of the payment system
// that needs its own abuse guard — otherwise a script could hammer
// /api/payments/create-order and spam your Razorpay account with
// thousands of orders, or brute-force verify-order.
//
// NOTE: this is per-server-instance memory, fine for a single Node
// server. If you later deploy across multiple instances/regions behind
// a load balancer, swap the Map below for Redis (e.g. Upstash) — the
// function signature stays identical so nothing else needs to change.
// ─────────────────────────────────────────────────────────────────────

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodically forget old buckets so this Map can't grow forever.
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 5 * 60 * 1000);
// Don't keep the Node process alive just for this timer.
(cleanupTimer as any).unref?.();

export function rateLimit(key: string, opts: { limit: number; windowMs: number }): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true, remaining: opts.limit - 1 };
  }

  if (existing.count >= opts.limit) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  return { allowed: true, remaining: opts.limit - existing.count };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
