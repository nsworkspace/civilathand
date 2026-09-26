"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, FileText, Loader2, Pencil, Plus, Save, ShieldCheck, Trash2, UploadCloud, X } from "lucide-react";

type Material = { id: string; title: string; description?: string; subject?: string; level?: string; units?: string[]; price?: number; featured?: boolean; published?: boolean; fileName?: string; fileSize?: number };

const emptyForm = { title: "", description: "", subject: "Civil Engineering", level: "Diploma / B.Tech / Competitive Learning", units: "", price: "499", featured: false, published: true };
const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export function StudyMaterialsPanel() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");

  const load = async () => {
    setLoading(true);
    try { const r = await fetch("/api/study-materials", { cache: "no-store" }); const d = await r.json(); setMaterials(Array.isArray(d?.materials) ? d.materials : []); } catch { setError("Unable to load study materials."); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setMessage("");
    if (!file) { setError("Select a PDF first."); return; }
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) { setError("Only PDF files are accepted."); return; }
    setSaving(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.append(key, String(value)));
      body.append("file", file);
      const r = await fetch("/api/study-materials", { method: "POST", body });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Upload failed.");
      setMessage("Study material uploaded and its payment item is ready."); setForm(emptyForm); setFile(null); await load();
      const input = document.getElementById("study-pdf-upload") as HTMLInputElement | null; if (input) input.value = "";
    } catch (e: any) { setError(e?.message || "Upload failed."); } finally { setSaving(false); }
  };

  const update = async (id: string, values: Record<string, unknown>) => {
    setError(""); setMessage("");
    try { const r = await fetch(`/api/study-materials/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) }); const d = await r.json(); if (!r.ok) throw new Error(d.error || "Update failed."); setMessage("Study material updated."); setEditing(null); await load(); } catch (e: any) { setError(e?.message || "Update failed."); }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this PDF and its payment item? Existing paid customers will lose access. Continue only if you intend to retire it.")) return;
    setError("");
    try { const r = await fetch(`/api/study-materials?id=${encodeURIComponent(id)}`, { method: "DELETE" }); const d = await r.json(); if (!r.ok) throw new Error(d.error || "Delete failed."); setMessage("Study material deleted."); await load(); } catch (e: any) { setError(e?.message || "Delete failed."); }
  };

  return <div className="space-y-6">
    <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-orange-50/50 p-5 sm:p-7 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-orange-700"><BookOpen className="h-3.5 w-3.5" /> Premium Education Library</div><h3 className="mt-4 font-display text-2xl font-black tracking-tight text-slate-950">Upload NS Construction Study Material</h3><p className="mt-2 max-w-2xl text-xs leading-6 text-slate-500">Upload your original PDF, define the unit structure and choose the selling price. The PDF is stored in MongoDB GridFS and is never exposed as a public file URL.</p></div>
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-extrabold text-emerald-700"><ShieldCheck className="h-4 w-4" /> Payment-gated delivery</div>
      </div>
      <form onSubmit={upload} className="mt-7 space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <input value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="PDF title — e.g. All-in-One Civil Engineering" className="rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-orange-400" required />
          <input value={form.subject} onChange={e => setForm({...form,subject:e.target.value})} placeholder="Subject / discipline" className="rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-orange-400" />
          <input value={form.level} onChange={e => setForm({...form,level:e.target.value})} placeholder="Level / audience" className="rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-orange-400" />
          <div className="relative"><span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span><input type="number" min="1" max="500000" step="1" value={form.price} onChange={e => setForm({...form,price:e.target.value})} placeholder="Price" className="w-full rounded-xl border border-slate-200 py-3 pl-8 pr-3.5 text-sm outline-none focus:border-orange-400" required /></div>
        </div>
        <textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})} rows={3} placeholder="Short premium description — what students get, what it covers, how it is useful." className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-orange-400" />
        <textarea value={form.units} onChange={e => setForm({...form,units:e.target.value})} rows={5} placeholder={'Units — one per line\nUnit 1: Building Materials\nUnit 2: Surveying\nUnit 3: RCC Design\nUnit 4: Soil Mechanics'} className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-orange-400" />
        <label htmlFor="study-pdf-upload" className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 transition hover:border-orange-300 hover:bg-orange-50/40"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm"><UploadCloud className="h-5 w-5" /></span><span className="min-w-0"><span className="block text-xs font-extrabold text-slate-800">{file ? file.name : "Choose PDF file"}</span><span className="mt-1 block text-[10px] text-slate-500">PDF only · maximum 25 MB · stored privately in MongoDB GridFS</span></span></label>
        <input id="study-pdf-upload" type="file" accept="application/pdf,.pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="sr-only" />
        <div className="flex flex-wrap gap-4 text-[10px] font-bold text-slate-600"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={e => setForm({...form,featured:e.target.checked})} /> Feature this material</label><label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.published} onChange={e => setForm({...form,published:e.target.checked})} /> Publish immediately</label></div>
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</div>}{message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{message}</div>}
        <button disabled={saving} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-orange-500 disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{saving ? "Uploading securely…" : "Publish Study Material"}</button>
      </form>
    </div>

    <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm">
      <div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-orange-600">Library control</p><h3 className="mt-1 font-display text-xl font-black text-slate-950">Published & private PDFs</h3></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-extrabold text-slate-600">{materials.length} total</span></div>
      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-orange-500" /></div> : materials.length === 0 ? <div className="py-12 text-center text-xs font-semibold text-slate-400">No study materials uploaded yet.</div> : <div className="mt-5 space-y-3">{materials.map(m => <div key={m.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-orange-500" /><p className="truncate text-sm font-extrabold text-slate-900">{m.title}</p></div><p className="mt-1 text-[10px] text-slate-500">{m.subject} · {m.units?.length || 1} units · {m.fileName || "PDF"} · {money(Number(m.price || 0))}</p><div className="mt-2 flex flex-wrap gap-1.5"><span className={`rounded-full px-2 py-1 text-[8px] font-extrabold uppercase tracking-wider ${m.published === false ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"}`}>{m.published === false ? "Hidden" : "Published"}</span>{m.featured && <span className="rounded-full bg-amber-50 px-2 py-1 text-[8px] font-extrabold uppercase tracking-wider text-amber-700">Featured</span>}</div></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => {setEditing(m.id);setEditPrice(String(m.price || 0));}} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 hover:border-orange-300 hover:text-orange-600"><Pencil className="h-3.5 w-3.5" /> Edit price</button><button type="button" onClick={() => void update(m.id,{published:m.published===false})} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 hover:border-orange-300 hover:text-orange-600">{m.published === false ? "Publish" : "Hide"}</button><button type="button" onClick={() => void remove(m.id)} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-red-200 px-3 text-[10px] font-extrabold uppercase tracking-wider text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Delete</button></div></div>{editing===m.id && <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row"><input type="number" min="1" max="500000" value={editPrice} onChange={e=>setEditPrice(e.target.value)} className="min-h-10 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-orange-400" /><button type="button" onClick={()=>void update(m.id,{price:Number(editPrice)})} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-[10px] font-extrabold uppercase tracking-wider text-white hover:bg-orange-500"><Save className="h-3.5 w-3.5" /> Save price</button><button type="button" onClick={()=>setEditing(null)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-600"><X className="h-3.5 w-3.5" /> Cancel</button></div>}</div>)}</div>}
    </div>
  </div>;
}
