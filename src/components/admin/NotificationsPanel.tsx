"use client";

import React, { useState } from "react";
import { useProjects } from "@/context/ProjectContext";
import { SavedFieldSuggestions } from "./SavedFieldSuggestions";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Radio, Send, Loader2, CheckCheck, Search, Users, UserCheck, Trash2, Info, AlertTriangle, AlertOctagon, Check
} from "lucide-react";

export function NotificationsPanel() {
  const { notifications, addNotification, deleteNotification, markNotificationsAsRead } = useProjects();

  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifType, setNotifType] = useState<"info" | "success" | "warning" | "danger">("info");
  const [notifAudience, setNotifAudience] = useState<"all" | "specific">("all");
  const [notifTargetEmail, setNotifTargetEmail] = useState("");
  const [notifTargetName, setNotifTargetName] = useState("");
  const [notifSending, setNotifSending] = useState(false);
  const [notifSentFlash, setNotifSentFlash] = useState(false);
  const [notifHistorySearch, setNotifHistorySearch] = useState("");

  const handleSendAdminNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    if (notifAudience === "specific" && !notifTargetEmail.trim()) return;
    setNotifSending(true);
    try {
      await addNotification(
        notifTitle.trim(),
        notifMessage.trim(),
        notifType,
        false,
        notifAudience === "specific" ? notifTargetEmail.trim() : "all",
        notifAudience === "specific" ? notifTargetName.trim() || undefined : undefined
      );
      setNotifTitle("");
      setNotifMessage("");
      setNotifType("info");
      setNotifAudience("all");
      setNotifTargetEmail("");
      setNotifTargetName("");
      setNotifSentFlash(true);
      setTimeout(() => setNotifSentFlash(false), 2500);
    } finally {
      setNotifSending(false);
    }
  };

  const sentClientNotifs = notifications
    .filter((n) => !n.isAdmin)
    .filter((n) => {
      if (!notifHistorySearch.trim()) return true;
      const q = notifHistorySearch.trim().toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        (n.userEmail || "").toLowerCase().includes(q)
      );
    });

  const ADMIN_NOTIF_STYLES: Record<
    string,
    { icon: React.ComponentType<{ className?: string }>; iconColor: string; iconBg: string; accent: string; chipBg: string; chipText: string }
  > = {
    success: { icon: Check, iconColor: "text-emerald-600", iconBg: "bg-emerald-100", accent: "bg-emerald-500", chipBg: "bg-emerald-50", chipText: "text-emerald-700" },
    warning: { icon: AlertTriangle, iconColor: "text-amber-600", iconBg: "bg-amber-100", accent: "bg-amber-500", chipBg: "bg-amber-50", chipText: "text-amber-700" },
    danger: { icon: AlertOctagon, iconColor: "text-rose-600", iconBg: "bg-rose-100", accent: "bg-rose-500", chipBg: "bg-rose-50", chipText: "text-rose-700" },
    info: { icon: Info, iconColor: "text-sky-600", iconBg: "bg-sky-100", accent: "bg-sky-500", chipBg: "bg-sky-50", chipText: "text-sky-700" },
  };

  const getNotifPreviewStyle = (type?: string) => ADMIN_NOTIF_STYLES[type || "info"] || ADMIN_NOTIF_STYLES.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="grid grid-cols-1 lg:grid-cols-5 gap-5"
    >
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-fit">
        <div className="flex items-center gap-2 px-5 py-4 bg-gradient-to-r from-navy-950 to-slate-800">
          <Radio className="h-4 w-4 text-orange-400" />
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-wide">Broadcast Notification</h3>
            <p className="text-[10px] text-slate-400">Send an alert to all clients or one specific client</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5 block">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { id: "info", label: "Info", icon: Info, active: "bg-sky-500 border-sky-500 text-white", idle: "border-sky-200 text-sky-600 hover:bg-sky-50" },
                  { id: "success", label: "Success", icon: Check, active: "bg-emerald-500 border-emerald-500 text-white", idle: "border-emerald-200 text-emerald-600 hover:bg-emerald-50" },
                  { id: "warning", label: "Warning", icon: AlertTriangle, active: "bg-amber-500 border-amber-500 text-white", idle: "border-amber-200 text-amber-600 hover:bg-amber-50" },
                  { id: "danger", label: "Danger", icon: AlertOctagon, active: "bg-rose-500 border-rose-500 text-white", idle: "border-rose-200 text-rose-600 hover:bg-rose-50" },
                ] as const
              ).map((t) => {
                const Icon = t.icon;
                const isActive = notifType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setNotifType(t.id)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 py-2 text-[9px] font-bold uppercase tracking-wide transition-all ${
                      isActive ? t.active + " shadow-sm" : "bg-white " + t.idle
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5 block">Audience</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNotifAudience("all")}
                className={`flex items-center justify-center gap-1.5 rounded-lg border-2 py-2 text-[10px] font-bold uppercase tracking-wide transition-all ${
                  notifAudience === "all" ? "bg-navy-950 border-navy-950 text-white" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                All Clients
              </button>
              <button
                type="button"
                onClick={() => setNotifAudience("specific")}
                className={`flex items-center justify-center gap-1.5 rounded-lg border-2 py-2 text-[10px] font-bold uppercase tracking-wide transition-all ${
                  notifAudience === "specific" ? "bg-navy-950 border-navy-950 text-white" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <UserCheck className="h-3.5 w-3.5" />
                Specific Client
              </button>
            </div>
          </div>
          {notifAudience === "specific" && (
            <div className="space-y-2 bg-slate-50 rounded-lg p-3 border border-slate-100">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wide text-slate-500 mb-1 block">Client Email</label>
                <input
                  type="email"
                  value={notifTargetEmail}
                  onChange={(e) => setNotifTargetEmail(e.target.value)}
                  placeholder="client@example.com"
                  list="admin-notif-contact-emails"
                  className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
                <SavedFieldSuggestions type="contacts" query={notifTargetEmail} id="admin-notif-contact-emails" />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase tracking-wide text-slate-500 mb-1 block">Client Name (optional)</label>
                <input
                  type="text"
                  value={notifTargetName}
                  onChange={(e) => setNotifTargetName(e.target.value)}
                  placeholder="Rohan Sharma"
                  className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
              </div>
            </div>
          )}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5 block">Title</label>
            <input
              type="text"
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
              placeholder="e.g. Limited Time Offer"
              maxLength={80}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5 block">
              Message <span className="normal-case font-medium text-slate-400">(paste a link and it becomes clickable)</span>
            </label>
            <textarea
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
              placeholder="Get 20% off structural design this week: https://civilathan.in/offer"
              rows={4}
              maxLength={400}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs leading-relaxed focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400 resize-none"
            />
            <div className="text-[9px] text-slate-400 text-right mt-1">{notifMessage.length}/400</div>
          </div>
          {(notifTitle.trim() || notifMessage.trim()) && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5 block">Preview</label>
              {(() => {
                const style = getNotifPreviewStyle(notifType);
                const Icon = style.icon;
                return (
                  <div className={`relative flex items-start gap-2.5 rounded-xl p-3 pl-4 ${style.chipBg} border border-slate-100`}>
                    <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${style.accent}`} />
                    <div className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${style.iconBg}`}>
                      <Icon className={`h-3.5 w-3.5 ${style.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-navy-950">{notifTitle || "Notification title"}</p>
                      <p className="text-[11px] text-navy-600 mt-0.5 break-words">{notifMessage || "Your message will appear here..."}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
          <button
            type="button"
            onClick={handleSendAdminNotification}
            disabled={notifSending || !notifTitle.trim() || !notifMessage.trim() || (notifAudience === "specific" && !notifTargetEmail.trim())}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:cursor-not-allowed text-white disabled:text-slate-400 font-bold text-xs uppercase tracking-wide py-2.5 transition-all shadow-orange-glow disabled:shadow-none"
          >
            {notifSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {notifSending ? "Sending..." : notifAudience === "all" ? "Broadcast to All Clients" : "Send to Client"}
          </button>
          <AnimatePresence>
            {notifSentFlash && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Notification sent successfully
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-navy-950">Sent Notifications</h3>
            <p className="text-[10px] text-slate-400">{sentClientNotifs.length} total sent to clients</p>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={notifHistorySearch}
              onChange={(e) => setNotifHistorySearch(e.target.value)}
              placeholder="Search sent..."
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-[11px] w-40 sm:w-52 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>
        </div>
        <div className="divide-y divide-slate-50 max-h-[640px] overflow-y-auto">
          {sentClientNotifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Bell className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-xs font-bold text-navy-950">No notifications sent yet</p>
              <p className="text-[11px] text-slate-400">Compose one on the left to get started</p>
            </div>
          ) : (
            sentClientNotifs.map((notif) => {
              const style = getNotifPreviewStyle((notif as any).type);
              const Icon = style.icon;
              return (
                <div key={notif.id} className="relative flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                  <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${style.accent}`} />
                  <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${style.iconBg}`}>
                    <Icon className={`h-4 w-4 ${style.iconColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-navy-950">{notif.title}</p>
                      <span className={`text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${style.chipBg} ${style.chipText}`}>
                        {(notif as any).type}
                      </span>
                      {notif.read && (
                        <span className="flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-400">
                          <CheckCheck className="h-2.5 w-2.5" /> Read
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-navy-600 leading-relaxed mt-0.5 break-words">{notif.message}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">{notif.timestamp}</span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
                        {!notif.userEmail || notif.userEmail === "all" ? (
                          <>
                            <Users className="h-2.5 w-2.5" /> All Clients
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-2.5 w-2.5" /> {notif.recipientName || notif.userEmail}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteNotification(notif.id)}
                    title="Delete notification"
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}
