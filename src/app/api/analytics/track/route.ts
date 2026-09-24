import { NextResponse } from "next/server";
import { isAnalyticsExcludedPage, trackEvent } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { type, page, label, meta } = body || {};

    if (!type || !page) {
      return NextResponse.json({ error: "type and page are required" }, { status: 400 });
    }

    const allowedTypes = ["visit", "click", "content_click", "share"];
    if (!allowedTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
    }

    const normalizedPage = String(page);
    if (isAnalyticsExcludedPage(normalizedPage)) return NextResponse.json({ success: true, skipped: true });
    await trackEvent({ type, page: normalizedPage, label, meta });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Analytics should never break the user experience — fail quietly.
    console.error("Error tracking analytics event:", error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
