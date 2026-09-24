import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import path from "path";
import clientPromise from "@/lib/mongodb";
import { hasModuleAccess } from "@/lib/auth";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB?.trim() || "civil-at-hand";
const ALLOWED = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

function hasMagic(type: string, buffer: Buffer): boolean {
  if (type === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (type === "image/jpeg") return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (type === "image/gif") {
    const signature = buffer.subarray(0, 6).toString("ascii");
    return signature === "GIF87a" || signature === "GIF89a";
  }
  if (type === "image/webp") {
    return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  }
  return false;
}

function safeBaseName(value: string): string {
  return path.basename(value || "community-group")
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 60) || "community-group";
}

export async function POST(request: Request) {
  try {
    if (!(await hasModuleAccess("community"))) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Please choose a group image." }, { status: 400 });
    }

    const extension = ALLOWED.get(file.type);
    if (!extension) {
      return NextResponse.json({ success: false, error: "Use JPG, PNG, WEBP or GIF for a group image." }, { status: 415 });
    }

    if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ success: false, error: "Group images must be between 1 byte and 8 MB." }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasMagic(file.type, buffer)) {
      return NextResponse.json({ success: false, error: "The image content does not match its file type." }, { status: 415 });
    }

    const filename = `${Date.now()}-${randomBytes(8).toString("hex")}-${safeBaseName(file.name)}${extension}`;
    const client = await clientPromise;
    const db = client.db(dbName);

    await db.collection("uploaded_files").insertOne({
      filename,
      originalName: String(file.name || "community-group-image").slice(0, 180),
      contentType: file.type,
      size: buffer.length,
      data: buffer.toString("base64"),
      purpose: "community-group-image",
      uploadedBy: "community-admin",
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      url: `/api/uploads/${filename}`,
      filename,
    });
  } catch (error) {
    console.error("Community group image upload error:", error);
    return NextResponse.json({ success: false, error: "Group image upload failed. Please try again." }, { status: 500 });
  }
}
