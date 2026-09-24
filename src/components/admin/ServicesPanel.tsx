"use client";

import { notifyAdmin } from "./AdminToast";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench, Plus, Trash2, Edit3, Tag, Loader2, ToggleLeft, ToggleRight, X
} from "lucide-react";

export function ServicesPanel() {
  const [adminServices, setAdminServices] = useState<any[]>([]);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [svcTitle, setSvcTitle] = useState("");
  const [svcDesc, setSvcDesc] = useState("");
  const [svcPrice, setSvcPrice] = useState("");
  const [svcIconName, setSvcIconName] = useState("Sparkles");
  const [svcFullDetails, setSvcFullDetails] = useState("");
  const [svcFeatures, setSvcFeatures] = useState("");
  const [svcStandards, setSvcStandards] = useState("");
  const [svcDeliverables, setSvcDeliverables] = useState("");
  const [savingService, setSavingService] = useState(false);

  const loadAdminServices = async () => {
    try {
      const res = await fetch("/api/admin/services");
      if (!res.ok) throw new Error("Failed to load services");
      const data = await res.json();
      setAdminServices(data.services || []);
      setServicesLoaded(true);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAdminServices();
  }, []);

  const openAddService = () => {
    setEditingServiceId(null);
    setSvcTitle(""); setSvcDesc(""); setSvcPrice(""); setSvcIconName("Sparkles");
    setSvcFullDetails(""); setSvcFeatures(""); setSvcStandards(""); setSvcDeliverables("");
    setIsServiceModalOpen(true);
  };

  const openEditService = (svc: any) => {
    setEditingServiceId(svc.id);
    setSvcTitle(svc.title || "");
    setSvcDesc(svc.desc || "");
    setSvcPrice(svc.price || "");
    setSvcIconName(svc.iconName || "Sparkles");
    setSvcFullDetails(svc.fullDetails || "");
    setSvcFeatures((svc.features || []).join("\n"));
    setSvcStandards((svc.standards || []).join("\n"));
    setSvcDeliverables((svc.deliverables || []).join("\n"));
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!svcTitle.trim()) return;
    setSavingService(true);
    try {
      const payload = {
        title: svcTitle.trim(),
        desc: svcDesc.trim(),
        price: svcPrice.trim(),
        iconName: svcIconName,
        fullDetails: svcFullDetails.trim(),
        features: svcFeatures.split("\n").map(s => s.trim()).filter(Boolean),
        standards: svcStandards.split("\n").map(s => s.trim()).filter(Boolean),
        deliverables: svcDeliverables.split("\n").map(s => s.trim()).filter(Boolean),
      };
      const action = editingServiceId ? "update" : "create";
      const data = editingServiceId ? { id: editingServiceId, ...payload } : payload;
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, data }),
      });
      const result = await res.json();
      if (!res.ok) { notifyAdmin(result.error || "Save failed."); return; }
      await loadAdminServices();
      setIsServiceModalOpen(false);
    } catch (err) {
      notifyAdmin("Network error. Please try again.");
    } finally {
      setSavingService(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Delete this service? This cannot be undone.")) return;
    await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", data: { id } }),
    });
    await loadAdminServices();
  };

  const handleToggleServiceStatus = async (svc: any) => {
    const newStatus = svc.status === "active" ? "archived" : "active";
    await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", data: { id: svc.id, status: newStatus } }),
    });
    await loadAdminServices();
  };



  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 flex-grow"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-display font-extrabold text-xl text-navy-950">Services Management</h3>
          <p className="text-xs text-slate-500 mt-0.5">Add, edit, reorder, or archive engineering service offerings shown on the website.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          
          <button
            type="button"
            onClick={openAddService}
            className="flex items-center gap-1.5 bg-navy-950 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-premium"
          >
            <Plus className="h-4 w-4" />
            Add Service
          </button>
        </div>
      </div>
      {!servicesLoaded ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : adminServices.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <Wrench className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">No services yet.</p>
          <p className="text-xs text-slate-400 mt-1">Add services using the Add Service button.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adminServices.map((svc, idx) => (
            <div
              key={svc.id}
              className={`relative border rounded-xl p-4 flex flex-col gap-3 transition-all ${
                svc.status === "archived"
                  ? "border-slate-200 bg-slate-50 opacity-60"
                  : "border-slate-200 bg-white hover:border-orange-300 hover:shadow-sm"
              }`}
            >
              <span className={`absolute top-3 right-3 text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                svc.status === "archived" ? "bg-slate-100 text-slate-400" : "bg-emerald-100 text-emerald-700"
              }`}>
                {svc.status === "archived" ? "Archived" : "Active"}
              </span>
              <div className="flex items-start gap-3 pr-16">
                <div className="h-9 w-9 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                  <Wrench className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <p className="font-extrabold text-sm text-slate-900 leading-tight">{svc.title}</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5 line-clamp-2">{svc.desc}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-orange-700">Display Price</span>
                <span className="text-xs font-extrabold text-slate-900">{svc.price || "Price on request"}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {(svc.features || []).length} Features
                </span>
                <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {(svc.standards || []).length} Standards
                </span>
                <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {(svc.deliverables || []).length} Deliverables
                </span>
                <span className="bg-orange-50 text-orange-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border border-orange-100">
                  {svc.iconName}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
                <button
                  type="button"
                  onClick={() => handleToggleServiceStatus(svc)}
                  className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
                >
                  {svc.status === "archived" ? (
                    <><ToggleLeft className="h-4 w-4" /> Activate</>
                  ) : (
                    <><ToggleRight className="h-4 w-4 text-emerald-500" /> Archive</>
                  )}
                </button>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditService(svc)}
                    className="bg-slate-100 hover:bg-navy-950 hover:text-white text-navy-950 font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteService(svc.id)}
                    className="bg-red-50 hover:bg-red-500 hover:text-white text-red-600 font-bold p-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <AnimatePresence>
        {isServiceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl shadow-premium-lg border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 z-20 px-6 py-4 bg-navy-950 text-white flex justify-between items-center rounded-t-2xl">
                <div>
                  <h4 className="font-display font-extrabold text-sm uppercase tracking-wider">
                    {editingServiceId ? "Edit Service" : "Add New Service"}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">All fields are saved directly to the database and reflected on the website instantly.</p>
                </div>
                <button type="button" onClick={() => setIsServiceModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSaveService} className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Service Title *</label>
                    <input
                      type="text"
                      required
                      value={svcTitle}
                      onChange={e => setSvcTitle(e.target.value)}
                      placeholder="e.g. Structural Design"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Icon Name</label>
                    <select
                      value={svcIconName}
                      onChange={e => setSvcIconName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-orange-500 transition-colors"
                    >
                      {["Cpu", "FileText", "Briefcase", "Compass", "HomeIcon", "Sparkles", "Wrench", "Settings", "BarChart3", "Layers", "BookOpen", "GraduationCap"].map(ic => (
                        <option key={ic} value={ic}>{ic}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Short Description (card subtitle)</label>
                  <input
                    type="text"
                    value={svcDesc}
                    onChange={e => setSvcDesc(e.target.value)}
                    placeholder="One-line teaser shown on the services listing card"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Service Price (display only)</label>
                  <input
                    type="text"
                    value={svcPrice}
                    onChange={e => setSvcPrice(e.target.value)}
                    placeholder="e.g. ₹25,000 or Starting at ₹25,000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
                  />
                  <p className="text-[9px] text-slate-400 mt-1.5">Shown on the service card only. This value is not connected to the payment system.</p>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Full Details Paragraph (detail page)</label>
                  <textarea
                    rows={4}
                    value={svcFullDetails}
                    onChange={e => setSvcFullDetails(e.target.value)}
                    placeholder="Detailed explanation shown on the service detail page..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors resize-none leading-relaxed"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Features <span className="text-slate-300 font-normal normal-case">(one per line)</span></label>
                    <textarea
                      rows={5}
                      value={svcFeatures}
                      onChange={e => setSvcFeatures(e.target.value)}
                      placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors resize-none leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Standards <span className="text-slate-300 font-normal normal-case">(one per line)</span></label>
                    <textarea
                      rows={5}
                      value={svcStandards}
                      onChange={e => setSvcStandards(e.target.value)}
                      placeholder="IS 456:2000&#10;IS 800:2007"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors resize-none leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Deliverables <span className="text-slate-300 font-normal normal-case">(one per line)</span></label>
                    <textarea
                      rows={5}
                      value={svcDeliverables}
                      onChange={e => setSvcDeliverables(e.target.value)}
                      placeholder="GFC drawings&#10;BBS schedules"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-colors resize-none leading-relaxed"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsServiceModalOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-navy-950 font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingService}
                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-400 text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    {savingService && <Loader2 className="h-4 w-4 animate-spin" />}
                    {savingService ? "Saving..." : editingServiceId ? "Save Changes" : "Create Service"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
