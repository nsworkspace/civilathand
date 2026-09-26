"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, CheckCircle2, Clock, Compass, Cpu, Globe, Home as HomeIcon, Leaf, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FloatingSocials } from "@/components/FloatingSocials";
import TestimonialsSection from "@/components/TestimonialsSection";
import { useProjects } from "@/context/ProjectContext";
import { generateSlug } from "@/lib/utils";
import { servicesData } from "@/data/services";

function getServiceIcon(iconName?: string) {
  switch (iconName) {
    case "Cpu":
      return Cpu;
    case "Briefcase":
      return Briefcase;
    case "Compass":
      return Compass;
    case "HomeIcon":
      return HomeIcon;
    default:
      return Compass;
  }
}

export default function Home() {
  const { addLead, blogs, portfolio, services: contextServices } = useProjects();
  const user = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem("cah_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [service, setService] = useState("Structural Design");
  const [message, setMessage] = useState("");
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);

  const services = (contextServices?.length ? contextServices : servicesData).map((item) => ({
    id: item.id,
    title: item.title,
    desc: item.desc,
    icon: getServiceIcon(item.iconName),
  }));

  const handleContactSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setContactSubmitting(true);
    setContactError(false);
    try {
      await addLead({
        name,
        email,
        phone,
        service,
        source: "Homepage Contact Form",
        details: message,
      });
      setContactSuccess(true);
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
      window.setTimeout(() => setContactSuccess(false), 3500);
    } catch {
      setContactError(true);
      window.setTimeout(() => setContactError(false), 4500);
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-wix-dark">
      <Header />

      <main>
        <section className="relative isolate overflow-hidden bg-wix-dark text-white">
          <div className="absolute inset-0">
            <img src="/hero.jpg" alt="Civil engineering project" className="h-full w-full object-cover opacity-35" />
            <div className="absolute inset-0 bg-wix-dark/75" />
          </div>
          <div className="absolute inset-0 blueprint-grid pointer-events-none" aria-hidden="true" />

          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
            <div className="max-w-4xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-orange-400">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> Engineering made simpler
              </span>
              <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Engineering &amp; architecture
                <span className="mt-2 block text-orange-500">made simple for everyone</span>
              </h1>
              <p className="mt-6 max-w-2xl border-l-2 border-orange-500/50 pl-4 text-sm leading-7 text-slate-300 sm:text-base">
                Whether you are planning a building, checking a drawing, estimating a project or looking for the right engineering support, NS Construction helps you move from the first question to a clear next step.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/contact" className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3.5 text-xs font-extrabold uppercase tracking-widest text-white transition hover:bg-orange-600">
                  Start My Project <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/services" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-xs font-extrabold uppercase tracking-widest text-white transition hover:border-white hover:bg-white/10">
                  Explore Services <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-10 grid max-w-3xl grid-cols-1 gap-3 border-t border-white/10 pt-6 sm:grid-cols-3">
                {[
                  ["01", "Tell us what you need"],
                  ["02", "Match the right engineering service"],
                  ["03", "Move forward with confidence"],
                ].map(([step, text]) => (
                  <div key={step} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-black">{step}</span>
                    <span className="text-xs font-semibold text-slate-300">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white py-8">
          <div className="mx-auto grid max-w-7xl gap-3 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
            {[
              { icon: Clock, title: "Fast delivery", text: "Clear project-stage turnaround" },
              { icon: ShieldCheck, title: "Technical discipline", text: "Engineering-led scope and review" },
              { icon: Globe, title: "Online & on-site", text: "Support across India" },
              { icon: MessageCircle, title: "Human support", text: "Talk to the team when needed" },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><Icon className="h-4 w-4" /></span>
                <div>
                  <p className="text-xs font-black text-slate-900">{title}</p>
                  <p className="mt-0.5 text-[10px] font-medium text-slate-500">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange-600">Start here</span>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">What are you trying to do?</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">Choose the situation that sounds closest to yours and we will guide you to the right next step.</p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "I want to build or renovate", help: "Home, office, shop or development project", href: "/services", icon: HomeIcon },
                { title: "I need drawings or design", help: "Architectural, structural, CAD or BIM work", href: "/services", icon: Compass },
                { title: "I need an engineer to check something", help: "Drawing review, structural advice or site support", href: "/contact", icon: Briefcase },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.title} href={item.href} className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-white hover:shadow-lg">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm ring-1 ring-slate-200 group-hover:bg-orange-500 group-hover:text-white group-hover:ring-orange-500">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 text-sm font-extrabold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{item.help}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-orange-600">Start here <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section id="services" className="border-b border-slate-200 bg-slate-50 py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange-600">Our expertise</span>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Engineering &amp; Design Services</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">Practical civil engineering support for design, documentation, quantities, drafting, coordination and project delivery.</p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {services.slice(0, 6).map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.id} href={`/services/all-services/${item.id}`} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-orange-600 ring-1 ring-slate-200 group-hover:bg-orange-500 group-hover:text-white group-hover:ring-orange-500">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 font-display text-sm font-extrabold uppercase tracking-wide text-slate-900 group-hover:text-orange-600">{item.title}</h3>
                    <p className="mt-3 text-xs leading-6 text-slate-500">{item.desc}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-orange-600">Explore service <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-10 text-center">
              <Link href="/services" className="inline-flex items-center gap-2 rounded-xl bg-wix-dark px-6 py-3.5 text-xs font-extrabold uppercase tracking-widest text-white transition hover:bg-orange-500">
                View All Services <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white py-20 md:py-24" id="why-civil-at-hand">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:px-8">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange-600">Why NS Construction</span>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Engineering should be easier to understand and act on.</h2>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">We turn drawings, requirements, technical decisions and project questions into practical scope, clear deliverables and a direct route to the service you actually need.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  ["Clear scope", "Know what is included before work starts."],
                  ["Technical context", "See assumptions, deliverables and review points."],
                  ["Human support", "Move from a website question to a real project conversation."],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-black text-slate-900">{title}</p>
                    <p className="mt-1.5 text-[11px] leading-5 text-slate-500">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-wix-dark p-7 text-white shadow-xl md:p-9">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange-400">Project support</span>
              <h3 className="mt-3 font-display text-2xl font-extrabold">Need help deciding what comes next?</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">Tell us what you are working on, what you already have and what is unclear. We will help you identify the right engineering path.</p>
              <Link href="/contact" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 text-xs font-extrabold uppercase tracking-widest text-white transition hover:bg-orange-600">Talk to the team <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </section>

        {portfolio?.length > 0 && (
          <section className="border-b border-slate-200 bg-slate-50 py-20 md:py-24" id="portfolio">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-3xl text-center">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange-600">Our work</span>
                <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Selected Project Work</h2>
              </div>

              <div className="mt-12 grid gap-6 lg:grid-cols-2">
                {portfolio.slice(0, 4).map((project) => (
                  <article key={project.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="grid md:grid-cols-2">
                      <div className="h-56 overflow-hidden bg-slate-100 md:h-full">
                        <img src={project.img} alt={project.title} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                      </div>
                      <div className="p-6">
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-600">{project.category}</p>
                        <h3 className="mt-2 font-display text-lg font-extrabold text-slate-900">{project.title}</h3>
                        <div className="mt-4 space-y-2 text-xs text-slate-500">
                          <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{project.loc}</p>
                          <p className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" />Built Area: {project.area}</p>
                        </div>
                        <Link href={`/portfolio/${project.id}`} className="mt-6 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-orange-600">View details <ArrowRight className="h-3.5 w-3.5" /></Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        <section id="contact" className="bg-white py-20 md:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[.85fr_1.15fr] lg:px-8">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange-600">Start a conversation</span>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Tell us what you need.</h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">Share a short brief and the team can guide you toward the right service, scope and next step.</p>

              <div className="mt-8 space-y-3">
                {[
                  ["Clear brief", "Describe the project and what is blocking progress."],
                  ["Right fit", "We route your request to the relevant engineering capability."],
                  ["Practical next step", "Get a clear route forward instead of searching the whole site."],
                ].map(([title, text]) => (
                  <div key={title} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <div><p className="text-xs font-black text-slate-900">{title}</p><p className="mt-1 text-[11px] leading-5 text-slate-500">{text}</p></div>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleContactSubmit} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm md:p-8">
              {contactSuccess && <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">Thanks — your request has been sent.</div>}
              {contactError && <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800">Something went wrong. Please try again.</div>}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block"><span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Name</span><input value={name} onChange={(e) => setName(e.target.value)} required className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label>
                <label className="block"><span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block"><span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Phone</span><input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label>
                <label className="block"><span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Service</span><select value={service} onChange={(e) => setService(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">{services.map((item) => <option key={item.id} value={item.title}>{item.title}</option>)}</select></label>
              </div>
              <label className="mt-4 block"><span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Project / question</span><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} required className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></label>
              <button disabled={contactSubmitting} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-wix-dark px-5 text-xs font-extrabold uppercase tracking-widest text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60">
                {contactSubmitting ? "Sending…" : "Send Consultation Request"} <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>

        {blogs?.some((post) => post.status === "published") && (
          <section className="border-t border-white/10 bg-wix-dark py-20 text-white md:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-3xl text-center">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange-400">Our blogs</span>
                <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Latest Engineering Insights</h2>
              </div>

              <div className="mt-12 grid gap-6 md:grid-cols-3">
                {blogs.filter((post) => post.status === "published").slice(0, 3).map((post) => (
                  <article key={post.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    <div className="h-44 overflow-hidden bg-slate-900"><img src={post.image} alt={post.title} className="h-full w-full object-cover" /></div>
                    <div className="p-5">
                      <div className="flex gap-2 text-[9px] font-bold uppercase tracking-widest text-slate-400"><span>{post.date}</span><span>•</span><span>{post.author}</span></div>
                      <h3 className="mt-3 line-clamp-2 font-display text-base font-extrabold text-white">{post.title}</h3>
                      <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-300">{post.summary}</p>
                      <Link href={`/blog/${post.slug || generateSlug(post.title)}`} className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-orange-400">Read post <ArrowRight className="h-3.5 w-3.5" /></Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="bg-slate-950 py-10 text-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-[1fr_auto] md:items-center lg:px-8">
            <div>
              <div className="flex items-center gap-2 text-orange-400"><Leaf className="h-4 w-4" /><span className="text-[10px] font-extrabold uppercase tracking-[0.18em]">Sustainability</span></div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Smarter design, lower material waste and practical sustainability can be part of the engineering brief when the project calls for it.</p>
            </div>
            <Link href="/sustainability" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-xs font-extrabold uppercase tracking-widest text-white transition hover:bg-white/10">Learn more <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>

      <TestimonialsSection />
      <Footer />
      <FloatingSocials />
    </div>
  );
}
