import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { isAdminAuthenticated, getAdminSession } from "@/lib/auth";
import {
  EDITABLE_COLLECTIONS,
  DB_TOOLS_BACKUP_COLLECTION,
  DB_TOOLS_BACKUP_TTL_DAYS,
  isEditableCollection,
  isProtectedCollection,
} from "@/lib/dbTools";

export const dynamic = "force-dynamic";
const dbName = process.env.MONGODB_DB || "civil-at-hand";
const PAGE_SIZE_MAX = 100;

// Every route below is superadmin-only — deliberately checked with
// isAdminAuthenticated() (NOT hasModuleAccess), so this can never be
// delegated to a sub-admin account regardless of what modules they're
// granted. See src/lib/dbTools.ts for the full safety model.

function toPlain(doc: any) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  return { _id: _id?.toString?.() ?? String(_id), ...rest };
}

// GET
//   ?mode=collections            -> list of editable collections + doc counts
//   ?mode=list&collection=X      -> paginated documents in collection X
//   ?mode=trash                  -> recently deleted documents (for restore)
export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Superadmin access required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || "collections";

  try {
    const client = await clientPromise;
    const db = client.db(dbName);

    if (mode === "collections") {
      const counts = await Promise.all(
        EDITABLE_COLLECTIONS.map(async (name) => {
          try {
            const count = await db.collection(name).estimatedDocumentCount();
            return { name, count };
          } catch {
            return { name, count: 0 };
          }
        })
      );
      return NextResponse.json({ success: true, collections: counts });
    }

    if (mode === "trash") {
      const items = await db
        .collection(DB_TOOLS_BACKUP_COLLECTION)
        .find({})
        .sort({ deletedAt: -1 })
        .limit(200)
        .toArray();
      return NextResponse.json({
        success: true,
        items: items.map((i: any) => ({
          backupId: i._id.toString(),
          collection: i.collection,
          documentId: i.documentId,
          deletedAt: i.deletedAt,
          deletedBy: i.deletedBy,
          preview: i.document,
        })),
      });
    }

    if (mode === "list") {
      const collection = searchParams.get("collection") || "";
      if (!isEditableCollection(collection)) {
        return NextResponse.json({ error: "This collection is not available in Database Tools." }, { status: 400 });
      }
      const page = Math.max(1, Number(searchParams.get("page")) || 1);
      const limit = Math.min(PAGE_SIZE_MAX, Math.max(1, Number(searchParams.get("limit")) || 25));
      const q = (searchParams.get("q") || "").trim();

      const col = db.collection(collection);
      let filter: Record<string, any> = {};
      if (q) {
        // Best-effort text-ish search across common human-readable fields.
        // This is a convenience filter, not a full index — fine at the
        // scale of an admin browsing tool.
        const rx = { $regex: q.slice(0, 120).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
        filter = {
          $or: [
            { id: rx },
            { slug: rx },
            { code: rx },
            { title: rx },
            { name: rx },
            { email: rx },
            { fullName: rx },
            { username: rx },
          ],
        };
      }

      const total = await col.countDocuments(filter);
      const docs = await col
        .find(filter)
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

      return NextResponse.json({
        success: true,
        collection,
        page,
        limit,
        total,
        documents: docs.map(toPlain),
      });
    }

    return NextResponse.json({ error: "Unknown mode." }, { status: 400 });
  } catch (error) {
    console.error("Database Tools GET failed:", error);
    return NextResponse.json({ error: "Failed to load data." }, { status: 500 });
  }
}

