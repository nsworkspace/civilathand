import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

const initialNotifications: any[] = [];


let isSeededCached = false;

// ─────────────────────────────────────────────────────────────────────
// Auto-cleanup: notifications older than 15 days are deleted automatically
// by MongoDB itself (a TTL index), so this collection never grows
// unbounded. Requires `createdAt` to be a real BSON Date — this route now
// writes it as `new Date()` instead of an ISO string so the TTL index can
// act on it. createIndex() is safe to call on every request: once the
// index exists, Mongo just no-ops.
// ─────────────────────────────────────────────────────────────────────
const NOTIFICATION_TTL_SECONDS = 15 * 24 * 60 * 60; // 15 days
let isTtlIndexEnsured = false;

async function ensureTtlIndex(collection: any) {
  if (isTtlIndexEnsured) return;
  try {
    await collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: NOTIFICATION_TTL_SECONDS });
    isTtlIndexEnsured = true;
  } catch (err) {
    console.warn("Could not ensure notifications TTL index:", err);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedEmail = searchParams.get("userEmail");
    const adminAuth = await hasModuleAccess("notifications");
    const headers = {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    };

    try {
      const client = await clientPromise;
      const db = client.db(dbName);
      const collection = db.collection("notifications");

      await ensureTtlIndex(collection);

      // No demo/sample notifications are ever inserted automatically.
      isSeededCached = true;

      let filter: any = {};
      if (!adminAuth) {
        if (requestedEmail) {
          filter = {
            isAdmin: false,
            $or: [
              { userEmail: requestedEmail.toLowerCase() },
              { userEmail: "all" },
            ],
          };
        } else {
          // No identified client — only ever return explicit admin broadcasts
          // to "all" clients, never every individual client's private
          // notifications (that was the privacy leak).
          filter = { isAdmin: false, userEmail: "all" };
        }
      }

      const notifications = await collection.find(filter).toArray();
      const formattedNotifications = notifications.map(({ _id, ...rest }) => rest);

      formattedNotifications.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return b.id.localeCompare(a.id);
      });

      return NextResponse.json(formattedNotifications, { headers });
    } catch (dbErr) {
      console.warn("MongoDB unavailable for GET /api/notifications, returning initial:", dbErr);
      return NextResponse.json(initialNotifications, { headers });
    }
  } catch (error) {
    console.error("Error in GET /api/notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, message, type, isAdmin, userEmail, recipientName } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    const timeStr = new Date().toISOString().replace("T", " ").substring(0, 16);
    const newNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title,
      message,
      type: type || "info",
      timestamp: timeStr,
      createdAt: new Date(), // real Date, required for the 15-day TTL cleanup to work
      read: false,
      isAdmin: !!isAdmin,
      userEmail: userEmail ? userEmail.toLowerCase() : undefined,
      recipientName: recipientName || undefined,
    };

    try {
      const client = await clientPromise;
      const db = client.db(dbName);
      const collection = db.collection("notifications");
      await ensureTtlIndex(collection);
      await collection.insertOne(newNotification);
    } catch (dbErr) {
      console.warn("MongoDB unavailable for POST /api/notifications:", dbErr);
    }

    return NextResponse.json(newNotification, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { isAdmin, userEmail } = body;

    if (isAdmin === undefined && !userEmail) {
      return NextResponse.json({ error: "isAdmin or userEmail is required" }, { status: 400 });
    }

    if (isAdmin) {
      const authenticated = await hasModuleAccess("notifications");
      if (!authenticated) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    try {
      const client = await clientPromise;
      const db = client.db(dbName);
      const collection = db.collection("notifications");

      const filter: any = { read: false };
      if (isAdmin) {
        filter.isAdmin = true;
      } else if (userEmail) {
        filter.isAdmin = false;
        filter.$or = [
          { userEmail: userEmail.toLowerCase() },
          { userEmail: "all" },
        ];
      } else {
        filter.isAdmin = false;
        filter.userEmail = "all";
      }

      await collection.updateMany(filter, { $set: { read: true } });
    } catch (dbErr) {
      console.warn("MongoDB update error in notifications PUT:", dbErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notifications status:", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authenticated = await hasModuleAccess("notifications");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
    }

    try {
      const client = await clientPromise;
      const db = client.db(dbName);
      const collection = db.collection("notifications");
      await collection.deleteOne({ id });
    } catch (dbErr) {
      console.warn("MongoDB delete error in notifications DELETE:", dbErr);
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}
