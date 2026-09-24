import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AI_INSIGHT_ARTICLES } from "@/data/aiContent";
import { SITE } from "@/data/site";

export function generateStaticParams() {
  return AI_INSIGHT_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = AI_INSIGHT_ARTICLES.find((item) => item.slug === slug);
  if (!article) return { title: "Insight not found" };
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `${SITE.url}/ai-insights/${article.slug}` },
    openGraph: { title: article.title, description: article.description, url: `${SITE.url}/ai-insights/${article.slug}` },
  };
}

export default async function AIInsightDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = AI_INSIGHT_ARTICLES.find((item) => item.slug === slug);
  if (!article) notFound();
  const url = `${SITE.url}/ai-insights/${article.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: article.title,
    description: article.description,
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@id": `${SITE.url}/#organization` },
    datePublished: "2026-08-19",
    dateModified: "2026-08-19",
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <nav className="text-[10px] font-black uppercase tracking-widest text-slate-400"><Link href="/ai-insights" className="hover:text-orange-600">AI Insights</Link> / {article.title}</nav>
        <article className="mt-8">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-600">Civil At Hand Engineering Team</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{article.title}</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">{article.description}</p>

          <section className="mt-8 rounded-3xl border border-orange-200 bg-orange-50 p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">Direct answer</p>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-900">{article.answer}</p>
          </section>

          <div className="mt-10 space-y-6">
            {article.body.map((paragraph, index) => <p key={index} className="text-base leading-8 text-slate-700">{paragraph}</p>)}
          </div>

          <section className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-black text-slate-950">Practical takeaways</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              {article.takeaways.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </section>

          <p className="mt-10 text-xs leading-6 text-slate-500">Published by Civil At Hand. Project-specific engineering decisions should always be checked against the approved drawings, applicable standards, site conditions and qualified professional review.</p>
        </article>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
