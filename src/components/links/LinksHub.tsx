"use client";

// ============================================================
// LINKS HUB — the actual contents + interactivity for /links
// PLACE AT: src/components/links/LinksHub.tsx
//
// Design intent: a "link-in-bio" page for a civil engineering
// business, styled like a title block on a technical drawing
// sheet — not a generic neon Linktree clone. It reuses the same
// brand tokens as the rest of the site (wix-dark, orange-500,
// Outfit display type) so it never looks like a bolted-on page,
// and every link is either a REAL internal route or pulled
// straight from src/data/site.ts — nothing here is a hardcoded
// duplicate of information that lives elsewhere in the codebase.
// ============================================================

import React, { useState } from "react";
import Link from "next/link";
import {
  Calculator,
  Image as ImageIcon,
  Mail,
  GraduationCap,
  ClipboardList,
  ArrowUpRight,
  Copy,
  Check,
} from "lucide-react";
import { SITE } from "@/data/site";
import {
  InstagramIcon,
  YoutubeIcon,
  TwitterIcon,
  TelegramIcon,
  WhatsAppIcon,
  LinkedinIcon,
} from "@/components/icons/SocialIcons";

// ------------------------------------------------------------
// SHEET 1 — real pages on this site (internal Next.js routes)
// ------------------------------------------------------------
const SITE_LINKS = [
  { label: "Engineering Calculators", desc: "Civil engineering unit conversion and concrete material calculations", href: "/calculators", icon: Calculator },
  { label: "Project Portfolio", desc: "Completed work & case studies", href: "/portfolio", icon: ImageIcon },
  { label: "Get In Touch", desc: "Start a project with us", href: "/contact", icon: Mail },
];

// ------------------------------------------------------------
// SHEET 2 — the education vertical
// ------------------------------------------------------------
const EDUCATION_LINKS = [
  { label: "1-on-1 Mentorship", desc: "Learn from a GATE/ESE/SSC-JE topper", href: "/mentorship", icon: GraduationCap },
  { label: "Courses", desc: "AutoCAD, estimation & more", href: "/education/courses", icon: ClipboardList },
];

// ------------------------------------------------------------
// SHEET 3 — socials, pulled from the one shared SITE object
// (src/data/site.ts) instead of being retyped here.
// ------------------------------------------------------------
const SOCIAL_LINKS = [
  { label: "WhatsApp Channel", href: SITE.socials.whatsappChannel, icon: WhatsAppIcon },
  { label: "Instagram", href: SITE.socials.instagram, icon: InstagramIcon },
  { label: "YouTube", href: SITE.socials.youtube, icon: YoutubeIcon },
  { label: "LinkedIn", href: SITE.socials.linkedin, icon: LinkedinIcon },
  { label: "X (Twitter)", href: SITE.socials.twitter, icon: TwitterIcon },
  { label: "Telegram", href: SITE.socials.telegram, icon: TelegramIcon },
];

