import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import { site, stats } from "@/data/site";

export const metadata: Metadata = { title: "About Us" };

const values = [
  { t: "Safety First", d: "Every design and site activity follows applicable IS codes and safe practices." },
  { t: "Quality Work", d: "Tested materials, skilled crews and strict supervision at every stage." },
  { t: "On-Time Delivery", d: "Clear schedules, regular updates and no surprises on cost." },
  { t: "Client Focus", d: "We listen first, then design solutions that fit your needs and budget." },
];

export default function About() {
  return (
    <>
      <PageHero title="About NS Infra" subtitle="Civil engineers and architects building with precision and integrity." />
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl font-bold text-navy-950">Who we are</h2>
          <p className="mt-5 leading-relaxed text-slate-600">
            {site.name} is a civil engineering and architecture firm offering complete solutions under one roof: from concept design and
            structural engineering to estimation, construction and project management.
          </p>
          <p className="mt-4 leading-relaxed text-slate-600">
            Our team combines technical expertise with practical site experience, so every project is buildable, economical and durable.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-navy-950 p-6 text-center text-white">
              <div className="font-display text-3xl font-bold text-gold-400">{s.value}</div>
              <div className="mt-1 text-sm text-slate-300">{s.label}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="bg-slate-100 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="mb-10 text-center font-display text-3xl font-bold text-navy-950">Our Values</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.t} className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="mb-2 font-bold text-navy-950">{v.t}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
