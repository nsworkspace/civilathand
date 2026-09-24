"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Star, RefreshCw, Trash2, Check, X, Plus, ShieldCheck } from "lucide-react";

type Testimonial = {
  id: string;
  name: string;
  role?: string;
  company?: string;
  message: string;
  rating: number;
  status: "pending" | "approved" | "rejected";
  source: "public" | "admin";
  createdAt: string;
};

export default function TestimonialsPanel() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [adding, setAdding] = useState(false);

  const load = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/testimonials?all=1");
      const data = await res.json();
      if (data?.success) setItems(data.testimonials || []);
    } catch (err) {
      console.error("Failed to load testimonials:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    setItems(prev => prev.map(t => (t.id === id ? { ...t, status } : t)));
    try {
      await fetch("/api/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
    } catch (err) {
      console.error("Failed to update:", err);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this testimonial permanently?")) return;
    setItems(prev => prev.filter(t => t.id !== id));
    try {
      await fetch(`/api/testimonials?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newMessage.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/testimonials?admin=1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, role: newRole, message: newMessage, rating: newRating }),
      });
      const data = await res.json();
      if (data?.success) {
        setItems(prev => [data.testimonial, ...prev]);
        setNewName("");
        setNewRole("");
        setNewMessage("");
        setNewRating(5);
        setShowAddForm(false);
      }
    } catch (err) {
      console.error("Failed to add testimonial:", err);
    } finally {
      setAdding(false);
    }
  };

  const filtered = filter === "all" ? items : items.filter(t => t.status === filter);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          {(["pending", "approved", "rejected", "all"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all ${
                filter === f ? "bg-navy-950 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] uppercase tracking-wide"
          >
            <Plus className="h-4 w-4" /> Add Testimonial
          </button>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wide disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-xl p-4 mb-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-3 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Added by you — goes live immediately
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Client name" className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
            <input value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="Role / Company" className="bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
          </div>
          <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="What they said..." rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-400 resize-none mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setNewRating(n)}>
                  <Star className={`h-5 w-5 ${n <= newRating ? "text-orange-400 fill-orange-400" : "text-slate-200"}`} />
                </button>
              ))}
            </div>
            <button type="submit" disabled={adding} className="px-5 py-2.5 rounded-lg bg-navy-950 hover:bg-navy-900 text-white font-bold text-xs uppercase tracking-wide disabled:opacity-60">
              {adding ? "Adding..." : "Publish"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm font-medium">Nothing here.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(t => (
            <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-bold text-navy-950">{t.name}</p>
                  {(t.role || t.company) && <p className="text-[11px] text-slate-400">{[t.role, t.company].filter(Boolean).join(" · ")}</p>}
                  <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} className={`h-3 w-3 ${n <= t.rating ? "text-orange-400 fill-orange-400" : "text-slate-200"}`} />
                    ))}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide flex-shrink-0 ${
                  t.status === "approved" ? "bg-emerald-100 text-emerald-600" : t.status === "rejected" ? "bg-red-100 text-red-500" : "bg-amber-100 text-amber-600"
                }`}>
                  {t.status} {t.source === "admin" && "· admin"}
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">"{t.message}"</p>
              <div className="flex items-center gap-2">
                {t.status !== "approved" && (
                  <button onClick={() => updateStatus(t.id, "approved")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[10px] font-bold uppercase">
                    <Check className="h-3 w-3" /> Approve
                  </button>
                )}
                {t.status !== "rejected" && (
                  <button onClick={() => updateStatus(t.id, "rejected")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 text-[10px] font-bold uppercase">
                    <X className="h-3 w-3" /> Reject
                  </button>
                )}
                <button onClick={() => remove(t.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 text-[10px] font-bold uppercase ml-auto">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
