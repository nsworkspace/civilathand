"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

interface Props {
  course: { slug: string; name: string; duration?: string; level?: string; priceLabel?: string };
  onComplete?: () => void;
}

export default function CourseEnrollmentForm({ course, onComplete }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [goal, setGoal] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const hydrate = (user: any) => {
      if (!user) return;
      setName(user.displayName || "");
      setEmail(user.email || "");
      try {
        const cached = JSON.parse(localStorage.getItem("cah_user") || "null");
        if (cached) {
          setName(cached.name || user.displayName || "");
          setPhone(cached.phone || "");
          setCompany(cached.company || "");
          setAddress(cached.address || "");
          setEmail(cached.email || user.email || "");
        }
      } catch {}
    };
    hydrate(auth.currentUser);
    const unsub = onAuthStateChanged(auth, hydrate);
    return () => unsub();
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const user = auth.currentUser;
    let appVerified = !!user?.emailVerified;
    if (!appVerified) {
      try {
        const cached = JSON.parse(localStorage.getItem("cah_user") || "null");
        appVerified = cached?.emailVerified === true && cached?.id === user?.uid;
      } catch {
        appVerified = false;
      }
    }
    if (!user || !appVerified) {
      setError("Please sign in with a verified account before submitting your course details.");
      return;
    }
    if (user.email?.trim().toLowerCase() !== email.trim().toLowerCase()) {
      setError("Use the email address linked to your signed-in account.");
      return;
    }
    if (name.trim().length < 2) { setError("Please enter your full name."); return; }
    if (phone.replace(/\D/g, "").length < 10) { setError("Please enter a valid phone number."); return; }
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/courses/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          userName: name.trim(),
          userEmail: user.email,
          courseSlug: course.slug,
          courseName: course.name,
          duration: course.duration,
          level: course.level,
          priceLabel: course.priceLabel,
          phone: phone.trim(),
          company: company.trim(),
          address: address.trim(),
          goal: goal.trim(),
          status: "Active",
          progress: 0,
          enrolledAt: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save your course details.");
      setDone(true);
      onComplete?.();
    } catch (e: any) {
      setError(e?.message || "Could not save your details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
        <h3 className="font-display text-lg font-extrabold text-emerald-900">Course Details Submitted</h3>
        <p className="text-xs text-emerald-800 mt-2">Your paid enrollment is recorded against your verified account. Civil At Hand will contact you with the next steps.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm space-y-4">
      <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
        <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center"><ShieldCheck className="h-5 w-5 text-orange-600" /></div>
        <div>
          <h3 className="font-display text-base font-extrabold text-slate-900">Complete Your Course Details</h3>
          <p className="text-[11px] text-slate-500 mt-1">This form is available only after verified payment and is linked to your signed-in account.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name *" className="rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-orange-400" required />
        <input value={email} readOnly className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-500" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number *" className="rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-orange-400" required />
        <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company / College" className="rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-orange-400" />
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="City / Address" className="sm:col-span-2 rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-orange-400" />
        <textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={4} placeholder="What do you want to achieve from this course?" className="sm:col-span-2 rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-orange-400 resize-y" />
      </div>
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">{error}</p>}
      <button type="submit" disabled={saving} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider transition-colors">
        {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving Details...</> : "Submit Course Details"}
      </button>
    </form>
  );
}
