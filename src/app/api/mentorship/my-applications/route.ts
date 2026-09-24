import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getBearerToken, verifyFirebaseIdToken } from "@/lib/firebase-verify";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function GET(request: Request) {
  try {
    const verified = await verifyFirebaseIdToken(getBearerToken(request));
    if (!verified?.uid || !verified.email || !verified.emailVerified) {
      return NextResponse.json({ error: "Please sign in with a verified account." }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const applications = await db.collection("mentorship_applications")
      .find({
        $or: [
          { userId: verified.uid },
          { email: verified.email.trim().toLowerCase() },
        ],
      })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, applications: applications.map(({ _id, ...rest }) => rest) }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate" },
    });
  } catch (error) {
    console.error("Error fetching user mentorship applications:", error);
    return NextResponse.json({ error: "Failed to fetch mentorship applications." }, { status: 500 });
  }
}
