import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { Readable } from "node:stream";
import clientPromise from "@/lib/mongodb";
import { getBearerToken, verifyFirebaseIdToken } from "@/lib/firebase-verify";
import { studyMaterialBucket } from "@/lib/studyMaterials";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const dbName = process.env.MONGODB_DB || "civil-at-hand";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await verifyFirebaseIdToken(getBearerToken(request));
    if (!user?.email || !user.emailVerified) return NextResponse.json({ error: "Sign in with a verified account to download this PDF." }, { status: 401 });
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db(dbName);
    const material = await db.collection("study_materials").findOne({ id }, { projection: { fileId: 1, fileName: 1, title: 1, paymentSlug: 1, published: 1 } });
    if (!material || material.published === false) return NextResponse.json({ error: "Study material not found." }, { status: 404 });
    if (!material.fileId || !ObjectId.isValid(material.fileId)) return NextResponse.json({ error: "Study material file is unavailable." }, { status: 404 });

    const normalizedEmail = user.email.trim().toLowerCase();
    const entitlement = await db.collection("payment_events").findOne({
      itemSlug: material.paymentSlug,
      refunded: { $ne: true },
      $or: [{ userId: user.uid }, { userEmail: normalizedEmail }],
    }, { projection: { _id: 1 } });
    if (!entitlement) return NextResponse.json({ error: "Payment required before download." }, { status: 403 });

    const bucket = studyMaterialBucket(db);
    const gridFile = await db.collection("study_material_files.files").findOne({ _id: new ObjectId(material.fileId) }, { projection: { contentType: 1, length: 1, filename: 1 } });
    if (!gridFile) return NextResponse.json({ error: "Stored PDF could not be found." }, { status: 404 });

    const stream = bucket.openDownloadStream(new ObjectId(material.fileId));
    const webStream = Readable.toWeb(stream) as unknown as ReadableStream;
    const downloadName = String(material.fileName || `${material.title || "civil-at-hand-study-material"}.pdf`).replace(/[\r\n\\/\"]+/g, "_");
    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(gridFile.length || ""),
        "Content-Disposition": `attachment; filename="${downloadName}"`,
        "Cache-Control": "private, no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  } catch (error) {
    console.error("Study material download failed:", error);
    return NextResponse.json({ error: "Unable to download this PDF." }, { status: 500 });
  }
}
