import { ArrowLeft, ArrowRight, CheckCircle2, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { generateSlug } from "@/lib/utils";
import clientPromise from "@/lib/mongodb";
import { SITE } from "@/data/site";

export const dynamic = "force-dynamic";

async function getVendor(slug: string) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || "civil-at-hand");
  const vendors = await db.collection("vendors").find({ $or: [{ isActive: true }, { approved: true }, { status: "approved" }] }).project({ _id: 1, name: 1, companyName: 1, vendorType: 1, category: 1, location: 1, description: 1, designation: 1, yearsExperience: 1, serviceArea: 1, keyServices: 1, slug: 1, updatedAt: 1, createdAt: 1 }).toArray();
  return vendors.find((vendor) => String(vendor.slug || generateSlug(String(vendor.companyName || vendor.name))) === slug || generateSlug(String(vendor.companyName || vendor.name)) === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vendor = await getVendor(slug);
  if (!vendor) return { title: "Vendor Not Found | Civil At Hand", robots: { index: false, follow: true } };
  const name = String(vendor.companyName || vendor.name);
  const capability = String(vendor.category || vendor.vendorType || "Project Services");
  const location = String(vendor.location || "India");
  return {
    title: `${name} | ${capability} | Civil At Hand`,
    description: `${name} — ${capability} in ${location}. Discover the business profile and request a project introduction through Civil At Hand.`,
    alternates: { canonical: `${SITE.url.replace(/\/$/, "")}/vendors/${encodeURIComponent(slug)}` },
    robots: { index: true, follow: true },
  };
}

export default async function VendorDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vendor = await getVendor(slug);
  if (!vendor) notFound();

  const name = String(vendor.companyName || vendor.name);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    description: vendor.description || `${vendor.category || vendor.vendorType} services listed on Civil At Hand.`,
    areaServed: vendor.location || "India",
    url: `${SITE.url.replace(/\/$/, "")}/vendors/${encodeURIComponent(slug)}`,
  };

  return <main className="min-h-screen bg-slate-50"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <section className="bg-slate-950 px-4 py-7 text-white"><div className="mx-auto max-w-5xl"><Link href="/vendors" className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white"><ArrowLeft size={16} /> Vendor Directory</Link></div></section>
    <section className="bg-slate-950 px-4 pb-16 text-white"><div className="mx-auto max-w-5xl"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-black text-orange-300">{vendor.vendorType}</span>{vendor.category && <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-200">{vendor.category}</span>}</div><h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">{name}</h1><p className="mt-3 text-lg text-slate-300">Professional project partner listed on the Civil At Hand network.</p><div className="mt-6 flex items-center gap-2 text-slate-300"><MapPin size={18} className="text-orange-400" />{vendor.location || "India"}</div></div></section>
    <section className="mx-auto max-w-5xl px-4 py-10"><div className="grid gap-6 md:grid-cols-[1fr_320px]"><article className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"><div className="mb-7 flex items-center gap-3"><div className="rounded-xl bg-emerald-50 p-3"><ShieldCheck className="text-emerald-600" /></div><div><h2 className="font-black text-slate-900">Business Overview</h2><p className="text-xs text-slate-500">Public business information only</p></div></div><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Primary Capability</p><p className="mt-2 font-bold text-slate-900">{vendor.category || "General Project Services"}</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Service Location</p><p className="mt-2 font-bold text-slate-900">{vendor.location || "India"}</p></div>{vendor.serviceArea && vendor.serviceArea !== vendor.location && <div className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Service Coverage</p><p className="mt-2 font-bold text-slate-900">{vendor.serviceArea}</p></div>}{vendor.yearsExperience && <div className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Experience</p><p className="mt-2 font-bold text-slate-900">{vendor.yearsExperience}</p></div>}{Array.isArray(vendor.portfolio) && vendor.portfolio.length > 0 && <div className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Portfolio</p><p className="mt-2 font-bold text-slate-900">{vendor.portfolio.length} item{vendor.portfolio.length === 1 ? "" : "s"} available</p></div>}</div><div className="mt-8 border-t pt-7"><h2 className="text-xl font-black text-slate-950">About the Business</h2><p className="mt-3 whitespace-pre-wrap leading-8 text-slate-600">{vendor.description || "Business capabilities and project services are available through Civil At Hand for relevant requirements."}</p>{vendor.keyServices && <div className="mt-7 rounded-xl border border-orange-100 bg-orange-50/60 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-orange-700">Key Services</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{vendor.keyServices}</p></div>}</div></article>
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><CheckCircle2 className="mb-3 text-emerald-600" /><h2 className="text-lg font-black text-slate-900">Need this partner?</h2><p className="mt-2 text-sm leading-6 text-slate-500">Vendor phone, email and address are kept private. Submit your requirement and Civil At Hand will coordinate the introduction.</p><Link href={`/vendors?connect=${vendor._id}`} className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-orange-600">Request Introduction <ArrowRight size={15} /></Link><Link href="/vendor-register" className="mt-2 flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-700 hover:bg-slate-50">List Your Business</Link></aside>
    </div></section>
  </main>;
}
