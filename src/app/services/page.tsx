import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { services } from "@/data/site";

export const metadata: Metadata = { title: "Services" };

export default function Services() {
  return (
    <>
      <PageHero title="Our Services" subtitle="End-to-end civil engineering and architecture solutions." />
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div key={s.title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="mb-4 text-3xl">{s.icon}</div>
              <h2 className="mb-2 text-lg font-bold text-navy-950">{s.title}</h2>
              <p className="text-sm leading-relaxed text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-14 text-center">
          <Link href="/contact" className="rounded-lg bg-gold-500 px-8 py-3.5 font-semibold text-navy-950 transition hover:bg-gold-400">
            Request a Quote
          </Link>
        </div>
      </section>
    </>
  );
}
