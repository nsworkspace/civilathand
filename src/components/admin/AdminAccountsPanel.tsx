"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound, Plus, Trash2, Loader2, ShieldCheck, X, Eye, EyeOff, Copy, Check,
  Crown, Pencil, Save,
} from "lucide-react";

type AdminAccount = {
  id: string;
  username: string;
  role: string;
  permissions: string[];
  label?: string;
  createdAt: string;
  lastLoginAt?: string | null;
  lastActivityAt?: string | null;
  activityCount?: number;
  disabled?: boolean;
};

// Friendly labels for each module — must match the `id`s used in
// AdminView's NAV_GROUPS / the ADMIN_MODULES list on the server.
const MODULE_LABELS: Record<string, string> = {
  analytics: "Analytics Dashboard",
  activityLog: "Activity & Audit Log",
  clients: "Client Workspace",
  registeredUsers: "Registered User Tracker",
  leads: "Lead & CRM Management",
  projects: "Project Control Center",
  drawings: "Drawing Audit Desk",
  invoices: "Billing & Invoicing",
  paymentSetup: "Payment Setup",
  paymentOffers: "Offers & Coupons",
  paymentHistory: "Payment History",
  tickets: "Help Desk",
  publicChat: "Public Live Chat",
  community: "Community Management",
  blogs: "Blog Management",
  portfolio: "Portfolio Management",
  services: "Services Management",
  notifications: "Notification Center",
  mentorship: "Mentorship Panel",
  softwareCourses: "Civil At Hand Courses",
  studyMaterials: "Premium Study Materials",
  careers: "Career Applications",
  teamMembers: "Team Members",
  vendors: "Vendor Management",
  vendorLeads: "Vendor Leads",
  websiteContent: "Website Pages & CMS",
  websiteNavigation: "Website Navigation",
};

