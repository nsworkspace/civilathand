import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAdminSession();
    return NextResponse.json(
      {
        authenticated: !!session,
        role: session?.role || null,
        username: session?.username || null,
        permissions: session?.role === "superadmin" ? "all" : session?.permissions || [],
        expiresAt: session?.exp || null,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    console.error("Session route error:", error);
    return NextResponse.json({ authenticated: false, role: null, username: null, permissions: [] }, { status: 500 });
  }
}
