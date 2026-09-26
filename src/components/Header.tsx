"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useProjects } from "@/context/ProjectContext";
import UserAvatar from "@/components/UserAvatar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Menu,
  X,
  Check,
  CheckCheck,
  Info,
  AlertTriangle,
  AlertOctagon,
  BellOff,
  ArrowRight,
  Calculator,
  BriefcaseBusiness,
  GraduationCap,
  BookOpen,
  HelpCircle,
  BadgeDollarSign,
  Users,
  Layers3,
  Newspaper, Globe2,
} from "lucide-react";

const NOTIF_STYLES: Record<string, {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  accent: string;
  chipBg: string;
  chipText: string;
  ring: string;
}> = {
  success: { icon: Check, iconColor: "text-emerald-600", iconBg: "bg-emerald-100", accent: "bg-emerald-500", chipBg: "bg-emerald-50", chipText: "text-emerald-700", ring: "ring-emerald-100" },
  warning: { icon: AlertTriangle, iconColor: "text-amber-600", iconBg: "bg-amber-100", accent: "bg-amber-500", chipBg: "bg-amber-50", chipText: "text-amber-700", ring: "ring-amber-100" },
  danger: { icon: AlertOctagon, iconColor: "text-rose-600", iconBg: "bg-rose-100", accent: "bg-rose-500", chipBg: "bg-rose-50", chipText: "text-rose-700", ring: "ring-rose-100" },
  info: { icon: Info, iconColor: "text-sky-600", iconBg: "bg-sky-100", accent: "bg-sky-500", chipBg: "bg-sky-50", chipText: "text-sky-700", ring: "ring-sky-100" },
};

const getNotifStyle = (type?: string) => NOTIF_STYLES[type || "info"] || NOTIF_STYLES.info;
const URL_REGEX = /((?:https?:\/\/|www\.)[^\s]+)/gi;

