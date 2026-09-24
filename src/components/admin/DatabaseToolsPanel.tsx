"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Database, Search, Trash2, Loader2, ShieldAlert, ChevronLeft, ChevronRight,
  History, RotateCcw, X, AlertTriangle, Eye, ShieldCheck,
} from "lucide-react";

type CollectionInfo = { name: string; count: number };
type Doc = { _id: string; [key: string]: any };
type TrashItem = { backupId: string; collection: string; documentId: string; deletedAt: string; deletedBy: string; preview: any };

const LIMIT = 25;

function previewLabel(doc: Doc): string {
  return String(doc.title || doc.name || doc.fullName || doc.email || doc.code || doc.slug || doc.id || doc._id);
}

export default function DatabaseToolsPanel() {
  const [view, setView] = useState<"browse" | "trash">("browse");
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [activeCollection, setActiveCollection] = useState<string>("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<Doc | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [inspecting, setInspecting] = useState<Doc | null>(null);
  const [trash, setTrash] = useState<TrashItem[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [restoringId, setRestoringId] = useState("");

  const loadCollections = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/admin/db-tools?mode=collections", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to load collections.");
      setCollections(d.collections || []);
      if (!activeCollection && d.collections?.length) setActiveCollection(d.collections[0].name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load collections.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadCollections(); }, []);

  const loadDocs = async (collection: string, pageNum: number, q: string) => {
    if (!collection) return;
    setLoadingDocs(true);
    setError("");
    try {
      const params = new URLSearchParams({ mode: "list", collection, page: String(pageNum), limit: String(LIMIT) });
      if (q.trim()) params.set("q", q.trim());
      const r = await fetch(`/api/admin/db-tools?${params.toString()}`, { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to load records.");
      setDocs(d.documents || []);
      setTotal(d.total || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load records.");
      setDocs([]);
      setTotal(0);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (view === "browse" && activeCollection) void loadDocs(activeCollection, page, query);
  }, [view, activeCollection, page]);

  const runSearch = () => { setPage(1); void loadDocs(activeCollection, 1, query); };

  const loadTrash = async () => {
    setTrashLoading(true);
    setError("");
    try {
      const r = await fetch("/api/admin/db-tools?mode=trash", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to load Recently Deleted.");
      setTrash(d.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Recently Deleted.");
    } finally {
      setTrashLoading(false);
    }
  };

  useEffect(() => { if (view === "trash") void loadTrash(); }, [view]);

  const openConfirm = (doc: Doc) => { setConfirmTarget(doc); setConfirmText(""); setError(""); };

  const performDelete = async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    setError("");
    try {
      const r = await fetch("/api/admin/db-tools", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection: activeCollection, id: confirmTarget._id !== undefined ? (confirmTarget.id ?? confirmTarget._id) : confirmTarget._id }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Delete failed.");
      setMessage(`Deleted from "${activeCollection}". You can undo this from Recently Deleted for 30 days.`);
      setConfirmTarget(null);
      await loadDocs(activeCollection, page, query);
      await loadCollections();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  const restore = async (item: TrashItem) => {
    setRestoringId(item.backupId);
    setError("");
    try {
      const r = await fetch("/api/admin/db-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupId: item.backupId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Restore failed.");
      setMessage(`Restored a document back into "${item.collection}".`);
      await loadTrash();
      await loadCollections();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Restore failed.");
    } finally {
      setRestoringId("");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const confirmMatches = confirmTarget ? confirmText.trim() === previewLabel(confirmTarget).trim() : false;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-red-50/40 p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-red-700">
              <Database className="h-3.5 w-3.5" /> Superadmin only · Direct database access
            </div>
            <h3 className="mt-4 font-display text-2xl font-black tracking-tight text-slate-950">Database Tools</h3>
            <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-500">
              Browse and delete records without opening MongoDB directly. Deleting here is not instantly permanent —
              every delete is snapshotted and can be restored from <b>Recently Deleted</b> for 30 days.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-extrabold text-amber-800">
            <ShieldAlert className="h-4 w-4" /> Deletions cannot be filtered — double-check before confirming
          </div>
        </div>

        <div className="mt-6 flex gap-2 border-b border-slate-100">
          <button
            onClick={() => setView("browse")}
            className={`flex items-center gap-1.5 rounded-t-xl px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider ${view === "browse" ? "bg-slate-950 text-white" : "text-slate-500 hover:text-slate-800"}`}
          >
            <Search className="h-3.5 w-3.5" /> Browse & delete
          </button>
          <button
            onClick={() => setView("trash")}
            className={`flex items-center gap-1.5 rounded-t-xl px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider ${view === "trash" ? "bg-slate-950 text-white" : "text-slate-500 hover:text-slate-800"}`}
          >
            <History className="h-3.5 w-3.5" /> Recently deleted
          </button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</div>}
      {message && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{message}</div>}

      {view === "browse" && (
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="px-2 pb-2 text-[9px] font-extrabold uppercase tracking-widest text-slate-400">Collections</p>
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-orange-500" /></div>
            ) : (
              <div className="max-h-[520px] space-y-1 overflow-y-auto pr-1">
                {collections.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => { setActiveCollection(c.name); setPage(1); setQuery(""); }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-bold transition ${activeCollection === c.name ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-50"}`}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold ${activeCollection === c.name ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>{c.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h4 className="font-display text-lg font-black text-slate-950">{activeCollection || "Select a collection"}</h4>
              <div className="flex items-center gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
                  placeholder="Search title, name, email, code…"
                  className="min-h-10 w-full min-w-0 rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-orange-400 sm:w-64"
                />
                <button onClick={runSearch} className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-slate-950 px-3 text-[10px] font-extrabold uppercase tracking-wider text-white hover:bg-orange-500">
                  <Search className="h-3.5 w-3.5" /> Search
                </button>
              </div>
            </div>

            <div className="mt-5">
              {loadingDocs ? (
                <div className="flex justify-center py-14"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
              ) : docs.length === 0 ? (
                <div className="py-14 text-center text-xs font-semibold text-slate-400">No records found.</div>
              ) : (
                <div className="space-y-2">
                  {docs.map((doc) => (
                    <div key={doc._id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-extrabold text-slate-900">{previewLabel(doc)}</p>
                        <p className="mt-0.5 truncate text-[10px] text-slate-400">{doc.id || doc._id}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button onClick={() => setInspecting(doc)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 hover:border-orange-300 hover:text-orange-600">
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        <button onClick={() => openConfirm(doc)} className="inline-flex h-9 items-center gap-1 rounded-lg border border-red-200 px-2.5 text-[10px] font-extrabold uppercase tracking-wider text-red-600 hover:bg-red-50">
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {total > LIMIT && (
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-bold text-slate-500">
                <span>{total} total · Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                  <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {view === "trash" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-3 text-[11px] font-semibold text-emerald-800">
            <ShieldCheck className="h-4 w-4 shrink-0" /> Restoring puts the exact deleted document back, including its original ID.
          </div>
          {trashLoading ? (
            <div className="flex justify-center py-14"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
          ) : trash.length === 0 ? (
            <div className="py-14 text-center text-xs font-semibold text-slate-400">Nothing deleted recently.</div>
          ) : (
            <div className="space-y-2">
              {trash.map((item) => (
                <div key={item.backupId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold text-slate-900">{previewLabel(item.preview)} <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">{item.collection}</span></p>
                    <p className="mt-0.5 text-[10px] text-slate-400">Deleted {new Date(item.deletedAt).toLocaleString("en-IN")} by {item.deletedBy}</p>
                  </div>
                  <button
                    onClick={() => void restore(item)}
                    disabled={restoringId === item.backupId}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-slate-950 px-3 text-[10px] font-extrabold uppercase tracking-wider text-white hover:bg-orange-500 disabled:opacity-50"
                  >
                    {restoringId === item.backupId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />} Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {inspecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onClick={() => setInspecting(null)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-slate-900">{previewLabel(inspecting)}</h4>
              <button onClick={() => setInspecting(null)} className="rounded-lg p-1.5 hover:bg-slate-100"><X className="h-4 w-4" /></button>
            </div>
            <pre className="mt-4 whitespace-pre-wrap break-all rounded-xl bg-slate-50 p-3 text-[10px] leading-5 text-slate-700">{JSON.stringify(inspecting, null, 2)}</pre>
          </div>
        </div>
      )}

      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5">
            <div className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" /><h4 className="text-sm font-extrabold">Delete this record?</h4></div>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              You're about to delete <b>{previewLabel(confirmTarget)}</b> from <b>{activeCollection}</b>.
              It will be recoverable from Recently Deleted for 30 days.
            </p>
            <p className="mt-3 text-[11px] font-semibold text-slate-500">Type the record's name below to confirm:</p>
            <p className="mt-1 select-all rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800">{previewLabel(confirmTarget)}</p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-red-400"
              placeholder="Type it exactly to confirm"
              autoFocus
            />
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmTarget(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-600">Cancel</button>
              <button
                onClick={() => void performDelete()}
                disabled={!confirmMatches || deleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
