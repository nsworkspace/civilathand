"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Building2, CalendarDays, CheckCircle2, MapPin, Search, Sparkles, Ruler, ShieldCheck } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

type Project = { id:string; slug:string; title:string; summary:string; category:string; location:string; budgetRange:string; areaSqFt:number; timeline:string; status:string; coverImage:string; featured:boolean; publishedAt:string|null; views:number; inquiriesCount:number };

export default function PublicProjectsPage(){
  const [projects,setProjects]=React.useState<Project[]>([]); const [query,setQuery]=React.useState(""); const [category,setCategory]=React.useState("All"); const [loading,setLoading]=React.useState(true);
  React.useEffect(()=>{ fetch("/api/public-projects",{cache:"no-store"}).then(r=>r.json()).then(d=>setProjects(Array.isArray(d)?d:[])).finally(()=>setLoading(false)); },[]);
  const categories=["All",...Array.from(new Set(projects.map(p=>p.category).filter(Boolean)))];
  const filtered=projects.filter(p=>(category==="All"||p.category===category)&&`${p.title} ${p.location} ${p.category} ${p.summary}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="min-h-screen bg-[#f5f7fa] text-slate-900"><Header/>
    <main>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(249,115,22,.25),transparent_34%),radial-gradient(circle_at_85%_0%,rgba(59,130,246,.18),transparent_35%)]"/>
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
          <div className="max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-[.18em] text-orange-300"><Sparkles className="h-3.5 w-3.5"/> Project Marketplace</span>
          <h1 className="mt-6 text-4xl font-black tracking-tight md:text-6xl">Real projects. Clear scope. <span className="text-orange-400">Serious opportunities.</span></h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">Explore selected construction, architecture and engineering opportunities. Review the public brief first; detailed commercial and personal information is discussed privately after you enquire.</p></div>
          <div className="mt-10 grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur md:grid-cols-[1fr_auto]">
            <label className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-slate-700"><Search className="h-5 w-5 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search projects, city, category..." className="w-full bg-transparent text-sm outline-none"/></label>
            <div className="flex gap-2 overflow-x-auto p-1">{categories.map(c=><button key={c} onClick={()=>setCategory(c)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold ${category===c?"bg-orange-500 text-white":"text-slate-300 hover:bg-white/10"}`}>{c}</button>)}</div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-16">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-black uppercase tracking-[.2em] text-orange-600">Open opportunities</p><h2 className="mt-2 text-3xl font-black tracking-tight">Projects worth exploring</h2></div><div className="text-sm text-slate-500">{filtered.length} project{filtered.length===1?"":"s"} available</div></div>
        {loading?<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i=><div key={i} className="h-96 animate-pulse rounded-3xl bg-slate-200"/>)}</div>:filtered.length===0?<div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><Building2 className="mx-auto h-10 w-10 text-slate-300"/><h3 className="mt-4 text-lg font-extrabold">No matching projects</h3><p className="mt-1 text-sm text-slate-500">Try a different keyword or category.</p></div>:<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{filtered.map((p,i)=><motion.article key={p.id} initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{delay:i*.04}} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
          <Link href={`/projects/${p.slug}`} className="block"><div className="relative h-60 overflow-hidden bg-slate-100">{p.coverImage?<img src={p.coverImage} alt={p.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105"/>:<div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950"><Building2 className="h-14 w-14 text-white/20"/></div>}<div className="absolute left-4 top-4 flex gap-2">{p.featured&&<span className="rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black uppercase text-white">Featured</span>}<span className="rounded-full bg-black/50 px-3 py-1 text-[10px] font-bold text-white backdrop-blur">{p.status}</span></div></div>
          <div className="p-6"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-orange-600"><span>{p.category}</span><span className="text-slate-300">•</span><span>{p.location||"India"}</span></div><h3 className="mt-2 text-xl font-black leading-tight group-hover:text-orange-600">{p.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{p.summary}</p>
          <div className="mt-5 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-slate-50 p-3"><Ruler className="mb-1 h-4 w-4 text-slate-400"/><b>{p.areaSqFt?p.areaSqFt.toLocaleString("en-IN"):"—"}</b><span className="ml-1 text-slate-400">sq.ft</span></div><div className="rounded-xl bg-slate-50 p-3"><CalendarDays className="mb-1 h-4 w-4 text-slate-400"/><b>{p.timeline||"Discuss"}</b></div></div>
          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-sm font-extrabold text-slate-900">{p.budgetRange||"Budget on discussion"}</span><span className="inline-flex items-center gap-1 text-xs font-black text-orange-600">View details <ArrowRight className="h-3.5 w-3.5"/></span></div></div></Link>
        </motion.article>)}</div>}
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8"><div className="grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5"><ShieldCheck className="h-5 w-5 text-emerald-600"/><h3 className="mt-3 font-extrabold">Privacy first</h3><p className="mt-1 text-xs leading-5 text-slate-500">No private client identity or sensitive commercial data is displayed publicly.</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><CheckCircle2 className="h-5 w-5 text-blue-600"/><h3 className="mt-3 font-extrabold">Structured briefs</h3><p className="mt-1 text-xs leading-5 text-slate-500">Scope, location, scale and expected deliverables are organized before contact.</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><MapPin className="h-5 w-5 text-orange-600"/><h3 className="mt-3 font-extrabold">Direct opportunity</h3><p className="mt-1 text-xs leading-5 text-slate-500">Enquire against one specific project so your team can follow up with context.</p></div></div></section>
    </main><Footer/></div>
}
