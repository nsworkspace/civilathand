import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import path from "path";
import clientPromise from "@/lib/mongodb";
import { getVendorRegistrationAccess, requireVerifiedVendorUser } from "@/lib/vendorRegistration";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

const dbName = process.env.MONGODB_DB?.trim() || "civil-at-hand";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function magicMatches(type: string, buffer: Buffer) {
  if (type === "application/pdf") return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  if (type === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (type === "image/jpeg") return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (type === "image/webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return false;
}

export async function POST(request: Request) {
  try {
    const user = await requireVerifiedVendorUser(request);
    if (!user) return NextResponse.json({ error: "Please sign in with a verified account first." }, { status: 401 });

    const limited = rateLimit(`vendor-portfolio:${user.uid}:${getClientIp(request)}`, { limit: 12, windowMs: 10 * 60 * 1000 });
    if (!limited.allowed) return NextResponse.json({ error: "Too many portfolio uploads. Please try again later." }, { status: 429 });

    const client = await clientPromise;
    const db = client.db(dbName);
    const access = await getVendorRegistrationAccess(db, user.uid);
    if (!access.allowed) return NextResponse.json({ error: access.disabled ? "Vendor registration is temporarily unavailable." : access.misconfigured ? "Vendor registration payment setup is temporarily unavailable." : access.alreadyUsed ? "Your registration payment has already been used. Please start a new registration." : "Please complete the vendor registration payment before uploading portfolio material." }, { status: 402 });

    const existingUploads = await db.collection("uploaded_files").countDocuments({ ownerUid: user.uid, purpose: "vendor-portfolio", claimedByVendorId: { $exists: false } });
    if (existingUploads >= 8) return NextResponse.json({ error: "You can add up to 8 portfolio items per registration." }, { status: 400 });

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Please select a portfolio file." }, { status: 400 });
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Portfolio files must be between 1 byte and 10 MB." }, { status: 413 });

    const extFromName = path.extname(file.name || "").toLowerCase();
    const expectedExt = ALLOWED[file.type];
    if (!expectedExt || expectedExt !== extFromName) return NextResponse.json({ error: "Only PDF, JPG, PNG and WEBP portfolio files are accepted." }, { status: 415 });

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!magicMatches(file.type, buffer)) return NextResponse.json({ error: "The uploaded file does not match its file type." }, { status: 415 });

    const baseName = path.basename(file.name, extFromName).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80) || "portfolio";
    const filename = `${Date.now()}-${randomBytes(8).toString("hex")}-${baseName}${expectedExt}`;
    await db.collection("uploaded_files").insertOne({
      filename,
      originalName: (file.name || "portfolio").slice(0, 200),
      contentType: file.type,
      size: buffer.length,
      data: buffer.toString("base64"),
      ownerUid: user.uid,
      ownerEmail: user.email?.toLowerCase() || null,
      purpose: "vendor-portfolio",
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, item: { type: "file", url: `/api/uploads/${filename}`, name: file.name || "Portfolio file" } });
  } catch (error) {
    console.error("Vendor portfolio upload error:", error);
    return NextResponse.json({ error: "Portfolio upload failed. Please try again." }, { status: 500 });
  }
}
