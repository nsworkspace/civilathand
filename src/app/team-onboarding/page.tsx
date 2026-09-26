"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Phone, MapPin, GraduationCap, Briefcase,
  Link as LinkIcon, Send, Loader2, CheckCircle2, AlertCircle,
  Lock, ShieldCheck, Calendar, Hash, Building2, FileText,
  ChevronRight, Star, Zap,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────
// 🔑 ACCESS CODE – read from environment variable. No hardcoded fallback:
// if NEXT_PUBLIC_TEAM_ONBOARDING_PASSWORD isn't set, this page fails
// closed (nothing typed will match) instead of accepting a known
// default. NOTE: because this is a NEXT_PUBLIC_ variable, whatever value
// you do set is compiled into the public JS bundle and can be read by
// anyone via browser devtools — treat this as a light deterrent, not
// real access control, for anything sensitive.
// ─────────────────────────────────────────────────────────────────────
const ACCESS_CODE = process.env.NEXT_PUBLIC_TEAM_ONBOARDING_PASSWORD || "";

const REDIRECT_SECONDS = 6;

const ROLE_OPTIONS = [
  "Structural Design Engineer",
  "CAD / BIM Specialist (AutoCAD, Revit)",
  "Quantity Surveyor / Estimator",
  "Site Engineer / Supervisor",
  "Architect",
  "Project Manager",
  "Web / App Developer",
  "Graphic / UI Designer",
  "Content Writer",
  "HR / Operations",
  "Sales & Business Development",
  "Other",
];

const DEPARTMENT_OPTIONS = [
  "Engineering & Design",
  "Estimation & BOQ",
  "Site Operations",
  "Technology",
  "Marketing & Content",
  "HR & Administration",
  "Sales",
  "Management",
];

type FormState = {
  fullName: string; phone: string; whatsapp: string; email: string;
  address: string; role: string; department: string; education: string;
  experience: string; joiningDate: string; employeeId: string;
  portfolioLink: string; notes: string;
};

const EMPTY: FormState = {
  fullName: "", phone: "", whatsapp: "", email: "", address: "",
  role: "", department: "", education: "", experience: "",
  joiningDate: "", employeeId: "", portfolioLink: "", notes: "",
};

