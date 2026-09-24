import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Briefcase, CalendarDays, CheckCircle2, MapPin, Users } from "lucide-react";
import CareerShareControls from "@/components/CareerShareControls";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import clientPromise from "@/lib/mongodb";
import { roleList, roleSlug } from "@/lib/careerRoles";

const dbName = process.env.MONGODB_DB || "civil-at-hand";

const fallbackRoles = [
  { id: "role-1", title: "Architect", type: "Freelance", location: "Darbhanga, Bihar", desc: "Seeking an experienced architect in Darbhanga, Bihar, to design a simple residential house.", fullDetails: "Project Requirement: Seeking an experienced architect in Darbhanga, Bihar, to design a simple residential house.", active: true },
  { id: "role-2", title: "Civil Engineering Intern", type: "Internship", location: "Remote / Pan-India", desc: "Learn on real engineering projects with mentorship — drafting, estimation, and BIM basics.", fullDetails: "Join Civil At Hand as a Civil Engineering Intern and gain hands-on exposure.", active: true },
  { id: "role-3", title: "Labour Contractors", type: "Full-time", location: "Pan-India", desc: "Looking for Labour Contractors & Manpower Suppliers Across India for ongoing construction projects.", fullDetails: "Seeking experienced Labour Contractors, Civil Sub-contractors, and Manpower Suppliers.", active: true },
  { id: "role-4", title: "Web Developer", type: "Full-time / Freelance", location: "Remote", desc: "Web development, Next.js, React, UI design, and interactive civil engineering tools.", fullDetails: "Looking for a Web Developer to design, enhance, and optimize web applications.", active: true },
];

async function getRole(slug: string) {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const settings = await db.collection("career_settings").findOne({ key: "career_config" });
    const roles = Array.isArray(settings?.roles) && settings.roles.length ? settings.roles : fallbackRoles;
    return roles.find((role: any) => roleSlug(role) === slug && role.active !== false) || null;
  } catch (error) {
    console.error("Failed to load career role:", error);
    return fallbackRoles.find((role) => roleSlug(role) === slug && role.active !== false) || null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const role = await getRole(slug);
  if (!role) return { title: "Job Not Found | Civil At Hand" };
  const title = role.metaTitle || `${role.title} — Careers at Civil At Hand`;
  const description = role.metaDescription || role.desc || `Apply for ${role.title} at Civil At Hand.`;
  return {
    title,
    description,
    keywords: roleList(role.keywords || role.tags),
    alternates: { canonical: `/work-with-us/${roleSlug(role)}` },
    openGraph: { title, description, type: "website", url: `/work-with-us/${roleSlug(role)}` },
  };
}

export default async function CareerRolePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const role = await getRole(slug);
  if (!role) notFound();

  const skills = roleList(role.skills);
  const responsibilities = roleList(role.responsibilities);
  const qualifications = roleList(role.qualifications);
  const benefits = roleList(role.benefits);
  const hiringProcess = roleList(role.process);
  const tags = roleList(role.tags);
  const jobUrl = `/work-with-us/${roleSlug(role)}`;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://civilathand.com";
  const shareUrl = `${baseUrl.replace(/\/$/, "")}${jobUrl}`;
  const applyUrl = `/work-with-us?role=${encodeURIComponent(roleSlug(role))}#application-form-section`;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header />
      <main>
        <section className="bg-wix-dark text-white border-b border-slate-800">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
            <Link href="/work-with-us" className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white mb-8">
              <ArrowLeft className="h-4 w-4" /> All Careers
            </Link>
            <div className="max-w-4xl">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="rounded-full bg-orange-500 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest">{role.type || "Open Position"}</span>
                {role.department && <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest">{role.department}</span>}
                {role.featured && <span className="rounded-full bg-emerald-500/20 text-emerald-200 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest">Featured</span>}
              </div>
              <h1 className="font-display text-4xl md:text-6xl font-extrabold uppercase tracking-tight">{role.title}</h1>
              <p className="mt-5 text-base md:text-lg text-slate-300 max-w-3xl leading-relaxed">{role.desc}</p>
              <div className="mt-7 flex flex-wrap gap-5 text-xs font-bold text-slate-300">
                {role.location && <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-orange-400" />{role.location}</span>}
                {role.openings && <span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-orange-400" />{role.openings} opening{Number(role.openings) === 1 ? "" : "s"}</span>}
                {role.deadline && <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-orange-400" />Apply by {role.deadline}</span>}
                {role.workplace && <span className="inline-flex items-center gap-2"><Briefcase className="h-4 w-4 text-orange-400" />{role.workplace}</span>}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <article className="space-y-8">
            {role.fullDetails && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                <h2 className="font-display text-xl font-extrabold uppercase mb-4">Role Overview</h2>
                <div className="text-sm text-slate-700 leading-7 whitespace-pre-line">{role.fullDetails}</div>
              </section>
            )}
            {responsibilities.length > 0 && <DetailList title="Responsibilities" items={responsibilities} />}
            {qualifications.length > 0 && <DetailList title="Qualifications" items={qualifications} />}
            {skills.length > 0 && <DetailList title="Skills & Expertise" items={skills} />}
            {benefits.length > 0 && <DetailList title="What We Offer" items={benefits} />}
            {hiringProcess.length > 0 && <DetailList title="Hiring Process" items={hiringProcess} />}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-600">{tag}</span>)}
              </div>
            )}
          </article>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-orange-500 mb-2">Position Summary</div>
              <div className="space-y-3 text-xs">
                {[["Employment", role.type], ["Department", role.department], ["Location", role.location], ["Workplace", role.workplace], ["Compensation", role.salary], ["Experience", role.experience], ["Openings", role.openings], ["Deadline", role.deadline]].map(([label, value]) => value ? <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-2"><span className="text-slate-400 font-bold">{label}</span><span className="text-right font-extrabold text-slate-800">{value}</span></div> : null)}
              </div>
              {role.applyEnabled !== false ? (
                <Link href={applyUrl} className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 text-xs font-extrabold uppercase tracking-widest">
                  Apply for this job <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <div className="mt-5 rounded-xl bg-slate-100 text-slate-500 px-4 py-3 text-center text-xs font-extrabold uppercase tracking-widest">Applications closed</div>
              )}
            </div>

            <CareerShareControls title={role.title} url={shareUrl} />
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm"><h2 className="font-display text-xl font-extrabold uppercase mb-5">{title}</h2><ul className="space-y-3">{items.map((item) => <li key={item} className="flex gap-3 text-sm text-slate-700 leading-relaxed"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-1" /><span>{item}</span></li>)}</ul></section>;
}
