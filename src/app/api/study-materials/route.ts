import { NextResponse } from "next/server";
import { hasModuleAccess } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { deleteGridFsFile, MAX_STUDY_MATERIAL_SIZE, studyMaterialBucket, studyMaterialPaymentSlug } from "@/lib/studyMaterials";
import { syncPaymentItem } from "@/lib/paymentItemSync";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const dbName = process.env.MONGODB_DB || "civil-at-hand";
const MAX_TITLE = 140;
const MAX_DESCRIPTION = 700;
const MAX_UNITS = 30;

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 70);
}

export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const isAdmin = await hasModuleAccess("studyMaterials");
    const slug = new URL(request.url).searchParams.get("slug")?.trim();
    const filter = isAdmin ? {} : { published: { $ne: false } };
    const materials = slug
      ? await db.collection("study_materials").findOne({ ...filter, slug }, { projection: { _id: 0, fileId: 0 } })
      : await db.collection("study_materials").find(filter).sort({ featured: -1, order: 1, createdAt: -1 }).project({ _id: 0, fileId: 0 }).toArray();
    if (slug && !materials) return NextResponse.json({ error: "Study material not found." }, { status: 404 });
    return NextResponse.json({ materials: slug ? [materials] : materials, material: slug ? materials : undefined }, { headers: { "Cache-Control": "no-store, no-cache" } });
  } catch (error) {
    console.error("Study materials GET failed:", error);
    return NextResponse.json({ error: "Failed to load study materials." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await hasModuleAccess("studyMaterials"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const form = await request.formData();
    const file = form.get("file");
    const title = String(form.get("title") || "").trim().slice(0, MAX_TITLE);
    const description = String(form.get("description") || "").trim().slice(0, MAX_DESCRIPTION);
    const subject = String(form.get("subject") || "Civil Engineering").trim().slice(0, 100);
    const level = String(form.get("level") || "Diploma / B.Tech / Competitive Learning").trim().slice(0, 120);
    const unitsRaw = String(form.get("units") || "").trim();
    const price = Number(form.get("price"));
    const featured = String(form.get("featured") || "false") === "true";
    const published = String(form.get("published") || "true") !== "false";

    if (!(file instanceof File)) return NextResponse.json({ error: "Please select a PDF file." }, { status: 400 });
    if (!title) return NextResponse.json({ error: "Material title is required." }, { status: 400 });
    if (!Number.isFinite(price) || price < 1 || price > 500000) return NextResponse.json({ error: "Price must be between ₹1 and ₹5,00,000." }, { status: 400 });
    if (file.size <= 0 || file.size > MAX_STUDY_MATERIAL_SIZE) return NextResponse.json({ error: "PDF must be between 1 byte and 25 MB." }, { status: 413 });
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) return NextResponse.json({ error: "Only PDF files are accepted." }, { status: 415 });

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") return NextResponse.json({ error: "The uploaded file is not a valid PDF." }, { status: 415 });

    const units = unitsRaw.split(/\r?\n/).map((u) => u.trim()).filter(Boolean).slice(0, MAX_UNITS);
    const client = await clientPromise;
    const db = client.db(dbName);
    const now = new Date().toISOString();
    const id = `sm-${Date.now().toString(36)}-${crypto.randomBytes(5).toString("hex")}`;
    const safeBase = slugify(title) || "civil-engineering-study-material";
    const filename = `${safeBase}-${crypto.randomBytes(6).toString("hex")}.pdf`;
    const bucket = studyMaterialBucket(db);

    const uploadStream = bucket.openUploadStream(filename, {
      metadata: { contentType: "application/pdf", materialId: id, originalName: file.name.slice(0, 180), uploadedBy: "admin", uploadedAt: now },
    });
    await new Promise<void>((resolve, reject) => {
      uploadStream.on("finish", () => resolve());
      uploadStream.on("error", reject);
      uploadStream.end(buffer);
    });

    const paymentSlug = studyMaterialPaymentSlug(id);
    const material = {
      id,
      slug: safeBase ? `${safeBase}-${id.slice(-8)}` : id,
      title,
      description,
      subject,
      level,
      units,
      price: Math.round(price * 100) / 100,
      featured,
      published,
      fileId: uploadStream.id.toString(),
      fileName: file.name.slice(0, 180),
      fileSize: file.size,
      paymentSlug,
      order: await db.collection("study_materials").countDocuments(),
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.collection("study_materials").insertOne(material);
      await syncPaymentItem(db, {
        sourceType: "study-material",
        sourceId: id,
        title,
        description: description || `Premium Civil At Hand study material — ${subject}.`,
        active: published,
        amount: material.price,
      });
      await db.collection("payment_items").updateOne({ slug: paymentSlug }, { $set: { amount: material.price, active: published, category: "study-material", pageHint: `/education/study-materials/${material.slug}`, buttonLabel: "Pay & Unlock PDF", successMessage: "Payment confirmed. Your study material is unlocked." } });
    } catch (error) {
      await db.collection("study_materials").deleteOne({ id });
      await deleteGridFsFile(db, uploadStream.id);
      throw error;
    }

    return NextResponse.json({ success: true, material: { ...material, fileId: undefined } }, { status: 201 });
  } catch (error) {
    console.error("Study material upload failed:", error);
    return NextResponse.json({ error: "Failed to upload study material." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await hasModuleAccess("studyMaterials"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) return NextResponse.json({ error: "Material ID is required." }, { status: 400 });
    const client = await clientPromise;
    const db = client.db(dbName);
    const material = await db.collection("study_materials").findOne({ id });
    if (!material) return NextResponse.json({ error: "Study material not found." }, { status: 404 });
    if (material.fileId) await deleteGridFsFile(db, material.fileId);
    await db.collection("study_materials").deleteOne({ id });
    await db.collection("payment_items").deleteOne({ slug: material.paymentSlug || studyMaterialPaymentSlug(id) });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Study material delete failed:", error);
    return NextResponse.json({ error: "Failed to delete study material." }, { status: 500 });
  }
}
