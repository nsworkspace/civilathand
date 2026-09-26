"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import ShareButton from "@/components/ShareButton";
import { roleSlug } from "@/lib/careerRoles";
import {
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Clock,
  TrendingUp,
  HeartHandshake,
  GraduationCap,
  MapPin,
  Upload,
  FileText,
  Loader2,
  User,
  Mail,
  Phone,
  BookOpen,
  Award,
  Send,
  AlertCircle,
  Sparkles,
  MessageCircle,
  HelpCircle,
  Zap,
  Globe,
  Coffee,
  Target,
  Users,
  Eye,
} from "lucide-react";

type CareerRole = {
  id: string;
  title: string;
  type: string;
  location: string;
  desc: string;
  fullDetails: string;
  active: boolean;
  applyEnabled?: boolean;
  department?: string;
  workplace?: string;
  featured?: boolean;
  openings?: number | string;
  deadline?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  tags?: string[];
  skills?: string[];
  responsibilities?: string[];
  qualifications?: string[];
  benefits?: string[];
  process?: string[];
};

const defaultRoles: CareerRole[] = [
  {
    id: "role-1",
    title: "Architect",
    type: "Freelance",
    location: "Darbhanga, Bihar",
    desc: "Seeking an experienced architect in Darbhanga, Bihar, to design a simple residential house.",
    fullDetails:
      "Project Requirement: Seeking an experienced architect in Darbhanga, Bihar, to design a simple residential house.\n\nKey Responsibilities:\n• Complete architectural planning, 2D floor plans, elevations, and 3D modeling for a modern residential house.\n• On-site coordination and client consultation in Darbhanga, Bihar.\n• Ensuring structural and municipal planning compliance.\n\nQualifications & Requirements:\n• Degree/Diploma in Architecture (B.Arch / M.Arch / Diploma in Arch).\n• Proficiency in AutoCAD, Revit, SketchUp, or 3ds Max.\n• Prior experience handling complete architectural design for residential projects.",
    active: true,
    applyEnabled: true,
  },
  {
    id: "role-2",
    title: "Civil Engineering Intern",
    type: "Internship",
    location: "Remote / Pan-India",
    desc: "Learn on real engineering projects with mentorship — drafting, estimation, and BIM basics.",
    fullDetails:
      "Role Overview:\nJoin NS Construction as a Civil Engineering Intern. Gain hands-on practical exposure working alongside senior structural engineers and architects.\n\nKey Learning & Responsibilities:\n• Learn 2D drafting in AutoCAD and structural modeling basics in STAAD.Pro / ETABS.\n• Assist in BOQ quantity take-offs, Bar Bending Schedules (BBS), and design detailing.\n• Mentorship sessions, project reviews, and guidance for career & competitive exams.\n\nRequirements:\n• Pursuing or completed B.E. / B.Tech / Diploma in Civil Engineering.\n• Eagerness to learn structural detailing, drafting, and construction technologies.",
    active: true,
    applyEnabled: true,
  },
  {
    id: "role-3",
    title: "Labour Contractors",
    type: "Full-time",
    location: "Pan-India",
    desc: "Looking for Labour Contractors & Manpower Suppliers Across India for ongoing construction projects.",
    fullDetails:
      "Partnership Overview:\nSeeking experienced Labour Contractors, Civil Sub-contractors, and Manpower Suppliers to partner on ongoing residential & commercial construction projects across India.\n\nScope of Work:\n• Supply skilled, semi-skilled, and un-skilled manpower for RCC framing, masonry, plastering, shuttering, and rebar binding.\n• Execute civil execution tasks as per structural drawings and IS code standards.\n\nRequirements:\n• Registered contractor/firm with proven track record in civil building construction.\n• Ability to mobilize workforce on site with quality workmanship.",
    active: true,
    applyEnabled: true,
  },
  {
    id: "role-4",
    title: "Web Developer",
    type: "Full-time / Freelance",
    location: "Remote",
    desc: "Web development, Next.js, React, UI design, and interactive civil engineering tools.",
    fullDetails:
      "Role Overview:\nLooking for a Web Developer to design, enhance, and optimize web applications, interactive calculators, and client management portals for NS Construction.\n\nKey Responsibilities:\n• Develop responsive web applications using React, Next.js, TailwindCSS, and Node.js.\n• Integrate REST APIs, MongoDB databases, and real-time client tools.\n• Optimize web performance, UX/UI animations, and mobile responsiveness.\n\nRequirements:\n• Strong proficiency in React, Next.js, TypeScript, and modern CSS.\n• Experience with Git, API integrations, and clean code practices.",
    active: true,
    applyEnabled: true,
  },
];

