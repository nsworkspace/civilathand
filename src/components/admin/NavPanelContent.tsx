"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, Search, ChevronRight, Star } from "lucide-react";

type NavGroup = {
  label: string;
  items: { id: string; title: string; short: string; icon: React.ComponentType<{ className?: string }>; badge?: boolean; ticketBadge?: number; alert?: boolean }[];
};

export function NavPanelContent({ navSearch, setNavSearch, filteredNavGroups, activeTab, setActiveTab, leads, onSelect, hideHeader, favorites = [], onToggleFavorite, alertTabs = new Set<string>() }: {
  navSearch: string; setNavSearch: (v: string) => void; filteredNavGroups: NavGroup[]; activeTab: string; setActiveTab: (id: string) => void; leads: { status: string }[]; onSelect: () => void; hideHeader?: boolean; favorites?: string[]; onToggleFavorite?: (id: string) => void; alertTabs?: Set<string>;
}) {
  const hasNewLeads = leads.some((l) => l.status === "new");
  const groups = filteredNavGroups.map((group) => ({ ...group, items: group.items.filter((tab) => tab.id !== "websiteContent") })).filter((group) => group.items.length > 0);
  const search = (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
      <input type="text" value={navSearch} onChange={(e) => setNavSearch(e.target.value)} placeholder="Search modules…" className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 font-medium focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.08] transition-all" />
    </div>
  );
  return <>
    {!hideHeader && <div className="px-4 pt-4 pb-3 border-b border-white/[0.06]"><div className="flex items-center gap-2 mb-3"><Shield className="h-3.5 w-3.5 text-orange-500" /><span className="text-[10px] font-extrabold text-white uppercase tracking-[0.25em]">Control Modules</span></div>{search}</div>}
    {hideHeader && <div className="px-4 pb-3">{search}</div>}
    <div className="flex flex-col gap-0.5 p-2.5 lg:p-3 lg:max-h-[calc(100vh-220px)] overflow-y-auto scrollbar-none">
      {groups.length === 0 && <p className="text-xs text-slate-500 font-medium px-2 py-4 w-full text-center">No modules match &ldquo;{navSearch}&rdquo;.</p>}
      {groups.map((group) => <div key={group.label} className="mb-3 last:mb-0"><p className="px-3 pb-1.5 pt-2 text-[9px] font-extrabold text-slate-500 uppercase tracking-[0.2em]">{group.label}</p><div className="flex flex-col gap-0.5">{group.items.map((tab) => { const showNewDot = alertTabs.has(tab.id) || (tab.badge && hasNewLeads); const isActive = activeTab === tab.id; return <motion.button key={tab.id} whileHover={{ x: isActive ? 0 : 3 }} whileTap={{ scale: 0.98 }} onClick={() => { setActiveTab(tab.id); onSelect(); }} title={tab.title} className={`flex items-center justify-between gap-2 w-full px-3 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wide transition-all duration-200 ${isActive ? "bg-orange-500 text-white shadow-orange-glow" : "text-slate-300 hover:bg-white/[0.06] hover:text-white"}`}><div className="flex items-center gap-2.5 min-w-0"><tab.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-white" : "text-orange-500"}`} /><span className="truncate">{tab.title}</span></div><div className="flex items-center gap-1.5 flex-shrink-0">{showNewDot && <span className={`flex h-2 w-2 rounded-full ${isActive ? "bg-white" : "bg-red-500"} animate-pulse ring-2 ${isActive ? "ring-white/30" : "ring-red-500/30"}`} title="New update" />}{tab.ticketBadge !== undefined && tab.ticketBadge > 0 && <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white text-orange-600" : "bg-orange-500 text-white"}`}>{tab.ticketBadge}</span>}<span role="button" tabIndex={0} aria-label={favorites.includes(tab.id) ? `Remove ${tab.title} from favorites` : `Add ${tab.title} to favorites`} onClick={(event) => { event.stopPropagation(); onToggleFavorite?.(tab.id); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); onToggleFavorite?.(tab.id); } }} className={`p-1 rounded-md transition-colors ${favorites.includes(tab.id) ? (isActive ? "text-white" : "text-amber-400") : (isActive ? "text-white/60 hover:text-white" : "text-slate-500 hover:text-amber-400")}`}><Star className="h-3 w-3" fill={favorites.includes(tab.id) ? "currentColor" : "none"} /></span>{isActive && <ChevronRight className="h-3.5 w-3.5 text-white" />}</div></motion.button>; })}</div></div>)}
    </div>
    <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.06]"><span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /><span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Session Secured</span></div>
  </>;
}
