"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim();
const EXCLUDED_PREFIXES = ["/cah-expert-control", "/private", "/auth", "/dashboard", "/profile", "/reset-password", "/forgot-password", "/payment-success", "/team-onboarding", "/offline"];

export function pushMarketingEvent(event: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
}

export function MarketingIntegrations() {
  const pathname = usePathname() || "/";
  const publicPath = !EXCLUDED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  useEffect(() => {
    if (!GTM_ID || !publicPath || typeof window === "undefined") return;
    if (document.getElementById("cah-gtm-script")) return;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      "gtm.start": new Date().getTime(),
      event: "gtm.js",
      website: "civil-at-hand",
    });

    const script = document.createElement("script");
    script.id = "cah-gtm-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
    document.head.appendChild(script);
  }, [publicPath]);

  useEffect(() => {
    if (!publicPath || typeof window === "undefined") return;
    pushMarketingEvent({ event: "page_view", page_path: pathname, page_location: window.location.href, page_title: document.title });
    const onConsent = () => {
      pushMarketingEvent({ event: "marketing_ready", page_path: pathname });
    };
    window.addEventListener("cah:marketing-ready", onConsent);
    return () => window.removeEventListener("cah:marketing-ready", onConsent);
  }, [pathname, publicPath]);

  return null;
}

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}
