import clientPromise from "@/lib/mongodb";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

export type SitePageRecord = {
  slug: string; path: string; pageType: "existing" | "custom"; status: "draft" | "published";
  title: string; description: string; heroTitle?: string; heroDescription?: string;
  ctaText?: string; ctaHref?: string; heroImageUrl?: string; contentHtml?: string;
  seoTitle?: string; seoDescription?: string; createdAt?: string; updatedAt?: string;
};

const dbName = process.env.MONGODB_DB || "civil-at-hand";
export const EXISTING_MANAGED_PAGES = [
  { slug: "home", path: "/", title: "Home" }, { slug: "expertise", path: "/expertise", title: "Expertise" },
  { slug: "sectors", path: "/sectors", title: "Sectors" }, { slug: "technology", path: "/technology", title: "Technology" },
  { slug: "insights", path: "/insights", title: "Insights" }, { slug: "ai-insights", path: "/ai-insights", title: "AI Insights" },
  { slug: "pricing", path: "/pricing", title: "Pricing" }, { slug: "project-planner", path: "/project-planner", title: "Project Planner" },
  { slug: "faq", path: "/faq", title: "FAQ" }, { slug: "about", path: "/about", title: "About" },
  { slug: "contact", path: "/contact", title: "Contact" }, { slug: "services", path: "/services", title: "Services" },
  { slug: "portfolio", path: "/portfolio", title: "Projects" },
];
export function normalizeSlug(value: string) { return value.toLowerCase().trim().replace(/^\/+/, "").replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""); }
export async function getSitePage(slug: string): Promise<SitePageRecord | null> {
  try { const client = await clientPromise; const page = await client.db(dbName).collection<SitePageRecord>("site_pages").findOne({ slug: normalizeSlug(slug), status: "published" });
    if (!page) return null; return { ...page, contentHtml: page.contentHtml ? sanitizeHtml(page.contentHtml) : "" };
  } catch (error) { console.error("getSitePage failed:", error); return null; }
}
export function mergePageFallback(fallback: SitePageRecord, cms: SitePageRecord | null): SitePageRecord {
  if (!cms) return fallback; return { ...fallback, ...cms,
    title: cms.title || fallback.title, description: cms.description || fallback.description,
    heroTitle: cms.heroTitle || fallback.heroTitle, heroDescription: cms.heroDescription || fallback.heroDescription,
    ctaText: cms.ctaText || fallback.ctaText, ctaHref: cms.ctaHref || fallback.ctaHref,
    heroImageUrl: cms.heroImageUrl || fallback.heroImageUrl, seoTitle: cms.seoTitle || fallback.seoTitle,
    seoDescription: cms.seoDescription || fallback.seoDescription,
  };
}
