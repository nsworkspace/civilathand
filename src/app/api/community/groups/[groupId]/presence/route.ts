import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getBearerToken, verifyFirebaseIdToken } from "@/lib/firebase-verify";
import { cleanText, ensureCommunityIndexes } from "@/lib/community";

const dbName = process.env.MONGODB_DB || "civil-at-hand";
const ONLINE_MS = 45_000;
const TYPING_MS = 3_000;

export async function GET(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const verified = await verifyFirebaseIdToken(getBearerToken(request));
    if (!verified) return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const { groupId } = await params;
    const client = await clientPromise;
    const db = client.db(dbName);
    await ensureCommunityIndexes(db);
    const member = await db.collection("community_members").findOne({ groupId, userId: verified.uid, status: "active" }, { projection: { _id: 1 } });
    if (!member) return NextResponse.json({ success: false, error: "Join this group to view presence." }, { status: 403 });
    const now = new Date();
    const rows = await db.collection("community_presence").find({ groupId, activeUntil: { $gt: now } }, { projection: { _id: 0, userId: 1, username: 1, typingUntil: 1 } }).limit(500).toArray();
    return NextResponse.json({ success: true, onlineCount: rows.length, typingUsers: rows.filter((r: any) => new Date(r.typingUntil || 0).getTime() > now.getTime() && String(r.userId) !== verified.uid).map((r: any) => String(r.username || "member")) });
  } catch (error) {
    console.error("[community/presence] GET failed:", error);
    return NextResponse.json({ success: false, error: "Unable to load presence." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const verified = await verifyFirebaseIdToken(getBearerToken(request));
    if (!verified) return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const { groupId } = await params;
    const body = await request.json().catch(() => ({}));
    const typing = body?.typing === true;
    const client = await clientPromise;
    const db = client.db(dbName);
    await ensureCommunityIndexes(db);
    const member = await db.collection("community_members").findOne({ groupId, userId: verified.uid, status: "active" }, { projection: { username: 1 } });
    if (!member) return NextResponse.json({ success: false, error: "Join this group before sending presence." }, { status: 403 });
    const now = new Date();
    const activeUntil = new Date(now.getTime() + ONLINE_MS);
    const typingUntil = typing ? new Date(now.getTime() + TYPING_MS) : new Date(0);
    await db.collection("community_presence").updateOne({ groupId, userId: verified.uid }, { $set: { username: cleanText(member.username, 32) || "member", activeUntil, typingUntil, updatedAt: now } }, { upsert: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[community/presence] POST failed:", error);
    return NextResponse.json({ success: false, error: "Unable to update presence." }, { status: 500 });
  }
}
