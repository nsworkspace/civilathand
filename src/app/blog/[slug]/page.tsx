"use client";

import React, { use } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useProjects, BlogPost } from "@/context/ProjectContext";
import { generateSlug } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Calendar, User, BookOpen, Clock, ChevronRight, Share2, X, Heart } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { SITE } from "@/data/site";

export default function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { blogs, blogsLoaded } = useProjects();

  const post = blogs.find((b) => (b.slug || generateSlug(b.title)) === slug || b.id === slug);

  const [shareUrl, setShareUrl] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [popupImageSrc, setPopupImageSrc] = React.useState<string | null>(null);
  const [readingProgress, setReadingProgress] = React.useState(0);
  const [articleSections, setArticleSections] = React.useState<Array<{ id: string; title: string; level: number }>>([]);

  const [liked, setLiked] = React.useState(false);
  const [likesCount, setLikesCount] = React.useState(0);
  const [sharesCount, setSharesCount] = React.useState(0);

  React.useEffect(() => {
    if (post) {
      setLikesCount((post as any).likes || 0);
      setSharesCount((post as any).shares || 0);
      
      if (typeof window !== "undefined") {
        const likedBlogs = JSON.parse(localStorage.getItem("liked_blogs") || "[]");
        if (likedBlogs.includes(post.id)) {
          setLiked(true);
        }
      }
    }
  }, [post]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
  }, []);

  React.useEffect(() => {
    const onScroll = () => {
      const article = document.querySelector(".blog-article-body") as HTMLElement | null;
      if (!article) return;
      const start = article.getBoundingClientRect().top + window.scrollY - 120;
      const total = Math.max(1, article.offsetHeight - window.innerHeight * 0.45);
      setReadingProgress(Math.min(100, Math.max(0, ((window.scrollY - start) / total) * 100)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [post]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      const headings = Array.from(document.querySelectorAll(".blog-article-body h2, .blog-article-body h3")) as HTMLElement[];
      const seen = new Map<string, number>();
      const sections = headings.map((heading, index) => {
        const base = (heading.textContent || `section-${index + 1}`).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `section-${index + 1}`;
        const count = (seen.get(base) || 0) + 1;
        seen.set(base, count);
        const id = count > 1 ? `${base}-${count}` : base;
        heading.id = id;
        return { id, title: heading.textContent || `Section ${index + 1}`, level: heading.tagName === "H3" ? 3 : 2 };
      });
      setArticleSections(sections.slice(0, 14));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [post]);

  React.useEffect(() => {
    if (post && post.id) {
      fetch(`/api/blogs/${post.id}`, { method: "POST" }).catch(console.error);
    }
  }, [post]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPopupImageSrc(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  React.useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .prose-wix img {
        cursor: zoom-in;
        transition: transform 0.2s ease;
      }
      .prose-wix img:hover {
        transform: scale(1.01);
      }
      .prose-wix .answer-box {
        margin: 0 0 1.5rem;
        border-left: 4px solid #f97316;
        border-radius: 0.75rem;
        background: #fff7ed;
        padding: 1rem 1.1rem;
        font-weight: 650;
        color: #172033;
      }
    `;
    document.head.appendChild(style);
    return () => {
      try {
        document.head.removeChild(style);
      } catch (err) {
        // Safe check in case it's already removed
      }
    };
  }, []);

  const handleLikeClick = async () => {
    if (!post || liked) return;

    try {
      setLiked(true);
      setLikesCount(prev => prev + 1);

      if (typeof window !== "undefined") {
        const likedBlogs = JSON.parse(localStorage.getItem("liked_blogs") || "[]");
        likedBlogs.push(post.id);
        localStorage.setItem("liked_blogs", JSON.stringify(likedBlogs));
      }

      await fetch(`/api/blogs/${post.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like" })
      });
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const handleShareClick = async () => {
    if (!post) return;
    try {
      setSharesCount(prev => prev + 1);
      await fetch(`/api/blogs/${post.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "share" })
      });
    } catch (err) {
      console.error("Error sharing post:", err);
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      handleShareClick();
    }
  };

  const handleArticleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG") {
      const src = (target as HTMLImageElement).src;
      setPopupImageSrc(src);
    }
  };

  const shareLinks = post ? [
    {
      name: "Copy Link",
      icon: (
        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
      action: handleCopyLink,
      color: "hover:bg-slate-100 hover:text-slate-900 text-slate-500",
      tooltip: copied ? "Copied!" : "Copy Link",
    },
    {
      name: "WhatsApp",
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.504-5.714-1.466L0 24zm6.59-4.846c1.6.95 3.16 1.448 4.743 1.449 5.48 0 9.932-4.457 9.935-9.94.002-2.656-1.03-5.153-2.903-7.03C16.55 1.753 14.06 1.72 12.012 1.72c-5.485 0-9.94 4.456-9.943 9.94-.001 2.013.524 3.986 1.522 5.73l-.997 3.637 3.737-.98c1.61.879 3.23 1.253 4.726 1.253zM16.518 13.5c-.244-.122-1.45-.714-1.674-.795-.224-.082-.387-.122-.55.122-.162.243-.63.795-.772.957-.142.162-.284.182-.528.06-1.127-.565-1.93-1.002-2.693-2.307-.202-.345.202-.321.579-1.07.06-.122.03-.228-.015-.31-.045-.082-.387-.932-.53-1.277-.14-.335-.297-.289-.408-.295-.106-.005-.228-.006-.35-.006a.673.673 0 0 0-.488.228c-.162.182-.62.607-.62 1.479s.636 1.716.724 1.838c.09.122 1.252 1.911 3.033 2.68.423.183.754.293.102.353-.1.082-.38.256-.474.327.243.203.497.35.795.39.297.04.593.02.871-.04.28-.06.77-.315.88-.62.11-.305.11-.565.07-.62-.04-.055-.16-.096-.4-.217z"/>
        </svg>
      ),
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + " - " + shareUrl)}`,
      color: "hover:bg-green-50 hover:text-green-600 text-slate-500",
      tooltip: "WhatsApp",
    },
    {
      name: "LinkedIn",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
      ),
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      color: "hover:bg-blue-50 hover:text-blue-600 text-slate-500",
      tooltip: "LinkedIn",
    },
    {
      name: "Twitter",
      icon: (
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`,
      color: "hover:bg-slate-100 hover:text-slate-900 text-slate-500",
      tooltip: "Twitter / X",
    },
    {
      name: "Facebook",
      icon: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
        </svg>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      color: "hover:bg-blue-50 hover:text-blue-700 text-slate-500",
      tooltip: "Facebook",
    }
  ] : [];

  // Get related posts (published, same category or other, excluding current post)
  const relatedPosts = post
    ? blogs
        .filter((b) => b.status === "published" && b.id !== post.id)
        .sort((a, b) => {
          const aSame = a.category === post.category ? 1 : 0;
          const bSame = b.category === post.category ? 1 : 0;
          return bSame - aSame;
        })
        .slice(0, 3)
    : [];

  // Markdown-like parser for light theme
  const renderContent = (content: string) => {
    return content.split("\n\n").map((block, idx) => {
      const trimmedBlock = block.trim();
      if (trimmedBlock.startsWith("###")) {
        return (
          <h3 key={idx} className="font-display font-bold text-xl text-slate-900 mt-8 mb-4 border-b border-slate-100 pb-2">
            {trimmedBlock.replace("###", "").trim()}
          </h3>
        );
      }
      if (trimmedBlock.startsWith("-")) {
        const items = trimmedBlock.split("\n").map(item => item.replace("-", "").trim());
        return (
          <ul key={idx} className="list-disc pl-5 my-4 space-y-2 text-slate-700 text-sm">
            {items.map((it, i) => <li key={i}>{it}</li>)}
          </ul>
        );
      }
      if (trimmedBlock.match(/^\d+\./)) {
        const items = trimmedBlock.split("\n").map(item => item.replace(/^\d+\./, "").trim());
        return (
          <ol key={idx} className="list-decimal pl-5 my-4 space-y-2 text-slate-700 text-sm">
            {items.map((it, i) => <li key={i}>{it}</li>)}
          </ol>
        );
      }
      return (
        <p key={idx} className="text-slate-700 leading-relaxed my-4 text-sm">
          {trimmedBlock}
        </p>
      );
    });
  };

  // Show skeleton while the initial API fetch hasn't settled yet.
  // This prevents flashing "Article Not Found" before data arrives.
  if (!blogsLoaded) {
    return (
      <div className="flex flex-col min-h-screen bg-wix-cream">
        <Header />
        <main className="flex-grow py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="h-4 w-32 bg-slate-200 rounded animate-pulse mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-10 space-y-6">
                <div className="h-4 w-20 bg-orange-200 rounded animate-pulse" />
                <div className="h-8 w-3/4 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
                <div className="aspect-video w-full bg-slate-100 rounded-xl animate-pulse" />
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-3 bg-slate-100 rounded animate-pulse" style={{ width: `${90 - i * 5}%` }} />
                  ))}
                </div>
              </div>
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 h-32 animate-pulse" />
                <div className="bg-white border border-slate-200 rounded-2xl p-6 h-24 animate-pulse" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post || post.status !== "published") {
    return (
      <div className="flex flex-col min-h-screen bg-wix-cream">
        <Header />
        <main className="flex-grow py-20 relative z-10 flex items-center justify-center">
          <div className="text-center max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-premium space-y-4">
            <BookOpen className="h-12 w-12 text-slate-400 mx-auto animate-pulse" />
            <h2 className="font-display font-extrabold text-xl text-slate-900">Article Not Found</h2>
            <p className="text-xs text-slate-500">
              The engineering article you are looking for has been drafted, deleted, or relocated.
            </p>
            <Link 
              href="/blog"
              className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-6 py-2.5 text-xs font-bold transition-all uppercase tracking-wider"
            >
              <ArrowLeft className="h-4 w-4" /> Return to Blog
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Calculate dynamic read time based on 200 WPM
  const plainText = post.content.replace(/<[^>]*>?/gm, ''); // strip HTML tags
  const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));
  const canonicalUrl = (post as any).canonicalUrl || `${SITE.url}/blog/${post.slug || slug}`;
  const quickAnswer = String((post as any).summary || post.title || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 60)
    .join(" ");
  const answerParagraph = quickAnswer.split(" ").slice(0, Math.max(40, Math.min(60, quickAnswer.split(" ").length))).join(" ");
  const safeContent = sanitizeHtml(post.content);
  const contentWithAnswer = /<h2\b[^>]*>/i.test(safeContent)
    ? safeContent.replace(/(<h2\b[^>]*>[\s\S]*?<\/h2>)/i, `$1<p class="answer-box">${answerParagraph}</p>`)
    : `<p class="answer-box">${answerParagraph}</p>${safeContent}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: (post as any).seoDescription || post.summary,
    image: [post.image],
    datePublished: post.date,
    dateModified: (post as any).updatedAt || post.date,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Civil At Hand",
      url: SITE.url,
    },
    mainEntityOfPage: canonicalUrl,
  };

  return (
    <div className="flex flex-col min-h-screen bg-wix-cream">
      <Header />
      <div className="fixed left-0 right-0 top-0 z-[60] h-1 bg-slate-200/40 pointer-events-none">
        <div className="h-full bg-orange-500 transition-[width] duration-150" style={{ width: `${readingProgress}%` }} />
      </div>

      <main className="flex-grow py-8 md:py-12 relative z-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link 
              href="/blog" 
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-500 hover:text-wix-dark transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Blog insights
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
            
            {/* Left Column: Full Post Details */}
            <article className="lg:col-span-8 min-w-0 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 md:p-10 shadow-premium space-y-6">
              
              {/* Header Info */}
              <div className="space-y-4">
                <span className="inline-block text-[10px] bg-orange-500 text-white px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                  {post.category}
                </span>
                <h1 className="font-display font-extrabold text-[clamp(2rem,6vw,3.75rem)] text-slate-900 tracking-tight leading-[1.05] break-words">
                  {post.title}
                </h1>
                
                {/* Meta details */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 items-center text-[10px] text-slate-500 font-bold uppercase tracking-wide border-y border-slate-100 py-3.5">
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-orange-500" />
                    Author: {post.author}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    Published: {post.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-orange-500" />
                    Read Time: {readTime} Min{readTime !== 1 ? 's' : ''}
                  </span>
                </div>
                {(post as any).tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(post as any).tags.map((tag: string) => (
                      <span key={tag} className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Main Banner Image */}
              <div 
                className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60 relative cursor-zoom-in group hover:shadow-md transition-shadow duration-300"
                onClick={() => setPopupImageSrc(post.image)}
              >
                <img 
                  src={post.image} 
                  alt={(post as any).imageAlt || post.title}
                  className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
                />
              </div>

              {articleSections.length > 0 && (
                <nav aria-label="Article contents" className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5 not-prose">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">In this article</p>
                    <span className="text-[10px] font-bold text-orange-600">{articleSections.length} sections</span>
                  </div>
                  <div className="mt-3 grid gap-1.5">
                    {articleSections.map((section) => (
                      <a key={section.id} href={`#${section.id}`} className={`block rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white hover:text-orange-600 transition-colors ${section.level === 3 ? "ml-4" : ""}`}>
                        {section.title}
                      </a>
                    ))}
                  </div>
                </nav>
              )}

              {/* Post Content Body */}
              <div className="prose prose-wix blog-article-body max-w-none text-base md:text-[1.075rem] leading-relaxed" onClick={handleArticleClick}>
                {post.content.includes("<p>") || 
                 post.content.includes("<h2>") ||
                 post.content.includes("<h3>") || 
                 post.content.includes("<ul>") || 
                 post.content.includes("<img") || 
                 post.content.includes("<ol") || 
                 post.content.includes("<blockquote") || 
                 post.content.includes("<pre") ||
                 post.content.includes("<div>") ||
                 post.content.includes("<span>") ? (
                  <div dangerouslySetInnerHTML={{ __html: contentWithAnswer }} />
                ) : (
                  <div>
                    <p className="answer-box">{answerParagraph}</p>
                    {renderContent(post.content)}
                  </div>
                )}
              </div>

              {/* Share & Like Article Section */}
              <div className="border-t border-slate-100 pt-6 mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Like Button */}
                  <button
                    onClick={handleLikeClick}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      liked 
                        ? "bg-rose-50 border-rose-200 text-rose-600 shadow-sm" 
                        : "bg-white border-slate-200 hover:border-rose-200 hover:bg-rose-50/20 text-slate-700 hover:text-rose-600"
                    }`}
                  >
                    <Heart className={`h-4.5 w-4.5 transition-transform duration-300 ${liked ? "fill-rose-500 stroke-rose-500 scale-110" : ""}`} />
                    <span>{likesCount} {likesCount === 1 ? "Like" : "Likes"}</span>
                  </button>

                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {sharesCount} {sharesCount === 1 ? "Share" : "Shares"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-450 font-extrabold uppercase tracking-wider mr-1">Share:</span>
                  {shareLinks.map((share, index) => {
                    if (share.action) {
                      return (
                        <button
                          key={index}
                          onClick={share.action}
                          className={`h-9 w-9 rounded-lg border border-slate-200/80 flex items-center justify-center transition-all duration-300 relative group cursor-pointer ${share.color}`}
                          title={share.tooltip}
                        >
                          {share.icon}
                          {copied && (
                            <span className="absolute -top-8 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-bounce">
                              Copied!
                            </span>
                          )}
                        </button>
                      );
                    }
                    return (
                      <a
                        key={index}
                        href={share.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleShareClick}
                        className={`h-9 w-9 rounded-lg border border-slate-200/80 flex items-center justify-center transition-all duration-300 relative group ${share.color}`}
                        title={share.tooltip}
                      >
                        {share.icon}
                      </a>
                    );
                  })}
                </div>
              </div>

            </article>

            {/* Right Column: Sticky Sidebar with Details & Related Posts */}
            <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-24">
              
              {/* Author widget */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-premium space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-24 w-24 bg-orange-500 rounded-full blur-3xl opacity-10 pointer-events-none"></div>
                <h4 className="font-display font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Post Contributor
                </h4>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-sm">
                    {post.author.split(" ").map(w => w[0]).join("")}
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-800">{post.author}</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">Chartered Design Partner</span>
                  </div>
                </div>
              </div>

              {/* Share Article Widget */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-premium space-y-4">
                <h4 className="font-display font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Appreciate & Share
                </h4>

                {/* Like Button Row inside Card */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-50 pb-3">
                  <button
                    onClick={handleLikeClick}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      liked 
                        ? "bg-rose-50 border-rose-100 text-rose-600 shadow-sm" 
                        : "bg-white border-slate-200 hover:border-rose-200 hover:bg-rose-50/20 text-slate-700 hover:text-rose-600"
                    }`}
                  >
                    <Heart className={`h-3.5 w-3.5 transition-transform duration-300 ${liked ? "fill-rose-500 stroke-rose-500 scale-110" : ""}`} />
                    <span>{likesCount} {likesCount === 1 ? "Like" : "Likes"}</span>
                  </button>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {sharesCount} {sharesCount === 1 ? "Share" : "Shares"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {shareLinks.map((share, index) => {
                    if (share.action) {
                      return (
                        <button
                          key={index}
                          onClick={share.action}
                          className={`h-9 w-9 rounded-lg border border-slate-200/80 flex items-center justify-center transition-all duration-300 relative group cursor-pointer ${share.color}`}
                          title={share.tooltip}
                        >
                          {share.icon}
                          {copied && (
                            <span className="absolute -top-8 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider animate-bounce">
                              Copied!
                            </span>
                          )}
                        </button>
                      );
                    }
                    return (
                      <a
                        key={index}
                        href={share.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleShareClick}
                        className={`h-9 w-9 rounded-lg border border-slate-200/80 flex items-center justify-center transition-all duration-300 relative group ${share.color}`}
                        title={share.tooltip}
                      >
                        {share.icon}
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Related posts */}
              {relatedPosts.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-premium space-y-4">
                  <h4 className="font-display font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                    Related Articles
                  </h4>
                  
                  <div className="divide-y divide-slate-100">
                    {relatedPosts.map((rPost) => (
                      <Link 
                        key={rPost.id}
                        href={`/blog/${rPost.slug || generateSlug(rPost.title)}`}
                        className="py-3 flex gap-3 items-center group block first:pt-0 last:pb-0"
                      >
                        <div className="h-12 w-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200/60">
                          <img src={rPost.image} alt={rPost.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <div className="flex-grow space-y-0.5">
                          <span className="block text-[8px] font-bold text-orange-500 uppercase tracking-widest">{rPost.category}</span>
                          <span className="block text-xs font-semibold text-slate-800 group-hover:text-orange-500 transition-colors line-clamp-1 leading-snug">
                            {rPost.title}
                          </span>
                        </div>
                        <ChevronRight className="h-4.5 w-4.5 text-slate-500 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </aside>
            
          </div>

        </div>
      </main>

      <Footer />

      {/* Image Zoom Popup Modal */}
      <AnimatePresence>
        {popupImageSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPopupImageSrc(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm cursor-zoom-out"
          >
            <button
              onClick={() => setPopupImageSrc(null)}
              className="absolute top-6 right-6 text-white hover:text-orange-500 transition-colors p-2 rounded-full bg-white/5 hover:bg-white/10 cursor-pointer"
              aria-label="Close image popup"
            >
              <X className="h-6 w-6" />
            </button>
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative max-w-5xl max-h-[85vh] overflow-hidden rounded-xl border border-white/10 shadow-premium-lg"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
            >
              <img
                src={popupImageSrc}
                alt="Enlarged blog visual"
                className="w-full h-full object-contain max-h-[85vh] select-none"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
