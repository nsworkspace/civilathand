import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("tickets");

    const ticket = await collection.findOne({
      $or: [{ id }, { ticketNumber: id }]
    });
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const { _id, ...rest } = ticket;
    return NextResponse.json(rest);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, priority } = body;

    const timeStr = new Date().toISOString().replace("T", " ").substring(0, 16);
    const updateFields: any = { updatedAt: timeStr };

    if (status) updateFields.status = status;
    if (priority) updateFields.priority = priority;

    try {
      const client = await clientPromise;
      const db = client.db(dbName);
      const collection = db.collection("tickets");

      const result = await collection.findOneAndUpdate(
        { $or: [{ id }, { ticketNumber: id }] },
        { $set: updateFields },
        { returnDocument: "after" }
      );

      if (!result) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }

      const { _id, ...rest } = result as any;
      return NextResponse.json(rest);
    } catch (dbErr) {
      console.warn("MongoDB update error, fallback response:", dbErr);
      return NextResponse.json({ id, ...updateFields });
    }
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { text, sender, senderName, attachments } = body;

    if ((!text || !text.trim()) && (!attachments || !attachments.length)) {
      return NextResponse.json({ error: "Message text or an attachment is required" }, { status: 400 });
    }
    if (!sender) {
      return NextResponse.json({ error: "Sender is required" }, { status: 400 });
    }

    const timeStr = new Date().toISOString().replace("T", " ").substring(0, 16);
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender,
      senderName: senderName || (sender === "client" ? "Client" : "Support Engineer"),
      text: (text || "").trim(),
      timestamp: timeStr,
      ...(Array.isArray(attachments) && attachments.length
        ? {
            attachments: attachments
              .filter((a: any) => a && a.url)
              .map((a: any) => ({
                url: String(a.url),
                name: String(a.name || "attachment"),
                type: String(a.type || ""),
                size: a.size ? String(a.size) : undefined,
              })),
          }
        : {}),
    };

    try {
      const client = await clientPromise;
      const db = client.db(dbName);
      const collection = db.collection("tickets");

      const ticket = await collection.findOne({
        $or: [{ id }, { ticketNumber: id }]
      });
      if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }

      const updatedMessages = [...(ticket.messages || []), newMsg];
      const newStatus = sender === "admin" ? "In Progress" : ticket.status === "Closed" ? "Open" : ticket.status;

      await collection.updateOne(
        { _id: ticket._id },
        {
          $set: {
            messages: updatedMessages,
            updatedAt: timeStr,
            status: newStatus,
          }
        }
      );

      return NextResponse.json({
        success: true,
        message: newMsg,
        status: newStatus,
        updatedAt: timeStr,
      });
    } catch (dbErr) {
      console.warn("MongoDB reply error, fallback response:", dbErr);
      return NextResponse.json({
        success: true,
        message: newMsg,
        updatedAt: timeStr,
      });
    }
  } catch (error) {
    console.error("Error adding ticket message:", error);
    return NextResponse.json({ error: "Failed to post message to ticket" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const hasTicketAccess = await hasModuleAccess("tickets");
    const hasPublicChatAccess = await hasModuleAccess("publicChat");
    if (!hasTicketAccess && !hasPublicChatAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    try {
      const client = await clientPromise;
      const db = client.db(dbName);
      const collection = db.collection("tickets");
      const query = { $or: [{ id }, { ticketNumber: id }] };
      const ticket = await collection.findOne(query);

      if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }

      const isPublicChat = ticket.subject?.startsWith("[Live Chat]") || ticket.source === "public-chat";
      if (!hasTicketAccess && !isPublicChat) {
        return NextResponse.json({ error: "You do not have permission to delete this ticket" }, { status: 403 });
      }

      const result = await collection.deleteOne({ _id: ticket._id });
      return NextResponse.json({ success: true, id, deletedCount: result.deletedCount });
    } catch (dbErr) {
      console.error("MongoDB delete error:", dbErr);
      return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 });
  }
}
