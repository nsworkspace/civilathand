import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { cleanText, ensureCommunityIndexes } from "@/lib/community";
import { getBearerToken, verifyFirebaseIdToken } from "@/lib/firebase-verify";

const dbName = process.env.MONGODB_DB || "civil-at-hand";
const ONLINE_MS = 45_000;

/**
 * Return members for a room. The response keeps the original public fields
 * and also exposes the fields expected by the Community settings UI.
 */
export async function GET(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const verified = await verifyFirebaseIdToken(getBearerToken(request));
    if (!verified) return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });

    const { groupId } = await params;
    const client = await clientPromise;
    const db = client.db(dbName);
    await ensureCommunityIndexes(db);

    const viewerMembership = await db.collection("community_members").findOne(
      { groupId, userId: verified.uid, status: "active", banned: { $ne: true } },
      { projection: { _id: 1 } },
    );
    if (!viewerMembership) {
      return NextResponse.json({ success: false, error: "Join this group to view its members." }, { status: 403 });
    }

    const members = await db
      .collection("community_members")
      .find({ groupId, status: "active", banned: { $ne: true }, hiddenFromMembers: { $ne: true } })
      .sort({ joinedAt: 1 })
      .limit(500)
      .toArray();

    const ids = members.map((m: any) => String(m.userId)).filter(Boolean);
    const users = ids.length
      ? await db.collection("users").find(
          { id: { $in: ids } },
          { projection: { _id: 0, id: 1, name: 1, username: 1, profession: 1 } },
        ).toArray()
      : [];
    const userMap = new Map(users.map((u: any) => [String(u.id), u]));

    const now = Date.now();
    const presenceRows = ids.length
      ? await db.collection("community_presence").find(
          { groupId, userId: { $in: ids }, activeUntil: { $gt: new Date() } },
          { projection: { _id: 0, userId: 1, activeUntil: 1 } },
        ).toArray()
      : [];
    const onlineIds = new Set(
      presenceRows
        .filter((row: any) => new Date(row.activeUntil || 0).getTime() > now)
        .map((row: any) => String(row.userId)),
    );

    const result = members.map((m: any) => {
      const userId = String(m.userId || "");
      const u: any = userMap.get(userId) || {};
      const roleRaw = String(m.role || "Member");
      const role = ["Owner", "Admin", "Member"].includes(roleRaw) ? roleRaw : "Member";
      const username = cleanText(u.username || m.username, 64) || "member";
      return {
        // New UI-compatible fields.
        id: userId,
        role,
        online: onlineIds.has(userId),
        // Existing fields retained for backwards compatibility.
        userId,
        username,
        profession: String(u.profession || ""),
        joinedAt: m.joinedAt,
        isSelf: userId === verified.uid,
        name: String(u.name || "Community member"),
      };
    });

    const search = cleanText(new URL(request.url).searchParams.get("search"), 120).toLowerCase();
    const filtered = search
      ? result.filter((m: any) =>
          [m.username, m.name, m.profession, m.role].some((v) => String(v || "").toLowerCase().includes(search)),
        )
      : result;

    return NextResponse.json({ success: true, members: filtered });
  } catch (error) {
    console.error("[community/members] failed:", error);
    return NextResponse.json({ success: false, error: "Unable to load group members." }, { status: 500 });
  }
}
