import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";
import { MAX_AMOUNT_INR } from "@/lib/razorpay";
import { ensureCentralPaymentCatalog } from "@/lib/centralPaymentCatalog";
import { syncPaymentItem } from "@/lib/paymentItemSync";
import { ensurePaymentEventIndexes } from "@/lib/paymentFulfillment";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

// Payment Items are generic admin-managed things a visitor can pay for or claim
// free (₹0) anywhere on the site. Calculator-specific synchronization has been
// removed because the calculator feature was retired.

export async function GET() {
  try {
    const authenticated = await hasModuleAccess("paymentSetup");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const client = await clientPromise;
    const db = client.db(dbName);
    await ensureCentralPaymentCatalog(db);

    // Reconcile the central Payment Center with currently configured admin courses.
    const courses = await db.collection("software_courses").find(
      { source: "admin" },
      { projection: { slug: 1, name: 1, title: 1, summary: 1, subtitle: 1, comingSoon: 1 } }
    ).toArray();
    for (const course of courses as any[]) {
      if (!course.slug) continue;
      const existingPaymentItem = await db.collection("payment_items").findOne(
        { slug: `course-${String(course.slug).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}` },
        { projection: { active: 1, amount: 1 } }
      );
      await syncPaymentItem(db, {
        sourceType: "course",
        sourceId: String(course.slug),
        title: course.name || course.title || course.slug,
        description: course.summary || course.subtitle || "",
        active: course.comingSoon !== true && (existingPaymentItem ? existingPaymentItem.active !== false : true),
      });
    }

    // Repair the historical Razorpay idempotency index opportunistically.
    // A legacy index problem must never make the entire Payment Center appear empty.
    try {
      await ensurePaymentEventIndexes(db);
    } catch (indexError) {
      console.error("Payment Center: idempotency-index repair deferred:", indexError);
    }

    const items = await db.collection("payment_items").find({}).sort({ createdAt: -1 }).toArray();
    const formatted = items.map(({ _id, ...rest }) => rest);
    return NextResponse.json({ items: formatted }, { headers: { "Cache-Control": "no-store, no-cache" } });
  } catch (error) {
    console.error("Error fetching payment items:", error);
    return NextResponse.json({ error: "Failed to fetch payment items." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authenticated = await hasModuleAccess("paymentSetup");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    const { id, title, description, amount, category, active, buttonLabel, successMessage, pageHint, pagePath, matchChildren } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount < 0 || numericAmount > MAX_AMOUNT_INR) {
      return NextResponse.json(
        { error: `Amount must be between ₹0 (free) and ₹${MAX_AMOUNT_INR.toLocaleString("en-IN")}.` },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("payment_items");

    // Slug is derived once from the original title and never regenerated on edit.
    const existingById = id ? await collection.findOne({ id }) : null;
    const cleanSlug = existingById
      ? existingById.slug
      : String(body.slug || title)
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

    if (!cleanSlug) {
      return NextResponse.json({ error: "Could not generate a valid slug from the title." }, { status: 400 });
    }

    const itemId = id || `pay-${cleanSlug}-${Date.now().toString(36)}`;
    const resolvedActive = existingById
      ? (typeof active === "boolean" ? active : existingById.active !== false)
      : active !== false;
    const resolvedCategory = existingById?.syncedFrom?.type || (category?.trim() || "custom");

    const existingBySlug = await collection.findOne({ slug: cleanSlug, id: { $ne: itemId } });
    if (existingBySlug) {
      return NextResponse.json({ error: `A payment item with slug "${cleanSlug}" already exists. Choose a different title.` }, { status: 400 });
    }

    const pricingMode = body?.pricingMode === "free" ? "free" : "paid";

    const itemData = {
      id: itemId,
      slug: cleanSlug,
      title: title.trim(),
      description: description?.trim() || "",
      amount: pricingMode === "free" ? 0 : numericAmount,
      pricingMode,
      category: resolvedCategory,
      active: resolvedActive,
      buttonLabel: buttonLabel?.trim() || (numericAmount === 0 ? "Get Free" : "Pay Now"),
      successMessage: successMessage?.trim() || "Thank you! Your payment was received.",
      pageHint: pageHint?.trim() || "",
      pagePath: typeof pagePath === "string" ? pagePath.trim() : "",
      matchChildren: matchChildren === true,
      updatedAt: new Date().toISOString(),
    };

    if (existingById) {
      await collection.updateOne({ id: itemId }, { $set: itemData });
    } else {
      await collection.insertOne({
        ...itemData,
        purchaseCount: 0,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, item: itemData });
  } catch (error) {
    console.error("Error saving payment item:", error);
    return NextResponse.json({ error: "Failed to save payment item." }, { status: 500 });
  }
}
