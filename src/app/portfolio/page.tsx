"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useProjects } from "@/context/ProjectContext";
import { PortfolioItem } from "@/data/portfolio";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Briefcase, ChevronRight, HardHat } from "lucide-react";

const isPdf = (url: string) => url?.toLowerCase().endsWith(".pdf") || (url?.includes("/uploads/") && url?.toLowerCase().includes(".pdf"));

export default function PortfolioPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const { portfolio, isLoaded } = useProjects();

  const categories = ["All", "Industrial", "Commercial", "Residential", "PEB Steel"];

  // Filter logic
  const filteredProjects = portfolio.filter((project) => {
    const matchesCategory = selectedCategory === "All" || project.category === selectedCategory;
    const matchesSearch = 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.loc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen bg-wix-cream">
      <Header />

      <main className="flex-grow py-12 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Page Heading */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <motion.span 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-extrabold text-orange-600 uppercase tracking-widest block mb-2"
            >
              Our Portfolio
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="font-display text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl uppercase"
            >
              Featured Engineering <span className="text-orange-500">Masterpieces</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mt-3 text-sm text-slate-600 leading-relaxed font-medium"
            >
            Explore our portfolio of structural designs, commercial projects, industrial layouts, and BIM-coordinated engineering solutions delivered with precision and technical excellence.
            </motion.p>
          </div>

          <div className="mb-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[9px] font-extrabold uppercase tracking-widest text-orange-600">Project explorer</p><p className="mt-2 font-display text-2xl font-extrabold text-wix-dark">{isLoaded ? filteredProjects.length : "—"}</p><p className="text-[10px] text-slate-500">projects matching the current view</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[9px] font-extrabold uppercase tracking-widest text-orange-600">Project evidence</p><p className="mt-2 font-display text-sm font-extrabold text-wix-dark">Scope · location · area · status</p><p className="mt-1 text-[10px] text-slate-500">Each card keeps the project context visible before you open it.</p></div>
            <div className="rounded-2xl border border-slate-200 bg-navy-950 p-5 text-white shadow-sm"><p className="text-[9px] font-extrabold uppercase tracking-widest text-orange-400">Need a clearer next step?</p><Link href="/mentorship" className="mt-2 inline-flex items-center gap-2 font-display text-sm font-extrabold hover:text-orange-400">Discuss your next step <ChevronRight className="h-4 w-4" /></Link><p className="mt-1 text-[10px] text-slate-400">Get guidance on skills, career direction or your next project.</p></div>
          </div>

          {/* Search & Category Filter Toolbar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 mb-10 shadow-premium flex flex-col md:flex-row justify-between items-center gap-5">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start w-full md:w-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                    selectedCategory === cat
                      ? "bg-orange-500 text-white shadow-orange-glow"
                      : "bg-slate-100 border border-slate-200/60 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-semibold placeholder-slate-400 shadow-sm transition-all"
              />
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Grid Listing */}
          <AnimatePresence mode="popLayout">
            {!isLoaded ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white animate-pulse h-56 flex flex-col md:flex-row">
                    <div className="md:w-1/2 bg-slate-200 h-full"></div>
                    <div className="p-6 md:w-1/2 space-y-4 flex flex-col justify-center">
                      <div className="h-3.5 bg-slate-200 w-1/4 rounded"></div>
                      <div className="h-5 bg-slate-200 w-3/4 rounded"></div>
                      <div className="h-3 bg-slate-200 w-full rounded"></div>
                      <div className="h-3 bg-slate-200 w-5/6 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-premium w-full"
              >
                <HardHat className="h-12 w-12 mx-auto text-slate-400 mb-4 animate-pulse" />
                <h3 className="font-display font-bold text-lg text-slate-900">No Projects Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  We couldn't find any engineering projects matching your search criteria or filter category.
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                {filteredProjects.map((project, idx) => (
                  <motion.div 
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className="group border border-slate-200 rounded-xl overflow-hidden hover:border-slate-800 transition-all duration-300 flex flex-col md:flex-row shadow-sm bg-white hover:shadow-premium-lg"
                  >
                    {/* Banner Image */}
                    <div className="md:w-1/2 h-56 md:h-auto overflow-hidden relative">
                      {isPdf(project.img) ? (
                        <div className="w-full h-full min-h-56 flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-4">
                          <HardHat className="h-8 w-8 text-orange-500 mb-2 animate-bounce" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200">PDF Document</span>
                          <span className="text-[9px] text-slate-500 mt-1 max-w-full truncate text-center px-2">{project.title}</span>
                        </div>
                      ) : (
                        <img 
                          src={project.img} 
                          alt={project.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                      )}
                      <span className="absolute top-3 left-3 bg-slate-900 text-white font-bold text-[9px] px-3 py-1 rounded-none uppercase tracking-widest">
                        {project.status}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 md:w-1/2 flex flex-col justify-between space-y-4">
                      <div>
                        <span className="text-[10px] text-orange-500 font-extrabold uppercase tracking-widest">
                          {project.category}
                        </span>
                        <h3 className="font-display font-extrabold text-base text-slate-900 mt-1.5 leading-snug uppercase tracking-wide group-hover:text-orange-500 transition-colors">
                          {project.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-3">
                          {project.description}
                        </p>
                        
                        <div className="space-y-1.5 mt-4 text-xs text-slate-500 font-bold">
                          <p className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" /> 
                            {project.loc}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Briefcase className="h-3.5 w-3.5 text-slate-400" /> 
                            Built Area: {project.area}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Link 
                          href={`/portfolio/${project.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-orange-500 uppercase tracking-widest transition-colors"
                        >
                          View Project Details <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
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
