"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, MessageCircle, Users, Sparkles } from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import CommunityProMount from "@/components/community/CommunityProMount";
import "./community-polish.css";

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname=usePathname();
  const [user,setUser]=useState<User|null>(null);
  const [authReady,setAuthReady]=useState(false);
  useEffect(()=>onAuthStateChanged(auth,nextUser=>{setUser(nextUser);setAuthReady(true)}),[]);
  const isExplore=pathname==="/community/explore";
  return <div className="community-ui-polish">
    {!authReady?<main className="grid min-h-[100dvh] place-items-center bg-slate-50"><div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-bold text-slate-500 shadow-sm">Loading Community…</div></main>:!user&&!isExplore?<PublicCommunityHome/>:<>{children}{user&&pathname==="/community"?<Suspense fallback={null}><CommunityProMount/></Suspense>:null}</>}
  </div>;
}

function PublicCommunityHome(){
 const [groups,setGroups]=useState(0),[channels,setChannels]=useState(0),[spaces,setSpaces]=useState(0);
 useEffect(()=>{let cancelled=false;(async()=>{try{const res=await fetch("/api/community",{cache:"no-store"});const data=await res.json().catch(()=>({}));if(!res.ok||!data.success||cancelled)return;const all=Array.isArray(data.groups)?data.groups:[];setGroups(all.filter((s:any)=>s.type!=="channel").length);setChannels(all.filter((s:any)=>s.type==="channel").length);setSpaces(all.length)}catch{}})();return()=>{cancelled=true}},[]);
 return <main className="min-h-[100dvh] bg-[#f4f7f7] px-3 py-3 sm:px-5 sm:py-6 lg:px-8"><div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_70px_-35px_rgba(15,23,42,.35)]"><section className="relative overflow-hidden bg-[radial-gradient(circle_at_85%_20%,_rgba(200,148,42,.24),_transparent_30%),linear-gradient(135deg,#071827,#103047_60%,#163354)] px-6 py-12 text-white sm:px-10 sm:py-16"><div className="relative mx-auto max-w-4xl"><div className="inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-300/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.2em] text-orange-300"><Sparkles className="h-3.5 w-3.5"/> Civil At Hand Community</div><h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">A place to connect, learn and share with the civil engineering community.</h1><p className="mt-5 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">Browse public groups and channels first. See what the community is about, then sign in only when you are ready to join.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/community/explore" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"><Compass className="h-4 w-4 text-orange-400"/> Explore communities</Link><Link href="/auth?mode=signin&redirect=%2Fcommunity" className="inline-flex min-h-11 items-center rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-black text-white backdrop-blur transition hover:bg-white/10">Sign in</Link></div></div></section><section className="grid gap-4 border-b border-slate-100 px-5 py-6 sm:grid-cols-3 sm:px-8"><PublicStat icon={<Users className="h-5 w-5"/>} label="Groups" value={groups}/><PublicStat icon={<MessageCircle className="h-5 w-5"/>} label="Channels" value={channels}/><PublicStat icon={<Compass className="h-5 w-5"/>} label="Community spaces" value={spaces}/></section><section className="px-5 py-8 sm:px-8 sm:py-10"><div className="grid gap-4 sm:grid-cols-3"><InfoCard title="See before joining" text="Explore the public community list without creating an account first."/><InfoCard title="Join when ready" text="Choose a group from Explore. Sign in or sign up only when you actually want to join."/><InfoCard title="Then participate" text="After joining, your community conversations, members and messages are available in one place."/></div></section></div></main>;
}
function PublicStat({icon,label,value}:{icon:React.ReactNode;label:string;value:number}){return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-600">{icon}</span><div><span className="block text-[10px] font-bold text-slate-400">{label}</span><b className="block text-2xl font-black text-slate-950">{value}</b></div></div></div>}
function InfoCard({title,text}:{title:string;text:string}){return <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><h2 className="text-sm font-black text-slate-950">{title}</h2><p className="mt-2 text-xs leading-5 text-slate-500">{text}</p></article>}
