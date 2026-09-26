import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { servicesData } from "@/data/services";
import { CITIES, findCity } from "@/data/cities";
import { SITE } from "@/data/site";
import clientPromise from "@/lib/mongodb";
import {
  CheckCircle2, MapPin, ArrowRight, PhoneCall, ShieldCheck, Briefcase,
} from "lucide-react";

export const revalidate = 3600; // refresh local portfolio proof hourly

const dbName = process.env.MONGODB_DB || "civil-at-hand";

interface PageProps {
  params: Promise<{ service: string; city: string }>;
}

// Pre-render every service × city combination at build time — real static
// pages Google can index, not a client-side filter on one generic page.
export async function generateStaticParams() {
  return servicesData.flatMap((service) =>
    CITIES.map((city) => ({ service: service.id, city: city.slug }))
  );
}

function getServiceAndCity(serviceSlug: string, citySlug: string) {
  const service = servicesData.find((s) => s.id === serviceSlug);
  const city = findCity(citySlug);
  return { service, city };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { service: serviceSlug, city: citySlug } = await params;
  const { service, city } = getServiceAndCity(serviceSlug, citySlug);

  if (!service || !city) {
    return { title: "Not Found" };
  }

  const title = `${service.title} Services in ${city.name} | NS Construction`;
  const description = `Looking for ${service.title.toLowerCase()} in ${city.name}, ${city.state}? NS Construction delivers IS-code compliant ${service.title.toLowerCase()} with fast turnaround, available online and on-site across ${city.name}.`;
  const url = `${SITE.url}/services/${service.id}/${city.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE.name },
  };
}

export default async function ServiceCityPage({ params }: PageProps) {
  const { service: serviceSlug, city: citySlug } = await params;
  const { service, city } = getServiceAndCity(serviceSlug, citySlug);

  if (!service || !city) {
    notFound();
  }

  // Pull real, local proof: portfolio projects whose location mentions this
  // city. Filtered server-side so the page is meaningful even with a small
  // portfolio — falls back gracefully to zero results.
  let localProjects: any[] = [];
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const all = await db.collection("portfolio").find({}).toArray();
    localProjects = all
      .filter((p: any) => (p.loc || "").toLowerCase().includes(city.name.toLowerCase()))
      .slice(0, 3)
      .map(({ _id, ...rest }: any) => rest);
  } catch (err) {
    console.error("Error loading local portfolio proof:", err);
  }

  const otherCities = CITIES.filter((c) => c.slug !== city.slug).slice(0, 8);
  const answerBox = `${SITE.name} provides ${service.title.toLowerCase()} in ${city.name} for residential, commercial and industrial projects. The scope is confirmed from the project brief, drawings, required deliverables and applicable standards. Clients can collaborate remotely and request on-site support where available.`;
  const faqItems = [
    {
      q: `What does ${service.title.toLowerCase()} in ${city.name} include?`,
      a: `${service.title} scope is defined from the project brief and can include ${service.features.slice(0, 4).join(", ")}. The final deliverables are confirmed before work starts.`,
    },
    {
      q: `Which standards apply to ${service.title.toLowerCase()} in ${city.name}?`,
      a: `The service follows the standards listed for this discipline in the NS Construction service catalogue: ${service.standards.slice(0, 4).join(", ")}. Project-specific requirements are confirmed during scope review.`,
    },
    {
      q: `How can I request a ${service.title.toLowerCase()} quote in ${city.name}?`,
      a: `Use the NS Construction Talk or Contact path and share the project type, location, approximate size, drawings if available, required deliverables and target timeline. A project-specific quotation can then be prepared.`,
    },
  ];
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Services", item: `${SITE.url}/services` },
      { "@type": "ListItem", position: 2, name: service.title, item: `${SITE.url}/services/all-services/${service.id}` },
      { "@type": "ListItem", position: 3, name: city.name, item: `${SITE.url}/services/${service.id}/${city.slug}` },
    ],
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${SITE.url}/services/${service.id}/${city.slug}#service`,
        name: `${service.title} Services in ${city.name}`,
        description: service.desc,
        provider: { "@id": `${SITE.url}/#organization` },
        areaServed: { "@type": "City", name: city.name },
        url: `${SITE.url}/services/${service.id}/${city.slug}`,
      },
      {
        "@type": "WebPage",
        url: `${SITE.url}/services/${service.id}/${city.slug}`,
        name: `${service.title} Services in ${city.name}`,
        isPartOf: { "@id": `${SITE.url}/#website` },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqItems.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
    ],
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section className="bg-navy-950 pt-32 pb-16">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-4">
              <Link href="/services/all-services" className="hover:text-orange-400">Services</Link>
              <ArrowRight className="h-3 w-3" />
              <Link href={`/services/all-services/${service.id}`} className="hover:text-orange-400">{service.title}</Link>
              <ArrowRight className="h-3 w-3" />
              <span className="text-orange-400">{city.name}</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-orange-500" />
              <span className="text-orange-400 text-xs font-bold uppercase tracking-widest">{city.name}, {city.state}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold text-white leading-tight mb-4">
              {service.title} Services in {city.name}
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl leading-relaxed mb-8">
              {service.fullDetails}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/talk"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3.5 text-xs uppercase tracking-widest rounded-lg transition-all"
              >
                <PhoneCall className="h-4 w-4" /> Get a Quote for {city.name}
              </Link>
              <Link
                href={`/services/all-services/${service.id}`}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3.5 text-xs uppercase tracking-widest rounded-lg transition-all border border-white/10"
              >
                Full Service Details
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-100 bg-orange-50 py-8">
          <div className="mx-auto max-w-5xl px-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">Direct answer</p>
            <p className="mt-2 max-w-4xl text-sm font-semibold leading-7 text-slate-800">{answerBox}</p>
          </div>
        </section>

        <section className="border-b border-slate-100 bg-white py-12">
          <div className="mx-auto max-w-5xl px-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">Frequently asked</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {faqItems.map((faq) => (
                <article key={faq.q} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h2 className="text-sm font-extrabold leading-snug text-slate-950">{faq.q}</h2>
                  <p className="mt-3 text-xs leading-6 text-slate-600">{faq.a}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Features / Standards / Deliverables */}
        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-orange-500 mb-4">What&apos;s Included</h3>
              <ul className="flex flex-col gap-3">
                {service.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-orange-500 mb-4">Standards Followed</h3>
              <ul className="flex flex-col gap-3">
                {service.standards.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <ShieldCheck className="h-4 w-4 text-navy-700 flex-shrink-0 mt-0.5" /> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-orange-500 mb-4">You&apos;ll Receive</h3>
              <ul className="flex flex-col gap-3">
                {service.deliverables.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <Briefcase className="h-4 w-4 text-navy-700 flex-shrink-0 mt-0.5" /> {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Local proof */}
        {localProjects.length > 0 && (
          <section className="py-16 bg-slate-50">
            <div className="max-w-5xl mx-auto px-4">
              <h2 className="text-xl md:text-2xl font-display font-extrabold text-navy-950 mb-8">
                Recent Work in {city.name}
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {localProjects.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/portfolio/${p.id}`}
                    className="block bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-orange-300 transition-all"
                  >
                    {p.img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.img} alt={p.title} className="w-full h-40 object-cover" />
                    )}
                    <div className="p-5">
                      <p className="text-[10px] font-extrabold uppercase tracking-wide text-orange-500 mb-1">{p.category}</p>
                      <p className="font-bold text-navy-950 text-sm mb-1">{p.title}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.loc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Other cities for this service */}
        <section className="py-16 bg-white border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-5">
              {service.title} — Also Available In
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {otherCities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/services/${service.id}/${c.slug}`}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-600 hover:border-orange-400 hover:text-orange-600 transition-all"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