function renderMessageWithLinks(text: string) {
  return text.split(URL_REGEX).map((part, index) => {
    if (!part) return null;
    if (URL_REGEX.test(part)) {
      URL_REGEX.lastIndex = 0;
      const href = part.startsWith("http") ? part : `https://${part}`;
      return <a key={index} href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-orange-600 underline underline-offset-2 break-all">{part}</a>;
    }
    URL_REGEX.lastIndex = 0;
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

type HeaderNavLink = { name: string; href: string; icon: React.ElementType; help: string; external?: boolean };

const ICONS: Record<string, React.ElementType> = { BriefcaseBusiness, Layers3, Calculator, GraduationCap, Newspaper, Globe2, Users };

export const Header: React.FC = () => {
  const hiddenPublicPrefixes = ["/services", "/vendors", "/vendor-register", "/ai-insights", "/sectors", "/technology", "/pricing", "/project-planner", "/proposals", "/projects"];
  const pathname = usePathname() || "/";
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const { notifications, markNotificationsAsRead } = useProjects();
  const [navLinks, setNavLinks] = useState<HeaderNavLink[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/site/navigation", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !Array.isArray(data?.items)) return;
        const next = data.items.filter((item: any) => item && item.visible !== false && item.label && item.href && !hiddenPublicPrefixes.some((prefix) => String(item.href) === prefix || String(item.href).startsWith(`${prefix}/`))).map((item: any) => ({
          name: String(item.label), href: String(item.href), help: String(item.help || ""), icon: ICONS[item.icon] || Globe2, external: !!item.external,
        }));
        setNavLinks(next);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const checkUser = () => {
      try {
        const raw = localStorage.getItem("cah_user");
        setUser(raw ? JSON.parse(raw) : null);
      } catch {
        setUser(null);
      }
    };
    checkUser();
    window.addEventListener("storage", checkUser);
    return () => window.removeEventListener("storage", checkUser);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    try { await signOut(auth); } catch (error) { console.error("Firebase sign-out failed:", error); }
    localStorage.removeItem("cah_user");
    sessionStorage.removeItem("cah_payment_access_token");
    setUser(null);
    window.location.href = "/auth";
  };

  const isAdminView = pathname.startsWith("/cah-expert-control");
  const isDashboardView = pathname.startsWith("/dashboard");
  const viewNotifs = notifications.filter((n) => {
    if (isAdminView) return n.isAdmin === true;
    if (n.isAdmin) return false;
    if (user?.email) return n.userEmail?.toLowerCase() === user.email.toLowerCase() || n.userEmail === "all";
    return n.userEmail === "all";
  });
  const currentNotifs = viewNotifs.slice(0, 6);
  const unreadCount = viewNotifs.filter((n) => !n.read).length;

  const renderNotifList = () => {
    if (currentNotifs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100"><BellOff className="h-5 w-5 text-slate-400" /></div>
          <p className="text-xs font-bold text-navy-950">You&apos;re all caught up</p>
          <p className="text-[11px] text-navy-600">No new notifications right now.</p>
        </div>
      );
    }
    return currentNotifs.map((notif) => {
      const style = getNotifStyle((notif as any).type);
      const Icon = style.icon;
      return (
        <div key={notif.id} className={`relative flex items-start gap-3 rounded-xl p-3 pl-4 ${!notif.read ? style.chipBg : ""}`}>
          <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${style.accent}`} />
          <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${style.iconBg} ring-4 ${style.ring}`}><Icon className={`h-4 w-4 ${style.iconColor}`} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2"><p className="text-xs font-bold text-navy-950 leading-snug">{notif.title}</p>{!notif.read && <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase ${style.chipBg} ${style.chipText}`}>New</span>}</div>
            <p className="mt-0.5 text-[11px] text-navy-600 leading-relaxed break-words">{renderMessageWithLinks(notif.message)}</p>
            <span className="mt-1.5 block text-[9px] font-semibold uppercase text-slate-400">{notif.timestamp}</span>
          </div>
        </div>
      );
    });
  };

  const headerTheme = "bg-white text-wix-dark border-slate-200 shadow-[0_8px_30px_rgba(12,26,46,0.08)]";

  return (
    <header
      className={`sticky inset-x-0 top-0 z-[80] isolate border-b transition-[height,box-shadow,border-color] duration-200 ease-out ${headerTheme}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between gap-4 transition-[min-height] duration-300 ${scrolled ? "min-h-14" : "min-h-16 lg:min-h-[68px]"}`}>
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="NS Construction home">
            <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm transition-[width,height] duration-300 ${scrolled ? "h-9 w-9" : "h-10 w-10 lg:h-11 lg:w-11"}`}><img src="/logo.jpg" alt="NS Construction logo" className="h-full w-full object-cover" /></span>
            <span className="min-w-0">
              <span className={`block truncate font-display font-extrabold tracking-tight transition-[font-size] duration-300 ${scrolled ? "text-base" : "text-lg"} text-wix-dark`}>CIVIL <span className="text-orange-500">AT HAND</span></span>
              <span className={`block text-[10px] font-semibold tracking-wide text-slate-500 transition-opacity duration-300 ${scrolled ? "hidden lg:block" : "block"}`}>Engineering made simpler</span>
            </span>
          </Link>

          <nav aria-label="Primary" className={`hidden lg:flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-0.5 transition-transform duration-200 ${scrolled ? "scale-[0.97]" : "scale-100"}`}>
            {navLinks.map((link) => {
              const active = !link.external && (pathname === link.href || pathname.startsWith(`${link.href}/`));
              const className = `rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${active ? "bg-white text-wix-dark shadow-sm" : "text-slate-700 hover:bg-white hover:text-wix-dark"}`;
              return link.external ? <a key={`${link.href}-${link.name}`} href={link.href} target="_blank" rel="noopener noreferrer" title={link.help} className={className}>{link.name}</a> : <Link key={`${link.href}-${link.name}`} href={link.href} title={link.help} className={className}>{link.name}</Link>;
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <Link href="/project-planner" className="rounded-full px-4 py-2.5 text-xs font-bold border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100">Start a project</Link>
            {user ? (
              <>
                <Link href="/dashboard" className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold ${isDashboardView ? "bg-orange-500 text-white" : "bg-wix-dark text-white hover:bg-navy-800"}`}><UserAvatar name={user?.name} profileImageId={user?.profileImageId} profileImageUrl={user?.profileImageUrl} size="xs" /> My workspace</Link>
                <button type="button" onClick={handleLogout} className="rounded-full px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">Log out</button>
              </>
            ) : (
              <Link href="/auth?mode=signin" className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-orange-600">Get started <ArrowRight className="h-4 w-4" /></Link>
            )}
            <div className="relative">
              <button type="button" aria-label="Notifications" aria-expanded={notifDropdownOpen} onClick={() => { setNotifDropdownOpen((open) => !open); if (!notifDropdownOpen && unreadCount) markNotificationsAsRead(isAdminView, isAdminView ? undefined : user?.email); }} className="relative rounded-full p-2.5 text-wix-dark hover:bg-slate-100">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[8px] font-extrabold text-white ring-2 ring-white">{unreadCount}</span>}
              </button>
              <AnimatePresence>
                {notifDropdownOpen && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute right-0 mt-3 w-96 max-w-[90vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    <div className="flex items-center justify-between bg-navy-950 px-4 py-3.5 text-white"><span className="font-display text-sm font-bold">Notifications</span>{unreadCount > 0 && <button type="button" onClick={() => markNotificationsAsRead(isAdminView, isAdminView ? undefined : user?.email)} className="inline-flex items-center gap-1 text-[10px] font-bold text-white/75 hover:text-white"><CheckCheck className="h-3.5 w-3.5" /> Mark read</button>}</div>
                    <div className="max-h-80 space-y-1 overflow-y-auto p-2">{renderNotifList()}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-1 lg:hidden">
            <button type="button" aria-label="Notifications" onClick={() => { setNotifDropdownOpen(true); if (unreadCount) markNotificationsAsRead(isAdminView, isAdminView ? undefined : user?.email); }} className="relative rounded-full p-2.5 text-wix-dark">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[8px] font-extrabold text-white ring-2 ring-white">{unreadCount}</span>}
            </button>
            <button type="button" aria-label="Open menu" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)} className="rounded-full p-2.5 text-wix-dark">{mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {(mobileMenuOpen || notifDropdownOpen) && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="border-t border-slate-200 bg-white lg:hidden shadow-xl">
            {notifDropdownOpen && <div className="max-h-[45vh] overflow-y-auto border-b border-slate-100 p-3"><div className="mb-2 flex items-center justify-between px-1"><span className="text-xs font-bold text-wix-dark">Notifications</span><button type="button" onClick={() => setNotifDropdownOpen(false)} className="rounded-full p-1 text-slate-500"><X className="h-4 w-4" /></button></div>{renderNotifList()}</div>}
            {mobileMenuOpen && <div className="space-y-2 p-4">
              <Link href="/project-planner" onClick={() => setMobileMenuOpen(false)} className="mb-2 flex items-center justify-between rounded-2xl border border-orange-200 bg-orange-50 p-4"><span><span className="block text-sm font-bold text-wix-dark">Not sure what you need?</span><span className="block text-[11px] text-slate-600">Tell us your goal and we&apos;ll guide you.</span></span><HelpCircle className="h-5 w-5 text-orange-500" /></Link>
              {navLinks.map((link) => { const Icon = link.icon; const cls = "flex items-center gap-3 rounded-xl px-3 py-3.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"; return link.external ? <a key={`${link.href}-${link.name}`} href={link.href} target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)} className={cls}><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-orange-500"><Icon className="h-4.5 w-4.5" /></span><span className="flex-1">{link.name}<span className="block text-[11px] font-normal text-slate-500">{link.help}</span></span><ArrowRight className="h-4 w-4 text-slate-400" /></a> : <Link key={`${link.href}-${link.name}`} href={link.href} onClick={() => setMobileMenuOpen(false)} className={cls}><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-orange-500"><Icon className="h-4.5 w-4.5" /></span><span className="flex-1">{link.name}<span className="block text-[11px] font-normal text-slate-500">{link.help}</span></span><ArrowRight className="h-4 w-4 text-slate-400" /></Link>; })}
              <div className="border-t border-slate-100 pt-3">
                {user ? <div className="space-y-2"><Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2 rounded-xl bg-wix-dark px-4 py-3 text-sm font-bold text-white"><UserAvatar name={user?.name} profileImageId={user?.profileImageId} profileImageUrl={user?.profileImageUrl} size="sm" /> Open my workspace</Link><button type="button" onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Log out</button></div> : <Link href="/auth?mode=signin" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white">Get started <ArrowRight className="h-4 w-4" /></Link>}
              </div>
            </div>}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
