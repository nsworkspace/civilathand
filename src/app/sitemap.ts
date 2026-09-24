import type { MetadataRoute } from "next";
import { SITE } from "@/data/site";
import { generateSlug } from "@/lib/utils";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";
const BASE_URL = SITE.url.replace(/\/$/, "");

const PUBLIC_ROUTES = [
  "/", "/about", "/portfolio", "/blog", "/contact", "/faq", "/talk", "/gallery", "/links",
  "/accessibility-statement", "/cookie-policy", "/privacy-policy", "/terms-and-conditions",
  "/engineering-disclaimer",
  "/community", "/calculators", "/engineering-unit-converter",
  "/engineering-unit-converters/concrete", "/work-with-us",
];

function entry(path: string, now: Date, priority = 0.6): MetadataRoute.Sitemap[number] {
  return { url: `${BASE_URL}${path}`, lastModified: now, changeFrequency: path === "/" ? "weekly" : "monthly", priority };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();
  const add = (item: MetadataRoute.Sitemap[number]) => {
    if (!seen.has(item.url)) { seen.add(item.url); entries.push(item); }
  };

  for (const path of PUBLIC_ROUTES) add(entry(path, now, path === "/" ? 1 : 0.7));

  try {
    const client = await clientPromise;
    const db = client.db(dbName);

    const blogs = await db.collection("blogs").find({ status: "published" })
      .project({ title: 1, slug: 1, date: 1, updatedAt: 1, publishedAt: 1 }).toArray();
    for (const blog of blogs as any[]) {
      const slug = String(blog.slug || generateSlug(String(blog.title || ""))).trim();
      if (slug) add({ url: `${BASE_URL}/blog/${encodeURIComponent(slug)}`, lastModified: blog.updatedAt || blog.publishedAt || blog.date || now, changeFrequency: "monthly", priority: 0.7 });
    }

    const portfolioItems = await db.collection("portfolio").find({})
      .project({ id: 1, title: 1, updatedAt: 1, createdAt: 1 }).toArray();
    for (const project of portfolioItems as any[]) {
      const id = String(project.id || generateSlug(String(project.title || ""))).trim();
      if (id) add({ url: `${BASE_URL}/portfolio/${encodeURIComponent(id)}`, lastModified: project.updatedAt || project.createdAt || now, changeFrequency: "monthly", priority: 0.65 });
    }

    const courses = await db.collection("software_courses")
      .find({ slug: { $exists: true, $nin: [null, ""] }, comingSoon: { $ne: true } })
      .project({ slug: 1, updatedAt: 1, createdAt: 1 }).toArray();
    for (const course of courses as any[]) {
      const slug = String(course.slug).trim();
      if (slug) add({ url: `${BASE_URL}/education/courses/${encodeURIComponent(slug)}`, lastModified: course.updatedAt || course.createdAt || now, changeFrequency: "monthly", priority: 0.7 });
    }

    const careerSettings = await db.collection("career_settings").findOne({ key: "career_config" });
    const roles = Array.isArray((careerSettings as any)?.roles) ? (careerSettings as any).roles : [];
    for (const role of roles as any[]) {
      if (role.active === false) continue;
      const slug = String(role.slug || generateSlug(String(role.title || ""))).trim();
      if (slug) add({ url: `${BASE_URL}/work-with-us/${encodeURIComponent(slug)}`, lastModified: (careerSettings as any)?.updatedAt || now, changeFrequency: "weekly", priority: role.featured ? 0.8 : 0.7 });
    }
  } catch (error) {
    console.error("Error generating public education sitemap entries:", error);
  }
  return entries;
}
