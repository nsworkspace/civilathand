"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useProjects, Lead, Project, Invoice, SupportTicket, DrawingFile } from "@/context/ProjectContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, Shield, RefreshCw, Expand, Shrink, Maximize2, Minimize2,
  Users, BarChart3, UserCheck, FolderKanban, FileText, Receipt, LifeBuoy, Star,
  MessageSquare, BookOpen, Briefcase, Wrench, Bell, GraduationCap, Laptop, KeyRound, IndianRupee,
  Tag, Activity, Database, Globe2, Navigation2,
} from "lucide-react";
import { NavPanelContent } from "./admin/NavPanelContent";
import { WebsiteNavigationPanel } from "./admin/WebsiteNavigationPanel";
import { AdminToastHost } from "./admin/AdminToast";


// Heavy workspaces are loaded on demand. This keeps the admin shell and command center
// fast while preserving the existing module implementations.
const LazyLeadsPanel = dynamic(() => import("./admin/LeadsPanel").then((m) => m.LeadsPanel), { loading: () => <PanelLoading />, ssr: false });
const LazyProjectsPanel = dynamic(() => import("./admin/ProjectsPanel").then((m) => m.ProjectsPanel), { loading: () => <PanelLoading />, ssr: false });
const LazyDrawingsPanel = dynamic(() => import("./admin/DrawingsPanel").then((m) => m.DrawingsPanel), { loading: () => <PanelLoading />, ssr: false });
const LazyInvoicesPanel = dynamic(() => import("./admin/InvoicesPanel").then((m) => m.InvoicesPanel), { loading: () => <PanelLoading />, ssr: false });
const LazyTicketsPanel = dynamic(() => import("./admin/TicketsPanel").then((m) => m.TicketsPanel), { loading: () => <PanelLoading />, ssr: false });
const LazyPublicChatPanel = dynamic(() => import("./admin/PublicChatPanel").then((m) => m.PublicChatPanel), { loading: () => <PanelLoading />, ssr: false });
const LazyCommunityAdminPanel = dynamic(() => import("./admin/CommunityAdminPanel").then((m) => m.CommunityAdminPanel), { loading: () => <PanelLoading />, ssr: false });
const LazyBlogsPanel = dynamic(() => import("./admin/BlogsPanel").then((m) => m.BlogsPanel), { loading: () => <PanelLoading />, ssr: false });
const LazyPortfolioPanel = dynamic(() => import("./admin/PortfolioPanel").then((m) => m.PortfolioPanel), { loading: () => <PanelLoading />, ssr: false });
const LazyServicesPanel = dynamic(() => import("./admin/ServicesPanel").then((m) => m.ServicesPanel), { loading: () => <PanelLoading />, ssr: false });
const LazyCareersPanel = dynamic(() => import("./admin/CareersPanel").then((m) => m.CareersPanel), { loading: () => <PanelLoading />, ssr: false });
const LazySoftwareCoursesPanel = dynamic(() => import("./admin/SoftwareCoursesPanel").then((m) => m.SoftwareCoursesPanel), { loading: () => <PanelLoading />, ssr: false });
const LazyStudyMaterialsPanel = dynamic(() => import("./admin/StudyMaterialsPanel").then((m) => m.StudyMaterialsPanel), { loading: () => <PanelLoading />, ssr: false });
const LazyNotificationsPanel = dynamic(() => import("./admin/NotificationsPanel").then((m) => m.NotificationsPanel), { loading: () => <PanelLoading />, ssr: false });
const LazyClientsPanel = dynamic(() => import("./admin/ClientsPanel").then((m) => m.ClientsPanel), { loading: () => <PanelLoading />, ssr: false });
const LazyVendorLeadsPanel = dynamic(() => import("./admin/VendorLeadsPanel").then((m) => m.VendorLeadsPanel), { loading: () => <PanelLoading />, ssr: false });
const LazyMentorshipPanel = dynamic(() => import("./admin/MentorshipPanel").then((m) => m.MentorshipPanel), { loading: () => <PanelLoading />, ssr: false });
const LazyVendorsAdminPanel = dynamic(() => import("./admin/VendorsAdminPanel"), { loading: () => <PanelLoading />, ssr: false });
const LazyUsersAdminPanel = dynamic(() => import("./admin/UsersAdminPanel"), { loading: () => <PanelLoading />, ssr: false });
const LazyTeamMembersAdminPanel = dynamic(() => import("./admin/TeamMembersAdminPanel"), { loading: () => <PanelLoading />, ssr: false });
const LazyAdminAccountsPanel = dynamic(() => import("./admin/AdminAccountsPanel"), { loading: () => <PanelLoading />, ssr: false });
const LazyDatabaseToolsPanel = dynamic(() => import("./admin/DatabaseToolsPanel"), { loading: () => <PanelLoading />, ssr: false });
const LazyActivityLogPanel = dynamic(() => import("./admin/ActivityLogPanel"), { loading: () => <PanelLoading />, ssr: false });
const LazyFeedbackPanel = dynamic(() => import("./admin/FeedbackPanel"), { loading: () => <PanelLoading />, ssr: false });
const LazyProposalBuilderPanel = dynamic(() => import("./admin/ProposalBuilderPanel"), { loading: () => <PanelLoading />, ssr: false });
const LazyTestimonialsPanel = dynamic(() => import("./admin/TestimonialsPanel"), { loading: () => <PanelLoading />, ssr: false });
const LazyWebsitePagesPanel = dynamic(() => import("./admin/WebsitePagesPanel").then((m) => m.WebsitePagesPanel), { loading: () => <PanelLoading />, ssr: false });

