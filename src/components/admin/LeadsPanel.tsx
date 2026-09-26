"use client";

import { notifyAdmin } from "./AdminToast";
import React, { useState } from "react";
import { useProjects, Lead } from "@/context/ProjectContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck, Clock, Loader2, CheckCheck, Trash2
} from "lucide-react";
import { ClientAvatar } from "./AdminShared";

export function LeadsPanel() {
  const { leads, updateLeadStatus, deleteLead, addLead, addProject } = useProjects();
  const [convertingLeadId, setConvertingLeadId] = useState<string | null>(null);
  const [convertTitle, setConvertTitle] = useState("");
  const [convertArea, setConvertArea] = useState("");
  const [convertLocation, setConvertLocation] = useState("");
  const [convertSubmitting, setConvertSubmitting] = useState(false);
  const [paymentLeadId, setPaymentLeadId] = useState<string | null>(null);
  const [paymentTitle, setPaymentTitle] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDescription, setPaymentDescription] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{ leadId: string; url: string } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "contacted" | "converted">("all");

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


  const openPaymentForm = (lead: Lead) => {
    setPaymentLeadId(lead.id);
    setPaymentTitle(`${lead.service || "Service"} — Payment Request`);
    setPaymentAmount("");
    setPaymentDescription(`Payment request for ${lead.service || "NS Construction service"}.`);
    setPaymentResult(null);
  };

  const closePaymentForm = () => {
    setPaymentLeadId(null);
    setPaymentTitle("");
    setPaymentAmount("");
    setPaymentDescription("");
    setPaymentSaving(false);
  };

  const createServicePayment = async (lead: Lead) => {
    const amount = Number(paymentAmount);
    if (!paymentTitle.trim() || !Number.isFinite(amount) || amount <= 0) return;
    setPaymentSaving(true);
    try {
      const res = await fetch("/api/admin/service-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          clientEmail: lead.email,
          title: paymentTitle.trim(),
          amount,
          description: paymentDescription.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to create payment request.");
      const url = `${window.location.origin}${data.portalUrl}`;
      setPaymentResult({ leadId: lead.id, url });
      try { await navigator.clipboard.writeText(url); } catch {}
    } catch (error: any) {
      notifyAdmin(error?.message || "Failed to create payment request.");
    } finally {
      setPaymentSaving(false);
    }
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

  const normalizedSearch = search.trim().toLowerCase();
  const filteredLeads = leads.filter((lead) => {
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const haystack = `${lead.name} ${lead.email} ${lead.phone || ""} ${lead.service} ${lead.source} ${lead.details}`.toLowerCase();
    return matchesStatus && (!normalizedSearch || haystack.includes(normalizedSearch));
  });
  const stageCounts = {
    new: leads.filter((lead) => lead.status === "new").length,
    contacted: leads.filter((lead) => lead.status === "contacted").length,
    converted: leads.filter((lead) => lead.status === "converted").length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 flex-grow"
    >
      <div>
        <h3 className="font-display font-extrabold text-xl text-navy-950">Lead & Sales CRM</h3>
        <p className="text-xs text-navy-600 mt-1">Review contact requests and calculator quotes. Qualify them into active design projects.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["Total", leads.length, "all"],
          ["New", stageCounts.new, "new"],
          ["Contacted", stageCounts.contacted, "contacted"],
          ["Converted", stageCounts.converted, "converted"],
        ].map(([label, count, filter]) => (
          <button key={label} type="button" onClick={() => setStatusFilter(filter as typeof statusFilter)} className={`rounded-xl border p-3 text-left transition ${statusFilter === filter ? "border-orange-300 bg-orange-50" : "border-slate-200 bg-white hover:border-orange-200"}`}>
            <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">{label}</div>
            <div className="mt-1 text-xl font-black text-slate-900">{count}</div>
          </button>
        ))}
      </div>
      <div className="flex flex-col md:flex-row gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone, service..." className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold outline-none focus:border-orange-400">
          <option value="all">All stages</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
        </select>
      </div>
      <div className="space-y-4">
        {filteredLeads.map((lead, idx) => (
          <motion.div
            key={lead.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.05 }}
            className="border border-slate-200 rounded-xl p-5 hover:bg-slate-50 transition-colors text-xs space-y-4 bg-white"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-start gap-3">
                <ClientAvatar name={lead.name} />
                <div>
                  <span className="text-[10px] bg-navy-100 text-navy-700 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                    {lead.source}
                  </span>
                  <h4 className="font-display font-extrabold text-base text-navy-950 mt-1.5">{lead.name}</h4>
                  <p className="text-[10px] text-navy-600 mt-0.5">{lead.email} • {lead.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] capitalize ${
                    lead.status === "new" ? "bg-orange-100 text-orange-700" :
                    lead.status === "contacted" ? "bg-blue-100 text-blue-700 border border-blue-200/50" :
                    lead.status === "converted" ? "bg-emerald-100 text-emerald-700" :
                    "bg-slate-100 text-slate-700"
                  }`}>
                  {lead.status}
                </span>
                <span className="text-[10px] text-navy-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lead.date}
                </span>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="font-semibold text-navy-950">Requested Pipeline: {lead.service}</p>
                {(lead as any).paymentStatus && (
                  <span className={`px-2 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${(lead as any).paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    Payment {(lead as any).paymentStatus}
                  </span>
                )}
              </div>
              <p className="text-navy-600 mt-1 italic leading-relaxed">&ldquo;{lead.details}&rdquo;</p>
            </div>
            {(lead as any).profileDetails && (
              <div className="p-3 bg-slate-50/75 rounded-lg border border-slate-200/60 text-[11px] font-medium text-slate-700 space-y-1.5">
                <span className="block font-bold text-navy-950 text-[9px] uppercase tracking-wider">
                  Registered Client Profile
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                  {(lead as any).profileDetails.company && (
                    <div>
                      <span className="text-slate-400 font-semibold">Company: </span>
                      <span className="text-slate-700 font-bold">{(lead as any).profileDetails.company}</span>
                    </div>
                  )}
                  {(lead as any).profileDetails.address && (
                    <div className="md:col-span-2">
                      <span className="text-slate-400 font-semibold">Location / Address: </span>
                      <span className="text-slate-700 font-bold">{(lead as any).profileDetails.address}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to delete this lead request?")) {
                    deleteLead(lead.id);
                  }
                }}
                className="mr-auto text-red-500 hover:text-red-700 font-bold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer transition-colors"
              >
                Delete Request
              </button>
              {lead.status === "new" && (
                <button
                  onClick={async () => {
                    await updateLeadStatus(lead.id, "contacted");
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-navy-950 font-bold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer"
                >
                  Mark Contacted
                </button>
              )}
              <button
                type="button"
                onClick={() => paymentLeadId === lead.id ? closePaymentForm() : openPaymentForm(lead)}
                className="bg-orange-50 hover:bg-orange-500 hover:text-white text-orange-700 border border-orange-200 font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-colors"
              >
                {paymentLeadId === lead.id ? "Cancel Payment" : "Request Payment"}
              </button>
              {(lead.status === "new" || lead.status === "contacted") && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => convertingLeadId === lead.id ? closeConvertForm() : openConvertForm(lead)}
                  className="bg-navy-950 hover:bg-orange-600 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  {convertingLeadId === lead.id ? "Cancel" : "Convert to Project"}
                </motion.button>
              )}
            </div>
            <AnimatePresence>
              {convertingLeadId === lead.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-slate-100 pt-3 space-y-2"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Confirm real project details — this becomes the official record, so no placeholders</p>
                  <input
                    type="text"
                    value={convertTitle}
                    onChange={(e) => setConvertTitle(e.target.value)}
                    placeholder="Project title"
                    className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={convertArea}
                      onChange={(e) => setConvertArea(e.target.value)}
                      placeholder="Area (sq.ft) *"
                      className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                    />
                    <input
                      type="text"
                      value={convertLocation}
                      onChange={(e) => setConvertLocation(e.target.value)}
                      placeholder="Site location *"
                      className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleConvertLead(lead)}
                    disabled={convertSubmitting || !convertArea.trim() || !convertLocation.trim()}
                    className="w-full flex items-center justify-center gap-1.5 rounded-md bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-[11px] font-bold uppercase tracking-wide py-2 transition-all"
                  >
                    {convertSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
                    Confirm & Create Project
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {paymentLeadId === lead.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-orange-100 pt-3 space-y-2"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide text-orange-700">Create secure client-portal payment</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input type="text" value={paymentTitle} onChange={(e) => setPaymentTitle(e.target.value)} placeholder="Payment title" className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs focus:border-orange-400 focus:outline-none" />
                    <input type="number" min="1" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Amount in ₹" className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs focus:border-orange-400 focus:outline-none" />
                  </div>
                  <textarea value={paymentDescription} onChange={(e) => setPaymentDescription(e.target.value)} rows={2} placeholder="Payment description" className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs focus:border-orange-400 focus:outline-none" />
                  <button type="button" onClick={() => createServicePayment(lead)} disabled={paymentSaving || !paymentTitle.trim() || !paymentAmount || Number(paymentAmount) <= 0} className="w-full flex items-center justify-center gap-1.5 rounded-md bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-[11px] font-bold uppercase tracking-wide py-2">
                    {paymentSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    {paymentSaving ? "Creating..." : "Create & Put in Client Portal"}
                  </button>
                  {paymentResult?.leadId === lead.id && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[10px] text-emerald-800 font-semibold">
                      Payment request created. The portal URL was copied to your clipboard: <span className="break-all">{paymentResult.url}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
        {filteredLeads.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="font-bold text-slate-700">No leads match your filters.</p>
            <p className="mt-1 text-xs text-slate-400">Try another search or switch the pipeline stage.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
