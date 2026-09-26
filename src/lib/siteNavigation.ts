import clientPromise from "@/lib/mongodb";

export type SiteNavItem = {
  id: string; label: string; href: string; help?: string; icon?: string; visible: boolean; external?: boolean; order?: number;
};
export type SiteNavigation = { items: SiteNavItem[]; updatedAt?: string };
export const DEFAULT_SITE_NAV: SiteNavItem[] = [
  { id: "careers", label: "Careers", href: "/work-with-us", help: "Jobs and professional opportunities", icon: "BriefcaseBusiness", visible: true },
  { id: "case-studies", label: "Case studies", href: "/portfolio", help: "Projects and engineering examples", icon: "Layers3", visible: true },
  { id: "insights", label: "Insights", href: "/blog", help: "Industry news, guides and engineering knowledge", icon: "Newspaper", visible: true },
  { id: "community", label: "Community", href: "/community", help: "Professional civil & architecture community", icon: "Users", visible: true },
  { id: "about", label: "About", href: "/about", help: "About NS Construction", icon: "Globe2", visible: true },
];
const dbName = process.env.MONGODB_DB || "civil-at-hand";
export async function getSiteNavigation(): Promise<SiteNavigation> {
  try {
    const client = await clientPromise;
    const doc = await client.db(dbName).collection("site_settings").findOne({ _id: "public-navigation" as any });
    const items = Array.isArray((doc as any)?.items) ? (doc as any).items.filter((i: any) => i && typeof i.href === "string" && typeof i.label === "string") : DEFAULT_SITE_NAV;
    const hiddenPublicPrefixes = ["/services", "/vendors", "/vendor-register", "/ai-insights", "/sectors", "/technology", "/pricing", "/project-planner", "/proposals", "/projects"];
    return { items: items
      .sort((a: SiteNavItem, b: SiteNavItem) => Number(a.order ?? 0) - Number(b.order ?? 0))
      .filter((i: SiteNavItem) => i.visible !== false && !hiddenPublicPrefixes.some((prefix) => i.href === prefix || i.href.startsWith(`${prefix}/`))),
      updatedAt: (doc as any)?.updatedAt };
  } catch { return { items: DEFAULT_SITE_NAV }; }
}
export async function saveSiteNavigation(items: SiteNavItem[]) {
  const client = await clientPromise;
  const normalized = items.map((item, index) => ({ id: String(item.id || `nav-${index + 1}`), label: String(item.label || "").trim(), href: String(item.href || "").trim(), help: String(item.help || "").trim(), icon: String(item.icon || "Globe2"), visible: item.visible !== false, external: !!item.external, order: index }));
  await client.db(dbName).collection("site_settings").updateOne({ _id: "public-navigation" as any }, { $set: { items: normalized, updatedAt: new Date().toISOString() } }, { upsert: true });
  return normalized;
}
