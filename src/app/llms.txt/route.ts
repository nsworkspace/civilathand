import { NextResponse } from "next/server";
import { SITE } from "@/data/site";
export const dynamic = "force-static";
export function GET() {
  const base = SITE.url.replace(/\/$/, "");
  const lines = [
    `# ${SITE.name}`, `> ${SITE.shortDescription}`, "",
    "NS Construction is a civil engineering and construction company delivering project execution and engineering services across India.", "",
    "## Public site",
    `- [Home](${base}/): Start page.`,
    `- [Services](${base}/services): Civil engineering, design and construction services.`,
    `- [Careers](${base}/work-with-us): Current professional opportunities.`,
    `- [Blog](${base}/blog): Industry news, explainers and practical knowledge.`,
    `- [Case studies](${base}/portfolio): Project examples and engineering case studies.`,
    `- [About](${base}/about): About NS Construction.`,
    `- [Contact](${base}/contact): Contact route.`,
    "", "## Audience",
    "Homeowners, real estate developers, commercial and industrial clients, architects and design consultants, government and infrastructure clients, and construction job seekers.",
    "", "## Source-of-truth rule", "Current public pages on the website take precedence when content changes.",
  ];
  return new NextResponse(`${lines.join("\\n")}\\n`, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
