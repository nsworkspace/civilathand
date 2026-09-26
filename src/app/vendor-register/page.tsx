"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  FileText,
  Globe2,
  IndianRupee,
  Link as LinkIcon,
  Loader2,
  LockKeyhole,
  SearchCheck,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import PaymentButton from "@/components/payments/PaymentButton";

type PortfolioItem = { type: "file" | "link"; url: string; name: string };

const initialForm = {
  name: "",
  designation: "",
  companyName: "",
  vendorType: "Supplier",
  category: "",
  location: "",
  serviceArea: "",
  yearsExperience: "",
  teamSize: "",
  gstin: "",
  address: "",
  description: "",
  keyServices: "",
  projectExperience: "",
  phone_hidden: "",
  email_hidden: "",
  website: "",
  portfolio: [] as PortfolioItem[],
  registrationFeeAcknowledged: false,
  noWorkGuaranteeAcknowledged: false,
  commissionTermsAcknowledged: false,
  searchVisibilityAcknowledged: false,
  accuracyAcknowledged: false,
};

const vendorTypes = ["Supplier", "Contractor", "Fabricator", "Labour", "Mason", "Consultant", "Service Provider", "Other"];

export default function VendorRegisterPage() {
  const [form, setForm] = useState(initialForm);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [feePaid, setFeePaid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showGuidance, setShowGuidance] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [reviewAttempted, setReviewAttempted] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (user) => {
    setAuthUser(user);
    setAuthReady(true);
    if (user?.email) setForm((current) => ({ ...current, email_hidden: user.email || current.email_hidden }));
  }), []);

  const update = (key: keyof typeof initialForm, value: string | boolean | PortfolioItem[]) => setForm((current) => ({ ...current, [key]: value }));
  const completedRequired = useMemo(() => [form.name, form.companyName, form.category, form.location, form.serviceArea, form.description, form.phone_hidden, form.email_hidden].every(Boolean), [form]);
  const acknowledgementsComplete = form.registrationFeeAcknowledged && form.noWorkGuaranteeAcknowledged && form.commissionTermsAcknowledged && form.searchVisibilityAcknowledged && form.accuracyAcknowledged;
  const profileProgress = useMemo(() => {
    const fields = [form.name, form.companyName, form.category, form.location, form.serviceArea, form.description, form.phone_hidden, form.email_hidden];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [form]);

  const openReview = () => {
    setError(""); setReviewAttempted(true);
    if (!authUser?.emailVerified) return setError("Please sign in with a verified NS Construction account before continuing.");
    if (!feePaid) return setError("Complete the registration payment first.");
    if (!completedRequired) return setError("Please complete the fields marked Required.");
    if (!acknowledgementsComplete) return setError("Please confirm all registration terms before submitting.");
    setShowReview(true);
  };

  const uploadPortfolio = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!authUser) return setError("Please sign in before uploading portfolio material.");
    if ((form.portfolio || []).length >= 8) return setError("You can add up to 8 portfolio items.");
    setUploading(true); setError("");
    try {
      const token = await authUser.getIdToken(true);
      const body = new FormData(); body.append("file", file);
      const response = await fetch("/api/vendors/portfolio-upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Portfolio upload failed.");
      setForm((current) => ({ ...current, portfolio: [...current.portfolio, data.item] }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Portfolio upload failed.");
    } finally { setUploading(false); }
  };

  const addPortfolioLink = () => {
    const url = window.prompt("Enter your public HTTPS portfolio / project link:");
    if (!url?.trim()) return;
    if (!/^https:\/\/[^\s]+$/i.test(url.trim())) return setError("Portfolio links must use HTTPS.");
    const name = window.prompt("Give this portfolio item a short name:", "Project Portfolio") || "Portfolio Link";
    setForm((current) => ({ ...current, portfolio: [...current.portfolio, { type: "link", url: url.trim(), name: name.trim().slice(0, 100) || "Portfolio Link" }] }));
  };

  const submit = async (event?: React.FormEvent) => {
    event?.preventDefault(); setError("");
    if (!authUser?.emailVerified) return setError("Please sign in with a verified NS Construction account before submitting.");
    if (!feePaid) return setError("Please complete the vendor registration payment before submitting.");
    if (!completedRequired) return setError("Please complete the fields marked Required.");
    if (!acknowledgementsComplete) return setError("Please read and accept all registration confirmations before submitting.");
    setLoading(true);
    try {
      const token = await authUser.getIdToken(true);
      const response = await fetch("/api/vendors/register", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Registration failed. Please try again.");
      setSuccess(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  if (success) return <main className="min-h-screen bg-slate-950 p-4 flex items-center justify-center"><div className="w-full max-w-xl rounded-[2rem] bg-white p-9 text-center shadow-2xl"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50"><CheckCircle className="h-9 w-9 text-emerald-600" /></div><p className="mt-6 text-xs font-black uppercase tracking-[.22em] text-orange-600">NS Construction Vendor Network</p><h1 className="mt-2 text-3xl font-black text-slate-950">Profile Submitted for Review</h1><p className="mt-4 text-sm leading-7 text-slate-600">Thank you for registering. Your business information has been securely recorded. Approval is handled by NS Construction before your profile is published in the vendor network.</p><div className="mt-7 grid gap-3 sm:grid-cols-2"><a href="/vendors" className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-orange-600">Browse Vendor Network</a><a href="/" className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">Back to NS Construction</a></div></div></main>;

  return <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#f7f8fb] text-slate-900">
    <section className="relative w-full overflow-hidden bg-slate-950 px-4 py-10 text-white sm:px-6 sm:py-14 md:py-20"><div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 12% 20%,#f97316 0,transparent 25%),radial-gradient(circle at 90% 80%,#475569 0,transparent 28%)" }} /><div className="relative mx-auto w-full max-w-6xl min-w-0"><div className="flex flex-wrap items-center justify-between gap-4"><div className="inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-500/10 px-4 py-2 text-xs font-black uppercase tracking-[.18em] text-orange-300"><BadgeCheck size={15} /> NS Construction Vendor Network</div><a href="/vendors" className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-black text-slate-200 hover:bg-white/10">Explore Approved Vendors</a></div><div className="mt-7 max-w-4xl min-w-0"><h1 className="break-words text-3xl font-black leading-[1.08] tracking-tight sm:text-4xl md:text-6xl">Register your business in a few simple steps.</h1><p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7 md:text-lg md:leading-8">Tell us who you are, what work you do and where you work. We will guide you through the rest.</p></div><div className="mt-8 grid gap-3 sm:grid-cols-3"><HeroPoint icon={<SearchCheck />} title="Be found" text="Your approved business profile can be found by people looking for your type of work." /><HeroPoint icon={<ShieldCheck />} title="Your details stay private" text="Your direct phone, email and full address are not shown on the public vendor profile." /><HeroPoint icon={<Users />} title="Relevant work" text="When a suitable requirement comes in, NS Construction may connect you with the opportunity." /></div></div></section>

    <section className="mx-auto w-full max-w-6xl min-w-0 px-3 py-5 sm:px-4 sm:py-8 md:py-10"><div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 sm:rounded-[1.75rem]">
        <div className="border-b border-slate-200 p-4 sm:p-6 md:p-8"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-orange-600">Vendor registration</p><p className="mt-2 text-xs font-bold text-slate-500">Simple 4-step process · Business → Work → Contact → Review</p><h2 className="mt-1 text-2xl font-black md:text-3xl">Create your business profile</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">A professional listing begins with accurate business information. You remain in control of your private contact details while NS Construction handles relevant project introductions.</p></div><div className="rounded-2xl bg-slate-950 px-4 py-3 text-right text-white"><p className="text-[10px] font-black uppercase tracking-wider text-orange-300">1. Sign in and pay</p><p className="mt-1 text-sm font-black">Payment → Profile → Review → Publish</p></div></div></div>

        <div className="p-4 sm:p-6 md:p-8">
          {!authReady ? <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600"><Loader2 className="mr-2 inline animate-spin" size={16} />Preparing secure registration…</div> : <div className="min-w-0 rounded-2xl border border-orange-200 bg-orange-50/70 p-4 sm:p-5"><div className="flex min-w-0 items-start gap-3"><div className="shrink-0 rounded-xl bg-white p-2.5 text-orange-600 shadow-sm"><IndianRupee size={19} /></div><div className="min-w-0 flex-1"><p className="text-xs font-black uppercase tracking-wider text-orange-700">Step 1 · Registration fee</p><h3 className="mt-1 text-lg font-black text-slate-950">Pay the registration fee</h3><p className="mt-2 text-sm leading-6 text-slate-600">The registration fee is a listing and onboarding fee for the NS Construction Vendor Network. <strong>Payment does not guarantee projects, enquiries, contracts or work.</strong> Approval and project introductions depend on profile quality, client requirements and our team's review.</p><div className="mt-4 rounded-xl bg-white/80 p-3 text-xs leading-5 text-slate-600"><strong className="text-slate-900">Commercial terms:</strong> when NS Construction successfully facilitates a client-to-vendor opportunity, a vendor-side commission or service fee may apply as agreed for that engagement. The applicable terms are communicated before the engagement proceeds.</div><div className="mt-4"><PaymentButton itemSlug="vendor-registration" showDetails={true} onUnlocked={() => setFeePaid(true)} className="max-w-none" /></div></div></div></div>}

          {feePaid && <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" /><div><p className="text-xs font-black uppercase tracking-wider text-emerald-700">Step 2 · Profile unlocked</p><h3 className="mt-1 font-black text-emerald-950">Complete your business information</h3><p className="mt-1 text-sm leading-6 text-emerald-800">Provide accurate information so your profile can be reviewed, categorized and matched to relevant requirements.</p></div></div></div>}

          {feePaid && <form onSubmit={submit} className="mt-6 min-w-0 space-y-5 sm:mt-7 sm:space-y-7">
            {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}
            <div className="mb-4 rounded-2xl border-2 border-orange-100 bg-orange-50/70 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-orange-600 p-2 text-white"><FileText size={15} /></div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[.14em] text-orange-700">How to fill this form</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">Complete the fields marked <span className="font-black text-orange-700">Required</span>. Optional fields can be added when they strengthen your business profile. Use clear, accurate business information.</p>
                </div>
              </div>
            </div>
            <FormSection icon={<Building2 />} title="About your business" subtitle="Tell clients what kind of business you operate and what you are equipped to deliver."><div className="grid min-w-0 gap-4 sm:gap-5 md:grid-cols-2"><Field label="Vendor Type *"><select value={form.vendorType} onChange={(e) => update("vendorType", e.target.value)} className="block min-h-12 w-full min-w-0 rounded-xl border-2 border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500">{vendorTypes.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Contact Name *"><input required value={form.name} onChange={(e) => update("name", e.target.value)} className="block min-h-12 w-full min-w-0 rounded-xl border-2 border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500" placeholder="Full name" /></Field><Field label="Designation"><input value={form.designation} onChange={(e) => update("designation", e.target.value)} className="block min-h-12 w-full min-w-0 rounded-xl border-2 border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500" placeholder="Owner, Director, Manager…" /></Field><Field label="Company / Business Name *"><input required value={form.companyName} onChange={(e) => update("companyName", e.target.value)} className="block min-h-12 w-full min-w-0 rounded-xl border-2 border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500" placeholder="Registered or trading name" /></Field><Field label="Primary Service / Category *"><input required value={form.category} onChange={(e) => update("category", e.target.value)} className="block min-h-12 w-full min-w-0 rounded-xl border-2 border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500" placeholder="Steel fabrication, manpower, RCC, MEP…" /></Field><Field label="City / State *"><input required value={form.location} onChange={(e) => update("location", e.target.value)} className="block min-h-12 w-full min-w-0 rounded-xl border-2 border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500" placeholder="City, State" /></Field><Field label="Service Coverage *"><input required value={form.serviceArea} onChange={(e) => update("serviceArea", e.target.value)} className="block min-h-12 w-full min-w-0 rounded-xl border-2 border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500" placeholder="Bihar, Odisha, North East, Pan India…" /></Field><Field label="Years of Experience"><input value={form.yearsExperience} onChange={(e) => update("yearsExperience", e.target.value)} className="block min-h-12 w-full min-w-0 rounded-xl border-2 border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500" placeholder="e.g. 12 years" /></Field><Field label="Team / Workforce Size"><input value={form.teamSize} onChange={(e) => update("teamSize", e.target.value)} className="block min-h-12 w-full min-w-0 rounded-xl border-2 border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500" placeholder="e.g. 25 skilled + 40 labour" /></Field><Field label="GSTIN (if applicable)"><input value={form.gstin} onChange={(e) => update("gstin", e.target.value.toUpperCase())} className="block min-h-12 w-full min-w-0 rounded-xl border-2 border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500" placeholder="GSTIN, if available" /></Field><Field label="Website"><div className="relative"><Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="url" value={form.website} onChange={(e) => update("website", e.target.value)} className="block min-h-12 w-full min-w-0 rounded-xl border-2 border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 pl-10" placeholder="https://example.com" /></div></Field></div></FormSection>

            <FormSection icon={<FileText />} title="What work do you do?" subtitle="This information helps NS Construction categorize your profile and present it clearly to project buyers."><div className="grid min-w-0 gap-4 sm:gap-5"><Field label="Business Description *"><textarea required rows={5} value={form.description} onChange={(e) => update("description", e.target.value)} className="block min-h-12 w-full min-w-0 rounded-xl border-2 border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 min-h-32 resize-y" placeholder="Describe your core capabilities, project types, industries served and what you can execute." /></Field><Field label="Key Services"><textarea rows={4} value={form.keyServices} onChange={(e) => update("keyServices", e.target.value)} className="block min-h-12 w-full min-w-0 rounded-xl border-2 border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 min-h-32 resize-y" placeholder="List your main services separated by commas." /></Field><Field label="Relevant Project Experience"><textarea rows={4} value={form.projectExperience} onChange={(e) => update("projectExperience", e.target.value)} className="block min-h-12 w-full min-w-0 rounded-xl border-2 border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 min-h-32 resize-y" placeholder="Mention notable project types, sectors, capacities or locations. Do not include confidential client information." /></Field></div></FormSection>

            <FormSection icon={<LockKeyhole />} title="Your private contact details" subtitle="These details are stored for verification and coordination. They are not displayed on the public vendor directory." privateLabel><div className="grid min-w-0 gap-4 sm:gap-5 md:grid-cols-2"><Field label="Phone Number *"><input required type="tel" value={form.phone_hidden} onChange={(e) => update("phone_hidden", e.target.value)} className="block min-h-12 w-full min-w-0 rounded-xl border-2 border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500" placeholder="+91…" /></Field><Field label="Verified Account Email *"><input required type="email" value={form.email_hidden} readOnly className="block min-h-12 w-full min-w-0 rounded-xl border-2 border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 bg-slate-50" /></Field><Field label="Full Business Address" full><textarea rows={3} value={form.address} onChange={(e) => update("address", e.target.value)} className="block min-h-12 w-full min-w-0 rounded-xl border-2 border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 min-h-32 resize-y" placeholder="Office / business address" /></Field></div></FormSection>

            <FormSection icon={<Upload />} title="Your past work" subtitle="Add up to 8 PDF/image files or public HTTPS links. Strong portfolios help our team review your details and present your capabilities more effectively."><div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-black text-white hover:bg-orange-600"><Upload size={15} />{uploading ? "Uploading…" : "Upload Portfolio"}<input type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={uploadPortfolio} disabled={uploading || form.portfolio.length >= 8} className="hidden" /></label><button type="button" onClick={addPortfolioLink} disabled={form.portfolio.length >= 8} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50"><LinkIcon size={15} /> Add Portfolio Link</button><span className="self-center text-xs font-semibold text-slate-400">{form.portfolio.length}/8 items</span></div>{form.portfolio.length > 0 ? <div className="mt-4 grid min-w-0 gap-2 md:grid-cols-2">{form.portfolio.map((item, index) => <div key={`${item.url}-${index}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="rounded-lg bg-white p-2"><FileText size={15} className="text-orange-600" /></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-black text-slate-800">{item.name}</p><p className="truncate text-[10px] text-slate-400">{item.type === "file" ? "Uploaded file" : item.url}</p></div><button type="button" onClick={() => update("portfolio", form.portfolio.filter((_, i) => i !== index))} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"><Trash2 size={15} /></button></div>)}</div> : <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-center text-xs text-slate-400">No portfolio material added yet.</div>}</FormSection>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><p className="text-xs font-black uppercase tracking-wider text-slate-500">Before you submit</p><div className="mt-4 space-y-3"><Agreement checked={form.registrationFeeAcknowledged} onChange={(v) => update("registrationFeeAcknowledged", v)} text="I understand that the registration fee is for onboarding/listing in the NS Construction Vendor Network and does not guarantee any work, project, enquiry, contract or revenue." /><Agreement checked={form.searchVisibilityAcknowledged} onChange={(v) => update("searchVisibilityAcknowledged", v)} text="I understand that, after approval, selected business information may be published on NS Construction and may be discoverable by search engines, subject to search-engine indexing." /><Agreement checked={form.commissionTermsAcknowledged} onChange={(v) => update("commissionTermsAcknowledged", v)} text="I understand that if NS Construction facilitates a client-to-vendor opportunity, a vendor-side commission or service fee may apply under the commercial terms agreed for that engagement." /><Agreement checked={form.noWorkGuaranteeAcknowledged} onChange={(v) => update("noWorkGuaranteeAcknowledged", v)} text="I understand that NS Construction reviews vendor profiles and facilitates relevant opportunities, but client selection, project award and engagement decisions remain with the parties involved." /><Agreement checked={form.accuracyAcknowledged} onChange={(v) => update("accuracyAcknowledged", v)} text="I confirm that the information and documents submitted are accurate to the best of my knowledge and that I have authority to represent this business." /></div></div>

            <div className="rounded-2xl bg-slate-950 p-5 text-white"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-orange-400" /><div><p className="font-black">Private by design</p><p className="mt-1 text-xs leading-5 text-slate-300">Your phone, email and full address are kept out of the public vendor directory. NS Construction uses these details for verification, internal coordination and introductions.</p></div></div></div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="text-xs font-black uppercase tracking-[.16em] text-slate-500">Final check</p><p className="mt-1 text-sm font-bold text-slate-900">Review everything once before you submit.</p></div>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">{profileProgress}% profile complete</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${profileProgress}%` }} /></div>
              {reviewAttempted && (!completedRequired || !acknowledgementsComplete) && <p className="mt-3 text-xs font-semibold text-rose-600">Please complete the missing required fields and confirmations. Nothing is submitted from this button until you review the final summary.</p>}
              <button type="button" onClick={openReview} disabled={loading || uploading || !feePaid} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 text-sm font-black text-white shadow-lg shadow-orange-200 hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50">Review & Submit Registration <ArrowRight size={17} /></button>
              <p className="mt-3 text-center text-xs leading-5 text-slate-400">Approval is required before your business profile becomes publicly visible. Registration does not guarantee work.</p>
            </div>
          </form>}
        </div>
      </div>

      <aside className="space-y-5"><div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg sm:rounded-[1.75rem] sm:p-6 xl:sticky xl:top-5"><p className="text-xs font-black uppercase tracking-[.18em] text-orange-600">How vendor registration works</p><div className="mt-5 space-y-5"><Step n="01" title="1. Sign in and pay" text="Sign in with a verified account and complete the registration payment shown at checkout." /><Step n="02" title="2. Tell us about your business" text="Provide accurate capabilities, service coverage, experience and portfolio material." /><Step n="03" title="3. We review your details" text="Our team reviews the information before publishing the profile." /><Step n="04" title="4. Your approved profile can be found" text="Approved business information can be discoverable through the NS Construction website and search engines." /><Step n="05" title="5. We may connect relevant work" text="When a relevant client requirement comes in, NS Construction can coordinate an introduction while keeping direct contact details protected." /></div><a href="/vendors" className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-700 hover:bg-slate-50">View Approved Network <ChevronRight size={15} /></a></div></aside>
    </div></section>

    {showReview && <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-slate-950/80 p-2 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="my-2 flex w-full max-w-2xl max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:my-4 sm:max-h-[calc(100dvh-2rem)] sm:rounded-[2rem]">
        <div className="shrink-0 bg-slate-950 p-5 text-white sm:p-7"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.18em] text-orange-400">Final review</p><h2 className="mt-2 text-xl font-black sm:text-2xl">Everything looks ready?</h2><p className="mt-2 text-xs leading-5 text-slate-300">Check the key details below. You can close this window and edit anything before submitting.</p></div><button type="button" onClick={() => setShowReview(false)} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X /></button></div></div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
          <div className="grid gap-3 sm:grid-cols-2">
            <ReviewItem label="Business" value={form.companyName || "Not provided"} />
            <ReviewItem label="Vendor type" value={form.vendorType || "Not provided"} />
            <ReviewItem label="Primary category" value={form.category || "Not provided"} />
            <ReviewItem label="Location" value={form.location || "Not provided"} />
            <ReviewItem label="Service coverage" value={form.serviceArea || "Not provided"} />
            <ReviewItem label="Contact person" value={`${form.name || "Not provided"}${form.designation ? ` · ${form.designation}` : ""}`} />
            <ReviewItem label="Portfolio" value={`${form.portfolio.length} item${form.portfolio.length === 1 ? "" : "s"} added`} />
            <ReviewItem label="Registration status" value="Payment completed · Ready for submission" />
          </div>
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-black uppercase tracking-wider text-amber-800">Before you submit</p><ul className="mt-2 space-y-1.5 text-xs leading-5 text-amber-900"><li>• The registration fee covers onboarding/listing and is not a guarantee of work.</li><li>• Approval is required before public publication.</li><li>• Search visibility depends on search-engine indexing and ranking.</li><li>• A vendor-side commission/service fee may apply when a client opportunity is successfully facilitated, according to agreed terms.</li><li>• Your direct phone, email and full address remain private on the public directory.</li></ul></div>
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={19} /><p className="text-xs leading-5 text-emerald-900">All required confirmations are complete. By submitting, you confirm that the business information is accurate and that you are authorized to represent the business.</p></div>
        </div>
        <div className="shrink-0 border-t border-slate-200 bg-white p-4 sm:p-5"><div className="grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => setShowReview(false)} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50">Go Back & Edit</button><button type="button" onClick={() => { setShowReview(false); void submit(); }} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-black text-white hover:bg-orange-700 disabled:opacity-50">{loading ? <><Loader2 className="animate-spin" size={16} />Submitting…</> : <>Confirm & Submit <ArrowRight size={16} /></>}</button></div></div>
      </div>
    </div>}

    {showGuidance && <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/75 p-2 backdrop-blur-sm sm:items-center sm:p-4"><div className="my-2 flex w-full max-w-2xl max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:my-4 sm:max-h-[calc(100dvh-2rem)] sm:rounded-[2rem]"><div className="shrink-0 bg-slate-950 p-5 text-white sm:p-7"><div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-black uppercase tracking-[.18em] text-orange-400">Important registration information</p><h2 className="mt-2 break-words text-xl font-black sm:text-2xl">Please understand the model before you register.</h2></div><button onClick={() => setShowGuidance(false)} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X /></button></div></div><div className="min-h-0 flex-1 overflow-y-auto space-y-4 p-5 text-sm leading-6 text-slate-600 sm:p-7"><InfoRow title="Registration fee" text="The fee is for vendor registration and onboarding/listing in the NS Construction network. It is not a payment for guaranteed work or guaranteed client enquiries." /><InfoRow title="Search visibility" text="After approval, selected business information may be published and may appear in search-engine results. Search ranking and indexing are controlled by search engines and cannot be guaranteed." /><InfoRow title="Client introductions" text="NS Construction can connect relevant client requirements with suitable listed vendors. A client remains free to select the vendor that best meets its requirements." /><InfoRow title="Vendor-side commercial terms" text="Where NS Construction successfully facilitates a client-to-vendor opportunity, a vendor-side commission or service fee may apply under terms agreed for that engagement before it proceeds." /><InfoRow title="Private information" text="Your direct phone, email and full address are kept private and are not displayed on the public vendor directory." /><button onClick={() => setShowGuidance(false)} className="mt-2 w-full rounded-xl bg-orange-600 py-3.5 font-black text-white hover:bg-orange-700">I Understand — Continue</button></div></div></div>}
  </main>;
}

function HeroPoint({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"><div className="flex items-center gap-2 text-orange-300">{icon}<span className="text-xs font-black">{title}</span></div><p className="mt-2 text-xs leading-5 text-slate-400">{text}</p></div>; }
function FormSection({ icon, title, subtitle, children, privateLabel = false }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode; privateLabel?: boolean }) { return <section className="min-w-0 rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm sm:p-5 md:p-6"><div className="mb-5 flex items-start gap-3"><div className="rounded-xl bg-orange-50 p-2.5 text-orange-600">{icon}</div><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-slate-950">{title}</h3>{privateLabel && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-500">Private</span>}</div><p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p></div></div>{children}</section>; }
function Field({ label, children, full = false }: { label: string; children: React.ReactNode; full?: boolean }) {
  const required = label.endsWith(" *");
  const cleanLabel = required ? label.slice(0, -2) : label;
  return <label className={full ? "block min-w-0" : "block min-w-0"}>
    <span className="mb-2 flex min-h-5 items-center justify-between gap-2 text-xs font-extrabold text-slate-800">
      <span>{cleanLabel}</span>
      {required ? <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-orange-700">Required</span> : <span className="text-[10px] font-semibold text-slate-400">Optional</span>}
    </span>
    {children}
  </label>;
}
function Agreement({ checked, onChange, text }: { checked: boolean; onChange: (value: boolean) => void; text: string }) { return <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-orange-200"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4 accent-orange-600" /><span className="text-xs leading-5 text-slate-600">{text}</span></label>; }
function Step({ n, title, text }: { n: string; title: string; text: string }) { return <div className="flex gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-[10px] font-black text-orange-400">{n}</div><div><p className="text-sm font-black text-slate-900">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div></div>; }
function ReviewItem({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 break-words text-sm font-bold text-slate-900">{value}</p></div>; }
function InfoRow({ title, text }: { title: string; text: string }) { return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="font-black text-slate-900">{title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{text}</p></div>; }
