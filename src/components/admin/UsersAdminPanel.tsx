"use client";

import { notifyAdmin } from "./AdminToast";
import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Download,
  GraduationCap,
  Briefcase,
  Users2,
  Mail,
  Phone,
  Calendar,
  ShieldCheck,
  Globe,
  KeyRound,
  Trash2,
  Edit2,
  X,
  Check,
  Loader2,
  FolderKanban,
  FileText,
  Trophy,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import UserAvatar from "@/components/UserAvatar";

export type RegisteredUser = {
  id: string;
  _id: string;
  name: string;
  email: string;
  phone?: string;
  userType: "student" | "client" | "both" | "general" | string;
  isGoogle: boolean;
  createdAt: string;
  company?: string;
  address?: string;
  profileImageId?: string;
  profileImageUrl?: string;
  projectCount: number;
  leadCount: number;
  testAttemptCount: number;
};

export default function UsersAdminPanel() {
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    studentsCount: 0,
    clientsCount: 0,
    bothCount: 0,
    googleUsersCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<RegisteredUser | null>(null);
  const [editingUser, setEditingUser] = useState<RegisteredUser | null>(null);
  const [editUserType, setEditUserType] = useState<string>("student");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load registered users:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      typeFilter === "all" ? true : u.userType?.toLowerCase() === typeFilter.toLowerCase();

    return matchesSearch && matchesType;
  });

  const handleUpdateUserType = async (user: RegisteredUser, newType: string) => {
    setSavingEdit(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          userType: newType,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, userType: newType } : u))
        );
        setEditingUser(null);
      } else {
        notifyAdmin(data.error || "Failed to update user type");
      }
    } catch (err) {
      console.error("Error updating user type:", err);
      notifyAdmin("Failed to update user type");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteUser = async (user: RegisteredUser) => {
    if (!confirm(`Are you sure you want to delete user ${user.name} (${user.email})?`)) return;
    setDeletingId(user.id);
    try {
      const res = await fetch(`/api/admin/users?id=${user.id}&email=${encodeURIComponent(user.email)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        if (selectedUser?.id === user.id) setSelectedUser(null);
      } else {
        notifyAdmin(data.error || "Failed to delete user");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      notifyAdmin("Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  const exportToCSV = () => {
    if (filteredUsers.length === 0) return;
    const headers = ["ID", "Name", "Email", "Phone", "User Type", "Auth Method", "Registered Date", "Projects", "Leads", "Test Attempts"];
    const rows = filteredUsers.map((u) => [
      `"${u.id || ""}"`,
      `"${u.name || ""}"`,
      `"${u.email || ""}"`,
      `"${u.phone || ""}"`,
      `"${u.userType || "general"}"`,
      `"${u.isGoogle ? "Google OAuth" : "Password"}"`,
      `"${new Date(u.createdAt).toLocaleString("en-IN")}"`,
      u.projectCount,
      u.leadCount,
      u.testAttemptCount,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Registered_Users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getUserBadgeStyle = (type: string) => {
    switch (type?.toLowerCase()) {
      case "student":
        return { bg: "bg-sky-50 text-sky-700 border-sky-200", icon: GraduationCap, label: "Student" };
      case "client":
        return { bg: "bg-orange-50 text-orange-700 border-orange-200", icon: Briefcase, label: "Client" };
      case "both":
        return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Users2, label: "Both" };
      default:
        return { bg: "bg-slate-100 text-slate-700 border-slate-200", icon: Users, label: "General" };
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-display font-extrabold text-xl text-navy-950 flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-500" /> Registered User Tracker
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Monitor and manage all user accounts signed up on NS Construction.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportToCSV}
            disabled={filteredUsers.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5 text-slate-600" /> Export CSV
          </button>
          <button
            type="button"
            onClick={fetchUsers}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-navy-950 text-white hover:bg-orange-600 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block">Total Signups</span>
          <p className="text-2xl font-extrabold text-navy-950 mt-1">{stats.totalUsers}</p>
          <Users className="h-10 w-10 text-orange-500/10 absolute -right-1 -bottom-1" />
        </div>
        <div className="bg-sky-50/50 border border-sky-100 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <span className="text-[10px] uppercase font-extrabold text-sky-600 tracking-wider block">Students</span>
          <p className="text-2xl font-extrabold text-sky-950 mt-1">{stats.studentsCount}</p>
          <GraduationCap className="h-10 w-10 text-sky-500/10 absolute -right-1 -bottom-1" />
        </div>
        <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <span className="text-[10px] uppercase font-extrabold text-orange-600 tracking-wider block">Clients</span>
          <p className="text-2xl font-extrabold text-orange-950 mt-1">{stats.clientsCount}</p>
          <Briefcase className="h-10 w-10 text-orange-500/10 absolute -right-1 -bottom-1" />
        </div>
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <span className="text-[10px] uppercase font-extrabold text-emerald-600 tracking-wider block">Google Auth</span>
          <p className="text-2xl font-extrabold text-emerald-950 mt-1">{stats.googleUsersCount}</p>
          <Globe className="h-10 w-10 text-emerald-500/10 absolute -right-1 -bottom-1" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name, email, phone..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {["all", "student", "client", "both"].map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setTypeFilter(tf)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider transition-all whitespace-nowrap ${
                typeFilter === tf
                  ? "bg-navy-950 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {tf === "all" ? "All Users" : tf}
            </button>
          ))}
        </div>
      </div>

      {/* Users Data List / Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading registered users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <Users className="h-10 w-10 text-slate-300 mx-auto" />
          <h4 className="font-extrabold text-slate-700 text-sm">No registered users found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || typeFilter !== "all"
              ? "Try clearing your search query or user type filter."
              : "No users have registered on the platform yet."}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role / Type</th>
                  <th className="py-3 px-4">Auth Method</th>
                  <th className="py-3 px-4">Signed Up</th>
                  <th className="py-3 px-4 text-center">Activity Track</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.map((user) => {
                  const badge = getUserBadgeStyle(user.userType);
                  const BadgeIcon = badge.icon;

                  return (
                    <tr key={user.id || user.email} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={user.name}
                            profileImageId={user.profileImageId}
                            profileImageUrl={user.profileImageUrl}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="font-extrabold text-navy-950 truncate max-w-[180px]">{user.name}</p>
                            <p className="text-[11px] font-semibold text-slate-400 truncate max-w-[180px]">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${badge.bg}`}>
                          <BadgeIcon className="h-3 w-3" />
                          <span className="capitalize">{badge.label}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {user.isGoogle ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <Globe className="h-3 w-3" /> Google OAuth
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            <KeyRound className="h-3 w-3" /> Password
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>{new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md" title="Projects">
                            <FolderKanban className="h-3 w-3 text-orange-500" /> {user.projectCount}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md" title="Education Activity">
                            <Trophy className="h-3 w-3 text-sky-500" /> {user.testAttemptCount}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md" title="Leads Submitted">
                            <FileText className="h-3 w-3 text-emerald-500" /> {user.leadCount}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedUser(user)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-navy-950 hover:bg-slate-200/60 transition-colors"
                            title="View user details"
                          >
                            <Users className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(user);
                              setEditUserType(user.userType || "student");
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                            title="Edit user role/type"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user)}
                            disabled={deletingId === user.id}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="bg-gradient-to-br from-navy-900 to-navy-950 p-6 text-white relative">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-extrabold text-xl text-white shadow-lg border border-white/20">
                    <UserAvatar
                        name={selectedUser.name}
                        profileImageId={selectedUser.profileImageId}
                        profileImageUrl={selectedUser.profileImageUrl}
                        size="xl"
                      />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-lg leading-tight">{selectedUser.name}</h4>
                    <p className="text-xs text-slate-300 font-semibold mt-0.5">{selectedUser.email}</p>
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-orange-500 text-white">
                      {selectedUser.userType}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Auth Method</span>
                    <p className="text-xs font-bold text-navy-950 mt-1">{selectedUser.isGoogle ? "Google OAuth" : "Password Login"}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Registered Date</span>
                    <p className="text-xs font-bold text-navy-950 mt-1">
                      {new Date(selectedUser.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Activity Summary</span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                      <p className="text-lg font-extrabold text-orange-600">{selectedUser.projectCount}</p>
                      <span className="text-[9px] font-bold text-slate-600 uppercase">Projects</span>
                    </div>
                    <div className="bg-sky-50 p-3 rounded-xl border border-sky-100">
                      <p className="text-lg font-extrabold text-sky-600">{selectedUser.testAttemptCount}</p>
                      <span className="text-[9px] font-bold text-slate-600 uppercase">Test Attempts</span>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                      <p className="text-lg font-extrabold text-emerald-600">{selectedUser.leadCount}</p>
                      <span className="text-[9px] font-bold text-slate-600 uppercase">Leads</span>
                    </div>
                  </div>
                </div>

                {selectedUser.phone && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Phone Number</span>
                    <p className="text-xs font-bold text-navy-950 mt-0.5">{selectedUser.phone}</p>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="w-full bg-slate-900 text-white font-extrabold text-xs uppercase tracking-wider py-2.5 rounded-xl hover:bg-orange-600 transition-colors"
                  >
                    Close Profile
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Type Modal */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-base text-navy-950">Change User Type</h4>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 font-medium">
                Update account classification for <span className="font-bold text-navy-950">{editingUser.name}</span>.
              </p>

              <div className="space-y-2">
                {[
                  { id: "student", label: "Student", desc: "Mentorship & software courses" },
                  { id: "client", label: "Client", desc: "Engineering design projects & drawings" },
                  { id: "both", label: "Both", desc: "Full access to Education & Projects" },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setEditUserType(option.id)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                      editUserType === option.id
                        ? "border-orange-500 bg-orange-50/60 ring-1 ring-orange-500"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <p className="font-extrabold text-navy-950 uppercase text-[11px]">{option.label}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{option.desc}</p>
                    </div>
                    {editUserType === option.id && <CheckCircle2 className="h-4 w-4 text-orange-600" />}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-extrabold uppercase text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateUserType(editingUser, editUserType)}
                  disabled={savingEdit}
                  className="px-4 py-2 text-xs font-extrabold uppercase text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingEdit && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
