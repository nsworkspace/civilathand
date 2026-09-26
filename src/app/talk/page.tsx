"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Loader2, User, Mail, Phone, ArrowRight, Paperclip, X,
  FileText, Image as ImageIcon, RefreshCw, CheckCheck,
  Home, MoreVertical, MessageSquare, Shield, Clock,
  HelpCircle, LogIn, ChevronRight, Zap, Star, Users, Building2,
} from "lucide-react";
import Link from "next/link";
import type { TicketAttachment } from "@/context/ProjectContext";

const STORAGE_KEY = "cah_talk_session";

interface SessionData {
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  ticketId: string;
  savedAt: number;
}

interface ChatMsg {
  id: string;
  sender: "client" | "admin" | "system";
  senderName?: string;
  text: string;
  timestamp: string;
  attachments?: TicketAttachment[];
}

function fmtTime(iso?: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso.replace(" ", "T"));
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

function fmtDate(iso?: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso.replace(" ", "T"));
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch { return ""; }
}

function groupByDate(msgs: ChatMsg[]) {
  const groups: { date: string; msgs: ChatMsg[] }[] = [];
  let lastDate = "";
  for (const m of msgs) {
    const d = fmtDate(m.timestamp);
    if (d !== lastDate) { groups.push({ date: d, msgs: [m] }); lastDate = d; }
    else groups[groups.length - 1].msgs.push(m);
  }
  return groups;
}

function linkify(text: string): React.ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((p, i) =>
    p.match(urlRegex)
      ? <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="underline break-all opacity-90 hover:opacity-100">{p}</a>
      : <React.Fragment key={i}>{p}</React.Fragment>
  );
}