function CopyRow({ value, display }: { value: string; display: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can fail on some mobile browsers without HTTPS/permissions —
      // fail quietly rather than showing a broken "copied" state.
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="group flex items-center gap-2 text-[11px] font-medium text-slate-400 hover:text-orange-400 transition-colors"
      aria-label={`Copy ${display}`}
    >
      <span>{display}</span>
      {copied ? (
        <Check className="h-3 w-3 text-orange-400" />
      ) : (
        <Copy className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
}

function SheetLabel({ index, total, title }: { index: number; total: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 px-1">
      <span className="relative flex items-center justify-center w-8 h-8 shrink-0">
        <span className="absolute inset-0 border border-orange-500/40" />
        <span className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-orange-500" />
        <span className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-orange-500" />
        <span className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-orange-500" />
        <span className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-orange-500" />
        <span className="font-display text-[10px] font-bold text-orange-400">
          {String(index).padStart(2, "0")}
        </span>
      </span>
      <div>
        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.25em] leading-none mb-1">
          Sheet {index} of {total}
        </p>
        <p className="font-display text-sm font-extrabold text-white uppercase tracking-wide">
          {title}
        </p>
      </div>
    </div>
  );
}

function LinkCard({
  href,
  label,
  desc,
  icon: Icon,
  external,
}: {
  href: string;
  label: string;
  desc?: string;
  icon: React.ComponentType<{ className?: string }>;
  external?: boolean;
}) {
  const content = (
    <>
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-orange-500 scale-y-0 group-hover:scale-y-100 origin-center transition-transform duration-300" />
      <div className="flex items-center gap-3.5 min-w-0">
        <span className="flex items-center justify-center w-10 h-10 rounded-md bg-white/[0.04] border border-white/10 text-slate-300 group-hover:text-orange-400 group-hover:border-orange-500/40 transition-colors shrink-0">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0">
          <span className="block text-[13.5px] font-bold text-white tracking-wide truncate">
            {label}
          </span>
          {desc && (
            <span className="block text-[11px] text-slate-500 font-medium truncate">
              {desc}
            </span>
          )}
        </span>
      </div>
      <ArrowUpRight className="h-4 w-4 text-slate-600 group-hover:text-orange-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
    </>
  );

  const className =
    "group relative flex items-center justify-between gap-3 overflow-hidden rounded-lg bg-white/[0.03] border border-white/[0.07] pl-5 pr-4 py-3.5 hover:bg-white/[0.05] hover:border-white/[0.14] transition-colors";

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

export default function LinksHub() {
  return (
    <main className="min-h-[100dvh] bg-wix-dark relative overflow-hidden selection:bg-orange-500 selection:text-white">
      {/* Blueprint grid — grounded in the subject (technical drawings),
          restrained: barely-there lines, no color, no motion. */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Corner registration marks — the page's one signature flourish,
          borrowed from print/drafting alignment crosses. Used exactly
          once, at the four corners of the viewport. */}
      {[
        "top-4 left-4 border-t border-l",
        "top-4 right-4 border-t border-r",
        "bottom-4 left-4 border-b border-l",
        "bottom-4 right-4 border-b border-r",
      ].map((pos) => (
        <span key={pos} className={`hidden sm:block fixed ${pos} w-4 h-4 border-orange-500/30 z-10`} />
      ))}

      <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500" />

      <div className="relative z-[1] mx-auto max-w-md px-5 pt-[max(4rem,env(safe-area-inset-top))] pb-[max(4rem,env(safe-area-inset-bottom))] flex flex-col items-center">
        {/* ---------------- Identity ---------------- */}
        <div className="relative mb-5">
          <span className="absolute -top-2 -left-2 w-3 h-3 border-t border-l border-orange-500/60" />
          <span className="absolute -top-2 -right-2 w-3 h-3 border-t border-r border-orange-500/60" />
          <span className="absolute -bottom-2 -left-2 w-3 h-3 border-b border-l border-orange-500/60" />
          <span className="absolute -bottom-2 -right-2 w-3 h-3 border-b border-r border-orange-500/60" />
          <div className="w-20 h-20 rounded-full overflow-hidden bg-white/5 border border-white/10">
            <img src="/logo.jpg" alt={SITE.name} className="w-full h-full object-cover" />
          </div>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-wide text-center">
          {SITE.name}
        </h1>
        <p className="text-[11px] font-bold text-orange-400 uppercase tracking-[0.2em] text-center mt-2 max-w-xs">
          {SITE.tagline}
        </p>

        <div className="flex items-center gap-3 mt-5 mb-2">
          <CopyRow value={SITE.email} display={SITE.email} />
        </div>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-8" />

        {/* ---------------- Sheet 1: the real site ---------------- */}
        <section className="w-full mb-9">
          <SheetLabel index={1} total={3} title="Explore the site" />
          <div className="grid grid-cols-1 gap-2.5">
            {SITE_LINKS.map((l) => (
              <LinkCard key={l.href} href={l.href} label={l.label} desc={l.desc} icon={l.icon} />
            ))}
          </div>
        </section>

        {/* ---------------- Sheet 2: education ---------------- */}
        <section className="w-full mb-9">
          <SheetLabel index={2} total={3} title="Civil At Hand Education" />
          <div className="grid grid-cols-1 gap-2.5">
            {EDUCATION_LINKS.map((l) => (
              <LinkCard key={l.href} href={l.href} label={l.label} desc={l.desc} icon={l.icon} />
            ))}
          </div>
        </section>

        {/* ---------------- Sheet 3: socials ---------------- */}
        <section className="w-full">
          <SheetLabel index={3} total={3} title="Follow & message us" />
          <div className="grid grid-cols-1 gap-2.5">
            {SOCIAL_LINKS.map((l) => (
              <LinkCard key={l.label} href={l.href} label={l.label} icon={l.icon} external />
            ))}
          </div>
        </section>

        {/* ---------------- Footer / title block ---------------- */}
        <div className="w-full mt-12 pt-6 border-t border-white/[0.06] flex flex-col items-center gap-1.5">
          <p className="text-[10px] text-slate-600 font-medium tracking-wide flex items-center gap-1.5">
            {SITE.areaServed} · {SITE.priceRange}
          </p>
          <p className="text-[10px] text-slate-700 tracking-widest uppercase">
            © {new Date().getFullYear()} {SITE.name} — Est. {SITE.foundingYear}
          </p>
        </div>
      </div>
    </main>
  );
}