const LazyPaymentSetupPanel = dynamic(() => import("./admin/PaymentSetupPanel").then((m) => m.PaymentSetupPanel), { loading: () => <PanelLoading />, ssr: false });
const LazyOffersPanel = dynamic(() => import("./admin/OffersPanel").then((m) => m.OffersPanel), { loading: () => <PanelLoading />, ssr: false });
const LazyPaymentHistoryPanel = dynamic(() => import("./admin/PaymentHistoryPanel").then((m) => m.PaymentHistoryPanel), { loading: () => <PanelLoading />, ssr: false });
const LazyAnalyticsDashboard = dynamic(() => import("./admin/AnalyticsDashboard").then((m) => m.AnalyticsDashboard), { loading: () => <PanelLoading />, ssr: false });

function PanelLoading() {
  return <div className="min-h-[360px] rounded-2xl border border-slate-100 bg-slate-50/70 p-6 animate-pulse"><div className="h-5 w-40 rounded bg-slate-200"/><div className="mt-3 h-3 w-64 rounded bg-slate-200"/><div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-white border border-slate-100" />)}</div></div>;
}


export const AdminView: React.FC = () => {
  const {
    leads,
    projects,
    invoices,
    blogs,
    portfolio,
    drawings,
    tickets,
    refreshServices,
    refreshPortfolio,
    refreshTickets,
    adminAlertTabs,
    clearAdminAlertTab,
    refreshAllData,
  } = useProjects();

  // ── Client Buckets (same as original) ──────────────────────────────
  const isInvoiceOverdue = (inv: Invoice) =>
    inv.status === "Unpaid" && !!inv.dueDate && new Date(inv.dueDate).getTime() < Date.now();

  const clientKeyFor = (email?: string, name?: string) => {
    const e = (email || "").trim().toLowerCase();
    if (e) return `email:${e}`;
    const n = (name || "").trim().toLowerCase();
    return n ? `name:${n}` : "unknown";
  };

  type ClientBucket = {
    key: string;
    name: string;
    email: string;
    leads: Lead[];
    projects: Project[];
    drawings: DrawingFile[];
    invoices: Invoice[];
    tickets: SupportTicket[];
    revenue: number;
    pending: number;
    overdueAmount: number;
    overdueCount: number;
    firstSeen: string;
  };

  const clientBuckets = React.useMemo((): ClientBucket[] => {
    const map = new Map<string, ClientBucket>();
    const ensure = (key: string, name?: string, email?: string): ClientBucket => {
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: name || "Unknown Client",
          email: (email || "").toLowerCase(),
          leads: [],
          projects: [],
          drawings: [],
          invoices: [],
          tickets: [],
          revenue: 0,
          pending: 0,
          overdueAmount: 0,
          overdueCount: 0,
          firstSeen: "",
        });
      }
      const bucket = map.get(key)!;
      if ((!bucket.name || bucket.name === "Unknown Client") && name) bucket.name = name;
      if (!bucket.email && email) bucket.email = email.toLowerCase();
      return bucket;
    };

    leads.forEach((l) => ensure(clientKeyFor(l.email, l.name), l.name, l.email).leads.push(l));
    projects.forEach((p) => ensure(clientKeyFor(p.clientEmail, p.clientName), p.clientName, p.clientEmail).projects.push(p));
    drawings.forEach((d) => ensure(clientKeyFor(d.clientEmail, d.clientName), d.clientName, d.clientEmail).drawings.push(d));
    tickets.forEach((t) => ensure(clientKeyFor(t.clientEmail, t.clientName), t.clientName, t.clientEmail).tickets.push(t));
    invoices.forEach((inv) => {
      const proj = projects.find((p) => p.id === inv.projectId);
      ensure(clientKeyFor(proj?.clientEmail, proj?.clientName), proj?.clientName, proj?.clientEmail).invoices.push(inv);
    });

    map.forEach((bucket) => {
      bucket.revenue = bucket.invoices.filter((inv: Invoice) => inv.status === "Paid").reduce((sum: number, inv: Invoice) => sum + (inv.amount || 0), 0);
      bucket.pending = bucket.invoices.filter((inv: Invoice) => inv.status === "Unpaid").reduce((sum: number, inv: Invoice) => sum + (inv.amount || 0), 0);
      const overdueInvs = bucket.invoices.filter(isInvoiceOverdue);
      bucket.overdueAmount = overdueInvs.reduce((sum: number, inv: Invoice) => sum + (inv.amount || 0), 0);
      bucket.overdueCount = overdueInvs.length;
      const dates = bucket.leads.map((l) => l.date).filter(Boolean).sort();
      bucket.firstSeen = dates[0] || "";
    });

    return Array.from(map.values());
  }, [leads, projects, drawings, tickets, invoices]);

  // ── Revenue ──────────────────────────────────────────────────────────
  const totalRevenue = invoices
    .filter((i) => i.status === "Paid")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const pendingRevenue = invoices
    .filter((i) => i.status === "Unpaid")
    .reduce((acc, curr) => acc + curr.amount, 0);

  // ── Mentorship & Career applications (fetch from API) ──────────────
  const [mentorshipApplications, setMentorshipApplications] = useState<any[]>([]);
  const [careerApps, setCareerApps] = useState<any[]>([]);

  useEffect(() => {
    // Load mentorship apps
    fetch("/api/admin/mentorship")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.applications) setMentorshipApplications(data.applications);
      })
      .catch(() => {});
    // Load career apps
    fetch("/api/admin/career-applications")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.applications) setCareerApps(data.applications);
      })
      .catch(() => {});
  }, []);

  // ── Admin role & permissions (superadmin sees everything; a custom
  // sub-account only sees the modules it was granted). Fetched from the
  // session cookie the person already logged in with — nothing extra for
  // them to do.
  const [adminRole, setAdminRole] = useState<"superadmin" | "custom" | null>(null);
  const [adminPermissions, setAdminPermissions] = useState<string[] | "all">([]);
  useEffect(() => {
    fetch("/api/admin/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.role) setAdminRole(data.role);
        if (data?.permissions) setAdminPermissions(data.permissions);
      })
      .catch(() => {});
  }, []);
  const isSuperAdmin = adminRole === "superadmin";
  const canAccess = (moduleId: string) =>
    isSuperAdmin || (Array.isArray(adminPermissions) && adminPermissions.includes(moduleId));

  // ── State for navigation ─────────────────────────────────────────────
  type AdminTab = "analytics" | "leads" | "projects" | "drawings" | "invoices" | "tickets" | "publicChat" | "community" | "blogs" | "portfolio" | "mentorship" | "services" | "careers" | "softwareCourses" | "studyMaterials" | "notifications" | "clients" | "vendors" | "vendorLeads" | "registeredUsers" | "teamMembers" | "adminAccounts" | "databaseTools" | "activityLog" | "feedback" | "proposals" | "testimonials" | "paymentSetup" | "paymentOffers" | "paymentHistory" | "websiteNavigation" | "websiteContent";
  const ACTIVE_TAB_STORAGE_KEY = "cah-admin-active-tab";
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    // Land back on whatever module the admin was last viewing — a
    // refresh (or reopening the tab) should never bounce them back to
    // Analytics.
    if (typeof window === "undefined") return "analytics";
    try {
      const saved = window.localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
      return (saved as AdminTab) || "analytics";
    } catch {
      return "analytics";
    }
  });

  // Once we know the logged-in admin's permissions, if they can't access
  // the current tab (or the default "analytics" tab), snap them to the
  // first module they ARE allowed to see.
  useEffect(() => {
    if (adminRole === null) return; // session not loaded yet
    if (!canAccess(activeTab)) {
      const firstAllowed = NAV_GROUPS.flatMap(g => g.items).find(item => canAccess(item.id));
      if (firstAllowed) navigateAdmin(firstAllowed.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminRole, adminPermissions]);
  const [navSearch, setNavSearch] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [recentTabs, setRecentTabs] = useState<string[]>(["analytics"]);
  const [favoriteTabs, setFavoriteTabs] = useState<string[]>(["analytics", "leads", "projects", "paymentSetup"]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("cah-admin-favorites");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setFavoriteTabs(parsed.filter((id) => typeof id === "string"));
      }
    } catch {}
  }, []);

  const toggleFavorite = (id: string) => {
    setFavoriteTabs((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev].slice(0, 8);
      try { window.localStorage.setItem("cah-admin-favorites", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const navigateAdmin = (id: string) => {
    setActiveTab(id as any);
    try { window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, id); } catch {}
    // NAV_GROUPS is runtime data, so normalize the selected id to the
    // AdminView tab union before storing it in the typed recent-tab state.
    const tabId = id as typeof activeTab;
    setRecentTabs((prev) => [tabId, ...prev.filter((x) => x !== tabId)].slice(0, 5));
    setMobileNavOpen(false);
    // Opening a module clears its "new update" red dot.
    clearAdminAlertTab(id);
  };

  const [focusMode, setFocusMode] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [refreshingPanel, setRefreshingPanel] = useState(false);
  // Bumped on every "Refresh" click. Used as (part of) the key on the
  // currently-visible panel so it fully remounts and re-runs its own
  // data fetch — without ever navigating away from the page, which is
  // what used to exit full screen and reset the view back to Analytics.
  const [panelRefreshKey, setPanelRefreshKey] = useState(0);
  const fullScreenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullScreenChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, []);

  const toggleFullScreen = async () => {
    try {
      if (!document.fullscreenElement) await fullScreenRef.current?.requestFullscreen();
      else await document.exitFullscreen();
    } catch (err) { console.error("Full screen toggle failed:", err); }
  };

  const handleRefreshPanel = async () => {
    setRefreshingPanel(true);
    try {
      // Refresh in place — no navigation. This is deliberate: a real
      // page reload (window.location.reload()) would drop full screen
      // (browsers always exit full screen on navigation, and cannot be
      // reliably re-entered afterwards without a fresh user gesture) and
      // reset the view back to Analytics. Refetching data + remounting
      // only the visible panel avoids both problems entirely and is
      // faster, since nothing has to re-download or re-parse the app.
      refreshAllData();
      refreshServices();
      refreshPortfolio();
      refreshTickets();
      setPanelRefreshKey((k) => k + 1);
      // Keep the button's spinner visible briefly so the action still
      // reads as "something happened" even though it's now near-instant.
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      console.error("Failed to refresh admin control center:", err);
    } finally {
      setRefreshingPanel(false);
    }
  };

  // ── Badge counts ────────────────────────────────────────────────────
  const supportTickets = tickets.filter(t => !t.subject.startsWith("[Live Chat]") && (t as any).source !== "public-chat");
  const openSupportTicketsCount = supportTickets.filter(t => t.status === "Open" || t.status === "In Progress").length;
  const publicChatCount = tickets.filter(t => t.subject.startsWith("[Live Chat]") || (t as any).source === "public-chat").filter(t => t.status === "Open" || t.status === "In Progress").length;

  const NAV_GROUPS = [
    { label: "Overview & Audit", items: [
      { id: "analytics", title: "Analytics Dashboard", short: "Analytics", icon: BarChart3 },
            { id: "activityLog", title: "Activity & Audit Log", short: "Activity", icon: Activity },
    ]},
    { label: "Customers & Revenue", items: [
      { id: "clients", title: "Client Workspace", short: "Clients", icon: Users },
      { id: "leads", title: "Lead & CRM Management", short: "Leads", icon: Users, badge: true },
      { id: "proposals", title: "Proposal Builder", short: "Proposals", icon: FileText },
      { id: "projects", title: "Project Control Center", short: "Projects", icon: FolderKanban },
      { id: "invoices", title: "Billing & Invoicing", short: "Invoices", icon: Receipt },
      { id: "paymentSetup", title: "Payment Setup", short: "Setup", icon: IndianRupee },
      { id: "paymentOffers", title: "Offers & Coupons", short: "Offers", icon: Tag },
      { id: "paymentHistory", title: "Payment History", short: "History", icon: Receipt },
    ]},
    { label: "Support & Engagement", items: [
      { id: "tickets", title: "Help Desk", short: "Help Desk", icon: LifeBuoy, ticketBadge: openSupportTicketsCount },
      { id: "publicChat", title: "Public Live Chat", short: "Live Chat", icon: MessageSquare, ticketBadge: publicChatCount },
      { id: "community", title: "Community Management", short: "Community", icon: Users },
      { id: "notifications", title: "Notification Center", short: "Notify", icon: Bell },
      { id: "feedback", title: "Feedback & Reports", short: "Feedback", icon: MessageSquare },
      { id: "testimonials", title: "Testimonials & Reviews", short: "Reviews", icon: Star },
    ]},
    { label: "Operations & Delivery", items: [
      { id: "drawings", title: "Drawing Audit Desk", short: "Drawings", icon: FileText },
      { id: "services", title: "Services Management", short: "Services", icon: Wrench },
      { id: "vendors", title: "Vendor Management", short: "Vendors", icon: Users },
      { id: "vendorLeads", title: "Vendor Leads", short: "Vendor Leads", icon: MessageSquare },
      { id: "teamMembers", title: "Team Members", short: "Team", icon: Users },
    ]},
    { label: "Growth & Content", items: [
      { id: "blogs", title: "Blog Management", short: "Blogs", icon: BookOpen },
      { id: "portfolio", title: "Portfolio Management", short: "Portfolio", icon: Briefcase },
      { id: "careers", title: "Career Applications", short: "Careers", icon: Briefcase },
    ]},
    { label: "Website Control", items: [
      { id: "websiteContent", title: "Website Pages & CMS", short: "Website", icon: Globe2 },
      { id: "websiteNavigation", title: "Website Navigation", short: "Navigation", icon: Navigation2 },
    ]},
    { label: "Users & Security", items: [
      { id: "registeredUsers", title: "Registered User Tracker", short: "Users", icon: UserCheck },
      { id: "adminAccounts", title: "Admin Accounts", short: "Accounts", icon: KeyRound },
      { id: "databaseTools", title: "Database Tools", short: "Database", icon: Database },
    ]},
  ];

  // Filter the sidebar down to only the modules this admin can access.
  // Real enforcement happens server-side (hasModuleAccess) — this is just
  // so a custom account doesn't see menu items they can't open.
  const VISIBLE_NAV_GROUPS = NAV_GROUPS
    .filter(group => group.label !== "System")
    .map(group => ({ ...group, items: group.items.filter(item => canAccess(item.id)) }))
    .filter(group => group.items.length > 0);

  const filteredNavGroups = navSearch.trim()
    ? VISIBLE_NAV_GROUPS.map(group => ({ ...group, items: group.items.filter(item => item.title.toLowerCase().includes(navSearch.trim().toLowerCase())) })).filter(group => group.items.length > 0)
    : VISIBLE_NAV_GROUPS;

  const activeTabMeta = VISIBLE_NAV_GROUPS.flatMap(g => g.items).find(t => t.id === activeTab);

  return (
    <>
      <AdminToastHost />
      <div className={`relative ${isFullScreen ? "bg-slate-50 p-4 overflow-y-auto max-h-screen" : ""}`} ref={fullScreenRef}>
      {!focusMode && (
        <div className="lg:hidden flex items-center justify-between gap-3 bg-navy-950 rounded-xl px-3.5 py-3 mb-4 admin-border-glow">
          <button onClick={() => setMobileNavOpen(true)} className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wide min-w-0">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 flex-shrink-0"><Menu className="h-4 w-4" /></span>
            <span className="flex items-center gap-2 min-w-0">
              {activeTabMeta && <activeTabMeta.icon className="h-4 w-4 text-orange-400 flex-shrink-0" />}
              <span className="truncate">{activeTabMeta?.short || "Menu"}</span>
            </span>
          </button>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] flex-shrink-0">Tap to switch</span>
        </div>
      )}

      {!focusMode && favoriteTabs.filter((id) => NAV_GROUPS.flatMap(g => g.items).some(item => item.id === id) && canAccess(id)).length > 0 && (
        <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 flex-shrink-0">Favorites</span>
          {favoriteTabs.filter((id) => NAV_GROUPS.flatMap(g => g.items).some(item => item.id === id) && canAccess(id)).map((id) => {
            const item = NAV_GROUPS.flatMap(g => g.items).find(x => x.id === id);
            if (!item) return null;
            return <button key={id} onClick={() => navigateAdmin(id)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-extrabold text-slate-600 hover:border-orange-300 hover:text-orange-600 whitespace-nowrap"><item.icon className="h-3.5 w-3.5" /> {item.short}</button>;
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-8 items-start">
        {!focusMode && (
          <div className="hidden lg:block lg:col-span-3 admin-sidebar-surface rounded-2xl border border-white/[0.08] shadow-premium-lg sticky top-6 overflow-hidden">
            <NavPanelContent
              navSearch={navSearch}
              setNavSearch={setNavSearch}
              filteredNavGroups={filteredNavGroups}
              activeTab={activeTab}
              setActiveTab={(id) => navigateAdmin(id)}
              leads={leads}
              onSelect={() => {}}
              favorites={favoriteTabs}
              onToggleFavorite={toggleFavorite}
              alertTabs={adminAlertTabs}
            />
          </div>
        )}

        <AnimatePresence>
          {mobileNavOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileNavOpen(false)} className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]" />
              <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="lg:hidden fixed left-0 top-0 bottom-0 w-[82%] max-w-[320px] admin-sidebar-surface z-[100] shadow-2xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-orange-500" /><span className="text-[11px] font-extrabold text-white uppercase tracking-[0.2em]">Control Modules</span></div>
                  <button onClick={() => setMobileNavOpen(false)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <NavPanelContent hideHeader navSearch={navSearch} setNavSearch={setNavSearch} filteredNavGroups={filteredNavGroups} activeTab={activeTab} setActiveTab={(id) => navigateAdmin(id)} leads={leads} onSelect={() => setMobileNavOpen(false)} favorites={favoriteTabs} onToggleFavorite={toggleFavorite} alertTabs={adminAlertTabs} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className={`${focusMode ? "col-span-1 lg:col-span-12" : "col-span-1 lg:col-span-9"} bg-white rounded-2xl border border-slate-200 mt-0 p-4 sm:p-6 md:p-8 shadow-premium min-h-[500px] overflow-hidden flex flex-col`}>
          {activeTabMeta && (
            <div className="flex items-center justify-between gap-3 mb-6 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <activeTabMeta.icon className="h-4.5 w-4.5 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-extrabold text-navy-950 uppercase tracking-wide truncate">{activeTabMeta.title}</h2>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button title="Refresh all admin sections" onClick={handleRefreshPanel} disabled={refreshingPanel} className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wide transition-all bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-60"><RefreshCw className={`h-3.5 w-3.5 ${refreshingPanel ? "animate-spin" : ""}`} /><span className="hidden sm:inline">{refreshingPanel ? "Refreshing…" : "Refresh"}</span></button>
                <button onClick={toggleFullScreen} title={isFullScreen ? "Exit full screen (Esc)" : "Enter full screen"} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wide transition-all ${isFullScreen ? "bg-navy-950 text-white hover:bg-navy-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {isFullScreen ? <Shrink className="h-3.5 w-3.5" /> : <Expand className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{isFullScreen ? "Exit Full Screen" : "Full Screen"}</span>
                </button>
                <button onClick={() => setFocusMode(v => !v)} title={focusMode ? "Exit focus mode — show all modules" : "Focus on this module — hide the sidebar and zoom in"} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wide transition-all ${focusMode ? "bg-navy-950 text-white hover:bg-navy-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {focusMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{focusMode ? "Exit Focus" : "Focus Mode"}</span>
                </button>
              </div>
            </div>
          )}
          <AnimatePresence mode="wait">
          <div key={`${activeTab}::${panelRefreshKey}`}>
            {activeTab === "analytics" && (
              <LazyAnalyticsDashboard
                leads={leads}
                projects={projects}
                invoices={invoices}
                blogs={blogs}
                portfolio={portfolio}
                tickets={tickets}
                clientBuckets={clientBuckets}
                mentorshipApplications={mentorshipApplications}
                careerApps={careerApps}
                totalRevenue={totalRevenue}
                pendingRevenue={pendingRevenue}
              />
            )}
                        {activeTab === "leads" && <LazyLeadsPanel />}
            {activeTab === "projects" && <LazyProjectsPanel />}
            {activeTab === "drawings" && <LazyDrawingsPanel />}
            {activeTab === "invoices" && <LazyInvoicesPanel />}
            {activeTab === "paymentSetup" && <LazyPaymentSetupPanel />}
            {activeTab === "paymentOffers" && <LazyOffersPanel />}
            {activeTab === "paymentHistory" && <LazyPaymentHistoryPanel />}
            {activeTab === "tickets" && <LazyTicketsPanel />}
            {activeTab === "publicChat" && <LazyPublicChatPanel />}
            {activeTab === "community" && <LazyCommunityAdminPanel />}
            {activeTab === "blogs" && <LazyBlogsPanel />}
            {activeTab === "portfolio" && <LazyPortfolioPanel />}
            {activeTab === "services" && <LazyServicesPanel />}
            {activeTab === "careers" && <LazyCareersPanel />}
            {activeTab === "softwareCourses" && <LazySoftwareCoursesPanel />}
            {activeTab === "studyMaterials" && <LazyStudyMaterialsPanel />}
            {activeTab === "notifications" && <LazyNotificationsPanel />}
            {activeTab === "clients" && <LazyClientsPanel />}
            {activeTab === "vendorLeads" && <LazyVendorLeadsPanel />}
            {activeTab === "mentorship" && <LazyMentorshipPanel />}
            {activeTab === "vendors" && <LazyVendorsAdminPanel />}
            {activeTab === "registeredUsers" && <LazyUsersAdminPanel />}
            {activeTab === "teamMembers" && <LazyTeamMembersAdminPanel />}
            {activeTab === "adminAccounts" && isSuperAdmin && <LazyAdminAccountsPanel />}
            {activeTab === "databaseTools" && isSuperAdmin && <LazyDatabaseToolsPanel />}
            {activeTab === "activityLog" && isSuperAdmin && <LazyActivityLogPanel />}
            {activeTab === "feedback" && isSuperAdmin && <LazyFeedbackPanel />}
            {activeTab === "proposals" && canAccess("leads") && <LazyProposalBuilderPanel />}
            {activeTab === "testimonials" && canAccess("clients") && <LazyTestimonialsPanel />}
            {activeTab === "websiteNavigation" && <WebsiteNavigationPanel />}
            {activeTab === "websiteContent" && <LazyWebsitePagesPanel />}
          </div>
          </AnimatePresence>
        </div>
      </div>

      </div>
    </>
  );
};
