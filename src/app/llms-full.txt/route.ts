import { SITE } from "@/data/site";
export const dynamic = "force-static";
export function GET() {
  const body = `# ${SITE.name} — Company Reference

${SITE.description}

Website: ${SITE.url}

## Public resources
Services: ${SITE.url}/services
Careers: ${SITE.url}/work-with-us
Blog: ${SITE.url}/blog
Case studies: ${SITE.url}/portfolio
FAQ: ${SITE.url}/faq
Contact: ${SITE.url}/contact

## Audience
Homeowners, real estate developers, commercial and industrial clients, architects and design consultants, government and infrastructure clients, and construction job seekers.

## Source-of-truth rule
Current public pages on ${SITE.url} take precedence when availability or other details change.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
