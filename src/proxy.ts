import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * The admin page performs its own authenticated session check. The proxy is
 * intentionally kept lightweight so it never blocks Firebase/public routes
 * or causes redirect loops. Security headers are configured centrally in
 * next.config.ts for every response.
 */
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: "/cah-expert-control/:path*",
};
