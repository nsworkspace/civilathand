import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";
const clean = (value: unknown, max = 5000) => String(value ?? "").trim().slice(0, max);
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
const asArray = (value: unknown) => Array.isArray(value) ? value.map((v) => clean(v, 500)).filter(Boolean).slice(0, 30) : [];

function publicShape(project: any) {
  return { id: project.id, slug: project.slug, title: project.title, summary: project.summary, category: project.category, location: project.location, budgetRange: project.budgetRange, areaSqFt: project.areaSqFt, timeline: project.timeline, status: project.status, coverImage: project.coverImage, gallery: project.gallery || [], highlights: project.highlights || [], scope: project.scope || [], deliverables: project.deliverables || [], featured: !!project.featured, publishedAt: project.publishedAt, createdAt: project.createdAt, updatedAt: project.updatedAt, views: Number(project.views || 0), inquiriesCount: Number(project.inquiriesCount || 0) };
}

export async function GET(request: Request) {
  try {
    const db = (await clientPromise).db(dbName);
    const collection = db.collection("public_projects");
    const url = new URL(request.url);
    const slug = clean(url.searchParams.get("slug"), 120);
    const admin = await hasModuleAccess("projects");
    if (slug) {
      const project = await collection.findOne(admin ? { slug } : { slug, published: true });
      if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
      if (!admin) await collection.updateOne({ _id: project._id }, { $inc: { views: 1 } });
      return NextResponse.json(publicShape({ ...project, views: Number(project.views || 0) + (admin ? 0 : 1) }));
    }
    const projects = await collection.find(admin ? {} : { published: true }).sort({ featured: -1, createdAt: -1 }).limit(100).toArray();
    return NextResponse.json(projects.map(publicShape), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET /api/public-projects failed", error);
    return NextResponse.json({ error: "Failed to load public projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await hasModuleAccess("projects"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const title = clean(body.title, 160);
    if (!title) return NextResponse.json({ error: "Project title is required" }, { status: 400 });
    const db = (await clientPromise).db(dbName);
    const collection = db.collection("public_projects");
    const now = new Date().toISOString();
    const baseSlug = slugify(body.slug || title) || `project-${Date.now()}`;
    let slug = baseSlug, n = 2;
    while (await collection.findOne({ slug })) slug = `${baseSlug}-${n++}`;
    const project = {
      id: `public-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, slug, title,
      summary: clean(body.summary, 1200), category: clean(body.category, 100) || "Construction", location: clean(body.location, 160),
      budgetRange: clean(body.budgetRange, 100), areaSqFt: Number(body.areaSqFt) || 0, timeline: clean(body.timeline, 100),
      status: clean(body.status, 50) || "Open for enquiries", coverImage: clean(body.coverImage, 1000), gallery: asArray(body.gallery),
      highlights: asArray(body.highlights), scope: asArray(body.scope), deliverables: asArray(body.deliverables), featured: !!body.featured,
      published: body.published !== false, views: 0, inquiriesCount: 0, createdAt: now, updatedAt: now, publishedAt: body.published === false ? null : now,
    };
    await collection.insertOne(project);
    return NextResponse.json(publicShape(project), { status: 201 });
  } catch (error) {
    console.error("POST /api/public-projects failed", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
