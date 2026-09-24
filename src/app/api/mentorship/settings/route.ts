import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";

const defaultSettings = {
  title: "Find the Right Civil-Engineering Mentor for Your Goal",
  subtitle: "Universal 1-to-1 mentorship for civil engineering — exams, government careers, private-sector roles, structural design, BIM, site work, architecture and career direction. Choose your topic so your request can reach the right specialist.",
  price: "₹999",
  priceNote: "Specialist matching · practical guidance · configured access",
  whatsappNumber: "", // Set via Admin Panel only
  paymentLink: "",
  mentors: [
    {
      initials: "NK",
      name: "Naveen Kumar",
      role: "GATE · IES · SSC-JE Topper",
      creds: [
        "GATE qualified 10 times — under AIR 50",
        "ESE / IES topper — under AIR 100",
        "SSC-JE topper"
      ],
      tag: "Lead Mentor",
      expertise: [
        "Exams & Government Careers",
        "GATE Civil",
        "ESE / IES Civil",
        "SSC-JE Civil",
        "Civil Career Guidance",
        "Structural & Design",
      ],
    }
  ]
};

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("mentorship_settings");

    const settings = await collection.findOne({});
    if (!settings) {
      // Seed default settings if not exists
      await collection.insertOne({ ...defaultSettings, createdAt: new Date() });
      return NextResponse.json({ ...defaultSettings, paymentAmount: 0 }, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        }
      });
    }

    const { _id, paymentLink: _legacyPaymentLink, priceAmount: _legacyPriceAmount, ...rest } = settings as any;
    const paymentItem = await db.collection("payment_items").findOne({ slug: "mentorship-program", active: true });
    return NextResponse.json({ ...rest, paymentAmount: paymentItem ? Number(paymentItem.amount) || 0 : 0 }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      }
    });
  } catch (error) {
    console.error("Error fetching mentorship settings:", error);
    return NextResponse.json({ ...defaultSettings, paymentAmount: 0 }, { status: 200 });
  }
}

// Track a page view for the mentorship page (fire-and-forget from the client)
export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("mentorship_settings");

    const result = await collection.findOneAndUpdate(
      {},
      { $inc: { views: 1 } },
      { returnDocument: "after", upsert: true }
    );

    const doc = (result as any) || {};
    const { _id, ...rest } = doc;
    return NextResponse.json({ success: true, views: rest.views || 0 });
  } catch (error) {
    console.error("Error tracking mentorship view:", error);
    return NextResponse.json({ error: "Failed to track view." }, { status: 500 });
  }
}
