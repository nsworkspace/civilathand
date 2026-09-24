"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Accessibility,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CircleHelp,
  FileText,
  GraduationCap,
  Lightbulb,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { FooterInstallApp } from "./FooterInstallApp";
import FeedbackForm from "./FeedbackForm";
import { SITE } from "@/data/site";

const companyLinks = [
  { label: "About us", href: "/about", icon: Building2 },
  { label: "Case studies", href: "/portfolio", icon: BriefcaseBusiness },
  { label: "Careers", href: "/work-with-us", icon: Users },
  { label: "Blog", href: "/blog", icon: FileText },
  { label: "FAQ", href: "/faq", icon: CircleHelp },
  { label: "Contact", href: "/contact", icon: Mail },
] as const;

const toolsLinks = [
  { label: "Latest insights", href: "/blog", icon: Lightbulb },
  { label: "All links", href: "/links", icon: Link2 },
] as const;

const communityLinks = [
  { label: "Community", href: "/community", icon: Users },
  { label: "Jobs & careers", href: "/work-with-us", icon: BriefcaseBusiness },
  { label: "About Civil At Hand", href: "/about", icon: Building2 },
  { label: "Accessibility", href: "/accessibility-statement", icon: Accessibility },
  { label: "Contact", href: "/contact", icon: Mail },
] as const;

const socialLinks = [
  { label: "LinkedIn", href: SITE.socials.linkedin, mark: "in" },
  { label: "Instagram", href: SITE.socials.instagram, mark: "ig" },
  { label: "YouTube", href: SITE.socials.youtube, mark: "▶" },
  { label: "WhatsApp", href: SITE.socials.whatsappChannel, mark: "wa" },
] as const;

