"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// ─────────────────────────────────────────────────────────────────────
// WHY THIS EXISTS
//
// Most pages in this app already render their own <Header /> and
// <Footer /> as part of a full-page layout (e.g. `about/page.tsx`,
// `page.tsx` / the homepage, `blog/page.tsx`, etc). A small number of
// pages are intentionally "chromeless" and rely on this root layout to
// provide the site header/footer for them (auth screens, the exam
// runner, and PWA offline page). Full-screen utility pages such as
// chat and the link hub explicitly opt out of the global chrome.
//
// Previously the root layout ALWAYS rendered <Header />, which meant
// every page that also renders its own Header got it TWICE — the bug
// you were seeing ("two navigation bars, one right below the other").
//
// This component renders the global Header/Footer ONLY for the routes
// that need it (the ones with no header of their own) and renders
// nothing everywhere else, so each page has exactly one nav bar.
//
// If you add a new page:
//   - If it includes its own <Header />/<Footer />, you don't need to
//     do anything here — it will correctly get no duplicate chrome.
//   - If it should use the shared site header/footer instead of
//     building its own, add its path (or path prefix) to
//     NO_OWN_HEADER_PATHS below.
//
// IMPORTANT — don't add rewritten paths here:
// `usePathname()` returns the URL the visitor is actually on (the
// rewrite *source*, e.g. "/services" or "/engineering-unit-converter"), not the page
// that Next.js internally renders for it (the rewrite *destination*,
// here "/" — see the `rewrites()` block in next.config). "/services"
// and "/engineering-unit-converter" both rewrite to "/", and the homepage already
// renders its own <Header />/<Footer />. Listing "/services" or
// "/engineering-unit-converter" here used to make SiteChrome ALSO wrap that same
// homepage render in a second Header/Footer — the exact "two nav bars
// stacked on top of each other" bug seen on /services and
// /engineering-unit-converter. Do not re-add them.
// ─────────────────────────────────────────────────────────────────────

const CHROMELESS_PATHS: (string | RegExp)[] = [
  "/talk",
  "/links",
  "/community-app",
];

const NO_OWN_HEADER_PATHS: (string | RegExp)[] = [
  "/forgot-password",
  "/reset-password",
  "/vendors",
  "/vendor-register",
  "/auth",
  "/team-onboarding",
  "/gallery",
  "/private",
  "/offline",
];

// `/cah-expert-control` (the Admin Panel) is deliberately NOT in the
// list above. It must never get the public Header, Footer, floating
// chat button, or install prompt — it is a standalone, chromeless
// surface with only Admin Panel UI. See ADMIN_ROUTE_PREFIX below and
// its use in FloatingSocials.tsx / InstallPrompt.tsx.
export const ADMIN_ROUTE_PREFIX = "/cah-expert-control";

function isChromeless(pathname: string): boolean {
  return CHROMELESS_PATHS.some((rule) =>
    typeof rule === "string" ? pathname === rule || pathname.startsWith(`${rule}/`) : rule.test(pathname)
  );
}

function needsGlobalChrome(pathname: string): boolean {
  return NO_OWN_HEADER_PATHS.some((rule) =>
    typeof rule === "string" ? pathname === rule || pathname.startsWith(`${rule}/`) : rule.test(pathname)
  );
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const showGlobalChrome = needsGlobalChrome(pathname);

  // Full-screen utility experiences (chat/link hub) intentionally own the
  // entire viewport. They must not inherit the marketing header/footer.
  if (isChromeless(pathname)) {
    return <div className="cah-page-shell">{children}</div>;
  }

  if (!showGlobalChrome) {
    // The page itself renders its own Header/Footer/main wrapper.
    return <div className="cah-page-shell">{children}</div>;
  }

  return (
    <div className="cah-page-shell">
      <Header />
      <main id="main-content" className="min-h-screen bg-slate-50 pt-20">{children}</main>
      <Footer />
    </div>
  );
}
