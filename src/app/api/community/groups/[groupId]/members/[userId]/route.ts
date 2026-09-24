import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getBearerToken, verifyFirebaseIdToken } from "@/lib/firebase-verify";
import { ensureCommunityIndexes } from "@/lib/community";
import { getProfileAvatarOption, normalizeProfileAvatarId } from "@/lib/profile-avatar-options";

const dbName = process.env.MONGODB_DB || "civil-at-hand";
function avatarFields(user: any) { const id = normalizeProfileAvatarId(user?.profileImageId); const option = getProfileAvatarOption(id); return { profileImageId: option?.id || id, profileImageUrl: option?.imageUrl || user?.profileImageUrl || "" }; }

export async function GET(request: Request, { params }: { params: Promise<{ groupId: string; userId: string }> }) {
  try {
    const verified = await verifyFirebaseIdToken(getBearerToken(request));
    if (!verified) return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const { groupId, userId } = await params;
    const client = await clientPromise;
    const db = client.db(dbName);
    await ensureCommunityIndexes(db);
    const membership = await db.collection("community_members").findOne({ groupId, userId, status: "active" }, { projection: { _id: 0, id: 1 } });
    const viewerMembership = await db.collection("community_members").findOne({ groupId, userId: verified.uid, status: "active" }, { projection: { _id: 0, id: 1 } });
    if (!membership || !viewerMembership) return NextResponse.json({ success: false, error: "Profile unavailable in this room." }, { status: 404 });
    const isSelf = userId === verified.uid;
    const user: any = await db.collection("users").findOne(
      { id: userId },
      {
        projection: isSelf
          ? { _id: 0, name: 1, username: 1, profession: 1, email: 1, phone: 1, address: 1, joinPurpose: 1, communityProfileCompleted: 1, profileImageId: 1, profileImageUrl: 1 }
          : { _id: 0, name: 1, username: 1, profession: 1, communityProfileCompleted: 1, profileImageId: 1, profileImageUrl: 1 },
      },
    );
    if (!user) return NextResponse.json({ success: false, error: "Member profile not found." }, { status: 404 });
    const profile = {
      name: String(user.name || "Community member"),
      username: String(user.username || "member"),
      profession: String(user.profession || ""),
      isSelf,
      ...avatarFields(user),
      ...(isSelf
        ? {
            email: String(user.email || verified.email || ""),
            phone: String(user.phone || ""),
            address: String(user.address || ""),
            joinPurpose: String(user.joinPurpose || ""),
          }
        : {}),
    };
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("[community/member-profile] failed:", error);
    return NextResponse.json({ success: false, error: "Unable to load member profile." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ groupId: string; userId: string }> }) {
  try {
    const verified = await verifyFirebaseIdToken(getBearerToken(request));
    if (!verified) return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    const { groupId, userId } = await params;
    if (userId !== verified.uid) return NextResponse.json({ success: false, error: "You can only leave a group on your own behalf." }, { status: 403 });
    const client = await clientPromise;
    const db = client.db(dbName);
    await ensureCommunityIndexes(db);
    const result = await db.collection("community_members").deleteOne({ groupId, userId: verified.uid });
    if (!result.deletedCount) return NextResponse.json({ success: false, error: "You are not a member of this group." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[community/member-leave] failed:", error);
    return NextResponse.json({ success: false, error: "Unable to leave this group." }, { status: 500 });
  }
}
