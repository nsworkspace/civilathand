import { NextResponse } from "next/server";
import crypto from "crypto";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";
const COLLECTION = "proposals";

// ─────────────────────────────────────────────────────────────────────
// Proposal Builder — admin picks a registered client (searched from the
// `users` collection, same as the Registered User Tracker), adds services
// with per-client rates, and either downloads a branded PDF or "sends" it
// straight to that client's portal (stored here + a notification fires).
//  - GET  ?email=x     → that client's own proposals (used by /proposals)
//  - GET  (no email)   → full list, admin only (Leads/Sales module)
//  - POST               → create a proposal, admin only
//  - DELETE ?id=x       → admin only
// ─────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email")?.toLowerCase().trim();

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection(COLLECTION);

    if (email) {
      // Client-facing: only ever their own proposals.
      const docs = await collection.find({ clientEmail: email }).sort({ createdAt: -1 }).toArray();
      return NextResponse.json({ success: true, proposals: docs.map(({ _id, ...r }) => ({ id: _id.toString(), ...r })) });
    }

    // Admin-facing: full list.
    const authorized = await hasModuleAccess("leads");
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const docs = await collection.find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ success: true, proposals: docs.map(({ _id, ...r }) => ({ id: _id.toString(), ...r })) });
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return NextResponse.json({ error: "Failed to fetch proposals" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authorized = await hasModuleAccess("leads");
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { clientName, clientEmail, clientPhone, items, notes, validTill, sendToPortal } = body;

    if (!clientName || !clientEmail || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Client details and at least one service are required." }, { status: 400 });
    }

    const cleanItems = items
      .map((it: any) => ({
        service: String(it.service || "").trim(),
        description: String(it.description || "").trim(),
        rate: Number(it.rate) || 0,
        qty: Number(it.qty) || 1,
      }))
      .filter((it: any) => it.service);

    if (cleanItems.length === 0) {
      return NextResponse.json({ error: "Add at least one valid service line." }, { status: 400 });
    }

    const proposal = {
      id: `prop-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim().toLowerCase(),
      clientPhone: clientPhone ? String(clientPhone).trim() : "",
      items: cleanItems,
      notes: notes ? String(notes).trim() : "",
      validTill: validTill || "",
      status: sendToPortal ? "sent" : "draft",
      createdAt: new Date().toISOString(),
    };

    const client = await clientPromise;
    const db = client.db(dbName);
    await db.collection(COLLECTION).insertOne(proposal);

    // If sent to the client portal, drop a notification too so they see it
    // without needing to be told separately — reuses the existing
    // notifications collection/UI, no new plumbing needed.
    if (sendToPortal) {
      try {
        await db.collection("notifications").insertOne({
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: "New Proposal Received",
          message: `A new service proposal is ready for you to review in your dashboard.`,
          type: "info",
          timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
          createdAt: new Date(),
          read: false,
          isAdmin: false,
          userEmail: proposal.clientEmail,
          recipientName: proposal.clientName,
        });
      } catch (notifErr) {
        console.warn("Proposal saved but notification failed:", notifErr);
      }
    }

    return NextResponse.json({ success: true, proposal }, { status: 201 });
  } catch (error) {
    console.error("Error creating proposal:", error);
    return NextResponse.json({ error: "Failed to create proposal" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authorized = await hasModuleAccess("leads");
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
    console.error("Error deleting proposal:", error);
    return NextResponse.json({ error: "Failed to delete proposal" }, { status: 500 });
  }
}
