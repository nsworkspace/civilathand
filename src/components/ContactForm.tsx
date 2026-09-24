"use client";

import { useState } from "react";
import { site } from "@/data/site";

// No backend needed: the form opens the visitor's email app with the details filled in.
export default function ContactForm() {
  const [f, setF] = useState({ name: "", phone: "", service: "", message: "" });
  const set =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setF({ ...f, [k]: e.target.value });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = `Name: ${f.name}\nPhone: ${f.phone}\nService: ${f.service}\n\n${f.message}`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent("New enquiry from website - " + f.name)}&body=${encodeURIComponent(body)}`;
  }

  const input =
    "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/30";

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <input required placeholder="Your name" value={f.name} onChange={set("name")} className={input} />
      <input required placeholder="Phone number" value={f.phone} onChange={set("phone")} className={input} />
      <select value={f.service} onChange={set("service")} className={input}>
        <option value="">Select a service</option>
        <option>Structural Design</option>
        <option>Architectural Planning</option>
        <option>Construction Management</option>
        <option>Infrastructure &amp; Roads</option>
        <option>Estimation &amp; Costing</option>
        <option>Survey &amp; Consultancy</option>
      </select>
      <textarea required rows={5} placeholder="Tell us about your project" value={f.message} onChange={set("message")} className={input} />
      <button type="submit" className="w-full rounded-lg bg-navy-950 px-6 py-3 font-semibold text-white transition hover:bg-navy-800">
        Send Enquiry
      </button>
    </form>
  );
}
