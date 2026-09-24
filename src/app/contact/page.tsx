import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import ContactForm from "@/components/ContactForm";
import { site } from "@/data/site";

export const metadata: Metadata = { title: "Contact" };

type Item = { i: string; t: string; v: string; h?: string };

export default function Contact() {
  const items: Item[] = [
    { i: "📞", t: "Phone", v: site.phone, h: `tel:${site.phone.replace(/\s/g, "")}` },
    { i: "✉️", t: "Email", v: site.email, h: `mailto:${site.email}` },
    { i: "📍", t: "Office", v: site.address },
    { i: "🕘", t: "Working hours", v: site.hours },
  ];

  return (
    <>
      <PageHero title="Contact Us" subtitle="Tell us about your project. We usually reply within one working day." />
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2">
        <div className="space-y-6">
          {items.map((c) => (
            <div key={c.t} className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-100 text-xl">{c.i}</div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-gold-600">{c.t}</div>
                {c.h ? (
                  <a href={c.h} className="text-navy-950 hover:underline">{c.v}</a>
                ) : (
                  <div className="text-navy-950">{c.v}</div>
                )}
              </div>
            </div>
          ))}
        </div>
        <ContactForm />
      </section>
    </>
  );
}
