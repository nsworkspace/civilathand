"use client";

// ============================================================
// PRIVATE CONTROL ROOM — for personal use only.
// PLACE AT: src/app/private/page.tsx
//
// 🔑 Password check now happens on the server (src/app/api/private/login),
//    checked against the server-only PRIVATE_PAGE_PASSWORD env var.
//    It is never sent to the browser, unlike the old NEXT_PUBLIC_ version.
// 📝 Notes/links are stored in MongoDB (private_notes collection) via
//    src/app/api/private/notes — every request re-checks your session
//    server-side, so this data can't be read or written without a valid,
//    signed session cookie, even by someone calling the API directly.
// ============================================================

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  UserPlus,
  FileText,
  LayoutDashboard,
  Link as LinkIcon,
  StickyNote,
  Loader,
} from "lucide-react";
import { SITE } from "@/data/site";

const UNLISTED_PAGES = [
  {
    title: "Team Onboarding",
    desc: "/team-onboarding — internal employee registration",
    href: "/team-onboarding",
    icon: UserPlus,
  },
];

const COPY_MESSAGES = [
  {
    id: "onboarding",
    title: "👤 Team Onboarding Invitation",
    text: `Please register here as a new candidate for Civil At Hand and save your details in the database.\n\n🔗 ${SITE.url}/team-onboarding\n\nWe welcome you to our team!`,
  },
  {
    id: "whatsapp",
    title: "💬 All India WhatsApp Groups",
    text: `🚀 Join Our All India WhatsApp Groups 🇮🇳\n\nChoose the group that matches your profession or business:\n\n🏗️ Contractors Group\n🔗 https://chat.whatsapp.com/JNTwVCotgUG8NjT6n92ysR\n\n👷 Civil Engineering Network\n🔗 https://chat.whatsapp.com/LaauRGhjObn5RsGBkluVxJ\n\n👥 HR Professionals Network\n🔗 https://chat.whatsapp.com/K6LRe6HkBzB5tQOAkGJY92\n\n📦 Suppliers Network\n🔗 https://chat.whatsapp.com/DQIWPqDuwiy2AB8QkVity8\n\n✅ Join the group that fits you and grow your network across India.\nFeel free to share this with others!`,
  },
];

const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const Trash2Icon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

