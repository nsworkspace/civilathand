"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, CheckCircle2, Loader2, MapPin, Search, Send, ShieldCheck, Users, X } from "lucide-react";
import { generateSlug } from "@/lib/utils";

type Vendor = {
  _id: string;
  name: string;
  companyName: string;
  vendorType: string;
  category: string;
  location: string;
  description: string;
  slug?: string;
  serviceArea?: string;
  yearsExperience?: string;
};

type LeadForm = {
  name: string;
  company: string;
  phone: string;
  email: string;
  projectType: string;
  requirementLocation: string;
  timeline: string;
  budget: string;
  message: string;
  preferredContact: string;
};

const EMPTY_FORM: LeadForm = {
  name: "", company: "", phone: "", email: "", projectType: "",
  requirementLocation: "", timeline: "", budget: "", message: "", preferredContact: "Phone",
};

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [form, setForm] = useState<LeadForm>(EMPTY_FORM);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/vendors", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load vendors");
        return response.json();
      })
      .then((data) => { if (!cancelled) setVendors(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setLoadError("The vendor directory is temporarily unavailable. Please try again."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("connect");
    if (!id || !vendors.length) return;
    const vendor = vendors.find((item) => item._id === id);
    if (vendor) openConnection(vendor);
  }, [vendors]);

  const types = useMemo(() => ["All", ...Array.from(new Set(vendors.map((v) => v.vendorType).filter(Boolean)))], [vendors]);
  const categories = useMemo(() => ["All", ...Array.from(new Set(vendors.map((v) => v.category).filter(Boolean)))], [vendors]);
  const filtered = useMemo(() => vendors.filter((v) => {
    const q = search.trim().toLowerCase();
    const searchable = [v.companyName, v.name, v.vendorType, v.category, v.location, v.description, v.serviceArea].join(" ").toLowerCase();
    return (!q || searchable.includes(q)) && (type === "All" || v.vendorType === type) && (category === "All" || v.category === category);
  }), [vendors, search, type, category]);

  function openConnection(vendor: Vendor) {
    setSelected(vendor);
    setSent(false);
    setSubmitError("");
    setForm(EMPTY_FORM);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSending(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/vendors/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, vendorId: selected._id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to send request");
      setSent(true);
      setForm(EMPTY_FORM);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to send request.");
    } finally { setSending(false); }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-slate-950 px-4 py-16 text-white md:py-20">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 15% 30%,#f97316 0,transparent 28%),radial-gradient(circle at 85% 70%,#334155 0,transparent 32%)" }} />
        <div className="relative mx-auto max-w-6xl">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-xs font-black uppercase tracking-[.2em] text-orange-300">Civil At Hand · Vendor Network</span>
              <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">Find the right project partner.</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">Discover approved suppliers, contractors, fabricators and specialist service providers by capability and location.</p>
            </div>
            <Link href="/vendor-register" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-950/30 hover:bg-orange-400">List Your Business <ArrowRight size={16} /></Link>
          </div>
          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-5 py-2.5 text-sm font-bold text-emerald-300"><ShieldCheck size={17} /> Direct vendor contact details remain private</div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-8 max-w-6xl px-4">
        <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"><Stat value={vendors.length} label="Approved Partners" /><Stat value={Math.max(types.length - 1, 0)} label="Partner Types" bordered /><Stat value={Math.max(categories.length - 1, 0)} label="Capabilities" /></div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8"><div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search manpower, steel, fabrication, CCTV, contractor…" className="w-full rounded-xl bg-slate-50 py-3 pl-10 pr-4 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-orange-500" /></div><select value={type} onChange={(e) => setType(e.target.value)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"><option>All</option>{types.slice(1).map((item) => <option key={item}>{item}</option>)}</select><select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"><option>All</option>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></div></div></section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        {loading ? <div className="rounded-2xl border bg-white py-20 text-center"><Loader2 className="mx-auto animate-spin text-orange-500" /></div> : loadError ? <div className="rounded-2xl border border-rose-200 bg-white p-10 text-center text-rose-700">{loadError}</div> : filtered.length === 0 ? <div className="rounded-2xl border border-dashed bg-white py-20 text-center text-slate-500"><Users className="mx-auto mb-3 text-slate-300" /><p className="font-bold">No matching partners found.</p><p className="mt-1 text-sm">Try another capability, location or partner type.</p></div> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filtered.map((vendor) => {
          const slug = vendor.slug || generateSlug(vendor.companyName || vendor.name);
          return <article key={vendor._id} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-start justify-between gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-lg font-black text-orange-400">{(vendor.companyName || vendor.name).charAt(0).toUpperCase()}</div><span className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-black text-orange-700">{vendor.vendorType}</span></div>
            <h2 className="mt-5 text-xl font-black text-slate-950">{vendor.companyName || vendor.name}</h2><div className="mt-3 flex flex-wrap gap-1.5"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">{vendor.category || "General Services"}</span></div>
            <p className="mt-4 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">{vendor.description || "Professional project services available through Civil At Hand."}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500"><span className="inline-flex items-center gap-2"><MapPin size={15} className="text-orange-500" />{vendor.location || "India"}</span>{vendor.serviceArea && vendor.serviceArea !== vendor.location && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">Serves: {vendor.serviceArea}</span>}{vendor.yearsExperience && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">{vendor.yearsExperience}</span>}</div>
            <div className="mt-5 grid grid-cols-2 gap-2"><Link href={`/vendors/${encodeURIComponent(slug)}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-xs font-black text-slate-800 hover:border-slate-300 hover:bg-slate-50">View Profile <ArrowRight size={14} /></Link><button onClick={() => openConnection(vendor)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-3 text-xs font-black text-white hover:bg-orange-600">Connect <Send size={14} /></button></div>
          </article>;
        })}</div>}
      </section>

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-5"><div className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-5"><div><div className="text-[10px] font-black uppercase tracking-wider text-orange-600">Request Introduction</div><h3 className="mt-1 text-xl font-black text-slate-950">Connect with {selected.companyName || selected.name}</h3><p className="mt-1 text-xs text-slate-500">Tell us enough about your requirement so we can make the right introduction.</p></div><button type="button" onClick={() => setSelected(null)} className="rounded-lg p-2 hover:bg-slate-100"><X /></button></div>
        {sent ? <div className="p-10 text-center"><CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" /><h4 className="mt-4 text-xl font-black">Request received</h4><p className="mt-2 text-sm leading-6 text-slate-500">We have saved your requirement and will review it before coordinating the introduction.</p><button type="button" onClick={() => setSelected(null)} className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Done</button></div> : <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
          <FieldGroup title="Your Details" subtitle="How we should contact you."><div className="grid gap-4 sm:grid-cols-2"><Field label="Your Name" required><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className={inputClass} /></Field><Field label="Company / Organisation"><input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name (optional)" className={inputClass} /></Field><Field label="Phone" required><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Mobile number" className={inputClass} /></Field><Field label="Email" required><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@company.com" className={inputClass} /></Field></div></FieldGroup>
          <FieldGroup title="Project Requirement" subtitle="These details help us understand what you actually need."><div className="grid gap-4 sm:grid-cols-2"><Field label="Project / Work Type" required><input required value={form.projectType} onChange={(e) => setForm({ ...form, projectType: e.target.value })} placeholder="e.g. RCC work, manpower, fabrication" className={inputClass} /></Field><Field label="Project Location" required><input required value={form.requirementLocation} onChange={(e) => setForm({ ...form, requirementLocation: e.target.value })} placeholder="City / State" className={inputClass} /></Field><Field label="Expected Timeline"><select value={form.timeline} onChange={(e) => setForm({ ...form, timeline: e.target.value })} className={inputClass}><option value="">Select timeline</option><option>Immediate</option><option>Within 1 month</option><option>1–3 months</option><option>3–6 months</option><option>More than 6 months</option><option>Not decided</option></select></Field><Field label="Approx. Budget"><input value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="Optional — amount or range" className={inputClass} /></Field></div><Field label="Requirement Details" required><textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Describe the work, quantity/scope, specifications, manpower needed, material requirement, deadline, or any other important detail…" className={inputClass + " resize-y"} /></Field></FieldGroup>
          <FieldGroup title="Contact Preference" subtitle="Choose how you would like Civil At Hand to follow up."><div className="flex flex-wrap gap-2">{["Phone", "Email", "WhatsApp"].map((option) => <button key={option} type="button" onClick={() => setForm({ ...form, preferredContact: option })} className={`rounded-xl border px-4 py-2.5 text-sm font-bold ${form.preferredContact === option ? "border-orange-500 bg-orange-50 text-orange-700" : "border-slate-200 text-slate-600"}`}>{option}</button>)}</div></FieldGroup>
          {submitError && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{submitError}</div>}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600"><strong className="text-slate-900">Your information is private.</strong> We use these details to understand your requirement and coordinate an introduction. The selected vendor’s private contact details are not displayed publicly.</div>
          <button disabled={sending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3.5 font-black text-white shadow-lg shadow-orange-200 hover:bg-orange-700 disabled:opacity-60">{sending ? <Loader2 className="animate-spin" /> : <Send size={16} />} Send Introduction Request</button>
        </form>}
      </div></div>}
    </main>
  );
}

const inputClass = "w-full rounded-xl border-2 border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-100";
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-700">{label}{required && <span className="text-orange-600">*</span>}</span>{children}</label>; }
function FieldGroup({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="mb-4 border-b border-slate-100 pb-3"><h4 className="font-black text-slate-950">{title}</h4><p className="mt-1 text-xs text-slate-500">{subtitle}</p></div><div className="space-y-4">{children}</div></section>; }
function Stat({ value, label, bordered = false }: { value: number; label: string; bordered?: boolean }) { return <div className={`p-5 text-center ${bordered ? "border-x border-slate-100" : ""}`}><div className="text-2xl font-black text-slate-950">{value}</div><div className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</div></div>; }
