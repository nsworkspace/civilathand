import { Suspense } from "react";
import CommunityPage from "@/app/community/page";

function CommunityLoading(){
  return <main className="grid min-h-[100dvh] place-items-center bg-slate-50"><div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-bold text-slate-500 shadow-sm">Loading Community…</div></main>;
}

export default function CommunityAppPage(){
  return <Suspense fallback={<CommunityLoading />}><CommunityPage /></Suspense>;
}
