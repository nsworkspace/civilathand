import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";
const clean = (value: unknown, max = 2000) => String(value ?? "").trim().slice(0, max);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const projectId = clean(body.projectId, 120);
    const name = clean(body.name, 120);
    const email = clean(body.email, 180).toLowerCase();
    const phone = clean(body.phone, 40);
    const company = clean(body.company, 160);
    const message = clean(body.message, 2000);
    if (!projectId || !name || !email || !phone) return NextResponse.json({ error: "Name, email, phone and project are required" }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });

    const db = (await clientPromise).db(dbName);
    const project = await db.collection("public_projects").findOne({ id: projectId, published: true }, { projection: { id: 1, title: 1 } });
    if (!project) return NextResponse.json({ error: "This project is no longer available" }, { status: 404 });

    const now = new Date().toISOString();
    const inquiry = {
      id: `pinq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      projectId, projectTitle: project.title, name, email, phone, company, message,
      status: "new", source: "Public Project Marketplace", createdAt: now, updatedAt: now,
    };
    await db.collection("project_inquiries").insertOne(inquiry);
    await db.collection("public_projects").updateOne({ id: projectId }, { $inc: { inquiriesCount: 1 } });
    return NextResponse.json({ success: true, id: inquiry.id });
  } catch (error) {
    console.error("POST /api/project-inquiries failed", error);
    return NextResponse.json({ error: "Could not submit enquiry" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    if (!(await hasModuleAccess("projects"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const db = (await clientPromise).db(dbName);
    const url = new URL(request.url);
    const status = clean(url.searchParams.get("status"), 40);
    const filter = status && status !== "all" ? { status } : {};
    const rows = await db.collection("project_inquiries").find(filter).sort({ createdAt: -1 }).limit(300).toArray();
    return NextResponse.json(rows.map(({ _id, ...row }) => row));
  } catch (error) {
    console.error("GET /api/project-inquiries failed", error);
    return NextResponse.json({ error: "Failed to load enquiries" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await hasModuleAccess("projects"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const id = clean(body.id, 120);
    const status = clean(body.status, 40);
    const allowed = ["new", "contacted", "qualified", "converted", "archived"];
    if (!id || !allowed.includes(status)) return NextResponse.json({ error: "Invalid enquiry update" }, { status: 400 });
    const db = (await clientPromise).db(dbName);
    await db.collection("project_inquiries").updateOne({ id }, { $set: { status, updatedAt: new Date().toISOString() } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/project-inquiries failed", error);
    return NextResponse.json({ error: "Failed to update enquiry" }, { status: 500 });
  }
}
