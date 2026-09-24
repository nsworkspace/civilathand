"use client";

import { notifyAdmin } from "./AdminToast";
import React, { useState, useEffect } from "react";
import {
  Users,
  Trash2,
  Edit2,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Calendar,
  FileText,
  RefreshCw,
  CheckCircle2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type TeamMember = {
  _id: string;
  id: string;
  fullName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  role: string;
  department: string;
  education: string;
  experience: string;
  portfolioLink: string;
  notes: string;
  joiningDate: string;
  employeeId: string;
  status: "Active" | "Inactive";
  submittedAt: string;
  updatedAt: string;
};

export default function TeamMembersAdminPanel() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/team-members");
      const data = await res.json();
      if (res.ok) setMembers(data);
    } catch (err) {
      console.error("Failed to fetch team members:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/team-members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingMember),
      });
      if (res.ok) {
        await fetchMembers();
        setEditingMember(null);
      } else {
        notifyAdmin("Failed to update member.");
      }
    } catch (err) {
      console.error("Error updating member:", err);
      notifyAdmin("Failed to update member.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team member record?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/team-members?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchMembers();
      } else {
        notifyAdmin("Failed to delete member.");
      }
    } catch (err) {
      console.error("Error deleting member:", err);
      notifyAdmin("Failed to delete member.");
    } finally {
      setDeletingId(null);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-display font-extrabold text-xl text-navy-950 flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-500" /> Team Members
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Employees who have completed the team onboarding form.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchMembers}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-navy-950 text-white hover:bg-orange-600 transition-all shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block">Total Members</span>
          <p className="text-2xl font-extrabold text-navy-950 mt-1">{members.length}</p>
          <Users className="h-10 w-10 text-orange-500/10 absolute -right-1 -bottom-1" />
        </div>
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <span className="text-[10px] uppercase font-extrabold text-emerald-600 tracking-wider block">Active</span>
          <p className="text-2xl font-extrabold text-emerald-950 mt-1">
            {members.filter((m) => m.status === "Active").length}
          </p>
          <CheckCircle2 className="h-10 w-10 text-emerald-500/10 absolute -right-1 -bottom-1" />
        </div>
        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider block">Departments</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {new Set(members.map((m) => m.department).filter(Boolean)).size}
          </p>
          <Briefcase className="h-10 w-10 text-slate-400/10 absolute -right-1 -bottom-1" />
        </div>
        <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <span className="text-[10px] uppercase font-extrabold text-sky-600 tracking-wider block">Roles</span>
          <p className="text-2xl font-extrabold text-sky-950 mt-1">
            {new Set(members.map((m) => m.role).filter(Boolean)).size}
          </p>
          <User className="h-10 w-10 text-sky-500/10 absolute -right-1 -bottom-1" />
        </div>
      </div>

      {/* Table / List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading team members...</p>
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <Users className="h-10 w-10 text-slate-300 mx-auto" />
          <h4 className="font-extrabold text-slate-700 text-sm">No team members yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Team members will appear here after they submit the onboarding form at /team-onboarding.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Role / Dept</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Joined / ID</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member) => (
                  <tr key={member._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white font-extrabold text-xs flex items-center justify-center shadow-sm border border-white flex-shrink-0">
                          {getInitials(member.fullName)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-navy-950 truncate max-w-[180px]">{member.fullName}</p>
                          <p className="text-[10px] font-semibold text-slate-400 truncate max-w-[180px]">
                            {member.email || "No email"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="inline-block bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-orange-100">
                          {member.role || "N/A"}
                        </span>
                        {member.department && (
                          <span className="inline-block bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold ml-1">
                            {member.department}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-semibold">
                      <div className="flex flex-col gap-0.5">
                        <a href={`tel:${member.phone}`} className="hover:text-orange-600 flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {member.phone}
                        </a>
                        {member.whatsapp && (
                          <a href={`https://wa.me/${member.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 flex items-center gap-1">
                            <span className="text-[#25d366]">WA</span> {member.whatsapp}
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-500 font-semibold">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" /> {member.joiningDate || "—"}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <FileText className="h-3 w-3" /> ID: {member.employeeId || "—"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingMember(member)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                          title="Edit member"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMember(member._id)}
                          disabled={deletingId === member._id}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                          title="Delete member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      <AnimatePresence>
        {editingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 bg-navy-950 text-white flex justify-between items-center">
                <h4 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                  <User className="h-5 w-5 text-orange-500" /> Edit Team Member
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleUpdateMember} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editingMember.fullName}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, fullName: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                    <input
                      type="email"
                      value={editingMember.email}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, email: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phone</label>
                    <input
                      type="text"
                      value={editingMember.phone}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, phone: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={editingMember.whatsapp}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, whatsapp: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Address</label>
                  <input
                    type="text"
                    value={editingMember.address}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, address: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-orange-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Role</label>
                    <input
                      type="text"
                      value={editingMember.role}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, role: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
                    <input
                      type="text"
                      value={editingMember.department}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, department: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Education</label>
                    <input
                      type="text"
                      value={editingMember.education}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, education: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Experience</label>
                    <input
                      type="text"
                      value={editingMember.experience}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, experience: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Portfolio / Resume Link</label>
                  <input
                    type="text"
                    value={editingMember.portfolioLink}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, portfolioLink: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-orange-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Joining Date</label>
                    <input
                      type="date"
                      value={editingMember.joiningDate}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, joiningDate: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Employee ID</label>
                    <input
                      type="text"
                      value={editingMember.employeeId}
                      onChange={(e) =>
                        setEditingMember({ ...editingMember, employeeId: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Notes</label>
                  <textarea
                    rows={3}
                    value={editingMember.notes}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, notes: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:border-orange-500 outline-none resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editingMember.status === "Active"}
                      onChange={(e) =>
                        setEditingMember({
                          ...editingMember,
                          status: e.target.checked ? "Active" : "Inactive",
                        })
                      }
                      className="rounded text-orange-500 focus:ring-0"
                    />
                    Active
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingMember(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-navy-950 hover:bg-orange-600 text-white font-bold px-5 py-2 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
