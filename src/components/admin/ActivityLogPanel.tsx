"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Clock, Crown, KeyRound, Activity, RefreshCw, Trash2, CheckSquare, Square, X } from "lucide-react";

const MODULE_NAMES: Record<string, string> = {
  adminAccounts: "Admin Accounts",
  analytics: "Analytics Dashboard",
  studyMaterials: "Premium Study Materials",
  activityLog: "Activity & Audit Log",
  Authentication: "Authentication",
  leads: "Lead & CRM Management",
  projects: "Project Control Center",
  drawings: "Drawing Audit Desk",
  invoices: "Billing & Invoicing",
  paymentSetup: "Payment Setup",
  paymentOffers: "Offers & Coupons",
  paymentHistory: "Payment History",
  tickets: "Help Desk",
  publicChat: "Public Live Chat",
  blogs: "Blog Management",
  portfolio: "Portfolio Management",
  services: "Services Management",
  careers: "Career Applications",
  softwareCourses: "Software Courses",
  notifications: "Notification Center",
  clients: "Client Workspace",
  mentorship: "Mentorship Panel",
  vendors: "Vendor Management",
  vendorLeads: "Vendor Leads",
  registeredUsers: "Registered User Tracker",
  teamMembers: "Team Members",
};

type LogEntry = {
  id: string; username: string; role: "superadmin" | "custom"; type: "login" | "action";
  action: string; module: string; target: string; summary: string; method: string; path: string;
  ip: string; userAgent: string; createdAt: string | null; loggedInAt: string | null;
};

export default function ActivityLogPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmingClearAll, setConfirmingClearAll] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/activity-log", { cache: "no-store" });
      const data = await res.json();
      if (data?.success) {
        setLogs(data.logs || []);
        // Drop any selected ids that no longer exist after a refresh.
        setSelected((prev) => {
          const stillPresent = new Set((data.logs || []).map((l: LogEntry) => l.id));
          const next = new Set<string>();
          prev.forEach((id) => { if (stillPresent.has(id)) next.add(id); });
          return next;
        });
      }
    } catch (err) {
      console.error("Failed to load activity log:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const allSelected = logs.length > 0 && selected.size === logs.length;
  const someSelected = selected.size > 0;

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(logs.map((l) => l.id)));
  };

  const deleteSelected = async () => {
    if (selected.size === 0 || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/activity-log", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (res.ok) {
        setLogs((prev) => prev.filter((l) => !selected.has(l.id)));
        setSelected(new Set());
      } else {
        console.error("Failed to delete selected activity log entries");
      }
    } catch (err) {
      console.error("Failed to delete selected activity log entries:", err);
    } finally {
      setDeleting(false);
    }
  };

  const clearAll = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/activity-log", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        setLogs([]);
        setSelected(new Set());
      } else {
        console.error("Failed to clear activity log");
      }
    } catch (err) {
      console.error("Failed to clear activity log:", err);
    } finally {
      setDeleting(false);
      setConfirmingClearAll(false);
    }
  };

  const toolbarLabel = useMemo(
    () => (someSelected ? `${selected.size} selected` : "Select all"),
    [someSelected, selected.size]
  );

  return <div>
    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
      <div className="text-xs text-slate-500 font-medium max-w-2xl">Audit history. Super Admins see all admin activity; Sub-Admins see their own login and actions.</div>
      <div className="flex items-center gap-2">
        {someSelected && (
          <button
            onClick={deleteSelected}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-bold text-rose-600 hover:bg-rose-100 disabled:opacity-60"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Delete {selected.size} selected
          </button>
        )}
        {logs.length > 0 && (
          <button
            onClick={() => setConfirmingClearAll(true)}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600 hover:border-rose-300 hover:text-rose-600 disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear all
          </button>
        )}
        <button onClick={load} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600 hover:border-orange-300"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
      </div>
    </div>

    {confirmingClearAll && (
      <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs font-bold text-rose-700">Delete every activity log entry in view? This cannot be undone.</p>
        <div className="flex items-center gap-2">
          <button onClick={clearAll} disabled={deleting} className="rounded-lg bg-rose-600 px-3 py-1.5 text-[10px] font-extrabold text-white hover:bg-rose-700 disabled:opacity-60">
            {deleting ? "Deleting…" : "Yes, delete all"}
          </button>
          <button onClick={() => setConfirmingClearAll(false)} className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-[10px] font-extrabold text-rose-600 hover:bg-rose-100 inline-flex items-center gap-1"><X className="h-3 w-3" /> Cancel</button>
        </div>
      </div>
    )}

    {logs.length > 0 && (
      <button
        onClick={toggleAll}
        className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-orange-600"
      >
        {allSelected ? <CheckSquare className="h-3.5 w-3.5 text-orange-600" /> : <Square className="h-3.5 w-3.5" />}
        {toolbarLabel}
      </button>
    )}

    {loading ? <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div> : logs.length === 0 ? <div className="text-center py-16 text-slate-400 text-sm font-medium">No activity recorded yet.</div> : <div className="flex flex-col gap-2">
      {logs.map(log => {
        const isChecked = selected.has(log.id);
        return (
          <div key={log.id} className={`rounded-xl border px-4 py-3 transition-colors ${isChecked ? "border-orange-300 bg-orange-50/40" : "border-slate-200 bg-white"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <button
                  onClick={() => toggleOne(log.id)}
                  aria-label={isChecked ? "Deselect entry" : "Select entry"}
                  className="mt-1.5 flex-shrink-0 text-slate-400 hover:text-orange-600"
                >
                  {isChecked ? <CheckSquare className="h-4 w-4 text-orange-600" /> : <Square className="h-4 w-4" />}
                </button>
                <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">{log.type === "login" ? (log.role === "superadmin" ? <Crown className="h-4 w-4 text-orange-600" /> : <KeyRound className="h-4 w-4 text-orange-600" />) : <Activity className="h-4 w-4 text-orange-600" />}</div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{log.username}<span className="ml-2 text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{log.role === "superadmin" ? "Super Admin" : "Sub-Admin"}</span></p>
                  <p className="text-xs font-extrabold text-orange-700 mt-0.5">{log.action} · {MODULE_NAMES[log.module] || log.module}</p>
                  {log.target || log.summary ? <p className="text-[11px] text-slate-500 mt-0.5">{log.target}{log.target && log.summary ? " — " : ""}{log.summary}</p> : null}
                  {log.path ? <p className="text-[10px] text-slate-400 mt-1 truncate">{log.method} {log.path}</p> : null}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 text-[10px] text-slate-500 font-bold flex-shrink-0">
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-orange-500" />{new Date(log.createdAt || log.loggedInAt || Date.now()).toLocaleString()}</span>
                {log.ip && log.ip !== "unknown" ? <span className="font-mono text-[9px] text-slate-400">IP {log.ip}</span> : null}
                <button
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      const res = await fetch("/api/admin/activity-log", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ids: [log.id] }),
                      });
                      if (res.ok) {
                        setLogs((prev) => prev.filter((l) => l.id !== log.id));
                        setSelected((prev) => { const next = new Set(prev); next.delete(log.id); return next; });
                      }
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  className="text-rose-400 hover:text-rose-600"
                  aria-label="Delete this entry"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>}
  </div>;
}
