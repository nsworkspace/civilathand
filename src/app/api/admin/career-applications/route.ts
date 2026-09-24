import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function GET() {
  try {
    const authenticated = await hasModuleAccess("careers");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("career_applications");

    const applications = await collection.find({}).sort({ createdAt: -1 }).toArray();
    const formatted = applications.map(({ _id, ...rest }) => rest);

    return NextResponse.json(
      { applications: formatted },
      { headers: { "Cache-Control": "no-store, no-cache" } }
    );
  } catch (error: any) {
    console.error("Error fetching career applications:", error);
    return NextResponse.json({ error: "Failed to fetch applications." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authenticated = await hasModuleAccess("careers");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Application ID is required." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("career_applications");

    await collection.deleteOne({ id });
    return NextResponse.json({ success: true, message: "Application deleted." });
  } catch (error: any) {
    console.error("Error deleting career application:", error);
    return NextResponse.json({ error: "Failed to delete application." }, { status: 500 });
  }
}
