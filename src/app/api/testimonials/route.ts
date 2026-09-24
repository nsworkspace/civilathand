import { NextResponse } from "next/server";
import { headers } from "next/headers";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";
const COLLECTION = "testimonials";

// ─────────────────────────────────────────────────────────────────────
// Testimonials — visitors submit their own review, OR the admin adds one
// on a real client's behalf (e.g. from a WhatsApp/email testimonial).
// Nothing shows on the homepage until a super admin approves it.
//  - GET  (public, no auth)         → approved testimonials only
//  - GET  ?all=1 (admin only)       → every testimonial, any status
//  - POST (public)                  → submit one, starts as "pending"
//  - POST ?admin=1 (admin only)     → admin-added, starts as "approved"
//  - PATCH (admin only)             → approve / reject
//  - DELETE (admin only)
// ─────────────────────────────────────────────────────────────────────

const MAX_SUBMISSIONS = 5;
const WINDOW_MS = 10 * 60 * 1000;
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wantsAll = searchParams.get("all") === "1";

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection(COLLECTION);

    if (wantsAll) {
      const authorized = await hasModuleAccess("clients");
      if (!authorized) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();
      return NextResponse.json({ success: true, testimonials: docs.map(({ _id, ...r }) => ({ id: _id.toString(), ...r })) });
    }

    const docs = await collection.find({ status: "approved" }).sort({ createdAt: -1 }).limit(50).toArray();
    return NextResponse.json({ success: true, testimonials: docs.map(({ _id, ...r }) => ({ id: _id.toString(), ...r })) });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdminSubmit = searchParams.get("admin") === "1";

    if (isAdminSubmit) {
      const authorized = await hasModuleAccess("clients");
      if (!authorized) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      const headerStore = await headers();
      const ip =
        headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headerStore.get("x-real-ip") ||
        "unknown";
      if (isThrottled(ip)) {
        return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
      }
    }

    const body = await request.json();
    const { name, role, company, message, rating } = body;

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const doc = {
      id: `testi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      role: typeof role === "string" ? role.trim() : "",
      company: typeof company === "string" ? company.trim() : "",
      message: message.trim(),
      rating: Number.isFinite(rating) ? Math.min(5, Math.max(1, Math.round(rating))) : 5,
      status: isAdminSubmit ? "approved" : "pending",
      source: isAdminSubmit ? "admin" : "public",
      createdAt: new Date().toISOString(),
    };

    const client = await clientPromise;
    const db = client.db(dbName);
    await db.collection(COLLECTION).insertOne(doc);

    return NextResponse.json({ success: true, testimonial: doc }, { status: 201 });
  } catch (error) {
    console.error("Error saving testimonial:", error);
    return NextResponse.json({ error: "Failed to submit. Please try again." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const authorized = await hasModuleAccess("clients");
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status } = await request.json();
    if (!id || !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    await db.collection(COLLECTION).updateOne({ id }, { $set: { status } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating testimonial:", error);
    return NextResponse.json({ error: "Failed to update testimonial" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authorized = await hasModuleAccess("clients");
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db(dbName);
    await db.collection(COLLECTION).deleteOne({ id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    return NextResponse.json({ error: "Failed to delete testimonial" }, { status: 500 });
  }
}
