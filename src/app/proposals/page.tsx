"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FileText, Download, Loader2, Calendar, IndianRupee } from "lucide-react";
import { downloadProposal, proposalTotal, ProposalItem } from "@/lib/proposal";

type Proposal = {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  items: ProposalItem[];
  notes?: string;
  validTill?: string;
  status: string;
  createdAt: string;
};

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userJson = typeof window !== "undefined" ? localStorage.getItem("cah_user") : null;
    const u = userJson ? JSON.parse(userJson) : null;
    setUser(u);

    if (u?.email) {
      fetch(`/api/proposals?email=${encodeURIComponent(u.email)}`)
        .then(res => res.json())
        .then(data => setProposals(data.proposals || []))
        .catch(err => console.error("Failed to load proposals:", err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50 pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-display font-extrabold text-navy-950">Your Proposals</h1>
            <p className="text-slate-500 text-sm mt-1.5">Service proposals shared with you by NS Construction.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : !user ? (
            <div className="text-center py-20 text-slate-400 text-sm font-medium">Please sign in to view your proposals.</div>
          ) : proposals.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-sm font-medium">No proposals yet.</div>
          ) : (
            <div className="flex flex-col gap-4">
              {proposals.map(p => (
                <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-bold text-navy-950 text-sm">Proposal #{p.id.slice(-6).toUpperCase()}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" /> {new Date(p.createdAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadProposal(p)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy-950 hover:bg-navy-900 text-white text-[11px] font-bold uppercase tracking-wide"
                    >
                      <Download className="h-3.5 w-3.5" /> Download PDF
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5 mb-4">
                    {p.items.map((it, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{it.service} {it.qty > 1 ? `× ${it.qty}` : ""}</span>
                        <span className="font-bold text-navy-950">₹{(it.rate * it.qty).toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                      <IndianRupee className="h-3.5 w-3.5" /> Total
                    </span>
                    <span className="text-lg font-display font-extrabold text-orange-500">
                      ₹{proposalTotal(p.items).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
