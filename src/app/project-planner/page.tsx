import type { Metadata } from "next";
import ProjectPlanner from "@/components/ProjectPlanner";
import { SITE } from "@/data/site";
import { getSitePage, mergePageFallback } from "@/lib/siteContent";

export const metadata: Metadata = {
  title: "Project Planner | NS Construction",
  description: "Build a practical engineering project brief for structural design, BOQ, BIM, CAD and related NS Construction services.",
  alternates: { canonical: `${SITE.url}/project-planner` },
};

export default async function ProjectPlannerPage() {
  const pageContent = mergePageFallback({ slug: "project-planner", path: "/project-planner", pageType: "existing", status: "published", title: "Project Planner", description: "Build a practical engineering project brief." }, await getSitePage("project-planner"));
  return (
    <main className="min-h-screen bg-navy-950 pt-20">
      <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8"><div className="mb-8 text-white"><h1 className="text-3xl font-black sm:text-5xl">{pageContent.heroTitle || "Project Planner"}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{pageContent.heroDescription || pageContent.description}</p></div><ProjectPlanner />{pageContent.contentHtml && <section className="prose prose-invert mt-10 max-w-4xl" dangerouslySetInnerHTML={{__html: pageContent.contentHtml}} />}</div>
    </main>
  );
}
