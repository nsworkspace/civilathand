"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { digitalCapabilities, expertiseGroups, lifecycle, sectors } from "@/data/brandExperience";

export default function ExecutiveEngineeringSection({ compact = false }: { compact?: boolean }) {
  return (
    <section className="relative overflow-hidden border-y border-slate-200 bg-slate-50 py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 blueprint-grid-light opacity-60" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <span className="cah-eyebrow">Engineering intelligence</span>
            <h2 className="mt-4 max-w-2xl font-display text-3xl font-extrabold tracking-tight text-wix-dark sm:text-5xl">
              A consultancy should make the <span className="text-orange-500">next decision</span> easier.
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Civil At Hand is structured around the way real projects move: understand the problem, assess the information, engineer the solution, coordinate the interfaces and deliver documentation people can actually use.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {expertiseGroups.map((group, index) => {
            const Icon = group.icon;
            return (
              <motion.article key={group.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .05 }} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl">
                <div className="flex items-start justify-between gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-950 text-orange-400"><Icon className="h-5 w-5" /></span><span className="font-mono-tag text-[9px] font-bold text-slate-400">0{index + 1}</span></div>
                <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[.18em] text-orange-600">{group.eyebrow}</p>
                <h3 className="mt-2 font-display text-lg font-extrabold text-wix-dark">{group.title}</h3>
                <p className="mt-3 text-xs leading-6 text-slate-500">{group.description}</p>
                <ul className="mt-5 space-y-2 border-t border-slate-100 pt-5">{group.items.slice(0, 4).map(item => <li key={item} className="flex items-start gap-2 text-[11px] font-semibold text-slate-600"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-500" />{item}</li>)}</ul>
              </motion.article>
            );
          })}
        </div>

        {!compact && <>
          <div className="mt-20 grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
            <div className="overflow-hidden rounded-3xl bg-navy-950 p-7 text-white shadow-2xl md:p-9">
              <div className="flex items-center justify-between gap-4"><div><span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-orange-400">Delivery system</span><h3 className="mt-2 font-display text-2xl font-extrabold">Concept to handover</h3></div><span className="font-mono-tag text-[10px] text-slate-500">CAH / FLOW / 01</span></div>
              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {lifecycle.map((item, index) => { const Icon = item.icon; return <div key={item.step} className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><div className="flex items-center justify-between"><Icon className="h-4 w-4 text-orange-400" /><span className="font-mono-tag text-[9px] text-slate-500">{item.step}</span></div><h4 className="mt-4 text-sm font-extrabold">{item.title}</h4><p className="mt-2 text-[11px] leading-5 text-slate-400">{item.description}</p></div>; })}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-9">
              <span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-orange-600">Digital engineering</span>
              <h3 className="mt-2 font-display text-2xl font-extrabold text-wix-dark">Technology should remove friction.</h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">The benchmark firms increasingly connect technical expertise with digital workflows, project information and lifecycle delivery. Civil At Hand can present that same discipline without making technology the story itself.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">{digitalCapabilities.slice(0, 6).map(item => { const Icon = item.icon; return <div key={item.title} className="rounded-xl border border-slate-100 bg-slate-50 p-4"><Icon className="h-4 w-4 text-orange-500" /><h4 className="mt-3 text-xs font-extrabold text-wix-dark">{item.title}</h4><p className="mt-1 text-[10px] leading-5 text-slate-500">{item.description}</p></div>; })}</div>
              <Link href="/technology" className="mt-6 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-wix-dark hover:text-orange-600">Explore digital engineering <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>

          <div className="mt-20">
            <div className="flex flex-wrap items-end justify-between gap-5"><div><span className="text-[10px] font-extrabold uppercase tracking-[.2em] text-orange-600">Sectors</span><h3 className="mt-2 font-display text-2xl font-extrabold text-wix-dark sm:text-3xl">Built around project context.</h3></div><Link href="/sectors" className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-wix-dark hover:text-orange-600">View sectors <ChevronRight className="h-4 w-4" /></Link></div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{sectors.map((sector) => { const Icon = sector.icon; return <Link key={sector.title} href="/sectors" className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-wix-dark group-hover:bg-orange-500 group-hover:text-white"><Icon className="h-4.5 w-4.5" /></span><h4 className="text-sm font-extrabold text-wix-dark">{sector.title}</h4></div><p className="mt-3 text-[11px] leading-5 text-slate-500">{sector.description}</p></Link>; })}</div>
          </div>
        </>}
      </div>
    </section>
  );
}
