"use client";

import { notifyAdmin } from "./AdminToast";
import React, { useState } from "react";
import { useProjects } from "@/context/ProjectContext";
import { motion } from "framer-motion";
import {
  FilePlus, Loader2, CheckCircle, Share2, Trash2, Link as LinkIcon,
  ShieldCheck  // ← added this import
} from "lucide-react";
import { ClientAvatar } from "./AdminShared";

export function InvoicesPanel() {
  const { invoices, projects, generateInvoice, payInvoice, updateInvoicePaymentLink } = useProjects();
  const [selectedProjId, setSelectedProjId] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState<string>("");
  const [invoicePaymentLink, setInvoicePaymentLink] = useState<string>("");
  const [invoiceSuccess, setInvoiceSuccess] = useState(false);
  const [editingLinkInvId, setEditingLinkInvId] = useState<string | null>(null);
  const [editingLinkValue, setEditingLinkValue] = useState<string>("");
  const [generatingLinkInvId, setGeneratingLinkInvId] = useState<string | null>(null);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [createInvoiceStage, setCreateInvoiceStage] = useState<"" | "creating" | "linking">("");

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(invoiceAmount);
    if (!selectedProjId || !invoiceAmount.trim() || !Number.isFinite(amountNum) || amountNum < 1 || amountNum > 1000000) return;
    setIsCreatingInvoice(true);
    setCreateInvoiceStage("creating");
    try {
      const manualLink = invoicePaymentLink.trim() || undefined;
      const createdInv = await generateInvoice(selectedProjId, amountNum, manualLink);
      if (createdInv && !manualLink) {
        setCreateInvoiceStage("linking");
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
        } catch (linkErr) {
          console.error("Error auto-generating Razorpay link:", linkErr);
        }
      }
      setInvoiceSuccess(true);
      setSelectedProjId("");
      setInvoiceAmount("");
      setInvoicePaymentLink("");
      setTimeout(() => setInvoiceSuccess(false), 3000);
    } finally {
      setIsCreatingInvoice(false);
      setCreateInvoiceStage("");
    }
  };

  const handleGenerateRazorpayLink = async (invId: string) => {
    setGeneratingLinkInvId(invId);
    try {
      const res = await fetch("/api/admin/payments/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invId }),
      });
      const data = await res.json();
      if (!res.ok) {
        notifyAdmin(data.error || "Failed to generate payment link.");
        return;
      }
      await updateInvoicePaymentLink(invId, data.paymentLink);
    } catch (err) {
      console.error("Error generating Razorpay link:", err);
      notifyAdmin("Something went wrong while generating the payment link.");
    } finally {
      setGeneratingLinkInvId(null);
    }
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
        <h3 className="font-display font-extrabold text-xl text-navy-950">Invoicing & Milestone Billing</h3>
        <p className="text-xs text-navy-600 mt-1">Issue new quotations and invoices for structural layouts. View collection summaries.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <form onSubmit={handleCreateInvoice} className="border border-slate-200 rounded-xl p-5 md:p-6 space-y-4 bg-slate-50">
          <h4 className="font-display font-extrabold text-sm text-navy-950 flex items-center gap-1.5 uppercase tracking-wide">
            <FilePlus className="h-4.5 w-4.5 text-orange-500" />
            Create Project Quotation
          </h4>
          <div>
            <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider mb-2">
              Target Project
            </label>
            <select
              required
              value={selectedProjId}
              onChange={(e) => setSelectedProjId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800 font-semibold shadow-sm transition-all"
            >
              <option value="">-- Select Client & Project --</option>
              {[...projects]
                .sort((a, b) => a.clientName.localeCompare(b.clientName))
                .map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.clientName} — {proj.title} ({proj.status})
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider mb-2">
              Invoiced Amount (INR - ₹)
            </label>
            <input
              type="number"
              required
              min="1"
              max="1000000"
              step="1"
              placeholder="Enter amount (₹)"
              value={invoiceAmount}
              onChange={(e) => setInvoiceAmount(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800 font-semibold shadow-sm transition-all"
            />
            <p className="text-[10px] text-navy-600 mt-1">Enter any amount between ₹1 and ₹10,00,000.</p>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider mb-2">
              Manual Payment Link (optional override)
            </label>
            <input
              type="url"
              placeholder="Leave blank to auto-generate via Razorpay"
              value={invoicePaymentLink}
              onChange={(e) => setInvoicePaymentLink(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-800 font-semibold shadow-sm transition-all"
            />
            <p className="text-[10px] text-navy-600 mt-1 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-600 flex-shrink-0" />
              Leave this blank — a secure Razorpay payment link is generated automatically when you issue the invoice.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!selectedProjId || !invoiceAmount.trim() || isCreatingInvoice}
            className="w-full bg-navy-950 hover:bg-orange-600 disabled:bg-slate-400 text-white font-bold py-3 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-premium"
          >
            {invoiceSuccess ? (
              <>
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                Invoice & Payment Link Ready!
              </>
            ) : isCreatingInvoice ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {createInvoiceStage === "linking" ? "Generating Secure Payment Link..." : "Creating Invoice..."}
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                Issue Invoice & Auto-Generate Payment Link
              </>
            )}
          </motion.button>
        </form>
        <div className="space-y-4">
          <h4 className="font-display font-extrabold text-sm text-navy-950 uppercase tracking-wider">Billing History</h4>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {invoices.map((inv) => (
              <div key={inv.id} className="border border-slate-200 rounded-lg p-3 bg-white hover:bg-slate-50 transition-colors text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <ClientAvatar name={projects.find((p) => p.id === inv.projectId)?.clientName || inv.projectTitle} size="sm" />
                    <div>
                      <p className="font-semibold text-navy-950">{inv.projectTitle}</p>
                      <p className="text-[10px] text-navy-600">ID: #{inv.id.toUpperCase()} • ₹{inv.amount.toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${inv.status === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {inv.status}
                    </span>
                    {inv.paymentLink && (
                      <button
                        onClick={() => { navigator.clipboard.writeText(inv.paymentLink || ""); }}
                        title="Copy payment link"
                        className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-navy-950 transition-colors"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {editingLinkInvId === inv.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="url"
                      autoFocus
                      placeholder="https://rzp.io/i/xxxxxxx"
                      value={editingLinkValue}
                      onChange={(e) => setEditingLinkValue(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 rounded px-2 py-1.5 text-[10px] focus:outline-none focus:border-blue-600 text-slate-800 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        updateInvoicePaymentLink(inv.id, editingLinkValue.trim());
                        setEditingLinkInvId(null);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded text-[10px]"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingLinkInvId(null)}
                      className="bg-slate-200 hover:bg-slate-300 text-navy-950 font-bold px-2.5 py-1.5 rounded text-[10px]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 flex-wrap">
                    <span className="text-[10px] text-navy-600 truncate max-w-[140px]">
                      {inv.paymentLink ? inv.paymentLink : "No payment link added"}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {inv.status !== "Paid" && (
                        <button
                          type="button"
                          onClick={() => handleGenerateRazorpayLink(inv.id)}
                          disabled={generatingLinkInvId === inv.id}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold px-2.5 py-1.5 rounded text-[10px] flex items-center gap-1"
                        >
                          {generatingLinkInvId === inv.id ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" /> Generating...
                            </>
                          ) : (
                            <>{inv.paymentLink ? "Regenerate via Razorpay" : "Generate via Razorpay"}</>
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingLinkInvId(inv.id);
                          setEditingLinkValue(inv.paymentLink || "");
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-navy-950 font-bold px-2.5 py-1.5 rounded text-[10px]"
                      >
                        {inv.paymentLink ? "Edit Link" : "Add Link"}
                      </button>
                      {inv.status !== "Paid" && (
                        <button
                          type="button"
                          onClick={() => payInvoice(inv.id)}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-2.5 py-1.5 rounded text-[10px]"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
