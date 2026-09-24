"use client";

import { notifyAdmin } from "./AdminToast";
import React, { useState, useEffect } from "react";
import { useProjects } from "@/context/ProjectContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap, Settings, Download, Loader2, X, Eye, Search, Filter,
  Trash2, MessageCircle, FileText, ChevronRight, Check, Star, Calendar,
  Users, Briefcase, MapPin, User, Phone, Mail, Clock, Award, Target
} from "lucide-react";
import {
  downloadMentorshipApplicantPDF,
  downloadAllMentorshipPDF,
} from "@/lib/pdf-export";

export function MentorshipPanel() {
  const { notifications, addNotification } = useProjects();

  // State from original Mentorship tab
  const [mentorshipSettings, setMentorshipSettings] = useState<any>(null);
  const [mentorshipApplications, setMentorshipApplications] = useState<any[]>([]);
  const [loadingMentorship, setLoadingMentorship] = useState(false);
  const [savingMentorshipSettings, setSavingMentorshipSettings] = useState(false);
  const [mTitle, setMTitle] = useState("");
  const [mSubtitle, setMSubtitle] = useState("");
  const [mWhatsapp, setMWhatsapp] = useState("");
  const [mSeo, setMSeo] = useState({ title: "", description: "", keywords: "", canonicalUrl: "", ogImage: "", index: true, follow: true });
  const [mMentors, setMMentors] = useState<any[]>([]);
  const [mProgram, setMProgram] = useState({
    programType: "1-on-1 Mentorship", duration: "", sessionCount: "", sessionFormat: "", supportChannel: "", responseTime: "",
    eligibility: "", outcomes: "", included: "", process: "", audience: "", subjects: "", languages: "", policy: "",
  });
  const [searchMentorship, setSearchMentorship] = useState("");
  const [filterMentorshipStatus, setFilterMentorshipStatus] = useState("All");
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [appNotes, setAppNotes] = useState("");
  const [appStatus, setAppStatus] = useState("");
  const [isMSettingModalOpen, setIsMSettingModalOpen] = useState(false);

  const loadMentorshipData = async () => {
    setLoadingMentorship(true);
    try {
      const res = await fetch("/api/admin/mentorship");
      if (res.ok) {
        const data = await res.json();
        setMentorshipSettings(data.settings || {});
        setMentorshipApplications(data.applications || []);
        setMTitle(data.settings?.title || "");
        setMSubtitle(data.settings?.subtitle || "");
        setMWhatsapp(data.settings?.whatsappNumber || "");
        setMSeo({ title: data.settings?.seo?.title || "", description: data.settings?.seo?.description || "", keywords: Array.isArray(data.settings?.seo?.keywords) ? data.settings.seo.keywords.join(", ") : "", canonicalUrl: data.settings?.seo?.canonicalUrl || "", ogImage: data.settings?.seo?.ogImage || "", index: data.settings?.seo?.index !== false, follow: data.settings?.seo?.follow !== false });
        setMMentors(data.settings?.mentors || []);
        setMProgram({
          programType: data.settings?.programType || "1-on-1 Mentorship", duration: data.settings?.duration || "", sessionCount: data.settings?.sessionCount || "", sessionFormat: data.settings?.sessionFormat || "", supportChannel: data.settings?.supportChannel || "", responseTime: data.settings?.responseTime || "",
          eligibility: data.settings?.eligibility || "", outcomes: Array.isArray(data.settings?.outcomes) ? data.settings.outcomes.join("\n") : data.settings?.outcomes || "", included: Array.isArray(data.settings?.included) ? data.settings.included.join("\n") : data.settings?.included || "", process: Array.isArray(data.settings?.process) ? data.settings.process.join("\n") : data.settings?.process || "", audience: data.settings?.audience || "", subjects: Array.isArray(data.settings?.subjects) ? data.settings.subjects.join(", ") : data.settings?.subjects || "", languages: Array.isArray(data.settings?.languages) ? data.settings.languages.join(", ") : data.settings?.languages || "", policy: data.settings?.policy || "",
        });
      }
    } catch (err) {
      console.error("Failed to load admin mentorship data:", err);
    } finally {
      setLoadingMentorship(false);
    }
  };

  // Helper: add notification
  const notify = async (title: string, message: string, type: "info" | "success" | "warning" | "danger" = "info") => {
    await addNotification(title, message, type, true);
  };


  const handleUpdateMentorshipSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMentorshipSettings(true);
    try {
      const res = await fetch("/api/admin/mentorship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_settings",
          data: {
            title: mTitle,
            subtitle: mSubtitle,
            whatsappNumber: mWhatsapp,
            seo: { title: mSeo.title.trim(), description: mSeo.description.trim(), keywords: mSeo.keywords.split(",").map((v) => v.trim()).filter(Boolean).slice(0, 20), canonicalUrl: mSeo.canonicalUrl.trim(), ogImage: mSeo.ogImage.trim(), index: mSeo.index, follow: mSeo.follow },
            mentors: mMentors,
            ...mProgram,
            outcomes: mProgram.outcomes.split(/\n|,/).map((v) => v.trim()).filter(Boolean),
            included: mProgram.included.split(/\n|,/).map((v) => v.trim()).filter(Boolean),
            process: mProgram.process.split(/\n|,/).map((v) => v.trim()).filter(Boolean),
            subjects: mProgram.subjects.split(/,|\n/).map((v) => v.trim()).filter(Boolean),
            languages: mProgram.languages.split(/,|\n/).map((v) => v.trim()).filter(Boolean),
          },
        }),
      });
      if (res.ok) {
        notifyAdmin("Mentorship settings updated successfully!");
        setIsMSettingModalOpen(false);
        loadMentorshipData();
      } else {
        notifyAdmin("Failed to save settings.");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      notifyAdmin("Error saving settings.");
    } finally {
      setSavingMentorshipSettings(false);
    }
  };

  const handleUpdateApplicationStatus = async (appId: string, status: string, notes: string) => {
    try {
      const res = await fetch("/api/admin/mentorship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_status",
          data: { id: appId, status, notes },
        }),
      });
      if (res.ok) {
        notifyAdmin("Application status updated!");
        setSelectedApp(null);
        loadMentorshipData();
      } else {
        notifyAdmin("Failed to update application.");
      }
    } catch (err) {
      console.error("Error updating application status:", err);
    }
  };

  const handleDeleteApplication = async (appId: string) => {
    if (!confirm("Are you sure you want to delete this mentorship application request?")) return;
    try {
      const res = await fetch("/api/admin/mentorship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_application",
          data: { id: appId },
        }),
      });
      if (res.ok) {
        notifyAdmin("Application deleted.");
        loadMentorshipData();
      } else {
        notifyAdmin("Failed to delete application.");
      }
    } catch (err) {
      console.error("Error deleting application:", err);
    }
  };

  const addMentorField = () =>
    setMMentors([...mMentors, { initials: "", name: "", role: "", creds: [], tag: "Mentor", bio: "", specialties: [], exams: [], experience: "", languages: [], availability: "", sessionTopics: [], profileUrl: "" }]);
  const updateMentorField = (index: number, field: string, value: any) => {
    const updated = [...mMentors];
    updated[index] = { ...updated[index], [field]: value };
    setMMentors(updated);
  };
  const removeMentorField = (index: number) => {
    setMMentors(mMentors.filter((_, i) => i !== index));
  };

  const startEditApp = (app: any) => {
    setSelectedApp(app);
    setAppStatus(app.status);
    setAppNotes(app.notes || "");
  };

  useEffect(() => {
    loadMentorshipData();
  }, []);

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
          <h3 className="font-display font-extrabold text-xl text-navy-950">Mentorship & Application Desk</h3>
          <p className="text-xs text-navy-600 mt-1">Review student applications, manage statuses, and configure landing page details, pricing, and mentors.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => downloadAllMentorshipPDF(mentorshipApplications)}
            disabled={mentorshipApplications.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-premium cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Export All PDF
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => setIsMSettingModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-5 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-premium cursor-pointer"
          >
            <Settings className="h-4 w-4 text-white" />
            Configure Mentorship
          </motion.button>
        </div>
      </div>
      {loadingMentorship ? (
        <div className="flex flex-col justify-center items-center py-20 space-y-3">
          <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
          <p className="text-navy-600 font-bold uppercase tracking-wider text-[10px]">Loading Mentorship Data...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Total Applications</span>
              <p className="text-xl font-extrabold text-slate-900 mt-0.5">{mentorshipApplications.length}</p>
            </div>
            <div className="bg-indigo-50/50 border border-indigo-200/60 rounded-xl p-4">
              <span className="text-[9px] uppercase font-bold text-indigo-800 tracking-wider flex items-center gap-1"><Eye className="h-3 w-3" /> Page Views</span>
              <p className="text-xl font-extrabold text-indigo-950 mt-0.5">{(mentorshipSettings?.views || 0).toLocaleString()}</p>
            </div>
            <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-4 flex justify-between items-center">
              <div>
                <span className="text-[9px] uppercase font-bold text-amber-800 tracking-wider">Pending Review</span>
                <p className="text-xl font-extrabold text-amber-950 mt-0.5">{mentorshipApplications.filter(a => a.status === "Pending").length}</p>
              </div>
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
            </div>
            <div className="bg-blue-50/50 border border-blue-200/60 rounded-xl p-4">
              <span className="text-[9px] uppercase font-bold text-blue-800 tracking-wider">Contacted</span>
              <p className="text-xl font-extrabold text-blue-950 mt-0.5">{mentorshipApplications.filter(a => a.status === "Contacted").length}</p>
            </div>
            <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-4">
              <span className="text-[9px] uppercase font-bold text-emerald-800 tracking-wider">Enrolled / Approved</span>
              <p className="text-xl font-extrabold text-emerald-950 mt-0.5">{mentorshipApplications.filter(a => a.status === "Approved" || a.status === "Enrolled").length}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-display font-extrabold text-sm text-navy-950 uppercase tracking-wider">
                Applicant Submission Forms ({mentorshipApplications.length})
              </h4>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Search applicant name..."
                  value={searchMentorship}
                  onChange={(e) => setSearchMentorship(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-orange-500 focus:bg-white text-slate-800 font-semibold"
                />
                <select
                  value={filterMentorshipStatus}
                  onChange={(e) => setFilterMentorshipStatus(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-orange-500 text-navy-950 font-bold"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-navy-950 text-white font-bold uppercase tracking-wider text-[9px]">
                      <th className="p-4 border-r border-white/10 min-w-[170px]">Student Details</th>
                      <th className="p-4 border-r border-white/10 min-w-[140px]">Academic & Major</th>
                      <th className="p-4 border-r border-white/10 min-w-[150px]">Sought Areas</th>
                      <th className="p-4 border-r border-white/10 min-w-[130px]">Rating & Timezone</th>
                      <th className="p-4 border-r border-white/10 min-w-[150px]">Availability Grid</th>
                      <th className="p-4 border-r border-white/10 min-w-[200px]">Goals / Comments</th>
                      <th className="p-4 border-r border-white/10 min-w-[110px]">Payment</th>
                      <th className="p-4 border-r border-white/10 min-w-[90px]">Status</th>
                      <th className="p-4 text-right min-w-[160px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mentorshipApplications.filter(a => {
                      const matchesSearch = a.name.toLowerCase().includes(searchMentorship.toLowerCase()) || a.email.toLowerCase().includes(searchMentorship.toLowerCase());
                      const matchesStatus = filterMentorshipStatus === "All" || a.status === filterMentorshipStatus;
                      return matchesSearch && matchesStatus;
                    }).length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-12 text-center text-slate-500 font-medium">
                          No mentorship applications found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      mentorshipApplications
                        .filter(a => {
                          const matchesSearch = a.name.toLowerCase().includes(searchMentorship.toLowerCase()) || a.email.toLowerCase().includes(searchMentorship.toLowerCase());
                          const matchesStatus = filterMentorshipStatus === "All" || a.status === filterMentorshipStatus;
                          return matchesSearch && matchesStatus;
                        })
                        .map((app) => (
                          <tr key={app.id} className="even:bg-slate-50/60 hover:bg-orange-50/50 transition-colors align-top">
                            <td className="p-4 font-semibold text-navy-950 border-r border-slate-100">
                              <div className="font-extrabold text-slate-900">{app.name}</div>
                              <div className="text-[10px] text-slate-500 font-medium">{app.email}</div>
                              <div className="text-[10px] text-slate-400 font-bold mt-0.5">{app.phone}</div>
                              <div className="text-[9px] text-slate-400 mt-1">Submitted: {new Date(app.createdAt).toLocaleDateString()}</div>
                            </td>
                            <td className="p-4 border-r border-slate-100">
                              <div className="font-extrabold text-slate-800">{app.academicLevel}</div>
                              <div className="text-[10px] text-slate-500 font-bold">{app.fieldOfStudy}</div>
                              {app.mentorName && <div className="text-[10px] text-orange-600 font-extrabold mt-0.5">Mentor: {app.mentorName}</div>}
                            </td>
                            <td className="p-4 border-r border-slate-100">
                              <div className="flex flex-wrap gap-1 max-w-[150px]">
                                {(app.mentorshipAreas || []).map((area: string) => (
                                  <span key={area} className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded font-bold text-[8px] uppercase tracking-wide">
                                    {area}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-4 border-r border-slate-100">
                              <div className="font-semibold text-slate-700">Proficiency: <span className="font-extrabold text-orange-500">{app.proficiency}/5</span></div>
                              <div className="text-[9px] text-slate-400 font-bold mt-1 max-w-[120px] truncate" title={app.timeZoneComfort}>TZ: {app.timeZoneComfort}</div>
                            </td>
                            <td className="p-4 border-r border-slate-100">
                              <div className="space-y-1 text-[9px] font-bold text-slate-650">
                                {Object.entries(app.availability || {}).map(([slot, days]) => {
                                  const daysArr = Array.isArray(days) ? days : [];
                                  if (daysArr.length === 0) return null;
                                  return (
                                    <div key={slot}>
                                      <span className="text-slate-400 uppercase text-[8px] font-extrabold">{slot}:</span> {daysArr.map(d => d.substring(0,3)).join(", ")}
                                    </div>
                                  );
                                })}
                                {Object.values(app.availability || {}).flat().length === 0 && (
                                  <span className="text-slate-400 italic text-[10px]">None specified</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-slate-650 max-w-[200px] font-medium whitespace-pre-wrap leading-relaxed border-r border-slate-100">
                              <p className="line-clamp-3" title={app.goals}>{app.goals}</p>
                              {app.notes && (
                                <div className="mt-1.5 p-2 bg-slate-50 border border-slate-200/70 rounded text-[9px] font-bold text-slate-600">
                                  Notes: {app.notes}
                                </div>
                              )}
                            </td>
                            <td className="p-4 border-r border-slate-100">
                              <div className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider ${app.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-700" : app.paymentStatus === "Free" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                                {app.paymentStatus || "Not Paid"}
                              </div>
                              {app.paymentAmount > 0 && <div className="text-[10px] text-slate-500 font-bold mt-1">₹{Number(app.paymentAmount).toLocaleString("en-IN")}</div>}
                              {app.paymentDate && <div className="text-[9px] text-slate-400 mt-1">{new Date(app.paymentDate).toLocaleDateString()}</div>}
                            </td>
                            <td className="p-4 border-r border-slate-100">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-[9px] uppercase ${
                                app.status === "Pending" ? "bg-amber-100 text-amber-700" :
                                app.status === "Contacted" ? "bg-blue-100 text-blue-700" :
                                app.status === "Approved" || app.status === "Enrolled" ? "bg-emerald-100 text-emerald-700" :
                                "bg-red-100 text-red-700"
                              }`}>
                                {app.status}
                              </span>
                            </td>
                            <td className="p-4 text-right space-y-1.5">
                              <div className="flex justify-end gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => startEditApp(app)}
                                  className="bg-navy-950 hover:bg-orange-600 text-white font-bold px-2.5 py-1.5 rounded text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                  Notes / Status
                                </button>
                                <button
                                  type="button"
                                  onClick={() => downloadMentorshipApplicantPDF(app)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded text-[10px] uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Download applicant PDF"
                                >
                                  <Download className="h-3 w-3" />
                                  PDF
                                </button>
                                <a
                                  href={`https://wa.me/${(app.phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                    `Hi ${app.name}, I reviewed your application for Civil At Hand Mentorship targeting ${app.fieldOfStudy}. Let's schedule a call to discuss your goals!`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-green-500 hover:bg-green-600 text-white font-bold px-2.5 py-1.5 rounded text-[10px] uppercase tracking-wider flex items-center justify-center transition-colors cursor-pointer"
                                >
                                  MessageCircle
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteApplication(app.id)}
                                  className="bg-red-50 hover:bg-red-500 hover:text-white text-red-600 p-1.5 rounded transition-colors cursor-pointer border border-transparent hover:border-red-200"
                                  title="Delete Form"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl shadow-premium-lg border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col"
            >
              <div className="sticky top-0 z-20 px-5 py-4 bg-navy-950 text-white flex justify-between items-center rounded-t-2xl">
                <div>
                  <h4 className="font-display font-extrabold text-sm uppercase tracking-wider text-white">Application Detail</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Submitted {new Date(selectedApp.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <button type="button" onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5 space-y-5">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
                  <p className="font-extrabold text-slate-900 text-base">{selectedApp.name}</p>
                  <p className="text-xs text-slate-500 font-semibold">{selectedApp.email}</p>
                  {selectedApp.phone && (
                    <p className="text-xs text-slate-500 font-bold">{selectedApp.phone}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-extrabold text-orange-500 uppercase tracking-widest">Academic Profile</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Level</p>
                      <p className="text-xs font-bold text-slate-800">{selectedApp.academicLevel || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Field / Major</p>
                      <p className="text-xs font-bold text-slate-800">{selectedApp.fieldOfStudy || "—"}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[9px] font-extrabold text-orange-500 uppercase tracking-widest">Areas Sought</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedApp.mentorshipAreas || []).length > 0 ? (
                      (selectedApp.mentorshipAreas || []).map((area: string) => (
                        <span key={area} className="bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wide">
                          {area}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">None specified</span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[9px] font-extrabold text-orange-500 uppercase tracking-widest">Proficiency</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-extrabold border-2 ${
                            n <= (selectedApp.proficiency || 0)
                              ? "bg-orange-500 border-orange-500 text-white"
                              : "border-slate-200 text-slate-300"
                          }`}
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-extrabold text-orange-500 uppercase tracking-widest">Time Zone</p>
                    <p className="text-[10px] font-bold text-slate-700 leading-relaxed">{selectedApp.timeZoneComfort || "—"}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[9px] font-extrabold text-orange-500 uppercase tracking-widest">Goals</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">{selectedApp.goals || "—"}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[9px] font-extrabold text-orange-500 uppercase tracking-widest">Availability</p>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-[10px] border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-2 font-extrabold text-slate-400 uppercase tracking-wider text-[8px] border-r border-slate-100 w-20" />
                          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                            <th key={d} className="p-2 text-center font-bold text-slate-500 text-[8px] uppercase">{d}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {["Morning", "Afternoon", "Evening"].map((slot) => (
                          <tr key={slot}>
                            <td className="p-2 border-r border-slate-100 bg-slate-50/50 font-extrabold text-[8px] text-slate-500 uppercase tracking-wider">{slot}</td>
                            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => {
                              const checked = (selectedApp.availability?.[slot] || []).includes(day);
                              return (
                                <td key={day} className="p-2 text-center">
                                  <span className={`inline-block h-4 w-4 rounded border-2 ${checked ? "bg-orange-500 border-orange-500" : "border-slate-200"}`}>
                                    {checked && (
                                      <svg viewBox="0 0 10 8" className="h-full w-full p-0.5" fill="none">
                                        <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    )}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="border-t border-slate-200" />
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Application Status</label>
                  <select
                    value={appStatus}
                    onChange={(e) => setAppStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2.5 text-xs focus:outline-none focus:border-orange-500 text-navy-950 font-bold"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Approved">Approved / Enrolled</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Internal Follow-up Notes</label>
                  <textarea
                    rows={3}
                    value={appNotes}
                    onChange={(e) => setAppNotes(e.target.value)}
                    placeholder="Add call summaries, comments, scheduled times..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 focus:bg-white text-slate-800 font-medium"
                  />
                </div>
                <div className="flex justify-between items-center gap-2 border-t border-slate-100 pt-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => downloadMentorshipApplicantPDF(selectedApp)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-lg text-[11px] uppercase cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download PDF
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedApp(null)}
                      className="bg-slate-100 hover:bg-slate-200 text-navy-950 font-bold px-4 py-2.5 rounded-lg text-[11px] uppercase cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateApplicationStatus(selectedApp.id, appStatus, appNotes)}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-lg text-[11px] uppercase cursor-pointer"
                    >
                      Save Details
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isMSettingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl shadow-premium-lg border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col"
            >
              <div className="sticky top-0 z-20 px-6 py-4 bg-navy-950 text-white flex justify-between items-center rounded-t-2xl">
                <div>
                  <h4 className="font-display font-extrabold text-sm uppercase tracking-wider text-white">Configure Mentorship Page Section</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Customize hero headers, pricing tags, WhatsApp numbers, Cashfree link, and mentors credentials list.</p>
                </div>
                <button type="button" onClick={() => setIsMSettingModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleUpdateMentorshipSettings} className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider mb-1.5">Hero Title Heading</label>
                    <input
                      type="text"
                      required
                      value={mTitle}
                      onChange={(e) => setMTitle(e.target.value)}
                      placeholder="e.g. Learn From a Real Topper"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 font-semibold"
                    />
                  </div>
                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800">Payment managed centrally</p>
                    <p className="text-[9px] text-blue-700 mt-1">Mentorship price, checkout status, coupons, refunds and payment records are managed only from Admin → Payments.</p>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider mb-1.5">Hero Subtitle Paragraph</label>
                  <textarea
                    rows={3}
                    required
                    value={mSubtitle}
                    onChange={(e) => setMSubtitle(e.target.value)}
                    placeholder="Mentorship overview and scope description..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>
                <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div><h5 className="font-extrabold text-sm text-slate-900">SEO & Social Preview</h5><p className="text-[10px] text-slate-500 mt-1">Optional. Empty fields keep the existing page defaults.</p></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label><span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">SEO title</span><input value={mSeo.title} onChange={(e) => setMSeo(v => ({...v, title:e.target.value}))} maxLength={70} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-xs font-semibold" placeholder="Mentorship | Civil At Hand" /></label>
                    <label><span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Canonical URL</span><input value={mSeo.canonicalUrl} onChange={(e) => setMSeo(v => ({...v, canonicalUrl:e.target.value}))} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-xs font-semibold" placeholder="https://civilathand.com/mentorship" /></label>
                    <label className="md:col-span-2"><span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Meta description</span><textarea value={mSeo.description} onChange={(e) => setMSeo(v => ({...v, description:e.target.value}))} maxLength={180} rows={2} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-xs font-medium resize-y" placeholder="Short search result description…" /></label>
                    <label className="md:col-span-2"><span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Keywords</span><input value={mSeo.keywords} onChange={(e) => setMSeo(v => ({...v, keywords:e.target.value}))} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-xs font-semibold" placeholder="GATE mentorship, IES mentor, SSC JE guidance" /></label>
                    <label className="md:col-span-2"><span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Social image URL</span><input value={mSeo.ogImage} onChange={(e) => setMSeo(v => ({...v, ogImage:e.target.value}))} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-xs font-semibold" placeholder="/uploads/mentorship-og.jpg" /></label>
                  </div>
                  <div className="flex flex-wrap gap-4"><label className="inline-flex items-center gap-2 text-[10px] font-bold text-slate-700"><input type="checkbox" checked={mSeo.index} onChange={(e) => setMSeo(v => ({...v, index:e.target.checked}))} /> Allow indexing</label><label className="inline-flex items-center gap-2 text-[10px] font-bold text-slate-700"><input type="checkbox" checked={mSeo.follow} onChange={(e) => setMSeo(v => ({...v, follow:e.target.checked}))} /> Allow link following</label></div>
                </section>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider mb-1.5">Contact WhatsApp Number (No + sign)</label>
                    <input
                      type="text"
                      required
                      value={mWhatsapp}
                      onChange={(e) => setMWhatsapp(e.target.value)}
                      placeholder="e.g. 91XXXXXXXXXX"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-orange-500 font-semibold"
                    />
                  </div>
                  <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800">Payment managed centrally</p>
                    <p className="text-xs text-blue-700 mt-1">Set the mentorship price, enable/disable checkout, coupons, refunds and payment links only from Admin → Payments. This panel controls mentorship content and applications.</p>
                  </div>
                </div>
                <section className="border border-slate-200 rounded-xl p-4 bg-white space-y-4">
                  <div><h5 className="font-extrabold text-sm text-slate-900">Program Configuration</h5><p className="text-[10px] text-slate-500">Define the actual service without forcing admins to fill unnecessary fields.</p></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {([["programType","Program type"],["duration","Duration"],["sessionCount","Sessions included"],["sessionFormat","Session format"],["supportChannel","Support channel"],["responseTime","Response time"]] as const).map(([key,label]) => <div key={key}><label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">{label}</label><input value={(mProgram as any)[key]} onChange={(e) => setMProgram({ ...mProgram, [key]: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-xs font-semibold" /></div>)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {([["eligibility","Eligibility / who should apply"],["audience","Ideal audience"],["subjects","Subjects / exam areas (comma separated)"],["languages","Supported languages (comma separated)"],["outcomes","Expected outcomes (one per line)"],["included","What is included (one per line)"],["process","Onboarding process (one per line)"],["policy","Important policy / expectations"]] as const).map(([key,label]) => <div key={key}><label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">{label}</label><textarea rows={key === "policy" || key === "eligibility" || key === "audience" ? 2 : 3} value={(mProgram as any)[key]} onChange={(e) => setMProgram({ ...mProgram, [key]: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 text-xs font-medium resize-y" /></div>)}
                  </div>
                </section>

                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-[10px] font-bold text-navy-950 uppercase tracking-wider">Mentors List Profiles</label>
                    <button
                      type="button"
                      onClick={addMentorField}
                      className="bg-navy-950 hover:bg-orange-500 text-white font-bold px-3 py-1 rounded text-[9px] uppercase tracking-wider cursor-pointer"
                    >
                      + Add Mentor Profile
                    </button>
                  </div>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {mMentors.map((mentor, mIdx) => (
                      <div key={mIdx} className="bg-white p-3 border border-slate-200 rounded-lg space-y-2 relative">
                        <button
                          type="button"
                          onClick={() => removeMentorField(mIdx)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold p-1 cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                          {[
                            ["initials", "Initials", "NK"], ["name", "Full name", "Naveen Kumar"], ["role", "Role / achievement", "GATE / IES Topper"], ["tag", "Profile tag", "Lead Mentor"],
                            ["experience", "Mentoring experience", "5+ years"], ["availability", "Availability", "Weekdays 6–9 PM"], ["profileUrl", "Profile URL", "https://..."]
                          ].map(([field, label, placeholder]) => (
                            <div key={field}>
                              <label className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
                              <input type="text" value={mentor[field] || ""} onChange={(e) => updateMentorField(mIdx, field, e.target.value)} placeholder={placeholder} className="w-full border rounded p-2 text-[10px] font-semibold" />
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {[
                            ["specialties", "Specialties (one per line)", mentor.specialties], ["exams", "Exams / domains (one per line)", mentor.exams], ["languages", "Languages (one per line)", mentor.languages], ["sessionTopics", "Session topics (one per line)", mentor.sessionTopics]
                          ].map(([field, label, value]) => (
                            <div key={String(field)}><label className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">{label}</label><textarea rows={2} value={Array.isArray(value) ? value.join("\n") : value || ""} onChange={(e) => updateMentorField(mIdx, String(field), e.target.value.split("\n"))} className="w-full border rounded p-2 text-[10px] leading-tight resize-y" /></div>
                          ))}
                        </div>
                        <div><label className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Professional bio</label><textarea rows={3} value={mentor.bio || ""} onChange={(e) => updateMentorField(mIdx, "bio", e.target.value)} placeholder="Short professional mentor profile..." className="w-full border rounded p-2 text-[10px] leading-relaxed resize-y" /></div>
                        <div><label className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Credentials / proof points</label><textarea rows={3} value={Array.isArray(mentor.creds) ? mentor.creds.join("\n") : mentor.creds || ""} onChange={(e) => updateMentorField(mIdx, "creds", e.target.value.split("\n"))} placeholder="One credential per line" className="w-full border rounded p-2 text-[10px] leading-tight resize-y" /></div>
                      </div>
                    ))}
                    {mMentors.length === 0 && (
                      <p className="text-[10px] text-slate-400 italic text-center py-4 bg-white border border-dashed rounded-lg">No mentor profiles configured yet.</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsMSettingModalOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-navy-950 font-bold px-5 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingMentorshipSettings}
                    className="bg-navy-950 hover:bg-orange-600 disabled:bg-slate-400 text-white font-bold px-6 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-premium cursor-pointer"
                  >
                    {savingMentorshipSettings && <Loader2 className="h-4 w-4 animate-spin text-white" />}
                    {savingMentorshipSettings ? "Saving Settings..." : "Save Configs"}
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
