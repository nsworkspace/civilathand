import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

/**
 * Public vendor discovery API.
 * IMPORTANT: this route intentionally exposes only public-safe fields.
 * Vendor registration is handled exclusively by /api/vendors/register, which
 * requires a verified account and the configured registration payment.
 */
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "civil-at-hand");

    const vendors = await db
      .collection("vendors")
      .find({ $or: [{ isActive: true }, { approved: true }, { status: "approved" }] })
      .project({
        name: 1,
        companyName: 1,
        vendorType: 1,
        category: 1,
        location: 1,
        description: 1,
        designation: 1,
        yearsExperience: 1,
        serviceArea: 1,
        keyServices: 1,
        portfolio: 1,
        slug: 1,
        updatedAt: 1,
        createdAt: 1,
      })
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray();

    const safeVendors = vendors.map((vendor) => ({
      _id: String(vendor._id),
      name: String(vendor.name || ""),
      companyName: String(vendor.companyName || ""),
      vendorType: String(vendor.vendorType || "Other"),
      category: String(vendor.category || ""),
      location: String(vendor.location || "India"),
      description: String(vendor.description || ""),
      designation: String(vendor.designation || ""),
      yearsExperience: String(vendor.yearsExperience || ""),
      serviceArea: String(vendor.serviceArea || vendor.location || "India"),
      keyServices: String(vendor.keyServices || ""),
      portfolioCount: Array.isArray(vendor.portfolio) ? vendor.portfolio.length : 0,
      slug: String(vendor.slug || ""),
      updatedAt: vendor.updatedAt || vendor.createdAt || null,
    }));

    return NextResponse.json(safeVendors, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Public vendor discovery error:", error);
    return NextResponse.json({ error: "Unable to load vendor directory." }, { status: 500 });
  }
}

// There is deliberately no public POST handler here. Vendor creation must go
// through /api/vendors/register, which verifies identity and registration payment.
