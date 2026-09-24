import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await hasModuleAccess("leads");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("leads");

    const lead = await collection.findOne({ id });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const updatedLeadData = {
      ...body,
      id: lead.id,
      date: lead.date,
    };

    delete (updatedLeadData as any)._id;

    await collection.updateOne({ id }, { $set: updatedLeadData });

    const { _id, ...originalLeadWithoutId } = lead;
    return NextResponse.json({ ...originalLeadWithoutId, ...updatedLeadData });
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await hasModuleAccess("leads");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("leads");

    const deleteResult = await collection.deleteOne({ id });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ success: true, message: "Lead was already deleted or not found" });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
