import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";
export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";
const clean = (value: unknown, max = 5000) => String(value ?? "").trim().slice(0, max);
const asArray = (value: unknown) => Array.isArray(value) ? value.map((v) => clean(v, 500)).filter(Boolean).slice(0, 30) : [];
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await hasModuleAccess("projects"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params; const body = await request.json();
    const db = (await clientPromise).db(dbName); const collection = db.collection("public_projects");
    const existing = await collection.findOne({ id }); if (!existing) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const update: any = {
      title: clean(body.title, 160), summary: clean(body.summary, 1200), category: clean(body.category, 100), location: clean(body.location, 160),
      budgetRange: clean(body.budgetRange, 100), areaSqFt: Number(body.areaSqFt) || 0, timeline: clean(body.timeline, 100), status: clean(body.status, 50),
      coverImage: clean(body.coverImage, 1000), gallery: asArray(body.gallery), highlights: asArray(body.highlights), scope: asArray(body.scope), deliverables: asArray(body.deliverables),
      featured: !!body.featured, published: body.published !== false, updatedAt: new Date().toISOString(),
    };
    if (body.title && clean(body.title, 160) !== existing.title) {
      const base = slugify(body.slug || body.title) || existing.slug; let slug = base, n = 2;
      while (await collection.findOne({ slug, id: { $ne: id } })) slug = `${base}-${n++}`; update.slug = slug;
    }
    if (update.published && !existing.published) update.publishedAt = new Date().toISOString();
    if (!update.published) update.publishedAt = null;
    await collection.updateOne({ id }, { $set: update });
    const saved = await collection.findOne({ id }); const { _id, ...result } = saved as any; return NextResponse.json(result);
  } catch (error) { console.error("PUT public project failed", error); return NextResponse.json({ error: "Failed to update project" }, { status: 500 }); }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await hasModuleAccess("projects"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params; const db = (await clientPromise).db(dbName);
    const deleted = await db.collection("public_projects").deleteOne({ id }); await db.collection("project_inquiries").deleteMany({ projectId: id });
    return NextResponse.json({ success: true, deleted: deleted.deletedCount > 0 });
  } catch (error) { console.error("DELETE public project failed", error); return NextResponse.json({ error: "Failed to delete project" }, { status: 500 }); }
}
