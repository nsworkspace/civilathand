import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.set("cah_admin_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // delete cookie
      path: "/"
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
