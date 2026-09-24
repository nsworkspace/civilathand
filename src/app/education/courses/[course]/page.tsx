"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  ArrowLeft, CheckCircle2, Clock, Star, GraduationCap,
  ListChecks, Users, Headphones, BookOpen, MessageCircle, Loader2, ShieldCheck,
} from "lucide-react";
import type { Course } from "@/data/education/courses";
import PaymentButton from "@/components/payments/PaymentButton";
import CourseEnrollmentForm from "@/components/education/CourseEnrollmentForm";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

export default function CourseDetailPage() {
  const params = useParams();
  const slug = params.course as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentComplete, setPaymentComplete] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/courses/${slug}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.course) {
          setCourse(data.course);
        }
      })
      .catch((err) => {
        console.error("Error loading course detail:", err);
      })
      .finally(() => setLoading(false));

    // Track a view for this course (fire-and-forget)
    fetch(`/api/courses/${slug}`, { method: "POST" }).catch(console.error);

    // Payment/enrollment UI is account-bound. Never retain the local
    // post-payment state after logout or switching Firebase accounts.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) setPaymentComplete(false);
    });
    return () => unsubscribe();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Header />
        <main className="flex flex-grow items-center justify-center py-32">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <Header />
        <main className="flex flex-grow items-center justify-center p-6">
          <div className="max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-premium">
            <p className="mb-3 font-display text-lg font-black text-slate-900">Course not found.</p>
            <Link href="/education/courses" className="text-sm font-bold text-orange-600 underline">
              ← Back to all courses
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const completeEnrollment = () => { setPaymentComplete(true); };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header />
      <main className="flex-grow">
        {/* Hero */}
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 blueprint-grid opacity-50" />
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full blur-3xl" style={{ background: `${course.accent || "#c8942a"}22` }} />
          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
            <Link href="/education/courses" className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-300 hover:text-orange-200">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Civil At Hand Courses
            </Link>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-slate-300">
                {course.category || "Civil Engineering"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                {course.badge || "Course"}
              </span>
              {course.mode === "Live" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-red-600">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> Live Classes
                </span>
              )}
            </div>

            <h1 className="mt-5 max-w-3xl font-display text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl">
              {course.name}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{course.summary}</p>

            <div className="mt-7 flex flex-wrap gap-2">
              {[
                { icon: Clock, label: course.duration },
                { icon: Star, label: course.level },
                { icon: GraduationCap, label: course.mode === "Live" ? "Live + Doubt Support" : "Self-Paced" },
              ].map((m, i) => (
                <div key={i} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white">
                  <m.icon className="h-3.5 w-3.5 text-orange-300" /> {m.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Body */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
            {/* Left: details */}
            <div className="space-y-10 lg:col-span-2">
              {Array.isArray(course.learn) && course.learn.length > 0 && (
                <div>
                  <div className="mb-5 flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-orange-500" />
                    <h2 className="font-display text-xl font-black tracking-tight text-slate-950">What You Will Learn</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {course.learn.map((l) => (
                      <div key={l} className="flex items-start gap-2.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span className="text-xs font-medium text-slate-700">{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(course.modules) && course.modules.length > 0 && (
                <div>
                  <div className="mb-5 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-orange-500" />
                    <h2 className="font-display text-xl font-black tracking-tight text-slate-950">Course Outline</h2>
                  </div>
                  <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {course.modules.map((m, i) => (
                      <div key={m} className="flex items-center gap-4 p-4">
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black text-white"
                          style={{ background: course.accent || "#c8942a" }}
                        >
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium text-slate-700">{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(course.whoFor) && course.whoFor.length > 0 && (
                <div>
                  <div className="mb-5 flex items-center gap-2">
                    <Users className="h-5 w-5 text-orange-500" />
                    <h2 className="font-display text-xl font-black tracking-tight text-slate-950">Who This Is For</h2>
                  </div>
                  <ul className="space-y-2.5">
                    {course.whoFor.map((w) => (
                      <li key={w} className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span className="text-sm font-medium text-slate-600">{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right: enroll card */}
            <div className="lg:col-span-1">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-premium lg:sticky lg:top-6 sm:p-7">
                <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-orange-600">Course access</p>
                <p className="mb-1 font-display text-3xl font-black text-slate-950">
                  {(course as any).paymentActive === false
                    ? "Enrollment Paused"
                    : Number((course as any).paymentAmount ?? 0) === 0
                      ? "FREE"
                      : `₹${Number((course as any).paymentAmount).toLocaleString("en-IN")}`}
                </p>
                <p className="mb-5 text-[11px] font-semibold text-slate-400">One-time · Lifetime access</p>

                {course.mode === "Live" && (
                  <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3">
                    <Headphones className="h-4 w-4 shrink-0 text-red-500" />
                    <span className="text-[11px] font-bold text-red-700">Live classes with full doubt support</span>
                  </div>
                )}

                {course.comingSoon ? (
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-100 px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                    Coming Soon
                  </div>
                ) : (
                  <>
                    <PaymentButton
                      itemSlug={`course-${course.slug}`}
                      showDetails={false}
                      className="w-full"
                      onUnlocked={() => { completeEnrollment(); }}
                      fallback={<div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-500">Enrollment is temporarily unavailable. Please try again later.</div>}
                    />

                    {paymentComplete && (
                      <div className="mt-5">
                        <CourseEnrollmentForm course={course} />
                      </div>
                    )}
                  </>
                )}

                <a
                  href="/contact"
                  className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition hover:bg-orange-400"
                >
                  <MessageCircle className="h-4 w-4" /> Get Notified
                </a>

                <p className="mt-4 flex items-start gap-1.5 text-[10px] font-semibold leading-5 text-slate-400">
                  <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" />
                  Access is handled through the secure Civil At Hand checkout. Course availability and pricing are controlled from the education catalog.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
