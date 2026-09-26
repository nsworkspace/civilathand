import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSitePage } from "@/lib/siteContent";
import { SITE } from "@/data/site";
export const dynamic="force-dynamic";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const page=await getSitePage(slug);if(!page||page.pageType!=="custom")return{};return{title:page.seoTitle||page.title,description:page.seoDescription||page.description,alternates:{canonical:`${SITE.url}/content/${page.slug}`}}}
export default async function CustomContentPage({params}:{params:Promise<{slug:string}>}){const{slug}=await params;const page=await getSitePage(slug);if(!page||page.pageType!=="custom")notFound();return <div className="min-h-screen bg-white"><Header/><main><section className="bg-navy-950 py-20 text-white md:py-28"><div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"><span className="text-[10px] font-extrabold uppercase tracking-[.22em] text-orange-400">NS Construction</span><h1 className="mt-4 max-w-4xl font-display text-4xl font-extrabold tracking-tight sm:text-6xl">{page.heroTitle||page.title}</h1>{(page.heroDescription||page.description)&&<p className="mt-6 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">{page.heroDescription||page.description}</p>}{page.ctaText&&page.ctaHref&&<Link href={page.ctaHref} className="mt-8 inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-xs font-extrabold uppercase tracking-widest text-white hover:bg-orange-600">{page.ctaText}<ArrowRight className="h-4 w-4"/></Link>}</div></section>{page.heroImageUrl&&<div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:px-8"><img src={page.heroImageUrl} alt="" className="max-h-[520px] w-full rounded-3xl object-cover"/></div>}{page.contentHtml&&<section className="prose prose-slate mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8" dangerouslySetInnerHTML={{__html:page.contentHtml}}/>}</main><Footer/></div>}
