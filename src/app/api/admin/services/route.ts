import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";
import { servicesData } from "@/data/services";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function GET() {
  try {
    const authenticated = await hasModuleAccess("services");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("services");

    const services = await collection.find({}).sort({ order: 1, createdAt: 1 }).toArray();
    const formatted = services.map(({ _id, ...rest }) => rest);

    return NextResponse.json(
      { services: formatted },
      { headers: { "Cache-Control": "no-store, no-cache" } }
    );
  } catch (error) {
    console.error("Error in GET /api/admin/services:", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authenticated = await hasModuleAccess("services");
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("services");

    if (action === "create") {
      const { title, desc, price, iconName, fullDetails, features, standards, deliverables } = data;
      if (!title?.trim()) {
        return NextResponse.json({ error: "Service title is required." }, { status: 400 });
      }
      // Generate a slug-based id
      const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const existing = await collection.findOne({ id });
      if (existing) {
        return NextResponse.json({ error: "A service with a similar title already exists." }, { status: 409 });
      }
      const count = await collection.countDocuments();
      const newService = {
        id,
        title: title.trim(),
        desc: desc?.trim() || "",
        price: typeof price === "string" ? price.trim() : "",
        iconName: iconName || "Sparkles",
        fullDetails: fullDetails?.trim() || "",
        features: features || [],
        standards: standards || [],
        deliverables: deliverables || [],
        status: "active",
        order: count,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await collection.insertOne(newService);
      const { _id, ...responseService } = newService as any;
      return NextResponse.json({ success: true, service: responseService }, { status: 201 });
    }

    if (action === "update") {
      const { id, ...updates } = data;
      if (!id) return NextResponse.json({ error: "id is required for update." }, { status: 400 });
      const normalizedUpdates = {
        ...updates,
        ...(Object.prototype.hasOwnProperty.call(updates, "price")
          ? { price: typeof updates.price === "string" ? updates.price.trim() : "" }
          : {}),
      };
      await collection.updateOne(
        { id },
        { $set: { ...normalizedUpdates, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
      return NextResponse.json({ success: true, message: "Service updated." });
    }

    if (action === "delete") {
      const { id } = data;
      if (!id) return NextResponse.json({ error: "id is required for delete." }, { status: 400 });
      await collection.deleteOne({ id });
      return NextResponse.json({ success: true, message: "Service deleted." });
    }

    if (action === "reorder") {
      // data = [{ id, order }, ...]
      const updates = data as { id: string; order: number }[];
      await Promise.all(
        updates.map(({ id, order }) =>
          collection.updateOne({ id }, { $set: { order, updatedAt: new Date().toISOString() } })
        )
      );
      return NextResponse.json({ success: true, message: "Order updated." });
    }

    if (action === "seed_defaults") {
      let seeded = 0;
      for (let i = 0; i < servicesData.length; i++) {
        const s = servicesData[i];
        const exists = await collection.findOne({ id: s.id });
        if (!exists) {
          await collection.insertOne({
            ...s,
            status: "active",
            order: i,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          seeded++;
        }
      }
      return NextResponse.json({ success: true, seeded, message: `Seeded ${seeded} default service(s).` });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("Error in POST /api/admin/services:", error);
    return NextResponse.json({ error: "Operation failed on server." }, { status: 500 });
  }
}
