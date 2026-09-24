"use client";

import React from "react";
import { Share2, Link as LinkIcon, Check } from "lucide-react";
import { WhatsAppIcon, LinkedinIcon, TwitterIcon } from "@/components/icons/SocialIcons";

// lucide-react has dropped/renamed the Facebook icon across versions, so we
// ship a tiny inline SVG here instead of depending on a package export that
// may not exist in this project's installed lucide-react version.
const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M22 12.06C22 6.505 17.523 2 12 2S2 6.505 2 12.06c0 5.02 3.657 9.184 8.438 9.94v-7.03H7.898v-2.91h2.54V9.845c0-2.507 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562v1.878h2.773l-.443 2.91h-2.33V22c4.78-.756 8.438-4.92 8.438-9.94Z" />
  </svg>
);

interface ShareButtonProps {
  /** Logical page id used as the analytics key, e.g. "/mentorship" or "/blog/my-post" */
  page: string;
  /** Human readable label shown in the admin dashboard's "Most Shared Pages" list */
  label?: string;
  /** Optional explicit URL to share; defaults to the current page URL */
  url?: string;
  /** Optional custom share text */
  title?: string;
  className?: string;
  compact?: boolean;
}

async function trackShare(page: string, label?: string) {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "share", page, label }),
    });
  } catch {
    // Never block sharing on analytics failures.
  }
}

export default function ShareButton({ page, label, url, title, className = "", compact = false }: ShareButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const shareText = title || label || "Check this out on Civil At Hand";

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: shareText, url: shareUrl });
        trackShare(page, label);
        return;
      } catch {
        // User cancelled or share failed — fall back to the dropdown.
      }
    }
    setOpen((v) => !v);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    trackShare(page, label);
    setTimeout(() => setCopied(false), 1800);
  };

  const links = [
    {
      key: "whatsapp",
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " - " + shareUrl)}`,
      icon: <WhatsAppIcon className="h-4 w-4" />,
      color: "hover:bg-green-50 hover:text-green-600",
    },
    {
      key: "linkedin",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      icon: <LinkedinIcon className="h-4 w-4" />,
      color: "hover:bg-blue-50 hover:text-blue-700",
    },
    {
      key: "twitter",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      icon: <TwitterIcon className="h-4 w-4" />,
      color: "hover:bg-slate-100 hover:text-slate-900",
    },
    {
      key: "facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      icon: <FacebookIcon className="h-4 w-4" />,
      color: "hover:bg-blue-50 hover:text-blue-600",
    },
  ];

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={handleNativeShare}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white font-bold uppercase tracking-wide text-navy-950 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 ${
          compact ? "px-2.5 py-1.5 text-[10px]" : "px-3.5 py-2 text-xs"
        }`}
        title="Share"
      >
        <Share2 className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
        Share
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          <div className="grid grid-cols-4 gap-1.5 pb-1.5">
            {links.map((l) => (
              <a
                key={l.key}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackShare(page, label)}
                className={`flex h-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors ${l.color}`}
              >
                {l.icon}
              </a>
            ))}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="flex w-full items-center gap-2 rounded-lg border-t border-slate-100 px-2 py-2 text-[11px] font-semibold text-slate-600 hover:text-orange-600"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <LinkIcon className="h-3.5 w-3.5" />}
            {copied ? "Link copied" : "Copy link"}
          </button>
        </div>
      )}
    </div>
  );
}
