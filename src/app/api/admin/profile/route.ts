import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { isAdminAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

const DEFAULT_PROFILE = {
  name: "Admin",
  email: process.env.ADMIN_USER || process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "info.civilathand@zohomail.in",
  phone: "",
  role: "Site Administrator",
  logoUrl: "",
};

export async function GET() {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("admin_profile");

    const profile = await collection.findOne({ key: "primary" });
    if (!profile) {
      return NextResponse.json({ ...DEFAULT_PROFILE });
    }
    const { _id, key, ...rest } = profile as any;
    return NextResponse.json({ ...DEFAULT_PROFILE, ...rest });
  } catch (error) {
    console.error("Error in GET /api/admin/profile:", error);
    return NextResponse.json({ ...DEFAULT_PROFILE });
  }
}

export async function PUT(request: Request) {
  try {
    const authenticated = await isAdminAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, role, logoUrl } = body;

    const update = {
      ...(name !== undefined ? { name: String(name).trim() } : {}),
      ...(email !== undefined ? { email: String(email).trim() } : {}),
      ...(phone !== undefined ? { phone: String(phone).trim() } : {}),
      ...(role !== undefined ? { role: String(role).trim() } : {}),
      ...(logoUrl !== undefined ? { logoUrl: String(logoUrl).trim() } : {}),
      updatedAt: new Date().toISOString(),
    };

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("admin_profile");

    await collection.updateOne({ key: "primary" }, { $set: update }, { upsert: true });

    const updated = await collection.findOne({ key: "primary" });
    const { _id, key, ...rest } = updated as any;
    return NextResponse.json({ ...DEFAULT_PROFILE, ...rest });
  } catch (error) {
    console.error("Error in PUT /api/admin/profile:", error);
    return NextResponse.json({ error: "Failed to update admin profile" }, { status: 500 });
  }
}