function AdminAvatar() {
  return (
    <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden ring-2 ring-[#c8942a]/30 shadow">
      <img src="/logo.jpg" alt="NS Construction" className="w-full h-full object-cover"
        onError={e => {
          const el = e.target as HTMLImageElement;
          el.style.display = "none";
          el.parentElement!.style.background = "linear-gradient(135deg,#c8942a,#dba83c)";
        }} />
    </div>
  );
}

function Bubble({ msg, isMe, showAvatar }: { msg: ChatMsg; isMe: boolean; showAvatar: boolean }) {
  if (msg.sender === "system") {
    return (
      <div className="flex justify-center my-4">
        <span className="text-[11px] text-slate-500 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full px-4 py-1.5 font-semibold shadow-sm">
          {msg.text}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18 }}
      className={`flex items-end gap-2 mb-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isMe && showAvatar ? <AdminAvatar /> : !isMe ? <div className="w-8 flex-shrink-0" /> : null}
      <div className={`flex flex-col max-w-[78%] sm:max-w-[62%] ${isMe ? "items-end" : "items-start"}`}>
        {!isMe && showAvatar && (
          <span className="text-[11px] font-bold text-[#c8942a] ml-1 mb-1 uppercase tracking-wider">
            NS Construction · Support
          </span>
        )}
        <div className={`relative rounded-2xl px-4 py-2.5 shadow-sm ${
          isMe
            ? "bg-gradient-to-br from-[#0c1a2e] to-[#163354] text-white rounded-br-sm"
            : "bg-white text-[#0c1a2e] rounded-bl-sm border border-slate-100"
        }`} style={{ minWidth: 72 }}>
          {msg.text && (
            <p className="text-[13.5px] leading-[20px] whitespace-pre-wrap break-words pr-12">
              {linkify(msg.text)}
            </p>
          )}
          {(msg.attachments || []).map((a, i) => (
            <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" download={a.name}
              className={`mt-2 flex items-center gap-2 rounded-xl px-2.5 py-2 transition-colors max-w-[200px] ${isMe ? "bg-white/10 hover:bg-white/20" : "bg-slate-50 hover:bg-slate-100"}`}>
              <FileText className={`h-4 w-4 flex-shrink-0 ${isMe ? "text-[#c8942a]" : "text-[#0c1a2e]"}`} />
              <span className={`text-[12px] font-semibold truncate ${isMe ? "text-white" : "text-[#0c1a2e]"}`}>{a.name}</span>
            </a>
          ))}
          <span className={`absolute bottom-1.5 right-2.5 flex items-center gap-0.5 text-[10px] ${isMe ? "text-white/50" : "text-slate-400"}`}>
            {fmtTime(msg.timestamp)}
            {isMe && <CheckCheck className="h-3 w-3 text-[#c8942a]/70 ml-0.5" />}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-end gap-2 mb-2">
      <AdminAvatar />
      <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-2 h-2 rounded-full bg-[#c8942a]/40 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TalkPage() {
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [step, setStep] = useState<"form" | "chat">("form");

  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const [ticketId, setTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingFiles, setPendingFiles] = useState<TicketAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [lastMsgCount, setLastMsgCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const cahUser = localStorage.getItem("cah_user");
      if (cahUser) {
        const u = JSON.parse(cahUser);
        if (u.name) setVisitorName(u.name);
        if (u.email) setVisitorEmail(u.email);
        if (u.phone) setVisitorPhone(u.phone);
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s: SessionData = JSON.parse(raw);
        if (s.ticketId && s.visitorName && Date.now() - s.savedAt < 7 * 24 * 60 * 60 * 1000) {
          setVisitorName(s.visitorName);
          setVisitorEmail(s.visitorEmail);
          setVisitorPhone(s.visitorPhone);
          setTicketId(s.ticketId);
          setStep("chat");
        }
      }
    } catch { }
    setSessionLoaded(true);
  }, []);

  const saveSession = useCallback((name: string, email: string, phone: string, tid: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ visitorName: name, visitorEmail: email, visitorPhone: phone, ticketId: tid, savedAt: Date.now() }));
    } catch { }
  }, []);

  useEffect(() => {
    if (step === "chat") setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [messages, step]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const pollMessages = useCallback(async (id: string, silent = false) => {
    try {
      const res = await fetch(`/api/tickets/${id}`, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
      if (!res.ok) return;
      const ticket = await res.json();
      if (!ticket || typeof ticket !== "object") throw new Error("Invalid chat response");
      const msgs: ChatMsg[] = (ticket.messages || []).map((m: any) => ({
        id: m.id, sender: m.sender, senderName: m.senderName,
        text: m.text || "", timestamp: m.timestamp, attachments: m.attachments,
      }));
      setMessages(msgs);
      setIsOnline(true);
      if (!silent && msgs.length > lastMsgCount && lastMsgCount > 0) {
        if (msgs.slice(lastMsgCount).some((m) => m.sender === "admin")) {
          setAdminTyping(true);
          setTimeout(() => setAdminTyping(false), 800);
        }
      }
      setLastMsgCount(msgs.length);
    } catch { setIsOnline(false); }
  }, [lastMsgCount]);

  useEffect(() => {
    if (step !== "chat" || !ticketId) return;
    pollMessages(ticketId, true);
    pollRef.current = setInterval(() => pollMessages(ticketId), 3500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [step, ticketId]);

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!visitorName.trim()) { setFormError("Please enter your name."); return; }
    if (!visitorEmail.trim() && !visitorPhone.trim()) { setFormError("Email or phone number is required."); return; }
    if (visitorEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitorEmail.trim())) { setFormError("Enter a valid email address."); return; }
    setFormLoading(true);
    try {
      const greeting = `Hi! I'm ${visitorName.trim()}. I'd like to connect with your team.`;
      const contactInfo = visitorEmail.trim() || `Phone: ${visitorPhone.trim()}`;
      const payload = {
        subject: `[Live Chat] New visitor — ${visitorName.trim()}`,
        category: "General Inquiry", priority: "Medium",
        description: greeting,
        clientName: visitorName.trim(),
        clientEmail: visitorEmail.trim(),
        clientPhone: visitorPhone.trim(),
        source: "public-chat",
      };
      let res: Response | null = null;
      let lastError = "Failed to start chat.";
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          res = await fetch("/api/tickets", { cache: "no-store", method: "POST", headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" }, body: JSON.stringify(payload) });
          if (res.ok) break;
          const data = await res.json().catch(() => ({}));
          lastError = typeof data?.error === "string" ? data.error : `Unable to start chat (${res.status}).`;
        } catch {
          lastError = "Unable to reach the chat service. Please check your connection and try again.";
        }
        if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 500));
      }
      if (!res?.ok) throw new Error(lastError);
      const ticket = await res.json().catch(() => null);
      if (!ticket?.id) throw new Error("The chat service returned an invalid session. Please try again.");
      if (!ticket || typeof ticket !== "object") throw new Error("Invalid chat response");
      const msgs: ChatMsg[] = (ticket.messages || []).map((m: any) => ({
        id: m.id, sender: m.sender, senderName: m.senderName,
        text: m.text || "", timestamp: m.timestamp, attachments: m.attachments,
      }));
      setMessages(msgs);
      setTicketId(ticket.id);
      saveSession(visitorName.trim(), visitorEmail.trim(), visitorPhone.trim(), ticket.id);
      setStep("chat");
    } catch (err: any) {
      setFormError(err.message || "Something went wrong. Please try again.");
    } finally { setFormLoading(false); }
  };

  const handleSend = async () => {
    if (!ticketId || ((!inputText.trim()) && pendingFiles.length === 0)) return;
    setSending(true);
    const textToSend = inputText.trim();
    setInputText("");
    try {
      await fetch(`/api/tickets/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSend, sender: "client", senderName: visitorName.trim(), attachments: pendingFiles }),
      });
      setPendingFiles([]);
      await pollMessages(ticketId, true);
    } catch { setIsOnline(false); }
    finally { setSending(false); inputRef.current?.focus(); }
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setUploading(true);
    for (const file of Array.from(fileList)) {
      if (file.size > 15 * 1024 * 1024) { alert(`"${file.name}" exceeds 15 MB.`); continue; }
      const fd = new FormData(); fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const d = await res.json().catch(() => ({}));
        if (res.ok && d.url) setPendingFiles(p => [...p, { url: d.url, name: file.name, type: file.type || "", size: file.size > 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB` }]);
      } catch { }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const clearSession = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { }
    setStep("form"); setTicketId(null); setMessages([]);
    setFormError(""); setMenuOpen(false);
  };

  if (!sessionLoaded) return (
    <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: "linear-gradient(160deg,#0c1a2e,#163354)" }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl">
          <img src="/logo.jpg" alt="NS Construction" className="w-full h-full object-cover" />
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-[#c8942a]" />
      </div>
    </div>
  );

  // ── PRE-CHAT: Clean, minimal form ───────────────────────────────────────────
  if (step === "form") {
    return (
      <div className="min-h-[100dvh] w-full relative overflow-hidden flex flex-col"
        style={{ background: "linear-gradient(160deg, #0a1628 0%, #0f2040 40%, #1a3560 70%, #0f2040 100%)" }}>

        {/* Top nav */}
        <div className="relative z-20 flex items-center justify-between px-5 pt-5 pb-2">
          <Link href="/"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest group">
            <Home className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider">Engineers Online</span>
          </div>
        </div>

        {/* Center: form card */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
          <div className="w-full max-w-md">

            {/* Logo and heading */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8"
            >
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-[#c8942a]/40">
                  <img src="/logo.jpg" alt="NS Construction" className="w-full h-full object-cover" />
                </div>
              </div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                Talk to our <span className="text-[#c8942a]">Engineering Team</span>
              </h1>
              <p className="text-white/50 text-sm mt-2">
                Get instant support for structural design, BOQ estimates, drawings, and civil engineering queries.
              </p>
            </motion.div>

            {/* Form card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 p-6"
            >
              <form onSubmit={handleStartChat} className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    Full Name <span className="text-[#c8942a]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={visitorName}
                    onChange={e => setVisitorName(e.target.value)}
                    placeholder="e.g. Arjun Mehta"
                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 bg-white/5 border border-white/10 focus:outline-none focus:border-[#c8942a]/50 transition-all"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={visitorEmail}
                    onChange={e => setVisitorEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 bg-white/5 border border-white/10 focus:outline-none focus:border-[#c8942a]/50 transition-all"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={visitorPhone}
                    onChange={e => setVisitorPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 bg-white/5 border border-white/10 focus:outline-none focus:border-[#c8942a]/50 transition-all"
                  />
                  <p className="text-white/25 text-[10px] font-medium pl-1">Enter email or phone — at least one required.</p>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {formError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      className="rounded-xl px-4 py-2.5 bg-red-500/10 border border-red-500/20">
                      <p className="text-red-400 text-xs font-semibold">{formError}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* CTA */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={formLoading}
                  className="w-full font-extrabold py-3.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg uppercase tracking-wider disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#c8942a,#dba83c)", color: "white" }}
                >
                  {formLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Connecting…</>
                  ) : (
                    <><MessageSquare className="h-4 w-4" /> Begin Chat <ArrowRight className="h-4 w-4" /></>
                  )}
                </motion.button>

                {/* Alt links */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link href="/dashboard"
                    className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 transition-all group text-[11px] font-bold bg-white/5 border border-white/10 text-white/50 hover:text-white">
                    <LogIn className="h-3.5 w-3.5 text-[#c8942a]" />
                    <span className="group-hover:text-white transition-colors">Client Portal</span>
                  </Link>
                  <Link href="/contact"
                    className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 transition-all group text-[11px] font-bold bg-white/5 border border-white/10 text-white/50 hover:text-white">
                    <HelpCircle className="h-3.5 w-3.5 text-[#c8942a]" />
                    <span className="group-hover:text-white transition-colors">Contact Us</span>
                  </Link>
                </div>
              </form>
            </motion.div>

            <p className="text-center text-white/20 text-[10px] font-medium mt-4 leading-relaxed">
              Your info is private. We never share it.{" "}
              <Link href="/privacy-policy" className="text-[#c8942a]/60 hover:text-[#c8942a] underline transition-colors">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── CHAT WINDOW ──────────────────────────────────────────────────────────────
  const grouped = groupByDate(messages);

  return (
    <div className="h-[100dvh] w-screen flex flex-col overflow-hidden" style={{ background: "#eef2f8" }}>
      {/* Top bar */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-3 shadow-lg flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#0a1628 0%,#163354 100%)", paddingTop: "max(0.75rem,env(safe-area-inset-top))" }}>
        <Link href="/" className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all group">
          <Home className="h-4 w-4 text-white/60 group-hover:text-[#c8942a] transition-colors" />
        </Link>

        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-[#c8942a]/40 shadow">
            <img src="/logo.jpg" alt="NS Construction" className="w-full h-full object-cover" />
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a1628] ${isOnline ? "bg-emerald-400" : "bg-slate-400"}`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-extrabold text-sm leading-tight tracking-wide">CIVIL AT HAND</p>
          <p className={`text-[11px] font-semibold ${isOnline ? "text-emerald-400" : "text-slate-400"}`}>
            {adminTyping ? "Engineer is typing…" : isOnline ? "Engineering Support · Online" : "Reconnecting…"}
          </p>
        </div>

        <button onClick={() => ticketId && pollMessages(ticketId, true)}
          className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/60 hover:text-[#c8942a] transition-all cursor-pointer">
          <RefreshCw className="h-4 w-4" />
        </button>

        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen(o => !o)}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer">
            <MoreVertical className="h-4 w-4" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 min-w-[180px] rounded-2xl shadow-2xl overflow-hidden z-50 border border-white/10"
                style={{ background: "linear-gradient(135deg,#0a1628,#163354)" }}
              >
                <div className="p-1">
                  {[
                    { icon: Home, label: "Go to Home", href: "/" },
                    { icon: LogIn, label: "Client Portal", href: "/dashboard" },
                    { icon: HelpCircle, label: "Contact Us", href: "/contact" },
                  ].map(({ icon: Icon, label, href }) => (
                    <Link key={label} href={href} onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all font-medium">
                      <Icon className="h-4 w-4 text-[#c8942a]" />
                      {label}
                    </Link>
                  ))}
                  <div className="h-px bg-white/10 my-1 mx-2" />
                  <button onClick={clearSession}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all font-medium cursor-pointer">
                    <RefreshCw className="h-4 w-4 text-[#c8942a]" />
                    Start New Chat
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 relative z-0 scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}
              className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-[#c8942a]/20">
              <img src="/logo.jpg" alt="NS Construction" className="w-full h-full object-cover" />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl px-6 py-4 shadow border border-slate-100 max-w-xs">
              <p className="font-extrabold text-[#0c1a2e] text-sm tracking-wide uppercase">NS Construction Support</p>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                Hello {visitorName.split(" ")[0]}! 👋 Our engineering team has received your request and will reply shortly — usually within 2 hours.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="flex items-center gap-2 bg-white/70 border border-slate-200 rounded-full px-4 py-1.5 shadow-sm">
              <Shield className="h-3 w-3 text-[#c8942a]" />
              <span className="text-slate-400 text-[10px] font-semibold">Messages are private between you and our team</span>
            </motion.div>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full px-4 py-1.5 shadow-sm">
                <Shield className="h-3 w-3 text-[#c8942a] flex-shrink-0" />
                <span className="text-slate-500 text-[10px] font-semibold">Private conversation with NS Construction Engineering</span>
              </div>
            </div>
            {grouped.map(group => (
              <div key={group.date}>
                <div className="flex items-center justify-center my-4">
                  <div className="flex items-center gap-2">
                    <div className="h-px w-12 bg-slate-300/50" />
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider px-2">{group.date}</span>
                    <div className="h-px w-12 bg-slate-300/50" />
                  </div>
                </div>
                {group.msgs.map((msg, i) => {
                  const isMe = msg.sender === "client";
                  const nextMsg = group.msgs[i + 1];
                  const showAvatar = !isMe && msg.sender === "admin" && (!nextMsg || nextMsg.sender !== "admin");
                  return <Bubble key={msg.id} msg={msg} isMe={isMe} showAvatar={showAvatar} />;
                })}
              </div>
            ))}
            {adminTyping && <TypingDots />}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Pending attachments */}
      {pendingFiles.length > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-slate-200 flex-shrink-0 bg-white/80 backdrop-blur-sm">
          {pendingFiles.map((a, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 max-w-[180px]">
              {(a.type || "").startsWith("image/") ? <ImageIcon className="h-3.5 w-3.5 text-[#c8942a] flex-shrink-0" /> : <FileText className="h-3.5 w-3.5 text-[#c8942a] flex-shrink-0" />}
              <span className="text-[11px] text-[#0c1a2e] font-semibold truncate">{a.name}</span>
              <button onClick={() => setPendingFiles(p => p.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500 cursor-pointer flex-shrink-0">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="px-3 py-3 flex items-end gap-2 flex-shrink-0 border-t border-slate-200 bg-white/90 backdrop-blur-sm"
        style={{ paddingBottom: "max(0.75rem,env(safe-area-inset-bottom))" }}>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-10 h-10 rounded-xl flex-shrink-0 bg-slate-100 hover:bg-[#c8942a]/10 border border-slate-200 hover:border-[#c8942a]/30 flex items-center justify-center text-slate-400 hover:text-[#c8942a] transition-all cursor-pointer disabled:opacity-50">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
        </button>

        <div className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 flex items-end gap-2 min-h-[44px] shadow-sm focus-within:border-[#c8942a]/50 transition-colors">
          <textarea ref={inputRef} rows={1} value={inputText}
            onChange={e => {
              setInputText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type your message…"
            className="flex-1 bg-transparent text-[14px] text-[#0c1a2e] placeholder-slate-300 focus:outline-none resize-none leading-[20px] max-h-[120px] overflow-y-auto"
            style={{ height: "auto", minHeight: "20px" }} />
        </div>

        <button onClick={handleSend}
          disabled={sending || uploading || (!inputText.trim() && pendingFiles.length === 0)}
          className="w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center transition-all cursor-pointer disabled:cursor-not-allowed shadow-md disabled:shadow-none"
          style={sending || uploading || (!inputText.trim() && pendingFiles.length === 0)
            ? { background: "#f1f5f9", color: "#94a3b8" }
            : { background: "linear-gradient(135deg,#c8942a,#dba83c)", color: "white" }}>
          {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
