"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Compass,
  FileText,
  Layers3,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Ruler,
  ShieldCheck,
  Sparkles,
  Target,
  User,
} from "lucide-react";
import PaymentButton from "@/components/payments/PaymentButton";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const MENTORSHIP_PATHS = [
  { value: "Exams & Government Careers", label: "Exams & Government Careers", desc: "GATE, ESE/IES, SSC-JE, State PSC/AEN/JEN and similar paths", icon: Compass },
  { value: "Private-Sector Career Guidance", label: "Private-Sector Career Guidance", desc: "Design offices, consultants, contractors, BIM, QS, planning and project roles", icon: BriefcaseBusiness },
  { value: "Structural & Design", label: "Structural & Design", desc: "RCC, steel, analysis, detailing and design-office careers", icon: Building2 },
  { value: "BIM & Digital Construction", label: "BIM & Digital Construction", desc: "AutoCAD, Revit, BIM coordination and digital delivery", icon: Layers3 },
  { value: "Site & Construction", label: "Site & Construction", desc: "Execution, QA/QC, estimation, billing and site-management", icon: Ruler },
  { value: "Architecture & Planning", label: "Architecture & Planning", desc: "Architectural drafting, space planning, design and Vastu-oriented learning", icon: MapPin },
  { value: "Higher Studies & Technical Growth", label: "Higher Studies & Technical Growth", desc: "Specialisation choices, project direction and technical growth", icon: Sparkles },
  { value: "General Civil Career Guidance", label: "General Civil Career Guidance", desc: "Not sure yet? Describe your situation and we will help define the next step", icon: Target },
];

const TOPICS_BY_PATH: Record<string, string[]> = {
  "Exams & Government Careers": [
    "GATE Civil",
    "ESE / IES Civil",
    "SSC-JE Civil",
    "State PSC / AEN / JEN",
    "Other Civil Government Exam",
    "Exam Strategy & Study Planning",
    "Technical Subject Doubts",
    "Interview & Selection Strategy",
  ],
  "Private-Sector Career Guidance": [
    "Choosing My Civil Career Path",
    "Design Office Career",
    "Site Engineer Career",
    "Structural Design Career",
    "BIM Career",
    "Quantity Surveying / Estimation",
    "Planning / Project Controls",
    "Consultancy / Contractor Career",
    "Technical Interview Preparation",
  ],
  "Structural & Design": [
    "Structural Analysis",
    "RCC Design",
    "Steel Design",
    "Structural Detailing",
    "STAAD Pro",
    "ETABS",
    "Design Office Workflow",
    "Technical Interview Preparation",
  ],
  "BIM & Digital Construction": [
    "AutoCAD",
    "Revit",
    "BIM Modelling",
    "BIM Coordination",
    "Clash Detection",
    "Digital Construction",
    "BIM Career Roadmap",
  ],
  "Site & Construction": [
    "Site Execution",
    "QA / QC",
    "Quantity Take-Off",
    "Estimation & BOQ",
    "Billing",
    "Construction Management",
    "Site Documentation",
    "Subcontractor Coordination",
  ],
  "Architecture & Planning": [
    "Architectural Drafting",
    "Space Planning",
    "Residential Design",
    "Plans / Elevations / Sections",
    "Architecture Career Direction",
    "Vastu for Built Spaces",
    "Design Presentation",
  ],
  "Higher Studies & Technical Growth": [
    "Choosing a Specialisation",
    "Project / Dissertation Direction",
    "Technical Skill Roadmap",
    "Research & Higher Studies Planning",
    "International Career Preparation",
  ],
  "General Civil Career Guidance": [
    "I am unsure what to choose",
    "Career Roadmap",
    "Skill Gap Assessment",
    "First Job Strategy",
    "Switching Civil Specialisation",
    "Private vs Government Career",
  ],
};

