import type { MetadataRoute } from "next";
import { SITE } from "@/data/site";

const publicAllow = { userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard", "/cah-expert-control", "/profile", "/auth", "/offline", "/private", "/team-onboarding"] };

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      publicAllow,
      { userAgent: "GPTBot", allow: "/", disallow: ["/api/", "/dashboard", "/cah-expert-control", "/profile", "/auth", "/offline", "/private", "/team-onboarding"] },
      { userAgent: "ClaudeBot", allow: "/", disallow: ["/api/", "/dashboard", "/cah-expert-control", "/profile", "/auth", "/offline", "/private", "/team-onboarding"] },
      { userAgent: "PerplexityBot", allow: "/", disallow: ["/api/", "/dashboard", "/cah-expert-control", "/profile", "/auth", "/offline", "/private", "/team-onboarding"] },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
