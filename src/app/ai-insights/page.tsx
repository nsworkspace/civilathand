import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpenCheck } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSitePage, mergePageFallback } from "@/lib/siteContent";
import { AI_INSIGHT_ARTICLES } from "@/data/aiContent";
import { SITE } from "@/data/site";

export const metadata: Metadata = {
  title: "Engineering & AI Visibility Insights",
  description: "Authoritative guides from Civil At Hand on structural design, BOQ, quantity surveying, BIM coordination and AI search visibility.",
  alternates: { canonical: `${SITE.url}/ai-insights` },
  robots: { index: false, follow: false },
};

export default async function AIInsightsPage() {
  const pageContent = mergePageFallback({ slug: "ai-insights", path: "/ai-insights", pageType: "existing", status: "published", title: "Engineering & AI Visibility Insights", description: "Authoritative engineering guides and answer-first content.", heroTitle: "Engineering & AI Visibility Insights", heroDescription: "Authoritative engineering guides and answer-first content." }, await getSitePage("ai-insights"));

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-600">AI-ready knowledge hub</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Engineering answers people can actually use.</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">Deep, answer-first guidance on the project questions that matter before a client appoints a civil engineering consultancy.</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {AI_INSIGHT_ARTICLES.map((article) => (
            <article key={article.slug} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600"><BookOpenCheck className="h-5 w-5" /></div>
              <h2 className="mt-5 text-xl font-black text-slate-950">{article.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{article.description}</p>
              <p className="mt-4 text-sm leading-6 text-slate-700"><strong>Answer:</strong> {article.answer}</p>
              <Link href={`/ai-insights/${article.slug}`} className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-orange-600">Read the full guide <ArrowRight className="h-4 w-4" /></Link>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
