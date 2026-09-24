"use client";

import { notifyAdmin } from "./AdminToast";
import React, { useState, useMemo } from "react";
import { useProjects, Lead, Project, Invoice, SupportTicket, DrawingFile } from "@/context/ProjectContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Download, Plus, Search, User, Trash2, Receipt, Link as LinkIcon, Bell,
  FolderKanban, FileText, LifeBuoy, UserCheck, Loader2, CheckCheck, X,
  Clock, MapPin, Briefcase, ChevronRight, Eye, Share2, Download as DownloadIcon
} from "lucide-react";
import { downloadInvoice, shareInvoice } from "@/lib/invoice";
import { ClientAvatar } from "./AdminShared";

export function ClientsPanel() {
  const {
    leads,
    projects,
    drawings,
    invoices,
    tickets,
    addLead,
    addProject,
    updateProjectStatus,
    updateLeadStatus,
    deleteLead,
    payInvoice,
    updateInvoicePaymentLink,
    generateInvoice,
    // ★ add these missing functions
    updateDrawingStatus,
    deleteDrawing,
    updateTicketStatus,
    deleteTicket,
  } = useProjects();

  // ── Client Buckets (same as original) ──────────────────────────────
  const isInvoiceOverdue = (inv: Invoice) =>
    inv.status === "Unpaid" && !!inv.dueDate && new Date(inv.dueDate).getTime() < Date.now();

  const clientKeyFor = (email?: string, name?: string) => {
    const e = (email || "").trim().toLowerCase();
    if (e) return `email:${e}`;
    const n = (name || "").trim().toLowerCase();
    return n ? `name:${n}` : "unknown";
  };

  type ClientBucket = {
    key: string;
    name: string;
    email: string;
    leads: Lead[];
    projects: Project[];
    drawings: DrawingFile[];
    invoices: Invoice[];
    tickets: SupportTicket[];
    revenue: number;
    pending: number;
    overdueAmount: number;
    overdueCount: number;
    firstSeen: string;
  };

  const clientBuckets = useMemo((): ClientBucket[] => {
    const map = new Map<string, ClientBucket>();
    const ensure = (key: string, name?: string, email?: string): ClientBucket => {
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: name || "Unknown Client",
          email: (email || "").toLowerCase(),
          leads: [],
          projects: [],
          drawings: [],
          invoices: [],
          tickets: [],
          revenue: 0,
          pending: 0,
          overdueAmount: 0,
          overdueCount: 0,
          firstSeen: "",
        });
      }
      const bucket = map.get(key)!;
      if ((!bucket.name || bucket.name === "Unknown Client") && name) bucket.name = name;
      if (!bucket.email && email) bucket.email = email.toLowerCase();
      return bucket;
    };

    leads.forEach((l) => ensure(clientKeyFor(l.email, l.name), l.name, l.email).leads.push(l));
    projects.forEach((p) => ensure(clientKeyFor(p.clientEmail, p.clientName), p.clientName, p.clientEmail).projects.push(p));
    drawings.forEach((d) => ensure(clientKeyFor(d.clientEmail, d.clientName), d.clientName, d.clientEmail).drawings.push(d));
    tickets.forEach((t) => ensure(clientKeyFor(t.clientEmail, t.clientName), t.clientName, t.clientEmail).tickets.push(t));
    invoices.forEach((inv) => {
      const proj = projects.find((p) => p.id === inv.projectId);
      ensure(clientKeyFor(proj?.clientEmail, proj?.clientName), proj?.clientName, proj?.clientEmail).invoices.push(inv);
    });

    map.forEach((bucket) => {
      bucket.revenue = bucket.invoices.filter((inv: Invoice) => inv.status === "Paid").reduce((sum: number, inv: Invoice) => sum + (inv.amount || 0), 0);
      bucket.pending = bucket.invoices.filter((inv: Invoice) => inv.status === "Unpaid").reduce((sum: number, inv: Invoice) => sum + (inv.amount || 0), 0);
      const overdueInvs = bucket.invoices.filter(isInvoiceOverdue);
      bucket.overdueAmount = overdueInvs.reduce((sum: number, inv: Invoice) => sum + (inv.amount || 0), 0);
      bucket.overdueCount = overdueInvs.length;
      const dates = bucket.leads.map((l) => l.date).filter(Boolean).sort();
      bucket.firstSeen = dates[0] || "";
    });

    return Array.from(map.values());
  }, [leads, projects, drawings, tickets, invoices]);

  const workspaceStats = useMemo(() => {
    const totalRevenue = invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + (i.amount || 0), 0);
    const pendingAmount = invoices.filter((i) => i.status === "Unpaid").reduce((s, i) => s + (i.amount || 0), 0);
    const overdueInvoices = invoices.filter(isInvoiceOverdue);
    const overdueAmount = overdueInvoices.reduce((s, i) => s + (i.amount || 0), 0);
    const activeProjects = projects.filter((p) => p.status !== "Completed").length;
    return {
      totalClients: clientBuckets.length,
      totalRevenue,
      pendingAmount,
      overdueCount: overdueInvoices.length,
      overdueAmount,
      activeProjects,
    };
  }, [invoices, projects, clientBuckets]);

  const handleExportClients = () => {
    const header = ["Client Name", "Email", "Leads", "Projects", "Drawings", "Tickets", "Revenue (Paid)", "Pending Amount", "Overdue Amount", "First Seen"];
    const rows = clientBuckets.map((c) => [
      c.name,
      c.email,
      c.leads.length,
      c.projects.length,
      c.drawings.length,
      c.tickets.length,
      c.revenue,
      c.pending,
      c.overdueAmount,
      c.firstSeen,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `civil-at-hand-clients-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleNotifyClient = (c: ClientBucket) => {
    notifyAdmin(`Notify ${c.name} (${c.email})`);
  };

  const [clientSearch, setClientSearch] = useState("");
  const [clientSort, setClientSort] = useState<"activity" | "name" | "unpaid" | "revenue" | "overdue">("activity");
  const [selectedClientKey, setSelectedClientKey] = useState<string | null>(null);
  const [showAddClientForm, setShowAddClientForm] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientService, setNewClientService] = useState("");
  const [newClientNotes, setNewClientNotes] = useState("");
  const [addingClient, setAddingClient] = useState(false);

  const [invoiceDraftProjectId, setInvoiceDraftProjectId] = useState<string | null>(null);
  const [invoiceDraftAmount, setInvoiceDraftAmount] = useState("");
  const [invoiceDraftLink, setInvoiceDraftLink] = useState("");
  const [generatingClientInvoice, setGeneratingClientInvoice] = useState(false);

  const [convertingLeadId, setConvertingLeadId] = useState<string | null>(null);
  const [convertTitle, setConvertTitle] = useState("");
  const [convertArea, setConvertArea] = useState("");
  const [convertLocation, setConvertLocation] = useState("");
  const [convertSubmitting, setConvertSubmitting] = useState(false);

  const openConvertForm = (lead: Lead) => {
    setConvertingLeadId(lead.id);
    setConvertTitle(`${lead.service} - ${lead.name}`);
    setConvertArea("");
    setConvertLocation("");
  };

  const closeConvertForm = () => {
    setConvertingLeadId(null);
    setConvertTitle("");
    setConvertArea("");
    setConvertLocation("");
  };

  const handleConvertLead = async (lead: Lead) => {
    if (!convertArea.trim() || !convertLocation.trim()) return;
    setConvertSubmitting(true);
    try {
      await addProject({
        title: convertTitle.trim() || `${lead.service} - ${lead.name}`,
        clientName: lead.name,
        clientEmail: lead.email,
        service: lead.service,
        areaSqFt: Number(convertArea) || 0,
        location: convertLocation.trim(),
        drawings: [],
      });
      await updateLeadStatus(lead.id, "converted");
      closeConvertForm();
    } finally {
      setConvertSubmitting(false);
    }
  };

  const handleAddNewClient = async () => {
    if (!newClientName.trim() || !newClientEmail.trim()) return;
    setAddingClient(true);
    try {
      await addLead({
        name: newClientName.trim(),
        email: newClientEmail.trim(),
        phone: newClientPhone.trim(),
        service: newClientService.trim() || "General Inquiry",
        source: "Admin Added",
        details: newClientNotes.trim(),
      });
      setNewClientName("");
      setNewClientEmail("");
      setNewClientPhone("");
      setNewClientService("");
      setNewClientNotes("");
      setShowAddClientForm(false);
    } finally {
      setAddingClient(false);
    }
  };

  const handleGenerateClientInvoice = async () => {
    if (!invoiceDraftProjectId || !invoiceDraftAmount.trim() || generatingClientInvoice) return;
    setGeneratingClientInvoice(true);
    try {
      const manualLink = invoiceDraftLink.trim() || undefined;
      const createdInv = await generateInvoice(invoiceDraftProjectId, Number(invoiceDraftAmount), manualLink);
      if (createdInv && !manualLink) {
        try {
          const res = await fetch("/api/admin/payments/generate-link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ invoiceId: createdInv.id }),
          });
          const data = await res.json();
          if (res.ok && data.paymentLink) {
            await updateInvoicePaymentLink(createdInv.id, data.paymentLink);
          }
        } catch (err) {
          console.error("Error auto-generating Razorpay link:", err);
        }
      }
      setInvoiceDraftProjectId(null);
      setInvoiceDraftAmount("");
      setInvoiceDraftLink("");
    } finally {
      setGeneratingClientInvoice(false);
    }
  };

  const filteredClientBuckets = useMemo(() => {
    let list = clientSearch.trim()
      ? clientBuckets.filter((c) => {
          const q = clientSearch.trim().toLowerCase();
          return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
        })
      : clientBuckets;

    list = [...list].sort((a, b) => {
      if (clientSort === "name") return a.name.localeCompare(b.name);
      if (clientSort === "unpaid") return b.pending - a.pending;
      if (clientSort === "revenue") return b.revenue - a.revenue;
      if (clientSort === "overdue") return b.overdueAmount - a.overdueAmount;
      const score = (c: ClientBucket) => c.leads.length + c.projects.length * 2 + c.drawings.length + c.tickets.length;
      return score(b) - score(a);
    });
    return list;
  }, [clientBuckets, clientSearch, clientSort]);

  const selectedClient = clientBuckets.find((c) => c.key === selectedClientKey) || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Total Clients</p>
          <p className="text-xl font-extrabold text-navy-950 mt-1">{workspaceStats.totalClients}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Active Projects</p>
          <p className="text-xl font-extrabold text-navy-950 mt-1">{workspaceStats.activeProjects}</p>
        </div>
        <div className="bg-white rounded-xl border border-emerald-100 shadow-sm p-4">
          <p className="text-[9px] font-bold uppercase tracking-wide text-emerald-600">Revenue Collected</p>
          <p className="text-xl font-extrabold text-emerald-700 mt-1">₹{workspaceStats.totalRevenue.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-4">
          <p className="text-[9px] font-bold uppercase tracking-wide text-amber-600">Pending Amount</p>
          <p className="text-xl font-extrabold text-amber-700 mt-1">₹{workspaceStats.pendingAmount.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white rounded-xl border border-rose-100 shadow-sm p-4 col-span-2 sm:col-span-1">
          <p className="text-[9px] font-bold uppercase tracking-wide text-rose-600">Overdue</p>
          <p className="text-xl font-extrabold text-rose-700 mt-1">₹{workspaceStats.overdueAmount.toLocaleString("en-IN")}</p>
          {workspaceStats.overdueCount > 0 && (
            <p className="text-[9px] font-semibold text-rose-500 mt-0.5">{workspaceStats.overdueCount} invoice{workspaceStats.overdueCount > 1 ? "s" : ""} past due</p>
          )}
        </div>
      </div>

      {/* Client list and detail side‑by‑side */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
        {/* Client List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-4 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-navy-950">Clients</h3>
                <p className="text-[10px] text-slate-400">{clientBuckets.length} total · everything grouped per person</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleExportClients}
                  title="Export all clients as CSV"
                  className="flex items-center gap-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-navy-950 text-[10px] font-bold uppercase tracking-wide px-2.5 py-2 transition-all"
                >
                  <DownloadIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddClientForm((v) => !v)}
                  className="flex items-center gap-1 rounded-lg bg-navy-950 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wide px-3 py-2 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Search client name or email..."
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
              </div>
              <select
                value={clientSort}
                onChange={(e) => setClientSort(e.target.value as any)}
                className="rounded-lg border border-slate-200 text-[10px] font-bold text-navy-950 px-2 py-2 focus:outline-none cursor-pointer"
              >
                <option value="activity">Most Active</option>
                <option value="name">Name A-Z</option>
                <option value="unpaid">Unpaid First</option>
                <option value="overdue">Overdue First</option>
                <option value="revenue">Top Revenue</option>
              </select>
            </div>
            <AnimatePresence>
              {showAddClientForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 bg-slate-50 border border-slate-100 rounded-lg p-3"
                >
                  <input type="text" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="Client name *" className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                  <input type="email" value={newClientEmail} onChange={(e) => setNewClientEmail(e.target.value)} placeholder="Client email *" className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                  <input type="text" value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} placeholder="Phone" className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                  <input type="text" value={newClientService} onChange={(e) => setNewClientService(e.target.value)} placeholder="Service interested in" className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400" />
                  <textarea value={newClientNotes} onChange={(e) => setNewClientNotes(e.target.value)} placeholder="Notes (optional)" rows={2} className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400 resize-none" />
                  <button
                    type="button"
                    onClick={handleAddNewClient}
                    disabled={addingClient || !newClientName.trim() || !newClientEmail.trim()}
                    className="w-full flex items-center justify-center gap-1.5 rounded-md bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-[11px] font-bold uppercase tracking-wide py-2 transition-all"
                  >
                    {addingClient ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    Save Client
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="divide-y divide-slate-50 max-h-[640px] overflow-y-auto">
            {filteredClientBuckets.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <Users className="h-8 w-8 text-slate-300" />
                <p className="text-xs font-bold text-navy-950">No clients found</p>
              </div>
            ) : (
              filteredClientBuckets.map((c) => {
                const isActive = c.key === selectedClientKey;
                const unpaidCount = c.invoices.filter((i) => i.status === "Unpaid").length;
                return (
                  <button
                    type="button"
                    key={c.key}
                    onClick={() => setSelectedClientKey(c.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isActive ? "bg-orange-50" : "hover:bg-slate-50"}`}
                  >
                    <ClientAvatar name={c.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-navy-950 truncate">{c.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{c.email || "No email on file"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                      <span className="text-[9px] font-bold text-slate-500">{c.projects.length} proj · {c.drawings.length} files</span>
                      {c.overdueCount > 0 ? (
                        <span className="text-[8px] font-bold uppercase tracking-wide text-white bg-rose-500 px-1.5 py-0.5 rounded-full animate-pulse">
                          ₹{c.overdueAmount.toLocaleString("en-IN")} overdue
                        </span>
                      ) : unpaidCount > 0 ? (
                        <span className="text-[8px] font-bold uppercase tracking-wide text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">
                          ₹{c.pending.toLocaleString("en-IN")} unpaid
                        </span>
                      ) : c.revenue > 0 ? (
                        <span className="text-[8px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                          ₹{c.revenue.toLocaleString("en-IN")} paid
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Client Detail */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {!selectedClient ? (
            <div className="flex flex-col items-center justify-center gap-2 py-24 text-center px-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <User className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-navy-950">Select a client</p>
              <p className="text-[11px] text-slate-400 max-w-xs">Pick anyone from the list to see their leads, projects, drawings, invoices and tickets in one place — nothing mixed with other clients.</p>
            </div>
          ) : (
            <div className="max-h-[720px] overflow-y-auto">
              <div className="px-5 py-4 bg-gradient-to-r from-navy-950 to-slate-800 flex items-center gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 text-white font-bold">
                  {selectedClient.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-extrabold text-white truncate">{selectedClient.name}</h3>
                  <p className="text-[11px] text-slate-300 truncate">{selectedClient.email || "No email on file"}</p>
                </div>
                {selectedClient.email && (
                  <button
                    type="button"
                    onClick={() => handleNotifyClient(selectedClient)}
                    className="flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-wide px-2.5 py-1.5 transition-all flex-shrink-0"
                  >
                    <Bell className="h-3 w-3" />
                    Notify
                  </button>
                )}
              </div>
              {(selectedClient.revenue > 0 || selectedClient.pending > 0) && (
                <div className="flex items-center divide-x divide-slate-100 border-b border-slate-100 bg-slate-50">
                  <div className="flex-1 px-4 py-2.5">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-emerald-600">Revenue Collected</p>
                    <p className="text-sm font-extrabold text-emerald-700">₹{selectedClient.revenue.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex-1 px-4 py-2.5">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-amber-600">Pending</p>
                    <p className="text-sm font-extrabold text-amber-700">₹{selectedClient.pending.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
                {[
                  { label: "Leads", value: selectedClient.leads.length },
                  { label: "Projects", value: selectedClient.projects.length },
                  { label: "Drawings", value: selectedClient.drawings.length },
                  { label: "Tickets", value: selectedClient.tickets.length },
                ].map((s) => (
                  <div key={s.label} className="py-3 text-center">
                    <p className="text-lg font-extrabold text-navy-950">{s.value}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="p-5 space-y-6">
                {selectedClient.leads.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-orange-500" /> Leads</h4>
                    <div className="space-y-2">
                      {selectedClient.leads.map((lead) => (
                        <div key={lead.id} className="rounded-lg border border-slate-100 px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-navy-950 truncate">{lead.service}</p>
                              <p className="text-[10px] text-slate-400 truncate">{lead.details || lead.source}</p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <select
                                value={lead.status}
                                onChange={(e) => updateLeadStatus(lead.id, e.target.value as any)}
                                className="bg-white border border-slate-200 rounded px-1.5 py-1 text-[10px] font-bold text-navy-950 focus:outline-none cursor-pointer"
                              >
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="converted">Converted</option>
                                <option value="archived">Archived</option>
                              </select>
                              {lead.status !== "converted" && lead.status !== "archived" && (
                                <button
                                  onClick={() => convertingLeadId === lead.id ? closeConvertForm() : openConvertForm(lead)}
                                  className="flex items-center gap-1 rounded px-1.5 py-1 text-[10px] font-bold uppercase tracking-wide bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                                >
                                  <UserCheck className="h-3 w-3" /> Convert
                                </button>
                              )}
                              <button onClick={() => { if (confirm("Delete this lead?")) deleteLead(lead.id); }} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <AnimatePresence>
                            {convertingLeadId === lead.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 pt-2 border-t border-slate-100 space-y-1.5"
                              >
                                <input
                                  type="text"
                                  value={convertTitle}
                                  onChange={(e) => setConvertTitle(e.target.value)}
                                  placeholder="Project title"
                                  className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-[11px] focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                                />
                                <div className="grid grid-cols-2 gap-1.5">
                                  <input
                                    type="number"
                                    value={convertArea}
                                    onChange={(e) => setConvertArea(e.target.value)}
                                    placeholder="Area (sq.ft) *"
                                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-[11px] focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                                  />
                                  <input
                                    type="text"
                                    value={convertLocation}
                                    onChange={(e) => setConvertLocation(e.target.value)}
                                    placeholder="Site location *"
                                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-[11px] focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleConvertLead(lead)}
                                  disabled={convertSubmitting || !convertArea.trim() || !convertLocation.trim()}
                                  className="w-full flex items-center justify-center gap-1.5 rounded-md bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-[10px] font-bold uppercase tracking-wide py-1.5 transition-all"
                                >
                                  {convertSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                                  Confirm & Create Project
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedClient.projects.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5"><FolderKanban className="h-3.5 w-3.5 text-orange-500" /> Projects</h4>
                    <div className="space-y-2">
                      {selectedClient.projects.map((proj) => (
                        <div key={proj.id} className="rounded-lg border border-slate-100 px-3 py-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-navy-950 truncate">{proj.title}</p>
                            <select
                              value={proj.status}
                              onChange={(e) => updateProjectStatus(proj.id, e.target.value as any)}
                              className="bg-white border border-slate-200 rounded px-1.5 py-1 text-[10px] font-bold text-navy-950 focus:outline-none cursor-pointer flex-shrink-0"
                            >
                              <option value="Uploaded">Uploaded</option>
                              <option value="Under Review">Under Review</option>
                              <option value="Designing">Designing</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{proj.service} · {proj.areaSqFt} sq.ft · {proj.drawings.length} file(s)</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => { setInvoiceDraftProjectId(proj.id); setInvoiceDraftAmount(""); setInvoiceDraftLink(""); }}
                              className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-orange-600 hover:text-orange-700"
                            >
                              <Receipt className="h-3 w-3" /> Generate Invoice
                            </button>
                          </div>
                          <AnimatePresence>
                            {invoiceDraftProjectId === proj.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 flex flex-col sm:flex-row gap-1.5"
                              >
                                <input
                                  type="number"
                                  value={invoiceDraftAmount}
                                  onChange={(e) => setInvoiceDraftAmount(e.target.value)}
                                  placeholder="Amount (₹)"
                                  className="flex-1 rounded-md border border-slate-200 px-2 py-1.5 text-[11px] focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                                />
                                <input
                                  type="text"
                                  value={invoiceDraftLink}
                                  onChange={(e) => setInvoiceDraftLink(e.target.value)}
                                  placeholder="Payment link (optional)"
                                  className="flex-1 rounded-md border border-slate-200 px-2 py-1.5 text-[11px] focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                                />
                                <button
                                  type="button"
                                  onClick={handleGenerateClientInvoice}
                                  disabled={!invoiceDraftAmount.trim() || generatingClientInvoice}
                                  className="rounded-md bg-navy-950 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-[10px] font-bold uppercase tracking-wide px-3 py-1.5 transition-all flex items-center justify-center gap-1"
                                >
                                  {generatingClientInvoice ? <Loader2 className="h-3 w-3 animate-spin" /> : "Create"}
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedClient.drawings.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-orange-500" /> Drawings & Files</h4>
                    <div className="space-y-2">
                      {selectedClient.drawings.map((d) => (
                        <div key={d.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2">
                          <div className="min-w-0 flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                            <div className="min-w-0">
                              {d.url ? (
                                <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-navy-950 hover:text-orange-600 underline truncate block">{d.name}</a>
                              ) : (
                                <p className="text-xs font-bold text-navy-950 truncate">{d.name}</p>
                              )}
                              <p className="text-[10px] text-slate-400 truncate">{d.serviceType} · {d.size}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <select
                              value={d.status}
                              onChange={(e) => updateDrawingStatus(d.id, e.target.value as any)}
                              className="bg-white border border-slate-200 rounded px-1.5 py-1 text-[10px] font-bold text-navy-950 focus:outline-none cursor-pointer"
                            >
                              <option value="Analyzing">Analyzing</option>
                              <option value="Ready">Ready</option>
                              <option value="Processed">Processed</option>
                            </select>
                            <button onClick={() => { if (confirm(`Delete "${d.name}"?`)) deleteDrawing(d.id); }} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedClient.invoices.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5"><Receipt className="h-3.5 w-3.5 text-orange-500" /> Invoices</h4>
                    <div className="space-y-2">
                      {selectedClient.invoices.map((inv) => {
                        const overdue = isInvoiceOverdue(inv);
                        return (
                          <div key={inv.id} className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${overdue ? "border-rose-200 bg-rose-50" : "border-slate-100"}`}>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-navy-950 truncate">{inv.projectTitle}</p>
                              <p className="text-[10px] text-slate-400">₹{inv.amount.toLocaleString("en-IN")} · Due {inv.dueDate}</p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {inv.status === "Unpaid" && inv.paymentLink && (
                                <button
                                  onClick={() => { navigator.clipboard.writeText(inv.paymentLink!); }}
                                  title="Copy payment link"
                                  className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-navy-950 transition-colors"
                                >
                                  <LinkIcon className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => downloadInvoice(inv, { clientName: selectedClient.name, clientEmail: selectedClient.email })}
                                title="Download invoice"
                                aria-label="Download invoice"
                                className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-navy-950 transition-colors"
                              >
                                <DownloadIcon className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => shareInvoice(inv, { clientName: selectedClient.name, clientEmail: selectedClient.email })}
                                title="Share invoice"
                                aria-label="Share invoice"
                                className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-navy-950 transition-colors"
                              >
                                <Share2 className="h-3.5 w-3.5" />
                              </button>
                              <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${overdue ? "bg-rose-500 text-white" : inv.status === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                {overdue ? "Overdue" : inv.status}
                              </span>
                              {inv.status === "Unpaid" && (
                                <button onClick={() => payInvoice(inv.id)} className="text-[9px] font-bold uppercase tracking-wide text-orange-600 hover:text-orange-700">
                                  Mark Paid
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {selectedClient.tickets.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5"><LifeBuoy className="h-3.5 w-3.5 text-orange-500" /> Help Desk Tickets</h4>
                    <div className="space-y-2">
                      {selectedClient.tickets.map((t) => (
                        <div key={t.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-navy-950 truncate">{t.subject}</p>
                            <p className="text-[10px] text-slate-400 truncate">{t.category} · {t.priority}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <select
                              value={t.status}
                              onChange={(e) => updateTicketStatus(t.id, e.target.value as any)}
                              className="bg-white border border-slate-200 rounded px-1.5 py-1 text-[10px] font-bold text-navy-950 focus:outline-none cursor-pointer"
                            >
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                              <option value="Closed">Closed</option>
                            </select>
                            <button onClick={() => { if (confirm("Delete this ticket?")) deleteTicket(t.id); }} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedClient.leads.length === 0 && selectedClient.projects.length === 0 && selectedClient.drawings.length === 0 && selectedClient.invoices.length === 0 && selectedClient.tickets.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">No activity recorded for this client yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
