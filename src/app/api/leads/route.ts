import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";
import { getBearerToken, verifyFirebaseIdToken } from "@/lib/firebase-verify";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function GET(request: Request) {
  try {
    const authenticated = await hasModuleAccess("leads");
    
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("leads");
    const headers = {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    };

    let filter: Record<string, any> = {};
    if (!authenticated) {
      const verified = await verifyFirebaseIdToken(getBearerToken(request));
      if (!verified?.uid || !verified.email || !verified.emailVerified) {
        return NextResponse.json({ error: "Please sign in with a verified account." }, { status: 401, headers });
      }
      // Never trust a client-supplied email query for private lead data.
      // Leads are scoped to the authenticated Firebase account/email.
      filter = { $or: [{ userId: verified.uid }, { email: verified.email.trim().toLowerCase() }] };
    }

    const leads = await collection.find(filter).toArray();
    const usersCollection = db.collection("users");
    const emails = leads.map((l) => l.email.toLowerCase());
    const users = await usersCollection.find({ email: { $in: emails } }).toArray();
    const usersMap = new Map(users.map((u) => [u.email.toLowerCase(), u]));

    const paymentRequestIds = leads.map((lead: any) => lead.paymentRequestId).filter(Boolean);
    const paymentRequests = paymentRequestIds.length
      ? await db.collection("service_payment_requests").find({ id: { $in: paymentRequestIds } }).toArray()
      : [];
    const paymentMap = new Map(paymentRequests.map((item: any) => [item.id, item]));
    const formattedLeads = leads.map(({ _id, ...rest }) => {
      const matchedUser = usersMap.get(rest.email.toLowerCase()) as any;
      const paymentRequest = rest.paymentRequestId ? paymentMap.get(rest.paymentRequestId) : null;
      return {
        ...rest,
        paymentStatus: paymentRequest?.status || rest.paymentStatus || null,
        paymentAmount: paymentRequest?.amount || null,
        profileDetails: matchedUser ? {
          company: matchedUser.company || "",
          address: matchedUser.address || ""
        } : null
      };
    });
    return NextResponse.json(formattedLeads, { headers });
  } catch (error) {
    console.error("Error in GET /api/leads:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, service, source, details } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("leads");

    const optionalVerified = await verifyFirebaseIdToken(getBearerToken(request));
    const newLead = {
      id: `lead-${Date.now()}`,
      userId: optionalVerified?.uid || null,
      name,
      email,
      phone: phone || "",
      service: service || "General",
      source: source || "Contact Form",
      details: details || "",
      status: "new",
      date: new Date().toISOString().split("T")[0],
    };

    await collection.insertOne(newLead);

    const { _id, ...responseLead } = newLead as any;
    return NextResponse.json(responseLead, { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
