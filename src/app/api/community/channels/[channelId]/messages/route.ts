import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getBearerToken, verifyFirebaseIdToken } from "@/lib/firebase-verify";
import { cleanText, ensureCommunityIndexes, COMMUNITY_MESSAGE_RETENTION_DAYS } from "@/lib/community";
import { getAdminSession, hasModuleAccess } from "@/lib/auth";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

async function serialize(m: any) {
  return { id: String(m.id), userId: String(m.userId || ""), username: String(m.username || "admin"), text: String(m.text || ""), linkUrl: String(m.linkUrl || ""), imageData: String(m.imageData || ""), createdAt: m.createdAt };
}

export async function GET(request: Request, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    const { channelId } = await params;
    const client = await clientPromise;
    const db = client.db(dbName);
    await ensureCommunityIndexes(db);
    const verified = await verifyFirebaseIdToken(getBearerToken(request));
    const admin = await hasModuleAccess("community");
    if (!admin) {
      if (!verified) return NextResponse.json({ success: false, error: "Sign in to view this channel." }, { status: 401 });
      const member = await db.collection("community_members").findOne({ groupId: channelId, userId: verified.uid, status: "active" }, { projection: { _id: 1 } });
      if (!member) return NextResponse.json({ success: false, error: "Join this channel to view its updates." }, { status: 403 });
    }
    const docs = await db.collection("community_messages").find({ groupId: channelId, expiresAt: { $gt: new Date() } }).sort({ createdAt: 1 }).limit(300).toArray();
    return NextResponse.json({ success: true, messages: await Promise.all(docs.map(serialize)) });
  } catch (error) {
    console.error("[community/channels/messages] GET failed:", error);
    return NextResponse.json({ success: false, error: "Unable to load channel updates." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    if (!(await hasModuleAccess("community"))) return NextResponse.json({ success: false, error: "Only community admins can publish channel updates." }, { status: 403 });
    const adminSession = await getAdminSession();
    if (!adminSession) return NextResponse.json({ success: false, error: "Admin session required." }, { status: 401 });
    const { channelId } = await params;
    const client = await clientPromise;
    const db = client.db(dbName);
    await ensureCommunityIndexes(db);
    const channel = await db.collection("community_groups").findOne({ id: channelId, type: "channel", active: { $ne: false } });
    if (!channel) return NextResponse.json({ success: false, error: "Channel not found." }, { status: 404 });
    const body = await request.json().catch(() => ({}));
    const text = cleanText(body?.text, 4000);
    const linkUrl = cleanText(body?.linkUrl, 800);
    const imageData = cleanText(body?.imageData, 1500000);
    if (linkUrl && !/^https?:\/\//i.test(linkUrl)) return NextResponse.json({ success: false, error: "Links must start with http:// or https://." }, { status: 400 });
    if (imageData && !/^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(imageData)) return NextResponse.json({ success: false, error: "Only JPEG, PNG, WEBP or GIF images are allowed." }, { status: 400 });
    if (!text && !linkUrl && !imageData) return NextResponse.json({ success: false, error: "Channel update cannot be empty." }, { status: 400 });
    const now = new Date();
    const document = {
      id: `channel_msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`,
      groupId: channelId,
      userId: `admin:${adminSession.username || "community"}`,
      username: String(adminSession.username || "community-admin"),
      text, linkUrl, imageData,
      createdAt: now,
      expiresAt: new Date(now.getTime() + COMMUNITY_MESSAGE_RETENTION_DAYS * 86400000),
      reactions: {}, reactionUsers: {}, channelPost: true,
    };
    await db.collection("community_messages").insertOne(document);
    await db.collection("community_groups").updateOne({ id: channelId }, { $set: { announcement: text || "New channel update", updatedAt: now.toISOString() } });
    return NextResponse.json({ success: true, message: await serialize(document) });
  } catch (error) {
    console.error("[community/channels/messages] POST failed:", error);
    return NextResponse.json({ success: false, error: "Unable to publish this channel update." }, { status: 500 });
  }
}
