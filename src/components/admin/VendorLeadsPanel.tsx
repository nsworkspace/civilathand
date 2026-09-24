"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Loader2, MessageSquare, Phone, Mail, MapPin, X, Trash2 } from "lucide-react";

export function VendorLeadsPanel() {
  const [vendorLeads, setVendorLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  const fetchVendorLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vendor-leads", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load leads");
      setVendorLeads(Array.isArray(data) ? data : (data.leads || []));
    } catch (err) { console.error("Error fetching vendor leads:", err); }
    finally { setLoading(false); }
  };

  const updateStatus = async (lead: any, status: string) => {
    const res = await fetch("/api/admin/vendor-leads", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: lead._id, status }) });
    if (res.ok) { await fetchVendorLeads(); if (selected?._id === lead._id) setSelected({ ...selected, status }); }
  };

  const deleteVendorLead = async (id: string) => {
    if (!confirm("Delete this vendor connection request?")) return;
    const res = await fetch(`/api/admin/vendor-leads?id=${id}`, { method: "DELETE" });
    if (res.ok) { setSelected(null); await fetchVendorLeads(); }
  };

  useEffect(() => { fetchVendorLeads(); }, []);

  return (
    <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} transition={{ duration: 0.2 }} className="flex-grow space-y-6">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="font-display text-xl font-extrabold text-navy-950">Vendor Leads</h3><p className="mt-0.5 text-xs text-slate-500">Complete client requirements submitted against a selected vendor. Use these details to qualify and coordinate the introduction.</p></div>
        <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-700">{vendorLeads.length} requests</span>
      </div>

      {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div> : vendorLeads.length === 0 ? <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center"><MessageSquare className="mx-auto mb-3 h-10 w-10 text-slate-300" /><p className="text-sm font-semibold text-slate-400">No vendor connection requests yet.</p></div> : <div className="grid gap-4 xl:grid-cols-2">
        {vendorLeads.map((lead) => <article key={lead._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-start justify-between gap-4"><div><span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-orange-700">Lead #{lead._id.slice(-6)}</span><h4 className="mt-2 font-display text-lg font-extrabold text-slate-950">{lead.name || "Unknown client"}</h4><p className="mt-0.5 text-xs text-slate-500">{lead.company || "Individual / company not specified"}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${lead.status === "converted" ? "bg-emerald-50 text-emerald-700" : lead.status === "contacted" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>{lead.status || "new"}</span></div>
          <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50/50 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-orange-700">Selected Vendor</p><p className="mt-1 font-black text-slate-950">{lead.vendorName || "Unknown vendor"}</p><p className="mt-1 text-xs text-slate-500">{[lead.vendorType, lead.vendorCategory, lead.vendorLocation].filter(Boolean).join(" • ") || "Vendor details unavailable"}</p></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2"><Info label="Project / Work" value={lead.projectType} /><Info label="Project Location" value={lead.requirementLocation} /><Info label="Timeline" value={lead.timeline} /><Info label="Budget" value={lead.budget} /><Info label="Preferred Contact" value={lead.preferredContact} /><Info label="Submitted" value={lead.createdAt ? new Date(lead.createdAt).toLocaleString() : "—"} /></div>
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-500">Requirement</p><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{lead.message || "No requirement message provided."}</p></div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4"><button onClick={() => setSelected(lead)} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white"><Eye size={14} /> Full Details</button><button onClick={() => updateStatus(lead, "contacted")} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-black text-blue-700">Mark Contacted</button><button onClick={() => updateStatus(lead, "converted")} className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-black text-emerald-700">Converted</button><button onClick={() => deleteVendorLead(lead._id)} className="ml-auto inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-black text-red-600"><Trash2 size={13} /> Delete</button></div>
        </article>)}
      </div>}

      {selected && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><div className="sticky top-0 flex items-center justify-between border-b bg-white p-5"><div><p className="text-[10px] font-black uppercase tracking-wider text-orange-600">Vendor Lead Details</p><h4 className="mt-1 text-xl font-black text-slate-950">{selected.name || "Unknown client"}</h4></div><button onClick={() => setSelected(null)} className="rounded-lg p-2 hover:bg-slate-100"><X /></button></div><div className="space-y-5 p-5">
        <section className="rounded-xl border border-orange-100 bg-orange-50 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-orange-700">Selected Vendor</p><p className="mt-1 text-lg font-black text-slate-950">{selected.vendorName || "Unknown"}</p><p className="mt-1 text-sm text-slate-600">{[selected.vendorType, selected.vendorCategory, selected.vendorLocation].filter(Boolean).join(" • ")}</p></section>
        <section><h5 className="mb-3 font-black text-slate-950">Client Contact</h5><div className="grid gap-3 sm:grid-cols-2"><Info label="Name" value={selected.name} /><Info label="Company" value={selected.company} /><Info label="Phone" value={selected.phone} icon={<Phone size={13} />} /><Info label="Email" value={selected.email} icon={<Mail size={13} />} /></div></section>
        <section><h5 className="mb-3 font-black text-slate-950">Requirement</h5><div className="grid gap-3 sm:grid-cols-2"><Info label="Work Type" value={selected.projectType} /><Info label="Location" value={selected.requirementLocation} icon={<MapPin size={13} />} /><Info label="Timeline" value={selected.timeline} /><Info label="Budget" value={selected.budget} /><Info label="Preferred Contact" value={selected.preferredContact} /></div><div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="mb-1 text-[10px] font-black uppercase tracking-wider text-slate-500">Full Requirement Message</p><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{selected.message || "Not provided"}</p></div></section>
        {selected.vendorPrivateContact && <section className="rounded-xl border border-amber-200 bg-amber-50 p-4"><h5 className="font-black text-amber-900">Admin-only Vendor Contact</h5><p className="mt-1 text-xs text-amber-800">This information is private and is shown only to authorized admin users for coordination.</p><div className="mt-3 grid gap-2 text-sm text-slate-700"><span>{selected.vendorPrivateContact.phone || "Phone not available"}</span><span>{selected.vendorPrivateContact.email || "Email not available"}</span><span>{selected.vendorPrivateContact.address || "Address not available"}</span></div></section>}
      </div></div></div>}
    </motion.div>
  );
}

function Info({ label, value, icon }: { label: string; value?: string; icon?: React.ReactNode }) { return <div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 flex items-center gap-1 text-sm font-bold text-slate-700">{icon}{value || "Not provided"}</p></div>; }
