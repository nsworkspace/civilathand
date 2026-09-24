import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";
import { ensurePaymentEventIndexes } from "@/lib/paymentFulfillment";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

// Cross-site "Recent Payments" feed for the admin Payments panel — every
// course enrollment, mentorship signup, invoice
// payment, and custom payment-item purchase, newest first.
export async function GET(request: Request) {
  try {
    const authenticated = await hasModuleAccess("paymentHistory");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get("limit"));
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 50;

    const client = await clientPromise;
    const db = client.db(dbName);
    await ensurePaymentEventIndexes(db);

    const events = await db
      .collection("payment_events")
      .find({}, { projection: { accessToken: 0 } })
      .sort({ paidAt: -1 })
      .limit(limit)
      .toArray();

    const formatted = events.map(({ _id, ...rest }) => rest);
    return NextResponse.json({ events: formatted }, { headers: { "Cache-Control": "no-store, no-cache" } });
  } catch (error) {
    console.error("Error fetching payment events:", error);
    return NextResponse.json({ error: "Failed to fetch payment events." }, { status: 500 });
  }
}
