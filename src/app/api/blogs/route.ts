import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { generateSlug } from "@/lib/utils";
import { hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

// Server-side in-memory cache for blogs to make loading instant
let cachedBlogs: any[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 300000; // 5 minutes Cache TTL

export function invalidateBlogsCache() {
  cachedBlogs = null;
}

export async function GET() {
  try {
    const now = Date.now();
    const headers = {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    };

    if (cachedBlogs && (now - cacheTimestamp < CACHE_TTL)) {
      return NextResponse.json(cachedBlogs, { headers });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("blogs");

    // Fetch all blogs
    const blogs = await collection.find({}).toArray();
    const formattedBlogs = blogs.map(({ _id, ...rest }) => rest);
    cachedBlogs = formattedBlogs;
    cacheTimestamp = now;
    return NextResponse.json(formattedBlogs, { headers });
  } catch (error) {
    console.error("Error in GET /api/blogs:", error);
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authenticated = await hasModuleAccess("blogs");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      content,
      summary,
      category,
      author,
      image,
      imageAlt,
      status,
      slug,
      tags,
      seoTitle,
      seoDescription,
      canonicalUrl,
      featured,
    } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const cleanTitle = String(title).trim();
    const cleanContent = String(content).trim();
    if (cleanTitle.length > 180) {
      return NextResponse.json({ error: "Title must be 180 characters or fewer" }, { status: 400 });
    }
    if (cleanContent.length > 500000) {
      return NextResponse.json({ error: "Article content is too large" }, { status: 400 });
    }

    const cleanTags = Array.isArray(tags)
      ? [...new Set(tags.map((tag: unknown) => String(tag).trim().toLowerCase()).filter(Boolean))].slice(0, 12)
      : [];

    const safeSlug = String(slug || generateSlug(cleanTitle))
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 140) || generateSlug(cleanTitle);

    const cleanCanonicalUrl = canonicalUrl ? String(canonicalUrl).trim() : "";

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("blogs");

    const existingSlug = await collection.findOne({ slug: safeSlug });
    if (existingSlug) {
      return NextResponse.json(
        { error: "That blog URL slug is already in use. Choose a different slug." },
        { status: 409 }
      );
    }

    const newBlog = {
      id: `blog-${Date.now()}`,
      title: cleanTitle,
      content: cleanContent,
      summary: String(summary || "").trim().slice(0, 500),
      category: category || "General tech",
      date: new Date().toISOString().split("T")[0],
      author: String(author || "Admin").trim().slice(0, 100),
      image: String(image || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80").trim(),
      imageAlt: String(imageAlt || cleanTitle).trim().slice(0, 180),
      status: status === "published" ? "published" : "draft",
      slug: safeSlug,
      tags: cleanTags,
      seoTitle: String(seoTitle || cleanTitle).trim().slice(0, 180),
      seoDescription: String(seoDescription || summary || cleanTitle).trim().slice(0, 320),
      canonicalUrl: cleanCanonicalUrl.slice(0, 500),
      featured: Boolean(featured),
      views: 0,
      likes: 0,
      shares: 0,
      updatedAt: new Date().toISOString(),
    };

    await collection.insertOne(newBlog);
    invalidateBlogsCache();

    // Return without MongoDB's _id
    const { _id, ...responseBlog } = newBlog as any;
    return NextResponse.json(responseBlog, { status: 201 });
  } catch (error) {
    console.error("Error creating blog:", error);
    return NextResponse.json({ error: "Failed to create blog" }, { status: 500 });
  }
}
