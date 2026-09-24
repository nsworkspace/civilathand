import { NextRequest, NextResponse } from "next/server";
import { getBearerToken, verifyFirebaseIdToken } from "@/lib/firebase-verify";

export async function GET(req: NextRequest) {
  try {
    const user = await verifyFirebaseIdToken(getBearerToken(req));
    if (!user) {
      return NextResponse.json({ authenticated: false, verified: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      verified: user.emailVerified,
      uid: user.uid,
      email: user.email,
    });
  } catch (error) {
    console.error("[auth/status] Error:", error);
    return NextResponse.json({ authenticated: false, verified: false }, { status: 500 });
  }
}
