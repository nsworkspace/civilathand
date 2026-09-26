import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { syncPaymentItem } from "@/lib/paymentItemSync";
import { courseItemSlug } from "@/lib/paymentSlugs";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("software_courses");

    // The database is the only source of truth for public courses.
    // `source: "admin"` is written by Admin → Courses, so demo/static
    // catalog records can never reappear on the public page.
    const courses = await collection
      .find({ source: "admin" })
      .sort({ order: 1, createdAt: 1 })
      .toArray();

    const formatted: any[] = [];
    for (const course of courses as any[]) {
      if (!course.slug) continue;

      const itemSlug = courseItemSlug(String(course.slug));
      let item = await db.collection("payment_items").findOne({ slug: itemSlug });
      if (!item) {
        await syncPaymentItem(db, {
          sourceType: "course",
          sourceId: String(course.slug),
          title: course.name || course.title || String(course.slug),
          description: course.summary || course.subtitle || "",
          active: course.comingSoon !== true,
        });
        item = await db.collection("payment_items").findOne({ slug: itemSlug });
      }

      const { _id, ...rest } = course as any;
      formatted.push({
        ...rest,
        paymentAmount: Number(item?.amount || 0),
        paymentActive: item ? item.active !== false : false,
        paymentItemSlug: itemSlug,
      });
    }

    return NextResponse.json(
      { courses: formatted },
      { headers: { "Cache-Control": "no-store, no-cache" } }
    );
  } catch (error: any) {
    console.error("Error fetching NS Construction courses:", error);
    return NextResponse.json({ courses: [] });
  }
}
