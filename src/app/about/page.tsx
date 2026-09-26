import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, HardHat, Building2, ShieldCheck, Factory, Landmark, Hammer, Warehouse } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "About NS Construction",
  description:
    "NS Construction is a civil engineering and construction company serving clients across India.",
};

const pillars: Array<{ title: string; description: string; icon: LucideIcon }> = [
  {
    title: "Plan",
    description:
      "Site assessment, budgeting and scheduling so every project starts with a clear, realistic plan.",
    icon: ClipboardCheck,
  },
  {
    title: "Design & Engineer",
    description:
      "Structural, architectural and technical drawings that are accurate, buildable and code-compliant.",
    icon: Building2,
  },
  {
    title: "Build",
    description:
      "On-site execution with quality materials, skilled crews and consistent supervision at every stage.",
    icon: HardHat,
  },
  {
    title: "Deliver & Support",
    description:
      "Clean handover, documentation and after-project support — we don't disappear once the work is done.",
    icon: ShieldCheck,
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <Header />
      <main id="main-content">
        <section className="bg-[#07111f] text-white">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-7 lg:px-8 lg:py-28">
            <p className="text-xs font-black uppercase tracking-[.18em] text-orange-400">About NS Construction</p>
            <h1 className="mt-5 max-w-4xl font-display text-4xl font-black tracking-tight sm:text-6xl">
              Civil engineering and construction, done right.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              NS Construction delivers civil engineering, construction and project
              execution services — built on reliable planning, quality workmanship
              and clear communication from start to handover.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/services" className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold">
                Explore services <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/work-with-us" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-bold">
                Explore careers
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-7 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange-600">How we work</span>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">From first site visit to final handover.</h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {pillars.map(({ title, description, icon: Icon }) => (
              <div key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-6 font-display text-2xl font-black">{title}</h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-7 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-orange-600">Who we work with</p>
              <h2 className="mt-3 font-display text-3xl font-black">Construction partners across every sector.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Homeowners & residential projects", HardHat],
                ["Real estate developers", Building2],
                ["Commercial & retail clients", Warehouse],
                ["Industrial & warehousing", Factory],
                ["Architects & design consultants", ClipboardCheck],
                ["Government & infrastructure projects", Landmark],
                ["Renovation & remodeling", Hammer],
                ["Facility & project management", ShieldCheck],
              ].map(([item, Icon]) => {
                const ItemIcon = Icon as LucideIcon;
                return (
                  <div key={item as string} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm font-semibold">
                    <ItemIcon className="h-4 w-4 shrink-0 text-orange-500" />
                    {item as string}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
