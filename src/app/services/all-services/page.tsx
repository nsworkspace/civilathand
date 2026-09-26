"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { servicesData, ServiceItem } from "@/data/services";
import { useProjects } from "@/context/ProjectContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Cpu, 
  Briefcase, 
  Compass, 
  Home as HomeIcon,
  ArrowRight, 
  ChevronRight,
  Info,
  Layers,
  Sparkles
} from "lucide-react";

// Custom helper icon
const FileTextIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

export default function ServicesHubPage() {
  const { services: contextServices } = useProjects();
  const [searchTerm, setSearchTerm] = useState("");

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "Cpu": return Cpu;
      case "FileText": return FileTextIcon;
      case "Briefcase": return Briefcase;
      case "Compass": return Compass;
      case "HomeIcon": return HomeIcon;
      default: return Sparkles;
    }
  };

  const allServices = (contextServices && contextServices.length > 0 ? contextServices : servicesData);

  const filteredServices = allServices.filter((service) => 
    service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (service.fullDetails || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              Our Expertise
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="font-display text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl uppercase"
            >
              Our Engineering & <span className="text-orange-500">Design Services</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mt-3 text-sm text-slate-600 leading-relaxed font-medium"
            >
              NS Construction provides end-to-end civil engineering services including structural design, architectural planning, BOQ estimation, BIM modelling, and construction consulting.
            </motion.p>
          </div>

          <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["01", "Design & Engineering", "Analysis, detailing and coordinated technical documentation"],
              ["02", "Project Delivery", "Planning, coordination and construction-stage support"],
              ["03", "Digital Engineering", "BIM, CAD, quantities and structured project information"],
              ["04", "Technical Advisory", "Reviews, scope definition and practical engineering guidance"],
            ].map(([code, title, desc]) => (
              <div key={code} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <span className="font-mono-tag text-[9px] font-bold text-orange-600">CAH / {code}</span>
                <h2 className="mt-3 font-display text-sm font-extrabold text-wix-dark">{title}</h2>
                <p className="mt-2 text-[10px] leading-5 text-slate-500">{desc}</p>
              </div>
            ))}
          </div>

          {/* Search Toolbar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 mb-10 shadow-premium flex flex-col md:flex-row justify-between items-center gap-5">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                Showing {filteredServices.length} Core Engineering Capabilities
              </p>
            </div>
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-semibold placeholder-slate-400 shadow-sm transition-all"
              />
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Grid Listing */}
          <AnimatePresence mode="popLayout">
            {filteredServices.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm"
              >
                <Info className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-semibold">No services found matching your query.</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map((service, idx) => {
                  const Icon = getIconComponent(service.iconName);
                  return (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.05 }}
                      className="group border border-slate-200 hover:border-wix-dark rounded-md p-6 bg-white hover:bg-slate-50/50 transition-all duration-300 flex flex-col justify-between shadow-sm"
                    >
                      <div>
                        <div className="h-10 w-10 rounded-md bg-slate-50 text-wix-dark group-hover:bg-wix-dark group-hover:text-white flex items-center justify-center mb-4 border border-slate-200 transition-colors">
                          <Icon className="h-5.5 w-5.5 text-orange-500" />
                        </div>
                        <h3 className="font-display font-bold text-sm text-wix-dark mb-2 leading-tight uppercase tracking-wider group-hover:text-orange-500 transition-colors">
                          {service.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                          {service.desc}
                        </p>
                        <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2">
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-orange-700">Price</span>
                          <span className="text-sm font-extrabold text-slate-900">{service.price || "Price on request"}</span>
                        </div>
                      </div>
                      <div className="pt-5 mt-auto flex items-center justify-between border-t border-slate-100/60">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Expert Consulting</span>
                        <Link
                          href={`/services/all-services/${service.id}`}
                          className="text-[10px] font-extrabold text-orange-500 hover:text-wix-dark uppercase tracking-widest flex items-center gap-1 group/link"
                        >
                          Explore details
                          <ChevronRight className="h-4 w-4 transform group-hover/link:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>

          {/* Quality Note */}
          <div className="mt-16 flex flex-col md:flex-row items-center gap-4 bg-orange-50/50 border border-orange-100/80 rounded-2xl p-6 md:p-8">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-orange-100 flex-shrink-0">
              <Layers className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-wix-dark uppercase tracking-wider">Engineering Excellence Guarantee</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
                All structural design, drafting, and estimation projects are checked, audited, and certified in accordance with standard <strong>Indian Building Codes (NBC, IS codes)</strong> and international <strong>BIM LOD 400 design frameworks</strong>. We ensure high workmanship coordination and minimal project contingencies.
              </p>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