// DELETE  body: { collection, id }
// Snapshots the full document into admin_deleted_backups (with a 30-day
// TTL index) before removing it, and writes an activity log entry.
export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Superadmin access required." }, { status: 403 });
  }
  const session = await getAdminSession();

  try {
    const body = await request.json().catch(() => null);
    const collection = String(body?.collection || "");
    const id = String(body?.id || "").trim();

    if (!isEditableCollection(collection)) {
      if (isProtectedCollection(collection)) {
        return NextResponse.json(
          { error: "This collection is protected and cannot be deleted from here. Use its dedicated admin panel (e.g. Payment History → Refund) instead." },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: "This collection is not available in Database Tools." }, { status: 400 });
    }
    if (!id) return NextResponse.json({ error: "Missing document id." }, { status: 400 });

    const client = await clientPromise;
    const db = client.db(dbName);
    const col = db.collection(collection);

    // Documents in this app are looked up either by Mongo's own _id or by
    // an app-level string `id` field, depending on the collection — try
    // both so this works uniformly across all of them.
    let query: Record<string, any> | null = null;
    if (ObjectId.isValid(id) && String(new ObjectId(id)) === id) {
      query = { _id: new ObjectId(id) };
    }
    const doc = query
      ? await col.findOne(query)
      : await col.findOne({ id });
    const finalQuery = doc ? (query || { id }) : null;

    if (!doc || !finalQuery) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    // Snapshot before delete — this is the safety net that makes an
    // accidental click recoverable instead of permanent.
    await db.collection(DB_TOOLS_BACKUP_COLLECTION).createIndex(
      { deletedAt: 1 },
      { expireAfterSeconds: DB_TOOLS_BACKUP_TTL_DAYS * 24 * 60 * 60 }
    ).catch(() => {});
    await db.collection(DB_TOOLS_BACKUP_COLLECTION).insertOne({
      collection,
      documentId: id,
      document: doc,
      deletedAt: new Date().toISOString(),
      deletedBy: session?.username || "superadmin",
    });

    await col.deleteOne(finalQuery);

    await db.collection("activity_logs").insertOne({
      username: session?.username || "superadmin",
      role: session?.role || "superadmin",
      type: "action",
      action: "Deleted database record",
      module: "Database Tools",
      target: `${collection}/${id}`,
      summary: `Deleted a document from "${collection}" (recoverable for ${DB_TOOLS_BACKUP_TTL_DAYS} days via Recently Deleted).`,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database Tools DELETE failed:", error);
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
}

// POST body: { backupId }  — restores a document from a snapshot.
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Superadmin access required." }, { status: 403 });
  }
  const session = await getAdminSession();

  try {
    const body = await request.json().catch(() => null);
    const backupId = String(body?.backupId || "").trim();
    if (!backupId || !ObjectId.isValid(backupId)) {
      return NextResponse.json({ error: "Missing or invalid backup id." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(dbName);
    const backup = await db.collection(DB_TOOLS_BACKUP_COLLECTION).findOne({ _id: new ObjectId(backupId) });
    if (!backup) return NextResponse.json({ error: "Backup not found or already expired." }, { status: 404 });
    if (!isEditableCollection(backup.collection)) {
      return NextResponse.json({ error: "This collection can no longer be restored from here." }, { status: 400 });
    }

    const restoreDoc = { ...backup.document };
    // Keep the original _id if present so relationships/links stay intact.
    if (restoreDoc._id && typeof restoreDoc._id === "string" && ObjectId.isValid(restoreDoc._id)) {
      restoreDoc._id = new ObjectId(restoreDoc._id);
    }

    await db.collection(backup.collection).updateOne(
      restoreDoc._id ? { _id: restoreDoc._id } : { id: restoreDoc.id },
      { $set: restoreDoc },
      { upsert: true }
    );
    await db.collection(DB_TOOLS_BACKUP_COLLECTION).deleteOne({ _id: backup._id });

    await db.collection("activity_logs").insertOne({
      username: session?.username || "superadmin",
      role: session?.role || "superadmin",
      type: "action",
      action: "Restored database record",
      module: "Database Tools",
      target: `${backup.collection}/${backup.documentId}`,
      summary: `Restored a previously deleted document in "${backup.collection}".`,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database Tools restore failed:", error);
    return NextResponse.json({ error: "Restore failed." }, { status: 500 });
  }
}
