import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";
import { cleanText, ensureCommunityIndexes, COMMUNITY_MESSAGE_RETENTION_DAYS } from "@/lib/community";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

async function getAdminDb() {
  if (!(await hasModuleAccess("community"))) throw new Error("UNAUTHORIZED");
  const client = await clientPromise;
  const db = client.db(dbName);
  await ensureCommunityIndexes(db);
  return db;
}

function serialize(m: any) {
  return {
    id: String(m.id),
    userId: String(m.userId || "admin"),
    username: String(m.username || "admin"),
    text: String(m.text || ""),
    linkUrl: String(m.linkUrl || ""),
    imageData: String(m.imageData || ""),
    createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt || ""),
    edited: !!m.edited,
  };
}

function errorResponse(error: any, fallback: string) {
  const unauthorized = error?.message === "UNAUTHORIZED";
  return NextResponse.json({ success: false, error: unauthorized ? "Unauthorized." : fallback }, { status: unauthorized ? 401 : 500 });
}

async function findChannel(db: any, channelId: string) {
  return db.collection("community_groups").findOne({ id: channelId, type: "channel" }, { projection: { id: 1, name: 1, active: 1 } });
}

export async function GET(_request: Request, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    const { channelId } = await params;
    const db = await getAdminDb();
    const channel = await findChannel(db, channelId);
    if (!channel) return NextResponse.json({ success: false, error: "Channel not found." }, { status: 404 });
    const cutoff = new Date(Date.now() - COMMUNITY_MESSAGE_RETENTION_DAYS * 86400000);
    const messages = await db.collection("community_messages").find({ groupId: channelId, createdAt: { $gte: cutoff } }).sort({ createdAt: -1 }).limit(300).toArray();
    return NextResponse.json({ success: true, channel: { id: channel.id, name: channel.name }, messages: messages.reverse().map(serialize) });
  } catch (error) {
    console.error("[community/admin/channel-messages] GET failed:", error);
    return errorResponse(error, "Unable to load channel messages.");
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    const { channelId } = await params;
    const db = await getAdminDb();
    const channel = await findChannel(db, channelId);
    if (!channel || channel.active === false) return NextResponse.json({ success: false, error: "Channel not found or archived." }, { status: 404 });
    const body = await request.json().catch(() => ({}));
    const text = cleanText(body?.text, 4000);
    const linkUrl = cleanText(body?.linkUrl, 800);
    const imageData = cleanText(body?.imageData, 1500000);
    if (imageData && !/^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(imageData)) return NextResponse.json({ success: false, error: "Only JPEG, PNG, WEBP or GIF images are allowed." }, { status: 400 });
    if (imageData.length > 1500000) return NextResponse.json({ success: false, error: "Image must be 1 MB or smaller." }, { status: 413 });
    if (linkUrl && !/^https?:\/\//i.test(linkUrl)) return NextResponse.json({ success: false, error: "Links must start with http:// or https://." }, { status: 400 });
    if (!text && !linkUrl && !imageData) return NextResponse.json({ success: false, error: "Message cannot be empty." }, { status: 400 });
    const now = new Date();
    const document = {
      id: `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`,
      groupId: channelId,
      userId: "admin",
      username: "admin",
      text,
      linkUrl,
      imageData,
      createdAt: now,
      expiresAt: new Date(now.getTime() + COMMUNITY_MESSAGE_RETENTION_DAYS * 86400000),
      reactions: {},
      reactionUsers: {},
      replyTo: null,
    };
    await db.collection("community_messages").insertOne(document);
    return NextResponse.json({ success: true, message: serialize(document) });
  } catch (error) {
    console.error("[community/admin/channel-messages] POST failed:", error);
    return errorResponse(error, "Unable to publish channel message.");
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    const { channelId } = await params;
    const db = await getAdminDb();
    const channel = await findChannel(db, channelId);
    if (!channel) return NextResponse.json({ success: false, error: "Channel not found." }, { status: 404 });
    const body = await request.json().catch(() => ({}));
    const messageId = cleanText(body?.messageId, 120);
    const action = cleanText(body?.action, 20).toLowerCase();
    if (!messageId) return NextResponse.json({ success: false, error: "Message ID is required." }, { status: 400 });
    const message = await db.collection("community_messages").findOne({ id: messageId, groupId: channelId });
    if (!message) return NextResponse.json({ success: false, error: "Message not found." }, { status: 404 });
    if (action === "delete") {
      await db.collection("community_messages").deleteOne({ id: messageId, groupId: channelId });
      return NextResponse.json({ success: true });
    }
    if (action === "edit") {
      const text = cleanText(body?.text, 4000);
      const linkUrl = cleanText(body?.linkUrl, 800);
      const imageData = cleanText(body?.imageData, 1500000);
      if (imageData && !/^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(imageData)) return NextResponse.json({ success: false, error: "Only JPEG, PNG, WEBP or GIF images are allowed." }, { status: 400 });
      if (imageData.length > 1500000) return NextResponse.json({ success: false, error: "Image must be 1 MB or smaller." }, { status: 413 });
      if (linkUrl && !/^https?:\/\//i.test(linkUrl)) return NextResponse.json({ success: false, error: "Links must start with http:// or https://." }, { status: 400 });
      if (!text && !linkUrl && !imageData) return NextResponse.json({ success: false, error: "Message cannot be empty." }, { status: 400 });
      const updates = { text, linkUrl, imageData, edited: true, updatedAt: new Date() };
      await db.collection("community_messages").updateOne({ id: messageId, groupId: channelId }, { $set: updates });
      return NextResponse.json({ success: true, message: serialize({ ...message, ...updates }) });
    }
    return NextResponse.json({ success: false, error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    console.error("[community/admin/channel-messages] PATCH failed:", error);
    return errorResponse(error, "Unable to update channel message.");
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ channelId: string }> }) {
  const body = await request.json().catch(() => ({}));
  return PATCH(new Request(request.url, { method: "PATCH", headers: request.headers, body: JSON.stringify({ ...body, action: "delete" }) }), context);
}
