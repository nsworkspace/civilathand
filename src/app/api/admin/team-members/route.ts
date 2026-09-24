import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";
const DB = process.env.MONGODB_DB || "civil-at-hand";

export async function GET() {
  if (!(await hasModuleAccess("teamMembers"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const client = await clientPromise;
  const db = client.db(DB);
  const members = await db
    .collection("team_members")
    .find({})
    .sort({ submittedAt: -1 })
    .toArray();
  return NextResponse.json(members);
}

export async function PUT(req: Request) {
  if (!(await hasModuleAccess("teamMembers"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { _id, ...updateData } = body;
  const client = await clientPromise;
  const db = client.db(DB);
  await db.collection("team_members").updateOne(
    { _id: new ObjectId(_id) },
    { $set: { ...updateData, updatedAt: new Date().toISOString() } }
  );
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  if (!(await hasModuleAccess("teamMembers"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const client = await clientPromise;
  const db = client.db(DB);
  await db.collection("team_members").deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ success: true });
}
