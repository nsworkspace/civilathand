import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { generateSlug } from "@/lib/utils";
import { hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await hasModuleAccess("portfolio");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("portfolio");

    const item = await collection.findOne({ id });
    if (!item) {
      return NextResponse.json({ error: "Portfolio item not found" }, { status: 404 });
    }

    // Generate new slug if title is updated
    const newSlug = body.title ? generateSlug(body.title) : item.id;
    let finalId = item.id;
    if (body.title && newSlug !== item.id) {
      const existing = await collection.findOne({ id: newSlug });
      finalId = existing ? `${newSlug}-${Date.now().toString().slice(-4)}` : newSlug;
    }

    const updatedData = {
      ...body,
      id: finalId,
    };

    delete (updatedData as any)._id;

    await collection.updateOne({ id }, { $set: updatedData });

    const { _id, ...originalItemWithoutId } = item;
    return NextResponse.json({ ...originalItemWithoutId, ...updatedData });
  } catch (error) {
    console.error("Error updating portfolio item:", error);
    return NextResponse.json({ error: "Failed to update portfolio item" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await hasModuleAccess("portfolio");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("portfolio");

    const deleteResult = await collection.deleteOne({ id });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ success: true, message: "Portfolio item was already deleted or not found" });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting portfolio item:", error);
    return NextResponse.json({ error: "Failed to delete portfolio item" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("portfolio");

    // Atomic increment of the views field by 1
    const result = await collection.findOneAndUpdate(
      { id },
      { $inc: { views: 1 } },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Portfolio item not found" }, { status: 404 });
    }

    const { _id, ...responseItem } = result as any;
    return NextResponse.json(responseItem);
  } catch (error) {
    console.error("Error incrementing portfolio views:", error);
    return NextResponse.json({ error: "Failed to increment views" }, { status: 500 });
  }
}
