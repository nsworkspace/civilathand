// ============================================================
// CENTRAL BUSINESS CONFIG — edit your business details HERE only.
// PLACE AT:  src/data/site.ts
// Used by metadata, structured data (SEO), sitemap and robots.
// ============================================================

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.civilathand.in").replace(/\/$/, "");

export const SITE = {
  name: "NS Construction",
  legalName: "NS Construction — Civil Engineering & Infrastructure Company",
  tagline: "Building infrastructure you can trust.",
  description:
    "NS Construction is a civil engineering and infrastructure company delivering construction, project execution and engineering services, with industry blogs and project case studies.",
  shortDescription:
    "A civil engineering and construction company delivering reliable infrastructure, projects and engineering services.",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.jpg`,

  // ─── Contact ─────────────────────────────────────────────────────
  // To update WhatsApp link: change ONLY `whatsapp` below.
  // The phone number is intentionally NOT published on the website.
  whatsapp: `${SITE_URL}/talk`, // ← update here to change everywhere (https://wa.me/message/JNVZ7YY6BQJ3L1)
  email: "info.civilathand@zohomail.in",
  supportEmail: "info.civilathand@zohomail.in",

  // Location
  address: { region: "Haryana", country: "IN", countryName: "India" },
  areaServed: "India",
  priceRange: "Project-based pricing",
  foundingYear: 2024,

  // Social profiles (used for SEO "sameAs" + footer)
  socials: {
    twitter: "https://x.com/CivilAtHand",
    linkedin: "https://www.linkedin.com/company/civil-at-hand",
    instagram: "https://www.instagram.com/civilathand/",
    youtube: "https://www.youtube.com/@civilathand",
    linktree: `${SITE_URL}/links`,
    telegram: "https://t.me/civilathand",
    whatsappChannel: "https://whatsapp.com/channel/0029VbD0UJw3mFYFp3tWzF2X",
  },
};

export const SOCIAL_LIST = Object.values(SITE.socials);
