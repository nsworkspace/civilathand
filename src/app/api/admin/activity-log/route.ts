import { NextResponse } from "next/server";
import { headers } from "next/headers";
import clientPromise from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";
const LOG_LIMIT = 300;

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Super Admin can review the complete audit trail. Sub-admins can review
    // only their own events, which keeps IP/user-agent history private.
    const query = session.role === "superadmin"
      ? {}
      : { username: session.username };

    const client = await clientPromise;
    const db = client.db(dbName);
    const entries = await db.collection("activity_logs")
      .find(query)
      .sort({ createdAt: -1, loggedInAt: -1 })
      .limit(LOG_LIMIT)
      .toArray();
    const logs = entries.map(({ _id, ...rest }: any) => ({
      id: _id.toString(),
      username: rest.username ?? "unknown",
      role: rest.role === "superadmin" ? "superadmin" : "custom",
      type: rest.type ?? "login",
      action: rest.action ?? (rest.type === "login" ? "Logged in" : "Activity"),
      module: rest.module ?? "Admin",
      target: rest.target ?? "",
      summary: rest.summary ?? "",
      method: rest.method ?? "",
      path: rest.path ?? "",
      ip: rest.ip ?? "unknown",
      userAgent: rest.userAgent ?? "unknown",
      createdAt: rest.createdAt ?? rest.loggedInAt ?? null,
      loggedInAt: rest.loggedInAt ?? null,
    }));
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error("Error fetching activity log:", error);
    return NextResponse.json({ error: "Failed to fetch activity log" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids)
      ? body.ids.filter((id: unknown) => typeof id === "string" && id.trim()).map((id: string) => id.trim())
      : [];
    const deleteAll = body?.all === true;

    if (!deleteAll && ids.length === 0) {
      return NextResponse.json({ error: "Nothing to delete. Provide ids or all: true." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);

    // Sub-admins may only ever clear their own audit trail, never another
    // admin's — mirrors the same scoping already used for GET above.
    const scopeQuery = session.role === "superadmin" ? {} : { username: session.username };

    let query: Record<string, any>;
    if (deleteAll) {
      query = { ...scopeQuery };
    } else {
      const { ObjectId } = await import("mongodb");
      const objectIds = ids
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id));
      if (objectIds.length === 0) {
        return NextResponse.json({ error: "No valid ids provided." }, { status: 400 });
      }
      query = { ...scopeQuery, _id: { $in: objectIds } };
    }

    const result = await db.collection("activity_logs").deleteMany(query);
    return NextResponse.json({ success: true, deletedCount: result.deletedCount || 0 });
  } catch (error) {
    console.error("Error deleting activity log entries:", error);
    return NextResponse.json({ error: "Failed to delete activity log entries" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const action = typeof body.action === "string" ? body.action.trim().slice(0, 120) : "Admin action";
    const module = typeof body.module === "string" ? body.module.trim().slice(0, 80) : "Admin";
    const target = typeof body.target === "string" ? body.target.trim().slice(0, 160) : "";
    const summary = typeof body.summary === "string" ? body.summary.trim().slice(0, 500) : "";
    const method = typeof body.method === "string" ? body.method.trim().slice(0, 12) : "";
    const path = typeof body.path === "string" ? body.path.trim().slice(0, 240) : "";
    const headerStore = await headers();
    const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "unknown";
    const userAgent = headerStore.get("user-agent") || "unknown";
    const now = new Date();
    const client = await clientPromise;
    const db = client.db(dbName);
    const createdAt = now.toISOString();
    await db.collection("activity_logs").insertOne({
      username: session.username || "superadmin",
      role: session.role,
      type: "action",
      action, module, target, summary, method, path, ip, userAgent,
      createdAt,
    });

    if (session.role === "custom" && session.username) {
      await db.collection("admin_accounts").updateOne(
        { username: session.username.trim().toLowerCase() },
        { $set: { lastActivityAt: createdAt } }
      );
    }
    // Keep audit history bounded at 15 days, as requested.
    await db.collection("activity_logs").createIndex({ createdAt: 1 }, { expireAfterSeconds: 15 * 24 * 60 * 60 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording activity:", error);
    return NextResponse.json({ error: "Failed to record activity" }, { status: 500 });
  }
}
