"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SITE } from "@/data/site";
import {
  Mail,
  MessageCircle,
  Briefcase,
  Send,
  CheckCircle2,
  Copy,
  Check,
  MapPin,
  Clock,
  ArrowRight,
  Ticket,
} from "lucide-react";

const services = [
  "Structural Design",
  "BOQ Estimation",
  "Quantity Surveying",
  "PDF to AutoCAD",
  "BIM Services",
  "Interior Design",
  "Other / General Enquiry",
];

// ─── Copy-to-clipboard hook ────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy email"
      className="ml-2 p-1 rounded hover:bg-white/20 transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400 hover:text-white" />}
    </button>
  );
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", service: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in your name, email and message.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          service: form.service || "General Enquiry",
          message: form.message,
          source: "Contact Page",
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setForm({ name: "", email: "", phone: "", service: "", message: "" });
      } else {
        setError(`Something went wrong. Email us at ${SITE.supportEmail}`);
      }
    } catch {
      setError(`Network error. Email us at ${SITE.supportEmail}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-wix-gray" ref={pageRef}>
      <Header />

      <main className="flex-grow">

        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section className="relative bg-wix-dark text-white overflow-hidden py-20 md:py-28">
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500" />
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
              <p className="text-xs font-bold text-orange-400 uppercase tracking-[0.3em] mb-4">Get In Touch</p>
              <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight uppercase leading-tight mb-5">
                Contact <span className="text-orange-500">Civil At Hand</span>
              </h1>
              <p className="text-slate-400 text-sm md:text-base font-medium max-w-xl mx-auto leading-relaxed">
                Share your project and we&apos;ll respond within 24 hours with a scope, timeline and proposal.
              </p>
            </div>
          </div>
        </section>

        {/* ── REACH US CARDS ───────────────────────────────────────── */}
        <section className="py-14 bg-white border-b border-slate-100">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-bold text-orange-500 uppercase tracking-widest text-center mb-8">
              Ways to Reach Us
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* Email Card */}
              <div className="group bg-slate-50 border border-slate-200 rounded-2xl p-7 hover:border-orange-400 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-blue-500 transition-colors duration-300">
                  <Mail className="h-5 w-5 text-blue-500 group-hover:text-white transition-colors duration-300" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email</p>
                <p className="font-display font-extrabold text-base text-wix-dark mb-1 tracking-wide">Support Email</p>
                <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                  We reply to every email within 24 business hours.
                </p>
                <div className="flex items-center gap-1 flex-wrap">
                  <a
                    href={`mailto:${SITE.supportEmail}`}
                    className="text-xs font-bold text-blue-600 hover:text-orange-500 transition-colors break-all"
                  >
                    {SITE.supportEmail}
                  </a>
                  <CopyButton text={SITE.supportEmail} />
                </div>
                <a
                  href={`mailto:${SITE.supportEmail}`}
                  className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-orange-500 hover:text-wix-dark uppercase tracking-widest transition-colors"
                >
                  Send Email <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Live Chat Card */}
              <div className="group bg-slate-50 border border-slate-200 rounded-2xl p-7 hover:border-orange-400 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-emerald-500 transition-colors duration-300">
                  <MessageCircle className="h-5 w-5 text-emerald-500 group-hover:text-white transition-colors duration-300" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Live Chat</p>
                <p className="font-display font-extrabold text-base text-wix-dark mb-1 tracking-wide">Chat With Us</p>
                <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                  Real-time chat with our team — fastest way to discuss your project and get a quick quote.
                </p>
                <Link
                  href="/talk"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-500 hover:text-wix-dark uppercase tracking-widest transition-colors"
                >
                  Start Chat <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Client Portal Card */}
              <div className="group bg-slate-50 border border-slate-200 rounded-2xl p-7 hover:border-orange-400 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-orange-500 transition-colors duration-300">
                  <Briefcase className="h-5 w-5 text-orange-500 group-hover:text-white transition-colors duration-300" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Client Portal</p>
                <p className="font-display font-extrabold text-base text-wix-dark mb-1 tracking-wide">Raise a Ticket</p>
                <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                  Upload drawings, track your project and message our engineers directly.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-500 hover:text-wix-dark uppercase tracking-widest transition-colors"
                >
                  Open Portal <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

            </div>

            {/* Business Hours strip */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6 bg-slate-50 border border-slate-200 rounded-2xl px-8 py-5">
              <div className="flex items-center gap-2.5 text-sm text-slate-600">
                <Clock className="h-4 w-4 text-orange-500 flex-shrink-0" />
                <span className="font-medium"><span className="font-bold text-wix-dark">Business Hours:</span> Mon – Sat, 9 AM – 7 PM IST</span>
              </div>
              <div className="hidden sm:block w-px h-5 bg-slate-300" />
              <div className="flex items-center gap-2.5 text-sm text-slate-600">
                <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0" />
                <span className="font-medium"><span className="font-bold text-wix-dark">India</span> — Online &amp; on-site, delivering across India</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── CONSULTATION FORM ─────────────────────────────────────── */}
        <section className="py-16 md:py-24 bg-wix-gray">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">

            {submitted ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-lg text-center">
                <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-2">Message Received</p>
                <h2 className="font-display text-2xl font-extrabold text-wix-dark uppercase mb-4">Thank You!</h2>
                <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto leading-relaxed mb-8">
                  Our engineering team will review your request and get back to you within 24 business hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="inline-flex items-center gap-2 bg-wix-dark hover:bg-orange-500 text-white font-bold px-8 py-3.5 text-xs uppercase tracking-widest rounded-xl transition-all"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">

                {/* Form Header */}
                <div className="bg-wix-dark px-8 md:px-12 py-8 border-b border-white/10">
                  <p className="text-[10px] font-bold text-orange-400 uppercase tracking-[0.3em] mb-1">Free Consultation</p>
                  <h2 className="font-display text-2xl md:text-3xl font-extrabold text-white uppercase tracking-wide">
                    Start Your Project
                  </h2>
                  <p className="text-slate-400 text-sm mt-2 font-medium">
                    Tell us about your project and we&apos;ll get back to you with a detailed plan.
                  </p>
                </div>

                {/* Form Body */}
                <div className="px-8 md:px-12 py-10 space-y-6">

                  {/* Row 1: Name + Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold text-wix-dark uppercase tracking-widest mb-2">
                        Full Name <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="text" name="name" value={form.name} onChange={handleChange}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium focus:outline-none focus:border-wix-dark focus:ring-2 focus:ring-wix-dark/10 transition-all placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-wix-dark uppercase tracking-widest mb-2">
                        Email Address <span className="text-orange-500">*</span>
                      </label>
                      <input
                        type="email" name="email" value={form.email} onChange={handleChange}
                        placeholder="you@example.com"
                        className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium focus:outline-none focus:border-wix-dark focus:ring-2 focus:ring-wix-dark/10 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Row 2: Phone + Service */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold text-wix-dark uppercase tracking-widest mb-2">
                        Contact Number <span className="text-[10px] font-normal text-slate-400 normal-case">(Optional)</span>
                      </label>
                      <input
                        type="tel" name="phone" value={form.phone} onChange={handleChange}
                        placeholder="+91 98765 43210"
                        className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium focus:outline-none focus:border-wix-dark focus:ring-2 focus:ring-wix-dark/10 transition-all placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-wix-dark uppercase tracking-widest mb-2">
                        Service Required
                      </label>
                      <select
                        name="service" value={form.service} onChange={handleChange}
                        className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium focus:outline-none focus:border-wix-dark focus:ring-2 focus:ring-wix-dark/10 transition-all appearance-none cursor-pointer bg-white"
                      >
                        <option value="">Select a service…</option>
                        {services.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Message */}
                  <div>
                    <label className="block text-[10px] font-bold text-wix-dark uppercase tracking-widest mb-2">
                      Project Description <span className="text-orange-500">*</span>
                    </label>
                    <textarea
                      name="message" rows={5} value={form.message} onChange={handleChange}
                      placeholder="Describe your project — built-up area, location, structure type, drawings available, or any specific requirements…"
                      className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium focus:outline-none focus:border-wix-dark focus:ring-2 focus:ring-wix-dark/10 transition-all resize-none placeholder:text-slate-400"
                    />
                  </div>

                  {/* What to expect */}
                  <div className="bg-orange-50 border border-orange-100 rounded-xl px-5 py-4">
                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-3">What Happens Next</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { n: "1", t: "We review your request", d: "Within 2 hours on working days" },
                        { n: "2", t: "We send a proposal", d: "Scope, timeline & pricing" },
                        { n: "3", t: "Project kicks off", d: "Deliverables in 24–72 hours" },
                      ].map((step) => (
                        <div key={step.n} className="flex items-start gap-2.5">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">{step.n}</span>
                          <div>
                            <p className="text-xs font-bold text-wix-dark">{step.t}</p>
                            <p className="text-[11px] text-slate-500 font-medium">{step.d}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      <p className="text-sm text-red-600 font-medium">{error}</p>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    onClick={handleSubmit} disabled={loading}
                    className="w-full bg-wix-dark hover:bg-orange-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending…
                      </>
                    ) : (
                      <><Send className="h-4 w-4" /> Submit Consultation Request</>
                    )}
                  </button>

                  <p className="text-[11px] text-slate-400 text-center font-medium">
                    By submitting, you agree to our{" "}
                    <Link href="/privacy-policy" className="text-orange-500 hover:underline">Privacy Policy</Link>.
                    {" "}We never share your details with third parties.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── BOTTOM STRIP — Client Portal CTA ─────────────────────── */}
        <section className="bg-orange-500 py-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.08),transparent_60%)] pointer-events-none" />
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <Ticket className="h-5 w-5 text-white/80" />
                  <p className="text-xs font-bold text-white/80 uppercase tracking-widest">Client Portal</p>
                </div>
                <h3 className="font-display text-xl md:text-2xl font-extrabold text-white uppercase tracking-tight">
                  Already a client? Raise a support ticket.
                </h3>
                <p className="text-sm text-orange-100 font-medium mt-1">
                  Track projects, upload files and chat directly with your engineer.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="flex-shrink-0 inline-flex items-center gap-2 bg-white hover:bg-wix-dark text-orange-500 hover:text-white font-bold px-7 py-3.5 text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg"
              >
                Open Portal <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
