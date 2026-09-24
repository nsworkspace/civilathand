import { NextResponse } from "next/server";
import { hasModuleAccess } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { studyMaterialPaymentSlug } from "@/lib/studyMaterials";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await hasModuleAccess("studyMaterials"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const price = body.price === undefined ? undefined : Number(body.price);
    if (price !== undefined && (!Number.isFinite(price) || price < 1 || price > 500000)) return NextResponse.json({ error: "Invalid price." }, { status: 400 });
    const client = await clientPromise;
    const db = client.db(dbName);
    const material = await db.collection("study_materials").findOne({ id });
    if (!material) return NextResponse.json({ error: "Study material not found." }, { status: 404 });
    const set: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (price !== undefined) set.price = Math.round(price * 100) / 100;
    if (typeof body.published === "boolean") set.published = body.published;
    if (typeof body.featured === "boolean") set.featured = body.featured;
    if (typeof body.title === "string" && body.title.trim()) set.title = body.title.trim().slice(0, 140);
    if (typeof body.description === "string") set.description = body.description.trim().slice(0, 700);
    if (Array.isArray(body.units)) set.units = body.units.map((x: unknown) => String(x).trim()).filter(Boolean).slice(0, 30);
    await db.collection("study_materials").updateOne({ id }, { $set: set });
    const next = { ...material, ...set };
    await db.collection("payment_items").updateOne(
      { slug: material.paymentSlug || studyMaterialPaymentSlug(id) },
      { $set: { amount: Number(next.price) || 0, active: next.published !== false, title: String(next.title), description: String(next.description || ""), updatedAt: new Date().toISOString() } }
    );
    const { _id, fileId, ...safe } = next as any;
    return NextResponse.json({ success: true, material: safe });
  } catch (error) {
    console.error("Study material update failed:", error);
    return NextResponse.json({ error: "Failed to update study material." }, { status: 500 });
  }
}
