import crypto from "crypto";
import { cookies } from "next/headers";

// ─────────────────────────────────────────────────────────────────────
// This replaces the old client-side gate, which compared the typed key
// against `NEXT_PUBLIC_PRIVATE_PAGE_PASSWORD` *in the browser*. Any
// NEXT_PUBLIC_ variable ships in plain text inside your JS bundle — so the
// old password was readable by anyone who opened dev tools, no unlocking
// required. That variable should be considered burned; set a brand-new
// value for PRIVATE_PAGE_PASSWORD below (server-only, no NEXT_PUBLIC_
// prefix) and remove the old NEXT_PUBLIC_PRIVATE_PAGE_PASSWORD entirely.
// ─────────────────────────────────────────────────────────────────────

const PASSWORD = process.env.PRIVATE_PAGE_PASSWORD;
const SECRET = process.env.NEXTAUTH_SECRET;
const COOKIE_NAME = "cah_private_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

if (!PASSWORD && process.env.NODE_ENV === "production") {
  // Fail loudly rather than silently leave the private pad unlocked/broken.
  // eslint-disable-next-line no-console
  console.error(
    "PRIVATE_PAGE_PASSWORD is not set. /private will refuse all logins until it is."
  );
}

function resolvedSecret(): string {
  return SECRET || "dev-only-insecure-secret-do-not-use-in-prod";
}

function sign(data: string): string {
  return crypto.createHmac("sha256", resolvedSecret()).update(data).digest("hex");
}

/** Constant-time string compare so failed logins can't be timed to guess the password character-by-character. */
function timingSafeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    // Still run a comparison of equal length to avoid leaking length via timing.
    crypto.timingSafeEqual(aBuf, aBuf);
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

// ─────────────────────────────────────────────────────────────────────
// Very small in-memory brute-force throttle. Good enough to stop a naive
// password-guessing script; it resets when the serverless function cold
// starts, so it is a speed bump, not a guarantee — the real protection is
// a strong, unique PRIVATE_PAGE_PASSWORD plus the timing-safe compare above.
// ─────────────────────────────────────────────────────────────────────
const attempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

export function isLocked(ip: string): boolean {
  const rec = attempts.get(ip);
  return !!rec && rec.lockedUntil > Date.now();
}

export function recordFailedAttempt(ip: string): void {
  const rec = attempts.get(ip) || { count: 0, lockedUntil: 0 };
  rec.count += 1;
  if (rec.count >= MAX_ATTEMPTS) {
    rec.lockedUntil = Date.now() + LOCKOUT_MS;
    rec.count = 0;
  }
  attempts.set(ip, rec);
}

export function clearAttempts(ip: string): void {
  attempts.delete(ip);
}

export function checkPassword(candidate: string): boolean {
  if (!PASSWORD) return false;
  return timingSafeEqual(candidate, PASSWORD);
}

export function createSessionToken(): string {
  const exp = Date.now() + SESSION_TTL_MS;
  const data = Buffer.from(JSON.stringify({ exp })).toString("base64");
  return `${data}.${sign(data)}`;
}

function verifySessionToken(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [data, signature] = parts;
  if (sign(data) !== signature) return false;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export async function getPrivateSessionCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME);
}

export async function isPrivateSessionValid(): Promise<boolean> {
  const cookie = await getPrivateSessionCookie();
  if (!cookie) return false;
  return verifySessionToken(cookie.value);
}

export const PRIVATE_SESSION_COOKIE_NAME = COOKIE_NAME;
export const PRIVATE_SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000;
