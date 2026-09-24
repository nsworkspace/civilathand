import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";
import { syncPaymentItem } from "@/lib/paymentItemSync";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function GET() {
  try {
    const authenticated = await hasModuleAccess("mentorship");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    
    // Fetch settings
    const settingsColl = db.collection("mentorship_settings");
    let settings = await settingsColl.findOne({});
    
    // Fetch applications
    const appsColl = db.collection("mentorship_applications");
    const applications = await appsColl.find({}).toArray();

    const formattedApps = applications.map(({ _id, ...rest }) => rest);
    // Attach server-derived payment status to every application. The admin
    // UI never trusts a client-submitted "paid" flag.
    for (const app of formattedApps as any[]) {
      const identityOr = [
        ...(app.userId ? [{ userId: app.userId }] : []),
        ...(app.email ? [{ userEmail: String(app.email).trim().toLowerCase() }] : []),
      ];
      const payment = identityOr.length ? await db.collection("payment_events").findOne(
        {
          itemSlug: "mentorship-program",
          refunded: { $ne: true },
          $and: [
            { $or: identityOr },
            { $or: [
              { amount: { $gt: 0 }, free: { $ne: true } },
              { amount: 0, free: true, $or: [{ couponCode: { $type: "string" } }, { offerId: { $type: "string" } }] },
            ] },
          ],
        },
        { sort: { paidAt: -1 } }
      ) : null;
      app.paymentStatus = payment ? (payment.refunded ? "Refunded" : payment.free ? "Free" : "Paid") : "Not Paid";
      app.paymentAmount = payment ? Number(payment.amount || 0) : 0;
      app.paymentId = payment?.razorpayPaymentId || null;
      app.paymentDate = payment?.paidAt || null;
    }
    // Sort applications by newest first
    formattedApps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const { _id, ...formattedSettings } = (settings || {}) as any;
    const paymentItem = await db.collection("payment_items").findOne({ slug: "mentorship-program" }, { projection: { amount: 1, active: 1, title: 1 } });
    formattedSettings.paymentAmount = Number(paymentItem?.amount || 0);
    formattedSettings.paymentActive = paymentItem?.active !== false;
    formattedSettings.seo = {
      title: String(formattedSettings.seo?.title || ""),
      description: String(formattedSettings.seo?.description || ""),
      keywords: Array.isArray(formattedSettings.seo?.keywords) ? formattedSettings.seo.keywords : [],
      canonicalUrl: String(formattedSettings.seo?.canonicalUrl || ""),
      ogImage: String(formattedSettings.seo?.ogImage || ""),
      index: formattedSettings.seo?.index !== false,
      follow: formattedSettings.seo?.follow !== false,
    };

    return NextResponse.json({
      settings: formattedSettings,
      applications: formattedApps
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      }
    });
  } catch (error) {
    console.error("Error in GET /api/admin/mentorship:", error);
    return NextResponse.json({ error: "Failed to fetch admin mentorship data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authenticated = await hasModuleAccess("mentorship");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    const client = await clientPromise;
    const db = client.db(dbName);

    if (action === "update_settings") {
      const settingsColl = db.collection("mentorship_settings");
      // Use replaceOne or updateOne with upsert to save settings
      const { price: _ignoredPrice, paymentAmount: _ignoredPaymentAmount, priceNote: _ignoredPriceNote, ...contentSettings } = data || {};
      await settingsColl.updateOne(
        {},
        { $set: { ...contentSettings, updatedAt: new Date() } },
        { upsert: true }
      );

      // Centralized payment sync: metadata only. The actual price and payment
      // status are owned exclusively by Admin → Payments → Payment Center.
      try {
        await syncPaymentItem(db, {
          sourceType: "mentorship",
          sourceId: "program",
          title: data?.title || "1:1 Mentorship Program",
          description: data?.subtitle || "",
          // Do not touch amount/active here. Payment Center is the only source of truth.
        });
      } catch (syncError) {
        console.error("Non-fatal: failed to sync mentorship payment item:", syncError);
      }

      return NextResponse.json({ success: true, message: "Settings updated successfully." });
    }

    if (action === "update_status") {
      const { id, status, notes } = data;
      if (!id || !status) {
        return NextResponse.json({ error: "id and status are required for updating status" }, { status: 400 });
      }
      const appsColl = db.collection("mentorship_applications");
      await appsColl.updateOne(
        { id },
        { $set: { status, notes: notes || "", updatedAt: new Date() } }
      );
      return NextResponse.json({ success: true, message: "Application updated successfully." });
    }

    if (action === "delete_application") {
      const { id } = data;
      if (!id) {
        return NextResponse.json({ error: "id is required for deleting application" }, { status: 400 });
      }
      const appsColl = db.collection("mentorship_applications");
      await appsColl.deleteOne({ id });
      return NextResponse.json({ success: true, message: "Application deleted successfully." });
    }

    return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
  } catch (error) {
    console.error("Error in POST /api/admin/mentorship:", error);
    return NextResponse.json({ error: "Operation failed on server" }, { status: 500 });
  }
}
