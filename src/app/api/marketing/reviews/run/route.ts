import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { sendReviewRequestEmail } from "@/lib/reviewRequests";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization") || "";
  if (!secret || auth !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reviewUrl = process.env.GOOGLE_REVIEW_URL?.trim();
  if (!reviewUrl) return NextResponse.json({ sent: 0, skipped: true, reason: "GOOGLE_REVIEW_URL is not configured." });

  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const projects = await db.collection("projects").find({
      status: "Completed",
      completedAt: { $lte: cutoff },
      clientEmail: { $type: "string" },
      reviewRequestedAt: { $exists: false },
    }).limit(25).toArray();

    let sent = 0;
    for (const project of projects as any[]) {
      const email = String(project.clientEmail || "").trim().toLowerCase();
      if (!email || !email.includes("@")) continue;
      const result = await sendReviewRequestEmail({ to: email, clientName: String(project.clientName || ""), reviewUrl });
      if (!result.sent) continue;
      await db.collection("projects").updateOne({ _id: project._id }, { $set: { reviewRequestedAt: new Date(), reviewRequestSource: "automated-14-day" } });
      sent += 1;
    }

    return NextResponse.json({ sent, checked: projects.length });
  } catch (error) {
    console.error("review automation error", error);
    return NextResponse.json({ error: "Review automation failed." }, { status: 500 });
  }
}
