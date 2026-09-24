"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  BookOpen, Clock, Star, GraduationCap, ChevronRight,
  Play, Zap, Headphones, ArrowRight, Loader2, Filter, Sparkles,
} from "lucide-react";
import type { Course } from "@/data/education/courses";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    fetch("/api/courses", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.courses)) {
          setCourses(data.courses);
        }
      })
      .catch((err) => console.error("Failed to fetch courses:", err))
      .finally(() => setLoading(false));
  }, []);

  const categories = ["All", ...Array.from(new Set(courses.map((course) => course.category || "Civil Engineering")))];
  const visibleCourses = activeCategory === "All"
    ? courses
    : courses.filter((course) => (course.category || "Civil Engineering") === activeCategory);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header />
      <main className="flex-grow">
        {/* Hero — simplified, one clear message */}
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 blueprint-grid opacity-50" />
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
            <Link href="/education" className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-300 hover:text-orange-200">
              <GraduationCap className="h-3.5 w-3.5" /> Civil At Hand Education
            </Link>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-orange-300" /> Civil At Hand Courses
            </div>
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-black leading-tight tracking-tight sm:text-5xl">
              One course library for civil,{" "}
              <span className="text-orange-400">structural &amp; architecture skills.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              Learn the tools and workflows used across design offices, construction
              sites, BIM teams and private-sector careers. Pick a skill and start
              with a clear syllabus.
            </p>

            <div className="mt-8 flex flex-wrap gap-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-3.5 py-2">{courses.length} learning tracks</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3.5 py-2">Civil + Structural</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3.5 py-2">BIM + Digital</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3.5 py-2">Site + QS</span>
            </div>
          </div>
        </section>

        {/* Feature strip */}
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl grid-cols-2 sm:grid-cols-4">
            {[
              { icon: Play, title: "Project based", text: "Learn by doing" },
              { icon: Star, title: "Real workflows", text: "Built for real roles" },
              { icon: Zap, title: "Student friendly", text: "Clear and focused" },
              { icon: Headphones, title: "Support ready", text: "Doubt support where offered" },
            ].map((item) => (
              <div key={item.title} className="border-r border-slate-200 px-4 py-5 last:border-r-0 sm:px-6">
                <item.icon className="h-5 w-5 text-orange-600" />
                <p className="mt-2 text-xs font-extrabold text-slate-900">{item.title}</p>
                <p className="mt-1 text-[10px] text-slate-500">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Course grid */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-600">Browse the library</p>
                <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Choose a skill. Follow the roadmap.
                </h2>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <Filter className="h-4 w-4" /> {visibleCourses.length} shown
              </div>
            </div>

            <div className="mt-7 flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`min-h-10 shrink-0 rounded-full border px-4 text-[10px] font-extrabold uppercase tracking-wider transition ${
                    activeCategory === category
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-700"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              </div>
            ) : visibleCourses.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <p className="text-sm font-bold text-slate-700">No courses in this category yet.</p>
                <button type="button" onClick={() => setActiveCategory("All")} className="mt-2 text-xs font-bold text-orange-600 underline">View all courses</button>
              </div>
            ) : (
              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {visibleCourses.map((course) => (
                  <Link
                    key={course.slug}
                    href={`/education/courses/${course.slug}`}
                    className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-premium transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-premium-lg"
                  >
                    <div className="h-1.5" style={{ background: course.accent || "#c8942a" }} />
                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-600">
                          {course.category || "Civil Engineering"}
                        </span>
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {course.mode === "Live" && <span className="rounded-full bg-red-50 px-2 py-1 text-[8px] font-extrabold uppercase tracking-wider text-red-700">Live</span>}
                          {course.comingSoon && <span className="rounded-full bg-amber-50 px-2 py-1 text-[8px] font-extrabold uppercase tracking-wider text-amber-700">Coming soon</span>}
                        </div>
                      </div>

                      <div className="mt-5 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${course.accent || "#c8942a"}14`, color: course.accent || "#c8942a" }}>
                        <BookOpen className="h-5 w-5" />
                      </div>

                      <h3 className="mt-5 font-display text-xl font-black leading-tight tracking-tight text-slate-950">{course.name}</h3>
                      <p className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-orange-600">{course.sub}</p>
                      <p className="mt-4 text-xs leading-6 text-slate-500">{course.summary}</p>

                      <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2"><Clock className="h-3.5 w-3.5" /> {course.duration}</span>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2"><Star className="h-3.5 w-3.5 text-orange-500" /> {course.level}</span>
                      </div>

                      <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                        <div>
                          <p className="text-[8px] font-extrabold uppercase tracking-wider text-slate-400">Access</p>
                          <p className="mt-1 font-display text-sm font-black text-slate-950">
                            {(course as any).paymentActive === false
                              ? "Paused"
                              : Number((course as any).paymentAmount ?? 0) === 0
                                ? "FREE / SEE DETAILS"
                                : `₹${Number((course as any).paymentAmount).toLocaleString("en-IN")}`}
                          </p>
                        </div>
                        <span className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 text-[10px] font-extrabold uppercase tracking-wider text-white group-hover:bg-orange-500">
                          View course <ChevronRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Cross-links */}
        <section className="border-y border-slate-200 bg-slate-50 py-12">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-600">Need revision material?</p>
              <h2 className="mt-2 font-display text-2xl font-black text-slate-950">Add premium Civil At Hand study PDFs to your learning path.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Unit-wise civil-engineering PDFs are sold separately and delivered only to the verified account that completes payment.</p>
            </div>
            <Link href="/education/study-materials" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-xs font-extrabold uppercase tracking-wider text-slate-700 hover:border-orange-300 hover:text-orange-600">Browse Study Material <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white py-14">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-600">Need a different direction?</p>
              <h2 className="mt-2 font-display text-2xl font-black text-slate-950">Ask a specialist instead of guessing your next step.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Use mentorship when you need personalised guidance on exams, private-sector careers, design, site work or another civil-engineering goal.</p>
            </div>
            <Link href="/mentorship" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-orange-400">
              Find a Mentor <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