const EXPERIENCE_LEVELS = [
  { value: "Student / Fresher", desc: "Still studying or starting my career" },
  { value: "0–2 years", desc: "Early career / first roles" },
  { value: "2–5 years", desc: "Growing technical or project experience" },
  { value: "5+ years", desc: "Experienced professional seeking direction" },
];

export default function MentorshipForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [path, setPath] = useState("");
  const [topic, setTopic] = useState("");
  const [experience, setExperience] = useState("");
  const [exam, setExam] = useState("");
  const [goal, setGoal] = useState("");
  const [mentors, setMentors] = useState<any[]>([]);
  const [selectedMentor, setSelectedMentor] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [paymentItemExists, setPaymentItemExists] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentUnlocked, setPaymentUnlocked] = useState(false);

  const topics = useMemo(() => TOPICS_BY_PATH[path] || [], [path]);

  const matchedMentors = useMemo(() => {
    if (!path || !topic) return mentors;
    const needle = `${path} ${topic}`.toLowerCase();
    const scored = mentors.map((mentor) => {
      const expertise = [
        ...(Array.isArray(mentor?.expertise) ? mentor.expertise : []),
        ...(Array.isArray(mentor?.areas) ? mentor.areas : []),
        ...(Array.isArray(mentor?.specializations) ? mentor.specializations : []),
        mentor?.role || "",
        mentor?.tag || "",
      ].join(" ").toLowerCase();
      const score = expertise && (expertise.includes(topic.toLowerCase()) || expertise.includes(path.toLowerCase())) ? 2 : needle.split(" ").some((part) => part.length > 3 && expertise.includes(part)) ? 1 : 0;
      return { mentor, score };
    });
    const maxScore = Math.max(0, ...scored.map((item) => item.score));
    return scored.filter((item) => item.score === maxScore).map((item) => item.mentor);
  }, [mentors, path, topic]);

  useEffect(() => {
    const hydrateProfile = (user: any) => {
      if (!user) return;
      setEmail(user.email || "");
      setName(user.displayName || "");
      try {
        const cached = JSON.parse(localStorage.getItem("cah_user") || "null");
        if (cached) {
          setName(cached.name || user.displayName || "");
          setEmail(cached.email || user.email || "");
          setPhone(cached.phone || "");
          setCity(cached.city || cached.address || "");
        }
      } catch {
        // Ignore malformed local profile cache.
      }
    };
    hydrateProfile(auth.currentUser);
    const unsubscribe = onAuthStateChanged(auth, hydrateProfile);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadPaymentState = async () => {
      setPaymentLoading(true);
      try {
        const headers: Record<string, string> = {};
        if (auth.currentUser) {
          try {
            const token = await auth.currentUser.getIdToken();
            if (token) headers.Authorization = `Bearer ${token}`;
          } catch {
            // Server remains the source of truth.
          }
        }
        const res = await fetch("/api/payment-items/mentorship-program", { cache: "no-store", headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Mentorship access is unavailable.");
        if (!cancelled) {
          setPaymentItemExists(true);
          setPaymentAmount(Number(data.amount) || 0);
          setPaymentUnlocked(data.accessible === true);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Mentorship access is unavailable.");
      } finally {
        if (!cancelled) setPaymentLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) setPaymentUnlocked(false);
      void loadPaymentState();
    });
    void loadPaymentState();
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/mentorship/settings", { cache: "no-store" })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!cancelled) {
          const list = Array.isArray(data?.mentors) ? data.mentors.filter((mentor: any) => mentor?.name) : [];
          setMentors(list);
          if (list.length === 1) setSelectedMentor(list[0].name);
        }
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (selectedMentor && !matchedMentors.some((mentor) => mentor.name === selectedMentor)) {
      setSelectedMentor(matchedMentors.length === 1 ? matchedMentors[0].name : "");
    }
  }, [matchedMentors, selectedMentor]);

  const handlePathChange = (value: string) => {
    setPath(value);
    setTopic("");
    setExam("");
    setSelectedMentor("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!name.trim()) return setError("Please enter your full name.");
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Please enter a valid email address.");
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) return setError("Please enter a valid phone number.");
    if (!path) return setError("Please select the mentorship path that best matches your goal.");
    if (!topic) return setError("Please select the civil-engineering topic you need help with.");
    if (!experience) return setError("Please select your experience level.");
    if (mentors.length > 0 && !selectedMentor) return setError("Please select the available specialist mentor for your request.");
    if (!goal.trim() || goal.trim().length < 20) return setError("Please describe your goal in at least 20 characters.");

    setLoading(true);
    try {
      const authHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          if (token) authHeaders.Authorization = `Bearer ${token}`;
        } catch {
          // Server validates the account.
        }
      }

      const details = [
        `MENTORSHIP PATH: ${path}`,
        `TOPIC: ${topic}`,
        `EXPERIENCE: ${experience}`,
        exam ? `EXAM: ${exam}` : "",
        city.trim() ? `CITY: ${city.trim()}` : "",
        "",
        `GOAL / MESSAGE:`,
        goal.trim(),
      ].filter(Boolean).join("\n");

      const res = await fetch("/api/mentorship/apply", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          academicLevel: experience,
          fieldOfStudy: path,
          mentorshipAreas: [topic, ...(exam ? [exam] : [])],
          proficiency: experience === "Student / Fresher" ? 1 : experience === "0–2 years" ? 2 : experience === "2–5 years" ? 3 : 4,
          goals: details,
          mentorName: selectedMentor || null,
          timeZoneComfort: "Yes",
          availability: { Morning: [], Afternoon: [], Evening: [] },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error || "Submission failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (paymentLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-premium">
        <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-orange-500" />
        <p className="text-sm font-extrabold text-slate-800">Checking secure mentorship access…</p>
        <p className="mt-1 text-xs text-slate-400">Your application options will appear in a moment.</p>
      </div>
    );
  }

  if (!paymentItemExists) {
    return (
      <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-premium">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
        <p className="text-sm font-extrabold text-slate-800">Mentorship applications are temporarily unavailable.</p>
        <p className="mt-2 text-xs text-slate-500">Please try again shortly.</p>
      </div>
    );
  }

  if (!paymentUnlocked) {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-premium">
        <div className="border-b border-slate-100 bg-slate-950 px-5 py-5 text-white sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold">Unlock specialist mentorship</p>
              <p className="mt-1 text-[10px] text-slate-400">Secure account and payment verification happen before the application is accepted.</p>
            </div>
          </div>
        </div>
        <div className="p-6 text-center sm:p-8">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure checkout
          </div>
          <h3 className="mt-4 font-display text-2xl font-black text-slate-950">Continue to mentorship</h3>
          <p className="mx-auto mt-2 max-w-lg text-xs leading-6 text-slate-500">
            {paymentAmount > 0
              ? `Complete the verified mentorship access payment of ₹${paymentAmount.toLocaleString("en-IN")}. The specialist application unlocks automatically after access is confirmed.`
              : "Sign in with a verified account. No payment is required while mentorship is configured as free."}
          </p>
          <div className="mt-5">
            <PaymentButton
              itemSlug="mentorship-program"
              showDetails
              className="inline-flex w-full justify-center"
              onUnlocked={() => setPaymentUnlocked(true)}
              fallback={<p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">Mentorship payment is temporarily unavailable.</p>}
            />
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-white p-7 text-center shadow-premium sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h3 className="mt-6 font-display text-3xl font-black text-slate-950">Application received.</h3>
        <p className="mt-2 text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-600">Specialist routing in progress</p>
        <div className="mx-auto mt-7 max-w-lg rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">What happens next</p>
          <div className="mt-4 space-y-3">
            {[
              `Your request is routed around ${topic} within ${path.toLowerCase()}.`,
              "The mentorship team reviews your goal and experience level.",
              "You receive the next-step guidance and specialist contact details through the configured channel.",
            ].map((step, index) => (
              <div key={step} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-[10px] font-black text-white">{index + 1}</span>
                <p className="text-xs leading-5 text-slate-600">{step}</p>
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setSuccess(false);
            setName("");
            setEmail("");
            setPhone("");
            setCity("");
            setPath("");
            setTopic("");
            setExperience("");
            setExam("");
            setGoal("");
            setSelectedMentor(mentors.length === 1 ? mentors[0].name : "");
          }}
          className="mt-6 text-xs font-extrabold uppercase tracking-wider text-orange-600 hover:text-orange-700"
        >
          Submit another application
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-premium">
      <div className="border-b border-slate-100 bg-slate-950 px-5 py-6 text-white sm:px-7">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold">Tell us what you need</p>
            <p className="mt-1 text-[10px] leading-4 text-slate-400">The more specific your topic, the better the specialist match.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-7 p-5 sm:p-7">
        {error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold leading-5 text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <section>
          <div className="mb-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-600">01 · Your details</p>
            <h3 className="mt-1 text-lg font-black text-slate-950">How can we reach you?</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-extrabold text-slate-700">Full name <span className="text-red-500">*</span></span>
              <span className="relative block">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your full name" className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-medium outline-none focus:border-orange-500 focus:bg-white" />
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-extrabold text-slate-700">WhatsApp / phone <span className="text-red-500">*</span></span>
              <span className="relative block">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required type="tel" placeholder="+91 XXXXX XXXXX" className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-medium outline-none focus:border-orange-500 focus:bg-white" />
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-extrabold text-slate-700">Email <span className="text-red-500">*</span></span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="you@example.com" className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-medium outline-none focus:border-orange-500 focus:bg-white" />
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-extrabold text-slate-700">City <span className="text-slate-400">(optional)</span></span>
              <span className="relative block">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City / region" className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-medium outline-none focus:border-orange-500 focus:bg-white" />
              </span>
            </label>
          </div>
        </section>

        <section className="border-t border-slate-100 pt-7">
          <div className="mb-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-600">02 · Choose your path</p>
            <h3 className="mt-1 text-lg font-black text-slate-950">What kind of guidance do you need?</h3>
            <p className="mt-1 text-xs text-slate-500">This is the first matching signal.</p>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {MENTORSHIP_PATHS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => handlePathChange(item.value)}
                className={`flex min-w-0 items-start gap-3 rounded-2xl border-2 p-3.5 text-left transition ${
                  path === item.value
                    ? "border-orange-500 bg-orange-50"
                    : "border-slate-200 bg-slate-50 hover:border-orange-300 hover:bg-white"
                }`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${path === item.value ? "bg-orange-500 text-white" : "bg-white text-slate-500"}`}>
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className={`block text-xs font-extrabold ${path === item.value ? "text-orange-800" : "text-slate-900"}`}>{item.label}</span>
                  <span className="mt-1 block text-[10px] leading-4 text-slate-500">{item.desc}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-100 pt-7">
          <div className="mb-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-600">03 · Select your topic</p>
            <h3 className="mt-1 text-lg font-black text-slate-950">Which civil-engineering topic should we route you to?</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-extrabold text-slate-700">Specific topic <span className="text-red-500">*</span></span>
              <select value={topic} onChange={(e) => setTopic(e.target.value)} disabled={!path} required className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-orange-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60">
                <option value="">{path ? "Select a topic…" : "Select your path first…"}</option>
                {topics.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>

            {path === "Exams & Government Careers" ? (
              <label className="block">
                <span className="mb-1.5 block text-xs font-extrabold text-slate-700">Target exam <span className="text-slate-400">(optional)</span></span>
                <select value={exam} onChange={(e) => setExam(e.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-orange-500 focus:bg-white">
                  <option value="">Select if applicable…</option>
                  <option>GATE Civil Engineering</option>
                  <option>ESE / IES Civil Engineering</option>
                  <option>SSC-JE Civil Engineering</option>
                  <option>State PSC / AEN / JEN</option>
                  <option>Other Government Exam</option>
                </select>
              </label>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Why we ask for a topic</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">A specific topic helps us avoid generic mentor allocation and find a closer specialist fit.</p>
              </div>
            )}
          </div>
        </section>

        <section className="border-t border-slate-100 pt-7">
          <div className="mb-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-600">04 · Your level</p>
            <h3 className="mt-1 text-lg font-black text-slate-950">Where are you right now?</h3>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {EXPERIENCE_LEVELS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setExperience(item.value)}
                className={`rounded-2xl border-2 p-4 text-left ${experience === item.value ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-slate-50 hover:border-orange-300"}`}
              >
                <p className={`text-xs font-extrabold ${experience === item.value ? "text-orange-800" : "text-slate-900"}`}>{item.value}</p>
                <p className="mt-1 text-[10px] leading-4 text-slate-500">{item.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {matchedMentors.length > 0 && (
          <section className="border-t border-slate-100 pt-7">
            <div className="mb-4">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-600">05 · Specialist</p>
              <h3 className="mt-1 text-lg font-black text-slate-950">Choose a specialist when profiles are available.</h3>
            </div>
            <div className="grid gap-3">
              {matchedMentors.map((mentor: any) => (
                <button
                  key={mentor.name}
                  type="button"
                  onClick={() => setSelectedMentor(mentor.name)}
                  className={`flex items-start gap-3 rounded-2xl border-2 p-4 text-left ${selectedMentor === mentor.name ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-slate-50 hover:border-orange-300"}`}
                >
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-black ${selectedMentor === mentor.name ? "bg-orange-500 text-white" : "bg-white text-slate-700"}`}>
                    {mentor.initials || String(mentor.name).slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-950">{mentor.name}</span>
                      {selectedMentor === mentor.name && <BadgeCheck className="h-4 w-4 text-orange-600" />}
                    </span>
                    <span className="mt-1 block text-[10px] font-bold text-orange-700">{mentor.role || mentor.tag || "Civil Engineering Specialist"}</span>
                    {mentor.bio && <span className="mt-1.5 block text-xs leading-5 text-slate-500">{mentor.bio}</span>}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="border-t border-slate-100 pt-7">
          <div className="mb-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-600">{matchedMentors.length > 0 ? "06" : "05"} · Your goal</p>
            <h3 className="mt-1 text-lg font-black text-slate-950">What do you want to achieve?</h3>
          </div>
          <div className="relative">
            <FileText className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              required
              rows={6}
              placeholder="Example: I am a final-year civil student. I want a private-sector structural design job, but I am not sure whether to focus on STAAD or ETABS first. I need a realistic 3-month skill plan and interview roadmap."
              className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-9 pr-4 text-sm leading-6 outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-[10px] text-slate-400">Minimum 20 characters.</p>
            <p className={`text-[10px] font-bold ${goal.length >= 20 ? "text-emerald-600" : "text-slate-400"}`}>{goal.length} chars</p>
          </div>
        </section>

        <button
          type="submit"
          disabled={loading}
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-4 text-xs font-extrabold uppercase tracking-[0.14em] text-white shadow-lg shadow-orange-500/15 hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending request…</> : <><BadgeCheck className="h-4 w-4" /> Request specialist matching</>}
        </button>

        <div className="flex items-start gap-2 rounded-2xl bg-slate-50 p-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <p className="text-[10px] leading-5 text-slate-500">Your application is handled through your verified Civil At Hand account. We use your selected path, topic and goal only to process the mentorship request and route it appropriately.</p>
        </div>
      </form>
    </div>
  );
}
