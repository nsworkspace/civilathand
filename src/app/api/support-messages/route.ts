import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getAdminSession, hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function GET() {
  try {
    const adminSession = await getAdminSession();
    if (adminSession && !(await hasModuleAccess("publicChat"))) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("chats");
    const headers = {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    };

    const chats = await collection.find({}).toArray();
    const formattedChats = chats.map(({ _id, ...rest }) => rest);

    // Sort chronologically by createdAt (ISO date) ascending — oldest message first
    // Falls back to string ID for legacy records without createdAt
    formattedChats.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return (a.id || "").localeCompare(b.id || "");
    });

    return NextResponse.json(formattedChats, { headers });
  } catch (error) {
    console.error("Error in GET /api/support-messages:", error);
    return NextResponse.json({ error: "Failed to fetch support messages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, sender, timestamp } = body;

    if (!text || !sender) {
      return NextResponse.json({ error: "Text and sender are required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("chats");

    const newMsg = {
      id: `msg-${Date.now()}`,
      text,
      sender,
      timestamp: timestamp || new Date().toISOString().replace("T", " ").substring(0, 16),
      // createdAt as ISO string for reliable chronological sorting
      createdAt: new Date().toISOString(),
    };

    await collection.insertOne(newMsg);

    const { _id, ...responseChat } = newMsg as any;
    return NextResponse.json(responseChat, { status: 201 });
  } catch (error) {
    console.error("Error creating support message:", error);
    return NextResponse.json({ error: "Failed to create support message" }, { status: 500 });
  }
}
