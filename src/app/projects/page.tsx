import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import { projects } from "@/data/site";

export const metadata: Metadata = { title: "Projects" };

export default function Projects() {
  return (
    <>
      <PageHero title="Our Projects" subtitle="A selection of work we are proud of." />
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <div key={p.title} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="blueprint-grid flex h-44 items-center justify-center bg-navy-800 text-5xl">🏛️</div>
              <div className="p-5">
                <h2 className="font-bold text-navy-950">{p.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{p.type}</p>
                <p className="mt-3 text-xs text-slate-500">📍 {p.location} · {p.year}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
