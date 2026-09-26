import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 1000000;

// ─────────────────────────────────────────────────────────────────────
// "Generate a shareable payment link" for Admin → Payments.
//
// This is the ONE place that creates Razorpay Payment Links now — for
// courses, tests, mentorship, AND custom items alike, since all of them
// already live in `payment_items`. Send this link over WhatsApp,
// Instagram, email, anywhere — the buyer doesn't need to visit the
// website or click a <PaymentButton/> at all.
//
// Crucially, the link's `notes` are stamped in the EXACT same shape
// create-order uses (`type`, `itemSlug`, ...) so the single webhook at
// /api/payments/webhook can fulfill a Payment Link payment exactly the
// same way it fulfills an in-page Checkout payment — one pipeline, one
// Payments feed, no separate/duplicate system to maintain.
//
// This supersedes the older, per-source-collection
// /api/admin/payments/create-link route, which wrote a `paymentLink`
// field onto the course/test/mentorship_settings collection directly
// and relied only on a client-side redirect page (no webhook coverage
// — a payment could succeed on Razorpay and never get recorded if the
// buyer closed their browser before the redirect completed). See the
// project README for what to remove once you've migrated old links.
// ─────────────────────────────────────────────────────────────────────

function uniqueReferenceId(base: string) {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const maxBaseLen = Math.max(1, 40 - suffix.length - 1);
  return `${base.slice(0, maxBaseLen)}-${suffix}`.slice(0, 40);
}

async function callRazorpay(payload: any, keyId: string, keySecret: string, retries = 2): Promise<any> {
  const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/payment_links", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    const message: string = data?.error?.description || "Failed to create Razorpay payment link.";
    if (retries > 0 && /reference_id/i.test(message) && /already exists/i.test(message)) {
      const retrySuffix = `r${retries}${Math.random().toString(36).slice(2, 6)}`;
      const retryPayload = {
        ...payload,
        reference_id: `${String(payload.reference_id).slice(0, 40 - retrySuffix.length - 1)}-${retrySuffix}`.slice(0, 40),
      };
      return callRazorpay(retryPayload, keyId, keySecret, retries - 1);
    }
    throw new Error(message);
  }
  return data;
}

export async function POST(request: Request) {
  try {
    const [paymentAccess, invoiceAccess] = await Promise.all([hasModuleAccess("paymentSetup"), hasModuleAccess("invoices")]);
    if (!paymentAccess && !invoiceAccess) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null);
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your hosting's environment variables." },
        { status: 500 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://civilathan.in";
    const client = await clientPromise;
    const db = client.db(dbName);
    const items = db.collection("payment_items");
    let amount = 0;
    let description = "NS Construction Payment";
    let notes: Record<string, string> = { source: "civilathand-admin-link" };
    let callback = `${siteUrl}/payment-success`;
    let targetItemSlug: string | null = null;

    if (body?.invoiceId) {
      const invoice = await db.collection("invoices").findOne({ id: String(body.invoiceId).trim() });
      if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
      if (invoice.status === "Paid") return NextResponse.json({ error: "This invoice is already paid." }, { status: 400 });
      amount = Number(invoice.amount) || 0;
      description = `Invoice #${String(invoice.id).toUpperCase()} — ${invoice.projectTitle || "NS Construction Service"}`;
      notes = { ...notes, type: "invoice", invoiceId: invoice.id, projectId: String(invoice.projectId || "") };
      callback = `${siteUrl}/payment-success?invoiceId=${encodeURIComponent(invoice.id)}`;
    } else {
      return NextResponse.json(
        { error: "Catalog payment links are disabled. Use the signed-in website checkout; generate a link for a specific invoice instead." },
        { status: 409 }
      );
    }

    if (amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      return NextResponse.json({ error: `Amount must be between ₹${MIN_AMOUNT} and ₹${MAX_AMOUNT.toLocaleString("en-IN")}.` }, { status: 400 });
    }

    const razorpayData = await callRazorpay(
      {
        amount: Math.round(amount * 100),
        currency: "INR",
        description,
        reference_id: uniqueReferenceId(targetItemSlug || String(body?.invoiceId || "invoice")),
        callback_url: callback,
        callback_method: "get",
        notify: { sms: false, email: false },
        reminder_enable: true,
        notes,
      },
      keyId,
      keySecret
    );

    const paymentLink = razorpayData.short_url;
    if (targetItemSlug) {
      await items.updateOne(
        { slug: targetItemSlug },
        { $set: { paymentLink, razorpayPaymentLinkId: razorpayData.id, paymentLinkCreatedAt: new Date().toISOString() } }
      );
    } else if (body?.invoiceId) {
      await db.collection("invoices").updateOne(
        { id: String(body.invoiceId).trim() },
        { $set: { paymentLink, razorpayPaymentLinkId: razorpayData.id, paymentLinkCreatedAt: new Date().toISOString() } }
      );
    }

    return NextResponse.json({ success: true, paymentLink });
  } catch (error: any) {
    console.error("Error generating payment link:", error);
    return NextResponse.json({ error: error?.message || "Failed to generate payment link." }, { status: 500 });
  }
}
