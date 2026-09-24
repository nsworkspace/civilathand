import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import crypto from "crypto";
import { signAdminToken, isAdminModule, AdminModule, ADMIN_SESSION_TTL_MS } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { verifyPassword } from "@/lib/password";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────
// Basic in-memory brute-force throttle.
//
// This is intentionally simple: it blocks scripted password-guessing
// against the admin login endpoint from a single IP within a single
// server instance. It resets on redeploy/cold-start and isn't shared
// across multiple serverless instances — for a small business admin
// panel with one or two real users, that's an acceptable trade-off for
// zero extra infrastructure. If you outgrow it, swap this for a proper
// rate limiter backed by Redis/Upstash or your MongoDB instance.
// ─────────────────────────────────────────────────────────────────────
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const attemptsByIp = new Map<string, { count: number; windowStart: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attemptsByIp.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    attemptsByIp.set(ip, { count: 0, windowStart: now });
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const entry = attemptsByIp.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    attemptsByIp.set(ip, { count: 1, windowStart: now });
  } else {
    entry.count += 1;
  }
}

function clearAttempts(ip: string) {
  attemptsByIp.delete(ip);
}

// Constant-time string comparison — a plain `===` on credentials leaks
// timing information an attacker can use to guess the secret character
// by character. Both inputs are hashed to a fixed length first so
// timingSafeEqual never throws on a length mismatch (which would itself
// leak information via the exception path).
function safeEqual(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

// ─────────────────────────────────────────────────────────────────────
// Activity Log — fire-and-forget write to MongoDB on every successful
// login (super admin or sub-admin). Wrapped in its own try/catch so a
// Mongo hiccup never blocks or fails a legitimate login — worst case the
// login still succeeds and this one event is missing from the log.
// ─────────────────────────────────────────────────────────────────────
async function recordLogin(entry: {
  username: string;
  role: "superadmin" | "custom";
  ip: string;
  userAgent: string;
}) {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const now = new Date().toISOString();
    await db.collection("activity_logs").insertOne({
      ...entry,
      type: "login",
      action: "Signed in to Admin Control Center",
      module: "Authentication",
      eventType: "login",
      loggedInAt: now,
      createdAt: now,
    });
  } catch (err) {
    console.error("Failed to record activity log entry:", err);
  }
}

export async function POST(request: Request) {
  try {
    const headerStore = await headers();
    const ip =
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headerStore.get("x-real-ip") ||
      "unknown";
    const userAgent = headerStore.get("user-agent") || "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again in a few minutes." },
        { status: 429 }
      );
    }

    const { username, password } = await request.json();

    if (typeof username !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    // Admin credentials must come from environment variables. There is no
    // hardcoded fallback — shipping default credentials in source control
    // is a critical security risk once the repo is on GitHub.
    const rawUser = process.env.ADMIN_USER;
    const rawPass = process.env.ADMIN_PASS;

    if (!rawUser || !rawPass) {
      console.error("ADMIN_USER / ADMIN_PASS environment variables are not configured.");
      return NextResponse.json(
        { error: "Admin login is not configured on this server." },
        { status: 500 }
      );
    }

    // Multiple usernames with matching passwords by position

    const allowedUsers = rawUser
      .replace(/^['"]|['"]$/g, "")
      .split(",")
      .map(user => user.trim());

    const allowedPasswords = rawPass
      .replace(/^['"]|['"]$/g, "")
      .split(",")
      .map(pass => pass.trim());

    // Optional safety check
    if (allowedUsers.length !== allowedPasswords.length) {
      console.error(
        "ADMIN_USER and ADMIN_PASS must contain the same number of entries."
      );

      return NextResponse.json(
        { error: "Admin login configuration error." },
        { status: 500 }
      );
    }

    const userIndex = allowedUsers.findIndex(user =>
      safeEqual(username, user)
    );

    const userMatches = userIndex !== -1;

    const passMatches =
      userIndex !== -1 &&
      safeEqual(password, allowedPasswords[userIndex]);
    if (userMatches && passMatches) {
      clearAttempts(ip);

      const payload = {
        role: "superadmin" as const,
        username,
        exp: Date.now() + ADMIN_SESSION_TTL_MS, // exactly 1 hour
      };

      const token = signAdminToken(payload);

      const cookieStore = await cookies();
      cookieStore.set("cah_admin_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60, // exactly 1 hour
        path: "/",
      });

      // Await the audit write so the login event is reliably persisted on serverless runtimes.
      await recordLogin({ username, role: "superadmin", ip, userAgent });

      return NextResponse.json({ success: true, role: "superadmin" });
    }

    // ───────────────────────────────────────────────────────────────
    // Not a super admin — check sub-admin accounts created from the
    // Admin Accounts panel (stored in MongoDB, no env vars needed).
    // ───────────────────────────────────────────────────────────────
    try {
      const client = await clientPromise;
      const db = client.db(dbName);
      const account = await db
        .collection("admin_accounts")
        .findOne({ username: username.trim().toLowerCase() });

      if (account && account.disabled !== true && verifyPassword(password, account.password)) {
        clearAttempts(ip);

        // Legacy accounts created before granular permissions existed were
        // stored as role "blog_editor" with no permissions array — treat
        // those as blogs-only so nothing breaks for anyone already created.
        const rawPermissions: string[] = Array.isArray(account.permissions)
          ? account.permissions
          : account.role === "blog_editor"
          ? ["blogs"]
          : [];
        const permissions: AdminModule[] = rawPermissions.filter(isAdminModule);

        const payload = {
          role: "custom" as const,
          username: account.username,
          permissions,
          exp: Date.now() + ADMIN_SESSION_TTL_MS, // exactly 1 hour
        };

        const token = signAdminToken(payload);

        await db.collection("admin_accounts").updateOne(
          { _id: account._id },
          { $set: { lastLoginAt: new Date().toISOString(), lastLoginIp: ip } }
        );

        const cookieStore = await cookies();
        cookieStore.set("cah_admin_session", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 60 * 60,
          path: "/",
        });

        // Await the audit write so serverless runtimes do not terminate it after the response.
        await recordLogin({ username: account.username, role: "custom", ip, userAgent });
        const loginLoggedAt = new Date().toISOString();
        await db.collection("admin_accounts").updateOne(
          { _id: account._id },
          { $set: { lastActivityAt: loginLoggedAt } }
        );

        return NextResponse.json({ success: true, role: "custom", permissions });
      }
    } catch (subAdminError) {
      console.error("Sub-admin login lookup failed:", subAdminError);
    }

    recordFailedAttempt(ip);
    return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
