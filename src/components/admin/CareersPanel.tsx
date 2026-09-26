"use client";

import { notifyAdmin } from "./AdminToast";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Settings, Download, Trash2, Loader2, X, FileText, MapPin, Edit3, Plus, CheckCircle2
} from "lucide-react";

export function CareersPanel() {
  const [careerApps, setCareerApps] = useState<any[]>([]);
  const [careerAppsLoaded, setCareerAppsLoaded] = useState(false);
  const [isCareerConfigModalOpen, setIsCareerConfigModalOpen] = useState(false);
  const [savingCareerConfig, setSavingCareerConfig] = useState(false);
  const [cfgRoles, setCfgRoles] = useState<any[]>([]);
  const [cfgExpOptions, setCfgExpOptions] = useState<string[]>([]);
  const [cfgQualOptions, setCfgQualOptions] = useState<string[]>([]);
  const [cfgFieldSettings, setCfgFieldSettings] = useState({
    requireResume: true,
    showNoteField: true,
    requirePhone: true,
  });
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [newRoleTitle, setNewRoleTitle] = useState("");
  const [newRoleType, setNewRoleType] = useState("Full-time / Freelance");
  const [newRoleLocation, setNewRoleLocation] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRoleFullDetails, setNewRoleFullDetails] = useState("");
  const [newRoleMeta, setNewRoleMeta] = useState({
    slug: "", department: "", workplace: "", openings: "1", salary: "", deadline: "", experience: "",
    skills: "", responsibilities: "", qualifications: "", benefits: "", process: "", tags: "",
    metaTitle: "", metaDescription: "", keywords: "", featured: false, applyEnabled: true,
  });
  const [newExpInput, setNewExpInput] = useState("");
  const [newQualInput, setNewQualInput] = useState("");

  const loadCareerApplications = async () => {
    try {
      const res = await fetch("/api/admin/career-applications");
      if (!res.ok) throw new Error("Failed to load applications");
      const data = await res.json();
      setCareerApps(data.applications || []);
      setCareerAppsLoaded(true);
    } catch (err) {
      console.error("Error loading career applications:", err);
    }
  };

  const handleDeleteCareerApp = async (id: string) => {
    if (!confirm("Delete this application? This cannot be undone.")) return;
    try {
      await fetch(`/api/admin/career-applications?id=${id}`, { method: "DELETE" });
      await loadCareerApplications();
    } catch (err) {
      notifyAdmin("Failed to delete application.");
    }
  };

  const loadCareerSettings = async () => {
    try {
      const res = await fetch("/api/admin/career-settings");
      if (!res.ok) throw new Error("Failed to fetch career settings");
      const data = await res.json();
      setCfgRoles(data.roles || []);
      setCfgExpOptions(data.experienceOptions || []);
      setCfgQualOptions(data.qualificationOptions || []);
      setCfgFieldSettings(data.fieldSettings || { requireResume: true, showNoteField: true, requirePhone: true });
    } catch (err) {
      console.error("Error loading career settings:", err);
    }
  };

  const handleSaveCareerSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCareerConfig(true);
    try {
      const res = await fetch("/api/admin/career-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roles: cfgRoles,
          experienceOptions: cfgExpOptions,
          qualificationOptions: cfgQualOptions,
          fieldSettings: cfgFieldSettings,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save configuration");
      notifyAdmin("Career configuration saved successfully!");
      setIsCareerConfigModalOpen(false);
    } catch (err: any) {
      notifyAdmin(err.message || "Failed to save configuration.");
    } finally {
      setSavingCareerConfig(false);
    }
  };

  const handleStartEditRole = (role: any) => {
    setEditingRoleId(role.id);
    setNewRoleTitle(role.title || "");
    setNewRoleType(role.type || "Full-time / Freelance");
    setNewRoleLocation(role.location || "");
    setNewRoleDesc(role.desc || "");
    setNewRoleFullDetails(role.fullDetails || "");
    setNewRoleMeta({
      slug: role.slug || "", department: role.department || "", workplace: role.workplace || "", openings: String(role.openings ?? 1), salary: role.salary || "", deadline: role.deadline || "", experience: role.experience || "",
      skills: Array.isArray(role.skills) ? role.skills.join("\n") : role.skills || "", responsibilities: Array.isArray(role.responsibilities) ? role.responsibilities.join("\n") : role.responsibilities || "", qualifications: Array.isArray(role.qualifications) ? role.qualifications.join("\n") : role.qualifications || "", benefits: Array.isArray(role.benefits) ? role.benefits.join("\n") : role.benefits || "", process: Array.isArray(role.process) ? role.process.join("\n") : role.process || "", tags: Array.isArray(role.tags) ? role.tags.join(", ") : role.tags || "", metaTitle: role.metaTitle || "", metaDescription: role.metaDescription || "", keywords: Array.isArray(role.keywords) ? role.keywords.join(", ") : role.keywords || "", featured: Boolean(role.featured), applyEnabled: role.applyEnabled !== false,
    });
  };

  const handleCancelEditRole = () => {
    setEditingRoleId(null);
    setNewRoleTitle("");
    setNewRoleType("Full-time / Freelance");
    setNewRoleLocation("");
    setNewRoleDesc("");
    setNewRoleFullDetails("");
    setNewRoleMeta({ slug: "", department: "", workplace: "", openings: "1", salary: "", deadline: "", experience: "", skills: "", responsibilities: "", qualifications: "", benefits: "", process: "", tags: "", metaTitle: "", metaDescription: "", keywords: "", featured: false, applyEnabled: true });
  };

  const handleAddOrUpdateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleTitle.trim()) return;

    const normalizedList = (value: string) => value.split(/\n|,/).map((v) => v.trim()).filter(Boolean);
    const slug = newRoleMeta.slug.trim() || newRoleTitle.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    // Keep the admin editor focused on the information needed to publish a
    // professional vacancy. Existing legacy/SEO fields remain untouched when
    // an older job is edited.
    const advanced = {
      slug,
      department: newRoleMeta.department.trim(),
      workplace: newRoleMeta.workplace.trim(),
      openings: Math.max(1, Number(newRoleMeta.openings) || 1),
      deadline: newRoleMeta.deadline.trim(),
      experience: newRoleMeta.experience.trim(),
      skills: normalizedList(newRoleMeta.skills),
      responsibilities: normalizedList(newRoleMeta.responsibilities),
      qualifications: normalizedList(newRoleMeta.qualifications),
      applyEnabled: newRoleMeta.applyEnabled,
    };
    if (editingRoleId) {
      setCfgRoles(cfgRoles.map((r) => r.id === editingRoleId ? { ...r, title: newRoleTitle.trim(), type: newRoleType, location: newRoleLocation.trim(), desc: newRoleDesc.trim(), fullDetails: newRoleFullDetails.trim(), ...advanced } : r));
      handleCancelEditRole();
    } else {
      setCfgRoles([...cfgRoles, { id: `role-${Date.now()}`, title: newRoleTitle.trim(), type: newRoleType, location: newRoleLocation.trim(), desc: newRoleDesc.trim(), fullDetails: newRoleFullDetails.trim(), active: true, ...advanced }]);
      handleCancelEditRole();
    }
  };

  const handleToggleRoleActive = (roleId: string) => {
    setCfgRoles(cfgRoles.map(r => r.id === roleId ? { ...r, active: !r.active } : r));
  };

  const handleDeleteRole = (roleId: string) => {
    setCfgRoles(cfgRoles.filter(r => r.id !== roleId));
  };

  const handleAddExpOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpInput.trim()) return;
    if (cfgExpOptions.includes(newExpInput.trim())) return;
    setCfgExpOptions([...cfgExpOptions, newExpInput.trim()]);
    setNewExpInput("");
  };

  const handleDeleteExpOption = (opt: string) => {
    setCfgExpOptions(cfgExpOptions.filter(o => o !== opt));
  };

  const handleAddQualOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQualInput.trim()) return;
    if (cfgQualOptions.includes(newQualInput.trim())) return;
    setCfgQualOptions([...cfgQualOptions, newQualInput.trim()]);
    setNewQualInput("");
  };

  const handleDeleteQualOption = (opt: string) => {
    setCfgQualOptions(cfgQualOptions.filter(o => o !== opt));
  };

  const downloadCareerPDF = async (app: any) => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const lines = [
        "NS Construction — Career Application",
        "",
        `Name: ${app.name || ""}`,
        `Role: ${app.role || "General Position"}`,
        `Phone: ${app.phone || ""}`,
        `Email: ${app.email || ""}`,
        `Experience: ${app.experience || ""}`,
        `Qualification: ${app.qualification || ""}`,
        `Applied: ${app.createdAt ? new Date(app.createdAt).toLocaleString("en-IN") : ""}`,
        "",
        "Note / Details:",
        ...(String(app.note || "—").match(/.{1,95}(?:\\s|$)/g) || ["—"]),
      ];
      let y = 18;
      for (const line of lines) {
        if (y > 280) { doc.addPage(); y = 18; }
        doc.text(line, 14, y);
        y += line === "" ? 6 : 7;
      }
      doc.save(`career-application-${String(app.name || "candidate").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "candidate"}.pdf`);
    } catch (error) {
      console.error("Failed to export career PDF:", error);
      notifyAdmin("Could not create the PDF. Please try again.");
    }
  };

  const downloadAllCareersPDF = async (apps: any[]) => {
    if (!apps.length) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      apps.forEach((app, index) => {
        if (index > 0) doc.addPage();
        const lines = [
          "NS Construction — Career Application",
          "",
          `Name: ${app.name || ""}`,
          `Role: ${app.role || "General Position"}`,
          `Phone: ${app.phone || ""}`,
          `Email: ${app.email || ""}`,
          `Experience: ${app.experience || ""}`,
          `Qualification: ${app.qualification || ""}`,
          `Applied: ${app.createdAt ? new Date(app.createdAt).toLocaleString("en-IN") : ""}`,
          "",
          "Note / Details:",
          ...(String(app.note || "—").match(/.{1,95}(?:\\s|$)/g) || ["—"]),
        ];
        let y = 18;
        for (const line of lines) {
          if (y > 280) { doc.addPage(); y = 18; }
          doc.text(line, 14, y);
          y += line === "" ? 6 : 7;
        }
      });
      doc.save("civil-at-hand-career-applications.pdf");
    } catch (error) {
      console.error("Failed to export career PDFs:", error);
      notifyAdmin("Could not create the PDF export. Please try again.");
    }
  };

  useEffect(() => {
    loadCareerApplications();
  }, []);

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
          <h3 className="font-display font-extrabold text-xl text-navy-950">Career Applications</h3>
          <p className="text-xs text-slate-500 mt-0.5">Review candidate submissions from the &apos;Build With Us&apos; application form.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => downloadAllCareersPDF(careerApps)}
            disabled={careerApps.length === 0}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-premium"
          >
            <Download className="h-3.5 w-3.5" /> Export All PDF
          </button>
          <button
            type="button"
            onClick={async () => {
              await loadCareerSettings();
              setIsCareerConfigModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-navy-950 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-premium"
          >
            <Settings className="h-3.5 w-3.5" /> Configure Roles & Form
          </button>
          
        </div>
      </div>
      {!careerAppsLoaded ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : careerApps.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">No applications received yet.</p>
          <p className="text-xs text-slate-400 mt-1">Applications submitted on the /work-with-us page will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {careerApps.map((app) => (
            <div
              key={app.id}
              className="border border-slate-200 rounded-xl p-5 bg-white hover:border-orange-300 hover:shadow-sm transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base leading-tight">{app.name}</h4>
                    <span className="inline-block bg-orange-50 text-orange-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider mt-1 border border-orange-100">
                      {app.role || "General Position"}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">
                    {new Date(app.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Mobile</span>
                    <a href={`tel:${app.phone}`} className="text-slate-900 hover:text-orange-600 font-bold">{app.phone}</a>
                  </div>
                  <div>
                    <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Email</span>
                    <a href={`mailto:${app.email}`} className="text-slate-900 hover:text-orange-600 font-bold truncate block">{app.email}</a>
                  </div>
                  <div className="mt-2">
                    <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Experience</span>
                    <span className="text-slate-800 font-bold">{app.experience}</span>
                  </div>
                  <div className="mt-2">
                    <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Qualification</span>
                    <span className="text-slate-800 font-bold truncate block">{app.qualification}</span>
                  </div>
                </div>
                {app.note && (
                  <div className="text-xs text-slate-600 bg-amber-50/60 border border-amber-100 p-3 rounded-lg leading-relaxed">
                    <span className="block text-[9px] font-extrabold text-amber-700 uppercase tracking-widest mb-0.5">Note / Details</span>
                    <p className="text-[11px] font-medium">{app.note}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  {app.resumeUrl ? (
                    <a
                      href={app.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-navy-950 hover:bg-orange-600 text-white font-bold px-3.5 py-2 rounded-lg text-[10px] uppercase tracking-wider transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5" /> Resume
                    </a>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 italic">No resume</span>
                  )}
                  <button
                    type="button"
                    onClick={() => downloadCareerPDF(app)}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-lg text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" /> PDF
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteCareerApp(app.id)}
                  className="bg-red-50 hover:bg-red-500 hover:text-white text-red-600 font-bold p-2 rounded-lg transition-colors cursor-pointer"
                  title="Delete Application"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <AnimatePresence>
        {isCareerConfigModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="bg-white rounded-2xl shadow-premium-lg border border-slate-200 w-full max-w-5xl max-h-[92vh] overflow-y-auto"
            >
              <div className="sticky top-0 z-20 px-6 py-4 bg-navy-950 text-white flex items-center justify-between rounded-t-2xl">
                <div>
                  <h4 className="font-display font-extrabold text-sm uppercase tracking-wider">Configure Roles & Application Form</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Changes apply to the public Work With Us page after saving.</p>
                </div>
                <button type="button" onClick={() => { setIsCareerConfigModalOpen(false); handleCancelEditRole(); }} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCareerSettings} className="p-6 space-y-7">
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-extrabold text-sm text-slate-900">Open Roles</h5>
                      <p className="text-[10px] text-slate-500">Add, edit, activate, or remove public roles.</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{cfgRoles.length} roles</span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {cfgRoles.map((role) => (
                      <div key={role.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h6 className="font-extrabold text-sm text-slate-900">{role.title}</h6>
                            <p className="text-[10px] text-slate-500 mt-0.5">{role.type} • {role.location}</p>
                            <p className="text-[9px] text-slate-400 mt-1">/work-with-us/{role.slug || role.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-")}</p>
                          </div>
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-1 rounded-full ${role.active !== false ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>{role.active !== false ? "Active" : "Hidden"}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">{role.desc}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {role.department && <span className="px-2 py-1 rounded-full bg-white border text-[9px] font-bold text-slate-500">{role.department}</span>}
                          {role.workplace && <span className="px-2 py-1 rounded-full bg-white border text-[9px] font-bold text-slate-500">{role.workplace}</span>}
                          {role.featured && <span className="px-2 py-1 rounded-full bg-orange-50 border border-orange-100 text-[9px] font-bold text-orange-600">Featured</span>}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button type="button" onClick={() => handleStartEditRole(role)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-700"><Edit3 className="h-3 w-3" /> Edit Job</button>
                          <a href={`/work-with-us/${role.slug || role.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-700">View Page</a>
                          <button type="button" onClick={() => handleToggleRoleActive(role.id)} className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-700">{role.active !== false ? "Hide" : "Activate"}</button>
                          <button type="button" onClick={() => handleDeleteRole(role.id)} className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-[10px] font-bold">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={`border rounded-xl p-4 space-y-4 ${editingRoleId ? "border-orange-100 bg-orange-50/40" : "border-dashed border-slate-300 bg-white"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                          {editingRoleId ? <Edit3 className="h-4 w-4 text-orange-500" /> : <Plus className="h-4 w-4 text-orange-500" />}
                          {editingRoleId ? "Edit Job" : "Add New Job"}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Enter only the professional details candidates need to understand the role.
                        </p>
                      </div>
                      {editingRoleId && <button type="button" onClick={handleCancelEditRole} className="text-xs font-bold text-slate-500 hover:text-slate-900">Cancel</button>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Field label="Job title *" value={newRoleTitle} onChange={setNewRoleTitle} placeholder="e.g. Civil Engineer" />
                      <Field label="Employment type" value={newRoleType} onChange={setNewRoleType} placeholder="Full-time / Part-time / Freelance / Internship" />
                      <Field label="Location" value={newRoleLocation} onChange={setNewRoleLocation} placeholder="City, State or Remote" />
                      <Field label="Department" value={newRoleMeta.department} onChange={(v) => setNewRoleMeta({ ...newRoleMeta, department: v })} placeholder="Civil / Architecture / Operations" />
                      <Field label="Workplace" value={newRoleMeta.workplace} onChange={(v) => setNewRoleMeta({ ...newRoleMeta, workplace: v })} placeholder="On-site / Hybrid / Remote" />
                      <Field label="Experience" value={newRoleMeta.experience} onChange={(v) => setNewRoleMeta({ ...newRoleMeta, experience: v })} placeholder="e.g. 0–2 years" />
                      <Field label="Openings" value={newRoleMeta.openings} onChange={(v) => setNewRoleMeta({ ...newRoleMeta, openings: v })} placeholder="1" type="number" />
                      <Field label="Application deadline" value={newRoleMeta.deadline} onChange={(v) => setNewRoleMeta({ ...newRoleMeta, deadline: v })} type="date" />
                    </div>

                    <Field label="Short job summary" value={newRoleDesc} onChange={setNewRoleDesc} placeholder="One clear sentence explaining what the person will do." />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {([
                        ["responsibilities", "Responsibilities", "Main duties, one per line"],
                        ["qualifications", "Qualifications", "Required education or certification, one per line"],
                        ["skills", "Skills", "Required technical/professional skills, one per line"],
                      ] as const).map(([key, label, placeholder]) => (
                        <div key={key}>
                          <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">{label}</label>
                          <textarea
                            rows={5}
                            value={(newRoleMeta as any)[key]}
                            onChange={(e) => setNewRoleMeta({ ...newRoleMeta, [key]: e.target.value })}
                            placeholder={placeholder}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 resize-y bg-white"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-1">
                      <label className="flex items-center gap-2 text-[10px] font-bold text-slate-700">
                        <input type="checkbox" checked={newRoleMeta.applyEnabled} onChange={(e) => setNewRoleMeta({ ...newRoleMeta, applyEnabled: e.target.checked })} />
                        Accept applications
                      </label>
                      <p className="text-[10px] text-slate-400">SEO, tags, benefits and other legacy fields are managed automatically and are not required here.</p>
                    </div>

                    <div className="flex justify-end">
                      <button type="button" onClick={(e) => handleAddOrUpdateRole(e as any)} className="inline-flex items-center gap-1.5 bg-navy-950 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-lg text-[10px] uppercase tracking-wider">
                        {editingRoleId ? <><CheckCircle2 className="h-3.5 w-3.5" /> Save Job</> : <><Plus className="h-3.5 w-3.5" /> Add Job</>}
                      </button>
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <h5 className="font-extrabold text-sm text-slate-900">Experience Options</h5>
                    <form onSubmit={handleAddExpOption} className="flex gap-2">
                      <input value={newExpInput} onChange={(e) => setNewExpInput(e.target.value)} placeholder="Add option" className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900" />
                      <button type="submit" className="px-3 py-2 bg-navy-950 text-white rounded-lg text-xs font-bold">Add</button>
                    </form>
                    <div className="space-y-1.5">
                      {cfgExpOptions.map((opt) => (
                        <div key={opt} className="flex items-center justify-between gap-2 bg-slate-50 rounded-lg px-3 py-2">
                          <span className="text-[11px] text-slate-700">{opt}</span>
                          <button type="button" onClick={() => handleDeleteExpOption(opt)} className="text-red-500 text-[10px] font-bold">Remove</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <h5 className="font-extrabold text-sm text-slate-900">Qualification Options</h5>
                    <form onSubmit={handleAddQualOption} className="flex gap-2">
                      <input value={newQualInput} onChange={(e) => setNewQualInput(e.target.value)} placeholder="Add option" className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900" />
                      <button type="submit" className="px-3 py-2 bg-navy-950 text-white rounded-lg text-xs font-bold">Add</button>
                    </form>
                    <div className="space-y-1.5">
                      {cfgQualOptions.map((opt) => (
                        <div key={opt} className="flex items-center justify-between gap-2 bg-slate-50 rounded-lg px-3 py-2">
                          <span className="text-[11px] text-slate-700">{opt}</span>
                          <button type="button" onClick={() => handleDeleteQualOption(opt)} className="text-red-500 text-[10px] font-bold">Remove</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="border border-slate-200 rounded-xl p-4">
                  <h5 className="font-extrabold text-sm text-slate-900 mb-3">Public Form Fields</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      ["requireResume", "Require Resume"],
                      ["requirePhone", "Require Phone"],
                      ["showNoteField", "Show Note / Details"],
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean((cfgFieldSettings as any)[key])}
                          onChange={(e) => setCfgFieldSettings((prev) => ({ ...prev, [key]: e.target.checked }))}
                        />
                        <span className="text-[11px] font-bold text-slate-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </section>

                <div className="sticky bottom-0 bg-white pt-4 border-t border-slate-100 flex justify-end gap-3">
                  <button type="button" onClick={() => { setIsCareerConfigModalOpen(false); handleCancelEditRole(); }} className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">Cancel</button>
                  <button type="submit" disabled={savingCareerConfig} className="px-6 py-2.5 rounded-xl bg-navy-950 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 disabled:opacity-50">
                    {savingCareerConfig && <Loader2 className="h-4 w-4 animate-spin" />}
                    {savingCareerConfig ? "Saving..." : "Save Career Configuration"}
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


function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} min={type === "number" ? 1 : undefined} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 bg-white" />
    </div>
  );
}
