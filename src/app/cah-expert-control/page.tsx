"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminView } from "@/components/AdminView";
import { useProjects, SupportTicket } from "@/context/ProjectContext";
// ★ REMOVED static import – we no longer need it here because AdminView now handles it
import {
  Lock,
  AlertCircle,
  Loader2,
  LogOut,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  BarChart3,
  Users,
  FolderKanban,
  ChevronRight,
  Activity,
  WifiOff,
  KeyRound,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────
// Static brand logo — shown in the top-left of the admin header
// ─────────────────────────────────────────────────────────────────────

function AdminProfileButton() {

  // Static brand logo — no click interaction
  return (
    <div
      className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex-shrink-0 overflow-hidden shadow-[0_0_12px_rgba(249,115,22,0.35)]"
      aria-label="NS Construction"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.jpg" alt="NS Construction" className="w-full h-full object-cover" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────
function useLiveClock(format: "time" | "full" = "time") {
  const [value, setValue] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      if (format === "time") {
        setValue(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
      } else {
        setValue(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }));
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [format]);

  return value;
}

// ─────────────────────────────────────────────────────────────────────
// Login Screen
// ─────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [online, setOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
  const time = useLiveClock("time");

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const handleKeyEvent = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === "function") {
      setCapsLockOn(e.getModifierState("CapsLock"));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.success) {
        setAttempts(0);
        onLogin();
      } else {
        setAttempts((a) => a + 1);
        setError(data?.error || "Invalid credentials. Access denied.");
      }
    } catch {
      setError("Unable to reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const isLocked = attempts >= 5;

  return (
    <div className="min-h-screen bg-[#0a192f] flex flex-col relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow blobs */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${online ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`} />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Secure Zone</span>
        </div>
        <div className="flex items-center gap-4">
          {!online && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 uppercase tracking-wider">
              <WifiOff className="h-3 w-3" /> Offline
            </span>
          )}
          <span className="text-[10px] font-mono text-slate-600">{time} IST</span>
          <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full">
            <Shield className="h-3 w-3 text-orange-400" />
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">NS Construction</span>
          </div>
        </div>
      </div>

      {/* Center login card */}
      <div className="flex-grow flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          {/* Lock icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.3)]">
                <Lock className="h-9 w-9 text-white" />
              </div>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center ring-4 ring-[#0a192f]">
                <span className="w-2 h-2 bg-white rounded-full" />
              </span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold text-white tracking-tight uppercase font-display mb-1">
              Admin <span className="text-orange-500">Control</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Restricted access · Authorised personnel only
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-start gap-2.5 overflow-hidden"
                >
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-red-400 font-semibold">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {capsLockOn && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 flex items-center gap-2.5">
                <KeyRound className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                <span className="text-[11px] text-amber-400 font-semibold">Caps Lock is on</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="admin-username" className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]">
                Username
              </label>
              <input
                id="admin-username"
                type="text"
                required
                autoComplete="username"
                autoFocus
                disabled={isLocked}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                placeholder="Enter admin username"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-medium placeholder:text-slate-600 focus:outline-none focus:border-orange-500/60 focus:bg-white/8 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  disabled={isLocked}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  onKeyUp={handleKeyEvent}
                  onKeyDown={handleKeyEvent}
                  placeholder="••••••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm text-white font-medium placeholder:text-slate-600 focus:outline-none focus:border-orange-500/60 focus:bg-white/8 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full mt-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.25)] hover:shadow-[0_0_30px_rgba(249,115,22,0.35)]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
                </>
              ) : isLocked ? (
                <>
                  <Lock className="h-4 w-4" /> Locked · Refresh to Retry
                </>
              ) : (
                <>
                  <ChevronRight className="h-4 w-4" /> Unlock Dashboard
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-[10px] text-slate-700 font-medium mt-8">
            All access attempts are logged and monitored.
          </p>
        </motion.div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 px-6 py-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-slate-700 font-mono">CAH-CTRL v2.1</span>
        <span className="text-[10px] text-slate-700">© {new Date().getFullYear()} NS Construction</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Admin Shell (authenticated layout)
// ─────────────────────────────────────────────────────────────────────
function AdminShell({ onLogout }: { onLogout: () => void }) {
  const { leads, projects, tickets } = useProjects();
  const [loggingOut, setLoggingOut] = useState(false);
  const time = useLiveClock("full");
  const [date, setDate] = useState("");

  useEffect(() => {
    const tick = () => {
      setDate(
        new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
      );
    };
    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let expiryTimer: ReturnType<typeof setTimeout> | null = null;

    const signOutExpiredSession = async () => {
      try {
        await fetch("/api/admin/logout", { method: "POST", cache: "no-store" });
      } catch {
        // The server token is already expired; UI still returns to login.
      } finally {
        onLogout();
      }
    };

    const checkSession = async () => {
      try {
        const response = await fetch("/api/admin/session", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        const session = await response.json().catch(() => ({}));
        if (!response.ok || !session?.authenticated) {
          await signOutExpiredSession();
          return;
        }

        if (typeof session.expiresAt === "number") {
          const remaining = session.expiresAt - Date.now();
          if (remaining <= 0) {
            await signOutExpiredSession();
            return;
          }
          if (expiryTimer) clearTimeout(expiryTimer);
          expiryTimer = setTimeout(signOutExpiredSession, remaining + 250);
        }
      } catch {
        // A transient network failure must not log out a valid admin.
        // The next poll will re-check the authoritative server session.
      }
    };

    void checkSession();
    const poll = setInterval(checkSession, 30_000);

    return () => {
      clearInterval(poll);
      if (expiryTimer) clearTimeout(expiryTimer);
    };
  }, [onLogout]);

  const totalLeads = leads.length;
  const activeProjects = projects.filter((p) => p.status !== "Completed").length;
  const openTickets = (tickets || []).filter(
    (t: SupportTicket) => t.status === "Open" || t.status === "In Progress"
  ).length;
  const newLeads = leads.filter((l) => l.status === "new").length;

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // Non-fatal — clear the client session regardless of network state.
    } finally {
      setLoggingOut(false);
      onLogout();
    }
  };

  return (
    <>
      <style jsx global>{`
        body.cah-admin-soft-fullscreen [data-admin-header="true"],
        body.cah-admin-soft-fullscreen [data-admin-security-strip="true"],
        body.cah-admin-soft-fullscreen [data-admin-footer="true"] { display: none !important; }
        body.cah-admin-soft-fullscreen [data-admin-page-main="true"] { padding-top: 0 !important; padding-bottom: 0 !important; }
        body.cah-admin-soft-fullscreen [data-admin-page-wrap="true"] { max-width: none !important; }
      `}</style>
      <div className="min-h-screen bg-[#0a192f] flex flex-col">
      {/* ── Top Navigation Bar ──────────────────────────────────── */}
      <header data-admin-header="true" className="sticky top-0 z-50 bg-[#0a192f]/95 backdrop-blur-md border-b border-white/[0.06] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Brand */}
          <div className="flex items-center gap-2.5">
            <AdminProfileButton />
            <div className="block leading-tight">
              <div className="text-white font-display font-extrabold text-sm tracking-tight">
                CIVIL <span className="text-orange-500">AT HAND</span>
              </div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Admin Panel</div>
            </div>
          </div>

          {/* Center: Live stats pills */}
          <div className="hidden md:flex items-center gap-2">
            <StatPill icon={Users} label="Leads" value={totalLeads} accent={newLeads > 0} title={`${newLeads} new lead${newLeads === 1 ? "" : "s"}`} />
            <StatPill icon={FolderKanban} label="Active" value={activeProjects} title="Active projects in progress" />
            <StatPill icon={BarChart3} label="Tickets" value={openTickets} accent={openTickets > 0} title="Open support tickets" />
          </div>

          {/* Right: Time + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-bold text-white font-mono">{time}</span>
              <span className="text-[10px] text-slate-600 font-medium">{date}</span>
            </div>
            <div className="w-px h-8 bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-1.5" title="Live session">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 hidden sm:block">Live</span>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-60 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all"
            >
              {loggingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{loggingOut ? "Signing Out" : "Logout"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Security Badge Strip ─────────────────────────────────── */}
      <div data-admin-security-strip="true" className="bg-orange-500/[0.06] border-b border-orange-500/10 px-6 py-2 flex items-center gap-2">
        <Activity className="h-3 w-3 text-orange-500" />
        <span className="text-[10px] font-bold text-orange-500/80 uppercase tracking-[0.25em]">
          Restricted Area · Authorised Access Only · All Actions Logged
        </span>
      </div>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main data-admin-page-main="true" className="flex-grow px-4 sm:px-6 lg:px-8 py-8">
        <div data-admin-page-wrap="true" className="mx-auto max-w-[1400px]">
          {/* Page title row */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-xl font-extrabold text-white font-display uppercase tracking-tight flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-orange-500" />
                Control <span className="text-orange-500">Center</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage leads, projects, billing, content and more — all in one place
              </p>
            </div>
            {/* Mobile stats row */}
            <div className="flex md:hidden items-center gap-2 flex-shrink-0">
              <StatPill icon={Users} label="" value={totalLeads} accent={newLeads > 0} />
              <StatPill icon={FolderKanban} label="" value={activeProjects} />
            </div>
          </div>

          {/* Admin panels - now AdminView handles all tabs including vendors */}
          <div className="bg-[#0f2244] border border-white/[0.07] rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.5)]">
            <AdminView />
          </div>

          {/* ★ REMOVED – no longer hardcoded */}
        </div>
      </main>

      {/* ── Footer bar ───────────────────────────────────────────── */}
      <footer data-admin-footer="true" className="px-6 py-3 border-t border-white/[0.05] flex items-center justify-between">
        <span className="text-[10px] text-slate-700 font-mono">CAH-CTRL v2.1 · Secure Session Active</span>
        <span className="text-[10px] text-slate-700">© {new Date().getFullYear()} NS Construction</span>
      </footer>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Stat Pill
// ─────────────────────────────────────────────────────────────────────
function StatPill({
  icon: Icon,
  label,
  value,
  accent,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent?: boolean;
  title?: string;
}) {
  return (
    <div
      title={title}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-colors ${
        accent ? "bg-orange-500/10 border-orange-500/30 text-orange-400" : "bg-white/5 border-white/10 text-slate-400"
      }`}
    >
      <Icon className="h-3 w-3" />
      {label && <span>{label}</span>}
      <span className={accent ? "text-orange-300" : "text-white"}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Main Page — session gate
// ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [status, setStatus] = useState<"checking" | "login" | "admin">("checking");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setStatus(d?.authenticated ? "admin" : "login");
      })
      .catch(() => {
        if (!cancelled) setStatus("login");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-[#0a192f] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        </div>
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">Verifying Session…</p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {status === "login" ? (
        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LoginScreen onLogin={() => setStatus("admin")} />
        </motion.div>
      ) : (
        <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <AdminShell onLogout={() => setStatus("login")} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
