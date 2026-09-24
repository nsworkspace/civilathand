"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Bug, Lightbulb, Star, RefreshCw, Trash2, Mail, AlertCircle } from "lucide-react";

type FeedbackType = "bug" | "suggestion" | "review";
type FeedbackStatus = "new" | "reviewed" | "resolved";

type FeedbackEntry = {
  id: string;
  type: FeedbackType;
  name: string;
  email: string;
  message: string;
  rating?: number;
  page: string;
  status: FeedbackStatus;
  createdAt: string;
};

const TYPE_META: Record<FeedbackType, { label: string; icon: React.ElementType; color: string }> = {
  bug: { label: "Bug", icon: Bug, color: "bg-red-100 text-red-600" },
  suggestion: { label: "Suggestion", icon: Lightbulb, color: "bg-amber-100 text-amber-600" },
  review: { label: "Review", icon: Star, color: "bg-orange-100 text-orange-600" },
};

export default function FeedbackPanel() {
  const [reports, setReports] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | FeedbackType>("all");

  const load = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback");
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("You are not authorized to view feedback. Only the super admin can access this panel.");
        }
        throw new Error(`Server returned ${res.status}`);
      }
      const data = await res.json();
      if (data?.success) setReports(data.reports || []);
      else throw new Error(data?.error || "Unknown error");
    } catch (err: any) {
      console.error("Failed to load feedback:", err);
      setError(err.message || "Failed to load feedback. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: FeedbackStatus) => {
    setReports(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
    try {
      const res = await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed to update");
    } catch (err) {
      console.error("Failed to update status:", err);
      // revert optimistic update
      load(true);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this entry permanently?")) return;
    setReports(prev => prev.filter(r => r.id !== id));
    try {
      const res = await fetch(`/api/feedback?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    } catch (err) {
      console.error("Failed to delete:", err);
      load(true);
    }
  };

  const filtered = filter === "all" ? reports : reports.filter(r => r.type === filter);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          {(["all", "bug", "suggestion", "review"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all ${
                filter === f ? "bg-navy-950 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {f === "all" ? "All" : TYPE_META[f].label}
            </button>
          ))}
        </div>
        
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
          <p className="text-sm font-bold text-red-600">{error}</p>
          <button
            onClick={() => load(true)}
            className="mt-4 px-4 py-2 rounded-lg bg-orange-500 text-white text-xs font-bold uppercase tracking-wide"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm font-medium">No feedback entries yet.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(r => {
            const meta = TYPE_META[r.type];
            return (
              <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                      <meta.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-navy-950 truncate">{r.name || "Anonymous"}</p>
                      {r.email && (
                        <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3" /> {r.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {r.type === "review" && r.rating && (
                      <span className="flex items-center gap-0.5 text-[11px] font-bold text-orange-500 mr-1">
                        {r.rating} <Star className="h-3 w-3 fill-orange-400" />
                      </span>
                    )}
                    <button onClick={() => remove(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed mb-3">{r.message}</p>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-[10px] text-slate-400 font-medium">
                    {r.page && <span className="mr-2">Page: {r.page}</span>}
                    {r.createdAt && new Date(r.createdAt).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(["new", "reviewed", "resolved"] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatus(r.id, s)}
                        className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wide transition-all ${
                          r.status === s ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
