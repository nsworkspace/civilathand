import type { NextConfig } from "next";

/**
 * Content Security Policy.
 *
 * Shipped as Report-Only first so nothing breaks for real users while the
 * policy is validated in the browser console. Once the console shows no
 * violations for payments (Razorpay), login (Firebase/Google) and fonts,
 * switch CSP_ENFORCE to true to enforce it.
 */
const CSP_ENFORCE = false;

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com https://apis.google.com https://*.firebaseapp.com https://www.googletagmanager.com https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob: https:",
  "connect-src 'self' https://*.razorpay.com https://*.googleapis.com https://*.firebaseio.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://*.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.facebook.com https://graph.facebook.com wss://*.firebaseio.com",
  "frame-src 'self' https://*.razorpay.com https://*.firebaseapp.com https://accounts.google.com https://www.youtube.com https://www.youtube-nocookie.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=(), payment=(self)",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  {
    key: CSP_ENFORCE ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only",
    value: csp,
  },
];

// API responses must never be cached by browsers, proxies or the CDN:
// they carry per-user and per-admin data.
const apiHeaders = [
  { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
  { key: "Pragma", value: "no-cache" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig: NextConfig = {
  // Give every build a unique ID so browsers never serve stale chunks
  generateBuildId: async () => `cah-${Date.now()}`,

  async headers() {
    return [
      {
        // Security headers on every route
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Never cache API responses (auth, payments, admin data).
        source: "/api/:path*",
        headers: apiHeaders,
      },
      {
        // Admin control centre must never be indexed or archived.
        source: "/cah-expert-control/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
      {
        // Service worker: never cache, so browsers always fetch the latest
        // version and pick up new deploys promptly.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        // Web app manifest: short cache, revalidated in the background.
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, must-revalidate" }],
      },
      {
        // PWA icons are static and content-addressed by path, safe to cache long-term.
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },

  async redirects() {
    return [
      { source: "/tools", destination: "/calculators", permanent: true },
      // Canonical SEO calculator URLs. Old URLs permanently redirect so
      // bookmarks and search-engine links do not become 404s.
      { source: "/calculator", destination: "/engineering-unit-converter", permanent: true },
      { source: "/calculator/:conversion", destination: "/engineering-unit-converter/:conversion", permanent: true },
      { source: "/calculators/concrete", destination: "/concrete-calculator", permanent: true },
      { source: "/calculator/all-calculators", destination: "/calculators", permanent: true },
      { source: "/calculator/all-calculators/:path*", destination: "/calculators", permanent: true },
    ];
  },


};

export default nextConfig;
