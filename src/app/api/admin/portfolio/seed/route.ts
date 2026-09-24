import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { portfolioItems as initialPortfolio } from "@/data/portfolio";
import { hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function POST() {
  try {
    const authenticated = await hasModuleAccess("portfolio");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("portfolio");

    // Re-seed: find which of initialPortfolio items are missing by `id` (slug) and insert them
    const existingItems = await collection.find({}).toArray();
    const existingIds = new Set(existingItems.map(item => item.id));

    const itemsToInsert = initialPortfolio.filter(item => !existingIds.has(item.id));

    if (itemsToInsert.length > 0) {
      const formattedItems = itemsToInsert.map(item => ({
        ...item,
        views: (item as any).views !== undefined ? (item as any).views : 0
      }));
      await collection.insertMany(formattedItems);
    }

    // Return the complete list of projects
    const updatedProjects = await collection.find({}).toArray();
    const formattedProjects = updatedProjects.map(({ _id, ...rest }) => rest);
    
    return NextResponse.json({
      success: true,
      seededCount: itemsToInsert.length,
      portfolio: formattedProjects
    });
  } catch (error: any) {
    console.error("Error seeding portfolio database:", error);
    return NextResponse.json({ error: "Failed to seed portfolio database" }, { status: 500 });
  }
}