const whyJoin = [
  {
    icon: TrendingUp,
    title: "Real Project Work",
    desc: "Work on live civil engineering projects, not just theory.",
  },
  {
    icon: GraduationCap,
    title: "Learn & Grow",
    desc: "Mentorship from experienced engineers and exposure to modern tools.",
  },
  {
    icon: MapPin,
    title: "Work Online",
    desc: "Remote-friendly roles — contribute from anywhere in India.",
  },
  {
    icon: HeartHandshake,
    title: "Quality Culture",
    desc: "We value accuracy, honesty, and doing engineering the right way.",
  },
];

const perks = [
  { icon: Zap, title: "Competitive Compensation", desc: "We value talent and pay accordingly." },
  { icon: Coffee, title: "Flexible Hours", desc: "Work when you're most productive." },
  { icon: Globe, title: "Remote-First", desc: "Collaborate from anywhere in India." },
  { icon: Target, title: "Professional Growth", desc: "Mentorship, courses, and real challenges." },
  { icon: Users, title: "Collaborative Culture", desc: "Teamwork, open communication, and respect." },
];

const steps = [
  { n: "1", icon: FileText, t: "Fill the form", d: "Tell us about yourself, your qualifications, and attach your resume." },
  { n: "2", icon: Users, t: "We review it", d: "If your skills match an open role, our team reaches out to you." },
  { n: "3", icon: MessageCircle, t: "Quick chat", d: "A short call or task to understand your strengths and goals." },
];

