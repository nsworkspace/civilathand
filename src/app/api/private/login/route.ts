import { NextResponse } from "next/server";
import {
  checkPassword,
  createSessionToken,
  isLocked,
  recordFailedAttempt,
  clearAttempts,
  PRIVATE_SESSION_COOKIE_NAME,
  PRIVATE_SESSION_MAX_AGE_SECONDS,
} from "@/lib/private-auth";

export const dynamic = "force-dynamic";

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  if (isLocked(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  let key: string | undefined;
  try {
    const body = await request.json();
    key = body?.key;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!key || typeof key !== "string") {
    return NextResponse.json({ error: "Key is required." }, { status: 400 });
  }

  if (!checkPassword(key)) {
    recordFailedAttempt(ip);
    return NextResponse.json({ error: "Incorrect verification key." }, { status: 401 });
  }

  clearAttempts(ip);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(PRIVATE_SESSION_COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PRIVATE_SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
