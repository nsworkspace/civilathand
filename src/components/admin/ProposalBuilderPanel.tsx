"use client";

import { notifyAdmin } from "./AdminToast";
import React, { useEffect, useRef, useState } from "react";
import { Search, Plus, Trash2, Download, Send, Loader2, CheckCircle2, User, X } from "lucide-react";
import { servicesData } from "@/data/services";
import { downloadProposal, proposalTotal, ProposalItem } from "@/lib/proposal";

type ClientHit = { name: string; email: string; phone?: string };

export default function ProposalBuilderPanel() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ClientHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [showHits, setShowHits] = useState(false);

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  const [items, setItems] = useState<ProposalItem[]>([{ service: "", description: "", rate: 0, qty: 1 }]);
  const [notes, setNotes] = useState("");
  const [validTill, setValidTill] = useState("");

  const [saving, setSaving] = useState(false);
  const [sentFlash, setSentFlash] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search registered clients from the same source as the Registered User
  // Tracker (/api/admin/users?search=), so it's always in sync with real data.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setHits([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/admin/users?search=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        const users = Array.isArray(data) ? data : data.users || [];
        setHits(
          users.slice(0, 6).map((u: any) => ({ name: u.name || u.username || "Unnamed", email: u.email, phone: u.phone }))
        );
      } catch (err) {
        console.error("Client search failed:", err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const selectClient = (c: ClientHit) => {
    setClientName(c.name);
    setClientEmail(c.email);
    setClientPhone(c.phone || "");
    setQuery(`${c.name} (${c.email})`);
    setShowHits(false);
  };

  const addItem = () => setItems(prev => [...prev, { service: "", description: "", rate: 0, qty: 1 }]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, patch: Partial<ProposalItem>) =>
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const total = proposalTotal(items);
  const validForm = clientName.trim() && clientEmail.trim() && items.some(it => it.service.trim());

  const buildPayload = (sendToPortal: boolean) => ({
    clientName,
    clientEmail,
    clientPhone,
    items: items.filter(it => it.service.trim()),
    notes,
    validTill,
    sendToPortal,
  });

  const handleDownload = () => {
    if (!validForm) return;
    downloadProposal({
      id: `draft-${Date.now()}`,
      clientName,
      clientEmail,
      clientPhone,
      items: items.filter(it => it.service.trim()),
      notes,
      validTill,
      createdAt: new Date().toISOString(),
    });
  };

  const handleSend = async () => {
    if (!validForm) return;
    setSaving(true);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(true)),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to send.");
      setSentFlash(true);
      setTimeout(() => setSentFlash(false), 3000);
    } catch (err) {
      console.error(err);
      notifyAdmin("Could not send the proposal. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <p className="text-xs text-slate-500 font-medium mb-5 max-w-lg">
        Search a registered client, pick services with your own rate for them, then download a PDF or send it
        straight to their dashboard.
      </p>

      {/* Client search */}
      <div className="relative mb-5">
        <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1.5 block">Client</label>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setShowHits(true);
              setClientEmail("");
            }}
            onFocus={() => setShowHits(true)}
            placeholder="Search by name or email — must be a registered user"
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-9 py-3 text-sm focus:outline-none focus:border-orange-400"
          />
          {searching && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" />}
        </div>
        {showHits && hits.length > 0 && (
          <div className="absolute z-10 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            {hits.map(c => (
              <button
                key={c.email}
                onClick={() => selectClient(c)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-orange-50 text-left"
              >
                <User className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-navy-950 truncate">{c.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{c.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}
        {clientEmail && (
          <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" /> Matched registered client: {clientEmail}
          </div>
        )}
      </div>

      {/* Manual override / phone */}
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <input
          value={clientName}
          onChange={e => setClientName(e.target.value)}
          placeholder="Client name"
          className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-400"
        />
        <input
          value={clientEmail}
          onChange={e => setClientEmail(e.target.value)}
          placeholder="Client email"
          className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-400"
        />
        <input
          value={clientPhone}
          onChange={e => setClientPhone(e.target.value)}
          placeholder="Phone (optional)"
          className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-400"
        />
      </div>

      {/* Service line items */}
      <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1.5 block">Services & Rates</label>
      <div className="flex flex-col gap-2.5 mb-3">
        {items.map((it, idx) => (
          <div key={idx} className="flex items-start gap-2 bg-white border border-slate-200 rounded-xl p-3">
            <div className="flex-1 min-w-0 grid sm:grid-cols-[1fr_auto_auto] gap-2">
              <div>
                <select
                  value={servicesData.some(s => s.title === it.service) ? it.service : it.service ? "__custom__" : ""}
                  onChange={e => {
                    if (e.target.value === "__custom__") {
                      updateItem(idx, { service: "" });
                    } else {
                      updateItem(idx, { service: e.target.value });
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-medium mb-1.5 focus:outline-none focus:border-orange-400"
                >
                  <option value="">Select a listed service…</option>
                  {servicesData.map(s => (
                    <option key={s.id} value={s.title}>{s.title}</option>
                  ))}
                  <option value="__custom__">+ Custom / not listed</option>
                </select>
                <input
                  value={it.service}
                  onChange={e => updateItem(idx, { service: e.target.value })}
                  placeholder="Service name"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-orange-400"
                />
              </div>
              <input
                type="number"
                min={0}
                value={it.rate || ""}
                onChange={e => updateItem(idx, { rate: Number(e.target.value) })}
                placeholder="Rate (₹)"
                className="w-28 bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-orange-400"
              />
              <input
                type="number"
                min={1}
                value={it.qty || 1}
                onChange={e => updateItem(idx, { qty: Number(e.target.value) })}
                placeholder="Qty"
                className="w-20 bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-orange-400"
              />
            </div>
            <button onClick={() => removeItem(idx)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 flex-shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addItem}
        className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-orange-600 hover:text-orange-700 mb-6"
      >
        <Plus className="h-3.5 w-3.5" /> Add another service
      </button>

      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1.5 block">Valid Till (optional)</label>
          <input
            type="date"
            value={validTill}
            onChange={e => setValidTill(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-400"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1.5 block">Notes (optional)</label>
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Payment terms, exclusions, etc."
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange-400"
          />
        </div>
      </div>

      <div className="flex items-center justify-between bg-navy-950 rounded-xl px-5 py-4 mb-5">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total</span>
        <span className="text-xl font-display font-extrabold text-orange-400">₹{total.toLocaleString("en-IN")}</span>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleDownload}
          disabled={!validForm}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold text-xs uppercase tracking-wide transition-all"
        >
          <Download className="h-4 w-4" /> Download PDF
        </button>
        <button
          onClick={handleSend}
          disabled={!validForm || saving}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wide transition-all"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send to Client Portal
        </button>
        {sentFlash && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <CheckCircle2 className="h-4 w-4" /> Sent — client will see it in their dashboard.
          </span>
        )}
      </div>
      {!clientEmail && query && !searching && hits.length === 0 && (
        <p className="text-[11px] text-amber-600 font-medium mt-3">
          No registered account found for "{query}" — the client must sign up first, or fill their email in manually
          above (they just won't see it in their portal until they register with that email).
        </p>
      )}
    </div>
  );
}
