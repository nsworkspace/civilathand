"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronDown,
  Compass,
  GraduationCap,
  Layers,
  Ruler,
  Sparkles,
  Users,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import MentorshipForm from "@/components/education/MentorshipForm";
import ShareButton from "@/components/ShareButton";

const DEFAULT_SETTINGS = {
  title: "Find the right civil-engineering mentor for your goal",
  subtitle:
    "Universal mentorship for civil engineering — not limited to one exam. Choose your topic, career direction and level so your request can reach the most relevant specialist.",
  priceNote: "Transparent access · specialist matching",
  mentors: [],
  programType: "Civil At Hand Specialist Mentorship",
  duration: "",
  sessionCount: "",
  sessionFormat: "",
  supportChannel: "",
  responseTime: "",
  eligibility: "",
  audience: "",
  subjects: [],
  languages: [],
  outcomes: [],
  included: [],
  process: [],
  policy: "",
};

const tracks = [
  { icon: GraduationCap, title: "Exams & Government Careers", text: "GATE, ESE/IES, SSC-JE, State PSC/AEN/JEN and other civil-engineering recruitment goals." },
  { icon: Briefcase, title: "Private-Sector Careers", text: "Design offices, consultants, contractors, BIM teams, QS, planning and project roles." },
  { icon: Building2, title: "Structural & Design", text: "RCC, steel, structural analysis, detailing, design-office workflows and technical interviews." },
  { icon: Layers, title: "BIM & Digital Skills", text: "AutoCAD, Revit, BIM coordination, digital delivery and software-focused career direction." },
  { icon: Ruler, title: "Site & Construction", text: "Execution, estimation, billing, QA/QC, quantity surveying and site-management guidance." },
  { icon: Compass, title: "Architecture & Planning", text: "Architectural drafting, planning, design fundamentals and Vastu-oriented learning." },
];