function Field({ icon: Icon, label, req, children }: {
  icon: React.ComponentType<{ className?: string }>; label: string; req?: boolean; children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1.5 text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
        <Icon className="h-3.5 w-3.5 text-orange-400" />{label}
        {req && <span className="text-orange-400 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

// Custom input/select class with improved dropdown visibility
const IC = "w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-400/60 focus:bg-white/[0.07] transition-all";

// Custom select class that ensures options are visible
const SELECT_CLASS = "w-full bg-[#0f2040] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-400/60 focus:bg-[#1a3560] transition-all appearance-none";

function Logo() {
  return (
    <div className="flex flex-col items-center mb-6">
      <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-orange-400/30 shadow-2xl mb-3">
        <img src="/logo.jpg" alt="NS Construction" className="w-full h-full object-cover" />
      </div>
      <span className="text-[11px] font-extrabold text-white uppercase tracking-[0.25em]">NS Construction</span>
    </div>
  );
}

export default function TeamOnboardingPage() {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (ACCESS_CODE && codeInput.trim().toUpperCase() === ACCESS_CODE.toUpperCase()) {
      setUnlocked(true);
      setCodeError(false);
    } else {
      setCodeError(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!form.fullName.trim() || !form.phone.trim() || !form.role.trim()) {
      setErrorMsg("Full name, phone number, and role are required.");
      return;
    }
    if (!consent) {
      setErrorMsg("Please check the consent box to proceed.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/team-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");
      setSuccess(true);
      setForm(EMPTY);
      setConsent(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!success) return;
    if (countdown <= 0) {
      router.push("/");
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [success, countdown, router]);

  const bg = { background: "linear-gradient(160deg,#0a1628 0%,#0f2040 50%,#1a3560 100%)" };
  const grid = { backgroundImage: "linear-gradient(rgba(249,115,22,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(249,115,22,0.05) 1px,transparent 1px)", backgroundSize: "52px 52px" };
  const goldBar = { background: "linear-gradient(90deg,#f97316,#fbbf24,#f97316)" };
  const btnStyle = { background: "linear-gradient(135deg,#f97316,#fb923c)" };

  if (!unlocked) return (
    <main className="min-h-screen flex items-center justify-center px-4" style={bg}>
      <div className="absolute inset-0 pointer-events-none" style={grid} />
      <motion.form onSubmit={handleUnlock} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative max-w-sm w-full rounded-3xl p-8 text-center shadow-2xl"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(16px)" }}>
        <div className="h-1 w-full rounded-t-3xl absolute top-0 left-0 right-0" style={goldBar} />
        <Logo />
        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-4">
          <Lock className="h-6 w-6 text-orange-400" />
        </div>
        <h1 className="text-xl font-extrabold text-white uppercase tracking-wide mb-1">Team Onboarding</h1>
        <p className="text-white/40 text-xs mb-6 font-medium">Enter the access code shared by NS Construction HR.</p>
        <input value={codeInput} onChange={e => setCodeInput(e.target.value)}
          className={`${IC} text-center tracking-[0.3em] font-bold text-lg mb-3`} placeholder="ACCESS CODE" />
        <AnimatePresence>
          {codeError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-red-400 text-xs mb-3 font-semibold">Incorrect code. Please verify with HR.</motion.p>}
        </AnimatePresence>
        <button type="submit" className="w-full text-white font-extrabold px-7 py-3 text-xs uppercase tracking-widest rounded-xl shadow cursor-pointer" style={btnStyle}>
          Continue <ChevronRight className="inline h-3.5 w-3.5" />
        </button>
        <p className="mt-6 text-[10px] text-white/20">
          <Link href="/privacy-policy" className="hover:text-orange-400 underline transition-colors">Privacy Policy</Link>
        </p>
      </motion.form>
    </main>
  );

  if (success) return (
    <main className="min-h-screen flex items-center justify-center px-4" style={bg}>
      <div className="absolute inset-0 pointer-events-none" style={grid} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative max-w-md w-full text-center rounded-3xl p-10 shadow-2xl"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(16px)" }}>
        <div className="h-1 w-full rounded-t-3xl absolute top-0 left-0 right-0" style={{ background: "linear-gradient(90deg,#10b981,#34d399,#10b981)" }} />
        <Logo />
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-white uppercase mb-2">Welcome Aboard!</h1>
        <p className="text-white/50 text-sm mb-2 font-medium leading-relaxed">Your details have been saved. Our team will review your profile and reach out soon.</p>
        <p className="text-white/30 text-xs mb-6">Redirecting in {countdown}s…</p>
        <Link href="/" className="inline-flex items-center gap-2 text-white font-extrabold px-6 py-3 text-xs uppercase tracking-widest rounded-xl shadow cursor-pointer" style={btnStyle}>
          Go to Homepage
        </Link>
      </motion.div>
    </main>
  );

  return (
    <main className="min-h-screen px-4 py-12 sm:py-16" style={bg}>
      <div className="absolute inset-0 pointer-events-none" style={grid} />
      <div className="relative max-w-2xl mx-auto">
        <Logo />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-3 py-1.5 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Confirmed Team Member
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-wide">Employee Onboarding Form</h1>
          <p className="text-white/40 text-sm mt-2 font-medium max-w-lg mx-auto">
            Welcome to NS Construction! Fill in your details accurately — this forms your official employee record.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[{ icon: ShieldCheck, t: "Data saved securely" }, { icon: Zap, t: "Instant admin notification" }, { icon: Star, t: "Confidential record" }].map(({ icon: I, t }) => (
            <div key={t} className="flex items-center gap-1.5 text-[10px] font-semibold text-white/40 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
              <I className="h-3 w-3 text-orange-400" />{t}
            </div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="relative rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(16px)" }}>
          <div className="h-1 w-full" style={goldBar} />
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">

            {/* Personal */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
                <User className="h-4 w-4 text-orange-400" />
                <span className="text-[11px] font-extrabold text-orange-400 uppercase tracking-widest">Personal Information</span>
              </div>
              <div className="space-y-4">
                <Field icon={User} label="Full Name" req><input required value={form.fullName} onChange={e => set("fullName", e.target.value)} className={IC} placeholder="Your full legal name" /></Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field icon={Phone} label="Phone Number" req><input required value={form.phone} onChange={e => set("phone", e.target.value)} className={IC} placeholder="+91 XXXXX XXXXX" /></Field>
                  <Field icon={Phone} label="WhatsApp (if different)"><input value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} className={IC} placeholder="Optional" /></Field>
                </div>
                <Field icon={Mail} label="Email Address"><input type="email" value={form.email} onChange={e => set("email", e.target.value)} className={IC} placeholder="you@example.com" /></Field>
                <Field icon={MapPin} label="Address"><input value={form.address} onChange={e => set("address", e.target.value)} className={IC} placeholder="City, State, PIN" /></Field>
              </div>
            </div>

            {/* Employment */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
                <Building2 className="h-4 w-4 text-orange-400" />
                <span className="text-[11px] font-extrabold text-orange-400 uppercase tracking-widest">Employment Details</span>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field icon={Briefcase} label="Role / Designation" req>
                    <select required value={form.role} onChange={e => set("role", e.target.value)} className={SELECT_CLASS}>
                      <option value="" className="bg-[#0f2040] text-white">Select your role</option>
                      {ROLE_OPTIONS.map(r => <option key={r} value={r} className="bg-[#0f2040] text-white">{r}</option>)}
                    </select>
                  </Field>
                  <Field icon={Building2} label="Department">
                    <select value={form.department} onChange={e => set("department", e.target.value)} className={SELECT_CLASS}>
                      <option value="" className="bg-[#0f2040] text-white">Select department</option>
                      {DEPARTMENT_OPTIONS.map(d => <option key={d} value={d} className="bg-[#0f2040] text-white">{d}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field icon={Calendar} label="Joining Date"><input type="date" value={form.joiningDate} onChange={e => set("joiningDate", e.target.value)} className={IC} /></Field>
                  <Field icon={Hash} label="Employee ID (if assigned)"><input value={form.employeeId} onChange={e => set("employeeId", e.target.value)} className={IC} placeholder="e.g. CAH-2026-001" /></Field>
                </div>
              </div>
            </div>

            {/* Professional */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
                <GraduationCap className="h-4 w-4 text-orange-400" />
                <span className="text-[11px] font-extrabold text-orange-400 uppercase tracking-widest">Professional Background</span>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field icon={GraduationCap} label="Education Qualification"><input value={form.education} onChange={e => set("education", e.target.value)} className={IC} placeholder="e.g. B.Tech Civil Engineering" /></Field>
                  <Field icon={Briefcase} label="Work Experience"><input value={form.experience} onChange={e => set("experience", e.target.value)} className={IC} placeholder="e.g. 3 years" /></Field>
                </div>
                <Field icon={LinkIcon} label="Portfolio / Resume / LinkedIn"><input value={form.portfolioLink} onChange={e => set("portfolioLink", e.target.value)} className={IC} placeholder="Google Drive / LinkedIn / website URL" /></Field>
                <Field icon={FileText} label="Additional Notes">
                  <textarea value={form.notes} onChange={e => set("notes", e.target.value)} className={`${IC} min-h-[90px] resize-none`}
                    placeholder="Skills, certifications, software proficiency, anything else we should know…" />
                </Field>
              </div>
            </div>

            {/* Consent */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${consent ? "bg-orange-500 border-orange-500" : "border-white/20 bg-white/5 group-hover:border-orange-400/50"}`}>
                {consent && <CheckCircle2 className="h-3 w-3 text-white" />}
              </div>
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="sr-only" />
              <span className="text-xs text-white/40 leading-relaxed font-medium">
                I confirm all details are accurate and consent to NS Construction storing this as my official employee record, per the{" "}
                <Link href="/privacy-policy" className="text-orange-400 underline underline-offset-2 hover:text-orange-300 transition-colors">Privacy Policy</Link>. <span className="text-orange-400">*</span>
              </span>
            </label>

            <AnimatePresence>
              {errorMsg && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 rounded-xl px-4 py-3"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-xs font-semibold">{errorMsg}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 text-white font-extrabold px-7 py-4 text-xs uppercase tracking-widest rounded-xl shadow-lg disabled:opacity-60 cursor-pointer transition-all"
              style={btnStyle}>
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving your details…</> : <><Send className="h-4 w-4" /> Submit Employee Details</>}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-[10px] text-white/20 font-medium pt-1">
              <ShieldCheck className="h-3.5 w-3.5" />Your information is encrypted and kept strictly confidential.
            </p>
          </form>
        </motion.div>

        <p className="text-center text-white/15 text-[10px] font-medium mt-6">
          NS Construction · Employee Portal · <Link href="/privacy-policy" className="hover:text-orange-400 underline transition-colors">Privacy Policy</Link>
        </p>
      </div>
    </main>
  );
}
