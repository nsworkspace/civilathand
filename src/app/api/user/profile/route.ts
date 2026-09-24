import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifyFirebaseIdToken, getBearerToken } from "@/lib/firebase-verify";
import { PROFILE_AVATAR_OPTIONS, getProfileAvatarOption, normalizeProfileAvatarId } from "@/lib/profile-avatar-options";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

async function ensureProfileAvatarOptions(db: any) {
  const now = new Date().toISOString();
  await db.collection("profile_avatar_options").deleteMany({ category: { $in: ["civil-engineering", "profile-avatar"] } });
  await db.collection("profile_avatar_options").insertMany(PROFILE_AVATAR_OPTIONS.map((option) => ({ ...option, createdAt: now, updatedAt: now })));
}

function stripMongoId<T extends Record<string, any>>(doc: T) {
  const { _id: _ignoredId, ...safeDoc } = doc;
  return safeDoc;
}

async function getProfileAvatarOptions(db: any) {
  try {
    await ensureProfileAvatarOptions(db);
    const rows = await db.collection("profile_avatar_options").find({ active: true, category: "profile-avatar" }).sort({ order: 1 }).toArray();
    return rows.length === PROFILE_AVATAR_OPTIONS.length ? rows.map(stripMongoId) : PROFILE_AVATAR_OPTIONS;
  } catch (error) {
    console.error("Profile avatar option seed/load failed; using safe fallback:", error);
    return PROFILE_AVATAR_OPTIONS;
  }
}

async function upsertProfile(request: Request) {
  const body = await request.json();
  const { id, name, email, phone, company, address, userType, profileImageId } = body;
  if (!id) return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  const token = getBearerToken(request);
  const verified = await verifyFirebaseIdToken(token);
  if (!verified || verified.uid !== id) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const client = await clientPromise;
  const db = client.db(dbName);
  const collection = db.collection("users");
  const profileAvatarOptions = await getProfileAvatarOptions(db);
  const normalizedRequestedAvatarId = profileImageId === undefined ? undefined : normalizeProfileAvatarId(profileImageId);
  const selectedAvatar = normalizedRequestedAvatarId ? getProfileAvatarOption(normalizedRequestedAvatarId) : null;
  if (profileImageId !== undefined && !selectedAvatar) return NextResponse.json({ error: "Please select a valid profile photo." }, { status: 400 });

  const now = new Date().toISOString();
  const setFields: Record<string, any> = { name, email: (email || verified.email || "").toLowerCase(), phone, company, address, updatedAt: now };
  if (userType !== undefined) setFields.userType = userType;
  if (selectedAvatar) {
    setFields.profileImageId = selectedAvatar.id;
    setFields.profileImageUrl = selectedAvatar.imageUrl;
  }

  const updateResult = await collection.findOneAndUpdate({ id }, { $set: setFields, $setOnInsert: { id, createdAt: now } }, { returnDocument: "after", upsert: true });
  const doc: any = updateResult && "value" in (updateResult as any) ? (updateResult as any).value : updateResult;
  if (!doc) return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });

  try {
    await db.collection("user_activity").insertOne({
      id: `act-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      userId: verified.uid,
      userEmail: verified.email || null,
      kind: "profile",
      status: "success",
      message: "Profile details updated.",
      createdAt: now,
    });
  } catch (activityError) {
    console.error("Non-fatal: failed to record profile activity:", activityError);
  }

  const { password: _pw, _id, ...safeUser } = doc;
  const normalizedStoredAvatar = getProfileAvatarOption(safeUser.profileImageId);
  if (normalizedStoredAvatar) {
    safeUser.profileImageId = normalizedStoredAvatar.id;
    safeUser.profileImageUrl = normalizedStoredAvatar.imageUrl;
  }
  return NextResponse.json({ ...safeUser, profileAvatarOptions }, { status: 200 });
}

export async function POST(request: Request) {
  try { return await upsertProfile(request); }
  catch (error) { console.error("Error creating profile:", error); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function PUT(request: Request) {
  try { return await upsertProfile(request); }
  catch (error) { console.error("Error updating profile:", error); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function GET(request: Request) {
  try {
    const token = getBearerToken(request);
    const verified = await verifyFirebaseIdToken(token);
    if (!verified) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const client = await clientPromise;
    const db = client.db(dbName);
    const doc = await db.collection("users").findOne({ id: verified.uid });
    const profileAvatarOptions = await getProfileAvatarOptions(db);
    if (!doc) return NextResponse.json({ profile: null, profileAvatarOptions }, { status: 200 });
    const { password: _pw, _id, ...safeUser } = doc as any;
    const normalizedStoredAvatar = getProfileAvatarOption(safeUser.profileImageId);
    if (normalizedStoredAvatar) {
      safeUser.profileImageId = normalizedStoredAvatar.id;
      safeUser.profileImageUrl = normalizedStoredAvatar.imageUrl;
    }
    return NextResponse.json({ profile: safeUser, profileAvatarOptions }, { status: 200 });
  } catch (error) {
    console.error("Error loading profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
