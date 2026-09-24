import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function GET() {
  try {
    if (!await hasModuleAccess("vendorLeads")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await clientPromise;
    const db = client.db(dbName);
    const leads = await db.collection("vendor_leads").find({}).sort({ createdAt: -1 }).toArray();

    const vendorIds = leads
      .map((lead) => String(lead.vendorId || ""))
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    const vendors = vendorIds.length
      ? await db.collection("vendors").find({ _id: { $in: vendorIds } }, {
          projection: { name: 1, companyName: 1, vendorType: 1, category: 1, location: 1, phone: 1, email: 1, address: 1, fullAddress: 1 },
        }).toArray()
      : [];

    const vendorMap = new Map(vendors.map((vendor) => [String(vendor._id), vendor]));
    const formatted = leads.map(({ _id, ...lead }) => {
      const vendor = vendorMap.get(String(lead.vendorId || ""));
      return {
        _id: _id.toString(),
        ...lead,
        vendorName: lead.vendorName || vendor?.companyName || vendor?.name || "Unknown",
        vendorType: lead.vendorType || vendor?.vendorType || "",
        vendorCategory: lead.vendorCategory || vendor?.category || "",
        vendorLocation: lead.vendorLocation || vendor?.location || "",
        vendorPrivateContact: vendor ? { phone: vendor.phone || "", email: vendor.email || "", address: vendor.fullAddress || vendor.address || "" } : null,
      };
    });

    return NextResponse.json({ leads: formatted });
  } catch (error: any) {
    console.error("Error fetching vendor leads:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch leads" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!await hasModuleAccess("vendorLeads")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = new URL(request.url).searchParams.get("id");
    if (!id || !ObjectId.isValid(id)) return NextResponse.json({ error: "Missing or invalid lead ID" }, { status: 400 });
    const db = (await clientPromise).db(dbName);
    const result = await db.collection("vendor_leads").deleteOne({ _id: new ObjectId(id) });
    if (!result.deletedCount) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete lead" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    if (!await hasModuleAccess("vendorLeads")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, status } = await request.json();
    const allowed = ["new", "contacted", "converted", "closed", "pending", "archived"];
    if (!id || !ObjectId.isValid(String(id)) || !allowed.includes(String(status))) return NextResponse.json({ error: "Invalid lead update" }, { status: 400 });
    const db = (await clientPromise).db(dbName);
    const result = await db.collection("vendor_leads").updateOne({ _id: new ObjectId(String(id)) }, { $set: { status: String(status), updatedAt: new Date() } });
    if (!result.matchedCount) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update lead" }, { status: 500 });
  }
}
