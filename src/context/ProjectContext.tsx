"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { PortfolioItem, portfolioItems as fallbackPortfolio } from "@/data/portfolio";
import { ServiceItem, servicesData } from "@/data/services";
import { auth } from "@/lib/firebase";
import { playClientChime, playAdminChime, primeNotificationAudio } from "@/lib/notificationSound";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  source: string; // e.g., "Cost Calculator", "Contact Form", etc.
  details: string;
  status: "new" | "contacted" | "converted" | "archived";
  date: string;
}

export interface Project {
  id: string;
  title: string;
  clientName: string;
  clientEmail?: string;
  service: string;
  areaSqFt: number;
  location: string;
  status: "Uploaded" | "Under Review" | "Designing" | "Completed";
  progress: number; // percentage
  drawings: string[]; // drawing file names
  quoteAmount?: number;
  invoicePaid?: boolean;
  dateStarted: string;
}

export interface DrawingFile {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  status: "Processed" | "Analyzing" | "Ready";
  serviceType: string;
  url?: string;
  clientName?: string;
  clientEmail?: string;
  projectId?: string;
}

export interface Invoice {
  id: string;
  projectId: string;
  projectTitle: string;
  amount: number;
  dueDate: string;
  status: "Unpaid" | "Paid";
  dateGenerated: string;
  paymentLink?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "danger";
  timestamp: string;
  read: boolean;
  isAdmin: boolean;
  userEmail?: string;
  recipientName?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: "client" | "system" | "admin";
  timestamp: string;
}

export interface TicketAttachment {
  url: string;
  name: string;
  type: string;
  size?: string;
}

export interface TicketMessage {
  id: string;
  sender: "client" | "admin" | "system";
  senderName: string;
  text: string;
  timestamp: string;
  attachments?: TicketAttachment[];
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: "Structural Design" | "Drawing / Blueprint Query" | "Billing & Quotation" | "Site Supervision" | "General Inquiry";
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  source?: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  summary: string;
  category: "Structure" | "Educational" | "Transportation" | "General tech" | "Architecture" | "Case studies" | "Civil engineering";
  date: string;
  author: string;
  image: string;
  imageAlt?: string;
  status: "draft" | "published";
  slug?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  featured?: boolean;
  views?: number;
  likes?: number;
  shares?: number;
  updatedAt?: string;
}


