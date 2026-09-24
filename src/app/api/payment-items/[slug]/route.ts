import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getCentralPaymentSeed } from "@/lib/centralPaymentCatalog";
import { MENTORSHIP_SLUG } from "@/lib/paymentSlugs";
import { verifyFirebaseIdToken, getBearerToken } from "@/lib/firebase-verify";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

// Public lookup used by <PaymentButton itemSlug="..." /> to render the
// live title/price for a custom payment item wherever it's embedded.
// Only returns items marked active — an inactive item behaves as if it
// doesn't exist, so the button can show "not available".
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const ip = getClientIp(request);
    const limited = rateLimit(`payment-item:${ip}`, { limit: 60, windowMs: 60_000 });
    if (!limited.allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
    }
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const client = await clientPromise;
    const db = client.db(dbName);
    let item = await db.collection("payment_items").findOne({ slug });
    if (!item) {
      const seed = getCentralPaymentSeed(slug);
      if (seed) {
        const now = new Date().toISOString();
        await db.collection("payment_items").updateOne(
          { slug },
          { $setOnInsert: { id: `pay-${slug}`, ...seed, active: true, buttonLabel: "Pay Now", successMessage: "Payment received successfully.", purchaseCount: 0, createdAt: now, updatedAt: now } },
          { upsert: true }
        );
        item = await db.collection("payment_items").findOne({ slug });
      }
    }
    // Auto-provision a missing course/mentorship catalog item so an admin
    // never has to touch code just because an older record was created before
    // the centralized Payment Center existed. Existing prices are preserved.
    if (!item && slug.startsWith("course-")) {
      const courseSlug = slug.slice("course-".length);
      const course = await db.collection("software_courses").findOne({ slug: courseSlug, source: "admin" });
      if (course) {
        const now = new Date().toISOString();
        await db.collection("payment_items").updateOne(
          { slug },
          { $setOnInsert: { id: `pay-${slug}`, slug, title: course.name || course.title || courseSlug, description: course.summary || course.subtitle || "Course enrollment", amount: 0, category: "course", active: true, buttonLabel: "Pay & Enroll", successMessage: "Course enrollment successful.", pageHint: `/education/courses/${courseSlug}`, syncedFrom: { type: "course", id: courseSlug }, purchaseCount: 0, createdAt: now, updatedAt: now } },
          { upsert: true }
        );
        item = await db.collection("payment_items").findOne({ slug });
      }
    }
    // Auto-provision calculator items so a newly added calculator can use
    // <PaymentButton itemSlug="calculator-<id>" /> immediately. The admin
    // Payments panel can then change its price without a code change.
    if (!item && slug.startsWith("calculator-")) {
      const calculatorId = slug.slice("calculator-".length);
      if (calculatorId && /^[a-z0-9-]+$/i.test(calculatorId)) {
        const title = calculatorId
          .split("-")
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ") + " Calculator";
        const now = new Date().toISOString();
        await db.collection("payment_items").updateOne(
          { slug },
          {
            $setOnInsert: {
              id: `pay-${slug}`,
              slug,
              title,
              description: `Payment access for the ${title}.`,
              amount: 0,
              category: "calculator",
              active: true,
              buttonLabel: "Use Calculator",
              successMessage: "Calculator access unlocked.",
              pageHint: calculatorId === "unit-converter" ? "/engineering-unit-converter" : calculatorId === "concrete" ? "/concrete-calculator" : `/calculators/${calculatorId}`,
              syncedFrom: { type: "calculator", id: calculatorId },
              purchaseCount: 0,
              createdAt: now,
              updatedAt: now,
            },
          },
          { upsert: true }
        );
        item = await db.collection("payment_items").findOne({ slug });
      }
    }

    if (!item) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    const token = getBearerToken(request);
    const user = await verifyFirebaseIdToken(token);

    // Client-specific service payment items are not public catalog items.
    // Never reveal or allow checkout for a request addressed to another
    // account, even if somebody guesses the item slug.
    if (item.targetUserId || item.targetEmail) {
      const targetEmail = String(item.targetEmail || "").trim().toLowerCase();
      const targetMatches = !!user?.uid && !!user?.email && user.emailVerified &&
        ((!item.targetUserId || item.targetUserId === user.uid) &&
         (!targetEmail || targetEmail === user.email.trim().toLowerCase()));
      if (!targetMatches) {
        return NextResponse.json({ error: "This payment request is not assigned to this account." }, { status: 403, headers: { "Cache-Control": "no-store" } });
      }
    }

    let owned = false;
    if (user?.email && user.emailVerified) {
      const normalizedEmail = user.email.trim().toLowerCase();
      owned = !!(await db.collection("payment_events").findOne({
        itemSlug: item.slug,
        refunded: { $ne: true },
        ...(Number(item.amount || 0) > 0
          ? {
              $and: [
                {
                  $or: [
                    { amount: { $gt: 0 }, free: { $ne: true } },
                    { amount: 0, free: true, $or: [{ couponCode: { $type: "string" } }, { offerId: { $type: "string" } }] },
                  ],
                },
                {
                  $or: [
                    { userId: user.uid },
                    { userEmail: normalizedEmail },
                  ],
                },
              ],
            }
          : {
              $or: [
                { userId: user.uid },
                { userEmail: normalizedEmail },
              ],
            }),
      }));
    }
    const accessible = !!(
      user?.emailVerified &&
      (
        (Number(item.amount || 0) === 0 && item.active !== false) ||
        (Number(item.amount || 0) > 0 && owned)
      )
    );

    let offer: any = null;
    if (Number(item.amount || 0) > 0 && item.active !== false) {
      const now = new Date();
      const candidates = await db.collection("payment_offers").find({ active: true, $or: [{ appliesTo: "all" }, { appliesTo: item.slug }] }).sort({ priority: -1, createdAt: -1 }).limit(20).toArray();
      const candidate = candidates.find((o: any) => (!o.startsAt || now >= new Date(o.startsAt)) && (!o.endsAt || now <= new Date(o.endsAt)) && (o.usageLimit == null || Number(o.usedCount || 0) < Number(o.usageLimit)));
      if (candidate) {
        const base = Number(item.amount || 0), value = Number(candidate.value || 0);
        const discountAmount = candidate.type === "percent" ? Math.min(base, base * value / 100) : Math.min(base, value);
        const discountedAmount = Math.max(0, Math.round((base - discountAmount) * 100) / 100);
        if (discountAmount > 0) offer = { id: String(candidate.id), title: String(candidate.title || "Special Offer"), description: String(candidate.description || ""), originalAmount: base, discountAmount, discountedAmount, endsAt: candidate.endsAt || null };
      }
    }

    // Disabled paid products remain visible to existing customers so their
    // legitimate access is never revoked. New users are not given checkout
    // access while the item is disabled.
    if (item.active === false && !owned) {
      return NextResponse.json(
        { error: "This payment item is currently unavailable." },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json(
      {
        slug: item.slug,
        title: item.title,
        description: item.description,
        amount: Number(item.amount || 0),
        pricingMode: item.pricingMode === "free" || Number(item.amount || 0) === 0 ? "free" : "paid",
        buttonLabel: item.buttonLabel,
        successMessage: item.successMessage,
        category: item.category || "custom",
        owned,
        accessible,
        offer,
      },
      { headers: { "Cache-Control": "no-store, no-cache" } }
    );
  } catch (error) {
    console.error("Error fetching payment item:", error);
    return NextResponse.json({ error: "Failed to fetch payment item." }, { status: 500 });
  }
}
