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
    const authenticated = await hasModuleAccess("projects");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("projects");

    const project = await collection.findOne({ id });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const updatedProjectData = {
      ...body,
      id: project.id,
      dateStarted: project.dateStarted,
      ...(body.status === "Completed" && !body.completedAt && !(project as any).completedAt
        ? { completedAt: new Date().toISOString() }
        : {}),
    };

    delete (updatedProjectData as any)._id;

    await collection.updateOne({ id }, { $set: updatedProjectData });

    const { _id, ...originalProjWithoutId } = project;
    return NextResponse.json({ ...originalProjWithoutId, ...updatedProjectData });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await hasModuleAccess("projects");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("projects");

    const deleteResult = await collection.deleteOne({ id });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ success: true, message: "Project was already deleted or not found" });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
