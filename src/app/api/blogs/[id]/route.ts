import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { invalidateBlogsCache } from "../route";
import { hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await hasModuleAccess("blogs");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("blogs");

    // Check if the blog post exists
    const blog = await collection.findOne({ id });
    if (!blog) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    // Prepare a controlled update so editor metadata stays predictable.
    const updatedBlogData: Record<string, any> = {
      ...body,
      id: blog.id, // Ensure id cannot be changed
      date: blog.date, // Preserve original publish date
      updatedAt: new Date().toISOString(),
    };

    if (typeof updatedBlogData.title === "string") {
      updatedBlogData.title = updatedBlogData.title.trim().slice(0, 180);
    }
    if (typeof updatedBlogData.summary === "string") {
      updatedBlogData.summary = updatedBlogData.summary.trim().slice(0, 500);
    }
    if (typeof updatedBlogData.content === "string") {
      updatedBlogData.content = updatedBlogData.content.trim();
    }
    if (typeof updatedBlogData.slug === "string") {
      updatedBlogData.slug = updatedBlogData.slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 140);
    }
    if (Array.isArray(updatedBlogData.tags)) {
      updatedBlogData.tags = [...new Set(updatedBlogData.tags.map((tag: unknown) => String(tag).trim().toLowerCase()).filter(Boolean))].slice(0, 12);
    }
    if (typeof updatedBlogData.seoTitle === "string") {
      updatedBlogData.seoTitle = updatedBlogData.seoTitle.trim().slice(0, 180);
    }
    if (typeof updatedBlogData.seoDescription === "string") {
      updatedBlogData.seoDescription = updatedBlogData.seoDescription.trim().slice(0, 320);
    }
    if (typeof updatedBlogData.canonicalUrl === "string") {
      updatedBlogData.canonicalUrl = updatedBlogData.canonicalUrl.trim().slice(0, 500);
    }
    if (typeof updatedBlogData.imageAlt === "string") {
      updatedBlogData.imageAlt = updatedBlogData.imageAlt.trim().slice(0, 180);
    }

    if (updatedBlogData.slug) {
      const conflictingBlog = await collection.findOne({
        slug: updatedBlogData.slug,
        id: { $ne: id },
      });
      if (conflictingBlog) {
        return NextResponse.json(
          { error: "That blog URL slug is already in use. Choose a different slug." },
          { status: 409 }
        );
      }
    }

    // Remove MongoDB's internal id from any incoming payload.
    delete updatedBlogData._id;

    await collection.updateOne({ id }, { $set: updatedBlogData });
    invalidateBlogsCache();

    const { _id, ...originalBlogWithoutId } = blog;
    return NextResponse.json({ ...originalBlogWithoutId, ...updatedBlogData });
  } catch (error) {
    console.error("Error updating blog:", error);
    return NextResponse.json({ error: "Failed to update blog" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authenticated = await hasModuleAccess("blogs");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("blogs");

    const deleteResult = await collection.deleteOne({ id });
    invalidateBlogsCache();

    // If no document was deleted, return success anyway (idempotent delete)
    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ success: true, message: "Blog post was already deleted or not found" });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json({ error: "Failed to delete blog" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const action = body.action || "view";

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("blogs");

    let updateDoc: any = { $inc: { views: 1 } };
    if (action === "like") {
      updateDoc = { $inc: { likes: 1 } };
    } else if (action === "share") {
      updateDoc = { $inc: { shares: 1 } };
    }

    // Atomic increment of the specified field
    const result = await collection.findOneAndUpdate(
      { id },
      updateDoc,
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    invalidateBlogsCache();

    const { _id, ...responseItem } = result as any;
    return NextResponse.json(responseItem);
  } catch (error) {
    console.error("Error updating blog actions:", error);
    return NextResponse.json({ error: "Failed to update action count" }, { status: 500 });
  }
}
