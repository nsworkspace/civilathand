import { NextResponse } from "next/server";
import { PROFILE_AVATAR_OPTIONS } from "@/lib/profile-avatar-options";

export async function GET() {
  return NextResponse.json(
    { profileAvatarOptions: PROFILE_AVATAR_OPTIONS },
    { status: 200, headers: { "Cache-Control": "public, max-age=31536000, immutable" } },
  );
}
