import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { generateSlug } from "@/lib/utils";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

function cleanString(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeVendor(body: any) {
  const companyName = cleanString(body.companyName);
  const name = cleanString(body.name);
  const vendorType = cleanString(body.vendorType) || "Other";
  const category = cleanString(body.category);
  const location = cleanString(body.location);

  return {
    name,
    companyName,
    vendorType,
    category,
    location,
    address: cleanString(body.address),
    description: cleanString(body.description),
    designation: cleanString(body.designation),
    serviceArea: cleanString(body.serviceArea),
    yearsExperience: cleanString(body.yearsExperience),
    teamSize: cleanString(body.teamSize),
    gstin: cleanString(body.gstin).toUpperCase(),
    keyServices: cleanString(body.keyServices),
    projectExperience: cleanString(body.projectExperience),
    phone_hidden: cleanString(body.phone_hidden),
    email_hidden: cleanString(body.email_hidden).toLowerCase(),
    website: cleanString(body.website),
    portfolio: Array.isArray(body.portfolio) ? body.portfolio : [],
    slug: generateSlug(companyName || name),
  };
}

function validateVendor(vendor: ReturnType<typeof normalizeVendor>) {
  const missing: string[] = [];
  if (!vendor.name) missing.push("Vendor / Contact Name");
  if (!vendor.companyName) missing.push("Company / Business Name");
  if (!vendor.vendorType) missing.push("Vendor Type");
  if (!vendor.category) missing.push("Category / Services");
  if (!vendor.location) missing.push("City / State");
  if (!vendor.address) missing.push("Full Address");
  if (!vendor.phone_hidden) missing.push("Phone");
  if (!vendor.email_hidden) missing.push("Email");
  return missing;
}

async function getCollection() {
  const client = await clientPromise;
  return client.db(dbName).collection("vendors");
}

export async function GET() {
  if (!await hasModuleAccess("vendors")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const collection = await getCollection();
  try {
    await Promise.all([
      collection.createIndex({ email_hidden: 1 }),
      collection.createIndex({ phone_hidden: 1 }),
      collection.createIndex({ isActive: 1, updatedAt: -1 }),
      collection.createIndex({ slug: 1 }),
      collection.createIndex({ vendorType: 1, category: 1, location: 1 }),
    ]);
  } catch (indexError) {
    console.error("Vendor index setup warning:", indexError);
  }
  const vendors = await collection.find({}).sort({ createdAt: -1, updatedAt: -1 }).toArray();
  return NextResponse.json(vendors.map((vendor: any) => ({
    ...vendor,
    _id: String(vendor._id),
    isActive: vendor.isActive === true || vendor.approved === true || vendor.status === "approved",
  })));
}

export async function POST(req: Request) {
  if (!await hasModuleAccess("vendors")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const vendor = normalizeVendor(body);
    const missing = validateVendor(vendor);
    if (missing.length) return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}.` }, { status: 400 });

    const collection = await getCollection();
    const duplicate = await collection.findOne({
      $or: [{ email_hidden: vendor.email_hidden }, { phone_hidden: vendor.phone_hidden }],
    });
    if (duplicate) return NextResponse.json({ error: "A vendor with this email or phone already exists." }, { status: 409 });

    const now = new Date();
    const newVendor = {
      ...vendor,
      source: "admin",
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      approved: body.isActive !== undefined ? Boolean(body.isActive) : true,
      status: (body.isActive !== false) ? "approved" : "pending",
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(newVendor);
    return NextResponse.json({ success: true, vendor: { ...newVendor, _id: result.insertedId } });
  } catch (error) {
    console.error("Admin vendor create error:", error);
    return NextResponse.json({ error: "Unable to create vendor." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!await hasModuleAccess("vendors")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const id = String(body?._id || "");
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid vendor ID." }, { status: 400 });

    const collection = await getCollection();
    const existing = await collection.findOne({ _id: new ObjectId(id) });
    if (!existing) return NextResponse.json({ error: "Vendor not found." }, { status: 404 });

    // Approval/status-only update.
    if (typeof body.isActive === "boolean" && Object.keys(body).every((key) => key === "_id" || key === "isActive")) {
      const now = new Date();
      const update: Record<string, unknown> = { isActive: body.isActive, approved: body.isActive, status: body.isActive ? "approved" : "pending", updatedAt: now };
      if (body.isActive) update.publicListedAt = existing.publicListedAt || now;
      await collection.updateOne({ _id: new ObjectId(id) }, { $set: update });
      return NextResponse.json({ success: true, updated: true });
    }

    const vendor = normalizeVendor(body);
    const missing = validateVendor(vendor);
    if (missing.length) return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}.` }, { status: 400 });

    const duplicate = await collection.findOne({
      _id: { $ne: new ObjectId(id) },
      $or: [{ email_hidden: vendor.email_hidden }, { phone_hidden: vendor.phone_hidden }],
    });
    if (duplicate) return NextResponse.json({ error: "Another vendor already uses this email or phone." }, { status: 409 });

    const update: Record<string, unknown> = { ...vendor, updatedAt: new Date() };
    if (typeof body.isActive === "boolean") {
      update.isActive = body.isActive;
      update.approved = body.isActive;
      update.status = body.isActive ? "approved" : "pending";
      if (body.isActive) update.publicListedAt = existing.publicListedAt || new Date();
    }

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: update });
    const saved = await collection.findOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true, updated: true, vendor: saved });
  } catch (error) {
    console.error("Admin vendor update error:", error);
    return NextResponse.json({ error: "Unable to update vendor." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!await hasModuleAccess("vendors")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id || !ObjectId.isValid(id)) return NextResponse.json({ error: "Invalid vendor ID." }, { status: 400 });

  const collection = await getCollection();
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  if (!result.deletedCount) return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
  return NextResponse.json({ success: true });
}
