import type { Metadata } from "next";
import clientPromise from "@/lib/mongodb";
import { SITE } from "@/data/site";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const fallbackTitle = "NS Construction Mentorship | Civil Engineering Specialists";
  const fallbackDescription = "Universal civil engineering mentorship for exams, government careers, private-sector roles, structural design, BIM, site work, architecture and career direction.";
  try {
    const db = (await clientPromise).db(process.env.MONGODB_DB || "civil-at-hand");
    const settings = await db.collection("mentorship_settings").findOne({});
    const seo = (settings as any)?.seo || {};
    const title = String(seo.title || settings?.title || fallbackTitle).trim();
    const description = String(seo.description || settings?.subtitle || fallbackDescription).trim().slice(0, 180);
    const canonical = String(seo.canonicalUrl || `${SITE.url.replace(/\/$/, "")}/mentorship`).trim();
    const ogImage = String(seo.ogImage || "/opengraph-image").trim();
    return { title, description, keywords: Array.isArray(seo.keywords)&&seo.keywords.length?seo.keywords:["civil engineering mentorship","civil engineering career guidance","GATE mentorship","ESE IES mentorship","SSC JE mentorship","BIM mentorship","structural design mentorship"], alternates:{canonical}, robots:{index:seo.index!==false,follow:seo.follow!==false}, openGraph:{type:"website",url:canonical,title,description,siteName:SITE.name,images:[{url:ogImage,width:1200,height:630,alt:title}]}, twitter:{card:"summary_large_image",title,description,images:[ogImage]} };
  } catch { return { title:fallbackTitle, description:fallbackDescription, alternates:{canonical:`${SITE.url.replace(/\/$/,"")}/mentorship`} }; }
}
export default function MentorshipLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
