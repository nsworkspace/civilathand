"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useProjects } from "@/context/ProjectContext";
import ShareButton from "@/components/ShareButton";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  MapPin, 
  Briefcase, 
  ShieldCheck, 
  Wrench, 
  CheckCircle2, 
  FileDown, 
  PhoneCall,
  HardHat,
  ChevronRight,
  X
} from "lucide-react";

const isPdf = (url: string) => url?.toLowerCase().endsWith(".pdf") || (url?.includes("/uploads/") && url?.toLowerCase().includes(".pdf"));

export default function PortfolioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { portfolio, isLoaded } = useProjects();
  const project = portfolio.find((p) => p.id === id);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (project && project.id) {
      fetch(`/api/portfolio/${project.id}`, { method: "POST" }).catch(console.error);
    }
  }, [project]);

  if (!isLoaded) {
    return (
      <div className="flex flex-col min-h-screen bg-wix-cream">
        <Header />
        <main className="flex-grow py-12 relative z-10 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Loading project case study...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col min-h-screen bg-wix-cream">
        <Header />
        <main className="flex-grow py-20 flex items-center justify-center relative z-10">
          <div className="text-center max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-premium space-y-4">
            <HardHat className="h-12 w-12 text-slate-400 mx-auto animate-pulse" />
            <h2 className="font-display font-extrabold text-xl text-slate-900">Project Not Found</h2>
            <p className="text-xs text-slate-500">
              The engineering project case study you are looking for does not exist or has been archived.
            </p>
            <Link 
              href="/portfolio"
              className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-6 py-2.5 text-xs font-bold transition-all uppercase tracking-wider"
            >
              <ArrowLeft className="h-4 w-4" /> Return to Portfolio
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-wix-cream">
      <Header />

      <main className="flex-grow py-12 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link 
              href="/portfolio" 
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-500 hover:text-slate-900 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4" /> Back to portfolio
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Column: Case Study Narrative, Images & Specs */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Header Info */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-premium space-y-4">
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] bg-orange-500 text-white px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                      {project.category}
                    </span>
                    <span className="text-[9px] bg-slate-900 text-white px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                      Status: {project.status}
                    </span>
                  </div>
                  <ShareButton page={`/portfolio/${project.id}`} label={project.title} compact />
                </div>
                <h1 className="font-display font-extrabold text-2xl md:text-3xl lg:text-4xl text-slate-900 tracking-tight leading-tight uppercase">
                  {project.title}
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  {project.description}
                </p>
              </div>

              {/* Main Visual Image Banner */}
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm relative">
                {isPdf(project.img) ? (
                  <iframe 
                    src={project.img} 
                    className="w-full h-full border-0" 
                    title={project.title}
                  />
                ) : (
                  <img 
                    src={project.img} 
                    alt={project.title} 
                    className="w-full h-full object-cover cursor-zoom-in hover:opacity-95 transition-opacity"
                    onClick={() => setLightboxUrl(project.img)}
                  />
                )}
              </div>

              {/* Project Description Narrative */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-premium space-y-4">
                <h2 className="font-display font-extrabold text-base text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                  Project Overview & Design Scope
                </h2>
                <p className="text-xs text-slate-700 leading-relaxed text-justify font-medium">
                  {project.fullDetails}
                </p>
              </div>

              {/* Engineering Specs Grid */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-premium space-y-5">
                <h2 className="font-display font-extrabold text-base text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                  Technical Specifications
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.specs.map((spec, sIdx) => {
                    const colonIndex = spec.indexOf(":");
                    const label = colonIndex !== -1 ? spec.substring(0, colonIndex).trim() : "Specification";
                    const value = colonIndex !== -1 ? spec.substring(colonIndex + 1).trim() : spec.trim();
                    return (
                      <div key={sIdx} className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex gap-3 items-start">
                        <div className="h-7 w-7 rounded-lg bg-orange-100/50 border border-orange-200 text-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider">{label}</span>
                          <span className="block text-xs font-bold text-slate-800 mt-0.5">{value}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gallery Grid */}
              {project.gallery.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-premium space-y-5">
                  <h2 className="font-display font-extrabold text-base text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                    Project Gallery
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {project.gallery.map((imgUrl, gIdx) => (
                      <div key={gIdx} className="h-56 rounded-xl overflow-hidden border border-slate-200 relative group">
                        {isPdf(imgUrl) ? (
                          <iframe 
                            src={imgUrl} 
                            className="w-full h-full border-0" 
                            title={`${project.title} PDF ${gIdx + 1}`}
                          />
                        ) : (
                          <img 
                            src={imgUrl} 
                            alt={`${project.title} details ${gIdx + 1}`} 
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out cursor-zoom-in"
                            onClick={() => setLightboxUrl(imgUrl)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: Profile, Challenges & Action Box */}
            <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-24">
              
              {/* Project Quick Profile */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-premium space-y-4">
                <h4 className="font-display font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Project Profile
                </h4>
                <div className="space-y-3.5 text-xs">
                  <div className="flex gap-2.5 items-start">
                    <MapPin className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400">Location</span>
                      <span className="font-bold text-slate-800">{project.loc}</span>
                    </div>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <Briefcase className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400">Built Area</span>
                      <span className="font-bold text-slate-800">{project.area}</span>
                    </div>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <ShieldCheck className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="block text-[9px] uppercase font-bold text-slate-400">Quality Status</span>
                      <span className="font-bold text-slate-800">{project.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Engineering Challenges Solved */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-premium space-y-4">
                <h4 className="font-display font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Engineering Challenges
                </h4>
                <div className="space-y-3">
                  {project.challenges.map((challenge, cIdx) => (
                    <div key={cIdx} className="flex gap-2.5 items-start text-xs text-slate-700">
                      <div className="h-5 w-5 rounded-full bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0 border border-red-100 mt-0.5">
                        <Wrench className="h-3 w-3" />
                      </div>
                      <span className="font-medium">{challenge}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Solutions Efficacy */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-premium space-y-4">
                <h4 className="font-display font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Solutions Implemented
                </h4>
                <div className="space-y-3">
                  {project.solutions.map((solution, sIdx) => (
                    <div key={sIdx} className="flex gap-2.5 items-start text-xs text-slate-700">
                      <div className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100 mt-0.5">
                        <CheckCircle2 className="h-3 w-3" />
                      </div>
                      <span className="font-semibold text-slate-800">{solution}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Premium Blueprint CTA & Consultation Offer */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-premium text-white relative overflow-hidden space-y-5">
                <div className="absolute top-0 right-0 h-32 w-32 bg-orange-500 rounded-full blur-3xl opacity-15 pointer-events-none"></div>
                
                <div className="space-y-2">
                  <span className="text-[10px] text-orange-400 font-extrabold uppercase tracking-widest block">Structural Audit</span>
                  <h4 className="font-display font-extrabold text-base uppercase tracking-wide leading-tight">
                    Get Similar Layout Calculations
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                    Download sample blueprint calculations packages or consult directly with our structural designers.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <Link 
                    href="/dashboard"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-3 text-xs font-bold transition-all uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <FileDown className="h-4 w-4" />
                    Download Sample CAD
                  </Link>

                  <Link 
                    href="/#contact"
                    className="w-full border border-slate-700 hover:border-white hover:bg-white/5 text-white rounded-lg py-3 text-xs font-bold transition-all uppercase tracking-widest flex items-center justify-center gap-1.5"
                  >
                    <PhoneCall className="h-4 w-4 text-orange-500" />
                    Get Free Estimate
                  </Link>
                </div>
              </div>

            </aside>
            
          </div>

        </div>
      </main>

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxUrl(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm cursor-zoom-out"
          >
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-6 right-6 text-white hover:text-orange-500 transition-colors p-2 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-7xl max-h-[85vh] overflow-hidden flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxUrl}
                alt="Full preview"
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
