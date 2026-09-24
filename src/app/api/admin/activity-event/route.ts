import { NextResponse } from "next/server";
import { headers } from "next/headers";
import clientPromise from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const action = typeof body.action === "string" ? body.action.slice(0, 160) : "Admin action";
    const module = typeof body.module === "string" ? body.module.slice(0, 80) : "Admin";
    const target = typeof body.target === "string" ? body.target.slice(0, 160) : "";
    const summary = typeof body.summary === "string" ? body.summary.slice(0, 500) : "";
    const method = typeof body.method === "string" ? body.method.slice(0, 12) : "";
    const path = typeof body.path === "string" ? body.path.slice(0, 220) : "";
    const status = Number.isFinite(Number(body.status)) ? Number(body.status) : null;
    const headerStore = await headers();
    const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "unknown";
    const userAgent = headerStore.get("user-agent") || "unknown";
    const createdAt = new Date().toISOString();
    const client = await clientPromise;
    const db = client.db(dbName);
    await db.collection("activity_logs").insertOne({
      username: session.username || "unknown",
      role: session.role,
      type: "action",
      action, module, target, summary, method, path, status, ip, userAgent,
      eventType: "admin_action",
      loggedInAt: createdAt,
      createdAt,
    });

    if (session.role === "custom" && session.username) {
      await db.collection("admin_accounts").updateOne(
        { username: session.username.trim().toLowerCase() },
        { $set: { lastActivityAt: createdAt } }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Activity event error:", error);
    return NextResponse.json({ error: "Failed to record activity" }, { status: 500 });
  }
}