export default function MentorshipPage() {
  const [settings, setSettings] = useState<any>(DEFAULT_SETTINGS);
  const [amount, setAmount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/mentorship/settings", { cache: "no-store" });
        const data = res.ok ? await res.json() : {};
        if (!cancelled) {
          setSettings({ ...DEFAULT_SETTINGS, ...data });
          setAmount(Number(data?.paymentAmount) || 0);
        }
      } catch {
        if (!cancelled) setSettings(DEFAULT_SETTINGS);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };
    void load();
    void fetch("/api/mentorship/settings", { method: "POST" }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  const list = (value: unknown) => Array.isArray(value) ? value.filter(Boolean).map(String) : [];
  const mentors = Array.isArray(settings.mentors) ? settings.mentors.filter((mentor: any) => mentor?.name) : [];
  const included = list(settings.included);
  const outcomes = list(settings.outcomes);
  const subjects = list(settings.subjects);
  const process = list(settings.process);
  const isFree = amount <= 0;

  const faqs = useMemo(() => [
    [
      "Is this only for GATE, ESE or SSC-JE?",
      "No. Those are supported tracks, but the mentorship is broader. You can request guidance for private-sector careers, structural design, site engineering, BIM, quantity surveying, planning, architecture-oriented work and other civil-engineering goals."
    ],
    [
      "How does specialist matching work?",
      "The application asks for your main mentorship path and specific topic. Those choices are sent with your goals so the team can route your request to the most relevant available mentor. If mentor expertise tags are configured, the form also prioritises matching specialists."
    ],
    [
      "Can I ask about private-sector careers?",
      "Yes. Select Private-Sector Career Guidance and then choose the area closest to your goal — design, BIM, site, QS, planning, structural work or another civil-engineering role."
    ],
    [
      "Do I have to know exactly what I need?",
      "No. You can select General Civil Career Guidance and describe your situation. The purpose of the first interaction is to turn an unclear goal into a practical next-step plan."
    ],
    [
      "Is the application secure?",
      "Applications are tied to a verified account and checked server-side. Payment access, when enabled, is also verified server-side before the application is accepted."
    ],
  ], []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
              <GraduationCap className="h-4 w-4 text-orange-600" />
              <Link href="/education" className="hover:text-orange-600">Education</Link>
              <span>/</span>
              <span className="text-slate-950">Mentorship</span>
            </div>
            <ShareButton page="/mentorship" label="Mentorship" title={settings.title || DEFAULT_SETTINGS.title} />
          </div>
        </section>

        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 blueprint-grid opacity-50" />
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20 lg:px-8 lg:py-24">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-orange-300">
              <Sparkles className="h-3.5 w-3.5" />
              {settings.programType || DEFAULT_SETTINGS.programType}
            </div>
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              {settings.title || DEFAULT_SETTINGS.title}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              {settings.subtitle || DEFAULT_SETTINGS.subtitle}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#apply" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-orange-500/20 hover:bg-orange-400">
                Start specialist matching <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#tracks" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-white/10">
                See mentorship tracks
              </a>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Access</p>
                <p className="mt-1 font-display text-2xl font-black text-white">{loaded ? (isFree ? "FREE" : `₹${amount.toLocaleString("en-IN")}`) : "…"}</p>
                <p className="mt-1 text-[10px] leading-4 text-slate-400">{settings.priceNote || DEFAULT_SETTINGS.priceNote}</p>
              </div>
              {[
                ["Universal", "Not tied to one exam"],
                ["Topic-based", "Better specialist routing"],
                ["Practical", "Career + project guidance"],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-extrabold text-white">{title}</p>
                  <p className="mt-1 text-[10px] leading-4 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="tracks" className="scroll-mt-20 border-b border-slate-200 bg-white py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-600">Universal mentorship tracks</p>
              <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Your goal does not have to fit into one exam box.</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">Select the closest path in the application. The next topic field makes the request more specific so the team can connect you with a better-fit specialist.</p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tracks.map((track) => (
                <a href="#apply" key={track.title} className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-orange-300 hover:bg-white hover:shadow-premium">
                  <track.icon className="h-5 w-5 text-orange-600" />
                  <h3 className="mt-4 text-sm font-extrabold text-slate-950">{track.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{track.text}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider text-orange-600">Select in form <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {(included.length || outcomes.length || subjects.length || settings.eligibility || settings.audience || mentors.length) > 0 && (
          <section className="bg-slate-50 py-14 sm:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid gap-8 lg:grid-cols-[1fr_.9fr]">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-600">What you can expect</p>
                  <h2 className="mt-2 font-display text-3xl font-black text-slate-950">Focused guidance, not generic motivation.</h2>
                  <div className="mt-6 space-y-3">
                    {(included.length ? included : [
                      "A clearer definition of your current problem and target",
                      "A topic-specific mentor request instead of generic mentor allocation",
                      "Practical next steps for study, career, design or project work",
                    ]).map((item) => (
                      <div key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span className="text-sm leading-6 text-slate-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-6">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-600">Good fit for</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {(subjects.length ? subjects : tracks.map((track) => track.title)).map((subject) => (
                      <span key={subject} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-700">{subject}</span>
                    ))}
                  </div>
                  {(settings.audience || settings.eligibility) && (
                    <div className="mt-6 space-y-3 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-600">
                      {settings.audience && <p><strong className="text-slate-950">Best for:</strong> {settings.audience}</p>}
                      {settings.eligibility && <p><strong className="text-slate-950">Eligibility:</strong> {settings.eligibility}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        <section id="apply" className="scroll-mt-20 bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-8 max-w-2xl text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                <Users className="h-6 w-6" />
              </div>
              <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-600">Specialist matching form</p>
              <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Tell us exactly where you need help.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">Your selected path + topic + goals give the mentorship team a much stronger signal for routing your request.</p>
            </div>
            <MentorshipForm />
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50 py-14">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-600">FAQ</p>
              <h2 className="mt-2 font-display text-2xl font-black text-slate-950">Common questions</h2>
            </div>
            <div className="mt-7 space-y-2">
              {faqs.map(([question, answer], index) => (
                <div key={question} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-extrabold text-slate-900 sm:px-5"
                  >
                    <span>{question}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${openFaq === index ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === index && <div className="border-t border-slate-100 px-4 pb-5 pt-4 text-xs leading-6 text-slate-600 sm:px-5">{answer}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-950 py-12 text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <p className="font-display text-xl font-black">Not sure whether you need a mentor or a course?</p>
              <p className="mt-1 text-sm text-slate-400">Start with your goal. We keep both paths simple.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/education/courses" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-xs font-extrabold uppercase tracking-wider text-slate-950 hover:bg-slate-100">Browse Courses</Link>
              <a href="#apply" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-orange-400">Apply for Mentorship <ArrowRight className="h-4 w-4" /></a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
