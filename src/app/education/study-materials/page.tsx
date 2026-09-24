"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, FileText, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import StudyMaterialCard, { StudyMaterial } from "@/components/education/StudyMaterialCard";

const steps = [
  { n: "01", t: "Choose PDF", d: "Pick the exact topic" },
  { n: "02", t: "Sign up / sign in", d: "Use a verified account" },
  { n: "03", t: "Pay securely", d: "Razorpay checkout" },
  { n: "04", t: "Download", d: "Server-authorized PDF" },
];

export default function StudyMaterialsPage() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/study-materials", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMaterials(Array.isArray(d?.materials) ? d.materials : []))
      .catch(() => setMaterials([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header />
      <main className="flex-grow">
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 blueprint-grid opacity-50" />
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
            <Link href="/education" className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-orange-300 hover:text-white">
              <ArrowLeft className="h-3.5 w-3.5" /> Education
            </Link>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-orange-300">
              <Sparkles className="h-3.5 w-3.5" /> Premium study library
            </div>
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-black tracking-tight sm:text-5xl">
              Civil At Hand <span className="text-orange-400">Study Material</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Original Civil At Hand PDFs for students and professionals — structured
              unit-wise notes, reference material and practical civil-engineering
              learning packs.
            </p>
            <div className="mt-7 flex flex-wrap gap-2 text-[9px] font-extrabold uppercase tracking-wider text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">Original PDFs</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">Unit-wise</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2">Secure paid access</span>
            </div>
            <div className="mt-8 flex max-w-md items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-5">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              <div>
                <p className="font-display text-sm font-black text-white">Buy once. Download securely.</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-400">
                  Every paid PDF is linked to your verified account and checked for entitlement before it streams.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl grid-cols-2 sm:grid-cols-4">
            {steps.map((step) => (
              <div key={step.n} className="border-r border-slate-200 px-4 py-5 last:border-r-0 sm:px-6">
                <p className="font-mono-tag text-[9px] font-bold text-orange-600">{step.n}</p>
                <p className="mt-2 text-xs font-extrabold text-slate-900">{step.t}</p>
                <p className="mt-1 text-[10px] leading-4 text-slate-500">{step.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-600">Original learning packs</p>
                <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Build your civil-engineering reference shelf.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                  New PDFs are organised by unit and updated regularly — pick exactly what you need for revision or reference.
                </p>
              </div>
              <Link href="/education/courses" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-extrabold uppercase tracking-wider text-slate-700 hover:border-orange-300 hover:text-orange-600">
                Explore Courses <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
            ) : materials.length === 0 ? (
              <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <BookOpen className="mx-auto h-9 w-9 text-slate-300" />
                <p className="mt-4 text-sm font-bold text-slate-700">The study library is being prepared.</p>
                <p className="mt-2 text-xs text-slate-500">New Civil At Hand PDFs will appear here when published.</p>
              </div>
            ) : (
              <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {materials.map((m) => (
                  <StudyMaterialCard key={m.id} material={m} showPurchase={false} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
