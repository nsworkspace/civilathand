"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileText, Loader2, Share2, ShieldCheck, BookOpen, Download } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import StudyMaterialCard, { StudyMaterial } from "@/components/education/StudyMaterialCard";

export default function StudyMaterialPage({ params }: { params: Promise<{ slug: string }> }) {
  const [material, setMaterial] = useState<StudyMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareLabel, setShareLabel] = useState("Share this material");

  useEffect(() => {
    let cancelled = false;

    async function loadMaterial() {
      try {
        setLoading(true);
        setError("");
        const resolvedParams = await params;
        const slug = String(resolvedParams?.slug || "").trim();
        if (!slug) throw new Error("This study material link is invalid.");

        const response = await fetch(`/api/study-materials?slug=${encodeURIComponent(slug)}`, {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || "Study material not found.");

        const found = data?.material || (Array.isArray(data?.materials) ? data.materials[0] : null);
        if (!found) throw new Error("Study material not found.");
        if (!cancelled) setMaterial(found as StudyMaterial);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Unable to load this study material.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMaterial();
    return () => { cancelled = true; };
  }, [params]);

  const shareMaterial = async () => {
    if (!material) return;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: material.title, text: `Study material: ${material.title}`, url });
        setShareLabel("Shared");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShareLabel("Link copied");
      } else setShareLabel("Copy the page URL");
    } catch {
      setShareLabel("Share this material");
    } finally {
      window.setTimeout(() => setShareLabel("Share this material"), 2500);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header />
      <main className="flex-grow">
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 blueprint-grid opacity-50" />
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
            <Link href="/education/study-materials" className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-orange-300 hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Study Materials</Link>
            {loading ? (
              <div className="mt-10 flex items-center gap-3"><Loader2 className="h-7 w-7 animate-spin text-orange-400" /><span className="text-sm font-semibold text-slate-300">Loading study material…</span></div>
            ) : error ? (
              <div className="mt-8 max-w-2xl rounded-2xl border border-red-400/20 bg-white/5 p-6"><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-red-300">Material unavailable</p><h1 className="mt-3 font-display text-3xl font-black">We couldn't open this material</h1><p className="mt-3 text-sm leading-6 text-slate-300">{error}</p><Link href="/education/study-materials" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-orange-500 px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-orange-400">Browse Study Materials</Link></div>
            ) : material ? (
              <>
                <p className="mt-8 text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-300">Premium study material · {material.subject || "Civil Engineering"}</p>
                <h1 className="mt-4 max-w-4xl font-display text-4xl font-black tracking-tight sm:text-5xl">{material.title}</h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">{material.description || "Premium Civil At Hand study material prepared for focused technical learning."}</p>
                <button type="button" onClick={shareMaterial} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-white/15"><Share2 className="h-4 w-4" /> {shareLabel}</button>
              </>
            ) : null}
          </div>
        </section>

        {material && !error && (
          <section className="py-10 sm:py-14">
            <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
              <div className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5"><BookOpen className="h-5 w-5 text-orange-500" /><p className="mt-3 text-[8px] font-extrabold uppercase tracking-wider text-slate-400">Level</p><p className="mt-1 text-sm font-black text-slate-900">{material.level || "All learners"}</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5"><FileText className="h-5 w-5 text-orange-500" /><p className="mt-3 text-[8px] font-extrabold uppercase tracking-wider text-slate-400">Format</p><p className="mt-1 text-sm font-black text-slate-900">PDF · Secure</p></div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5"><CheckCircle2 className="h-5 w-5 text-emerald-500" /><p className="mt-3 text-[8px] font-extrabold uppercase tracking-wider text-slate-400">Coverage</p><p className="mt-1 text-sm font-black text-slate-900">{material.units?.length || 1} units</p></div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium sm:p-8">
                  <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600"><FileText className="h-6 w-6" /></div><div><p className="text-[9px] font-extrabold uppercase tracking-wider text-orange-600">What is inside</p><p className="mt-1 text-xs font-bold text-slate-500">Structured technical learning material</p></div></div>
                  {material.units?.length ? <ul className="mt-7 grid gap-3 sm:grid-cols-2">{material.units.map((unit) => <li key={unit} className="flex gap-3 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-600"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{unit}</li>)}</ul> : <p className="mt-6 text-sm leading-6 text-slate-500">Structured study material for focused technical learning.</p>}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
                  <div className="flex gap-4"><ShieldCheck className="h-6 w-6 shrink-0 text-emerald-500" /><div><h2 className="font-display text-xl font-black text-slate-950">Secure digital access</h2><p className="mt-2 text-sm leading-6 text-slate-500">Your PDF is delivered only after verified payment and account authorization. The public study-material page does not expose the protected file.</p></div></div>
                </div>
              </div>

              <aside className="lg:sticky lg:top-24 lg:self-start"><StudyMaterialCard material={material} showPurchase /></aside>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
