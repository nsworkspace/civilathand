import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

const dbName = process.env.MONGODB_DB?.trim() || "civil-at-hand";
const SAFE_FILENAME = /^[a-zA-Z0-9._-]{1,220}$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    if (!filename || !SAFE_FILENAME.test(filename) || filename.includes("..")) {
      return new Response("File not found", { status: 404 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const fileDoc = await db.collection("uploaded_files").findOne({ filename });

    if (!fileDoc || typeof fileDoc.data !== "string") {
      return new Response("File not found", { status: 404 });
    }

    const buffer = Buffer.from(fileDoc.data, "base64");
    const contentType = typeof fileDoc.contentType === "string"
      ? fileDoc.contentType
      : "application/octet-stream";

    const inlineSafeTypes = new Set([
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ]);

    const disposition = inlineSafeTypes.has(contentType) ? "inline" : "attachment";
    const safeFilename = filename.replace(/["\r\n]/g, "");

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${disposition}; filename="${safeFilename}"`,
        "Content-Length": String(buffer.byteLength),
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox; default-src 'none';",
        "Cross-Origin-Resource-Policy": "same-origin",
        "Cache-Control": "private, max-age=3600, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error retrieving file from MongoDB:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
