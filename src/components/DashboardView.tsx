"use client";

import UserAvatar from "@/components/UserAvatar";
import React, { useState } from "react";
import { useProjects, SupportTicket, TicketAttachment } from "@/context/ProjectContext";
import { motion, AnimatePresence } from "framer-motion";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { ChatComposer } from "@/components/chat/ChatComposer";
import {
  Briefcase, UploadCloud, CreditCard, MessageSquare, Send, Activity,
  MapPin, Calendar, FileText, Loader2, CheckCircle2, ChevronRight,
  FolderKanban, Wallet, FileStack, LifeBuoy, GraduationCap, BookOpen,
  Plus, Clock, X, Filter, Tag, ArrowRight, Check, Download, Share2
} from "lucide-react";
import { downloadInvoice, shareInvoice } from "@/lib/invoice";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileSignature, Settings } from "lucide-react";
import RazorpayCheckout from "@/components/payments/RazorpayCheckout";
import PaymentButton from "@/components/payments/PaymentButton";
import { auth } from "@/lib/firebase";

export const DashboardView: React.FC = () => {
  // Safely extract context – fallback to empty arrays/functions
  const context = useProjects();
  const {
    projects = [],
    drawings = [],
    invoices = [],
    leads = [],
    tickets = [],
    uploadDrawing = async () => {},
    payInvoice = () => {},
    addTicket = async () => {},
    addTicketReply = async () => {},
    updateTicketStatus = () => {},
  } = context || {};

  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"projects" | "mentorship" | "courses" | "upload" | "payments" | "tickets">("projects");
  const [user, setUser] = useState<any>(null);
  const [userType, setUserType] = useState<"student" | "client" | "both" | null>(null);

  // States for Mentorship & Course User Records
  const [mentorshipApps, setMentorshipApps] = useState<any[]>([]);
  const [courseEnrollments, setCourseEnrollments] = useState<any[]>([]);
  const [servicePaymentRequests, setServicePaymentRequests] = useState<any[]>([]);

  // Proposals sent to this client — the link only shows up when one
  // actually exists, and carries a "New" badge until they open it. Data
  // comes from the DB-backed /api/proposals?email=... endpoint, so it
  // shows the same way regardless of which device/browser they log in
  // from — only the "seen" flag is local (cosmetic, not the data itself).
  const [proposals, setProposals] = useState<any[]>([]);
  const [hasNewProposal, setHasNewProposal] = useState(false);

  // State for Support Tickets
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isRaiseTicketModalOpen, setIsRaiseTicketModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState<SupportTicket["category"]>("Structural Design");
  const [ticketPriority, setTicketPriority] = useState<SupportTicket["priority"]>("Medium");
  const [ticketDesc, setTicketDesc] = useState("");
  const [ticketReplyText, setTicketReplyText] = useState("");
  const [ticketFilter, setTicketFilter] = useState<"All" | "Open" | "In Progress" | "Resolved" | "Closed">("All");
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  React.useEffect(() => {
    if (searchParams.get("paymentRequest")) setActiveTab("payments");
  }, [searchParams]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const userJson = localStorage.getItem("cah_user");
      if (userJson) {
        let u: any = null;
        try {
          const parsed = JSON.parse(userJson);
          if (parsed && typeof parsed === "object") u = parsed;
        } catch (error) {
          console.warn("Ignoring invalid dashboard profile cache:", error);
        }
        if (!u) return;
        setUser(u);
        setUserType(u?.userType || "both");

        if (u?.email) {

          // Fetch secure service payment requests. The server scopes these to the
          // verified Firebase account; no localStorage record can grant access.
          const loadServicePayments = async () => {
            try {
              const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
              const res = await fetch("/api/user/service-payments", {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                cache: "no-store",
              });
              const data = await res.json();
              if (res.ok && Array.isArray(data.requests)) setServicePaymentRequests(data.requests);
            } catch (error) {
              console.error("Error fetching service payment requests:", error);
            }
          };
          void loadServicePayments();

          // Fetch mentorship applications
          (async () => {
            try {
              const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
              const res = await fetch("/api/mentorship/my-applications", {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                cache: "no-store",
              });
              const data = await res.json();
              if (data.applications) setMentorshipApps(data.applications);
            } catch (err) {
              console.error("Error fetching mentorship applications:", err);
            }
          })();

          // Fetch proposals sent to this client (DB-backed — same result
          // on any device they log in from)
          fetch(`/api/proposals?email=${encodeURIComponent(u.email)}`)
            .then((res) => res.json())
            .then((data) => {
              const list = data.proposals || [];
              setProposals(list);
              if (list.length > 0) {
                const latest = list.reduce((max: string, p: any) => (p.createdAt > max ? p.createdAt : max), "");
                const seenUntil = localStorage.getItem(`cah_proposals_seen_${u.email.toLowerCase()}`) || "";
                setHasNewProposal(latest > seenUntil);
              }
            })
            .catch((err) => console.error("Error fetching proposals:", err));

          // Fetch course enrollments using the verified Firebase identity.
          // The API ignores arbitrary email query parameters so another
          // user's enrollment data cannot be requested by changing the URL.
          const loadCourseEnrollments = async () => {
            try {
              const idToken = await auth.currentUser?.getIdToken();
              const res = await fetch(`/api/courses/my-enrollments`, {
                headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
                cache: "no-store",
              });
              const data = await res.json();
              if (data.enrollments) setCourseEnrollments(data.enrollments);
            } catch (err) {
              console.error("Error fetching course enrollments:", err);
            }
          };
          void loadCourseEnrollments();

        }
      }
    }
  }, []);

  // Filter lists based on logged-in user – all safe with optional chaining
  const userProjects = user
    ? projects.filter((p) => p.clientName?.toLowerCase() === user.name?.toLowerCase())
    : [];

  const userLeads = user && leads
    ? leads.filter((l) => l.email?.toLowerCase() === user.email?.toLowerCase())
    : [];

  const userDrawings = user
    ? drawings.filter((d) => {
        const linkedToProject = userProjects.some((p) => p.drawings?.includes(d.name));
        const matchesService = userProjects.some((p) => p.service === d.serviceType) || userLeads.some((l) => l.service === d.serviceType);
        return linkedToProject || matchesService;
      })
    : [];

  const userInvoices = user
    ? invoices.filter((inv) => userProjects.some((p) => p.id === inv.projectId))
    : [];

  // Derived summary stats
  const pendingInvoices = userInvoices.filter((inv) => inv.status !== "Paid");
  const totalDue = pendingInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  // State for Drawing Upload
  const [files, setFiles] = useState<File[]>([]);
  const [serviceType, setServiceType] = useState("Structural Design");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // State for Payments
  const [payingInvId, setPayingInvId] = useState<string | null>(null);

  // Handle Drawing Submit (safe call)
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const f of files) {
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
          serviceType,
          url: fileUrl,
          clientName: user?.name || "Client",
          clientEmail: user?.email || undefined,
        });
      }
      setUploading(false);
      setUploadSuccess(true);
      setFiles([]);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error uploading drawings:", err);
      setUploading(false);
      alert(`Failed to upload drawings: ${err.message || err}`);
    }
  };

  // Handles a successful in-page Razorpay Checkout payment for an invoice —
  // the server has already verified + marked it Paid, so we just sync local
  // state (payInvoice PUTs the current status and refreshes the invoice).
  const handleInvoicePaid = (invId: string) => {
    payInvoice(invId);
  };

  // Handle Invoice Download - opens the premium branded invoice, ready to save as PDF from the print dialog
  const handleDownloadReceipt = (inv: any) => {
    downloadInvoice(inv, { clientName: user?.name, clientEmail: user?.email });
  };

  // Handle Invoice Share - uses the native share sheet when available, otherwise copies a summary
  const handleShareInvoice = (inv: any) => {
    shareInvoice(inv, { clientName: user?.name, clientEmail: user?.email });
  };

  // Handle Raise Ticket Submit
  const handleRaiseTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDesc.trim()) return;

    setSubmittingTicket(true);
    try {
      await addTicket({
        subject: ticketSubject.trim(),
        category: ticketCategory,
        priority: ticketPriority,
        description: ticketDesc.trim(),
        clientName: user?.name || "Client",
        clientEmail: user?.email || "client@civilathan.in",
      });
      setTicketSubject("");
      setTicketDesc("");
      setTicketCategory("Structural Design");
      setTicketPriority("Medium");
      setIsRaiseTicketModalOpen(false);
    } catch (err) {
      console.error("Error raising ticket:", err);
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleTicketReplySend = async (text: string, attachments: TicketAttachment[]) => {
    if (!selectedTicketId) return;
    if (!text.trim() && attachments.length === 0) return;
    setSubmittingReply(true);
    try {
      await addTicketReply(selectedTicketId, text.trim(), "client", user?.name || "Client", attachments);
    } catch (err) {
      console.error("Error submitting ticket reply:", err);
    } finally {
      setSubmittingReply(false);
    }
  };

  // Filter user tickets
  const userTickets = user
    ? tickets.filter(
        (t) =>
          t.clientEmail?.toLowerCase() === (user.email || "").toLowerCase() ||
          t.clientName?.toLowerCase() === (user.name || "").toLowerCase()
      )
    : tickets;

  const openTicketsCount = userTickets.filter((t) => t.status === "Open" || t.status === "In Progress").length;

  const filteredTickets = userTickets.filter((t) => {
    if (ticketFilter === "All") return true;
    return t.status === ticketFilter;
  });

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  // Helper badge renderers
  const getPriorityBadge = (priority: SupportTicket["priority"]) => {
    switch (priority) {
      case "Urgent":
        return <span className="bg-red-500/10 text-red-600 border border-red-500/20 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Urgent</span>;
      case "High":
        return <span className="bg-orange-500/10 text-orange-600 border border-orange-500/20 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">High</span>;
      case "Medium":
        return <span className="bg-blue-500/10 text-blue-600 border border-blue-500/20 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Medium</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Low</span>;
    }
  };

  const getStatusBadge = (status: SupportTicket["status"]) => {
    switch (status) {
      case "Open":
        return <span className="bg-amber-500/10 text-amber-700 border border-amber-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Open</span>;
      case "In Progress":
        return <span className="bg-sky-500/10 text-sky-700 border border-sky-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>In Progress</span>;
      case "Resolved":
        return <span className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Resolved</span>;
      default:
        return <span className="bg-slate-200 text-slate-700 border border-slate-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>Closed</span>;
    }
  };

  // Presentation helpers
  const initials = (user?.name || "Client")
    .split(" ").filter(Boolean).map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  const accentMap: Record<string, { bg: string; text: string; bar: string }> = {
    orange: { bg: "bg-orange-500/10", text: "text-orange-500", bar: "bg-orange-500" },
    sky: { bg: "bg-sky-500/10", text: "text-sky-600", bar: "bg-sky-500" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600", bar: "bg-emerald-500" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-600", bar: "bg-amber-500" },
  };

  const allStats = [
    { label: "Active Projects", value: userProjects.length, icon: FolderKanban, accent: "orange", forType: ["client", "both"] },
    { label: "Mentorship Sessions", value: mentorshipApps.length, icon: GraduationCap, accent: "emerald", forType: ["student", "both"] },
    { label: "Software Courses", value: courseEnrollments.length, icon: BookOpen, accent: "amber", forType: ["student", "both"] },
  ];
  const stats = !userType
    ? allStats
    : allStats.filter((s) => s.forType.includes(userType));

  const allNavItems = [
    { id: "projects", title: "Project Tracking", icon: Activity, count: userProjects.length + userLeads.length, alert: false, forType: ["client", "both"] },
    { id: "mentorship", title: "Mentorship Tracking", icon: GraduationCap, count: mentorshipApps.length, alert: false, forType: ["student", "both"] },
    { id: "courses", title: "Software Courses", icon: BookOpen, count: courseEnrollments.length, alert: false, forType: ["student", "both"] },
    { id: "upload", title: "Upload Drawings", icon: UploadCloud, count: userDrawings.length, alert: false, forType: ["client", "both"] },
    { id: "payments", title: "Invoices & Payments", icon: CreditCard, count: pendingInvoices.length, alert: true, forType: ["client", "both"] },
    { id: "tickets", title: "Help Desk", icon: LifeBuoy, count: openTicketsCount, alert: openTicketsCount > 0, forType: ["client", "both"] },
  ];
  const navItems = !userType
    ? allNavItems
    : allNavItems.filter((item) => (item.forType as string[]).includes(userType));

  return (
    <div className="space-y-6">

      {/* ───────── PORTAL HEADER STRIP ─────────
          The client/student/both switch now lives on the Profile page —
          keeps this screen focused on the actual work instead of a setup
          choice every time. Just a quick link to change it if needed. */}
      <div className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200 shadow-premium px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar name={user?.name} profileImageId={user?.profileImageId} profileImageUrl={user?.profileImageUrl} size="sm" />
          <p className="text-xs font-bold text-navy-950 truncate min-w-0">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </p>
        </div>
        <Link
          href="/profile"
          title="Edit profile & portal type"
          className="flex items-center gap-1.5 text-[10px] font-bold text-navy-600 hover:text-orange-500 uppercase tracking-widest transition-colors flex-shrink-0"
        >
          <Settings className="h-3.5 w-3.5" /> Settings
        </Link>
      </div>

      {/* ───────── PROPOSALS BANNER ─────────
          Only rendered when a proposal actually exists for this client —
          no permanent link cluttering the portal for everyone else. */}
      {proposals.length > 0 && (
        <Link
          href="/proposals"
          onClick={() => {
            if (user?.email) {
              localStorage.setItem(`cah_proposals_seen_${user.email.toLowerCase()}`, new Date().toISOString());
            }
            setHasNewProposal(false);
          }}
          className="flex items-center gap-4 bg-navy-950 hover:bg-navy-900 rounded-2xl border border-navy-800 shadow-premium p-5 transition-all group"
        >
          <div className="w-11 h-11 rounded-xl bg-orange-500/15 flex items-center justify-center flex-shrink-0">
            <FileSignature className="h-5 w-5 text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              {proposals.length > 1 ? `${proposals.length} Proposals` : "A New Proposal"}
              {hasNewProposal && (
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500 text-white">NEW</span>
              )}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Sent to you by Civil At Hand — tap to view details</p>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </Link>
      )}

      {/* ───────── SUMMARY STAT CARDS ───────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const a = accentMap[s.accent];
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-premium hover:shadow-premium-lg hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
            >
              <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full ${a.bar} transition-all duration-500`} />
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${a.bg} flex items-center justify-center flex-shrink-0`}>
                  <s.icon className={`h-5 w-5 ${a.text}`} />
                </div>
                <div className="min-w-0">
                  <div className="font-display font-extrabold text-xl md:text-2xl text-navy-950 truncate leading-none">{s.value}</div>
                  <div className="text-[10px] font-bold text-navy-600 uppercase tracking-wider mt-1.5">{s.label}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ───────── MAIN GRID ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-premium">
            <p className="px-3 pt-2 pb-3 text-[10px] font-bold text-navy-600 uppercase tracking-widest">Menu</p>
            <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-2 scrollbar-none">
              {navItems.map((btn) => {
                const isActive = activeTab === btn.id;
                return (
                  <motion.button
                    key={btn.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(btn.id as any)}
                    className={`group relative flex-shrink-0 flex items-center gap-3 w-full pl-4 pr-3 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
                      isActive
                        ? "bg-navy-950 text-white shadow-premium"
                        : "bg-transparent text-navy-700 hover:bg-slate-50 border border-transparent hover:border-slate-200"
                    }`}
                  >
                    {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-orange-500" />}
                    <btn.icon className={`h-4 w-4 ${isActive ? "text-orange-400" : "text-orange-500"}`} />
                    <span className="whitespace-nowrap flex-1 text-left">{btn.title}</span>
                    {btn.count > 0 && (
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md min-w-5 text-center ${
                        btn.alert
                          ? "bg-amber-500 text-white"
                          : isActive ? "bg-white/15 text-white" : "bg-slate-100 text-navy-700"
                      }`}>
                        {btn.count}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-premium min-h-[500px] flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">

            {/* TAB 1: Projects Tracking */}
            {activeTab === "projects" && (
              <motion.div
                key="projects"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="flex-grow space-y-8"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <Activity className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-extrabold text-xl text-navy-950">Active Projects</h3>
                    <p className="text-xs text-navy-600 mt-0.5">Real-time status and execution progress of your designs.</p>
                  </div>
                  {(userProjects.length + userLeads.length) > 0 && (
                    <span className="text-[10px] font-bold text-navy-700 bg-slate-100 px-2.5 py-1 rounded-full">
                      {userProjects.length + userLeads.length} total
                    </span>
                  )}
                </div>

                {userProjects.length === 0 && userLeads.length === 0 ? (
                  <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center bg-slate-50">
                    <FolderKanban className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-navy-600 text-sm font-medium">Nothing requested yet.</p>
                    <p className="text-navy-600 text-xs mt-1">Use &apos;Upload Drawings&apos; to start a new design request.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Service Requests (Leads) */}
                    {userLeads.map((lead, idx) => (
                      <motion.div
                        key={lead.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="border border-slate-200 rounded-2xl p-5 md:p-6 bg-slate-50/60 hover:shadow-md transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pl-2">
                          <div>
                            <span className="text-[9px] bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                              Requested Service
                            </span>
                            <h4 className="font-display font-extrabold text-lg text-navy-950 mt-1">{lead.service}</h4>
                            <p className="text-[10px] text-navy-600 font-medium">Source: {lead.source}</p>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                              lead.status === "new" ? "bg-amber-50 text-amber-700 border-amber-200" :
                              lead.status === "contacted" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                              "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                              {lead.status === "new" ? "Under Review" :
                               lead.status === "contacted" ? "Contacted" : "Active Project"}
                            </span>
                            <span className="text-[10px] text-navy-600 mt-1.5 flex items-center gap-1 sm:justify-end">
                              <Calendar className="h-3 w-3" />
                              Submitted: {lead.date}
                            </span>
                          </div>
                        </div>
                        <div className="pl-2">
                          <span className="block font-bold text-navy-950 uppercase tracking-wide text-[9px] mb-1">Scope details</span>
                          <p className="text-xs text-slate-600 leading-relaxed font-medium bg-white p-3 rounded-lg border border-slate-100">
                            {lead.details}
                          </p>
                        </div>
                      </motion.div>
                    ))}

                    {/* Active Projects */}
                    {userProjects.map((project, idx) => (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: (userLeads.length + idx) * 0.05 }}
                        className="border border-slate-200 rounded-2xl p-5 md:p-6 hover:shadow-md transition-all duration-300 relative overflow-hidden bg-white"
                      >
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 pl-2">
                          <div>
                            <span className="text-[10px] bg-slate-100 text-navy-950 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                              ID: {project.id.toUpperCase()}
                            </span>
                            <h4 className="font-display font-extrabold text-lg text-navy-950 mt-1">{project.title}</h4>
                            <p className="text-xs text-navy-600 font-medium">{project.service}</p>
                          </div>
                          <div className="text-left sm:text-right">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                              project.status === "Completed" ? "bg-emerald-100 text-emerald-700" :
                              project.status === "Designing" ? "bg-sky-100 text-sky-700" :
                              project.status === "Under Review" ? "bg-amber-100 text-amber-700" :
                              "bg-slate-100 text-slate-700"
                            }`}>
                              {project.status}
                            </span>
                            <span className="text-[10px] text-navy-600 mt-1.5 flex items-center gap-1 sm:justify-end">
                              <Calendar className="h-3 w-3" />
                              Started: {project.dateStarted}
                            </span>
                          </div>
                        </div>

                        <div className="mb-6 pl-2">
                          <div className="flex justify-between text-xs font-bold mb-1.5">
                            <span className="text-navy-600">Milestone Progress</span>
                            <span className="text-navy-950">{project.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${project.progress}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="bg-gradient-to-r from-orange-500 to-orange-400 h-2 rounded-full shadow-orange-glow"
                            ></motion.div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 border-t border-slate-100 text-xs pl-2">
                          <div className="flex items-start gap-2.5">
                            <MapPin className="h-4 w-4 text-navy-600 mt-0.5" />
                            <div>
                              <span className="block font-bold text-navy-950 uppercase tracking-wide text-[10px]">Location</span>
                              <span className="text-navy-600">{project.location}</span>
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <Briefcase className="h-4 w-4 text-navy-600 mt-0.5" />
                            <div>
                              <span className="block font-bold text-navy-950 uppercase tracking-wide text-[10px]">Project Scope</span>
                              <span className="text-navy-600">{project.areaSqFt.toLocaleString("en-IN")} sq.ft built area</span>
                            </div>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <FileText className="h-4 w-4 text-navy-600 mt-0.5" />
                            <div>
                              <span className="block font-bold text-navy-950 uppercase tracking-wide text-[10px]">Uploaded Drawings</span>
                              <span className="text-navy-600 leading-snug">
                                {project.drawings.length === 0 ? "No files linked" : project.drawings.join(", ")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: Mentorship Tracking */}
            {activeTab === "mentorship" && (
              <motion.div
                key="mentorship"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="flex-grow space-y-8"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-display font-extrabold text-xl text-navy-950">1-on-1 Mentorship Tracking</h3>
                      <p className="text-xs text-navy-600 mt-0.5">Your submitted topper mentorship registrations, session schedules, and mentor notes.</p>
                    </div>
                  </div>
                  <a
                    href="/mentorship"
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 text-[11px] uppercase tracking-wider rounded-lg transition-all shadow-sm"
                  >
                    <GraduationCap className="h-3.5 w-3.5" /> Book Mentorship
                  </a>
                </div>

                {mentorshipApps.length === 0 ? (
                  <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center bg-slate-50">
                    <GraduationCap className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-navy-950 font-bold text-base">No Mentorship Sessions Registered</p>
                    <p className="text-navy-600 text-xs mt-1 max-w-sm mx-auto">
                      Get personal 1-on-1 guidance, custom study strategies, and doubt solving directly from a GATE, ESE, &amp; SSC-JE topper.
                    </p>
                    <a
                      href="/mentorship"
                      className="inline-flex items-center gap-2 mt-5 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 text-xs uppercase tracking-widest rounded-xl transition-all shadow-md"
                    >
                      <GraduationCap className="h-4 w-4" /> Apply for Mentorship
                    </a>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {mentorshipApps.map((app, idx) => {
                      const status = app.status || "Pending";
                      return (
                        <motion.div
                          key={app.id || idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: idx * 0.05 }}
                          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4 mb-4">
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                                Application ID: {app.id || `M-${idx + 1}`}
                              </span>
                              <h4 className="font-display font-extrabold text-lg text-slate-900">
                                {app.academicLevel} · {app.fieldOfStudy || "Civil Engineering"}
                              </h4>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                status === "Approved" || status === "Scheduled" ? "bg-sky-50 text-sky-700 border-sky-200" :
                                status === "In Progress" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                "bg-amber-50 text-amber-700 border-amber-200"
                              }`}>
                                {status === "Pending" ? "Application Under Review" : status}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {/* Mentorship Areas */}
                            {app.mentorshipAreas && app.mentorshipAreas.length > 0 && (
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Requested Focus Areas</span>
                                <div className="flex flex-wrap gap-2">
                                  {app.mentorshipAreas.map((area: string) => (
                                    <span key={area} className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1 rounded-lg">
                                      {area}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Goals */}
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Your Stated Goals</span>
                              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium leading-relaxed">
                                {app.goals || "No specific goals specified."}
                              </p>
                            </div>

                            {/* Time & Availability */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                              <div>
                                <span className="font-bold text-slate-800">Timezone Comfort:</span> {app.timeZoneComfort || "IST"}
                              </div>
                              <div>
                                <span className="font-bold text-slate-800">Submitted On:</span> {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "Recent"}
                              </div>
                            </div>

                            {/* Admin / Mentor Notes if present */}
                            {app.notes && (
                              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5">
                                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">Mentor / Admin Feedback Note</span>
                                <p className="text-xs text-amber-900 font-medium">{app.notes}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: Software Courses Tracking */}
            {activeTab === "courses" && (
              <motion.div
                key="courses"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="flex-grow space-y-8"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-display font-extrabold text-xl text-navy-950">Software Courses &amp; Progress</h3>
                      <p className="text-xs text-navy-600 mt-0.5">Your enrolled civil engineering software courses, learning milestones, and certificates.</p>
                    </div>
                  </div>
                  <a
                    href="/education/courses"
                    className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 text-[11px] uppercase tracking-wider rounded-lg transition-all shadow-sm"
                  >
                    <BookOpen className="h-3.5 w-3.5" /> Explore Courses
                  </a>
                </div>

                {/* Summary Metric Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Enrolled</span>
                    <span className="font-display font-extrabold text-2xl text-slate-900 mt-1 block">{courseEnrollments.length}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Learning</span>
                    <span className="font-display font-extrabold text-2xl text-orange-600 mt-1 block">
                      {courseEnrollments.filter((e) => e.status !== "Completed").length}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Completed</span>
                    <span className="font-display font-extrabold text-2xl text-emerald-600 mt-1 block">
                      {courseEnrollments.filter((e) => e.status === "Completed").length}
                    </span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Avg Progress</span>
                    <span className="font-display font-extrabold text-xs text-slate-700 mt-2 block truncate">
                      {courseEnrollments.length > 0 ? `${Math.round(courseEnrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / courseEnrollments.length)}% Completed` : "No courses yet"}
                    </span>
                  </div>
                </div>

                {/* Courses List */}
                {courseEnrollments.length === 0 ? (
                  <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center bg-slate-50">
                    <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-navy-950 font-bold text-base">No Software Course Enrollments</p>
                    <p className="text-navy-600 text-xs mt-1 max-w-sm mx-auto">
                      Master AutoCAD, Revit, BIM, STAAD Pro, ETABS, and Quantity Surveying with practical, project-based engineering courses.
                    </p>
                    <a
                      href="/education/courses"
                      className="inline-flex items-center gap-2 mt-5 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 text-xs uppercase tracking-widest rounded-xl transition-all shadow-md"
                    >
                      <BookOpen className="h-4 w-4" /> Browse Software Courses
                    </a>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {courseEnrollments.map((item, idx) => {
                      const prog = item.progress || 15;
                      const status = item.status || "Active";
                      return (
                        <motion.div
                          key={item.id || idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: idx * 0.05 }}
                          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4 mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                                  {item.level || "ALL LEVELS"}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  Enrolled: {item.enrolledAt ? new Date(item.enrolledAt).toLocaleDateString() : "Recent"}
                                </span>
                              </div>
                              <h4 className="font-display font-extrabold text-lg text-slate-900">{item.courseName}</h4>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                "bg-blue-50 text-blue-700 border-blue-200"
                              }`}>
                                {status === "Completed" ? "Course Completed" : "Active Learning"}
                              </span>
                              <a
                                href={item.courseSlug ? `/education/courses/${item.courseSlug}` : "/education/courses"}
                                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-orange-500 text-white text-[11px] font-bold px-3.5 py-2 rounded-xl transition-all"
                              >
                                Continue <ChevronRight className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                                <span>Course Completion Progress</span>
                                <span>{prog}%</span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-orange-500 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(100, Math.max(5, prog))}%` }}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                              <div>
                                <span className="font-bold text-slate-800">Duration:</span> {item.duration || "Self-Paced"}
                              </div>
                              <div>
                                <span className="font-bold text-slate-800">Access:</span> Lifetime Access
                              </div>
                              <div>
                                <span className="font-bold text-slate-800">Doubt Support:</span> Included
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 2: Upload Drawings */}
            {activeTab === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="flex-grow space-y-8"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <UploadCloud className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-xl text-navy-950">Engineering Drawing Desk</h3>
                    <p className="text-xs text-navy-600 mt-0.5">Upload files for review by our automated pipelines and engineering auditors.</p>
                  </div>
                </div>

                <form onSubmit={handleUploadSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  <div className="border-2 border-dashed border-slate-200 hover:border-orange-500 rounded-2xl p-8 bg-slate-50 text-center transition-colors flex flex-col items-center justify-center min-h-60">
                    <UploadCloud className="h-10 w-10 text-slate-400 mb-3" />
                    <span className="block text-sm font-bold text-navy-950">Drag &amp; drop drawings here</span>
                    <span className="block text-[11px] text-navy-600 mt-1 mb-4">PDF, DWG, DXF formats (up to 25MB)</span>
                    <div className="space-y-3 w-full max-w-xs">
                      <input
                        type="file"
                        required
                        multiple
                        accept=".pdf,.dwg,.dxf"
                        onChange={(e) => {
                          if (e.target.files) {
                            setFiles(Array.from(e.target.files));
                          } else {
                            setFiles([]);
                          }
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs file:mr-3 file:rounded file:border-0 file:bg-navy-950 file:text-white file:px-3 file:py-1.5 file:text-[11px] file:font-bold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-slate-800 shadow-sm transition-all"
                      />
                      {files.length > 0 && (
                        <p className="text-[11px] text-emerald-600 font-bold">{files.length} file(s) ready to upload</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-navy-950 uppercase tracking-wider mb-2">
                        Service Pipeline Requirements
                      </label>
                      <select
                        value={serviceType}
                        onChange={(e) => setServiceType(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-slate-800 shadow-sm transition-all"
                      >
                        <option value="Structural Design">Structural Design</option>
                        <option value="BOQ Estimation">BOQ Estimation</option>
                        <option value="Quantity Surveying">Quantity Surveying</option>
                        <option value="PDF to AutoCAD">PDF to AutoCAD</option>
                        <option value="BIM Services">BIM Services</option>
                        <option value="Interior Design">Interior Design</option>
                      </select>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex gap-2">
                        <CheckCircle2 className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-navy-600 leading-normal">
                          Once uploaded, files are processed by our CAD boundary parser and assigned to an expert structural/civil surveyor for validation. Detailed quotations will follow.
                        </p>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={uploading || files.length === 0}
                      className="w-full bg-navy-950 hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-premium"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analyzing blueprints...
                        </>
                      ) : uploadSuccess ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          Successfully Uploaded!
                        </>
                      ) : (
                        <>Upload Drawing File</>
                      )}
                    </motion.button>
                  </div>
                </form>

                <div>
                  <h4 className="font-display font-extrabold text-sm text-navy-950 mb-4 uppercase tracking-wider">File Vault Status</h4>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                    {userDrawings.length === 0 ? (
                      <div className="p-8 text-center text-navy-600 text-xs font-semibold bg-white">
                        <FileStack className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        No drawings uploaded yet.
                      </div>
                    ) : (
                      userDrawings.map((draw, idx) => (
                        <motion.div
                          key={draw.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: idx * 0.05 }}
                          className="flex justify-between items-center p-4 bg-white hover:bg-slate-50 transition-colors text-xs gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="bg-slate-100 p-2 rounded-lg text-navy-700 flex-shrink-0">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              {draw.url ? (
                                <a
                                  href={draw.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-semibold text-navy-950 hover:text-orange-500 underline transition-colors cursor-pointer truncate block"
                                  title="Click to view/download file"
                                >
                                  {draw.name}
                                </a>
                              ) : (
                                <p className="font-semibold text-navy-950 truncate">{draw.name}</p>
                              )}
                              <p className="text-[10px] text-navy-600">{draw.size} • Uploaded on {draw.uploadDate}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-[10px] text-navy-600 font-medium bg-slate-100 px-2 py-0.5 rounded hidden sm:inline">
                              {draw.serviceType}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                              draw.status === "Ready" ? "bg-emerald-100 text-emerald-700" :
                              draw.status === "Analyzing" ? "bg-amber-100 text-amber-700 animate-pulse" :
                              "bg-slate-100 text-slate-700"
                            }`}>
                              {draw.status === "Analyzing" && <Loader2 className="h-3 w-3 animate-spin" />}
                              {draw.status}
                            </span>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: Invoices & Payments */}
            {activeTab === "payments" && (
              <motion.div
                key="payments"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="flex-grow space-y-8"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-extrabold text-xl text-navy-950">Invoices &amp; Quotations</h3>
                    <p className="text-xs text-navy-600 mt-0.5">Review estimations, download receipts and complete milestone payments.</p>
                  </div>
                  {totalDue > 0 && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                      ₹{totalDue.toLocaleString("en-IN")} due
                    </span>
                  )}
                </div>

                {servicePaymentRequests.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600">Service Payment Requests</p>
                        <p className="text-xs text-slate-500 mt-1">Secure payment requests sent to your account by Civil At Hand.</p>
                      </div>
                    </div>
                    {servicePaymentRequests.map((request) => (
                      <div key={request.id} className="rounded-2xl border border-orange-100 bg-orange-50/50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-display text-sm font-extrabold text-navy-950">{request.title}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${request.status === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{request.status}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{request.description}</p>
                          <p className="text-[10px] text-slate-500 mt-2">Amount: <strong>₹{Number(request.amount || 0).toLocaleString("en-IN")}</strong></p>
                        </div>
                        {request.status === "Paid" ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-xs font-extrabold"><CheckCircle2 className="h-4 w-4" /> Paid</span>
                        ) : (
                          <PaymentButton
                            itemSlug={request.itemSlug}
                            showDetails={false}
                            className="shrink-0"
                            onUnlocked={() => {
                              setServicePaymentRequests((prev) => prev.map((item) => item.id === request.id ? { ...item, status: "Paid" } : item));
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-4">
                  {userInvoices.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center bg-slate-50">
                      <Wallet className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-navy-600 text-sm font-medium">No invoices generated yet.</p>
                      <p className="text-navy-600 text-xs mt-1">Invoices are created after our engineers audit your uploaded plans.</p>
                    </div>
                  ) : (
                    userInvoices.map((inv, idx) => (
                      <motion.div
                        key={inv.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: idx * 0.05 }}
                        className="border border-slate-200 rounded-2xl p-5 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-all text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-navy-950 text-sm">Invoice #{inv.id.toUpperCase()}</span>
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              inv.status === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            }`}>
                              {inv.status}
                            </span>
                          </div>
                          <p className="font-semibold text-navy-950">{inv.projectTitle}</p>
                          <p className="text-[10px] text-navy-600">Generated: {inv.dateGenerated} • Due: {inv.dueDate}</p>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 pt-3 sm:pt-0 border-slate-100">
                          <div className="text-left sm:text-right">
                            <span className="block text-[10px] uppercase font-bold text-navy-600 tracking-wide">Amount Due</span>
                            <span className="text-base font-extrabold text-navy-950">₹{inv.amount.toLocaleString("en-IN")}</span>
                          </div>

                          {inv.status === "Paid" ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDownloadReceipt(inv)}
                                title="Download invoice"
                                className="bg-slate-100 hover:bg-slate-200 text-navy-950 font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                              >
                                <Download className="h-3.5 w-3.5" />
                                Receipt
                              </button>
                              <button
                                onClick={() => handleShareInvoice(inv)}
                                title="Share invoice"
                                aria-label="Share invoice"
                                className="bg-slate-100 hover:bg-slate-200 text-navy-950 font-bold p-2 rounded-lg transition-colors"
                              >
                                <Share2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <RazorpayCheckout
                              type="invoice"
                              invoiceId={inv.id}
                              label={<>Pay Now<ChevronRight className="h-3.5 w-3.5" /></>}
                              className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold px-5 py-2.5 rounded-lg shadow-orange-glow transition-all flex items-center gap-1.5"
                              onSuccess={() => handleInvoicePaid(inv.id)}
                            />
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB 4: Support Tickets */}
            {activeTab === "tickets" && (
              <motion.div
                key="tickets"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Header & CTA */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-sm">
                      <LifeBuoy className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-extrabold text-base text-navy-950">Help Desk</h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Raise queries, attach drawings, or start a live conversation with our support engineers.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsRaiseTicketModalOpen(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-orange-glow transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> New Support Request
                  </button>
                </div>

                {/* Metric Quick Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                    <span className="block text-[9px] uppercase font-bold text-slate-400">Total Tickets</span>
                    <span className="text-base font-extrabold text-navy-950 font-display mt-0.5 block">{userTickets.length}</span>
                  </div>
                  <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl">
                    <span className="block text-[9px] uppercase font-bold text-amber-600">Open Tickets</span>
                    <span className="text-base font-extrabold text-amber-700 font-display mt-0.5 block">
                      {userTickets.filter((t) => t.status === "Open" || t.status === "In Progress").length}
                    </span>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl">
                    <span className="block text-[9px] uppercase font-bold text-emerald-600">Resolved</span>
                    <span className="text-base font-extrabold text-emerald-700 font-display mt-0.5 block">
                      {userTickets.filter((t) => t.status === "Resolved" || t.status === "Closed").length}
                    </span>
                  </div>
                  <div className="bg-sky-500/5 border border-sky-500/20 p-3 rounded-xl">
                    <span className="block text-[9px] uppercase font-bold text-sky-600">Response Time</span>
                    <span className="text-base font-extrabold text-sky-700 font-display mt-0.5 block">&lt; 2 Hours</span>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
                    <Filter className="h-3 w-3" /> Filter:
                  </span>
                  {(["All", "Open", "In Progress", "Resolved", "Closed"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTicketFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        ticketFilter === filter
                          ? "bg-navy-950 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {/* Ticket List Cards */}
                <div className="space-y-3">
                  {filteredTickets.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-8 text-center space-y-2">
                      <LifeBuoy className="h-8 w-8 text-slate-300 mx-auto" />
                      <h4 className="font-display font-bold text-slate-700 text-sm">No Support Tickets Found</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        {ticketFilter !== "All"
                          ? `No tickets currently match the '${ticketFilter}' status filter.`
                          : "You have not raised any support tickets yet. Click '+ Raise New Ticket' to submit a question."}
                      </p>
                    </div>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => setSelectedTicketId(ticket.id)}
                        className="bg-white border border-slate-200 hover:border-orange-500/50 p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1.5 flex-grow">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-extrabold font-mono text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded">
                                #{ticket.ticketNumber || ticket.id}
                              </span>
                              <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60 flex items-center gap-1">
                                <Tag className="h-2.5 w-2.5" /> {ticket.category}
                              </span>
                              {getPriorityBadge(ticket.priority)}
                              {getStatusBadge(ticket.status)}
                            </div>

                            <h4 className="font-display font-bold text-sm text-navy-950 group-hover:text-orange-500 transition-colors">
                              {ticket.subject}
                            </h4>

                            <p className="text-xs text-slate-600 line-clamp-1">{ticket.description}</p>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <div className="text-right text-[10px] text-slate-400">
                              <span className="block font-medium">Updated: {ticket.updatedAt}</span>
                              <span className="block text-slate-500 font-bold mt-0.5">
                                {(ticket.messages || []).length} message{(ticket.messages || []).length === 1 ? "" : "s"}
                              </span>
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-orange-500 group-hover:text-white flex items-center justify-center text-slate-500 transition-all">
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── MODAL 1: RAISE NEW TICKET ── */}
      <AnimatePresence>
        {isRaiseTicketModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold">
                    <LifeBuoy className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-navy-950">New Support Request</h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Connect with our support engineers — live responses during working hours.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsRaiseTicketModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleRaiseTicketSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Ticket Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="e.g. Footing reinforcement detail query for Project #G+2"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-navy-950 font-semibold focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Category *
                    </label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-navy-950 font-semibold focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                    >
                      <option value="Structural Design">Structural Design</option>
                      <option value="Drawing / Blueprint Query">Drawing / Blueprint Query</option>
                      <option value="Billing & Quotation">Billing & Quotation</option>
                      <option value="Site Supervision">Site Supervision</option>
                      <option value="General Inquiry">General Inquiry</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Priority Level *
                    </label>
                    <select
                      value={ticketPriority}
                      onChange={(e) => setTicketPriority(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-navy-950 font-semibold focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                    >
                      <option value="Low">Low (General Query)</option>
                      <option value="Medium">Medium (Normal)</option>
                      <option value="High">High (Site Action Needed)</option>
                      <option value="Urgent">Urgent (Drawing Revision Critical)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Problem Description *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={ticketDesc}
                    onChange={(e) => setTicketDesc(e.target.value)}
                    placeholder="Provide full details, grid reference numbers, drawing sheet numbers, or site constraints..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-navy-950 font-medium focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500 transition-all resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRaiseTicketModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTicket || !ticketSubject.trim() || !ticketDesc.trim()}
                    className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold text-xs shadow-orange-glow transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {submittingTicket ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        Submit Ticket <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 2: TICKET DETAIL & REPLY THREAD ── */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 bg-slate-900 text-white flex justify-between items-start border-b border-slate-800">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded border border-orange-500/30">
                      #{selectedTicket.ticketNumber || selectedTicket.id}
                    </span>
                    <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                      {selectedTicket.category}
                    </span>
                    {getPriorityBadge(selectedTicket.priority)}
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                  <h3 className="font-display font-extrabold text-base text-white">{selectedTicket.subject}</h3>
                  <p className="text-[11px] text-slate-400">Raised on {selectedTicket.createdAt}</p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTicket.status !== "Resolved" && selectedTicket.status !== "Closed" && (
                    <button
                      onClick={() => updateTicketStatus(selectedTicket.id, "Resolved")}
                      className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/40 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="h-3 w-3" /> Mark Resolved
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedTicketId(null)}
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Message History Thread */}
              <div className="p-6 overflow-y-auto space-y-4 flex-grow max-h-[400px] bg-slate-50">
                {(selectedTicket.messages || []).map((msg) => {
                  const isClient = msg.sender === "client";
                  return (
                    <ChatBubble
                      key={msg.id}
                      message={msg}
                      isSelf={isClient}
                      fallbackName={isClient ? "You" : "Support Engineer"}
                    />
                  );
                })}
              </div>

              {/* Reply Form */}
              <div className="p-4 bg-white border-t border-slate-200">
                <ChatComposer
                  onSend={handleTicketReplySend}
                  sending={submittingReply}
                  placeholder="Type a follow-up reply... (attach an image or PDF)"
                  accentClass="bg-orange-500 hover:bg-orange-600 shadow-orange-glow"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
