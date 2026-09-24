import { NextResponse } from "next/server";
import crypto from "crypto";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("invoices");
    const headers = {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    };

    const isAdmin = await hasModuleAccess("invoices");
    let filter: Record<string, any> = {};

    if (!isAdmin) {
      const { getBearerToken, verifyFirebaseIdToken } = await import("@/lib/firebase-verify");
      const verified = await verifyFirebaseIdToken(getBearerToken(request));
      if (!verified?.email || !verified.emailVerified) {
        return NextResponse.json({ error: "Sign in with a verified account to view invoices." }, { status: 401 });
      }
      const email = verified.email.trim().toLowerCase();
      const projects = await db.collection("projects").find(
        { clientEmail: email },
        { projection: { id: 1 } }
      ).toArray();
      const projectIds = projects.map((project: any) => project.id).filter(Boolean);
      filter = projectIds.length
        ? { $or: [{ clientEmail: email }, { projectId: { $in: projectIds } }] }
        : { clientEmail: email };
    }

    const invoices = await collection.find(filter).toArray();
    const formattedInvoices = invoices.map(({ _id, ...rest }) => rest);
    return NextResponse.json(formattedInvoices, { headers });
  } catch (error) {
    console.error("Error in GET /api/invoices:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authenticated = await hasModuleAccess("invoices");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, projectTitle, amount, dueDate, paymentLink } = body;

    if (!projectId || !amount) {
      return NextResponse.json({ error: "projectId and amount are required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("invoices");
    const project = await db.collection("projects").findOne({ id: String(projectId) });

    // Collision-safe ID: timestamp + random suffix, re-rolled if it
    // somehow already exists (fixes the old "invoice already generated
    // with this id" error caused by two invoices sharing a Date.now() id).
    let newId = `inv-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    for (let attempt = 0; attempt < 5; attempt++) {
      const clash = await collection.findOne({ id: newId });
      if (!clash) break;
      newId = `inv-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    }

    const newInvoice = {
      id: newId,
      projectId,
      projectTitle: projectTitle || project?.title || "General Engineering Service",
      clientEmail: project?.clientEmail ? String(project.clientEmail).trim().toLowerCase() : null,
      clientName: project?.clientName || null,
      amount: Number(amount),
      dueDate: dueDate || new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "Unpaid",
      dateGenerated: new Date().toISOString().split("T")[0],
      ...(paymentLink ? { paymentLink: String(paymentLink) } : {}),
    };

    try {
      await collection.insertOne(newInvoice);
    } catch (insertErr: any) {
      // Defensive: if a duplicate key error still slips through, retry once
      // with a fresh id rather than surfacing a confusing raw DB error.
      if (insertErr?.code === 11000) {
        newInvoice.id = `inv-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
        await collection.insertOne(newInvoice);
      } else {
        throw insertErr;
      }
    }

    const { _id, ...responseInvoice } = newInvoice as any;
    return NextResponse.json(responseInvoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
