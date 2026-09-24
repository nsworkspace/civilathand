import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getAdminSession, hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function GET() {
  try {
    const adminSession = await getAdminSession();
    if (adminSession && !(await hasModuleAccess("drawings"))) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("drawings");
    const headers = {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    };

    const drawings = await collection.find({}).toArray();
    const formattedDrawings = drawings.map(({ _id, ...rest }) => rest);
    return NextResponse.json(formattedDrawings, { headers });
  } catch (error) {
    console.error("Error in GET /api/drawings:", error);
    return NextResponse.json({ error: "Failed to fetch drawings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, size, serviceType, url, clientName, clientEmail, projectId } = body;

    if (!name) {
      return NextResponse.json({ error: "File name is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("drawings");

    const newDrawing = {
      id: `draw-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      name,
      size: size || "Unknown Size",
      uploadDate: new Date().toISOString().split("T")[0],
      status: "Analyzing",
      serviceType: serviceType || "General Design",
      url: url || "",
      clientName: clientName || undefined,
      clientEmail: clientEmail ? clientEmail.toLowerCase() : undefined,
      projectId: projectId || undefined,
    };

    await collection.insertOne(newDrawing);

    const { _id, ...responseDrawing } = newDrawing as any;
    return NextResponse.json(responseDrawing, { status: 201 });
  } catch (error) {
    console.error("Error creating drawing:", error);
    return NextResponse.json({ error: "Failed to create drawing" }, { status: 500 });
  }
}
