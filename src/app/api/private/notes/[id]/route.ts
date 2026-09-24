import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { isPrivateSessionValid } from "@/lib/private-auth";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";
const COLLECTION = "private_notes";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isPrivateSessionValid())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const result = await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting private note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
