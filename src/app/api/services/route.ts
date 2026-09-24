import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { servicesData } from "@/data/services";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("services");

    const services = await collection
      .find({ status: { $ne: "archived" } })
      .sort({ order: 1, createdAt: 1 })
      .toArray();

    const formatted = services.map(({ _id, ...rest }) => rest);
    return NextResponse.json({ services: formatted });
  } catch (error) {
    console.error("Error in GET /api/services:", error);
    // Fallback to static data on error
    return NextResponse.json({ services: servicesData });
  }
}

