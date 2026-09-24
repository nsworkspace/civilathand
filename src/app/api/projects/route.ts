import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function GET(request: Request) {
  try {
    const authenticated = await hasModuleAccess("projects");
    
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("projects");
    const headers = {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    };

    let filter = {};
    if (!authenticated) {
      const url = new URL(request.url);
      const clientName = url.searchParams.get("clientName");
      if (!clientName) {
        return NextResponse.json([], { headers });
      }
      filter = { clientName: { $regex: new RegExp(`^${clientName}$`, "i") } };
    }

    const projects = await collection.find(filter).toArray();
    const formattedProjects = projects.map(({ _id, ...rest }) => rest);
    return NextResponse.json(formattedProjects, { headers });
  } catch (error) {
    console.error("Error in GET /api/projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, clientName, clientEmail, service, areaSqFt, location, drawings, quoteAmount } = body;

    if (!title || !clientName) {
      return NextResponse.json({ error: "Title and clientName are required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("projects");

    const newProject = {
      id: `proj-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      title,
      clientName,
      clientEmail: clientEmail ? clientEmail.toLowerCase() : undefined,
      service: service || "General",
      areaSqFt: Number(areaSqFt) || 0,
      location: location || "",
      status: "Uploaded",
      progress: 10,
      drawings: drawings || [],
      quoteAmount: quoteAmount !== undefined ? Number(quoteAmount) : undefined,
      invoicePaid: false,
      dateStarted: new Date().toISOString().split("T")[0],
    };

    await collection.insertOne(newProject);

    const { _id, ...responseProject } = newProject as any;
    return NextResponse.json(responseProject, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
