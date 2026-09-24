import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getBearerToken, verifyFirebaseIdToken } from "@/lib/firebase-verify";
import { cleanText, ensureCommunityIndexes } from "@/lib/community";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function GET(request: Request) {
  try {
    const verified = await verifyFirebaseIdToken(getBearerToken(request));
    if (!verified) return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const client = await clientPromise;
    const db = client.db(dbName);
    await ensureCommunityIndexes(db);
    const [profile, memberships] = await Promise.all([
      db.collection("users").findOne({ id: verified.uid }, { projection: { password: 0, _id: 0 } }),
      db.collection("community_members").find({ userId: verified.uid, status: { $in: ["active", "pending"] } }, { projection: { _id: 0, groupId: 1, status: 1 } }).toArray(),
    ]);
    return NextResponse.json({
      success: true,
      profile: profile || { id: verified.uid, email: verified.email || "" },
      groupIds: memberships.filter((m: any) => m.status === "active").map((m: any) => m.groupId),
      pendingGroupIds: memberships.filter((m: any) => m.status === "pending").map((m: any) => m.groupId),
    });
  } catch (error) {
    console.error("[community/me] GET failed:", error);
    return NextResponse.json({ success: false, error: "Unable to load your community profile." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const verified = await verifyFirebaseIdToken(getBearerToken(request));
    if (!verified || !verified.emailVerified) return NextResponse.json({ success: false, error: "Please verify your account first." }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const username = cleanText(body?.username, 32).toLowerCase().replace(/[^a-z0-9._-]/g, "");
    if (!/^[a-z][a-z0-9._-]{2,31}$/.test(username)) {
      return NextResponse.json({ success: false, error: "Username must be 3–32 characters and start with a letter." }, { status: 400 });
    }
    const client = await clientPromise;
    const db = client.db(dbName);
    await ensureCommunityIndexes(db);
    const collision = await db.collection("users").findOne({ username, id: { $ne: verified.uid } }, { projection: { _id: 1 } });
    if (collision) return NextResponse.json({ success: false, error: "That username is already taken." }, { status: 409 });
    const now = new Date().toISOString();
    await db.collection("users").updateOne(
      { id: verified.uid },
      { $set: { username, updatedAt: now }, $setOnInsert: { id: verified.uid, email: verified.email || "", createdAt: now } },
      { upsert: true }
    );
    await db.collection("community_members").updateMany({ userId: verified.uid }, { $set: { username, updatedAt: now } });
    return NextResponse.json({ success: true, username });
  } catch (error) {
    console.error("[community/me] PUT failed:", error);
    return NextResponse.json({ success: false, error: "Unable to update your username." }, { status: 500 });
  }
}
