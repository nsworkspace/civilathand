import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getBearerToken, verifyFirebaseIdToken } from "@/lib/firebase-verify";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function GET(request: Request) {
  try {
    const user = await verifyFirebaseIdToken(getBearerToken(request));
    if (!user?.uid || !user.email || !user.emailVerified) {
      return NextResponse.json({ error: "Please sign in with a verified account." }, { status: 401 });
    }
    const email = user.email.trim().toLowerCase();
    const client = await clientPromise;
    const db = client.db(dbName);
    const requests = await db.collection("service_payment_requests").find({
      $or: [{ userId: user.uid }, { clientEmail: email }],
    }).sort({ createdAt: -1 }).limit(50).toArray();
    return NextResponse.json({ requests: requests.map(({ _id, ...request }) => request) }, { headers: { "Cache-Control": "no-store, no-cache" } });
  } catch (error) {
    console.error("Error loading service payment requests:", error);
    return NextResponse.json({ error: "Failed to load payment requests." }, { status: 500 });
  }
}
