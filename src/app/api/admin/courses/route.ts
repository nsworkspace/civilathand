import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";
import { syncPaymentItem } from "@/lib/paymentItemSync";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

/**
 * These are the old code-defined demo catalog slugs. They are intentionally
 * kept here only for the one-time admin-side cleanup/migration. AutoCAD is
 * excluded because it is the course the owner explicitly added and must stay.
 */
const LEGACY_DEMO_COURSE_SLUGS = [
  "revit",
  "staad-pro",
  "etabs-structural-design",
  "bim-coordination",
  "quantity-surveying-estimation",
  "construction-site-engineering",
  "architectural-design-planning",
  "vastu-for-built-spaces",
  "project-planning-primavera",
] as const;

async function cleanupLegacyDemoCourses(db: any) {
  const legacySlugs = [...LEGACY_DEMO_COURSE_SLUGS];

  // Remove the old static/demo course documents. This is deliberately
  // limited to the known legacy catalog and never touches AutoCAD.
  if (legacySlugs.length) {
    await db.collection("software_courses").deleteMany({ slug: { $in: legacySlugs } });
  }

  // Any course that has an id was created through the Admin Courses flow in
  // this application. Mark those records as admin-owned so existing custom
  // records (including the owner's AutoCAD course) remain visible.
  await db.collection("software_courses").updateMany(
    { id: { $exists: true, $ne: null }, source: { $exists: false } },
    { $set: { source: "admin" } }
  );

  // Remove orphaned payment catalog records for deleted demo courses only
  // when there is no payment history. If history exists, keep the item but
  // deactivate it so financial/audit records remain intact.
  for (const slug of legacySlugs) {
    const itemSlug = `course-${slug}`;
    const paymentEvents = await db.collection("payment_events").countDocuments({ itemSlug });
    const paymentOrders = await db.collection("payment_orders").countDocuments({ itemSlug });
    if (paymentEvents === 0 && paymentOrders === 0) {
      await db.collection("payment_items").deleteOne({ slug: itemSlug });
    } else {
      await db.collection("payment_items").updateOne(
        { slug: itemSlug },
        { $set: { active: false, updatedAt: new Date() } }
      );
    }
  }
}

export async function GET() {
  try {
    const authenticated = await hasModuleAccess("softwareCourses");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    await cleanupLegacyDemoCourses(db);
    const collection = db.collection("software_courses");

    const courses = await collection.find({ source: "admin" }).sort({ order: 1, createdAt: 1 }).toArray();
    const formatted = await Promise.all(courses.map(async ({ _id, ...rest }: any) => {
      const item = await db.collection("payment_items").findOne({ slug: `course-${String(rest.slug).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}` }, { projection: { amount: 1, active: 1 } });
      return { ...rest, paymentAmount: item?.amount !== undefined ? Number(item.amount) : rest.paymentAmount, paymentActive: item ? item.active !== false : false };
    }));

    return NextResponse.json(
      { courses: formatted },
      { headers: { "Cache-Control": "no-store, no-cache" } }
    );
  } catch (error: any) {
    console.error("Error fetching admin courses:", error);
    return NextResponse.json({ error: "Failed to fetch Civil At Hand courses." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authenticated = await hasModuleAccess("softwareCourses");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      slug,
      name,
      sub,
      category,
      mode,
      level,
      duration,
      priceLabel,
      badge,
      badgeColor,
      accent,
      summary,
      learn,
      modules,
      whoFor,
      comingSoon,
    } = body;

    if (!name?.trim() || !slug?.trim()) {
      return NextResponse.json({ error: "Course name and slug are required." }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("software_courses");

    const courseId = id || `course-${slug.trim().toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");

    const courseData = {
      id: courseId,
      source: "admin",
      slug: cleanSlug,
      name: name.trim(),
      sub: sub?.trim() || "",
      category: typeof category === "string" && category.trim() ? category.trim() : "Civil Engineering",
      mode: mode === "Live" ? "Live" : "Self-Paced",
      level: level?.trim() || "Beginner to Intermediate",
      duration: duration?.trim() || "20+ hours",
      priceLabel: priceLabel?.trim() || "Lowest Price",
      badge: badge?.trim() || "Course",
      badgeColor: badgeColor?.trim() || "bg-orange-500",
      accent: accent?.trim() || "#ef6c00",
      summary: summary?.trim() || "",
      learn: Array.isArray(learn) ? learn : typeof learn === "string" ? learn.split("\n").filter(Boolean) : [],
      modules: Array.isArray(modules) ? modules : typeof modules === "string" ? modules.split("\n").filter(Boolean) : [],
      whoFor: Array.isArray(whoFor) ? whoFor : typeof whoFor === "string" ? whoFor.split("\n").filter(Boolean) : [],
      comingSoon: comingSoon ?? true,
      paymentAmount: undefined as number | undefined,
      updatedAt: new Date().toISOString(),
    };

    const existing = await collection.findOne({ id: courseId });
    if (existing) {
      await collection.updateOne({ id: courseId }, { $set: courseData });
    } else {
      const count = await collection.countDocuments();
      await collection.insertOne({
        ...courseData,
        order: count,
        createdAt: new Date().toISOString(),
      });
    }

    // ── Centralized payments sync ──────────────────────────────────
    // Auto-provisions (or keeps in sync) the matching payment_items
    // record — slug `course-<slug>` — so this course immediately shows
    // up in Admin → Payments with NO slug to type. First time it's
    // created it defaults to ₹0 (free) until an admin sets a real
    // price from the Payments panel; every later save here only syncs
    // title/description/active, never overwriting a price already set.
    try {
      const existingPaymentItem = await db.collection("payment_items").findOne({ slug: `course-${cleanSlug}` }, { projection: { amount: 1, active: 1 } });
      await syncPaymentItem(db, {
        sourceType: "course",
        sourceId: cleanSlug,
        title: courseData.name,
        description: courseData.summary,
        active: !courseData.comingSoon && (existingPaymentItem ? existingPaymentItem.active !== false : false),
      });
      const resolvedPaymentAmount = existingPaymentItem?.amount !== undefined ? Number(existingPaymentItem.amount) : undefined;
      if (resolvedPaymentAmount !== undefined && Number.isFinite(resolvedPaymentAmount)) {
        await collection.updateOne({ id: courseId }, { $set: { paymentAmount: resolvedPaymentAmount } });
        courseData.paymentAmount = resolvedPaymentAmount;
      }
    } catch (syncError) {
      console.error("Non-fatal: failed to sync course to payment_items:", syncError);
    }

    return NextResponse.json({ success: true, course: courseData });
  } catch (error: any) {
    console.error("Error saving Civil At Hand course:", error);
    return NextResponse.json({ error: "Failed to save Civil At Hand course." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authenticated = await hasModuleAccess("softwareCourses");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Course ID is required." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("software_courses");

    const course = await collection.findOne({ id });
    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    await collection.deleteOne({ _id: course._id });

    // Remove the course from the payment catalog too. Payment history is
    // intentionally untouched so existing financial/audit records remain valid.
    const slug = String(course.slug || "").trim().toLowerCase();
    if (slug) {
      await db.collection("payment_items").deleteOne({ slug: `course-${slug}` });
    }

    return NextResponse.json({ success: true, message: "Civil At Hand course deleted." });
  } catch (error: any) {
    console.error("Error deleting Civil At Hand course:", error);
    return NextResponse.json({ error: "Failed to delete course." }, { status: 500 });
  }
}
