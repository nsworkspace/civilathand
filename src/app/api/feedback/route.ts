import { NextResponse } from "next/server";
import { headers } from "next/headers";
import clientPromise from "@/lib/mongodb";
import { isAdminAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";
const COLLECTION = "feedback_reports";

// ─────────────────────────────────────────────────────────────────────
// Site-wide Report a Bug / Suggestion / Review form.
//  - POST is public (anyone on the site can submit, no login needed).
//  - GET/PATCH/DELETE are super-admin only, surfaced in the admin panel
//    under System → Feedback & Reports.
// A very light in-memory throttle stops one visitor from spamming the
// form; it resets on cold start, same trade-off as the login throttle.
// ─────────────────────────────────────────────────────────────────────

const MAX_SUBMISSIONS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const submissionsByIp = new Map<string, { count: number; windowStart: number }>();

function isThrottled(ip: string): boolean {
  const now = Date.now();
  const entry = submissionsByIp.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    submissionsByIp.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_SUBMISSIONS;
}

const VALID_TYPES = ["bug", "suggestion", "review"] as const;
type FeedbackType = (typeof VALID_TYPES)[number];

export async function POST(request: Request) {
  try {
    const headerStore = await headers();
    const ip =
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headerStore.get("x-real-ip") ||
      "unknown";

    if (isThrottled(ip)) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again in a few minutes." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { type, name, email, message, rating, page } = body;

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid feedback type." }, { status: 400 });
    }
    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const doc = {
      id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: type as FeedbackType,
      name: typeof name === "string" && name.trim() ? name.trim() : "Anonymous",
      email: typeof email === "string" ? email.trim().toLowerCase() : "",
      message: message.trim(),
      rating: type === "review" && Number.isFinite(rating) ? Math.min(5, Math.max(1, Math.round(rating))) : undefined,
      page: typeof page === "string" ? page.slice(0, 200) : "",
      ip,
      status: "new" as const, // new | reviewed | resolved
      createdAt: new Date(), // real Date so a TTL index can be added later if desired
    };

    const client = await clientPromise;
    const db = client.db(dbName);
    await db.collection(COLLECTION).insertOne(doc);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error saving feedback:", error);
    return NextResponse.json({ error: "Failed to submit. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const authorized = await isAdminAuthenticated();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const entries = await db.collection(COLLECTION).find({}).sort({ createdAt: -1 }).limit(500).toArray();

    const reports = entries.map(({ _id, ip, ...rest }) => ({ id: _id.toString(), ...rest }));

    return NextResponse.json({ success: true, reports });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authorized = await isAdminAuthenticated();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status } = await request.json();
    if (!id || !["new", "reviewed", "resolved"].includes(status)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    await db.collection(COLLECTION).updateOne({ id }, { $set: { status } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating feedback:", error);
    return NextResponse.json({ error: "Failed to update feedback" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authorized = await isAdminAuthenticated();
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    await db.collection(COLLECTION).deleteOne({ id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    return NextResponse.json({ error: "Failed to delete feedback" }, { status: 500 });
  }
}
