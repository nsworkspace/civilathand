// ============================================================
// Password hashing using Node's built-in crypto (scrypt).
// No extra package needed. PLACE AT: src/lib/password.ts
// Format stored in DB:  scrypt$<saltHex>$<hashHex>
// ============================================================

import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function isHashed(stored: string): boolean {
  return typeof stored === "string" && stored.startsWith("scrypt$");
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    if (!isHashed(stored)) {
      // Legacy plain-text password (older accounts) — compare directly.
      return password === stored;
    }
    const [, salt, hashHex] = stored.split("$");
    const hashBuf = Buffer.from(hashHex, "hex");
    const testBuf = scryptSync(password, salt, 64);
    return hashBuf.length === testBuf.length && timingSafeEqual(hashBuf, testBuf);
  } catch {
    return false;
  }
}
