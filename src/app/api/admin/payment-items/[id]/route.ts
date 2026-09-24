import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";
import { MAX_AMOUNT_INR } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authenticated = await hasModuleAccess("paymentSetup");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("payment_items");
    const existing = await collection.findOne({ id });
    if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

    // Synced course/test/mentorship items are part of the live storefront.
    // Deleting them would make create-order fall back to ₹0/free if an old
    // page still references the source item. Disable instead.
    if ((existing as any).syncedFrom) {
      await collection.updateOne({ id }, { $set: { active: false, updatedAt: new Date().toISOString() } });
      return NextResponse.json({ success: true, disabled: true });
    }

    await collection.deleteOne({ id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting payment item:", error);
    return NextResponse.json({ error: "Failed to delete payment item." }, { status: 500 });
  }
}

// Partial update — used for the quick Enable/Disable toggle, but also
// accepts any other editable field.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authenticated = await hasModuleAccess("paymentSetup");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const update: Record<string, any> = { updatedAt: new Date().toISOString() };

    if (typeof body.active === "boolean") update.active = body.active;
    if (typeof body.title === "string" && body.title.trim()) update.title = body.title.trim();
    if (typeof body.description === "string") update.description = body.description.trim();
    if (typeof body.category === "string" && body.category.trim()) update.category = body.category.trim();
    if (typeof body.buttonLabel === "string") update.buttonLabel = body.buttonLabel.trim();
    if (typeof body.successMessage === "string") update.successMessage = body.successMessage.trim();
    if (typeof body.pageHint === "string") update.pageHint = body.pageHint.trim();
    if (typeof body.pagePath === "string") update.pagePath = body.pagePath.trim();
    if (typeof body.matchChildren === "boolean") update.matchChildren = body.matchChildren;

    if (body.pricingMode !== undefined) {
      if (body.pricingMode !== "free" && body.pricingMode !== "paid") {
        return NextResponse.json({ error: "Payment type must be free or paid." }, { status: 400 });
      }
      update.pricingMode = body.pricingMode;
      if (body.pricingMode === "free") update.amount = 0;
    }

    if (body.amount !== undefined && body.pricingMode !== "free") {
      const numericAmount = Number(body.amount);
      if (!Number.isFinite(numericAmount) || numericAmount < 0 || numericAmount > MAX_AMOUNT_INR) {
        return NextResponse.json(
          { error: `Amount must be between ₹0 (free) and ₹${MAX_AMOUNT_INR.toLocaleString("en-IN")}.` },
          { status: 400 }
        );
      }
      update.amount = numericAmount;
    }

    const result = await db.collection("payment_items").updateOne({ id }, { $set: update });
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const updated = await db.collection("payment_items").findOne({ id });
    if (!updated) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const { _id, ...formatted } = updated as any;
    return NextResponse.json({ success: true, item: formatted });
  } catch (error) {
    console.error("Error updating payment item:", error);
    return NextResponse.json({ error: "Failed to update payment item." }, { status: 500 });
  }
}
