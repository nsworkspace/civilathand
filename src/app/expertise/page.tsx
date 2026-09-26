import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSitePage, mergePageFallback } from "@/lib/siteContent";
import ExecutiveEngineeringSection from "@/components/ExecutiveEngineeringSection";
import { expertiseGroups, lifecycle } from "@/data/brandExperience";

export const metadata: Metadata = { title: "Engineering Expertise", description: "Explore NS Construction's engineering, project delivery, digital engineering and technical advisory capabilities." };

export default async function ExpertisePage() {
  const pageContent = mergePageFallback({ slug: "expertise", path: "/expertise", pageType: "existing", status: "published", title: "Expertise", description: "Engineering capability and project delivery expertise.", heroTitle: "Expertise", heroDescription: "Engineering capability and project delivery expertise." }, await getSitePage("expertise"));

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <section className="relative overflow-hidden bg-navy-950 py-24 text-white md:py-32">
          <div className="absolute inset-0 blueprint-grid opacity-40" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <span className="text-[10px] font-extrabold uppercase tracking-[.22em] text-orange-400">Engineering capability</span>
            <h1 className="mt-4 max-w-4xl font-display text-4xl font-extrabold tracking-tight sm:text-6xl">{pageContent.heroTitle || "Technical depth, organized around the project."}</h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{pageContent.heroDescription || "A clear capability architecture helps developers, contractors, architects and project owners understand where NS Construction can contribute and what the next step looks like."}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/project-planner" className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-xs font-extrabold uppercase tracking-widest text-white hover:bg-orange-600">Start a project brief <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/portfolio" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-xs font-extrabold uppercase tracking-widest text-white hover:bg-white/10">Explore projects</Link>
            </div>
          </div>
        </section>
        <ExecutiveEngineeringSection compact />
        <section className="border-t border-slate-200 bg-white py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl"><span className="cah-eyebrow">How work moves</span><h2 className="mt-4 font-display text-3xl font-extrabold text-wix-dark sm:text-4xl">A disciplined delivery sequence.</h2></div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lifecycle.map((item) => { const Icon = item.icon; return <div key={item.step} className="rounded-2xl border border-slate-200 p-6"><div className="flex items-center justify-between"><Icon className="h-5 w-5 text-orange-500" /><span className="font-mono-tag text-[10px] text-slate-400">{item.step}</span></div><h3 className="mt-6 font-display text-lg font-extrabold text-wix-dark">{item.title}</h3><p className="mt-2 text-xs leading-6 text-slate-500">{item.description}</p></div>; })}
            </div>
            <div className="mt-10 rounded-2xl border border-orange-100 bg-orange-50 p-6"><div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" /><p className="text-sm leading-6 text-slate-700">Final engineering decisions, calculations and compliance statements should always be reviewed by the appropriately qualified professional responsible for the project.</p></div></div>
          </div>
        </section>
        {pageContent.contentHtml && <section className="prose prose-slate mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8" dangerouslySetInnerHTML={{ __html: pageContent.contentHtml }} />}
      </main>
      <Footer />
    </div>
  );
}
