import Link from "next/link";
import { services, projects, stats, site } from "@/data/site";

export default function Home() {
  return (
    <>
      <section className="blueprint-grid relative overflow-hidden bg-navy-950 text-white">
        <div className="mx-auto max-w-6xl px-5 py-24 md:py-32">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-gold-400">{site.tagline}</p>
          <h1 className="max-w-3xl font-display text-4xl font-bold leading-tight md:text-6xl">
            Designing &amp; building <span className="text-gold-400">strong foundations</span> for tomorrow.
          </h1>
          <p className="mt-6 max-w-xl text-base text-slate-300 md:text-lg">
            {site.name} delivers structural design, architecture and construction management with precision, safety and on-time delivery.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link href="/contact" className="rounded-lg bg-gold-500 px-7 py-3.5 font-semibold text-navy-950 transition hover:bg-gold-400">
              Start Your Project
            </Link>
            <Link href="/projects" className="rounded-lg border border-white/30 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">
              View Our Work
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-10 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-3xl font-bold text-gold-600 md:text-4xl">{s.value}</div>
              <div className="mt-1 text-sm text-slate-600">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold text-navy-950 md:text-4xl">Our Services</h2>
          <div className="mx-auto mt-3 h-1 w-14 rounded bg-gold-500" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div key={s.title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="mb-4 text-3xl">{s.icon}</div>
              <h3 className="mb-2 text-lg font-bold text-navy-950">{s.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-100 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-navy-950 md:text-4xl">Recent Projects</h2>
            <div className="mx-auto mt-3 h-1 w-14 rounded bg-gold-500" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 3).map((p) => (
              <div key={p.title} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="blueprint-grid flex h-40 items-center justify-center bg-navy-800 text-5xl">🏛️</div>
                <div className="p-5">
                  <h3 className="font-bold text-navy-950">{p.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{p.type} · {p.location}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/projects" className="font-semibold text-gold-600 hover:underline">See all projects →</Link>
          </div>
        </div>
      </section>

      <section className="bg-gold-500 py-14 text-center">
        <div className="mx-auto max-w-3xl px-5">
          <h2 className="font-display text-2xl font-bold text-navy-950 md:text-3xl">Have a project in mind?</h2>
          <p className="mt-3 text-navy-900">Talk to our engineers and get a free consultation.</p>
          <Link href="/contact" className="mt-6 inline-block rounded-lg bg-navy-950 px-8 py-3.5 font-semibold text-white transition hover:bg-navy-800">
            Contact Us
          </Link>
        </div>
      </section>
    </>
  );
}
