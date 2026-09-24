import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function GET() {
  try {
    const allowed = await hasModuleAccess("softwareCourses");
    if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const client = await clientPromise;
    const db = client.db(dbName);
    const enrollments = await db.collection("course_enrollments").find({}).sort({ enrolledAt: -1 }).limit(500).toArray();
    return NextResponse.json({ enrollments: enrollments.map(({ _id, ...item }) => item) }, { headers: { "Cache-Control": "no-store, no-cache" } });
  } catch (error) {
    console.error("Error loading course enrollments:", error);
    return NextResponse.json({ error: "Failed to load course enrollments." }, { status: 500 });
  }
}