interface ProjectContextType {
  leads: Lead[];
  projects: Project[];
  drawings: DrawingFile[];
  invoices: Invoice[];
  notifications: Notification[];
  chatMessages: ChatMessage[];
  tickets: SupportTicket[];
  blogs: BlogPost[];
  portfolio: PortfolioItem[];
  addLead: (lead: Omit<Lead, "id" | "date" | "status">) => Promise<void>;
  addProject: (project: Omit<Project, "id" | "dateStarted" | "progress" | "status">) => Promise<void>;
  updateProjectStatus: (id: string, status: Project["status"]) => Promise<void>;
  uploadDrawing: (file: Omit<DrawingFile, "id" | "uploadDate" | "status">) => Promise<void>;
  updateDrawingStatus: (id: string, status: DrawingFile["status"]) => Promise<void>;
  deleteDrawing: (id: string) => Promise<void>;
  payInvoice: (id: string) => Promise<void>;
  generateInvoice: (projectId: string, amount: number, paymentLink?: string) => Promise<Invoice | null>;
  updateInvoicePaymentLink: (id: string, paymentLink: string) => Promise<void>;
  addNotification: (title: string, message: string, type: Notification["type"], isAdmin: boolean, userEmail?: string, recipientName?: string) => Promise<void>;
  markNotificationsAsRead: (isAdmin: boolean, userEmail?: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  sendChatMessage: (text: string, sender: ChatMessage["sender"]) => Promise<void>;
  addTicket: (ticket: {
    subject: string;
    category: SupportTicket["category"];
    priority: SupportTicket["priority"];
    description: string;
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    source?: string;
    attachments?: TicketAttachment[];
  }) => Promise<void>;
  addTicketReply: (
    ticketId: string,
    text: string,
    sender: "client" | "admin" | "system",
    senderName?: string,
    attachments?: TicketAttachment[]
  ) => Promise<void>;
  updateTicketStatus: (
    ticketId: string,
    status: SupportTicket["status"],
    priority?: SupportTicket["priority"]
  ) => Promise<void>;
  deleteTicket: (ticketId: string) => Promise<void>;
  refreshTickets: () => Promise<void>;
  addBlog: (blog: Omit<BlogPost, "id" | "date">) => Promise<void>;
  updateBlog: (id: string, blog: Partial<BlogPost>) => Promise<void>;
  deleteBlog: (id: string) => Promise<void>;
  addPortfolioItem: (item: Omit<PortfolioItem, "id">) => Promise<boolean>;
  updatePortfolioItem: (id: string, item: Partial<PortfolioItem>) => Promise<boolean>;
  deletePortfolioItem: (id: string) => Promise<boolean>;
  refreshPortfolio: () => Promise<void>;
  updateLeadStatus: (id: string, status: Lead["status"]) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  services: ServiceItem[];
  servicesLoaded: boolean;
  refreshServices: () => Promise<void>;
  isLoaded: boolean; // true once all API fetches have settled (success or fallback)
  blogsLoaded: boolean;
  // Set of admin nav tab ids that currently have a fresh, unseen update
  // (new ticket, new lead, new notification reply, etc). Consumed by
  // NavPanelContent to show the red "new" dot, and cleared per-tab once
  // the admin actually opens that panel.
  adminAlertTabs: Set<string>;
  clearAdminAlertTab: (tabId: string) => void;
  // Re-fetches every context-owned collection (leads, projects, drawings,
  // notifications, chats, portfolio, services, blogs) without a page
  // reload — used by the Admin "Refresh" button so it never has to
  // navigate away (and therefore never drops full screen or the current
  // tab).
  refreshAllData: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Initial Sample Data
const initialLeads: Lead[] = [];

const initialProjects: Project[] = [];

const initialDrawings: DrawingFile[] = [];

const initialInvoices: Invoice[] = [];

const initialNotifications: Notification[] = [];

const initialTickets: SupportTicket[] = [];

const initialChatMessages: ChatMessage[] = [];

const initialBlogs: BlogPost[] = [];

// Helper functions defined outside of the component to bypass purity warnings on Date/Time functions during render
function generateLeadId(): string {
  return `lead-${Date.now()}`;
}

function generateProjId(): string {
  return `proj-${Date.now()}`;
}

function generateNotifId(): string {
  return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
}

function generateMsgId(): string {
  return `msg-${Date.now() + 1}`;
}

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

function getFutureDateString(daysAhead: number): string {
  return new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
}

function getNotificationTimestamp(): string {
  return new Date().toISOString().replace("T", " ").substring(0, 16);
}

function getLocaleTimeString(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [drawings, setDrawings] = useState<DrawingFile[]>([]);
  const [adminAlertTabs, setAdminAlertTabs] = useState<Set<string>>(new Set());
  // Bumping this re-runs the main "load from database API" effect below —
  // this is what powers a manual "Refresh" action without a page reload.
  const [refreshToken, setRefreshToken] = useState(0);
  const refreshAllData = () => setRefreshToken((t) => t + 1);
  // Tracks notification/ticket ids already seen, so the chime only ever
  // fires for a genuinely new item — never on first page load and never
  // twice for the same item.
  const seenNotificationIds = useRef<Set<string> | null>(null);
  const seenTicketIds = useRef<Set<string> | null>(null);

  const clearAdminAlertTab = (tabId: string) => {
    setAdminAlertTabs((prev) => {
      if (!prev.has(tabId)) return prev;
      const next = new Set(prev);
      next.delete(tabId);
      return next;
    });
  };

  // Compares a freshly-fetched notification list against what was seen
  // last time. On the very first call it only records the baseline (so
  // page load never triggers a sound for old, already-existing
  // notifications) — every call after that chimes for genuinely new,
  // unread items only.
  const registerIncomingNotifications = (data: Notification[], isAdminContext: boolean) => {
    const ids = new Set(data.map((n) => n.id));
    const isFirstRun = seenNotificationIds.current === null;
    if (!isFirstRun) {
      const freshUnread = data.filter((n) => !n.read && !seenNotificationIds.current!.has(n.id));
      if (freshUnread.length > 0) {
        const hasAdminFacing = freshUnread.some((n) => n.isAdmin);
        const hasClientFacing = freshUnread.some((n) => !n.isAdmin);
        if (isAdminContext) {
          if (hasAdminFacing) {
            playAdminChime();
            setAdminAlertTabs((prev) => new Set(prev).add("notifications"));
          }
        } else if (hasClientFacing) {
          playClientChime();
        }
      }
    }
    seenNotificationIds.current = ids;
  };

  // Browsers only allow audio to start after the user has interacted with
  // the page. This "warms up" the shared notification AudioContext on the
  // very first click/tap/keypress anywhere on the site, so the first real
  // notification chime later isn't silently swallowed.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const prime = () => {
      primeNotificationAudio();
      window.removeEventListener("pointerdown", prime);
      window.removeEventListener("keydown", prime);
    };
    window.addEventListener("pointerdown", prime, { once: true });
    window.addEventListener("keydown", prime, { once: true });
    return () => {
      window.removeEventListener("pointerdown", prime);
      window.removeEventListener("keydown", prime);
    };
  }, []);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>(servicesData);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [blogsLoaded, setBlogsLoaded] = useState(false);
  // Admin sessions are resolved before shared data loads. A custom admin only
  // receives the datasets they were explicitly granted; this prevents a
  // hidden panel from still leaking its records into the browser cache.
  const [adminContextReady, setAdminContextReady] = useState(false);
  const [adminContext, setAdminContext] = useState<{ role: "superadmin" | "custom"; permissions: string[] } | null>(null);
  const adminCan = (moduleId: string) => !adminContext || adminContext.role === "superadmin" || adminContext.permissions.includes(moduleId);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/session", { cache: "no-store" })
      .then((res) => res.ok ? res.json() : null)
      .then((session) => {
        if (cancelled) return;
        if (session?.authenticated && session?.role) {
          setAdminContext({ role: session.role, permissions: Array.isArray(session.permissions) ? session.permissions : [] });
        } else {
          setAdminContext(null);
        }
      })
      .catch(() => { if (!cancelled) setAdminContext(null); })
      .finally(() => { if (!cancelled) setAdminContextReady(true); });
    return () => { cancelled = true; };
  }, []);


  // Initialize all states from SWR local storage cache immediately on mount
  useEffect(() => {
    if (!adminContextReady) return;
    if (typeof window !== "undefined") {
      try {
        if (adminContext) {
          const protectedCaches: Record<string, string> = {
            leads: "cah_leads", projects: "cah_projects", drawings: "cah_drawings", invoices: "cah_invoices",
            notifications: "cah_notifications", publicChat: "cah_chats", tickets: "cah_tickets", blogs: "cah_blogs",
            portfolio: "cah_portfolio", services: "cah_services",
          };
          Object.entries(protectedCaches).forEach(([moduleId, key]) => { if (!adminCan(moduleId)) localStorage.removeItem(key); });
          if (adminContext.role === "custom") {
            if (!adminCan("leads")) setLeads([]);
            if (!adminCan("projects")) setProjects([]);
            if (!adminCan("drawings")) setDrawings([]);
            if (!adminCan("invoices")) setInvoices([]);
            if (!adminCan("notifications")) setNotifications([]);
            if (!adminCan("publicChat")) setChatMessages([]);
            if (!adminCan("tickets")) setTickets([]);
            if (!adminCan("blogs")) setBlogs([]);
            if (!adminCan("portfolio")) setPortfolio([]);
            if (!adminCan("services")) setServices([]);
          }
        }
        const cachedLeads = localStorage.getItem("cah_leads");
        if (cachedLeads) setLeads(JSON.parse(cachedLeads));

        const cachedProjects = localStorage.getItem("cah_projects");
        if (cachedProjects) setProjects(JSON.parse(cachedProjects));

        const cachedDrawings = localStorage.getItem("cah_drawings");
        if (cachedDrawings) setDrawings(JSON.parse(cachedDrawings));

        const cachedNotifications = localStorage.getItem("cah_notifications");
        if (cachedNotifications) setNotifications(JSON.parse(cachedNotifications));

        const cachedChats = localStorage.getItem("cah_chats");
        if (cachedChats) setChatMessages(JSON.parse(cachedChats));

        const cachedTickets = localStorage.getItem("cah_tickets");
        if (cachedTickets) setTickets(JSON.parse(cachedTickets));

        const cachedBlogs = localStorage.getItem("cah_blogs");
        if (cachedBlogs) {
          if (cachedBlogs.includes("data:image/")) {
            localStorage.removeItem("cah_blogs");
          } else {
            setBlogs(JSON.parse(cachedBlogs));
            setBlogsLoaded(true);
          }
        }

        const cachedPortfolio = localStorage.getItem("cah_portfolio");
        if (cachedPortfolio) setPortfolio(JSON.parse(cachedPortfolio));

        const cachedServices = localStorage.getItem("cah_services");
        if (cachedServices) {
          setServices(JSON.parse(cachedServices));
          setServicesLoaded(true);
        }

      } catch (e) {
        console.error("Error reading initial SWR cache:", e);
      }
    }
  }, [adminContextReady, adminContext]);

  // Load from database API
  useEffect(() => {
    if (!adminContextReady) return;
    if (typeof window !== "undefined") {
      const userJson = localStorage.getItem("cah_user");
      let leadsUrl = "/api/leads";
      let projectsUrl = "/api/projects";
      let notificationsUrl = "/api/notifications";
      if (userJson) {
        try {
          const u = JSON.parse(userJson);
          if (u.email) {
            leadsUrl = `/api/leads?email=${encodeURIComponent(u.email.toLowerCase())}`;
            notificationsUrl = `/api/notifications?userEmail=${encodeURIComponent(u.email.toLowerCase())}`;
          }
          if (u.name) {
            projectsUrl = `/api/projects?clientName=${encodeURIComponent(u.name)}`;
          }
        } catch (e) {
          console.error("Failed to parse user details for query params:", e);
        }
      }

      const fetchLeads = adminCan("leads") ? (async () => {
        const token = auth.currentUser ? await auth.currentUser.getIdToken().catch(() => "") : "";
        const response = await fetch(leadsUrl, { cache: "no-store", headers: token ? { Authorization: `Bearer ${token}` } : {} });
        return response;
      })()
        .then((res) => {
          if (!res.ok) {
            console.warn("Failed to fetch leads");
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (!data) return;
          const leadsData = Array.isArray(data) ? data : initialLeads;
          setLeads(leadsData);
          localStorage.setItem("cah_leads", JSON.stringify(leadsData));
        })
        .catch((err) => {
          console.error("Failed to fetch leads, using fallback:", err);
          if (leads.length === 0) setLeads(initialLeads);
        }) : Promise.resolve();

      const fetchBlogs = adminCan("blogs") ? fetch("/api/blogs", { cache: "no-store" })
        .then((res) => {
          if (!res.ok) {
            console.warn("Failed to fetch blogs");
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (!data) return;
          const blogsData = Array.isArray(data) ? data : initialBlogs;
          setBlogs(blogsData);
          localStorage.setItem("cah_blogs", JSON.stringify(blogsData));
        })
        .catch((err) => {
          console.error("Failed to fetch blogs, using fallback:", err);
          if (blogs.length === 0) setBlogs(initialBlogs);
        })
        .finally(() => {
          setBlogsLoaded(true);
        }) : Promise.resolve();

      const fetchProjects = adminCan("projects") ? fetch(projectsUrl, { cache: "no-store" })
        .then((res) => {
          if (!res.ok) {
            console.warn("Failed to fetch projects");
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (!data) return;
          const projectsData = Array.isArray(data) ? data : initialProjects;
          setProjects(projectsData);
          localStorage.setItem("cah_projects", JSON.stringify(projectsData));
        })
        .catch((err) => {
          console.error("Failed to fetch projects, using fallback:", err);
          if (projects.length === 0) setProjects(initialProjects);
        }) : Promise.resolve();

      const fetchDrawings = adminCan("drawings") ? fetch("/api/drawings", { cache: "no-store" })
        .then((res) => {
          if (!res.ok) {
            console.warn("Failed to fetch drawings");
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (!data) return;
          const drawingsData = Array.isArray(data) ? data : initialDrawings;
          setDrawings(drawingsData);
          localStorage.setItem("cah_drawings", JSON.stringify(drawingsData));
        })
        .catch((err) => {
          console.error("Failed to fetch drawings, using fallback:", err);
          if (drawings.length === 0) setDrawings(initialDrawings);
        }) : Promise.resolve();

      const fetchNotifications = adminCan("notifications") ? fetch(notificationsUrl, { cache: "no-store" })
        .then((res) => {
          if (!res.ok) {
            console.warn("Failed to fetch notifications");
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (!data) return;
          const notifsData = Array.isArray(data) ? data : initialNotifications;
          setNotifications(notifsData);
          localStorage.setItem("cah_notifications", JSON.stringify(notifsData));
          registerIncomingNotifications(notifsData, !!adminContext);
        })
        .catch((err) => {
          console.error("Failed to fetch notifications, using fallback:", err);
          if (notifications.length === 0) setNotifications(initialNotifications);
        }) : Promise.resolve();

      const fetchChats = adminCan("publicChat") ? fetch("/api/support-messages", { cache: "no-store" })
        .then((res) => {
          if (!res.ok) {
            console.warn("Failed to fetch chats");
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (!data) return;
          const chatsData = Array.isArray(data) ? data : initialChatMessages;
          setChatMessages(chatsData);
          localStorage.setItem("cah_chats", JSON.stringify(chatsData));
        })
        .catch((err) => {
          console.error("Failed to fetch chats, using fallback:", err);
          if (chatMessages.length === 0) setChatMessages(initialChatMessages);
        }) : Promise.resolve();

      const fetchTickets = adminCan("tickets") ? fetch("/api/tickets", { cache: "no-store" })
        .then((res) => {
          if (!res.ok) {
            console.warn("Failed to fetch tickets");
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (!data) return;
          const ticketsData = Array.isArray(data) ? data : initialTickets;
          setTickets(ticketsData);
          localStorage.setItem("cah_tickets", JSON.stringify(ticketsData));
        })
        .catch((err) => {
          console.error("Failed to fetch tickets, using fallback:", err);
          if (tickets.length === 0) setTickets(initialTickets);
        }) : Promise.resolve();

      const refreshPortfolio = async () => {
        try {
          const res = await fetch("/api/portfolio", { cache: "no-store" });
          if (!res.ok) throw new Error("Failed to fetch portfolio");
          const data = await res.json();
          const portData = Array.isArray(data) ? data : fallbackPortfolio;
          setPortfolio(portData);
          localStorage.setItem("cah_portfolio", JSON.stringify(portData));
        } catch (err) {
          console.error("Failed to fetch portfolio, using fallback:", err);
          if (portfolio.length === 0) setPortfolio(fallbackPortfolio);
        }
      };

      const fetchPortfolioPromise = adminCan("portfolio") ? refreshPortfolio() : Promise.resolve();

      const refreshServicesPromise = adminCan("services") ? (async () => {
        try {
          const res = await fetch("/api/services", { cache: "no-store" });
          if (!res.ok) throw new Error("Failed to fetch services");
          const data = await res.json();
          if (Array.isArray(data.services)) {
            setServices(data.services);
            localStorage.setItem("cah_services", JSON.stringify(data.services));
          }
        } catch (err) {
          console.error("Failed to fetch services, using fallback:", err);
          if (services.length === 0) setServices(servicesData);
        } finally {
          setServicesLoaded(true);
        }
      })() : Promise.resolve();


      Promise.all([
        fetchLeads,
        fetchBlogs,
        fetchProjects,
        fetchDrawings,
        fetchNotifications,
        fetchChats,
        fetchPortfolioPromise,
        refreshServicesPromise,
      ]).finally(() => {
        setIsLoaded(true);
      });

      const ticketInterval = adminCan("tickets") ? setInterval(() => {
        fetch("/api/tickets", { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (Array.isArray(data)) {
              const ids = new Set(data.map((t: any) => String(t.id)));
              if (seenTicketIds.current) {
                const isNew = [...ids].some((id) => !seenTicketIds.current!.has(id));
                if (isNew) {
                  playAdminChime();
                  setAdminAlertTabs((prev) => new Set(prev).add("tickets"));
                }
              }
              seenTicketIds.current = ids;
              setTickets(data);
              if (typeof window !== "undefined") {
                localStorage.setItem("cah_tickets", JSON.stringify(data));
              }
            }
          })
          .catch(() => {});
      }, 5000) : null;

      // Notifications don't have their own live channel, so poll them the
      // same way tickets are polled — this is what lets the client bell
      // and the admin panel pick up a brand-new notification (and chime)
      // without the user having to refresh the page.
      const notificationInterval = adminCan("notifications") ? setInterval(() => {
        fetch(notificationsUrl, { cache: "no-store" })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (!Array.isArray(data)) return;
            setNotifications(data);
            if (typeof window !== "undefined") {
              localStorage.setItem("cah_notifications", JSON.stringify(data));
            }
            registerIncomingNotifications(data, !!adminContext);
          })
          .catch(() => {});
      }, 15000) : null;

      return () => {
        if (ticketInterval) clearInterval(ticketInterval);
        if (notificationInterval) clearInterval(notificationInterval);
      };
    }
  }, [adminContextReady, adminContext, refreshToken]);

  // Invoices contain billing data, so they are never restored from a
  // cross-session local cache. Load them only through the authenticated
  // Firebase session (or the admin cookie for the admin panel).
  useEffect(() => {
    if (!adminContextReady) return;
    if (adminContext && !adminCan("invoices")) { setInvoices([]); return; }
    let cancelled = false;

    const loadInvoices = async (firebaseUser: any) => {
      try {
        const headers: Record<string, string> = {};
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          if (token) headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch("/api/invoices", { cache: "no-store", headers });
        if (!res.ok) {
          if (!cancelled) {
            setInvoices([]);
            localStorage.removeItem("cah_invoices");
          }
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          const invoicesData = Array.isArray(data) ? data : [];
          setInvoices(invoicesData);
          localStorage.removeItem("cah_invoices");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to securely load invoices:", error);
          setInvoices([]);
          localStorage.removeItem("cah_invoices");
        }
      }
    };

    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      void loadInvoices(firebaseUser);
    });

    if (auth.currentUser) void loadInvoices(auth.currentUser);
    else void loadInvoices(null);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [adminContextReady, adminContext]);

  const refreshServices = async () => {
    try {
      const res = await fetch("/api/services", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch services");
      const data = await res.json();
      if (Array.isArray(data.services)) {
        setServices(data.services);
        localStorage.setItem("cah_services", JSON.stringify(data.services));
      }
    } catch (err) {
      console.error("Error refreshing services:", err);
    } finally {
      setServicesLoaded(true);
    }
  };

  // Methods
  const addLead = async (newLeadData: Omit<Lead, "id" | "date" | "status">) => {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLeadData)
      });
      if (!res.ok) throw new Error("Failed to persist lead in DB");
      const createdLead: Lead = await res.json();
      setLeads((prev) => [createdLead, ...prev]);
      await addNotification(
        "New Lead Received",
        `${createdLead.name} requested a quote for ${createdLead.service}.`,
        "success",
        true
      );
    } catch (err) {
      console.error("Error adding lead:", err);
      // Fallback local memory lead insertion
      const fallbackLead: Lead = {
        ...newLeadData,
        id: generateLeadId(),
        date: getTodayDateString(),
        status: "new"
      };
      setLeads((prev) => [fallbackLead, ...prev]);
      await addNotification(
        "New Lead Received (Local Mode)",
        `${fallbackLead.name} requested a quote for ${fallbackLead.service}.`,
        "success",
        true
      );
    }
  };

  const updateLeadStatus = async (id: string, status: Lead["status"]) => {
    try {
      const targetLead = leads.find(l => l.id === id);
      if (!targetLead) return;

      const res = await fetch(`/api/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...targetLead, status })
      });
      if (!res.ok) throw new Error("Failed to update lead status in DB");
      const updatedLead: Lead = await res.json();
      setLeads((prev) => prev.map(l => l.id === id ? updatedLead : l));
    } catch (err) {
      console.error("Error updating lead status:", err);
      setLeads((prev) => prev.map(l => l.id === id ? { ...l, status } : l));
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete lead in DB");
      setLeads((prev) => {
        const next = prev.filter(l => l.id !== id);
        localStorage.setItem("cah_leads", JSON.stringify(next));
        return next;
      });
    } catch (err) {
      console.error("Error deleting lead:", err);
      setLeads((prev) => {
        const next = prev.filter(l => l.id !== id);
        localStorage.setItem("cah_leads", JSON.stringify(next));
        return next;
      });
    }
  };

  const addProject = async (projData: Omit<Project, "id" | "dateStarted" | "progress" | "status">) => {
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projData)
      });
      if (!res.ok) throw new Error("Failed to create project in DB");
      const createdProj: Project = await res.json();
      setProjects((prev) => [createdProj, ...prev]);

      await addNotification(
        "Project Created",
        `New project "${createdProj.title}" initialized under review.`,
        "info",
        false,
        createdProj.clientEmail,
        createdProj.clientName
      );
      await addNotification(
        "New Project Initialized",
        `Project "${createdProj.title}" created by client ${createdProj.clientName}.`,
        "info",
        true
      );
    } catch (err) {
      console.error("Error adding project:", err);
      // Fallback
      const fallbackProj: Project = {
        ...projData,
        id: generateProjId(),
        dateStarted: getTodayDateString(),
        status: "Uploaded",
        progress: 10,
      };
      setProjects((prev) => [fallbackProj, ...prev]);
    }
  };

  const updateProjectStatus = async (id: string, status: Project["status"]) => {
    let progress = 10;
    if (status === "Under Review") progress = 25;
    if (status === "Designing") progress = 60;
    if (status === "Completed") progress = 100;

    try {
      const targetProj = projects.find((p) => p.id === id);
      if (!targetProj) return;

      const completionPatch = status === "Completed" && !(targetProj as any).completedAt
        ? { completedAt: new Date().toISOString() }
        : {};
      const res = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...targetProj, status, progress, ...completionPatch })
      });
      if (!res.ok) throw new Error("Failed to update project status in DB");
      const updatedProj: Project = await res.json();

      setProjects((prev) => prev.map((p) => p.id === id ? updatedProj : p));

      await addNotification(
        "Project Status Updated",
        `Your project "${updatedProj.title}" status is now "${status}".`,
        status === "Completed" ? "success" : "info",
        false,
        updatedProj.clientEmail,
        updatedProj.clientName
      );
    } catch (err) {
      console.error("Error updating project status:", err);
      setProjects((prev) =>
        prev.map((proj) =>
          proj.id === id ? { ...proj, status, progress } : proj
        )
      );
    }
  };

  const uploadDrawing = async (drawMeta: Omit<DrawingFile, "id" | "uploadDate" | "status">) => {
    try {
      let currentClient = "Guest Client";
      let currentEmail = "";
      if (typeof window !== "undefined") {
        const userJson = localStorage.getItem("cah_user");
        if (userJson) {
          const parsedUser = JSON.parse(userJson);
          currentClient = parsedUser.name || "Guest Client";
          currentEmail = (parsedUser.email || "").toLowerCase();
        }
      }

      // Find an existing project for this exact client (by email first, name as fallback) + service
      const matchProj = projects.find((p) => {
        const sameService = p.service === drawMeta.serviceType;
        const sameClient = currentEmail
          ? (p.clientEmail || "").toLowerCase() === currentEmail
          : p.clientName.toLowerCase() === currentClient.toLowerCase();
        return sameService && sameClient;
      });

      const res = await fetch("/api/drawings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...drawMeta,
          clientName: currentClient,
          clientEmail: currentEmail || undefined,
          projectId: matchProj?.id,
        })
      });
      if (!res.ok) throw new Error("Failed to save drawing in DB");
      const createdDrawing: DrawingFile = await res.json();
      setDrawings((prev) => [createdDrawing, ...prev]);

      if (matchProj) {
        const updatedDrawings = [...matchProj.drawings, createdDrawing.name];
        const projRes = await fetch(`/api/projects/${matchProj.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...matchProj, drawings: updatedDrawings })
        });
        if (projRes.ok) {
          const updatedProj: Project = await projRes.json();
          setProjects((prev) => prev.map((p) => p.id === matchProj.id ? updatedProj : p));
        }
      } else {
        // Auto create a dedicated project for this client's design request, tagged with their email
        await addProject({
          title: `Design Request: ${createdDrawing.serviceType}`,
          clientName: currentClient,
          clientEmail: currentEmail || undefined,
          service: createdDrawing.serviceType,
          areaSqFt: 2000,
          location: "Mumbai, MH",
          drawings: [createdDrawing.name],
        });
      }

      await addNotification(
        "Drawing Uploaded",
        `File "${createdDrawing.name}" is being analyzed by our CAD/BIM engine.`,
        "info",
        false,
        createdDrawing.clientEmail,
        createdDrawing.clientName
      );

      await addNotification(
        "New File Uploaded",
        `Client uploaded drawing: ${createdDrawing.name} for ${createdDrawing.serviceType}.`,
        "info",
        true
      );

      // Simulate AI analysis complete after 5 seconds
      setTimeout(async () => {
        try {
          const readyRes = await fetch(`/api/drawings/${createdDrawing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...createdDrawing, status: "Ready" })
          });
          if (readyRes.ok) {
            const readyDrawing: DrawingFile = await readyRes.json();
            setDrawings((prev) => prev.map((d) => d.id === createdDrawing.id ? readyDrawing : d));
          }
        } catch (err) {
          console.error("Error updating drawing status to Ready:", err);
          setDrawings((prev) =>
            prev.map((d) => (d.id === createdDrawing.id ? { ...d, status: "Ready" } : d))
          );
        }
      }, 5000);
    } catch (err) {
      console.error("Error uploading drawing:", err);
    }
  };

  const updateDrawingStatus = async (id: string, status: DrawingFile["status"]) => {
    try {
      const targetDraw = drawings.find((d) => d.id === id);
      if (!targetDraw) return;

      const res = await fetch(`/api/drawings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...targetDraw, status })
      });
      if (!res.ok) throw new Error("Failed to update drawing status in DB");
      const updatedDraw: DrawingFile = await res.json();
      setDrawings((prev) => prev.map((d) => d.id === id ? updatedDraw : d));

      await addNotification(
        "Drawing Status Updated",
        `File "${updatedDraw.name}" status has been updated to "${status}".`,
        "info",
        false,
        updatedDraw.clientEmail,
        updatedDraw.clientName
      );
    } catch (err) {
      console.error("Error updating drawing status:", err);
      setDrawings((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status } : d))
      );
    }
  };

  const deleteDrawing = async (id: string) => {
    try {
      const res = await fetch(`/api/drawings/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete drawing in DB");
      setDrawings((prev) => {
        const next = prev.filter((d) => d.id !== id);
        localStorage.setItem("cah_drawings", JSON.stringify(next));
        return next;
      });
    } catch (err) {
      console.error("Error deleting drawing:", err);
      setDrawings((prev) => {
        const next = prev.filter((d) => d.id !== id);
        localStorage.setItem("cah_drawings", JSON.stringify(next));
        return next;
      });
    }
  };

  const payInvoice = async (id: string) => {
    try {
      const targetInv = invoices.find((i) => i.id === id);
      if (!targetInv) return;

      const invoiceHeaders: Record<string, string> = { "Content-Type": "application/json" };
      try {
        const token = await auth.currentUser?.getIdToken();
        if (token) invoiceHeaders.Authorization = `Bearer ${token}`;
      } catch { /* admin cookie sessions do not need a Firebase token */ }

      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: invoiceHeaders,
        body: JSON.stringify({ ...targetInv, status: "Paid" })
      });
      if (!res.ok) throw new Error("Failed to pay invoice in DB");
      const paidInv: Invoice = await res.json();
      setInvoices((prev) => prev.map((inv) => inv.id === id ? paidInv : inv));

      const targetProj = projects.find((p) => p.id === paidInv.projectId);
      if (targetProj) {
        const projRes = await fetch(`/api/projects/${targetProj.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...targetProj, invoicePaid: true })
        });
        if (projRes.ok) {
          const updatedProj: Project = await projRes.json();
          setProjects((prev) => prev.map((p) => p.id === targetProj.id ? updatedProj : p));
        }
      }

      await addNotification(
        "Payment Confirmed",
        `Receipt generated for Invoice #${paidInv.id.toUpperCase()}. Amount: ₹${paidInv.amount.toLocaleString("en-IN")}.`,
        "success",
        false,
        targetProj?.clientEmail,
        targetProj?.clientName
      );

      await addNotification(
        "Payment Received",
        `Client paid ₹${paidInv.amount.toLocaleString("en-IN")} for ${paidInv.projectTitle}.`,
        "success",
        true
      );
    } catch (err) {
      console.error("Error paying invoice:", err);
    }
  };

  const generateInvoice = async (projectId: string, amount: number, paymentLink?: string) => {
    try {
      const proj = projects.find((p) => p.id === projectId);
      if (!proj) return null;

      const newInvData = {
        projectId,
        projectTitle: proj.title,
        amount,
        dueDate: getFutureDateString(10),
        ...(paymentLink ? { paymentLink } : {}),
      };

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInvData)
      });
      if (!res.ok) throw new Error("Failed to create invoice in DB");
      const createdInv: Invoice = await res.json();
      setInvoices((prev) => [createdInv, ...prev]);

      const projRes = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...proj, quoteAmount: amount, invoicePaid: false })
      });
      if (projRes.ok) {
        const updatedProj: Project = await projRes.json();
        setProjects((prev) => prev.map((p) => p.id === projectId ? updatedProj : p));
      }

      await addNotification(
        "Invoice Generated",
        `A new quotation and invoice of ₹${amount.toLocaleString("en-IN")} is ready for "${proj.title}".`,
        "warning",
        false,
        proj.clientEmail,
        proj.clientName
      );

      return createdInv;
    } catch (err) {
      console.error("Error generating invoice:", err);
      return null;
    }
  };

  const updateInvoicePaymentLink = async (id: string, paymentLink: string) => {
    try {
      const targetInv = invoices.find((i) => i.id === id);
      if (!targetInv) return;

      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...targetInv, paymentLink })
      });
      if (!res.ok) throw new Error("Failed to update payment link");
      const updatedInv: Invoice = await res.json();
      setInvoices((prev) => prev.map((inv) => inv.id === id ? updatedInv : inv));
    } catch (err) {
      console.error("Error updating invoice payment link:", err);
    }
  };

  const addNotification = async (
    title: string,
    message: string,
    type: Notification["type"],
    isAdmin: boolean,
    userEmail?: string,
    recipientName?: string
  ) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, type, isAdmin, userEmail, recipientName })
      });
      if (!res.ok) throw new Error("Failed to add notification in DB");
      const createdNotif: Notification = await res.json();
      setNotifications((prev) => [createdNotif, ...prev]);
    } catch (err) {
      console.error("Error adding notification:", err);
      const fallbackNotif: Notification = {
        id: generateNotifId(),
        title,
        message,
        type,
        timestamp: getNotificationTimestamp(),
        read: false,
        isAdmin,
        userEmail,
        recipientName,
      };
      setNotifications((prev) => [fallbackNotif, ...prev]);
    }
  };

  const deleteNotification = async (id: string) => {
    // Optimistic update so the admin UI feels instant
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      const res = await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete notification in DB");
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const markNotificationsAsRead = async (isAdmin: boolean, userEmail?: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin, userEmail })
      });
      if (!res.ok) throw new Error("Failed to mark notifications as read in DB");
      setNotifications((prev) =>
        prev.map((n) =>
          n.isAdmin === isAdmin && (isAdmin || !userEmail || n.userEmail === userEmail.toLowerCase() || n.userEmail === "all")
            ? { ...n, read: true }
            : n
        )
      );
    } catch (err) {
      console.error("Error marking notifications as read:", err);
      setNotifications((prev) =>
        prev.map((n) =>
          n.isAdmin === isAdmin && (isAdmin || !userEmail || n.userEmail === userEmail.toLowerCase() || n.userEmail === "all")
            ? { ...n, read: true }
            : n
        )
      );
    }
  };

  const sendChatMessage = async (text: string, sender: ChatMessage["sender"]) => {
    try {
      const res = await fetch("/api/support-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sender })
      });
      if (!res.ok) throw new Error("Failed to save chat message in DB");
      const createdMsg: ChatMessage = await res.json();
      setChatMessages((prev) => [...prev, createdMsg]);

      if (sender === "client") {
        await addNotification("New Support Message", "Client sent a support message.", "info", true);

        setTimeout(async () => {
          const replyText =
            text.toLowerCase().includes("quote") || text.toLowerCase().includes("cost")
              ? "We offer automated estimations using our Construction Cost Calculator on the homepage. If you upload your floor plan PDF, our engineering experts will audit and return a detailed custom quotation within 24 hours."
              : text.toLowerCase().includes("drawing") || text.toLowerCase().includes("upload")
              ? "You can upload PDF, DWG, or DXF files directly in the 'Upload Drawings' tab on your dashboard. Once uploaded, they go through our automated analyzer, followed by expert audit review."
              : "Thank you for reaching out to Civil At Hand. One of our structural engineers will review your request and get back to you shortly.";

          try {
            const replyRes = await fetch("/api/support-messages", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: replyText, sender: "admin" })
            });
            if (replyRes.ok) {
              const replyMsg: ChatMessage = await replyRes.json();
              setChatMessages((prev) => [...prev, replyMsg]);
              await addNotification("New Message Received", "Support engineer responded to your message.", "info", false);
            }
          } catch (replyErr) {
            console.error("Error sending assistant reply:", replyErr);
            const fallbackReply: ChatMessage = {
              id: generateMsgId(),
              text: replyText,
              sender: "admin",
              timestamp: getLocaleTimeString(),
            };
            setChatMessages((prev) => [...prev, fallbackReply]);
            await addNotification("New Message Received", "Support engineer responded to your message.", "info", false);
          }
        }, 1500);
      }
    } catch (err) {
      console.error("Error sending chat message:", err);
    }
  };

  const refreshTickets = async () => {
    try {
      const res = await fetch("/api/tickets", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setTickets(data);
          if (typeof window !== "undefined") {
            localStorage.setItem("cah_tickets", JSON.stringify(data));
          }
        }
      }
    } catch (err) {
      console.error("Failed to refresh tickets:", err);
    }
  };

  const addTicket = async (ticketData: {
    subject: string;
    category: SupportTicket["category"];
    priority: SupportTicket["priority"];
    description: string;
    clientName?: string;
    clientEmail?: string;
    attachments?: TicketAttachment[];
  }) => {
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketData),
      });

      let created: SupportTicket;
      if (res.ok) {
        created = await res.json();
      } else {
        const timeStr = new Date().toISOString().replace("T", " ").substring(0, 16);
        const randNum = Math.floor(1000 + Math.random() * 9000);
        created = {
          id: `tick-${Date.now()}`,
          ticketNumber: `TICK-${randNum}`,
          subject: ticketData.subject,
          category: ticketData.category,
          priority: ticketData.priority,
          status: "Open",
          clientName: ticketData.clientName || "Client",
          clientEmail: ticketData.clientEmail || "client@civilathan.in",
          description: ticketData.description,
          createdAt: timeStr,
          updatedAt: timeStr,
          messages: [
            {
              id: `msg-${Date.now()}`,
              sender: "client",
              senderName: ticketData.clientName || "Client",
              text: ticketData.description,
              timestamp: timeStr,
              ...(ticketData.attachments && ticketData.attachments.length ? { attachments: ticketData.attachments } : {}),
            },
          ],
        };
      }

      setTickets((prev) => {
        const nextTickets = [created, ...prev];
        if (typeof window !== "undefined") {
          localStorage.setItem("cah_tickets", JSON.stringify(nextTickets));
        }
        return nextTickets;
      });
      await addNotification("Ticket Raised", `New support ticket ${created.ticketNumber} raised: "${created.subject}"`, "info", true);
    } catch (err) {
      console.error("Error creating ticket:", err);
    }
  };

  const addTicketReply = async (
    ticketId: string,
    text: string,
    sender: "client" | "admin" | "system",
    senderName?: string,
    attachments?: TicketAttachment[]
  ) => {
    try {
      await fetch(`/api/tickets/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sender, senderName, attachments }),
      });

      const timeStr = new Date().toISOString().replace("T", " ").substring(0, 16);
      const newMsg: TicketMessage = {
        id: `msg-${Date.now()}`,
        sender,
        senderName: senderName || (sender === "client" ? "Client" : "Support Engineer"),
        text,
        timestamp: timeStr,
        ...(attachments && attachments.length ? { attachments } : {}),
      };

      setTickets((prev) => {
        const nextTickets = prev.map((t) => {
          if (t.id !== ticketId && t.ticketNumber !== ticketId) return t;
          const nextStatus = sender === "admin" ? "In Progress" : t.status === "Closed" ? "Open" : t.status;
          return {
            ...t,
            status: nextStatus,
            updatedAt: timeStr,
            messages: [...(t.messages || []), newMsg],
          };
        });
        if (typeof window !== "undefined") {
          localStorage.setItem("cah_tickets", JSON.stringify(nextTickets));
        }
        return nextTickets;
      });

      if (sender === "client") {
        await addNotification("Ticket Update", `Client replied on ticket`, "info", true);
      } else {
        const relatedTicket = tickets.find((t) => t.id === ticketId || t.ticketNumber === ticketId);
        await addNotification(
          "Ticket Reply",
          `Support engineer responded to your ticket`,
          "success",
          false,
          relatedTicket?.clientEmail,
          relatedTicket?.clientName
        );
      }
    } catch (err) {
      console.error("Error replying to ticket:", err);
    }
  };

  const updateTicketStatus = async (
    ticketId: string,
    status: SupportTicket["status"],
    priority?: SupportTicket["priority"]
  ) => {
    try {
      await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, priority }),
      });

      const timeStr = new Date().toISOString().replace("T", " ").substring(0, 16);
      setTickets((prev) => {
        const nextTickets = prev.map((t) => {
          if (t.id !== ticketId && t.ticketNumber !== ticketId) return t;
          return {
            ...t,
            status,
            priority: priority || t.priority,
            updatedAt: timeStr,
          };
        });
        if (typeof window !== "undefined") {
          localStorage.setItem("cah_tickets", JSON.stringify(nextTickets));
        }
        return nextTickets;
      });
    } catch (err) {
      console.error("Error updating ticket status:", err);
    }
  };

  const deleteTicket = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to delete ticket");
      }
      setTickets((prev) => {
        const nextTickets = prev.filter((t) => t.id !== ticketId && t.ticketNumber !== ticketId);
        if (typeof window !== "undefined") {
          localStorage.setItem("cah_tickets", JSON.stringify(nextTickets));
        }
        return nextTickets;
      });
    } catch (err) {
      console.error("Error deleting ticket:", err);
    }
  };

  const addBlog = async (blogData: Omit<BlogPost, "id" | "date">) => {
    try {
      const res = await fetch("/api/blogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(blogData),
      });
      if (!res.ok) throw new Error("Failed to add blog post");
      const newBlog = await res.json();
      setBlogs((prev) => {
        const nextBlogs = [newBlog, ...prev];
        localStorage.setItem("cah_blogs", JSON.stringify(nextBlogs));
        return nextBlogs;
      });
      await addNotification(
        "New Blog Post Created",
        `Blog post "${newBlog.title}" is now available.`,
        "success",
        true
      );
    } catch (error) {
      console.error("Error adding blog post:", error);
    }
  };

  const updateBlog = async (id: string, blogData: Partial<BlogPost>) => {
    try {
      const res = await fetch(`/api/blogs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(blogData),
      });
      if (!res.ok) throw new Error("Failed to update blog post");
      const updatedBlog = await res.json();
      setBlogs((prev) => {
        const nextBlogs = prev.map((b) => (b.id === id ? updatedBlog : b));
        localStorage.setItem("cah_blogs", JSON.stringify(nextBlogs));
        return nextBlogs;
      });
    } catch (error) {
      console.error("Error updating blog post:", error);
    }
  };

  const deleteBlog = async (id: string) => {
    try {
      const res = await fetch(`/api/blogs/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete blog post");
      setBlogs((prev) => {
        const nextBlogs = prev.filter((b) => b.id !== id);
        localStorage.setItem("cah_blogs", JSON.stringify(nextBlogs));
        return nextBlogs;
      });
    } catch (error) {
      console.error("Error deleting blog post:", error);
    }
  };

  const addPortfolioItem = async (itemData: Omit<PortfolioItem, "id">): Promise<boolean> => {
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData)
      });
      if (!res.ok) throw new Error("Failed to add portfolio item");
      const newItem = await res.json();
      setPortfolio((prev) => [newItem, ...prev]);
      await addNotification(
        "New Portfolio Masterpiece Added",
        `Project "${newItem.title}" has been published to portfolio.`,
        "success",
        true
      );
      return true;
    } catch (error) {
      console.error("Error adding portfolio item:", error);
      return false;
    }
  };

  const updatePortfolioItem = async (id: string, itemData: Partial<PortfolioItem>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/portfolio/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData)
      });
      if (!res.ok) throw new Error("Failed to update portfolio item");
      const updatedItem = await res.json();
      setPortfolio((prev) => prev.map((item) => item.id === id ? updatedItem : item));
      return true;
    } catch (error) {
      console.error("Error updating portfolio item:", error);
      return false;
    }
  };

  const deletePortfolioItem = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/portfolio/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete portfolio item");
      setPortfolio((prev) => {
        const nextPort = prev.filter((item) => item.id !== id);
        localStorage.setItem("cah_portfolio", JSON.stringify(nextPort));
        return nextPort;
      });
      return true;
    } catch (error) {
      console.error("Error deleting portfolio item:", error);
      return false;
    }
  };

  const refreshPortfolio = async () => {
    try {
      const res = await fetch("/api/portfolio", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch portfolio");
      const data = await res.json();
      const portData = Array.isArray(data) ? data : fallbackPortfolio;
      setPortfolio(portData);
      localStorage.setItem("cah_portfolio", JSON.stringify(portData));
    } catch (err) {
      console.error("Failed to fetch portfolio, using fallback:", err);
      if (portfolio.length === 0) setPortfolio(fallbackPortfolio);
    }
  };
  return (
    <ProjectContext.Provider
      value={{
        leads,
        projects,
        drawings,
        invoices,
        notifications,
        chatMessages,
        tickets,
        blogs,
        portfolio,
        addLead,
        addProject,
        updateProjectStatus,
        uploadDrawing,
        updateDrawingStatus,
        deleteDrawing,
        payInvoice,
        generateInvoice,
        updateInvoicePaymentLink,
        addNotification,
        markNotificationsAsRead,
        deleteNotification,
        sendChatMessage,
        addTicket,
        addTicketReply,
        updateTicketStatus,
        deleteTicket,
        refreshTickets,
        addBlog,
        updateBlog,
        deleteBlog,
        addPortfolioItem,
        updatePortfolioItem,
        deletePortfolioItem,
        refreshPortfolio,
        updateLeadStatus,
        deleteLead,
        services,
        servicesLoaded,
        refreshServices,
        isLoaded,
        blogsLoaded,
        adminAlertTabs,
        clearAdminAlertTab,
        refreshAllData,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    return {
      leads: [],
      projects: [],
      drawings: [],
      invoices: [],
      notifications: [],
      chatMessages: [],
      tickets: [],
      blogs: [],
      portfolio: [],
      services: [],
      servicesLoaded: false,
      refreshServices: async () => {},
      addLead: async () => {},
      addProject: async () => {},
      updateProjectStatus: async () => {},
      uploadDrawing: async () => {},
      updateDrawingStatus: async () => {},
      deleteDrawing: async () => {},
      payInvoice: async () => {},
      generateInvoice: async () => null,
      updateInvoicePaymentLink: async () => {},
      addNotification: async () => {},
      markNotificationsAsRead: async () => {},
      sendChatMessage: async () => {},
      addTicket: async () => {},
      addTicketReply: async () => {},
      updateTicketStatus: async () => {},
      deleteTicket: async () => {},
      refreshTickets: async () => {},
      addBlog: async () => {},
      updateBlog: async () => {},
      deleteBlog: async () => {},
      addPortfolioItem: async () => {},
      updatePortfolioItem: async () => {},
      deletePortfolioItem: async () => {},
      refreshPortfolio: async () => {},
      updateLeadStatus: async () => {},
      deleteLead: async () => {},
      isLoaded: false,
      blogsLoaded: false,
    } as unknown as ProjectContextType;
  }
  return context;
};
