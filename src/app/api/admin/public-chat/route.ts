import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

function isPublicChat(ticket: any) {
  return ticket?.subject?.startsWith("[Live Chat]") || ticket?.source === "public-chat";
}

export async function DELETE(request: Request) {
  try {
    if (!(await hasModuleAccess("publicChat"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    if (searchParams.get("scope") !== "closed") {
      return NextResponse.json({ error: "Invalid cleanup scope" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("tickets");

    const candidates = await collection
      .find({ status: { $in: ["Resolved", "Closed"] } })
      .project({ _id: 1, subject: 1, source: 1 })
      .toArray();

    const ids = candidates.filter(isPublicChat).map((ticket) => ticket._id);
    if (ids.length === 0) return NextResponse.json({ success: true, deletedCount: 0 });

    const result = await collection.deleteMany({ _id: { $in: ids } });
    return NextResponse.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error("Error cleaning up public chat sessions:", error);
    return NextResponse.json({ error: "Failed to delete old live chats" }, { status: 500 });
  }
}