function ModuleChecklist({
  allModules,
  selected,
  onToggle,
  fullAccess,
  onToggleFullAccess,
}: {
  allModules: string[];
  selected: string[];
  onToggle: (id: string) => void;
  fullAccess: boolean;
  onToggleFullAccess: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggleFullAccess}
        className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl border mb-3 transition-all ${
          fullAccess ? "bg-navy-950 border-navy-950 text-white" : "bg-white border-slate-200 text-navy-950 hover:border-orange-300"
        }`}
      >
        <Crown className={`h-4 w-4 flex-shrink-0 ${fullAccess ? "text-orange-400" : "text-orange-500"}`} />
        <div className="text-left">
          <p className="text-xs font-extrabold uppercase tracking-wide">Full Access</p>
          <p className={`text-[10px] font-medium ${fullAccess ? "text-slate-300" : "text-slate-400"}`}>
            Every section of the admin panel (can&apos;t manage other logins)
          </p>
        </div>
        <div className={`ml-auto w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${fullAccess ? "bg-orange-500 border-orange-500" : "border-slate-300"}`}>
          {fullAccess && <Check className="h-3.5 w-3.5 text-white" />}
        </div>
      </button>

      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 transition-opacity ${fullAccess ? "opacity-40 pointer-events-none" : ""}`}>
        {allModules.map((id) => {
          const isChecked = fullAccess || selected.includes(id);
          return (
            <button
              type="button"
              key={id}
              onClick={() => onToggle(id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all ${
                isChecked ? "bg-orange-50 border-orange-300 text-navy-950" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${isChecked ? "bg-orange-500 border-orange-500" : "border-slate-300"}`}>
                {isChecked && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className="text-[11px] font-bold truncate">{MODULE_LABELS[id] || id}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminAccountsPanel() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [allModules, setAllModules] = useState<string[]>(Object.keys(MODULE_LABELS));
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [label, setLabel] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [fullAccess, setFullAccess] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editModules, setEditModules] = useState<string[]>([]);
  const [editFullAccess, setEditFullAccess] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/admin-accounts");
      const data = await res.json();
      if (data?.success) {
        setAccounts(data.accounts || []);
        if (Array.isArray(data.availableModules) && data.availableModules.length > 0) {
          setAllModules(data.availableModules);
        }
      }
    } catch (err) {
      console.error("Failed to load admin accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const toggleModule = (id: string) => {
    setSelectedModules((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  };

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setLabel("");
    setSelectedModules([]);
    setFullAccess(false);
    setError("");
  };

  const handleCreate = async () => {
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!fullAccess && selectedModules.length === 0) {
      setError("Pick at least one section this login can access, or choose Full Access.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/admin-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, label, permissions: selectedModules, fullAccess }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to create account.");
        return;
      }
      resetForm();
      setShowForm(false);
      loadAccounts();
    } catch (err) {
      console.error(err);
      setError("Failed to create account.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this login? They will no longer be able to sign in.")) return;
    try {
      const res = await fetch(`/api/admin/admin-accounts?id=${id}`, { method: "DELETE" });
      if (res.ok) setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (acc: AdminAccount) => {
    setEditingId(acc.id);
    setEditModules(acc.permissions || []);
    setEditFullAccess((acc.permissions || []).length >= allModules.length);
  };

  const saveEdit = async (id: string) => {
    if (!editFullAccess && editModules.length === 0) return;
    setSavingEdit(true);
    try {
      const res = await fetch("/api/admin/admin-accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, permissions: editModules, fullAccess: editFullAccess }),
      });
      if (res.ok) {
        setEditingId(null);
        loadAccounts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEdit(false);
    }
  };

  const copyUsername = (acc: AdminAccount) => {
    navigator.clipboard?.writeText(acc.username);
    setCopiedId(acc.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="text-xs text-slate-500 font-medium max-w-lg">
          Create a login for a teammate and choose exactly which sections they can use — Blogs, Portfolio,
          Analytics, or any combination — or give them Full Access. No Vercel or MongoDB access needed, it&apos;s
          all managed right here.
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm((v) => !v);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] uppercase tracking-wide transition-all flex-shrink-0"
        >
          <Plus className="h-4 w-4" /> New Login
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-5"
          >
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-extrabold text-navy-950 uppercase tracking-wide flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-orange-500" /> Create Admin Login
                </h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {error && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Username
                  </label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. priya.blogs"
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Password (min 8 characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Strong password"
                      className="w-full px-3 py-2.5 pr-10 rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Label (optional — e.g. their name, so you remember who this is)
                </label>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Priya - Blog Writer"
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-medium focus:outline-none focus:border-orange-500"
                />
              </div>

              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                Access
              </label>
              <div className="mb-4">
                <ModuleChecklist
                  allModules={allModules}
                  selected={selectedModules}
                  onToggle={toggleModule}
                  fullAccess={fullAccess}
                  onToggleFullAccess={() => setFullAccess((v) => !v)}
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-navy-950 hover:bg-navy-900 text-white font-bold text-[11px] uppercase tracking-wide transition-all disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {saving ? "Creating…" : "Create Login"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm font-medium">
          No admin logins yet. Click &ldquo;New Login&rdquo; to create one.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {accounts.map((acc) => {
            const isFull = (acc.permissions || []).length >= allModules.length;
            const isEditing = editingId === acc.id;
            return (
              <div key={acc.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      {isFull ? <Crown className="h-4 w-4 text-orange-600" /> : <KeyRound className="h-4 w-4 text-orange-600" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-navy-950 truncate">
                        {acc.username}
                        <span className="ml-2 text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          {isFull ? "Full Access" : `${(acc.permissions || []).length} section${(acc.permissions || []).length === 1 ? "" : "s"}`}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium truncate">
                        {acc.label ? `${acc.label} · ` : ""}Created {new Date(acc.createdAt).toLocaleDateString()}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                        <span>Last login: {acc.lastLoginAt ? new Date(acc.lastLoginAt).toLocaleString() : "Never"}</span>
                        <span>Last activity: {acc.lastActivityAt ? new Date(acc.lastActivityAt).toLocaleString() : "None"}</span>
                        <span>{acc.activityCount || 0} audit event{(acc.activityCount || 0) === 1 ? "" : "s"}</span>
                      </div>
                      {!isFull && !isEditing && (
                        <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                          {(acc.permissions || []).map((m) => MODULE_LABELS[m] || m).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => (isEditing ? setEditingId(null) : startEdit(acc))}
                      title="Edit access"
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                    >
                      {isEditing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => copyUsername(acc)}
                      title="Copy username"
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                    >
                      {copiedId === acc.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(acc.id)}
                      title="Remove login"
                      className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                    <ModuleChecklist
                      allModules={allModules}
                      selected={editModules}
                      onToggle={(id) => setEditModules((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]))}
                      fullAccess={editFullAccess}
                      onToggleFullAccess={() => setEditFullAccess((v) => !v)}
                    />
                    <button
                      onClick={() => saveEdit(acc.id)}
                      disabled={savingEdit}
                      className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-950 hover:bg-navy-900 text-white font-bold text-[11px] uppercase tracking-wide transition-all disabled:opacity-60"
                    >
                      {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {savingEdit ? "Saving…" : "Save Access"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
