import crypto from "crypto";
import { cookies } from "next/headers";
import clientPromise from "@/lib/mongodb";

// NOTE: NEXTAUTH_SECRET must be set in the environment (.env.local / hosting
// provider secrets). There is intentionally no hardcoded fallback here —
// shipping a fallback secret in source control would let anyone who can
// read the repo forge a valid admin session token.
const SECRET = process.env.NEXTAUTH_SECRET;

if (!SECRET && process.env.NODE_ENV === "production") {
  // Do not crash the build/start when the secret is not configured yet.
  // A random per-process secret is used instead, so nobody can forge a
  // session token. Sessions simply will not survive a restart until
  // NEXTAUTH_SECRET is added in the hosting environment.
  console.warn("NEXTAUTH_SECRET is not set. Using a temporary random secret.");
}

const RESOLVED_SECRET =
  SECRET ||
  (process.env.NODE_ENV === "production"
    ? crypto.randomBytes(32).toString("hex")
    : "dev-only-insecure-secret-do-not-use-in-prod");

// ─────────────────────────────────────────────────────────────────────
// Admin permission system
//
//  - "superadmin": the master account, logged in via ADMIN_USER / ADMIN_PASS
//    (your hosting env vars). Always has full access to every module.
//  - "custom": a sub-account created from the Admin Accounts panel itself
//    (stored in MongoDB — no env vars / hosting dashboard needed). Only has
//    access to the specific modules (Blogs, Portfolio, Analytics, etc.)
//    the super admin ticked when creating it. A custom account can also be
//    given every module, which behaves like full access to the panel — but
//    it still can NOT create/delete other admin accounts. Only the true
//    superadmin (env var login) can manage logins, so nobody can escalate
//    their own access.
// ─────────────────────────────────────────────────────────────────────

// Every manageable section of the admin panel. Keep these ids identical to
// the `id` used for each item in AdminView's NAV_GROUPS so permissions map
// 1:1 with what shows up in the sidebar.
export const ADMIN_MODULES = [
  "analytics",
  "activityLog",
  "clients",
  "registeredUsers",
  "leads",
  "projects",
  "drawings",
  "invoices",
  "paymentSetup",
  "paymentOffers",
  "paymentHistory",
  "tickets",
  "publicChat",
  "community",
  "blogs",
  "portfolio",
  "services",
  "pricing",
  "notifications",
  "mentorship",
  "softwareCourses",
  "studyMaterials",
  "careers",
  "teamMembers",
  "vendors",
  "vendorLeads",
  "websiteContent",
  "websiteNavigation",
] as const;

export type AdminModule = typeof ADMIN_MODULES[number];

export function isAdminModule(value: string): value is AdminModule {
  return (ADMIN_MODULES as readonly string[]).includes(value);
}

export type AdminRole = "superadmin" | "custom";

export const ADMIN_SESSION_TTL_MS = 60 * 60 * 1000; // exactly 1 hour

export interface AdminSessionPayload {
  role: AdminRole;
  username?: string;
  permissions?: AdminModule[];
  exp: number;
}

export function signAdminToken(payload: AdminSessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = crypto
    .createHmac("sha256", RESOLVED_SECRET)
    .update(data)
    .digest("hex");
  return `${data}.${signature}`;
}

function decodeAdminToken(token: string): AdminSessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [data, signature] = parts;

    const expectedSignature = crypto
      .createHmac("sha256", RESOLVED_SECRET)
      .update(data)
      .digest("hex");

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(data, "base64").toString("utf-8")) as AdminSessionPayload;

    if (payload.role !== "superadmin" && payload.role !== "custom") return null;
    if (!payload.exp || payload.exp < Date.now()) return null;
    if (payload.role === "custom" && !Array.isArray(payload.permissions)) return null;

    return payload;
  } catch {
    return null;
  }
}

export function verifyAdminToken(token: string): boolean {
  return decodeAdminToken(token) !== null;
}

// Returns the full session (role + username + permissions) or null if not
// logged in / expired / tampered with.
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("cah_admin_session");
  if (!sessionCookie) return null;

  const session = decodeAdminToken(sessionCookie.value);
  if (!session) return null;

  // Custom-admin permissions are re-read from MongoDB on every authenticated
  // request. The signed cookie is still the authentication proof, but live
  // account state is the authorization source of truth. This means deleting
  // a sub-admin, disabling it, or removing a module takes effect immediately
  // instead of waiting for the one-hour token to expire. Existing accounts
  // without a `disabled` field remain active for backwards compatibility.
  if (session.role === "custom") {
    if (!session.username) return null;
    try {
      const client = await clientPromise;
      const db = client.db(process.env.MONGODB_DB || "civil-at-hand");
      const account = await db.collection("admin_accounts").findOne(
        { username: session.username.trim().toLowerCase() },
        { projection: { permissions: 1, disabled: 1, role: 1, username: 1 } }
      );
      if (!account || account.role !== "custom" || account.disabled === true) return null;

      const permissions = Array.isArray(account.permissions)
        ? account.permissions.filter(isAdminModule)
        : [];
      return { ...session, permissions };
    } catch (error) {
      // Fail closed: an authorization-store outage must never turn into
      // accidental access to an admin panel.
      console.error("Admin session authorization lookup failed:", error);
      return null;
    }
  }

  return session;
}

// Super-admin only. This is the strictest check — used by sensitive routes
// like Admin Accounts management, site profile/settings, and diagnostics.
// A "custom" account, even one with every module ticked, never passes this.
export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await getAdminSession();
  return session?.role === "superadmin";
}

// Any logged-in admin, regardless of which modules they can see. Used by
// small shared utilities (like image upload) that many different panels
// rely on and that don't expose any sensitive data on their own.
export async function hasAnyAdminAccess(): Promise<boolean> {
  const session = await getAdminSession();
  return !!session;
}

// The main check: does the logged-in admin have access to this specific
// module (e.g. "blogs", "portfolio", "mentorship")? Superadmin always does.
// A "custom" account only does if that module was granted when their login
// was created.
export async function hasModuleAccess(moduleId: AdminModule): Promise<boolean> {
  const session = await getAdminSession();
  if (!session) return false;
  if (session.role === "superadmin") return true;
  const permissions = session.permissions as string[] | undefined;
  // Backward compatibility: accounts created before payment permissions were split
  // may still carry the legacy "payments" permission. Treat it as the three
  // payment capabilities, but never expose "payments" as a new selectable module.
  if (moduleId === "paymentSetup" || moduleId === "paymentOffers" || moduleId === "paymentHistory") {
    return !!permissions?.includes(moduleId) || !!permissions?.includes("payments");
  }
  return !!permissions?.includes(moduleId);
}
