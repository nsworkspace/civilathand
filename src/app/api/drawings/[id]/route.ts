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
    const { id } = await params;
    const body = await request.json();

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("drawings");

    const drawing = await collection.findOne({ id });
    if (!drawing) {
      return NextResponse.json({ error: "Drawing not found" }, { status: 404 });
    }

    const updatedDrawingData = {
      ...body,
      id: drawing.id,
      uploadDate: drawing.uploadDate,
    };

    delete (updatedDrawingData as any)._id;

    await collection.updateOne({ id }, { $set: updatedDrawingData });

    const { _id, ...originalDrawingWithoutId } = drawing;
    return NextResponse.json({ ...originalDrawingWithoutId, ...updatedDrawingData });
  } catch (error) {
    console.error("Error updating drawing:", error);
    return NextResponse.json({ error: "Failed to update drawing" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await hasModuleAccess("drawings");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("drawings");

    const result = await collection.deleteOne({ id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Drawing not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error deleting drawing:", error);
    return NextResponse.json({ error: "Failed to delete drawing" }, { status: 500 });
  }
}
