"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { servicesData } from "@/data/services";
import { useProjects } from "@/context/ProjectContext";
import ShareButton from "@/components/ShareButton";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Cpu, 
  Briefcase, 
  Compass, 
  Home as HomeIcon,
  CheckCircle2, 
  PhoneCall,
  HardHat,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  FileText
} from "lucide-react";

export default function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { addLead, uploadDrawing, services: contextServices } = useProjects();
  const allServices = (contextServices && contextServices.length > 0 ? contextServices : servicesData);
  const service = allServices.find((s) => s.id === slug || s.id.toLowerCase() === slug.toLowerCase() || s.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") === slug);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const userJson = localStorage.getItem("cah_user");
      if (userJson) {
        const u = JSON.parse(userJson);
        if (u.name) setName(u.name);
        if (u.email) setEmail(u.email);
        if (u.phone) setPhone(u.phone);
      }
    }
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service) return;

    addLead({
      name,
      email,
      phone,
      service: service.title,
      source: `Service Page: ${service.title}`,
      details: message
    });

    if (files.length > 0) {
      for (const f of files) {
        try {
          // Upload the actual file content to /api/upload
          const formData = new FormData();
          formData.append("file", f);

          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadRes.ok) {
            const errData = await uploadRes.json().catch(() => ({}));
            throw new Error(errData.error || `Server responded with status ${uploadRes.status}`);
          }
          const uploadData = await uploadRes.json();
          const fileUrl = uploadData.url;

          await uploadDrawing({
            name: f.name,
            size: (f.size / (1024 * 1024)).toFixed(1) + " MB",
            serviceType: service.title,
            url: fileUrl
          });
        } catch (uploadErr: any) {
          console.error("Error uploading file in service page:", uploadErr);
          alert(`Drawing upload failed: ${uploadErr.message || uploadErr}`);
        }
      }
    }

    setSuccess(true);
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setFiles([]);
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "Cpu": return Cpu;
      case "FileText": return FileText;
      case "Briefcase": return Briefcase;
      case "Compass": return Compass;
      case "HomeIcon": return HomeIcon;
      default: return Sparkles;
    }
  };

  if (!service) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Header />
        <main className="flex-grow py-20 flex items-center justify-center relative z-10">
          <div className="text-center max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-4">
            <HardHat className="h-12 w-12 text-slate-400 mx-auto animate-pulse" />
            <h2 className="font-display font-extrabold text-xl text-slate-900">Service Not Found</h2>
            <p className="text-xs text-slate-500">
              The engineering service you are looking for does not exist or has been modified.
            </p>
            <Link 
              href="/services/all-services"
              className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg px-6 py-2.5 text-xs font-bold transition-all uppercase tracking-wider"
            >
              <ArrowLeft className="h-4 w-4" /> Return to Services
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const Icon = getIconComponent(service.iconName);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />

      <main className="flex-grow py-12 relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link 
              href="/services/all-services" 
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-500 hover:text-slate-900 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4" /> Back to all services
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Column: Details, Capabilities, Standards & Deliverables */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Header Info */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center border border-orange-100">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">
                        Engineering Capability
                      </span>
                      <h1 className="font-display font-extrabold text-2xl md:text-3xl text-slate-900 tracking-tight leading-tight uppercase mt-0.5">
                        {service.title}
                      </h1>
                    </div>
                  </div>
                  <ShareButton page={`/services/all-services/${slug}`} label={service.title} compact />
                </div>
                <hr className="border-slate-100" />
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {service.fullDetails}
                </p>
              </div>

              {/* Key Capabilities */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
                <h2 className="font-display font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                  Key Capabilities & Focus Areas
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {service.features.map((feature, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex gap-3 items-start">
                      <div className="h-6 w-6 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5 border border-orange-100">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Standards & Softwares */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
                <h2 className="font-display font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                  Standards & Design Tools
                </h2>
                <div className="space-y-3">
                  {service.standards.map((std, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start text-xs text-slate-600 font-medium">
                      <div className="h-5 w-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0 border border-slate-200 mt-0.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </div>
                      <span>{std}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deliverables */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
                <h2 className="font-display font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                  Released Deliverables
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {service.deliverables.map((item, idx) => (
                    <div key={idx} className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0">
                        <CheckCircle2 className="h-4.5 w-4.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Contact Consultation Form */}
            <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-24">
              
              {/* Consultation request panel */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                {success ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center p-8 bg-emerald-50 border border-emerald-100 rounded-2xl text-center space-y-4 py-12"
                  >
                    <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-emerald-600 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-display font-extrabold text-base text-emerald-950 uppercase tracking-wider">
                        Requested
                      </h4>
                      <p className="text-[11px] text-emerald-700 leading-normal font-semibold max-w-[200px] mx-auto">
                        Your service request has been logged successfully!
                      </p>
                    </div>
                    <span className="inline-block px-3 py-1 bg-emerald-650 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
                      Status: Under Review
                    </span>
                  </motion.div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <span className="text-[10px] text-orange-500 font-extrabold uppercase tracking-widest block">Consultation</span>
                      <h4 className="font-display font-extrabold text-sm text-slate-900 uppercase tracking-wide leading-tight">
                        Request expert consult
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                        Submit your drawing references or scope specifications for a complimentary structural estimate.
                      </p>
                    </div>

                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Anand Sen"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. anand@senbuilders.com"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. +91 99999 99999"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Project Details / Scope</label>
                        <textarea
                          required
                          rows={3}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Specify built area, height layout constraints, soil parameter scopes, etc."
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-bold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder-slate-300 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                          Upload Engineering Drawings / Plans (Optional, Multiple)
                        </label>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.dwg,.dxf,.png,.jpg"
                          onChange={(e) => {
                            if (e.target.files) {
                              setFiles(Array.from(e.target.files));
                            } else {
                              setFiles([]);
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-orange-500 text-slate-800"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-3 text-xs font-bold transition-all uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <PhoneCall className="h-4 w-4" />
                        Submit Request
                      </button>
                    </form>
                  </>
                )}
              </div>

            </aside>
            
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
