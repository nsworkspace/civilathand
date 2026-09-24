import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, HelpCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { servicesData } from "@/data/services";
import { getSitePage, mergePageFallback } from "@/lib/siteContent";
import { SITE } from "@/data/site";

export const metadata: Metadata = {
  title: "Engineering Services Pricing & Scope",
  description: "See how Civil At Hand scopes engineering service pricing, what drives the quotation and which deliverables can be included.",
  alternates: { canonical: `${SITE.url}/pricing` },
};

const tiers = [
  {
    name: "Scope Review",
    who: "For early-stage enquiries and feasibility checks",
    copy: "A focused review of your project brief, drawings and required deliverables before a full quotation.",
    includes: ["Requirements review", "Missing-input checklist", "Recommended service path", "Initial delivery assumptions"],
  },
  {
    name: "Project Delivery",
    who: "For defined engineering or design packages",
    copy: "A project-scoped engagement covering the agreed design, estimation, BIM or documentation workflow.",
    includes: ["Agreed deliverables", "Design or estimation workflow", "Revision assumptions", "Technical handoff"],
  },
  {
    name: "Integrated Support",
    who: "For multi-stage or multi-discipline requirements",
    copy: "For clients who need several services, recurring revisions or coordinated project support.",
    includes: ["Multiple service streams", "Coordination checkpoints", "Procurement or quantity support", "Ongoing review path"],
  },
];

export default async function PricingPage() {
  const pageContent = mergePageFallback({ slug: "pricing", path: "/pricing", pageType: "existing", status: "published", title: "Pricing", description: "Clearer commercial decisions before the work starts.", heroTitle: "Clearer commercial decisions before the work starts.", heroDescription: "Engineering work varies with area, complexity, deliverables, review cycles and turnaround." }, await getSitePage("pricing"));
  const serviceNames = servicesData.map((service) => service.title);
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main>
        <section className="bg-slate-950 px-4 py-20 text-white sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-400">Pricing & scope</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{pageContent.heroTitle || "Clearer commercial decisions before the work starts."}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">{pageContent.heroDescription || "Engineering work varies with area, complexity, deliverables, review cycles and turnaround. The current service catalogue intentionally keeps consultancy services as price-on-request so the proposal reflects the real scope instead of inventing generic public prices."}</p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {tiers.map((tier, index) => (
              <article key={tier.name} className={`rounded-3xl border ${index === 1 ? "border-orange-300 bg-white shadow-lg" : "border-slate-200 bg-white"} p-6`}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600">{tier.name}</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">{tier.who}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{tier.copy}</p>
                <div className="mt-6 space-y-3">
                  {tier.includes.map((item) => <div key={item} className="flex items-start gap-2 text-sm text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />{item}</div>)}
                </div>
                <Link href="/contact" className="mt-7 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-orange-600">Request a quote <ArrowRight className="h-4 w-4" /></Link>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-7">
            <h2 className="text-xl font-black text-slate-950">What changes the quotation?</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {["Built-up area / project size", "Structural or technical complexity", "Deliverables and file formats", "Turnaround and revision cycles"].map((item) => <div key={item} className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700">{item}</div>)}
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-600">Current publicly configured engineering services: {serviceNames.join(", ")}. These are stored as price-on-request in the project source, so no unsupported numeric service price has been added to the site.</p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Link href="/contact" className="rounded-3xl bg-slate-950 p-6 text-white hover:bg-orange-600"><p className="text-[10px] font-black uppercase tracking-widest text-orange-300">Need a project quote?</p><p className="mt-2 text-2xl font-black">Send the drawings and scope.</p><p className="mt-2 text-sm text-slate-300">We can route the enquiry to the right engineering service.</p></Link>
            <Link href="/faq" className="rounded-3xl border border-slate-200 bg-white p-6"><HelpCircle className="h-6 w-6 text-orange-500" /><p className="mt-3 text-2xl font-black text-slate-950">Read the pricing FAQ</p><p className="mt-2 text-sm text-slate-600">Get context on payments, scope and the information needed for a quote.</p></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
