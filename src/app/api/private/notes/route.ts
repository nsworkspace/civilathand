import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { isPrivateSessionValid } from "@/lib/private-auth";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";
const COLLECTION = "private_notes";
const MAX_CONTENT_LENGTH = 5000;
const MAX_LABEL_LENGTH = 200;

// Every handler in this file re-checks the session itself — it never trusts
// that a request "must" be authorized just because it reached this route.
// That's what actually makes this data private: even someone who finds this
// URL and calls it directly with curl/Postman gets a 401 without a valid,
// signed session cookie.

export async function GET() {
  if (!(await isPrivateSessionValid())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const notes = await db
      .collection(COLLECTION)
      .find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray();

    return NextResponse.json(
      notes.map((n: any) => ({
        id: n._id.toString(),
        type: n.type,
        label: n.label,
        content: n.content,
        createdAt: n.createdAt,
      }))
    );
  } catch (error) {
    console.error("Error fetching private notes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await isPrivateSessionValid())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const type = body?.type === "link" ? "link" : "note";
    const label = String(body?.label ?? "").trim().slice(0, MAX_LABEL_LENGTH);
    let content = String(body?.content ?? "").trim().slice(0, MAX_CONTENT_LENGTH);

    if (!label) {
      return NextResponse.json({ error: "Label is required." }, { status: 400 });
    }
    if (!content) {
      return NextResponse.json({ error: "Content is required." }, { status: 400 });
    }

    if (type === "link") {
      if (!/^https?:\/\//i.test(content)) {
        content = `https://${content}`;
      }
      try {
        // Throws on malformed input — cheap validation, no extra dependency.
        new URL(content);
      } catch {
        return NextResponse.json({ error: "That doesn't look like a valid link." }, { status: 400 });
      }
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const doc = {
      type,
      label,
      content,
      createdAt: new Date().toISOString(),
    };
    const result = await db.collection(COLLECTION).insertOne(doc);

    return NextResponse.json({ id: result.insertedId.toString(), ...doc }, { status: 201 });
  } catch (error) {
    console.error("Error creating private note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