function HiddenPageCard({ title, desc, href, icon: Icon }: { title: string; desc: string; href: string; icon: React.ComponentType<{ className?: string }> }) {
  const [copied, setCopied] = useState(false);
  const fullUrl = href.startsWith("http") ? href : `${SITE.url}${href}`;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }, [fullUrl]);

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-orange-500/30">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="truncate text-xs text-slate-500">{desc}</p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1.5">
        <button type="button" onClick={handleCopyLink} title="Copy link"
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all cursor-pointer ${copied ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-slate-300 hover:bg-orange-500 hover:text-white"}`}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <Link href={href} target="_blank" title="Open page"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition-all hover:bg-white hover:text-navy-950 cursor-pointer">
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function CopyMessageBlock({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }, [text]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-orange-500/30">
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-white">{title}</p>
        <button type="button" onClick={handleCopy}
          className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-all cursor-pointer ${copied ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-slate-300 hover:bg-orange-500 hover:text-white"}`}>
          {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
        </button>
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">{text}</p>
    </div>
  );
}

function Section({ icon: Icon, title, subtitle, children }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.015] p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-white">{title}</h2>
          {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

interface PrivateNote {
  id: string;
  type: "note" | "link";
  label: string;
  content: string;
  createdAt: string;
}

function NotesPad({ onSessionExpired }: { onSessionExpired: () => void }) {
  const [entries, setEntries] = useState<PrivateNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<"note" | "link">("note");
  const [label, setLabel] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/private/notes");
      if (res.status === 401) {
        onSessionExpired();
        return;
      }
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch {
      setError("Couldn't load your notes. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [onSessionExpired]);

  useEffect(() => {
    load();
  }, [load]);

  const addEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !content.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/private/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, label: label.trim(), content: content.trim() }),
      });
      if (res.status === 401) {
        onSessionExpired();
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save.");
      setEntries((prev) => [data, ...prev]);
      setLabel("");
      setContent("");
      setType("note");
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const removeEntry = async (id: string) => {
    const prev = entries;
    setEntries((cur) => cur.filter((e) => e.id !== id));
    try {
      const res = await fetch(`/api/private/notes/${id}`, { method: "DELETE" });
      if (res.status === 401) {
        onSessionExpired();
        return;
      }
      if (!res.ok) throw new Error();
    } catch {
      setEntries(prev); // roll back on failure
      setError("Couldn't delete that entry — please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-slate-500 text-sm">
        <Loader className="h-4 w-4 animate-spin" /> Loading your notes...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed border-white/15 px-4 py-6 text-center">
          <p className="text-xs text-slate-500">Nothing saved yet. Add any note or link you want handy here.</p>
        </div>
      )}

      {entries.map((entry) => (
        <div key={entry.id} className="group flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-orange-500/30">
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${entry.type === "link" ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"}`}>
            {entry.type === "link" ? <LinkIcon className="h-4.5 w-4.5" /> : <StickyNote className="h-4.5 w-4.5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{entry.label}</p>
            {entry.type === "link" ? (
              <a href={entry.content} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-blue-400 hover:underline">
                {entry.content}
              </a>
            ) : (
              <p className="whitespace-pre-line text-xs text-slate-400">{entry.content}</p>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-1.5">
            {entry.type === "link" && (
              <a href={entry.content} target="_blank" rel="noopener noreferrer" title="Open link"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition-all hover:bg-white hover:text-navy-950 cursor-pointer">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <button type="button" onClick={() => removeEntry(entry.id)} title="Delete"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-slate-400 transition-all hover:bg-red-500/15 hover:text-red-400 cursor-pointer">
              <Trash2Icon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}

      {showForm ? (
        <form onSubmit={addEntry} className="space-y-3 rounded-xl border border-orange-500/20 bg-orange-500/[0.04] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400">New Entry</p>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
              ✕
            </button>
          </div>

          <div className="flex p-1 rounded-lg bg-white/5 border border-white/10">
            {(["note", "link"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition ${type === t ? "bg-orange-500 text-white" : "text-slate-400"}`}>
                {t === "note" ? "Text note" : "Link"}
              </button>
            ))}
          </div>

          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label / title" required autoFocus maxLength={200}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-orange-500/60 focus:outline-none" />

          {type === "link" ? (
            <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="https://..." required maxLength={2000}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-orange-500/60 focus:outline-none" />
          ) : (
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write anything..." required rows={4} maxLength={5000}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-orange-500/60 focus:outline-none resize-none" />
          )}

          <button type="submit" disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-orange-600 cursor-pointer disabled:opacity-60">
            {saving ? <Loader className="h-4 w-4 animate-spin" /> : <PlusIcon className="h-4 w-4" />}
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
      ) : (
        <button type="button" onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 transition-colors hover:border-orange-500/40 hover:text-orange-400 cursor-pointer">
          <PlusIcon className="h-4 w-4" /> Add Note or Link
        </button>
      )}
    </div>
  );
}

function KeyGate({ onUnlock }: { onUnlock: () => void }) {
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/private/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Incorrect verification key. Please try again.");
        return;
      }
      onUnlock();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a192f] px-4">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-orange-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 shadow-[0_0_40px_rgba(249,115,22,0.3)]">
            <Lock className="h-9 w-9 text-white" />
          </div>
        </div>

        <div className="mb-8 text-center">
          <h1 className="mb-1 font-display text-2xl font-extrabold uppercase tracking-tight text-white">
            Private <span className="text-orange-500">Access</span>
          </h1>
          <p className="text-xs font-medium text-slate-500">Enter your verification key to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <div className="flex items-start gap-2.5 overflow-hidden rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400 mt-0.5" />
              <span className="text-xs font-semibold text-red-400">{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="private-key" className="block text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
              Verification Key
            </label>
            <div className="relative">
              <input id="private-key" type={showKey ? "text" : "password"} required autoFocus value={key}
                onChange={(e) => { setKey(e.target.value); setError(""); }}
                placeholder="Enter key"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-11 text-sm font-medium text-white placeholder:text-slate-600 transition-all focus:border-orange-500/60 focus:bg-white/8 focus:outline-none" />
              <button type="button" onClick={() => setShowKey((v) => !v)} tabIndex={-1} aria-label={showKey ? "Hide key" : "Show key"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300">
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-[0_0_20px_rgba(249,115,22,0.25)] transition-all hover:bg-orange-600 hover:shadow-[0_0_30px_rgba(249,115,22,0.35)] cursor-pointer disabled:opacity-60">
            {loading ? <Loader className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {loading ? "Checking..." : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}

function PrivateDashboard({ onLock }: { onLock: () => void }) {
  const handleLock = async () => {
    try {
      await fetch("/api/private/logout", { method: "POST" });
    } finally {
      onLock();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a192f] pb-20">
      <div className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#0a192f]/90 px-6 py-5 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
              <ShieldCheck className="h-4.5 w-4.5 text-orange-400" />
            </div>
            <div>
              <p className="font-display text-sm font-extrabold uppercase tracking-tight text-white">
                Private <span className="text-orange-500">Control Room</span>
              </p>
              <p className="text-[10px] font-medium text-slate-500">Not public · session-protected</p>
            </div>
          </div>
          <button onClick={handleLock}
            className="rounded-lg bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-300 transition-colors hover:bg-white/10 cursor-pointer">
            Lock
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-center">
            <p className="font-display text-2xl font-extrabold text-white">{UNLISTED_PAGES.length}</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Unlisted Pages</p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-center">
            <p className="font-display text-2xl font-extrabold text-white">{COPY_MESSAGES.length}</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Ready‑to‑Copy Messages</p>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-center">
            <p className="font-display text-2xl font-extrabold text-white">DB</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Notes Stored In</p>
          </div>
        </div>

        <div className="space-y-6">
          <Section icon={StickyNote} title="My Notes & Links" subtitle="Write anything, save any link — stored in your database, only visible here">
            <NotesPad onSessionExpired={handleLock} />
          </Section>

          <Section icon={LayoutDashboard} title="Unlisted Pages" subtitle="Quick access to internal forms">
            <div className="space-y-3">
              {UNLISTED_PAGES.map((p) => <HiddenPageCard key={p.href} {...p} />)}
            </div>
          </Section>

          <Section icon={FileText} title="Ready‑to‑Copy Messages" subtitle="Professional invitations and group links">
            <div className="space-y-4">
              {COPY_MESSAGES.map((m) => <CopyMessageBlock key={m.id} title={m.title} text={m.text} />)}
            </div>
          </Section>
        </div>

        <p className="pt-8 text-center text-[11px] leading-relaxed text-slate-600">
          This page has no public link and is excluded from the sitemap. Access requires a server-verified key, and your notes are only ever readable through a valid session.
        </p>
      </div>
    </div>
  );
}

export default function PrivatePage() {
  const [unlocked, setUnlocked] = useState(false);

  return unlocked ? (
    <PrivateDashboard onLock={() => setUnlocked(false)} />
  ) : (
    <KeyGate onUnlock={() => setUnlocked(true)} />
  );
}
