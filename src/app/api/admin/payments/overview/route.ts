import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";

// One-call summary for the top of Admin → Payments: total revenue,
// revenue this month, count by category (course/test/mentorship/custom/
// manual/invoice), refund totals, and the best-selling items — so an
// admin can see the health of every revenue stream on the site without
// hopping between the Courses / Mentorship tabs.
export async function GET() {
  try {
    const authenticated = await hasModuleAccess("paymentHistory");
    if (!authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await clientPromise;
    const db = client.db(dbName);
    const events = await db.collection("payment_events").find({}).toArray();

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    let totalRevenue = 0;
    let monthRevenue = 0;
    let refundedTotal = 0;
    let refundedCount = 0;
    const byKind: Record<string, { count: number; revenue: number }> = {};

    for (const e of events as any[]) {
      const amount = Math.max(0, Number(e.amount) || 0);
      const refundAmount = Math.min(amount, Math.max(0, Number(e.refundAmount) || 0));
      const netAmount = Math.max(0, amount - refundAmount);
      const paidAt = e.paidAt ? new Date(e.paidAt) : null;

      totalRevenue += netAmount;
      if (paidAt && paidAt >= monthStart) monthRevenue += netAmount;
      if (refundAmount > 0) {
        refundedTotal += refundAmount;
        refundedCount += 1;
      }

      const kind = e.kind || "other";
      if (!byKind[kind]) byKind[kind] = { count: 0, revenue: 0 };
      byKind[kind].count += 1;
      byKind[kind].revenue += netAmount;
    }

    const items = await db
      .collection("payment_items")
      .find({})
      .sort({ purchaseCount: -1 })
      .limit(5)
      .toArray();

    return NextResponse.json(
      {
        totalRevenue,
        monthRevenue,
        refundedTotal,
        refundedCount,
        totalEvents: events.length,
        byKind,
        topItems: items.map(({ _id, ...r }) => r),
      },
      { headers: { "Cache-Control": "no-store, no-cache" } }
    );
  } catch (error) {
    console.error("Error building payments overview:", error);
    return NextResponse.json({ error: "Failed to load payments overview." }, { status: 500 });
  }
}
