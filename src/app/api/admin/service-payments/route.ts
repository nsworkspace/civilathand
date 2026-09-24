import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";
const MAX_AMOUNT = 1_000_000;

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
}

export async function POST(request: Request) {
  try {
    const allowed = await hasModuleAccess("leads") || await hasModuleAccess("paymentHistory");
    if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    const leadId = String(body.leadId || "").trim();
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const clientEmail = String(body.clientEmail || "").trim().toLowerCase();
    const amount = Number(body.amount);
    if (!leadId || !title || !clientEmail) return NextResponse.json({ error: "Lead, title and client email are required." }, { status: 400 });
    if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_AMOUNT) return NextResponse.json({ error: `Amount must be between ₹1 and ₹${MAX_AMOUNT.toLocaleString("en-IN")}.` }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(clientEmail)) return NextResponse.json({ error: "Enter a valid client email address." }, { status: 400 });

    const client = await clientPromise;
    const db = client.db(dbName);
    const lead = await db.collection("leads").findOne({ id: leadId });
    if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    if (String(lead.email || "").trim().toLowerCase() !== clientEmail) return NextResponse.json({ error: "Payment email must match the lead email." }, { status: 400 });

    const profile = await db.collection("users").findOne({ email: clientEmail }, { projection: { id: 1 } });
    const requestId = `service-pay-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const itemSlug = `service-request-${slugify(leadId)}-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const finalDescription = description || `Service payment request for ${lead.name || clientEmail}.`;

    await db.collection("payment_items").insertOne({
      id: `pay-${requestId}`,
      slug: itemSlug,
      title,
      description: finalDescription,
      amount,
      category: "service",
      active: true,
      buttonLabel: `Pay ₹${amount.toLocaleString("en-IN")}`,
      successMessage: "Payment received. Thank you — your service request is now recorded as paid.",
      pageHint: `Client Portal / Service Payment / ${lead.service || "Service"}`,
      syncedFrom: { type: "service-request", id: requestId },
      targetUserId: profile?.id || null,
      targetEmail: clientEmail,
      purchaseCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    const paymentRequest = {
      id: requestId,
      leadId,
      clientName: String(lead.name || "Client"),
      clientEmail,
      userId: profile?.id || null,
      title,
      description: finalDescription,
      amount,
      itemSlug,
      status: "Pending",
      createdAt: now,
      updatedAt: now,
    };
    await db.collection("service_payment_requests").insertOne(paymentRequest);
    await db.collection("leads").updateOne({ id: leadId }, { $set: { paymentRequestId: requestId, paymentStatus: "Pending", updatedAt: now } });

    return NextResponse.json({ success: true, request: paymentRequest, portalUrl: `/dashboard?paymentRequest=${encodeURIComponent(requestId)}` });
  } catch (error) {
    console.error("Error creating service payment request:", error);
    return NextResponse.json({ error: "Failed to create service payment request." }, { status: 500 });
  }
}
