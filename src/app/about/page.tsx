import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowRight, BookOpen, Calculator, BriefcaseBusiness, GraduationCap, UsersRound } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "About Civil At Hand",
  description:
    "Civil At Hand is a practical civil engineering and architecture learning platform for students, professionals and job seekers.",
};

const pillars: Array<{ title: string; description: string; icon: LucideIcon }> = [
  {
    title: "Learn",
    description:
      "Structured courses and study resources that make difficult civil and architecture topics easier to understand.",
    icon: GraduationCap,
  },
  {
    title: "Practice",
    description:
      "Engineering calculators, examples and practical workflows that connect theory with real work.",
    icon: Calculator,
  },
  {
    title: "Grow",
    description:
      "Mentorship, career guidance and industry knowledge for the next stage of your professional journey.",
    icon: UsersRound,
  },
  {
    title: "Connect",
    description:
      "Jobs, case studies and a growing knowledge network for people across the built environment.",
    icon: BriefcaseBusiness,
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <Header />
      <main id="main-content">
        <section className="bg-[#07111f] text-white">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-7 lg:px-8 lg:py-28">
            <p className="text-xs font-black uppercase tracking-[.18em] text-orange-400">About Civil At Hand</p>
            <h1 className="mt-5 max-w-4xl font-display text-4xl font-black tracking-tight sm:text-6xl">
              A practical home for the civil and architecture community.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              Civil At Hand is being built as a universal learning and career platform —
              not just for students, and not just for one job role. The goal is to help
              people understand the profession, build useful skills and keep progressing.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/education" className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold">
                Explore learning <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/work-with-us" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-bold">
                Explore careers
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-7 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2">
            {pillars.map(({ title, description, icon: Icon }) => (
              <div key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-6 font-display text-2xl font-black">{title}</h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-7 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-orange-600">Who it is for</p>
              <h2 className="mt-3 font-display text-3xl font-black">One platform across the professional journey.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Civil engineering students",
                "Architecture students",
                "Fresh graduates",
                "Site and QA/QC professionals",
                "Design and BIM professionals",
                "Quantity surveyors",
                "Construction professionals",
                "Job seekers and career switchers",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm font-semibold">
                  <BookOpen className="h-4 w-4 shrink-0 text-orange-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
