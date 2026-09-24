import { NextResponse } from "next/server";
import path from "path";
import { hasAnyAdminAccess } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

// NOTE: this route used to write to `public/uploads` via the filesystem.
// That does NOT work on Vercel (the deployed filesystem is read-only and
// ephemeral outside /tmp), so admin image uploads would silently fail in
// production. It now stores images in MongoDB, the same way /api/upload
// does, and serves them back via /api/uploads/[filename].

const dbName = process.env.MONGODB_DB || "civil-at-hand";
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB

export async function POST(request: Request) {
  try {
    const authenticated = await hasAnyAdminAccess();
    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported image type. Allowed: JPEG, PNG, WEBP, GIF." },
        { status: 415 }
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "Image too large. Max size is 8MB." }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const validSignature =
      (file.type === "image/png" && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
      (file.type === "image/jpeg" && buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) ||
      (file.type === "image/gif" && (buffer.subarray(0, 6).toString("ascii") === "GIF87a" || buffer.subarray(0, 6).toString("ascii") === "GIF89a")) ||
      (file.type === "image/webp" && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP");
    if (!validSignature) {
      return NextResponse.json({ error: "The uploaded image content does not match its declared type." }, { status: 415 });
    }

    // Clean filename of spaces and special chars to prevent URI encoding issues
    const originalName = file.name || "image.png";
    const ext = path.extname(originalName) || ".png";
    const baseName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9]/g, "_").slice(0, 80);
    const filename = `${Date.now()}-${baseName}${ext}`;

    const client = await clientPromise;
    const db = client.db(dbName);
    const filesCollection = db.collection("uploaded_files");

    await filesCollection.insertOne({
      filename,
      contentType: file.type,
      data: buffer.toString("base64"),
      createdAt: new Date(),
    });

    // Served by the existing /api/uploads/[filename] route
    const fileUrl = `/api/uploads/${filename}`;
    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
