import type { Metadata } from "next";
import { SITE } from "@/data/site";
import LinksHub from "@/components/links/LinksHub";

// ============================================================
// /links — "link in bio" hub page
//
// Kept as a server component so `metadata` can be exported (Next.js
// does not allow metadata exports from "use client" files). All the
// interactive UI — copy buttons, hover states — lives in the client
// component below. This file's only job is SEO + composition.
// ============================================================

export const metadata: Metadata = {
  title: `${SITE.name} — All Links`,
  description: `All official ${SITE.name} links in one place — WhatsApp, email, and every social channel.`,
  openGraph: {
    title: SITE.name,
    description: SITE.tagline,
    url: `${SITE.url}/links`,
    siteName: SITE.name,
    images: [{ url: SITE.logo, width: 800, height: 800 }],
  },
  robots: { index: true, follow: true },
};

export default function LinksPage() {
  return <LinksHub />;
}