function renderFormattedText(text?: string) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={idx} className="font-extrabold text-slate-900">
          {boldText}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export default function WorkWithUsPage() {
  const [activeRoles, setActiveRoles] = useState(defaultRoles);
  const [selectedRole, setSelectedRole] = useState(defaultRoles[0]?.title || "");

  // Dynamic Options State
  const [expOptions, setExpOptions] = useState<string[]>([
    "Fresher / Entry Level (< 1 Year)",
    "1 - 3 Years",
    "3 - 5 Years",
    "5+ Years Senior",
  ]);
  const [qualOptions, setQualOptions] = useState<string[]>([
    "B.E. / B.Tech Civil Engineering",
    "M.E. / M.Tech Structural / Civil",
    "Diploma in Civil Engineering",
    "B.Arch / M.Arch",
    "CAD / BIM Certification / ITI",
    "Other Degree / Qualification",
  ]);
  const [fieldSettings, setFieldSettings] = useState({
    requireResume: true,
    showNoteField: true,
    requirePhone: true,
  });

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [experience, setExperience] = useState("Fresher / Entry Level (< 1 Year)");
  const [qualification, setQualification] = useState("B.E. / B.Tech Civil Engineering");
  const [note, setNote] = useState("");
  const [currentCity, setCurrentCity] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("");
  const [expectedCompensation, setExpectedCompensation] = useState("");
  const [skills, setSkills] = useState("");
  const [availability, setAvailability] = useState("");

  // File Upload State
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeName, setResumeName] = useState("");

  // Form submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // ─── Intersection Observer for fade-in animations ──────────────
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [visibleSections, setVisibleSections] = useState<number[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = sectionRefs.current.indexOf(entry.target as HTMLElement);
          if (entry.isIntersecting && index !== -1) {
            setVisibleSections((prev) => (prev.includes(index) ? prev : [...prev, index]));
          }
        });
      },
      { threshold: 0.1 }
    );

    sectionRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // ─── Load dynamic settings ──────────────────────────────────────
  useEffect(() => {
    const requestedRole = new URLSearchParams(window.location.search).get("role");
    fetch("/api/careers/settings", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        if (Array.isArray(data.roles) && data.roles.length > 0) {
          const active = data.roles.filter((r: any) => r.active !== false);
          setActiveRoles(active.length > 0 ? active : data.roles);
          if (active.length > 0) {
            const requested = requestedRole ? active.find((r: any) => roleSlug(r) === requestedRole) : null;
            setSelectedRole(requested?.title || active[0].title);
          }
        }
        if (Array.isArray(data.experienceOptions) && data.experienceOptions.length > 0) {
          setExpOptions(data.experienceOptions);
          setExperience(data.experienceOptions[0]);
        }
        if (Array.isArray(data.qualificationOptions) && data.qualificationOptions.length > 0) {
          setQualOptions(data.qualificationOptions);
          setQualification(data.qualificationOptions[0]);
        }
        if (data.fieldSettings) {
          setFieldSettings(data.fieldSettings);
        }
      })
      .catch((err) => console.error("Failed to load dynamic career settings:", err));
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("File size exceeds 15 MB limit. Please select a smaller resume file.");
      return;
    }

    setResumeFile(file);
    setUploadingResume(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload file");

      setResumeUrl(data.url);
      setResumeName(file.name);
    } catch (err: any) {
      console.error("Resume upload failed:", err);
      setErrorMsg(`Resume upload failed: ${err.message || err}`);
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || (fieldSettings.requirePhone && !phone.trim())) {
      setErrorMsg("Please fill in all required fields (Name, Email, and Mobile number).");
      return;
    }

    if (fieldSettings.requireResume && !resumeUrl) {
      setErrorMsg("Please attach your resume before submitting the application.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/work-with-us/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          experience,
          qualification,
          role: selectedRole,
          roleSlug: activeRoles.find((r: any) => r.title === selectedRole) ? roleSlug(activeRoles.find((r: any) => r.title === selectedRole)) : "",
          note: note.trim(),
          currentCity: currentCity.trim(),
          linkedin: linkedin.trim(),
          portfolioUrl: portfolioUrl.trim(),
          noticePeriod: noticePeriod.trim(),
          expectedCompensation: expectedCompensation.trim(),
          skills: skills.trim(),
          availability: availability.trim(),
          resumeUrl,
          resumeName: resumeName || (resumeFile ? resumeFile.name : ""),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");

      setSubmitted(true);
      // Reset form
      setName("");
      setEmail("");
      setPhone("");
      setNote("");
      setCurrentCity("");
      setLinkedin("");
      setPortfolioUrl("");
      setNoticePeriod("");
      setExpectedCompensation("");
      setSkills("");
      setAvailability("");
      setResumeFile(null);
      setResumeUrl("");
      setResumeName("");
    } catch (err: any) {
      console.error("Error submitting application:", err);
      setErrorMsg(err.message || "Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToForm = (roleTitle?: string) => {
    if (roleTitle) setSelectedRole(roleTitle);
    const element = document.getElementById("application-form-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Header />
      <main>
        <section className="bg-wix-dark text-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 md:py-20">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full bg-orange-500/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-orange-300">
                Careers at NS Construction
              </span>
              <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight md:text-6xl">
                Work With Us
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                See our current openings, choose a role, and send your CV. The application takes only a few minutes.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button type="button" onClick={() => scrollToForm()} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-orange-600">
                  View openings <ArrowRight className="h-4 w-4" />
                </button>
                <ShareButton page="/work-with-us" label="Careers at NS Construction" />
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-slate-50 py-12 md:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-orange-500">Open positions</p>
                <h2 className="mt-2 font-display text-2xl font-extrabold md:text-3xl">Find the right role</h2>
                <p className="mt-2 text-sm text-slate-500">Choose a position to see the details and apply.</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm">
                {activeRoles.length} {activeRoles.length === 1 ? "opening" : "openings"}
              </span>
            </div>

            {activeRoles.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <Briefcase className="mx-auto h-8 w-8 text-slate-300" />
                <h3 className="mt-3 font-bold text-slate-900">No current openings</h3>
                <p className="mt-1 text-sm text-slate-500">You can still submit your profile for future opportunities.</p>
                <button type="button" onClick={() => scrollToForm()} className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-orange-600">
                  Send your profile
                </button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeRoles.map((role) => (
                  <article key={role.id || roleSlug(role)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-orange-300 hover:shadow-md">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-display text-lg font-extrabold text-slate-900">{role.title}</h3>
                        <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
                          {role.type && <span className="rounded-full bg-slate-100 px-2.5 py-1">{role.type}</span>}
                          {role.location && <span className="rounded-full bg-slate-100 px-2.5 py-1">{role.location}</span>}
                        </div>
                      </div>
                      {role.featured && <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-orange-600">Featured</span>}
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-600">{role.desc}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link href={`/work-with-us/${roleSlug(role)}`} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-orange-600">
                        View details <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      {role.applyEnabled !== false && (
                        <button type="button" onClick={() => scrollToForm(role.title)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:border-orange-300 hover:text-orange-600">
                          Apply
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="application-form-section" className="scroll-mt-6 bg-white py-12 md:py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-orange-500">Simple application</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold text-slate-900">Apply in a few steps</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Required fields are marked with *. Your CV helps us review your profile faster.</p>
            </div>

            {submitted ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                <h3 className="mt-4 text-xl font-extrabold text-slate-900">Application received</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">Thank you. Our team will review your application and contact you if there is a suitable opportunity.</p>
                <button type="button" onClick={() => setSubmitted(false)} className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-orange-600">
                  Submit another application
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-7">
                {errorMsg && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{errorMsg}</div>}

                <div className="grid gap-4 md:grid-cols-2">
                  <SimpleField label="Full name *" value={name} onChange={setName} placeholder="Your full name" required />
                  <SimpleField label="Email *" value={email} onChange={setEmail} placeholder="you@example.com" type="email" required />
                  <SimpleField label={`Mobile number${fieldSettings.requirePhone ? " *" : ""}`} value={phone} onChange={setPhone} placeholder="+91 98765 43210" type="tel" required={fieldSettings.requirePhone} />
                  <div>
                    <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Position *</label>
                    <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-orange-500">
                      {activeRoles.map((r) => <option key={r.id || roleSlug(r)} value={r.title}>{r.title}</option>)}
                      {activeRoles.length === 0 && <option value="General / Other Position">General / Other Position</option>}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Experience *</label>
                    <select value={experience} onChange={(e) => setExperience(e.target.value)} required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-orange-500">
                      {expOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Qualification *</label>
                    <select value={qualification} onChange={(e) => setQualification(e.target.value)} required className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-orange-500">
                      {qualOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>

                <SimpleField label="Current city / state" value={currentCity} onChange={setCurrentCity} placeholder="e.g. Gurugram, Haryana" />

                <div>
                  <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Key skills</label>
                  <textarea value={skills} onChange={(e) => setSkills(e.target.value)} rows={3} placeholder="e.g. AutoCAD, Revit, STAAD.Pro, estimation, site supervision" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-orange-500" />
                </div>

                {fieldSettings.showNoteField && (
                  <div>
                    <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Additional professional note <span className="font-medium text-slate-400">(optional)</span></label>
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Briefly mention relevant project experience or anything important." className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-orange-500" />
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-600">Resume / CV {fieldSettings.requireResume && <span className="text-orange-500">*</span>}</label>
                  <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-5 text-center hover:border-orange-300">
                    <input id="resume-upload" type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" />
                    <label htmlFor="resume-upload" className="cursor-pointer">
                      {uploadingResume ? (
                        <span className="inline-flex items-center gap-2 text-sm font-bold text-orange-600"><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</span>
                      ) : resumeUrl ? (
                        <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700"><FileText className="h-4 w-4" /> {resumeName} <span className="text-xs font-medium text-slate-400">(replace)</span></span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-700"><Upload className="h-5 w-5 text-orange-500" /> Choose your CV</span>
                      )}
                    </label>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">PDF, DOC or DOCX · maximum 15 MB</p>
                </div>

                <button type="submit" disabled={submitting || uploadingResume} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-orange-600 disabled:opacity-50">
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : <><Send className="h-4 w-4" /> Submit application</>}
                </button>
              </form>
            )}
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50 py-10">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-extrabold text-slate-900">Have a question?</h2>
            <p className="mt-2 text-sm text-slate-500">If you need help before applying, contact our team.</p>
            <Link href="/contact" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-orange-600">
              Contact us <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function SimpleField({ label, value, onChange, placeholder, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-slate-600">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-orange-500" />
    </div>
  );
}
