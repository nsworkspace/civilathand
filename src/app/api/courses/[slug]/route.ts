import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;

    if (!slug) {
      return NextResponse.json({ error: "Course slug is required." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("software_courses");

    const course = await collection.findOne({ slug, source: "admin" });

    if (!course) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const { _id, paymentLink: _legacyPaymentLink, priceAmount: _legacyPriceAmount, ...formatted } = course as any;
    const paymentItem = await db.collection("payment_items").findOne({ slug: `course-${slug}` });
    const courseWithPayment = {
      ...formatted,
      paymentAmount: Number(paymentItem?.amount ?? 0),
      paymentActive: paymentItem ? paymentItem.active !== false : false,
      paymentItemSlug: `course-${slug}`,
    };
    return NextResponse.json({ course: courseWithPayment }, { headers: { "Cache-Control": "no-store, no-cache" } });
  } catch (error: any) {
    console.error("Error fetching course detail:", error);
    return NextResponse.json({ error: "Failed to fetch course." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;

    if (!slug) {
      return NextResponse.json({ error: "Course slug is required." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("software_courses");

    const result = await collection.findOneAndUpdate(
      { slug, source: "admin" },
      { $inc: { views: 1 } },
      { returnDocument: "after" }
    );

    if (!result) {
      // Course is not an admin-created database record — nothing to increment.
      return NextResponse.json({ success: true, tracked: false });
    }

    const { _id, ...formatted } = result as any;
    return NextResponse.json({ success: true, tracked: true, course: formatted });
  } catch (error: any) {
    console.error("Error tracking course view:", error);
    return NextResponse.json({ error: "Failed to track view." }, { status: 500 });
  }
}
