"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

// Custom chat bubble icon matching the /talk page branding
function LiveChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5">
      <path d="M12 2C6.48 2 2 6.02 2 11c0 2.67 1.19 5.07 3.07 6.74L4 20.5c-.13.48.35.9.82.72l3.57-1.37C9.53 20.59 10.74 21 12 21c5.52 0 10-4.02 10-9S17.52 2 12 2zm-1 13H7v-2h4v2zm6 0h-4v-2h4v2zm0-4H7V9h10v2z" />
    </svg>
  );
}

export const FloatingSocials: React.FC = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      // Show a subtle unread pulse after 3 seconds to attract attention
      setTimeout(() => setUnread(true), 3000);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const socials = [
    {
      name: "Live Chat",
      href: "/talk",
      isInternal: true,
      icon: LiveChatIcon,
      label: "Chat now",
      color: "bg-[#00a884] hover:bg-[#017c63] text-white",
      dotColor: "bg-[#00a884]",
    },
    {
      name: "Contact Us",
      href: "/contact",
      isInternal: true,
      icon: MessageCircle,
      label: "Contact",
      color: "bg-white hover:bg-slate-50 text-slate-700",
      dotColor: "bg-orange-500",
    },
    {
      name: "Email Us",
      href: "mailto:info.civilathand@zohomail.in",
      isInternal: false,
      icon: Mail,
      label: "Email",
      color: "bg-white hover:bg-slate-50 text-slate-700",
      dotColor: "bg-blue-500",
    },
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isExamPage =
    pathname === "/talk";

  // Admin Panel is a standalone, chromeless surface — never show the
  // floating chat/social launcher there.
  const isAdminPage = pathname?.startsWith("/cah-expert-control");

  if (!mounted || isExamPage || isAdminPage) return null;

  return (
    <div ref={containerRef} className="fixed bottom-6 right-5 z-40 flex flex-col items-end gap-2.5">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.9 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col gap-2 pb-1"
          >
            {socials.map((s, i) => {
              const Icon = s.icon;
              const inner = (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-2.5 group cursor-pointer"
                >
                  {/* Label */}
                  <motion.span
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 + 0.05 }}
                    className="bg-[#1f2937] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                  >
                    {s.name}
                    {s.name === "Live Chat" && (
                      <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse" />
                    )}
                  </motion.span>
                  {/* Icon button */}
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg border border-white/10 transition-all duration-200 ${s.color}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                </motion.div>
              );

              return s.isInternal
                ? <Link key={s.name} href={s.href}>{inner}</Link>
                : <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer">{inner}</a>;
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => { setIsOpen(!isOpen); setUnread(false); }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="w-14 h-14 rounded-full bg-[#1f2937] text-white flex items-center justify-center shadow-2xl border border-white/10 relative cursor-pointer"
        aria-label="Toggle Chat"
        suppressHydrationWarning
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }} className="relative flex items-center justify-center">
              {/* WhatsApp-style chat icon */}
              <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                <path d="M12 2C6.48 2 2 6.02 2 11c0 2.67 1.19 5.07 3.07 6.74L4 20.5c-.13.48.35.9.82.72l3.57-1.37C9.53 20.59 10.74 21 12 21c5.52 0 10-4.02 10-9S17.52 2 12 2zm-1 13H7v-2h4v2zm6 0h-4v-2h4v2zm0-4H7V9h10v2z" />
              </svg>
              {/* Unread badge */}
              {unread && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00a884] opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-[#00a884] items-center justify-center">
                    <span className="text-[8px] font-extrabold text-white">1</span>
                  </span>
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};
