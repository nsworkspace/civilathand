import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import path from "path";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB?.trim() || "civil-at-hand";

// Only non-executable business-file formats are accepted. HTML/SVG/JS are
// deliberately excluded because serving them from this origin can create
// stored-XSS problems.
const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/zip": ".zip",
  "image/vnd.dwg": ".dwg",
  "application/acad": ".dwg",
};

// MongoDB documents have a 16 MB BSON limit. Files are stored as base64 in a
// document, so 10 MB is a deliberately conservative ceiling that leaves room
// for base64 overhead and metadata. This prevents intermittent BSON-size
// failures that look like generic upload errors.
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const uploadAttempts = new Map<string, { count: number; windowStart: number }>();
const UPLOAD_WINDOW_MS = 10 * 60 * 1000;
const MAX_UPLOADS_PER_WINDOW = 30;

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isUploadRateLimited(ip: string): boolean {
  const now = Date.now();
  const current = uploadAttempts.get(ip);
  if (!current || now - current.windowStart >= UPLOAD_WINDOW_MS) {
    uploadAttempts.set(ip, { count: 1, windowStart: now });
    return false;
  }
  current.count += 1;
  return current.count > MAX_UPLOADS_PER_WINDOW;
}

function hasExpectedMagic(type: string, buffer: Buffer): boolean {
  if (type === "application/pdf") return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  if (type === "image/png") return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (type === "image/jpeg") return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (type === "image/gif") return buffer.subarray(0, 6).toString("ascii") === "GIF87a" || buffer.subarray(0, 6).toString("ascii") === "GIF89a";
  if (type === "image/webp") return buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  return true;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (isUploadRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many uploads. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: "The selected file is empty." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. The maximum upload size is 10 MB." },
        { status: 413 }
      );
    }

    const originalName = file.name || "upload";
    const extFromName = path.extname(originalName).toLowerCase();
    const expectedExt = ALLOWED_TYPES[file.type];

    // The MIME type and extension must agree whenever the browser supplied a
    // recognized MIME type. This blocks simple extension/MIME spoofing.
    if (expectedExt && extFromName && expectedExt !== extFromName) {
      return NextResponse.json(
        { error: "The file extension does not match its declared file type." },
        { status: 415 }
      );
    }

    const safeContentType = expectedExt
      ? file.type
      : Object.values(ALLOWED_TYPES).includes(extFromName)
        ? Object.entries(ALLOWED_TYPES).find(([, ext]) => ext === extFromName)?.[0]
        : undefined;

    if (!safeContentType) {
      return NextResponse.json(
        { error: "Unsupported file type. Allowed: PDF, images, Word, Excel, ZIP, and DWG." },
        { status: 415 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!hasExpectedMagic(safeContentType, buffer)) {
      return NextResponse.json(
        { error: "The uploaded file content does not match its file type." },
        { status: 415 }
      );
    }

    const baseName = path
      .basename(originalName, extFromName)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 80) || "upload";
    const ext = ALLOWED_TYPES[safeContentType] || extFromName || ".bin";
    const filename = `${Date.now()}-${cryptoRandomSuffix()}-${baseName}${ext}`;

    const client = await clientPromise;
    const db = client.db(dbName);
    await db.collection("uploaded_files").insertOne({
      filename,
      originalName: originalName.slice(0, 200),
      contentType: safeContentType,
      size: buffer.length,
      data: buffer.toString("base64"),
      createdAt: new Date(),
    });

    return NextResponse.json({ url: `/api/uploads/${filename}` });
  } catch (error) {
    // Never return raw MongoDB/driver errors to the browser: they can expose
    // infrastructure details. Keep the full diagnostic in server logs.
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again. If the problem continues, contact support." },
      { status: 500 }
    );
  }
}

function cryptoRandomSuffix(): string {
  return randomBytes(8).toString("hex");
}
