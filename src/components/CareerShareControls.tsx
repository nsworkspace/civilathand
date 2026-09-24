"use client";

import { Copy, ExternalLink, Share2 } from "lucide-react";
import { useState } from "react";

export default function CareerShareControls({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt("Copy this job link:", url);
    }
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center gap-2 font-extrabold text-sm text-slate-900 mb-3"><Share2 className="h-4 w-4 text-orange-500" /> Share this job</div>
      <p className="text-[11px] text-slate-500 mb-3">This job has its own SEO-friendly page and can be shared directly.</p>
      <div className="flex gap-2">
        <button type="button" onClick={copy} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-2 text-[10px] font-extrabold uppercase"><Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy Link"}</button>
        <a href={`https://wa.me/?text=${encodeURIComponent(`${title} at Civil At Hand — ${url}`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-lg bg-emerald-500 text-white px-3 py-2"><ExternalLink className="h-3.5 w-3.5" /></a>
      </div>
    </div>
  );
}
