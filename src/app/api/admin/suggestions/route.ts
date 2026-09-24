import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "contacts";
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  if (q.length > 120) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  try {
    const db = (await clientPromise).db(process.env.MONGODB_DB || "civil-at-hand");
    const values = new Map<string, { value: string; label: string }>();

    if (type === "contacts") {
      const [users, leads] = await Promise.all([
        db.collection("users").find({}, { projection: { email: 1, name: 1, fullName: 1, company: 1 } }).limit(300).toArray(),
        db.collection("leads").find({}, { projection: { email: 1, name: 1, company: 1 } }).sort({ _id: -1 }).limit(300).toArray(),
      ]);
      for (const row of [...users, ...leads]) {
        const email = typeof row.email === "string" ? row.email.trim() : "";
        if (!email) continue;
        const label = String(row.name || row.fullName || row.company || email).trim();
        if (!q || email.toLowerCase().includes(q) || label.toLowerCase().includes(q)) values.set(email.toLowerCase(), { value: email, label });
      }
    }

    return NextResponse.json({ success: true, suggestions: Array.from(values.values()).slice(0, 30) });
  } catch (error) {
    console.error("Admin suggestions failed:", error);
    return NextResponse.json({ error: "Failed to load suggestions" }, { status: 500 });
  }
}
