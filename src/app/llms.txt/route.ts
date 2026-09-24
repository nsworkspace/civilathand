import { NextResponse } from "next/server";
import { SITE } from "@/data/site";
export const dynamic = "force-static";
export function GET() {
  const base = SITE.url.replace(/\/$/, "");
  const lines = [
    `# ${SITE.name}`, `> ${SITE.shortDescription}`, "",
    "Civil At Hand is a practical civil engineering and architecture learning platform for students, graduates, professionals and job seekers.", "",
    "## Public learning platform",
    `- [Home](${base}/): Start page for the platform.`,
    `- [Education](${base}/education): Learning hub.`,
    `- [Courses](${base}/education/courses): Civil, structural, BIM and architecture learning.`,
    `- [Study materials](${base}/education/study-materials): Engineering study resources.`,
    `- [Mentorship](${base}/mentorship): Personalised technical and career guidance.`,
    `- [Calculators](${base}/calculators): Engineering calculation tools.`,
    `- [Unit converter](${base}/engineering-unit-converter): Engineering unit conversion tools.`,
    `- [Careers](${base}/work-with-us): Current professional opportunities.`,
    `- [Blog](${base}/blog): Industry news, explainers and practical knowledge.`,
    `- [Case studies](${base}/portfolio): Project examples and engineering case studies.`,
    `- [About](${base}/about): About Civil At Hand.`,
    `- [Contact](${base}/contact): Contact route.`,
    "", "## Audience",
    "Civil engineering students, architecture students, fresh graduates, site engineers, design professionals, quantity surveyors, BIM practitioners, construction professionals and job seekers.",
    "", "## Source-of-truth rule", "Current public pages on the website take precedence when content changes.",
  ];
  return new NextResponse(`${lines.join("\\n")}\\n`, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
