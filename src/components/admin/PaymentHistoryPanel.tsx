"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Clock3,
  Download,
  Eye,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

interface Event {
  id?: string;
  kind: string;
  itemSlug?: string | null;
  itemTitle?: string | null;
  title?: string | null;
  amount: number;
  originalAmount?: number | null;
  discountAmount?: number | null;
  offerId?: string | null;
  offerTitle?: string | null;
  free?: boolean;
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
  paidAt: string;
  refunded?: boolean;
  refundAmount?: number;
  refundReason?: string | null;
  lastRefundAmount?: number | null;
  lastRefundedAt?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  payerName?: string | null;
  payerContact?: string | null;
  couponCode?: string | null;
  invoiceId?: string | null;
}

const money = (value: number) => `₹${Math.max(0, Number(value) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export function PaymentHistoryPanel() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Event | null>(null);
  const [refundTarget, setRefundTarget] = useState<Event | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("Refund requested from Payment History");
  const [refunding, setRefunding] = useState(false);

  const load = async () => {
    const firstLoad = events.length === 0;
    if (firstLoad) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await fetch("/api/admin/payment-events?limit=500", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Failed to load payment history.");
      setEvents(Array.isArray(data.events) ? data.events : []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payment history.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((event) => {
      const text = [
        event.itemTitle,
        event.title,
        event.payerName,
        event.userEmail,
        event.payerContact,
        event.razorpayPaymentId,
        event.razorpayOrderId,
        event.itemSlug,
        event.invoiceId,
        event.offerTitle,
        event.couponCode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const refunded = Number(event.refundAmount || 0) > 0 || !!event.refunded;
      return (
        (!q || text.includes(q)) &&
        (kind === "all" || event.kind === kind) &&
        (status === "all" || (status === "refunded" ? refunded : !refunded))
      );
    });
  }, [events, query, kind, status]);

  const stats = useMemo(() => {
    const gross = events.reduce((sum, event) => sum + Math.max(0, Number(event.amount) || 0), 0);
    const refunded = events.reduce((sum, event) => sum + Math.max(0, Number(event.refundAmount) || 0), 0);
    const paidCount = events.filter((event) => !(Number(event.refundAmount || 0) > 0 || event.refunded)).length;
    const refundCount = events.filter((event) => Number(event.refundAmount || 0) > 0 || event.refunded).length;
    return { gross, refunded, net: Math.max(0, gross - refunded), paidCount, refundCount };
  }, [events]);

  const kinds = useMemo(() => Array.from(new Set(events.map((event) => event.kind).filter(Boolean))).sort(), [events]);

  const openRefund = (event: Event) => {
    const remaining = Math.max(0, Number(event.amount || 0) - Number(event.refundAmount || 0));
    if (!event.razorpayPaymentId || remaining <= 0) return;
    setRefundTarget(event);
    setRefundAmount(remaining.toFixed(2).replace(/\.00$/, ""));
    setRefundReason("Refund requested from Payment History");
  };

  const submitRefund = async () => {
    if (!refundTarget?.razorpayPaymentId) return;
    const remaining = Math.max(0, Number(refundTarget.amount || 0) - Number(refundTarget.refundAmount || 0));
    const amount = Number(refundAmount);

    if (!Number.isFinite(amount) || amount <= 0 || amount > remaining + 0.000001) {
      setError(`Refund must be between ₹0.01 and ${money(remaining)}.`);
      return;
    }

    const roundedAmount = Math.round(amount * 100) / 100;
    if (!window.confirm(`Refund ${money(roundedAmount)} to ${refundTarget.payerName || refundTarget.userEmail || "this customer"}?`)) {
      return;
    }

    setRefunding(true);
    setError("");
    try {
      const response = await fetch("/api/admin/payments/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpayPaymentId: refundTarget.razorpayPaymentId,
          amount: roundedAmount,
          reason: refundReason.trim() || "Refund requested from Payment History",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Refund failed.");
      setRefundTarget(null);
      setSelected(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refund failed.");
    } finally {
      setRefunding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-navy-950">
            Payment History
            {refreshing && <Loader2 className="ml-2 inline h-4 w-4 animate-spin text-orange-400" />}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Server-side payment ledger with buyer, purchase, Razorpay references and refund status.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            disabled={refreshing}
            className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-60"
          >
            <RefreshCw className={`mr-1 inline h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => window.open("/api/admin/payments/export", "_blank", "noopener,noreferrer")}
            className="rounded-lg bg-navy-950 px-3 py-2 text-xs font-bold text-white"
          >
            <Download className="mr-1 inline h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          <X className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button type="button" className="ml-auto text-xs underline" onClick={() => setError("")}>Dismiss</button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Transactions", events.length.toLocaleString("en-IN"), "Total ledger entries"],
          ["Gross collected", money(stats.gross), "Before refunds"],
          ["Refunded", money(stats.refunded), `${stats.refundCount} transaction${stats.refundCount === 1 ? "" : "s"}`],
          ["Net collected", money(stats.net), "After recorded refunds"],
          ["Paid / active", stats.paidCount.toLocaleString("en-IN"), "Not fully refunded"],
        ].map(([label, value, caption]) => (
          <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-1 text-xl font-extrabold text-navy-950">{value}</p>
            <p className="mt-1 text-[10px] text-slate-500">{caption}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_160px_150px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search buyer, email, payment ID, item…"
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </div>
        <select value={kind} onChange={(event) => setKind(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
          <option value="all">All types</option>
          {kinds.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
          <option value="all">All status</option>
          <option value="paid">Paid / active</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <div className={`overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm transition-opacity ${refreshing ? "opacity-60" : ""}`}>
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Buyer</th>
              <th className="px-4 py-3 text-left">Purchase</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((event) => {
              const refunded = Number(event.refundAmount || 0) > 0 || !!event.refunded;
              const remaining = Math.max(0, Number(event.amount || 0) - Number(event.refundAmount || 0));
              return (
                <tr key={event.id || event.razorpayPaymentId || event.paidAt} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <b>{event.payerName || "Signed-in buyer"}</b>
                    <p className="text-[11px] text-slate-500">{event.userEmail || event.payerContact || "No contact"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <b>{event.itemTitle || event.title || event.itemSlug || event.kind}</b>
                    <p className="text-[10px] text-slate-400">{event.offerTitle ? `Offer: ${event.offerTitle}` : event.couponCode ? `Coupon: ${event.couponCode}` : event.kind}</p>
                  </td>
                  <td className="px-4 py-3">
                    <b>{money(event.amount)}</b>
                    {event.discountAmount ? <p className="text-[10px] text-emerald-600">Saved {money(event.discountAmount)}</p> : null}
                    {refunded && <p className="text-[10px] text-amber-700">Refunded {money(event.refundAmount || 0)}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs">{new Date(event.paidAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-[9px] font-extrabold ${event.refunded ? "bg-amber-50 text-amber-700" : refunded ? "bg-orange-50 text-orange-700" : "bg-emerald-50 text-emerald-700"}`}>
                      {event.refunded ? "FULLY REFUNDED" : refunded ? `PARTIAL · ${money(event.refundAmount || 0)}` : "PAID"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" title="View payment details" onClick={() => setSelected(event)} className="rounded-lg bg-slate-100 p-2 hover:bg-slate-200">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    {event.razorpayPaymentId && remaining > 0 && !event.refunded && (
                      <button type="button" title={`Refund remaining ${money(remaining)}`} disabled={refunding} onClick={() => openRefund(event)} className="ml-1 rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 disabled:opacity-50">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {!filtered.length && <tr><td colSpan={6} className="p-10 text-center text-sm text-slate-500">No payment history matches your filters.</td></tr>}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => event.currentTarget === event.target && setSelected(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600">Payment audit</p>
                <h3 className="mt-1 text-lg font-extrabold text-navy-950">{selected.itemTitle || selected.title || selected.itemSlug || selected.kind}</h3>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-lg bg-slate-100 p-2"><X className="h-4 w-4" /></button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Buyer", selected.payerName || "Signed-in buyer"],
                ["Email", selected.userEmail || "—"],
                ["Contact", selected.payerContact || "—"],
                ["Charged", money(selected.amount)],
                ["Refunded", money(selected.refundAmount || 0)],
                ["Remaining refundable", money(Math.max(0, Number(selected.amount || 0) - Number(selected.refundAmount || 0)))],
                ["Original", selected.originalAmount != null ? money(selected.originalAmount) : "Same"],
                ["Discount", selected.discountAmount ? money(selected.discountAmount) : "None"],
                ["Offer", selected.offerTitle || selected.offerId || "None"],
                ["Time", new Date(selected.paidAt).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "medium" })],
                ["Razorpay payment", selected.razorpayPaymentId || "—"],
                ["Razorpay order", selected.razorpayOrderId || "—"],
                ["User ID", selected.userId || "—"],
                ["Invoice", selected.invoiceId || "—"],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="mt-1 break-all text-xs font-semibold text-slate-800">{value}</p>
                </div>
              ))}
            </div>

            {Number(selected.refundAmount || 0) > 0 && (
              <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-900">
                <b>Refund history</b>
                <p className="mt-1">Total refunded: {money(selected.refundAmount || 0)}{selected.refundReason ? ` · ${selected.refundReason}` : ""}</p>
                {selected.lastRefundedAt && <p className="mt-1 text-amber-700">Last refund: {new Date(selected.lastRefundedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>}
              </div>
            )}

            <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-800">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>This screen reads the server payment ledger. Access is granted only by the payment fulfillment pipeline.</span>
            </div>
          </div>
        </div>
      )}

      {refundTarget && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-red-600">Issue refund</p>
                <h3 className="mt-1 text-lg font-extrabold text-navy-950">{refundTarget.itemTitle || refundTarget.title || "Payment"}</h3>
                <p className="mt-1 text-xs text-slate-500">Customer: {refundTarget.payerName || refundTarget.userEmail || "Unknown"}</p>
              </div>
              <button type="button" disabled={refunding} onClick={() => setRefundTarget(null)} className="rounded-lg bg-slate-100 p-2"><X className="h-4 w-4" /></button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-[9px] uppercase text-slate-400">Paid</p><b>{money(refundTarget.amount)}</b></div>
              <div className="rounded-lg bg-slate-50 p-3"><p className="text-[9px] uppercase text-slate-400">Already refunded</p><b>{money(refundTarget.refundAmount || 0)}</b></div>
            </div>

            <label className="mt-4 block text-xs font-bold text-slate-700">Refund amount</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
              <input type="number" min="0.01" step="0.01" value={refundAmount} onChange={(event) => setRefundAmount(event.target.value)} disabled={refunding} className="w-full rounded-lg border border-slate-200 py-2.5 pl-8 pr-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" />
            </div>
            <p className="mt-1 text-[10px] text-slate-500">Maximum refundable now: {money(Math.max(0, Number(refundTarget.amount || 0) - Number(refundTarget.refundAmount || 0)))}.</p>

            <label className="mt-4 block text-xs font-bold text-slate-700">Reason</label>
            <textarea value={refundReason} onChange={(event) => setRefundReason(event.target.value)} disabled={refunding} rows={3} maxLength={240} className="mt-1 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100" />

            <div className="mt-5 flex gap-2">
              <button type="button" disabled={refunding} onClick={() => setRefundTarget(null)} className="flex-1 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700">Cancel</button>
              <button type="button" disabled={refunding} onClick={() => void submitRefund()} className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                {refunding ? <><Loader2 className="mr-1 inline h-4 w-4 animate-spin" />Processing…</> : <><RotateCcw className="mr-1 inline h-4 w-4" />Confirm refund</>}
              </button>
            </div>
            <p className="mt-3 flex items-center justify-center gap-1 text-[10px] text-slate-400"><Clock3 className="h-3 w-3" /> The refund is sent to Razorpay for processing.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentHistoryPanel;
