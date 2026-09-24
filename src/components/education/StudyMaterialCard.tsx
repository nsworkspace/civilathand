"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Download, FileText, LockKeyhole, ShieldCheck, Star, CheckCircle2, Share2, ArrowRight } from "lucide-react";
import PaymentButton from "@/components/payments/PaymentButton";
import { auth } from "@/lib/firebase";

export type StudyMaterial = {
  id: string;
  slug?: string;
  title: string;
  description?: string;
  subject?: string;
  level?: string;
  units?: string[];
  price?: number;
  featured?: boolean;
  paymentSlug: string;
  fileSize?: number;
};

const money = (n: number) => n === 0 ? "FREE" : `₹${Number(n || 0).toLocaleString("en-IN")}`;

type StudyMaterialCardProps = {
  material: StudyMaterial;
  showPurchase?: boolean;
};

export default function StudyMaterialCard({ material, showPurchase = true }: StudyMaterialCardProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [shareLabel, setShareLabel] = useState("Share material");

  const shareId = `study-material-${material.id}`;

  useEffect(() => {
    if (window.location.hash === `#${shareId}`) {
      requestAnimationFrame(() => document.getElementById(shareId)?.scrollIntoView({ behavior: "smooth", block: "center" }));
    }
  }, [shareId]);

  const shareMaterial = async () => {
    setShareLabel("Sharing…");
    const path = material.slug ? `/education/study-materials/${encodeURIComponent(material.slug)}` : `${window.location.pathname}#${shareId}`;
    const url = `${window.location.origin}${path}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: material.title, text: `Study material: ${material.title}`, url });
        setShareLabel("Shared");
      } else {
        await navigator.clipboard.writeText(url);
        setShareLabel("Link copied");
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") setShareLabel("Copy link");
    } finally {
      window.setTimeout(() => setShareLabel("Share material"), 2000);
    }
  };

  const download = async () => {
    setError("");
    setDownloading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Please sign in to download your purchased PDF.");
      const token = await user.getIdToken(true);
      const res = await fetch(`/api/study-materials/${encodeURIComponent(material.id)}/download`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Download is not available.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${material.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "civil-at-hand-study-material"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e: any) {
      setError(e?.message || "Unable to download the PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const detailUrl = material.slug ? `/education/study-materials/${encodeURIComponent(material.slug)}` : null;

  return (
    <article id={shareId} className="group scroll-mt-24 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-premium transition hover:-translate-y-1 hover:shadow-premium-lg">
      <div className="h-1.5 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-300" />
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600"><FileText className="h-6 w-6" /></div>
          <div className="flex flex-wrap justify-end gap-1.5">
            {material.featured && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-wider text-amber-700"><Star className="h-3 w-3" /> Featured</span>}
            <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[8px] font-extrabold uppercase tracking-wider text-white">PDF</span>
          </div>
        </div>

        <div className="mt-5">
          {detailUrl ? (
            <Link href={detailUrl} className="block rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2">
              <h3 className="font-display text-xl font-black leading-tight tracking-tight text-slate-950 transition group-hover:text-orange-600">{material.title}</h3>
            </Link>
          ) : <h3 className="font-display text-xl font-black leading-tight tracking-tight text-slate-950">{material.title}</h3>}
        </div>
        <p className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-orange-600">{material.subject || "Civil Engineering"}</p>
        <p className="mt-3 text-xs leading-6 text-slate-500">{material.description || "Premium Civil At Hand study material prepared for focused technical learning."}</p>

        <div className="mt-5 grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600">
          <div className="rounded-xl bg-slate-50 px-3 py-2.5"><span className="block text-[8px] uppercase tracking-wider text-slate-400">Level</span><span className="mt-1 block">{material.level || "All learners"}</span></div>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5"><span className="block text-[8px] uppercase tracking-wider text-slate-400">Units</span><span className="mt-1 block">{material.units?.length || 1} structured units</span></div>
        </div>

        {material.units?.length ? (
          <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-[8px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Inside this PDF</p>
            <ul className="mt-2 space-y-1.5">
              {material.units.slice(0, 5).map((unit) => <li key={unit} className="flex gap-2 text-[10px] font-semibold text-slate-600"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />{unit}</li>)}
              {material.units.length > 5 && <li className="text-[10px] font-bold text-orange-600">+ {material.units.length - 5} more units</li>}
            </ul>
          </div>
        ) : null}

        <div className="mt-6 border-t border-slate-100 pt-5">
          {detailUrl && (
            <Link href={detailUrl} className="mb-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-orange-700 transition hover:border-orange-300 hover:bg-orange-100">
              Read more & view details <ArrowRight className="h-4 w-4" />
            </Link>
          )}

          {showPurchase && (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div><p className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400">One-time access</p><p className="mt-1 font-display text-xl font-black text-slate-950">{money(Number(material.price || 0))}</p></div>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /> Account locked</span>
              </div>

              {unlocked ? (
                <button type="button" onClick={download} disabled={downloading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-orange-500 disabled:opacity-60">
                  {downloading ? <span className="animate-pulse">Preparing secure download…</span> : <><Download className="h-4 w-4" /> Download PDF</>}
                </button>
              ) : (
                <PaymentButton itemSlug={material.paymentSlug} showDetails={false} onUnlocked={() => setUnlocked(true)} fallback={<div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">This study material is temporarily unavailable.</div>} />
              )}
              {error && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] font-semibold text-red-700">{error}</p>}
              <p className="mt-3 flex items-start gap-1.5 text-[9px] font-semibold leading-4 text-slate-400"><LockKeyhole className="mt-0.5 h-3 w-3 shrink-0" /> PDF delivery is server-authorized against your verified account and confirmed payment.</p>
            </>
          )}

          <div className="mt-3 flex items-center justify-end">
            <button type="button" onClick={shareMaterial} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[9px] font-extrabold uppercase tracking-wider text-slate-600 transition hover:border-orange-300 hover:text-orange-600" aria-label={`Share ${material.title}`}>
              <Share2 className="h-3.5 w-3.5" /> {shareLabel}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
