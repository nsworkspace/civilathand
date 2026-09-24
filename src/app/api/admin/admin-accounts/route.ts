import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getAdminSession, isAdminAuthenticated, isAdminModule, ADMIN_MODULES, AdminModule } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

function normalizePermissions(values: unknown): AdminModule[] {
  const raw = Array.isArray(values) ? values.filter((v): v is string => typeof v === "string") : [];
  const expanded = raw.flatMap((value) => value === "payments"
    ? ["paymentSetup", "paymentOffers", "paymentHistory"]
    : [value]);
  return Array.from(new Set(expanded.filter(isAdminModule))) as AdminModule[];
}

// ─────────────────────────────────────────────────────────────────────
// Admin Accounts (sub-admins) — create a login for a teammate and pick
// exactly which sections of the admin panel they can use (Blogs, Portfolio,
// Analytics, Leads... any combination), or grant every module for full
// access. Only the true super admin (env var login) can view/create/delete
// these — a custom account can never manage other logins, even with every
// module ticked. Everything lives in MongoDB — no Vercel / Atlas dashboard
// editing needed after this is deployed once.
// ─────────────────────────────────────────────────────────────────────

// GET /api/admin/admin-accounts — list all sub-admin accounts (super admin only)
export async function GET() {
  try {
    const authorized = await isAdminAuthenticated();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const accounts = await db
      .collection("admin_accounts")
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    const usernames = accounts.map((account) => account.username).filter(Boolean);
    const activityRows = usernames.length
      ? await db.collection("activity_logs").aggregate([
          { $match: { username: { $in: usernames } } },
          { $sort: { createdAt: -1, loggedInAt: -1 } },
          { $group: {
              _id: "$username",
              activityCount: { $sum: 1 },
              lastActivityAt: { $first: { $ifNull: ["$createdAt", "$loggedInAt"] } },
              lastLoginAt: { $max: "$loggedInAt" },
            } },
        ]).toArray()
      : [];
    const activityByUsername = new Map(activityRows.map((row: any) => [row._id, row]));

    const formatted = accounts.map(({ _id, ...rest }) => {
      const activity = activityByUsername.get(rest.username);
      return {
        id: _id.toString(),
        ...rest,
        permissions: normalizePermissions(Array.isArray(rest.permissions) ? rest.permissions : rest.role === "blog_editor" ? ["blogs"] : []),
        lastLoginAt: rest.lastLoginAt ?? activity?.lastLoginAt ?? null,
        lastActivityAt: activity?.lastActivityAt ?? rest.lastActivityAt ?? null,
        activityCount: activity?.activityCount ?? 0,
      };
    });

    return NextResponse.json({ success: true, accounts: formatted, availableModules: ADMIN_MODULES });
  } catch (error) {
    console.error("Error fetching admin accounts:", error);
    return NextResponse.json({ error: "Failed to fetch admin accounts" }, { status: 500 });
  }
}

// POST /api/admin/admin-accounts — create a new sub-admin login (super admin only)
export async function POST(request: Request) {
  try {
    const authorized = await isAdminAuthenticated();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const rawUsername = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const fullAccess = body.fullAccess === true;
    const requestedPermissions: string[] = Array.isArray(body.permissions) ? body.permissions : [];

    if (!rawUsername || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const permissions: AdminModule[] = fullAccess
      ? [...ADMIN_MODULES]
      : normalizePermissions(requestedPermissions);

    if (permissions.length === 0) {
      return NextResponse.json({ error: "Select at least one section this login can access" }, { status: 400 });
    }

    const username = rawUsername.toLowerCase();

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("admin_accounts");

    const existing = await collection.findOne({ username });
    if (existing) {
      return NextResponse.json({ error: "That username already exists" }, { status: 409 });
    }

    const account = {
      username,
      password: hashPassword(password),
      role: "custom",
      permissions,
      label: typeof body.label === "string" ? body.label.trim() : "",
      disabled: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      lastActivityAt: null,
    };

    const result = await collection.insertOne(account);
    await db.collection("activity_logs").insertOne({
      username: (await getAdminSession())?.username || "superadmin",
      role: "superadmin",
      type: "action",
      action: "Created sub-admin account",
      module: "adminAccounts",
      target: username,
      summary: `Granted ${permissions.length} admin module${permissions.length === 1 ? "" : "s"}.`,
      createdAt: new Date().toISOString(),
    });
    const { password: _pw, ...safeAccount } = account;

    return NextResponse.json(
      { success: true, account: { id: result.insertedId.toString(), ...safeAccount } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating admin account:", error);
    return NextResponse.json({ error: "Failed to create admin account" }, { status: 500 });
  }
}

// PUT /api/admin/admin-accounts — update an existing sub-admin's permissions (super admin only)
export async function PUT(request: Request) {
  try {
    const authorized = await isAdminAuthenticated();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) {
      return NextResponse.json({ error: "Account id is required" }, { status: 400 });
    }

    const fullAccess = body.fullAccess === true;
    const requestedPermissions: string[] = Array.isArray(body.permissions) ? body.permissions : [];
    const permissions: AdminModule[] = fullAccess
      ? [...ADMIN_MODULES]
      : normalizePermissions(requestedPermissions);

    if (permissions.length === 0) {
      return NextResponse.json({ error: "Select at least one section this login can access" }, { status: 400 });
    }

    const { ObjectId } = await import("mongodb");
    const client = await clientPromise;
    const db = client.db(dbName);
    const result = await db
      .collection("admin_accounts")
      .updateOne({ _id: new ObjectId(id) }, { $set: { permissions, role: "custom" } });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    await db.collection("activity_logs").insertOne({
      username: (await getAdminSession())?.username || "superadmin",
      role: "superadmin",
      type: "action",
      action: "Updated sub-admin permissions",
      module: "adminAccounts",
      target: id,
      summary: `Permissions updated: ${permissions.join(", ")}`,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, permissions });
  } catch (error) {
    console.error("Error updating admin account:", error);
    return NextResponse.json({ error: "Failed to update admin account" }, { status: 500 });
  }
}

// DELETE /api/admin/admin-accounts?id=... — remove a sub-admin account (super admin only)
export async function DELETE(request: Request) {
  try {
    const authorized = await isAdminAuthenticated();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Account id is required" }, { status: 400 });
    }

    const { ObjectId } = await import("mongodb");
    const client = await clientPromise;
    const db = client.db(dbName);
    const result = await db.collection("admin_accounts").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    await db.collection("activity_logs").insertOne({
      username: (await getAdminSession())?.username || "superadmin",
      role: "superadmin",
      type: "action",
      action: "Deleted sub-admin account",
      module: "adminAccounts",
      target: id,
      summary: "Sub-admin login removed.",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting admin account:", error);
    return NextResponse.json({ error: "Failed to delete admin account" }, { status: 500 });
  }
}
