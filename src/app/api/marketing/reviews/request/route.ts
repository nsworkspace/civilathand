import { NextResponse } from "next/server";
import { sendReviewRequestEmail } from "@/lib/reviewRequests";

const recent = new Map<string, number>();

export async function POST(request: Request) {
  try {
    const reviewUrl = process.env.GOOGLE_REVIEW_URL?.trim();
    if (!reviewUrl) return NextResponse.json({ error: "GOOGLE_REVIEW_URL is not configured." }, { status: 503 });

    const body = await request.json().catch(() => ({}));
    const to = String(body?.email || "").trim().toLowerCase();
    const clientName = String(body?.name || "").trim();
    if (!to || !to.includes("@")) return NextResponse.json({ error: "A valid client email is required." }, { status: 400 });

    const previous = recent.get(to) || 0;
    if (Date.now() - previous < 14 * 24 * 60 * 60 * 1000) return NextResponse.json({ error: "A review request was already sent recently." }, { status: 429 });

    const result = await sendReviewRequestEmail({ to, clientName, reviewUrl });
    if (!result.sent) return NextResponse.json({ error: result.reason }, { status: 503 });
    recent.set(to, Date.now());
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("review request error", error);
    return NextResponse.json({ error: "Unable to send review request." }, { status: 500 });
  }
}
