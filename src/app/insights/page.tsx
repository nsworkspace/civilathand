import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Calculator, FileText, MessageSquareText } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSitePage, mergePageFallback } from "@/lib/siteContent";

export const metadata: Metadata = { title: "Engineering Insights", description: "Civil At Hand engineering insights, technical guides, AI-readable expertise content, FAQs and practical engineering tools." };

const cards = [
  { title: "Engineering Insights", text: "Practical articles covering structural design, BOQ, BIM, project decisions and the built environment.", href: "/blog", icon: BookOpen },
  { title: "Engineering Tools", text: "Practical calculators and converters for early-stage quantity, measurement and engineering workflows.", href: "/calculators", icon: Calculator },
  { title: "Frequently Asked Questions", text: "Plain-English answers to the questions clients ask before starting engineering work.", href: "/faq", icon: FileText },
];

export default async function InsightsPage() {
  const pageContent = mergePageFallback({ slug: "insights", path: "/insights", pageType: "existing", status: "published", title: "Engineering Insights", description: "Engineering insights, technical guides, tools and FAQs.", heroTitle: "Engineering Insights", heroDescription: "Engineering insights, technical guides, tools and FAQs." }, await getSitePage("insights"));
 return <div className="min-h-screen bg-slate-50"><Header /><main><section className="bg-navy-950 py-24 text-white md:py-32"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><span className="text-[10px] font-extrabold uppercase tracking-[.22em] text-orange-400">Knowledge & authority</span><h1 className="mt-4 max-w-4xl font-display text-4xl font-extrabold sm:text-6xl">{pageContent.heroTitle || "Engineering knowledge should be usable."}</h1><p className="mt-6 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">Explore the technical content, tools and project guidance behind Civil At Hand's engineering approach.</p></div></section><section className="py-20 md:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="grid gap-5 md:grid-cols-2">{cards.map(card => { const Icon=card.icon; return <Link key={card.title} href={card.href} className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl"><div className="flex items-center justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-950 text-orange-400"><Icon className="h-5 w-5" /></span><ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-orange-500" /></div><h2 className="mt-7 font-display text-2xl font-extrabold text-wix-dark">{card.title}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">{card.text}</p></Link>; })}</div></div></section>{pageContent.contentHtml && <section className="prose prose-slate mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8" dangerouslySetInnerHTML={{__html: pageContent.contentHtml}} />}
  </main><Footer /></div>; }
