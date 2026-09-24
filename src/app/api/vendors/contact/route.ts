import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name, company, phone, email, projectType, requirementLocation,
      timeline, budget, message, preferredContact, vendorId,
    } = body || {};

    if (!name || !phone || !email || !projectType || !requirementLocation || !message || !vendorId || !ObjectId.isValid(String(vendorId))) {
      return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "civil-at-hand");

    const vendor = await db.collection("vendors").findOne(
      { _id: new ObjectId(String(vendorId)), $or: [{ isActive: true }, { approved: true }, { status: "approved" }] },
      { projection: { _id: 1, name: 1, companyName: 1, vendorType: 1, category: 1, location: 1 } },
    );

    if (!vendor) return NextResponse.json({ error: "This vendor is no longer publicly available." }, { status: 404 });

    const now = new Date();
    const result = await db.collection("vendor_leads").insertOne({
      name: String(name).trim(),
      company: String(company || "").trim(),
      phone: String(phone).trim(),
      email: String(email).trim().toLowerCase(),
      projectType: String(projectType).trim(),
      requirementLocation: String(requirementLocation).trim(),
      timeline: String(timeline || "").trim(),
      budget: String(budget || "").trim(),
      message: String(message).trim(),
      preferredContact: String(preferredContact || "Phone").trim(),
      vendorId: String(vendorId),
      vendorName: String(vendor.companyName || vendor.name || "").trim(),
      vendorType: String(vendor.vendorType || "").trim(),
      vendorCategory: String(vendor.category || "").trim(),
      vendorLocation: String(vendor.location || "").trim(),
      status: "new",
      source: "Public Vendor Directory",
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, leadId: String(result.insertedId) });
  } catch (error) {
    console.error("Error in /api/vendors/contact:", error);
    return NextResponse.json({ error: "Failed to submit request." }, { status: 500 });
  }
}
