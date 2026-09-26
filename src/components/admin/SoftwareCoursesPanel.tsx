"use client";

import { notifyAdmin } from "./AdminToast";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Laptop, Plus, Trash2, Edit3, ToggleLeft, ToggleRight, Eye, Loader2, X
} from "lucide-react";

export function SoftwareCoursesPanel() {
  const [adminCourses, setAdminCourses] = useState<any[]>([]);
  const [coursesLoaded, setCoursesLoaded] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [crsName, setCrsName] = useState("");
  const [crsSlug, setCrsSlug] = useState("");
  const [crsSub, setCrsSub] = useState("");
  const [crsCategory, setCrsCategory] = useState("Civil Engineering");
  const [crsMode, setCrsMode] = useState<"Live" | "Self-Paced">("Self-Paced");
  const [crsLevel, setCrsLevel] = useState("Beginner to Intermediate");
  const [crsDuration, setCrsDuration] = useState("20+ hours");
  const [crsPriceLabel, setCrsPriceLabel] = useState("Lowest Price");
  const [crsBadge, setCrsBadge] = useState("Course");
  const [crsBadgeColor, setCrsBadgeColor] = useState("bg-orange-500");
  const [crsAccent, setCrsAccent] = useState("#ef6c00");
  const [crsSummary, setCrsSummary] = useState("");
  const [crsLearn, setCrsLearn] = useState("");
  const [crsModules, setCrsModules] = useState("");
  const [crsWhoFor, setCrsWhoFor] = useState("");
  const [crsComingSoon, setCrsComingSoon] = useState(true);
  const [savingCourse, setSavingCourse] = useState(false);
  const [courseEnrollments, setCourseEnrollments] = useState<any[]>([]);

  const loadAdminCourses = async () => {
    try {
      const res = await fetch("/api/admin/courses");
      if (!res.ok) throw new Error("Failed to load NS Construction courses");
      const data = await res.json();
      setAdminCourses(data.courses || []);
      setCoursesLoaded(true);
    } catch (err) {
      console.error("Error loading NS Construction courses:", err);
    }
  };

  const loadCourseEnrollments = async () => {
    try {
      const res = await fetch("/api/admin/course-enrollments", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setCourseEnrollments(data.enrollments || []);
    } catch (error) {
      console.error("Error loading course enrollments:", error);
    }
  };

  useEffect(() => {
    void loadAdminCourses();
    void loadCourseEnrollments();
  }, []);

  const openAddCourse = () => {
    setEditingCourseId(null);
    setCrsName(""); setCrsSlug(""); setCrsSub(""); setCrsCategory("Civil Engineering");
    setCrsMode("Self-Paced"); setCrsLevel("Beginner to Intermediate"); setCrsDuration("20+ hours");
    setCrsPriceLabel("Lowest Price"); setCrsBadge("Most Demanded"); setCrsBadgeColor("bg-orange-500");
    setCrsAccent("#ef6c00"); setCrsSummary(""); setCrsLearn(""); setCrsModules(""); setCrsWhoFor("");
    setCrsComingSoon(true);
    setIsCourseModalOpen(true);
  };

  const openEditCourse = (course: any) => {
    setEditingCourseId(course.id);
    setCrsName(course.name || "");
    setCrsSlug(course.slug || "");
    setCrsSub(course.sub || "");
    setCrsCategory(course.category || "Civil Engineering");
    setCrsMode(course.mode === "Live" ? "Live" : "Self-Paced");
    setCrsLevel(course.level || "");
    setCrsDuration(course.duration || "");
    setCrsPriceLabel(course.priceLabel || "");
    setCrsBadge(course.badge || "");
    setCrsBadgeColor(course.badgeColor || "bg-orange-500");
    setCrsAccent(course.accent || "#ef6c00");
    setCrsSummary(course.summary || "");
    setCrsLearn((course.learn || []).join("\n"));
    setCrsModules((course.modules || []).join("\n"));
    setCrsWhoFor((course.whoFor || []).join("\n"));
    setCrsComingSoon(course.comingSoon ?? true);
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crsName.trim()) {
      notifyAdmin("Course name is required.");
      return;
    }
    setSavingCourse(true);
    try {
      const generatedSlug = crsSlug.trim() || crsName.trim().toLowerCase().replace(/[^a-z0-9]/g, "-");
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCourseId,
          slug: generatedSlug,
          name: crsName.trim(),
          sub: crsSub.trim(),
          category: crsCategory.trim(),
          mode: crsMode,
          level: crsLevel.trim(),
          duration: crsDuration.trim(),
          priceLabel: crsPriceLabel.trim(),
          badge: crsBadge.trim(),
          badgeColor: crsBadgeColor.trim(),
          accent: crsAccent.trim(),
          summary: crsSummary.trim(),
          learn: crsLearn.split("\n").map(s => s.trim()).filter(Boolean),
          modules: crsModules.split("\n").map(s => s.trim()).filter(Boolean),
          whoFor: crsWhoFor.split("\n").map(s => s.trim()).filter(Boolean),
          comingSoon: crsComingSoon,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save course");

      setIsCourseModalOpen(false);
      await loadAdminCourses();
    } catch (err: any) {
      notifyAdmin(err.message || "Failed to save course.");
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this course?")) return;
    try {
      const res = await fetch(`/api/admin/courses?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete course");
      await loadAdminCourses();
    } catch (err: any) {
      notifyAdmin("Failed to delete course.");
    }
  };

  const handleToggleCourseStatus = async (course: any) => {
    try {
      await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...course,
          comingSoon: !course.comingSoon,
        }),
      });
      await loadAdminCourses();
    } catch (err) {
      notifyAdmin("Failed to update status.");
    }
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
          <h3 className="font-display font-extrabold text-xl text-navy-950">NS Construction Courses Management</h3>
          <p className="text-xs text-slate-500 mt-0.5">Only courses added from this Admin panel are listed here and published. Demo/catalog courses are removed.</p>
        </div>
        <button
          type="button"
          onClick={openAddCourse}
          className="flex items-center gap-1.5 bg-navy-950 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider transition-all cursor-pointer shadow-premium"
        >
          <Plus className="h-4 w-4" /> Add NS Construction Course
        </button>
      </div>
      {!coursesLoaded ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      ) : adminCourses.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <Laptop className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">No NS Construction courses found.</p>
          <button onClick={openAddCourse} className="mt-3 text-xs font-bold text-orange-600 underline">Add First Course</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {adminCourses.map((crs) => (
            <div
              key={crs.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-orange-300 hover:shadow-sm transition-all"
            >
              <div className="h-1.5" style={{ background: crs.accent || "#ef6c00" }} />
              <div className="p-5 space-y-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between gap-2">
                  <span className={`${crs.badgeColor || "bg-orange-500"} text-white text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full`}>
                    {crs.badge || "Course"}
                  </span>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                    Added from Admin
                  </span>
                  <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase ${
                    crs.comingSoon ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    {crs.comingSoon ? "Coming Soon" : "Active / Live"}
                  </span>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base leading-tight">{crs.name}</h4>
                  <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mt-0.5">{crs.sub}</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span>⏱ {crs.duration}</span>
                  <span>•</span>
                  <span>🎯 {crs.level}</span>
                  <span>•</span>
                  <span className="font-bold text-slate-900">{crs.priceLabel}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg w-fit">
                  <Eye className="h-3 w-3" /> {(crs as any).views || 0} Views
                </span>
                <div className="inline-flex items-center gap-2 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5 w-fit">
                  Payment managed centrally → Admin → Payments
                </div>
                <p className="text-xs text-slate-500 font-medium line-clamp-3 leading-relaxed flex-1">{crs.summary}</p>
              </div>
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggleCourseStatus(crs)}
                  className="text-[10px] font-bold text-slate-600 hover:text-orange-600 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {crs.comingSoon ? (
                    <><ToggleLeft className="h-4 w-4 text-amber-600" /> Set Active</>
                  ) : (
                    <><ToggleRight className="h-4 w-4 text-emerald-600" /> Set Coming Soon</>
                  )}
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditCourse(crs)}
                    className="bg-slate-200 hover:bg-navy-950 hover:text-white text-navy-950 p-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                    title="Edit Course"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCourse(crs.id)}
                    className="bg-red-50 hover:bg-red-500 hover:text-white text-red-600 p-1.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                    title="Delete Course"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {courseEnrollments.length > 0 && (
        <div className="mt-8 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <h4 className="font-display text-sm font-extrabold text-navy-950 uppercase tracking-wider">Paid NS Construction Course Enrolments</h4>
              <p className="text-[10px] text-slate-500 mt-1">Details submitted after verified payment. These records are server-side and tied to the buyer account.</p>
            </div>
            
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead><tr className="bg-navy-950 text-white text-[9px] uppercase tracking-wider">
                <th className="p-3">Student</th><th className="p-3">Course</th><th className="p-3">Phone</th><th className="p-3">College / Company</th><th className="p-3">Address</th><th className="p-3">Goal</th><th className="p-3">Submitted</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {courseEnrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="align-top hover:bg-orange-50/40">
                    <td className="p-3"><div className="font-bold text-slate-900">{enrollment.userName}</div><div className="text-[10px] text-slate-500">{enrollment.userEmail}</div></td>
                    <td className="p-3 font-semibold text-slate-700">{enrollment.courseName}</td>
                    <td className="p-3 text-slate-600">{enrollment.phone || "—"}</td>
                    <td className="p-3 text-slate-600">{enrollment.company || "—"}</td>
                    <td className="p-3 text-slate-600 min-w-[180px]">{enrollment.address || "—"}</td>
                    <td className="p-3 text-slate-600 min-w-[220px]">{enrollment.goal || "—"}</td>
                    <td className="p-3 text-slate-500 whitespace-nowrap">{enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleString("en-IN") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isCourseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl shadow-premium-lg border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 z-20 px-6 py-4 bg-navy-950 text-white flex justify-between items-center rounded-t-2xl">
                <div>
                  <h4 className="font-display font-extrabold text-sm uppercase tracking-wider">
                    {editingCourseId ? "Edit NS Construction Course" : "Add New NS Construction Course"}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Changes saved here update the database and reflect live on the website.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSaveCourse} className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Course Name *</label>
                    <input required value={crsName} onChange={(e) => setCrsName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs text-slate-900" placeholder="e.g. AutoCAD for Civil Engineering" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Slug</label>
                    <input value={crsSlug} onChange={(e) => setCrsSlug(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs text-slate-900" placeholder="autocad-civil" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Subtitle</label>
                    <input value={crsSub} onChange={(e) => setCrsSub(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs text-slate-900" placeholder="Learn practical drafting" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Category</label>
                    <select value={crsCategory} onChange={(e) => setCrsCategory(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs text-slate-900">
                      <option>Civil Engineering</option>
                      <option>Structural Design</option>
                      <option>Site & Construction</option>
                      <option>BIM & Digital</option>
                      <option>Architecture & Planning</option>
                      <option>Career & Management</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Mode</label>
                    <select value={crsMode} onChange={(e) => setCrsMode(e.target.value as "Live" | "Self-Paced")} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs text-slate-900">
                      <option value="Self-Paced">Self-Paced</option>
                      <option value="Live">Live</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Level</label>
                    <input value={crsLevel} onChange={(e) => setCrsLevel(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Duration</label>
                    <input value={crsDuration} onChange={(e) => setCrsDuration(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Price Label</label>
                    <input value={crsPriceLabel} onChange={(e) => setCrsPriceLabel(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs text-slate-900" placeholder="Starting at ₹999" />
                  </div>
                  <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800">Payment managed centrally</p>
                    <p className="text-[9px] text-blue-700 mt-1">Set or change this course price only in Admin → Payments. Saving course content never changes the live payment price.</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Badge</label>
                    <input value={crsBadge} onChange={(e) => setCrsBadge(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Badge Color (Tailwind class)</label>
                    <input value={crsBadgeColor} onChange={(e) => setCrsBadgeColor(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Accent Color</label>
                    <input type="color" value={crsAccent || "#ef6c00"} onChange={(e) => setCrsAccent(e.target.value)} className="h-10 w-full border border-slate-300 rounded-lg p-1 bg-white" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Summary</label>
                    <textarea value={crsSummary} onChange={(e) => setCrsSummary(e.target.value)} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs text-slate-900 resize-y" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">What Students Learn</label>
                    <textarea value={crsLearn} onChange={(e) => setCrsLearn(e.target.value)} rows={7} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs text-slate-900 resize-y" placeholder="One item per line" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Modules</label>
                    <textarea value={crsModules} onChange={(e) => setCrsModules(e.target.value)} rows={7} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs text-slate-900 resize-y" placeholder="One module per line" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Who This Is For</label>
                    <textarea value={crsWhoFor} onChange={(e) => setCrsWhoFor(e.target.value)} rows={5} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs text-slate-900 resize-y" placeholder="One item per line" />
                  </div>
                  <label className="md:col-span-2 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-3 cursor-pointer">
                    <input type="checkbox" checked={crsComingSoon} onChange={(e) => setCrsComingSoon(e.target.checked)} />
                    <span className="text-xs font-bold text-slate-700">Show as Coming Soon / unavailable for purchase</span>
                  </label>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCourseModalOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingCourse}
                    className="bg-navy-950 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-premium flex items-center gap-2 disabled:opacity-50"
                  >
                    {savingCourse && <Loader2 className="h-4 w-4 animate-spin" />}
                    {savingCourse ? "Saving..." : editingCourseId ? "Save Changes" : "Create Course"}
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
