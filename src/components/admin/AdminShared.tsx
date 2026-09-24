"use client";

import React from "react";
import { X, Activity, MapPin, Clock, FileText, Briefcase, Receipt, User } from "lucide-react";
import { motion } from "framer-motion";
import UserAvatar from "@/components/UserAvatar";

// ─── Client Avatar ────────────────────────────────────────────────
export function ClientAvatar({ name, size = "md", onClick, profileImageId, profileImageUrl }: { name: string; size?: "sm" | "md"; onClick?: () => void; profileImageId?: string; profileImageUrl?: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const colors = [
    "from-orange-400 to-orange-600",
    "from-blue-400 to-blue-600",
    "from-emerald-400 to-emerald-600",
    "from-purple-400 to-purple-600",
    "from-rose-400 to-rose-600",
    "from-teal-400 to-teal-600",
    "from-amber-400 to-amber-600",
    "from-cyan-400 to-cyan-600",
  ];
  const colorIdx = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  const sizeClass = size === "sm" ? "w-8 h-8 text-[11px]" : "w-10 h-10 text-xs";
  
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={`View ${name}'s profile`}
        className={`${sizeClass} rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center font-extrabold text-white shadow-md flex-shrink-0 cursor-pointer hover:scale-110 hover:shadow-lg transition-all border-2 border-white ring-1 ring-black/10`}
      >
        <UserAvatar name={name} profileImageId={profileImageId} profileImageUrl={profileImageUrl} size={size === "sm" ? "sm" : "md"} className="h-full w-full border-0 ring-0 shadow-none" />
      </button>
    );
  }

  return (
    <div
      title={name}
      className={`${sizeClass} rounded-full bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center font-extrabold text-white shadow-md flex-shrink-0 border-2 border-white ring-1 ring-black/10`}
    >
      <UserAvatar name={name} profileImageId={profileImageId} profileImageUrl={profileImageUrl} size={size === "sm" ? "sm" : "md"} className="h-full w-full border-0 ring-0 shadow-none" />
    </div>
  );
}

// ─── Client Profile Modal ──────────────────────────────────────────
interface ClientProfile {
  name: string;
  profileImageId?: string;
  profileImageUrl?: string;
  email?: string;
  phone?: string;
  service?: string;
  status?: string;
  date?: string;
  details?: string;
  source?: string;
  location?: string;
  area?: string;
  progress?: number;
  projectTitle?: string;
  amount?: number;
  paymentStatus?: string;
  type: "lead" | "project" | "drawing" | "invoice";
  extraLabel?: string;
  extraValue?: string;
}

export function ClientProfileModal({ profile, onClose }: { profile: ClientProfile; onClose: () => void }) {
  const initials = profile.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const colors = [
    "from-orange-400 to-orange-600",
    "from-blue-400 to-blue-600",
    "from-emerald-400 to-emerald-600",
    "from-purple-400 to-purple-600",
    "from-rose-400 to-rose-600",
    "from-teal-400 to-teal-600",
    "from-amber-400 to-amber-600",
    "from-cyan-400 to-cyan-600",
  ];
  const colorIdx = profile.name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;

  const typeLabel: Record<ClientProfile["type"], string> = {
    lead: "Lead",
    project: "Project Client",
    drawing: "Drawing Client",
    invoice: "Billing Client",
  };
  const typeColor: Record<ClientProfile["type"], string> = {
    lead: "bg-orange-100 text-orange-700",
    project: "bg-blue-100 text-blue-700",
    drawing: "bg-purple-100 text-purple-700",
    invoice: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden"
      >
        {/* Header gradient */}
        <div className={`bg-gradient-to-br ${colors[colorIdx]} p-6 flex flex-col items-center gap-3 relative`}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <UserAvatar name={profile.name} profileImageId={profile.profileImageId} profileImageUrl={profile.profileImageUrl} size="lg" className="border-white/30 ring-0" />
          <div className="text-center">
            <p className="text-white font-extrabold text-lg leading-tight">{profile.name}</p>
            <span className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white`}>
              {typeLabel[profile.type]}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="p-5 space-y-3">
          {profile.email && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-slate-600">@</span>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                <p className="text-xs font-semibold text-navy-950 truncate">{profile.email}</p>
              </div>
            </div>
          )}
          {profile.phone && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-slate-600">#</span>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                <p className="text-xs font-semibold text-navy-950">{profile.phone}</p>
              </div>
            </div>
          )}
          {profile.service && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Briefcase className="h-3.5 w-3.5 text-orange-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Service</p>
                <p className="text-xs font-semibold text-navy-950">{profile.service}</p>
              </div>
            </div>
          )}
          {profile.status && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Activity className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                <p className="text-xs font-semibold text-navy-950 capitalize">{profile.status}</p>
              </div>
            </div>
          )}
          {profile.location && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-3.5 w-3.5 text-teal-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Location</p>
                <p className="text-xs font-semibold text-navy-950">{profile.location}</p>
              </div>
            </div>
          )}
          {profile.area && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <FileText className="h-3.5 w-3.5 text-purple-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Area</p>
                <p className="text-xs font-semibold text-navy-950">{profile.area} sq.ft</p>
              </div>
            </div>
          )}
          {profile.amount !== undefined && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Receipt className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Amount</p>
                <p className="text-xs font-semibold text-navy-950">₹{profile.amount.toLocaleString("en-IN")} · {profile.paymentStatus}</p>
              </div>
            </div>
          )}
          {profile.progress !== undefined && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex justify-between items-center mb-1.5">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Progress</p>
                <span className="text-[10px] font-extrabold text-navy-950">{profile.progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all"
                  style={{ width: `${profile.progress}%` }}
                />
              </div>
            </div>
          )}
          {profile.date && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                <Clock className="h-3.5 w-3.5 text-slate-600" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Date</p>
                <p className="text-xs font-semibold text-navy-950">{profile.date}</p>
              </div>
            </div>
          )}
          {profile.details && (
            <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Request Details</p>
              <p className="text-[11px] text-navy-800 font-medium italic leading-relaxed line-clamp-3">&ldquo;{profile.details}&rdquo;</p>
            </div>
          )}
          {profile.source && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Source</span>
              <span className="text-[10px] font-bold bg-navy-100 text-navy-700 px-2 py-0.5 rounded">{profile.source}</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
