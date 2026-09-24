import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";

function csvEscape(value: any): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: Request) {
  try {
    const authenticated = await hasModuleAccess("paymentHistory");
    if (!authenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get("days")) || 0; // 0 = all time

    const client = await clientPromise;
    const db = client.db(dbName);

    const filter: Record<string, any> = {};
    if (days > 0) {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      filter.paidAt = { $gte: since };
    }

    const events = await db.collection("payment_events").find(filter).sort({ paidAt: -1 }).toArray();

    const headers = [
      "Date", "Kind", "Title", "Amount (INR)", "Free", "Method", "Payer Name", "Payer Contact",
      "Razorpay Payment ID", "Coupon", "Refunded", "Refund Amount", "Refund Reason",
    ];
    const rows = events.map((e: any) => [
      e.paidAt || "",
      e.kind || "",
      e.itemTitle || e.title || "",
      e.amount ?? 0,
      e.free ? "Yes" : "No",
      e.manualMethod || (e.razorpayPaymentId ? "razorpay" : ""),
      e.payerName || "",
      e.payerContact || "",
      e.razorpayPaymentId || "",
      e.couponCode || "",
      e.refunded ? "Yes" : "No",
      e.refundAmount ?? "",
      e.refundReason || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="civil-at-hand-payments-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store, no-cache",
      },
    });
  } catch (error) {
    console.error("Error exporting payments CSV:", error);
    return NextResponse.json({ error: "Failed to export payments." }, { status: 500 });
  }
}
