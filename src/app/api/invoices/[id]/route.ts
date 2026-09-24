import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";
import { getBearerToken, verifyFirebaseIdToken } from "@/lib/firebase-verify";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("invoices");

    const invoice = await collection.findOne({ id });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const isAdmin = await hasModuleAccess("invoices");
    if (!isAdmin) {
      const verified = await verifyFirebaseIdToken(getBearerToken(request));
      if (!verified?.email || !verified.emailVerified) {
        return NextResponse.json({ error: "Sign in with a verified account." }, { status: 401 });
      }
      const email = verified.email.trim().toLowerCase();
      const project = invoice.projectId
        ? await db.collection("projects").findOne({ id: invoice.projectId }, { projection: { clientEmail: 1 } })
        : null;
      const ownsInvoice =
        String(invoice.clientEmail || "").trim().toLowerCase() === email ||
        String(project?.clientEmail || "").trim().toLowerCase() === email;
      if (!ownsInvoice) {
        return NextResponse.json({ error: "You are not authorized to access this invoice." }, { status: 403 });
      }

      // A client may only use this legacy PUT as an idempotent state refresh
      // after Razorpay has already marked the invoice Paid. It can never
      // change an Unpaid invoice to Paid directly.
      if (body?.status !== "Paid" || invoice.status !== "Paid") {
        return NextResponse.json(
          { error: "Invoice payment must be completed through the secure Razorpay checkout." },
          { status: 403 }
        );
      }
      return NextResponse.json(invoice, { headers: { "Cache-Control": "no-store" } });
    }

    const updatedInvoiceData = {
      ...body,
      id: invoice.id,
      dateGenerated: invoice.dateGenerated,
    };

    delete (updatedInvoiceData as any)._id;

    await collection.updateOne({ id }, { $set: updatedInvoiceData });

    const { _id, ...originalInvoiceWithoutId } = invoice;
    return NextResponse.json({ ...originalInvoiceWithoutId, ...updatedInvoiceData });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await hasModuleAccess("invoices");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("invoices");

    const result = await collection.deleteOne({ id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
