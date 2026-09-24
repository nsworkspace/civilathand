import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subject, category, priority, description, clientName, clientEmail, clientPhone, source, attachments } = body;

    if (!subject || !description || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("tickets");

    const timeStr = new Date().toISOString().replace("T", " ").substring(0, 16);
    const ticketNumber = `TICK-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTicket = {
      id: `tick-${Date.now()}`,
      ticketNumber,
      subject,
      category,
      priority: priority || "Medium",
      status: "Open",
      clientName: clientName || "Visitor",
      clientEmail: typeof clientEmail === "string" ? clientEmail.trim().toLowerCase() : "",
      clientPhone: typeof clientPhone === "string" ? clientPhone.trim() : "",  // Phone number is saved here
      source: source || "web_form",
      description,
      createdAt: timeStr,
      updatedAt: timeStr,
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: "client",
          senderName: clientName || "Visitor",
          text: description,
          timestamp: timeStr,
          attachments: attachments || [],
        },
      ],
    };

    // Insert the ticket and then fetch the inserted document to get the _id
    const result = await collection.insertOne(newTicket);
    const insertedTicket = await collection.findOne({ _id: result.insertedId });

    // Remove _id from the response, but keep everything else
    const { _id, ...responseTicket } = insertedTicket!;
    return NextResponse.json(responseTicket, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json({ error: "Chat service is temporarily unavailable. Please try again." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const name = searchParams.get("clientName");

    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("tickets");

    let query = {};
    if (email) {
      query = { clientEmail: email.toLowerCase() };
    } else if (name) {
      query = { clientName: name };
    }

    const tickets = await collection.find(query).toArray();
    // Remove _id from each ticket
    const cleaned = tickets.map(({ _id, ...rest }) => rest);
    return NextResponse.json(cleaned, { status: 200 });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}
