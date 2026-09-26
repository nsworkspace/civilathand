import type { Metadata } from "next";
import type { ReactNode } from "react";
import clientPromise from "@/lib/mongodb";
import { SITE } from "@/data/site";

const SITE_URL = SITE.url;
const dbName = process.env.MONGODB_DB || "civil-at-hand";

type BlogRecord = {
  title?: string;
  summary?: string;
  image?: string;
  imageAlt?: string;
  author?: string;
  date?: string;
  status?: "draft" | "published";
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  slug?: string;
};

async function getPublishedBlog(slug: string): Promise<BlogRecord | null> {
  try {
    const client = await clientPromise;
    const db = client.db(dbName);
    const collection = db.collection("blogs");
    const blog = await collection.findOne({
      status: "published",
      $or: [{ slug }, { id: slug }],
    });
    if (!blog) return null;
    const { _id, ...rest } = blog as any;
    return rest as BlogRecord;
  } catch (error) {
    console.error("Blog metadata lookup failed:", error);
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getPublishedBlog(slug);

  if (!blog) {
    return {
      title: "Engineering Blog | NS Construction",
      description: "Civil engineering, structural design, construction and technical insights from NS Construction.",
      robots: { index: false, follow: true },
    };
  }

  const title = (blog.seoTitle || blog.title || "Engineering Article").trim();
  const description = (blog.seoDescription || blog.summary || "Engineering insights from NS Construction.").trim();
  const canonical = blog.canonicalUrl?.trim() || `${SITE_URL}/blog/${blog.slug || slug}`;
  const image = blog.image?.trim() || `${SITE_URL}/hero.jpg`;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    authors: blog.author ? [{ name: blog.author }] : undefined,
    openGraph: {
      type: "article",
      url: canonical,
      title,
      description,
      publishedTime: blog.date,
      authors: blog.author ? [blog.author] : undefined,
      images: [{ url: image, alt: blog.imageAlt || blog.title || title }],
      siteName: "NS Construction",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default function BlogSlugLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
