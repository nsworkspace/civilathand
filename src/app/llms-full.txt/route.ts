import { SITE } from "@/data/site";
export const dynamic = "force-static";
export function GET() {
  const body = `# ${SITE.name} — Public Platform Reference

${SITE.description}

Website: ${SITE.url}

## Public resources
Education: ${SITE.url}/education
Courses: ${SITE.url}/education/courses
Study materials: ${SITE.url}/education/study-materials
Mentorship: ${SITE.url}/mentorship
Calculators: ${SITE.url}/calculators
Unit converter: ${SITE.url}/engineering-unit-converter
Careers: ${SITE.url}/work-with-us
Blog: ${SITE.url}/blog
Case studies: ${SITE.url}/portfolio
FAQ: ${SITE.url}/faq
Contact: ${SITE.url}/contact

## Audience
Civil engineering students, architecture students, graduates, engineers, construction professionals, design professionals and job seekers.

## Source-of-truth rule
Current public pages on ${SITE.url} take precedence when availability or other platform details change.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
