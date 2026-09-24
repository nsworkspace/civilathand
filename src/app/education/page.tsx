import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  BookOpen,
  FileText,
  Users,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Clock,
  Compass,
  Target,
  BriefcaseBusiness,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Civil At Hand Education | Courses, Study Material & Mentorship",
  description:
    "Learn civil engineering with Civil At Hand Courses, premium study material and specialist mentorship.",
};

const learningOptions = [
  {
    href: "/education/courses",
    icon: BookOpen,
    number: "01",
    label: "Courses",
    title: "Civil At Hand Courses",
    description:
      "Learn practical civil engineering, architecture and software skills through focused, project-based courses.",
    items: ["AutoCAD & Revit", "Structural Design", "BIM & Estimation"],
    button: "View Courses",
  },
  {
    href: "/education/study-materials",
    icon: FileText,
    number: "02",
    label: "Study Material",
    title: "Premium Study Material",
    description:
      "Get original Civil At Hand PDFs for unit-wise study, quick revision and technical reference.",
    items: ["Unit-wise PDFs", "Civil & Structural", "Secure paid access"],
    button: "View Study Material",
  },
  {
    href: "/mentorship",
    icon: Users,
    number: "03",
    label: "Mentorship",
    title: "Civil Engineering Mentorship",
    description:
      "Get 1:1 guidance matched to your exam, career goal, design field or private-sector path.",
    items: ["Exam & Government Jobs", "Private Sector", "Design, Site & BIM"],
    button: "Find a Mentor",
  },
];

const topics = [
  "GATE / ESE / SSC-JE",
  "Private-sector careers",
  "Structural engineering",
  "Construction & site work",
  "AutoCAD / Revit / BIM",
  "Architecture & planning",
];

const learnerPaths = [
  { icon: Compass, title: "I am new", text: "Start from the basics with plain-English explanations and guided examples." },
  { icon: GraduationCap, title: "I am a student", text: "Prepare for exams, coursework and practical civil-engineering skills." },
  { icon: BriefcaseBusiness, title: "I am a professional", text: "Strengthen design, site, BIM, software and project-delivery skills." },
];

const learningGoals = [
  "Understand a civil-engineering topic",
  "Prepare for an exam",
  "Learn a practical software skill",
  "Improve my career or job skills",
  "Complete a real project",
];

const trustPoints = [
  { icon: ShieldCheck, title: "Verified access", text: "Every purchase is tied to your account." },
  { icon: Clock, title: "Learn at your pace", text: "Self-paced courses and instant PDF access." },
  { icon: GraduationCap, title: "Built by engineers", text: "Content made for real civil-engineering work." },
];

export default function EducationPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 blueprint-grid opacity-40" />
          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-orange-300">
                <Sparkles className="h-3.5 w-3.5" /> Civil At Hand Education
              </div>
              <h1 className="mt-6 font-display text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                Learn civil engineering without feeling <span className="text-orange-400">lost.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                You do not need to understand the course catalogue first. Tell us where you are and what you want to achieve. We make the next step clear.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="#choose-your-level" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-orange-400">
                  Find my learning path <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/mentorship" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 px-6 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-white/5">
                  Talk to a mentor
                </Link>
              </div>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {trustPoints.map((point) => (
                <div key={point.title} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                  <point.icon className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
                  <div>
                    <p className="text-xs font-extrabold text-white">{point.title}</p>
                    <p className="mt-0.5 text-[11px] leading-5 text-slate-400">{point.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="choose-your-level" className="bg-slate-50 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">Step 1 · Where are you now?</p>
              <h2 className="mt-2 font-display text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Choose your level. We will simplify the rest.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">No technical classification required. Pick the description that feels closest to you.</p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {learnerPaths.map((path) => {
                const Icon = path.icon;
                return (
                  <article key={path.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-premium-lg">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600"><Icon className="h-5 w-5" /></div>
                    <h3 className="mt-5 font-display text-xl font-black text-slate-950">{path.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{path.text}</p>
                    <Link href="/education/courses" className="mt-5 inline-flex min-h-10 items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-950 hover:text-orange-600">See recommended learning <ArrowRight className="h-4 w-4" /></Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">Step 2 · What do you want to achieve?</p>
                <h2 className="mt-2 font-display text-2xl font-black text-slate-950 sm:text-3xl">Choose the outcome, not the course name.</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">The same subject can be useful for an exam, a job, a project or simply understanding the basics.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {learningGoals.map((goal, index) => (
                  <Link key={goal} href={index === 4 ? "/education/courses" : "/education/courses"} className="group flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-orange-300 hover:bg-orange-50">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[10px] font-black text-orange-600 shadow-sm">0{index + 1}</span>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-slate-950">{goal}</span>
                    <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-orange-600" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">Step 3 · Your learning path</p>
              <h2 className="mt-2 font-display text-2xl font-black text-slate-950 sm:text-3xl">Understand → Example → Practice → Apply.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">Learning should feel like a guided journey, not a folder full of PDFs and course names.</p>
            </div>
            <div className="mt-8 grid gap-3 md:grid-cols-4">
              {["Understand", "See an example", "Practice", "Apply"].map((step, index) => (
                <div key={step} className="relative rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-white">{index + 1}</div>
                  <h3 className="mt-4 text-sm font-black text-slate-950">{step}</h3>
                  <p className="mt-1.5 text-xs leading-5 text-slate-500">
                    {index === 0 && "Plain-English concept before technical detail."}
                    {index === 1 && "A real civil-engineering situation or worked example."}
                    {index === 2 && "A short exercise or question to check understanding."}
                    {index === 3 && "A calculator, drawing task, project activity or mentor step."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">Your options</p>
                <h2 className="mt-2 font-display text-2xl font-black text-slate-950 sm:text-3xl">Pick the help you need right now.</h2>
              </div>
              <Link href="/education/courses" className="inline-flex min-h-10 shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900 hover:text-orange-600">Explore everything <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {learningOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <article key={option.href} className="flex h-full flex-col rounded-3xl border border-slate-200 bg-slate-50 p-6 transition hover:border-orange-300 hover:bg-white hover:shadow-premium">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-orange-600 shadow-sm"><Icon className="h-5 w-5" /></div>
                    <h3 className="mt-5 font-display text-xl font-black text-slate-950">{option.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{option.description}</p>
                    <ul className="mt-4 space-y-2">
                      {option.items.map((item) => <li key={item} className="flex items-center gap-2 text-xs font-semibold text-slate-700"><CheckCircle2 className="h-4 w-4 text-emerald-500" />{item}</li>)}
                    </ul>
                    <Link href={option.href} className="mt-auto pt-6 inline-flex min-h-11 items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-950 hover:text-orange-600">{option.button} <ArrowRight className="h-4 w-4" /></Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-slate-950">
          <div className="absolute inset-0 blueprint-grid opacity-30" />
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-display text-2xl font-black text-white sm:text-3xl">Not sure where to start?</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Start with your goal. If you still cannot decide, a mentor can help you choose the right learning route.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/education/courses" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-orange-500 px-5 text-xs font-bold uppercase tracking-wider text-white hover:bg-orange-400">Start learning</Link>
                <Link href="/education/study-materials" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 px-5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/5">Study material</Link>
                <Link href="/mentorship" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 px-5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/5">Find a mentor</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
