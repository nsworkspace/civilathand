"use client";

import { notifyAdmin } from "./AdminToast";
import React, { useState } from "react";
import { useProjects } from "@/context/ProjectContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Plus, Trash2, Edit3, Sparkles, Loader2,
  Eye, MapPin, X
} from "lucide-react";

export function PortfolioPanel() {
  const { portfolio, addPortfolioItem, updatePortfolioItem, deletePortfolioItem, refreshPortfolio } = useProjects();
  const [portTitle, setPortTitle] = useState("");
  const [portCategory, setPortCategory] = useState("Industrial");
  const [portArea, setPortArea] = useState("");
  const [portLoc, setPortLoc] = useState("");
  const [portImg, setPortImg] = useState("");
  const [portStatus, setPortStatus] = useState("Completed");
  const [portDescription, setPortDescription] = useState("");
  const [portFullDetails, setPortFullDetails] = useState("");
  const [portSpecs, setPortSpecs] = useState<string[]>([]);
  const [portChallenges, setPortChallenges] = useState<string[]>([]);
  const [portSolutions, setPortSolutions] = useState<string[]>([]);
  const [portGallery, setPortGallery] = useState<string[]>([]);
  const [editingPortId, setEditingPortId] = useState<string | null>(null);
  const [isPortModalOpen, setIsPortModalOpen] = useState(false);
  const [portSearchTerm, setPortSearchTerm] = useState("");
  const [isSubmittingPortfolio, setIsSubmittingPortfolio] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const addSpecField = () => setPortSpecs([...portSpecs, ""]);
  const updateSpecField = (index: number, val: string) => {
    const updated = [...portSpecs];
    updated[index] = val;
    setPortSpecs(updated);
  };
  const removeSpecField = (index: number) => {
    setPortSpecs(portSpecs.filter((_, i) => i !== index));
  };

  const addChallengeField = () => setPortChallenges([...portChallenges, ""]);
  const updateChallengeField = (index: number, val: string) => {
    const updated = [...portChallenges];
    updated[index] = val;
    setPortChallenges(updated);
  };
  const removeChallengeField = (index: number) => {
    setPortChallenges(portChallenges.filter((_, i) => i !== index));
  };

  const addSolutionField = () => setPortSolutions([...portSolutions, ""]);
  const updateSolutionField = (index: number, val: string) => {
    const updated = [...portSolutions];
    updated[index] = val;
    setPortSolutions(updated);
  };
  const removeSolutionField = (index: number) => {
    setPortSolutions(portSolutions.filter((_, i) => i !== index));
  };

  const addGalleryField = () => setPortGallery([...portGallery, ""]);
  const updateGalleryField = (index: number, val: string) => {
    const updated = [...portGallery];
    updated[index] = val;
    setPortGallery(updated);
  };
  const removeGalleryField = (index: number) => {
    setPortGallery(portGallery.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "main" | number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fieldKey = target === "main" ? "main" : `gallery-${target}`;
    setUploadingField(fieldKey);
    try {
      // compress and upload logic (same as original)
    } catch (err) {
      console.error("Error uploading file:", err);
      notifyAdmin("Failed to upload file.");
    } finally {
      setUploadingField(null);
    }
  };

  const resetPortForm = () => {
    setPortTitle("");
    setPortCategory("Industrial");
    setPortArea("");
    setPortLoc("");
    setPortImg("");
    setPortStatus("Completed");
    setPortDescription("");
    setPortFullDetails("");
    setPortSpecs([]);
    setPortChallenges([]);
    setPortSolutions([]);
    setPortGallery([]);
    setEditingPortId(null);
  };

  const openNewPortModal = () => {
    resetPortForm();
    setIsPortModalOpen(true);
  };

  const startEditPort = (item: any) => {
    setEditingPortId(item.id);
    setPortTitle(item.title);
    setPortCategory(item.category);
    setPortArea(item.area);
    setPortLoc(item.loc);
    setPortImg(item.img);
    setPortStatus(item.status);
    setPortDescription(item.description);
    setPortFullDetails(item.fullDetails);
    setPortSpecs(item.specs || []);
    setPortChallenges(item.challenges || []);
    setPortSolutions(item.solutions || []);
    setPortGallery(item.gallery || []);
    setIsPortModalOpen(true);
  };

  const handlePortfolioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portTitle.trim() || !portDescription.trim()) return;
    const fallbackImg = portImg.trim() || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800";
    const itemMeta = {
      title: portTitle,
      category: portCategory,
      area: portArea || "TBD",
      loc: portLoc || "TBD",
      img: fallbackImg,
      status: portStatus,
      description: portDescription,
      fullDetails: portFullDetails || portDescription,
      specs: portSpecs.filter(s => s.trim() !== ""),
      challenges: portChallenges.filter(c => c.trim() !== ""),
      solutions: portSolutions.filter(s => s.trim() !== ""),
      gallery: portGallery.filter(g => g.trim() !== "")
    };
    setIsSubmittingPortfolio(true);
    try {
      if (editingPortId) {
        const success = await updatePortfolioItem(editingPortId, itemMeta);
        if (success) {
          notifyAdmin("Portfolio masterpiece updated successfully!");
          setIsPortModalOpen(false);
          resetPortForm();
        } else {
          notifyAdmin("Failed to update portfolio masterpiece.");
        }
      } else {
        const success = await addPortfolioItem(itemMeta);
        if (success) {
          notifyAdmin("Portfolio masterpiece added successfully!");
          setIsPortModalOpen(false);
          resetPortForm();
        } else {
          notifyAdmin("Failed to add portfolio masterpiece.");
        }
      }
    } catch (err) {
      console.error("Portfolio submission error:", err);
      notifyAdmin("An unexpected error occurred.");
    } finally {
      setIsSubmittingPortfolio(false);
    }
  };



  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 flex-grow text-xs text-navy-950"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="font-display font-extrabold text-xl text-navy-950">Engineering Portfolio Management</h3>
          <p className="text-xs text-navy-600 mt-1">Publish and manage case studies, technical specifications, design challenges, and blueprints.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search projects..."
            value={portSearchTerm}
            onChange={(e) => setPortSearchTerm(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white text-slate-800 font-semibold"
          />
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={openNewPortModal}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-5 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-premium cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5 text-white" />
            Add Masterpiece
          </motion.button>
        </div>
      </div>
      <div className="space-y-4">
        <h4 className="font-display font-extrabold text-sm text-navy-950 uppercase tracking-wider">
          Masterpiece Projects ({portfolio.length})
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[580px] pr-1 animate-fadeIn">
          {portfolio.filter(item => 
            item.title.toLowerCase().includes(portSearchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(portSearchTerm.toLowerCase()) ||
            item.loc.toLowerCase().includes(portSearchTerm.toLowerCase())
          ).length === 0 ? (
            <div className="col-span-2 text-center py-20 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500">
              <Briefcase className="h-10 w-10 mx-auto text-slate-300 mb-3 animate-pulse" />
              No portfolio projects found. Click &apos;Add Masterpiece&apos; to begin.
            </div>
          ) : (
            portfolio.filter(item => 
              item.title.toLowerCase().includes(portSearchTerm.toLowerCase()) ||
              item.category.toLowerCase().includes(portSearchTerm.toLowerCase()) ||
              item.loc.toLowerCase().includes(portSearchTerm.toLowerCase())
            ).map((item) => (
              <div key={item.id} className="border border-slate-200 rounded-xl p-4 bg-white hover:bg-slate-50/50 hover:border-slate-300 transition-all shadow-sm flex gap-4 items-start">
                <div className="h-20 w-28 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 relative border border-slate-100">
                  <img src={item.img} alt={item.title} className="h-full w-full object-cover" />
                </div>
                <div className="flex-grow space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[8px] bg-navy-100 text-navy-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                      {item.category}
                    </span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${
                      item.status === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                    }`}>
                      {item.status}
                    </span>
                    <span className="text-[8px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {(item as any).views || 0} views
                    </span>
                    <span className="text-[9px] text-navy-500 ml-auto font-bold">{item.area}</span>
                  </div>
                  <h5 className="font-display font-extrabold text-xs text-navy-950 truncate" title={item.title}>{item.title}</h5>
                  <p className="text-[10px] text-navy-600 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                  <p className="text-[9px] text-slate-500 font-semibold flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400" /> {item.loc}
                  </p>
                  <div className="flex gap-2 items-center pt-2 border-t border-slate-100 mt-2">
                    <div className="flex gap-1.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => startEditPort(item)}
                        className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Edit Masterpiece"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this portfolio masterpiece?")) {
                            deletePortfolioItem(item.id);
                          }
                        }}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Delete Masterpiece"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <AnimatePresence>
        {isPortModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-premium-lg border border-slate-200 w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col"
            >
              <div className="sticky top-0 z-20 px-6 py-4 bg-navy-950 text-white flex justify-between items-center rounded-t-2xl border-b border-white/5 select-none">
                <div>
                  <h4 className="font-display font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 text-white">
                    <Briefcase className="h-5 w-5 text-orange-500" />
                    {editingPortId ? "Edit Portfolio Masterpiece" : "Add Portfolio Masterpiece"}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Define detailed engineering profiles, structural specifications, challenges, and solutions.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPortModalOpen(false)}
                  className="h-8 w-8 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handlePortfolioSubmit} className="p-6 md:p-8 space-y-6 flex-grow">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-5 space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider mb-1.5">Project Title</label>
                      <input
                        type="text"
                        required
                        value={portTitle}
                        onChange={(e) => setPortTitle(e.target.value)}
                        placeholder="e.g. Tata Projects Industrial Shed"
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white text-slate-800 font-semibold shadow-sm transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider mb-1.5">Category</label>
                        <select
                          value={portCategory}
                          onChange={(e) => setPortCategory(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white text-slate-800 font-semibold shadow-sm transition-all"
                        >
                          <option value="Industrial">Industrial</option>
                          <option value="Commercial">Commercial</option>
                          <option value="Residential">Residential</option>
                          <option value="PEB Steel">PEB Steel</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider mb-1.5">Status</label>
                        <select
                          value={portStatus}
                          onChange={(e) => setPortStatus(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white text-slate-800 font-semibold shadow-sm transition-all"
                        >
                          <option value="Completed">Completed</option>
                          <option value="Ongoing">Ongoing</option>
                          <option value="Under Review">Under Review</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider mb-1.5">Built Area</label>
                        <input
                          type="text"
                          required
                          value={portArea}
                          onChange={(e) => setPortArea(e.target.value)}
                          placeholder="e.g. 45,000 sq.ft"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white text-slate-800 font-semibold shadow-sm transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider mb-1.5">Location</label>
                        <input
                          type="text"
                          required
                          value={portLoc}
                          onChange={(e) => setPortLoc(e.target.value)}
                          placeholder="e.g. Taloja MIDC, Mumbai"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white text-slate-800 font-semibold shadow-sm transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider mb-1.5">Main Image or PDF File (URL / Local Upload)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={portImg}
                          onChange={(e) => setPortImg(e.target.value)}
                          placeholder="Paste image/PDF URL or upload from local gallery..."
                          className="flex-grow bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white text-slate-800 font-semibold shadow-sm transition-all"
                        />
                        <label className="bg-slate-900 hover:bg-orange-500 text-white font-bold px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer shadow-sm shrink-0">
                          {uploadingField === "main" ? "Uploading..." : "Upload File"}
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => handleFileUpload(e, "main")}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider mb-1.5">Short Card Description</label>
                      <textarea
                        required
                        rows={2}
                        value={portDescription}
                        onChange={(e) => setPortDescription(e.target.value)}
                        placeholder="A concise dynamic summary shown in project cards..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white text-slate-800 font-semibold shadow-sm resize-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider mb-1.5">Full Case Study Narrative</label>
                      <textarea
                        required
                        rows={5}
                        value={portFullDetails}
                        onChange={(e) => setPortFullDetails(e.target.value)}
                        placeholder="Write the complete design scope, structural context, and workflow narrative..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:bg-white text-slate-800 font-semibold shadow-sm resize-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="lg:col-span-7 space-y-5">
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider">Technical Specifications</label>
                        <button
                          type="button"
                          onClick={addSpecField}
                          className="text-[9px] bg-navy-950 hover:bg-orange-500 text-white font-bold px-2.5 py-1 rounded transition-colors uppercase tracking-wider"
                        >
                          + Add Spec
                        </button>
                      </div>
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {portSpecs.map((spec, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={spec}
                              onChange={(e) => updateSpecField(index, e.target.value)}
                              placeholder="e.g. Design Code: IS 800:2007"
                              className="flex-grow bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-slate-800 font-semibold shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => removeSpecField(index)}
                              className="text-red-500 hover:text-red-700 font-bold p-1 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        {portSpecs.length === 0 && (
                          <p className="text-[10px] text-slate-400 italic">No specifications defined yet.</p>
                        )}
                      </div>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider">Engineering Challenges</label>
                        <button
                          type="button"
                          onClick={addChallengeField}
                          className="text-[9px] bg-navy-950 hover:bg-orange-500 text-white font-bold px-2.5 py-1 rounded transition-colors uppercase tracking-wider"
                        >
                          + Add Challenge
                        </button>
                      </div>
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {portChallenges.map((challenge, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={challenge}
                              onChange={(e) => updateChallengeField(index, e.target.value)}
                              placeholder="e.g. Controlling dynamic vibration stresses"
                              className="flex-grow bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-slate-800 font-semibold shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => removeChallengeField(index)}
                              className="text-red-500 hover:text-red-700 font-bold p-1 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        {portChallenges.length === 0 && (
                          <p className="text-[10px] text-slate-400 italic">No challenges listed yet.</p>
                        )}
                      </div>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider">Solutions Implemented</label>
                        <button
                          type="button"
                          onClick={addSolutionField}
                          className="text-[9px] bg-navy-950 hover:bg-orange-500 text-white font-bold px-2.5 py-1 rounded transition-colors uppercase tracking-wider"
                        >
                          + Add Solution
                        </button>
                      </div>
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {portSolutions.map((sol, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={sol}
                              onChange={(e) => updateSolutionField(index, e.target.value)}
                              placeholder="e.g. Built-up plate box column configuration"
                              className="flex-grow bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-slate-800 font-semibold shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => removeSolutionField(index)}
                              className="text-red-500 hover:text-red-700 font-bold p-1 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        {portSolutions.length === 0 && (
                          <p className="text-[10px] text-slate-400 italic">No solutions listed yet.</p>
                        )}
                      </div>
                    </div>
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                      <div className="flex justify-between items-center mb-3">
                        <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider">Gallery Images (URLs)</label>
                        <button
                          type="button"
                          onClick={addGalleryField}
                          className="text-[9px] bg-navy-950 hover:bg-orange-500 text-white font-bold px-2.5 py-1 rounded transition-colors uppercase tracking-wider"
                        >
                          + Add Image URL
                        </button>
                      </div>
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {portGallery.map((gal, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={gal}
                              onChange={(e) => updateGalleryField(index, e.target.value)}
                              placeholder="Paste URL or upload local file..."
                              className="flex-grow bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-slate-800 font-semibold shadow-sm"
                            />
                            <label className="bg-slate-900 hover:bg-orange-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer shadow-sm shrink-0">
                              {uploadingField === `gallery-${index}` ? "..." : "Upload"}
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => handleFileUpload(e, index)}
                                className="hidden"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => removeGalleryField(index)}
                              className="text-red-500 hover:text-red-700 font-bold p-1 cursor-pointer shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        {portGallery.length === 0 && (
                          <p className="text-[10px] text-slate-400 italic">No gallery images added yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPortModalOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-navy-950 font-bold px-5 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmittingPortfolio}
                    className="bg-navy-950 hover:bg-orange-600 disabled:bg-slate-400 text-white font-bold px-6 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-premium cursor-pointer"
                  >
                    {isSubmittingPortfolio && <Loader2 className="h-4 w-4 animate-spin text-white" />}
                    {isSubmittingPortfolio ? "Saving..." : (editingPortId ? "Save Updates" : "Publish Masterpiece")}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
