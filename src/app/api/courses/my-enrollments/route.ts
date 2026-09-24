import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyFirebaseIdToken, getBearerToken } from "@/lib/firebase-verify";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function GET(request: Request) {
  try {
    const verified = await verifyFirebaseIdToken(getBearerToken(request));
    if (!verified?.email) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }
    const email = verified.email.trim().toLowerCase();

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("course_enrollments");

    const enrollments = await collection
      .find({ userEmail: email.trim().toLowerCase() })
      .toArray();

    const formattedEnrollments = enrollments.map(({ _id, ...rest }) => rest);
    formattedEnrollments.sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime());

    return NextResponse.json({ success: true, enrollments: formattedEnrollments }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      }
    });
  } catch (error) {
    console.error("Error fetching course enrollments:", error);
    return NextResponse.json({ error: "Failed to fetch course enrollments." }, { status: 500 });
  }
}