export const Footer: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const year = mounted ? new Date().getFullYear() : 2026;

  return (
    <>
      <footer className="cah-footer relative overflow-hidden border-t border-white/10 bg-[#020b17] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-80" style={{ backgroundImage: "radial-gradient(circle at 12% 10%, rgba(245,158,11,.10), transparent 25%), linear-gradient(180deg, rgba(2,11,23,1) 0%, rgba(3,14,28,.98) 100%)" }} />
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-8 hidden h-[520px] w-[760px] opacity-[0.12] lg:block" style={{ backgroundImage: "linear-gradient(rgba(148,163,184,.45) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.45) 1px, transparent 1px)", backgroundSize: "54px 54px", maskImage: "linear-gradient(90deg, transparent 0%, black 38%, black 100%)" }} />

        <div className="relative mx-auto max-w-[1500px] px-5 pb-[calc(22px+env(safe-area-inset-bottom))] pt-10 sm:px-7 sm:pt-12 lg:px-10 lg:pt-14">
          <div className="grid gap-12 lg:grid-cols-[minmax(280px,1.05fr)_minmax(0,2.95fr)] lg:gap-14 xl:gap-20">
            <div className="max-w-[390px]">
              <Link href="/" aria-label="Civil At Hand home" className="inline-flex items-center gap-4">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[22px] bg-white/5 ring-1 ring-white/10 sm:h-[88px] sm:w-[88px]">
                  <img src="/logo.jpg" alt="Civil At Hand" className="h-full w-full object-cover" />
                </span>
                <span>
                  <span className="block font-display text-[26px] font-black leading-none tracking-tight text-white sm:text-[31px]">CIVIL</span>
                  <span className="block font-display text-[24px] font-black leading-none tracking-[0.08em] text-white sm:text-[28px]">AT HAND</span>
                  <span className="mt-2 block text-[12px] font-semibold tracking-wide text-amber-400">Engineering made simpler.</span>
                </span>
              </Link>

              <p className="mt-8 max-w-[360px] text-[15px] leading-7 text-slate-300 sm:text-[16px]">Civil engineering and architecture services, careers and industry knowledge.</p>

              <div className="mt-8 space-y-4 text-sm text-slate-300">
                <a href={`mailto:${SITE.email}`} className="group flex items-start gap-4 hover:text-white"><Mail className="mt-0.5 h-5 w-5 shrink-0 text-slate-200 transition-colors group-hover:text-amber-400" /><span>{SITE.email}</span></a>
                <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-4 hover:text-white"><Phone className="mt-0.5 h-5 w-5 shrink-0 text-slate-200 transition-colors group-hover:text-amber-400" /><span>WhatsApp support</span></a>
                <div className="flex items-start gap-4"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-slate-200" /><span>India · Engineering &amp; project support</span></div>
              </div>
            </div>

            <nav aria-label="Footer navigation" className="grid grid-cols-1 gap-x-7 gap-y-11 sm:grid-cols-2 xl:grid-cols-3">
              <FooterGroup title="Company" links={companyLinks} />
              <FooterGroup title="Tools" links={toolsLinks} />
              <FooterGroup title="Community" links={communityLinks} />
            </nav>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-[1.18fr_1.52fr_auto] lg:items-stretch">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-950/60 text-amber-400"><Phone className="h-6 w-6" /></div>
                <div><p className="text-base font-extrabold text-white">Install App</p><p className="mt-1 text-xs leading-5 text-slate-400">Keep Civil At Hand one tap away.</p><div className="mt-3"><FooterInstallApp /></div></div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-amber-400/80 bg-transparent text-amber-400"><Users className="h-6 w-6" /></div><div><p className="text-base font-extrabold text-white">Have a project or requirement?</p><p className="mt-1 max-w-md text-sm leading-6 text-slate-300">Contact our team for engineering &amp; project support.</p></div></div>
                <Link href="/contact" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-400 px-5 py-3 text-sm font-extrabold text-amber-400 transition hover:bg-amber-400 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300">Contact our team<ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:p-5 lg:min-w-[220px]">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">Follow us</p>
              <div className="mt-4 flex flex-wrap gap-2.5 lg:flex-nowrap">{socialLinks.map(({ label, href, mark }) => <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-950/50 text-[11px] font-bold text-slate-200 transition hover:border-amber-400 hover:text-amber-400">{mark}</a>)}</div>
            </div>
          </div>

          <div className="mt-8 grid gap-7 border-t border-white/10 pt-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div><p className="text-base font-medium text-slate-100">© {year} Civil At Hand. All rights reserved.</p><p className="mt-2 max-w-[600px] text-xs leading-6 text-slate-400 sm:text-sm">Engineering information is provided for general guidance and does not replace project-specific professional review.</p></div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-slate-300 lg:max-w-[720px] lg:justify-end"><Link href="/privacy-policy" className="hover:text-amber-300">Privacy</Link><Link href="/terms-and-conditions" className="hover:text-amber-300">Terms</Link><Link href="/cookie-policy" className="hover:text-amber-300">Cookies</Link><Link href="/accessibility-statement" className="hover:text-amber-300">Accessibility</Link><Link href="/engineering-disclaimer" className="hover:text-amber-300">Disclaimer</Link><button type="button" onClick={() => setShowBugModal(true)} className="hover:text-amber-300">Report an issue</button></div>
          </div>
        </div>
      </footer>

      <AnimatePresence>{showBugModal ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center" onClick={() => setShowBugModal(false)}><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="relative my-8 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}><button type="button" onClick={() => setShowBugModal(false)} aria-label="Close feedback form" className="absolute -right-3 -top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg hover:bg-amber-500 hover:text-white"><X className="h-4 w-4" /></button><div className="overflow-hidden rounded-2xl shadow-2xl"><FeedbackForm lockType="bug" /></div></motion.div></motion.div> : null}</AnimatePresence>
    </>
  );
};

function FooterGroup({ title, links }: { title: string; links: readonly { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[] }) {
  return <div><h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{title}</h3><ul className="mt-4 space-y-1">{links.map(({ label, href, icon: Icon }) => <li key={label}><Link href={href} className="group flex min-h-10 items-center gap-3 rounded-lg px-1 text-sm font-medium text-slate-300 transition hover:bg-white/[0.035] hover:text-white"><Icon className="h-[17px] w-[17px] shrink-0 text-slate-400 transition-colors group-hover:text-amber-400" /><span>{label}</span></Link></li>)}</ul></div>;
}
