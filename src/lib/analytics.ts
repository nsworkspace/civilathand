import clientPromise from "@/lib/mongodb";

const dbName = process.env.MONGODB_DB || "civil-at-hand";
const ANALYTICS_TTL_SECONDS = 30 * 24 * 60 * 60;
const ANALYTICS_EXCLUDED_PREFIXES = ["/cah-expert-control", "/private"];

export function isAnalyticsExcludedPage(page: string) {
  const normalized = String(page || "").split("?")[0].replace(/\/+$/, "") || "/";
  return ANALYTICS_EXCLUDED_PREFIXES.some((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`));
}
let analyticsTtlEnsured = false;

async function ensureAnalyticsRetention(db: any) {
  if (analyticsTtlEnsured) return;
  try {
    await Promise.all([
      db.collection("analytics_events").createIndex({ createdAt: 1 }, { expireAfterSeconds: ANALYTICS_TTL_SECONDS }),
      db.collection("analytics_pages").createIndex({ updatedAt: 1 }, { expireAfterSeconds: ANALYTICS_TTL_SECONDS }),
    ]);
    analyticsTtlEnsured = true;
  } catch (error) {
    console.warn("Analytics TTL indexes could not be ensured:", error);
  }
}

export type AnalyticsEventType = "visit" | "click" | "content_click" | "share";

export interface TrackEventInput {
  type: AnalyticsEventType;
  page: string;         // e.g. "/blog/my-post", "/mentorship"
  label?: string;        // optional human-readable label, e.g. blog title
  meta?: Record<string, unknown>;
}

/**
 * Records a single analytics event and keeps a rolled-up per-page counter
 * document in sync so the dashboard can read aggregates cheaply.
 */
export async function trackEvent(input: TrackEventInput) {
  const { type, page, label, meta } = input;
  if (!type || !page) {
    throw new Error("type and page are required");
  }
  if (isAnalyticsExcludedPage(page)) {
    return { success: true, skipped: true };
  }

  const client = await clientPromise;
  const db = client.db(dbName);

  const events = db.collection("analytics_events");
  const pages = db.collection("analytics_pages");
  await ensureAnalyticsRetention(db);

  const now = new Date();

  await events.insertOne({
    type,
    page,
    label: label || null,
    meta: meta || null,
    createdAt: now,
  });

  const inc: Record<string, number> = {};
  if (type === "visit") inc.visits = 1;
  else if (type === "click") inc.clicks = 1;
  else if (type === "content_click") inc.contentClicks = 1;
  else if (type === "share") inc.shares = 1;

  await pages.updateOne(
    { page },
    {
      $inc: inc,
      $set: { label: label || page, updatedAt: now },
      $setOnInsert: { page, createdAt: now },
    },
    { upsert: true }
  );

  return { success: true };
}

export interface AnalyticsSummary {
  totalPageVisits: number;
  totalClicks: number;
  totalContentClicks: number;
  totalShares: number;
  mostViewedPages: { page: string; label: string; visits: number }[];
  mostSharedPages: { page: string; label: string; shares: number }[];
  recentActivity: {
    type: AnalyticsEventType;
    page: string;
    label: string | null;
    createdAt: string;
  }[];
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const client = await clientPromise;
  const db = client.db(dbName);

  const pages = db.collection("analytics_pages");
  const events = db.collection("analytics_events");

  const allPages = (await pages.find({}).toArray()).filter((p: any) => !isAnalyticsExcludedPage(String(p.page || "")));

  const totalPageVisits = allPages.reduce((s, p: any) => s + (p.visits || 0), 0);
  const totalClicks = allPages.reduce((s, p: any) => s + (p.clicks || 0), 0);
  const totalContentClicks = allPages.reduce((s, p: any) => s + (p.contentClicks || 0), 0);
  const totalShares = allPages.reduce((s, p: any) => s + (p.shares || 0), 0);

  const mostViewedPages = [...allPages]
    .sort((a: any, b: any) => (b.visits || 0) - (a.visits || 0))
    .slice(0, 5)
    .map((p: any) => ({ page: p.page, label: p.label || p.page, visits: p.visits || 0 }));

  const mostSharedPages = [...allPages]
    .sort((a: any, b: any) => (b.shares || 0) - (a.shares || 0))
    .slice(0, 5)
    .map((p: any) => ({ page: p.page, label: p.label || p.page, shares: p.shares || 0 }));

  const recentActivityRaw = (await events
    .find({})
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray())
    .filter((e: any) => !isAnalyticsExcludedPage(String(e.page || "")))
    .slice(0, 15);

  const recentActivity = recentActivityRaw.map((e: any) => ({
    type: e.type,
    page: e.page,
    label: e.label || null,
    createdAt: (e.createdAt instanceof Date ? e.createdAt : new Date(e.createdAt)).toISOString(),
  }));

  return {
    totalPageVisits,
    totalClicks,
    totalContentClicks,
    totalShares,
    mostViewedPages,
    mostSharedPages,
    recentActivity,
  };
}

/**
 * Builds a 6-month revenue trend from the invoices collection so the
 * dashboard chart reflects real data instead of a static illustration.
 */
export async function getMonthlyRevenueTrend(): Promise<{ month: string; revenue: number }[]> {
  const client = await clientPromise;
  const db = client.db(dbName);
  const invoices = db.collection("invoices");

  const all = await invoices.find({ status: "Paid" }).toArray();

  const now = new Date();
  const months: { key: string; label: string; year: number; month: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleString("en-US", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth(),
    });
  }

  const totals: Record<string, number> = {};
  months.forEach((m) => (totals[m.key] = 0));

  all.forEach((inv: any) => {
    const raw = inv.paidAt || inv.date || inv.createdAt;
    if (!raw) return;
    const d = new Date(raw);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (totals[key] !== undefined) {
      totals[key] += inv.amount || 0;
    }
  });

  return months.map((m) => ({ month: m.label, revenue: totals[m.key] }));
}
