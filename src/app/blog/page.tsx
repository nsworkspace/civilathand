"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useProjects, BlogPost } from "@/context/ProjectContext";
import { generateSlug } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Calendar, User, ArrowRight, BookOpen, Clock, Star, Tag } from "lucide-react";

export default function BlogListingPage() {
  const { blogs, blogsLoaded } = useProjects();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Get only published blogs
  const publishedBlogs = blogs.filter((post) => post.status === "published");

  // Filter categories
  const categories = ["All", "Structure", "Educational", "Transportation", "General tech", "Architecture", "Case studies", "Civil engineering"];

  // Filter and Search logic
  const filteredBlogs = publishedBlogs.filter((post) => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch = 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow py-8 md:py-12 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Page Heading */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-[clamp(2rem,8vw,3.25rem)] font-extrabold tracking-tight leading-[1.05] text-slate-900"
            >
              Engineering <span className="text-orange-500">Insights & Tech Blog</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mt-4 px-2 text-sm text-slate-600 leading-relaxed"
            >
              Read the latest blogs on structural engineering, construction technology, civil engineering software, design methods, project planning, and industry updates.
            </motion.p>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-5 md:p-6 mb-8 md:mb-10 shadow-premium flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 md:gap-5">
            {/* Category tabs */}
            <div className="flex flex-nowrap md:flex-wrap gap-2 justify-start md:justify-start w-full md:w-auto overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                    selectedCategory === cat
                      ? "bg-orange-500 text-white shadow-orange-glow"
                      : "bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80 md:shrink-0">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-semibold placeholder-slate-450 shadow-sm transition-all"
              />
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Featured article */}
          {blogsLoaded && filteredBlogs.some((post) => post.featured) && !searchTerm && selectedCategory === "All" && (
            <section className="mb-10">
              {(() => {
                const featured = filteredBlogs.find((post) => post.featured);
                if (!featured) return null;
                const words = featured.content.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
                const readTime = Math.max(1, Math.ceil(words / 200));
                return (
                  <Link href={`/blog/${featured.slug || generateSlug(featured.title)}`} className="block group">
                    <article className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-premium-lg">
                      <div className="lg:col-span-7 min-h-[300px] overflow-hidden relative">
                        <img
                          src={featured.image}
                          alt={featured.imageAlt || featured.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                        <div className="absolute left-5 top-5 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-orange-500 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
                            <Star className="h-3 w-3 fill-white" /> Featured
                          </span>
                          <span className="rounded-md bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-800">
                            {featured.category}
                          </span>
                        </div>
                      </div>
                      <div className="lg:col-span-5 p-7 md:p-9 flex flex-col justify-center text-white">
                        <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <span>{featured.date}</span>
                          <span>•</span>
                          <span>{featured.author}</span>
                          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {readTime} min read</span>
                        </div>
                        <h2 className="mt-4 font-display text-2xl md:text-3xl font-extrabold leading-tight group-hover:text-orange-400 transition-colors">
                          {featured.title}
                        </h2>
                        <p className="mt-4 text-sm leading-relaxed text-slate-300 line-clamp-4">
                          {featured.summary}
                        </p>
                        <div className="mt-6 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-orange-400">
                          Read featured article <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })()}
            </section>
          )}

          {/* Grid Listing */}
          <AnimatePresence mode="popLayout">
            {!blogsLoaded ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7 lg:gap-8">
                {[...Array(3)].map((_, idx) => (
                  <div 
                    key={idx}
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-premium flex flex-col h-full animate-pulse"
                  >
                    {/* Skeleton Banner Image */}
                    <div className="h-48 bg-slate-100 border-b border-slate-100" />

                    {/* Skeleton Card Body */}
                    <div className="p-5 sm:p-6 flex-grow flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        {/* Skeleton Meta */}
                        <div className="flex gap-4 items-center">
                          <div className="h-3 w-16 bg-slate-100 rounded" />
                          <div className="h-3 w-16 bg-slate-100 rounded" />
                        </div>

                        {/* Skeleton Title */}
                        <div className="h-6 w-3/4 bg-slate-200 rounded" />

                        {/* Skeleton Summary */}
                        <div className="space-y-2">
                          <div className="h-3 w-full bg-slate-100 rounded" />
                          <div className="h-3 w-5/6 bg-slate-100 rounded" />
                        </div>
                      </div>

                      {/* Skeleton Action */}
                      <div className="h-3.5 w-24 bg-slate-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredBlogs.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-premium"
              >
                <BookOpen className="h-12 w-12 mx-auto text-slate-400 mb-4 animate-pulse" />
                <h3 className="font-display font-bold text-lg text-slate-900">No Articles Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  We couldn&apos;t find any published engineering posts matching your search query or filters.
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7 lg:gap-8">
                {filteredBlogs
                  .filter((post) => !(post.featured && !searchTerm && selectedCategory === "All"))
                  .map((post, idx) => (
                  <motion.article 
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-premium group flex flex-col h-full hover:border-slate-300 hover:shadow-premium-lg transition-all duration-300"
                  >
                    {/* Banner Image */}
                    <div className="h-44 sm:h-48 overflow-hidden relative bg-slate-900 border-b border-slate-100">
                      <img 
                        src={post.image} 
                        alt={post.imageAlt || post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="text-[10px] bg-orange-500 text-white px-2.5 py-1 rounded-md font-bold uppercase tracking-wider shadow-sm">
                          {post.category}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 sm:p-6 flex-grow flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5">
                        {/* Meta */}
                        <div className="flex gap-4 items-center text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-orange-500" />
                            {post.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-orange-500" />
                            {post.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-orange-500" />
                            {Math.max(1, Math.ceil(post.content.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length / 200))} min
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-display font-extrabold text-lg text-slate-900 group-hover:text-orange-500 transition-colors duration-200 line-clamp-2 leading-tight">
                          {post.title}
                        </h3>

                        {/* Summary */}
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                          {post.summary}
                        </p>
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-500">
                                <Tag className="h-2.5 w-2.5" /> {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Read Action */}
                      <div className="pt-2">
                        <Link 
                          href={`/blog/${post.slug || generateSlug(post.title)}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-500 hover:text-slate-900 uppercase tracking-wider group-hover:gap-2.5 transition-all duration-200"
                        >
                          Read Full Article
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </AnimatePresence>

        </div>
      </main>

      <Footer />
    </div>
  );
}
