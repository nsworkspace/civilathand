import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";
import { getAnalyticsSummary, getMonthlyRevenueTrend } from "@/lib/analytics";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function GET() {
  try {
    const authenticated = await hasModuleAccess("analytics");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);

    const [engagement, monthlyRevenueTrend, blogs, invoicesPaid, projects, leads] = await Promise.all([
      getAnalyticsSummary(),
      getMonthlyRevenueTrend(),
      db.collection("blogs").find({}).toArray(),
      db.collection("invoices").find({ status: "Paid" }).toArray(),
      db.collection("projects").find({}).toArray(),
      db.collection("leads").find({}).toArray(),
    ]);

    const totalBlogViews = blogs.reduce((s: number, b: any) => s + (b.views || 0), 0);
    const totalBlogShares = blogs.reduce((s: number, b: any) => s + (b.shares || 0), 0);
    const totalRevenue = invoicesPaid.reduce((s: number, i: any) => s + (i.amount || 0), 0);
    const totalProjects = projects.length;

    // Rough distinct-client count from lead/project emails, kept as a fallback
    // for pages of the dashboard that don't already compute this client-side.
    const clientEmails = new Set<string>();
    leads.forEach((l: any) => l.email && clientEmails.add(String(l.email).toLowerCase()));
    projects.forEach((p: any) => p.clientEmail && clientEmails.add(String(p.clientEmail).toLowerCase()));
    const totalClients = clientEmails.size;

    return NextResponse.json({
      ...engagement,
      totalShares: engagement.totalShares + totalBlogShares,
      totalBlogViews,
      totalBlogShares,
      totalRevenue,
      totalProjects,
      totalClients,
      monthlyRevenueTrend,
    });
  } catch (error) {
    console.error("Error building analytics summary:", error);
    return NextResponse.json({ error: "Failed to load analytics summary" }, { status: 500 });
  }
}
