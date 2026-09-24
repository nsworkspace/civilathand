import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getBearerToken, verifyFirebaseIdToken } from "@/lib/firebase-verify";
import { ensureCommunityIndexes } from "@/lib/community";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function GET(request: Request) {
  try {
    const verified = await verifyFirebaseIdToken(getBearerToken(request));
    if (!verified) return NextResponse.json({ success: false, error: "Sign in to view your joined spaces." }, { status: 401 });
    const client = await clientPromise;
    const db = client.db(dbName);
    await ensureCommunityIndexes(db);
    const memberships = await db.collection("community_members").find(
      { userId: verified.uid, banned: { $ne: true }, status: { $in: ["active", "pending"] } },
      { projection: { _id: 0, groupId: 1, status: 1, role: 1 } }
    ).toArray();
    const ids = memberships.map((m: any) => String(m.groupId));
    if (!ids.length) return NextResponse.json({ success: true, spaces: [], groups: [], channels: [] });
    const statusMap = new Map(memberships.map((m: any) => [String(m.groupId), m.status === "active" ? "active" : "pending"]));
    const roleMap = new Map(memberships.map((m: any) => [String(m.groupId), String(m.role || "Member")]));
    const activeIds = memberships.filter((m: any) => m.status === "active").map((m: any) => String(m.groupId));
    const groups = await db.collection("community_groups").find({ id: { $in: ids }, active: { $ne: false } }).sort({ updatedAt: -1, createdAt: -1 }).toArray();
    const latest = activeIds.length ? await db.collection("community_messages").aggregate([
      { $match: { groupId: { $in: activeIds }, expiresAt: { $gt: new Date() } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$groupId", message: { $first: "$$ROOT" } } }
    ]).toArray() : [];
    const latestMap = new Map(latest.map((row: any) => [String(row._id), row.message]));
    const spaces = groups.map((g: any) => {
      const id = String(g.id);
      const status = statusMap.get(id) || "pending";
      const m = status === "active" ? latestMap.get(id) : null;
      return {
        id,
        name: String(g.name || "Community space"),
        description: String(g.description || ""),
        category: String(g.category || "Community"),
        imageUrl: String(g.imageUrl || ""),
        announcement: String(g.announcement || ""),
        rules: String(g.rules || ""),
        type: g.type === "channel" ? "channel" : "group",
        membershipStatus: status,
        role: roleMap.get(id) || "Member",
        lastMessage: m ? {
          id: String(m.id), userId: String(m.userId || ""), username: String(m.username || "member"),
          text: String(m.text || ""), linkUrl: String(m.linkUrl || ""), imageData: String(m.imageData || ""), createdAt: m.createdAt
        } : null
      };
    });
    return NextResponse.json({ success: true, spaces, groups: spaces.filter((s: any) => s.type === "group"), channels: spaces.filter((s: any) => s.type === "channel") });
  } catch (error) {
    console.error("[community/my-spaces] GET failed:", error);
    return NextResponse.json({ success: false, error: "Unable to load your joined spaces." }, { status: 500 });
  }
}
