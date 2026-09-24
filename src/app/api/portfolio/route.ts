import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { generateSlug } from "@/lib/utils";
import { hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("portfolio");

    const headers = {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    };

    const projects = await collection.find({}).toArray();
    const formattedProjects = projects.map(({ _id, ...rest }) => rest);
    return NextResponse.json(formattedProjects, { headers });
  } catch (error) {
    console.error("Error in GET /api/portfolio:", error);
    return NextResponse.json({ error: "Failed to fetch portfolio" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authenticated = await hasModuleAccess("portfolio");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      category, 
      area, 
      loc, 
      img, 
      status, 
      description, 
      fullDetails, 
      specs, 
      challenges, 
      solutions, 
      gallery 
    } = body;

    if (!title || !category || !description) {
      return NextResponse.json({ error: "Title, category, and description are required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("portfolio");

    const slug = generateSlug(title);
    const existing = await collection.findOne({ id: slug });
    const finalId = existing ? `${slug}-${Date.now().toString().slice(-4)}` : slug;

    const newPortfolioItem = {
      id: finalId,
      title,
      category,
      area: area || "TBD",
      loc: loc || "TBD",
      img: img || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800",
      status: status || "Ongoing",
      description,
      fullDetails: fullDetails || description,
      specs: Array.isArray(specs) ? specs : [],
      challenges: Array.isArray(challenges) ? challenges : [],
      solutions: Array.isArray(solutions) ? solutions : [],
      gallery: Array.isArray(gallery) ? gallery : [],
      views: 0,
    };

    await collection.insertOne(newPortfolioItem);

    const { _id, ...responseItem } = newPortfolioItem as any;
    return NextResponse.json(responseItem, { status: 201 });
  } catch (error) {
    console.error("Error creating portfolio item:", error);
    return NextResponse.json({ error: "Failed to create portfolio item" }, { status: 500 });
  }
}
