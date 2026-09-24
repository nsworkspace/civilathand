"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ClipboardCheck, Mail, RotateCcw } from "lucide-react";

const steps = [
  { key: "project", title: "What are you planning?", options: ["Residential building", "Commercial building", "Industrial / PEB", "Renovation / interior", "Drawing / CAD conversion", "BOQ / quantity work"] },
  { key: "stage", title: "Where are you right now?", options: ["Only an idea", "Architectural drawings ready", "Structural drawings ready", "Tender / BOQ stage", "Construction already started"] },
  { key: "priority", title: "What matters most?", options: ["Speed", "Cost control", "Technical accuracy", "Coordination / BIM", "A complete package"] },
];

export default function ProjectPlanner() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);

  const recommendation = useMemo(() => {
    const project = answers.project || "";
    if (project.includes("Drawing")) return { title: "Start with a drawing review", text: "A technical review and scope definition will help establish file standards, missing information and the right CAD deliverables." };
    if (project.includes("BOQ")) return { title: "Start with quantity + scope definition", text: "Define drawings, measurement basis, rate schedule and deliverables before estimating so the BOQ is commercially useful." };
    if (project.includes("Industrial")) return { title: "Start with structural + coordination scope", text: "Industrial work benefits from early structural, architectural and coordination decisions before detailed documentation." };
    if (project.includes("Renovation")) return { title: "Start with existing-condition documentation", text: "A clear existing-condition survey, space plan and requirements brief will reduce rework before detailed design." };
    return { title: "Start with a technical project brief", text: "Clarify the site, drawings available, structural scope, quantities and expected deliverables before requesting a fixed quote." };
  }, [answers.project]);

  const current = steps[step];
  const completed = Boolean(answers.project && answers.stage && answers.priority);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!completed || busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), email: email.trim(), phone: phone.trim(),
          service: "Project Planner",
          source: "Project Planner",
          details: JSON.stringify({ ...answers, recommendation: recommendation.title }),
        }),
      });
      if (!response.ok) throw new Error("Unable to submit");
      setSent(true);
    } catch (error) {
      console.error("Project planner submission failed:", error);
    } finally { setBusy(false); }
  };

  const reset = () => { setAnswers({}); setStep(0); setName(""); setEmail(""); setPhone(""); setSent(false); };

  return (
    <section className="relative overflow-hidden bg-navy-950 py-20 text-white sm:py-24">
      <div className="absolute inset-0 blueprint-grid opacity-40" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-orange-300"><ClipboardCheck className="h-3.5 w-3.5" /> Free project planner</span>
            <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight sm:text-4xl">Turn a vague requirement into a <span className="text-orange-400">clear engineering next step.</span></h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300">Answer three practical questions. You&apos;ll get a scope-oriented starting recommendation before speaking with the team.</p>
            <div className="mt-7 space-y-3 text-xs text-slate-300">
              {[
                "Clarify the project type and current stage",
                "Identify the highest-value first step",
                "Capture the brief so the enquiry starts with context",
              ].map((item) => <div key={item} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />{item}</div>)}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white p-5 text-navy-950 shadow-2xl sm:p-7">
            {!completed ? (
              <>
                <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600">Step {step + 1} of {steps.length}</p><h3 className="mt-1 font-display text-xl font-extrabold">{current.title}</h3></div><div className="text-xs font-bold text-slate-400">{Math.round(((step) / steps.length) * 100)}%</div></div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {current.options.map((option) => <button type="button" key={option} onClick={() => { setAnswers((p) => ({ ...p, [current.key]: option })); setStep((p) => Math.min(p + 1, steps.length - 1)); }} className={`min-h-14 rounded-xl border px-4 py-3 text-left text-xs font-bold transition hover:border-orange-400 hover:bg-orange-50 ${answers[current.key] === option ? "border-orange-500 bg-orange-50 text-orange-700" : "border-slate-200 bg-slate-50 text-slate-700"}`}>{option}</button>)}
                </div>
                <div className="mt-5 flex items-center justify-between"><button type="button" disabled={step === 0} onClick={() => setStep((p) => Math.max(0, p - 1))} className="text-xs font-bold text-slate-400 disabled:opacity-30">Back</button><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Select one</span></div>
              </>
            ) : sent ? (
              <div className="py-8 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" /><p className="mt-4 text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">Planner saved</p><h3 className="mt-2 font-display text-2xl font-extrabold">Your enquiry has context now.</h3><p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500">The team can use your project type, stage and priority as the starting brief.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/talk" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-navy-950 px-5 text-xs font-extrabold uppercase tracking-widest text-white">Talk to the team <ArrowRight className="h-4 w-4" /></Link><button type="button" onClick={reset} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-5 text-xs font-extrabold uppercase tracking-widest text-slate-700"><RotateCcw className="h-4 w-4" /> Start again</button></div></div>
            ) : (
              <form onSubmit={submit}>
                <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5"><p className="text-[10px] font-extrabold uppercase tracking-widest text-orange-700">Your starting recommendation</p><h3 className="mt-1 font-display text-xl font-extrabold">{recommendation.title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-600">{recommendation.text}</p><div className="mt-4 grid gap-2 text-[11px] text-slate-600 sm:grid-cols-3"><span><b>Project:</b> {answers.project}</span><span><b>Stage:</b> {answers.stage}</span><span><b>Priority:</b> {answers.priority}</span></div></div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold">Name<input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-orange-400" /></label><label className="text-xs font-bold">Phone<input required value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-orange-400" /></label></div>
                <label className="mt-4 block text-xs font-bold">Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-orange-400" /></label>
                <button disabled={busy} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 text-xs font-extrabold uppercase tracking-widest text-white transition hover:bg-orange-600 disabled:opacity-60">{busy ? "Saving…" : "Save My Project Brief"}<Mail className="h-4 w-4" /></button>
                <p className="mt-3 text-center text-[10px] text-slate-400">Your brief is stored as an enquiry; no automated quote is promised.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
