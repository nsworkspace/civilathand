"use client";

/**
 * AnalyticsDashboard — Enhanced Admin Analytics Panel
 * NS Construction · Ultimate Business Intelligence Module
 *
 * Features:
 * • Real-time KPI cards (Revenue, Clients, Projects, Leads, Blog, Traffic, Conversions)
 * • Animated SVG Revenue trend chart (6-month)
 * • Lead status funnel with percentage breakdown
 * • Project status ring/donut chart (pure SVG)
 * • Invoice health gauge (Paid vs Pending vs Overdue)
 * • Top content performance table (blogs + portfolio)
 * • Traffic sources breakdown
 * • Recent activity live feed with type icons
 * • Most visited + most shared pages
 * • Quick business health score card
 * • Download full Analytics PDF Report (jsPDF)
 */

import React, { useState, useEffect, useRef } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  FolderKanban,
  Receipt,
  Eye,
  Share2,
  MousePointerClick,
  Activity,
  Clock,
  Download,
  RefreshCw,
  Loader2,
  BookOpen,
  Heart,
  Target,
  Zap,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Star,
  Globe,
  MessageSquare,
  FileText,
  Award,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EngagementStats {
  totalPageVisits: number;
  totalClicks: number;
  totalContentClicks: number;
  totalShares: number;
  mostViewedPages: { page: string; label: string; visits: number }[];
  mostSharedPages: { page: string; label: string; shares: number }[];
  recentActivity: { type: string; page: string; label: string | null; createdAt: string }[];
  monthlyRevenueTrend: { month: string; revenue: number }[];
  totalBlogViews?: number;
  totalBlogShares?: number;
  totalRevenue?: number;
  totalProjects?: number;
  totalClients?: number;
}

interface AnalyticsDashboardProps {
  // From context / parent
  leads: any[];
  projects: any[];
  invoices: any[];
  blogs: any[];
  portfolio: any[];
  tickets: any[];
  clientBuckets: any[];
  mentorshipApplications: any[];
  careerApps: any[];
  totalRevenue: number;
  pendingRevenue: number;
}

// ─── Animated number counter ──────────────────────────────────────────────────

function AnimatedNumber({ value, prefix = "", suffix = "", duration = 1200 }: {
  value: number; prefix?: string; suffix?: string; duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const start = useRef(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const from = start.current;
    const to = value;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
      else start.current = to;
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value, duration]);

  const formatted = display >= 100000
    ? `${(display / 100000).toFixed(1)}L`
    : display >= 1000
    ? display.toLocaleString("en-IN")
    : display.toString();

  return <span>{prefix}{formatted}{suffix}</span>;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  title, value, subtext, icon: Icon, color, trend, trendValue, delay = 0,
}: {
  title: string; value: React.ReactNode; subtext: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string; trend?: "up" | "down" | "neutral"; trendValue?: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-orange-200 transition-all duration-300"
    >
      {/* Background glow icon */}
      <Icon className="h-20 w-20 absolute -right-4 -bottom-4 opacity-[0.06] text-slate-900" />
      {/* Color accent top bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${color} rounded-t-2xl`} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className={`p-2.5 rounded-xl ${color.replace("bg-", "bg-").replace("-500", "-100")} ${color.replace("bg-", "text-")}`}>
            <Icon className="h-5 w-5" />
          </span>
          {trend && trendValue && (
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
              trend === "up" ? "bg-emerald-50 text-emerald-600" :
              trend === "down" ? "bg-red-50 text-red-600" :
              "bg-slate-50 text-slate-500"
            }`}>
              {trend === "up" ? <TrendingUp className="h-3 w-3" /> : trend === "down" ? <TrendingDown className="h-3 w-3" /> : null}
              {trendValue}
            </span>
          )}
        </div>
        <p className="text-[10px] uppercase font-extrabold text-slate-400 tracking-[0.15em] mb-1">{title}</p>
        <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</div>
        <p className="text-[11px] text-slate-500 mt-1.5 font-medium">{subtext}</p>
      </div>
    </motion.div>
  );
}

// ─── Revenue SVG Chart ────────────────────────────────────────────────────────

function RevenueChart({ trend }: { trend: { month: string; revenue: number }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const W = 560, H = 180, padX = 10, padY = 20;
  const maxVal = Math.max(1, ...trend.map(t => t.revenue));
  const step = trend.length > 1 ? (W - padX * 2) / (trend.length - 1) : W;
  const pts = trend.map((t, i) => ({
    x: padX + i * step,
    y: padY + (1 - t.revenue / maxVal) * (H - padY * 2),
    ...t,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = pts.length
    ? `${linePath} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`
    : "";

  if (trend.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-400 font-semibold">
        No paid invoice data in the last 6 months yet.
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ paddingBottom: "36%" }}>
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ea580c" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Gridlines */}
        {[0.25, 0.5, 0.75].map(frac => (
          <line key={frac} x1={padX} y1={padY + frac * (H - padY * 2)} x2={W - padX} y2={padY + frac * (H - padY * 2)}
            stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
        ))}
        {/* Y labels */}
        {[0, 0.5, 1].map(frac => (
          <text key={frac} x={padX + 2} y={padY + frac * (H - padY * 2) - 3}
            fontSize="9" fill="#94a3b8" fontFamily="sans-serif">
            ₹{((maxVal * (1 - frac)) / 100000).toFixed(1)}L
          </text>
        ))}
        {/* Area fill */}
        <motion.path
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
          d={areaPath} fill="url(#revGrad)"
        />
        {/* Line */}
        <motion.path
          initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
          d={linePath} fill="none" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        />
        {/* Data points + hover */}
        {pts.map((pt, i) => (
          <g key={i} onMouseEnter={() => setHovered(i)} style={{ cursor: "pointer" }}>
            <circle cx={pt.x} cy={pt.y} r="10" fill="transparent" />
            <motion.circle
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 * i + 0.8 }}
              cx={pt.x} cy={pt.y} r={hovered === i ? 6 : 4}
              fill={hovered === i ? "#ea580c" : "#0f172a"}
              stroke="#ea580c" strokeWidth="2"
            />
            {/* Tooltip */}
            {hovered === i && (
              <>
                <rect x={pt.x - 36} y={pt.y - 26} width={72} height={20} rx="4" fill="#0f172a" />
                <text x={pt.x} y={pt.y - 12} textAnchor="middle" fontSize="9" fill="white" fontFamily="sans-serif" fontWeight="bold">
                  ₹{(pt.revenue / 100000).toFixed(2)}L
                </text>
              </>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── Mini donut chart ─────────────────────────────────────────────────────────

function DonutChart({ slices, size = 80 }: {
  slices: { value: number; color: string; label: string }[];
  size?: number;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) return <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-semibold">No data</div>;

  const r = 30, cx = 40, cy = 40, stroke = 14;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      {slices.filter(s => s.value > 0).map((s, i) => {
        const dash = (s.value / total) * circumference;
        const gap = circumference - dash;
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
            style={{ transition: "stroke-dasharray 0.5s ease" }}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
        offset += dash;
        return el;
      })}
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fill="#0f172a" fontWeight="bold" fontFamily="sans-serif">
        {total}
      </text>
    </svg>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, max, color = "bg-orange-500", label, suffix = "" }: {
  value: number; max: number; color?: string; label: string; suffix?: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[11px] font-semibold text-slate-700">
        <span>{label}</span>
        <span className="font-bold text-slate-900">{value.toLocaleString("en-IN")}{suffix}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </div>
  );
}

// ─── Business Health Score ────────────────────────────────────────────────────

function HealthScore({ score }: { score: number }) {
  const color = score >= 80 ? "#10b981" : score >= 55 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Excellent" : score >= 55 ? "Good" : "Needs Attention";
  const r = 36, cx = 44, cy = 44;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference * 0.75;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="10"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={circumference * 0.125}
          strokeLinecap="round" transform={`rotate(135 ${cx} ${cy})`} />
        <motion.circle
          cx={cx} cy={cy} r={r} fill="none" strokeWidth="10"
          stroke={color}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${dash} ${circumference}` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="16" fontWeight="bold" fill={color} fontFamily="sans-serif">
          {score}
        </text>
      </svg>
      <div className="text-center">
        <div className="text-xs font-extrabold" style={{ color }}>{label}</div>
        <div className="text-[10px] text-slate-400 font-medium">Business Health</div>
      </div>
    </div>
  );
}

// ─── Activity Feed Item ───────────────────────────────────────────────────────

const activityIconMap: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  visit: { icon: Eye, color: "bg-blue-100 text-blue-600" },
  click: { icon: MousePointerClick, color: "bg-violet-100 text-violet-600" },
  content_click: { icon: Activity, color: "bg-amber-100 text-amber-600" },
  share: { icon: Share2, color: "bg-indigo-100 text-indigo-600" },
};

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, badge }: {
  icon: React.ComponentType<{ className?: string }>; title: string; badge?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
      <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
        <Icon className="h-4 w-4 text-orange-500" />
        {title}
      </h4>
      {badge && <span className="text-[10px] bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full font-bold">{badge}</span>}
    </div>
  );
}

// ─── PDF Download ─────────────────────────────────────────────────────────────

async function downloadAnalyticsPDF(data: {
  totalRevenue: number;
  pendingRevenue: number;
  totalClients: number;
  totalProjects: number;
  totalLeads: number;
  convertedLeads: number;
  openTickets: number;
  totalBlogViews: number;
  totalBlogLikes: number;
  totalBlogShares: number;
  totalPortfolioViews: number;
  totalPageVisits: number;
  totalClicks: number;
  totalContentClicks: number;
  totalShares: number;
  monthlyRevenueTrend: { month: string; revenue: number }[];
  mostViewedPages: { page: string; label: string; visits: number }[];
  mostSharedPages: { page: string; label: string; shares: number }[];
  recentActivity: { type: string; page: string; label: string | null; createdAt: string }[];
  blogs: any[];
  portfolio: any[];
  projects: any[];
  leads: any[];
  invoices: any[];
  mentorshipApplications: any[];
  careerApps: any[];
  healthScore: number;
}) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const orange: [number, number, number] = [234, 88, 12];
  const dark: [number, number, number] = [15, 23, 42];
  const white: [number, number, number] = [255, 255, 255];
  const lightGray: [number, number, number] = [248, 250, 252];
  const medGray: [number, number, number] = [100, 116, 139];
  const emerald: [number, number, number] = [16, 185, 129];
  const red: [number, number, number] = [239, 68, 68];
  const blue: [number, number, number] = [59, 130, 246];
  const violet: [number, number, number] = [139, 92, 246];
  const amber: [number, number, number] = [245, 158, 11];

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  function header(y0: number, title: string, sub: string) {
    // Gradient top bar
    doc.setFillColor(...orange);
    doc.rect(0, 0, W, 10, "F");
    doc.setFillColor(...dark);
    doc.rect(0, 10, W, 36, "F");

    // Logo text
    doc.setFontSize(7); doc.setTextColor(...orange); doc.setFont("helvetica", "bold");
    doc.text("CIVIL AT HAND", 14, 20);

    // Title
    doc.setFontSize(15); doc.setTextColor(...white);
    doc.text(title, 14, 31);

    // Subtitle
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...medGray);
    doc.text(sub, 14, 41);

    // Date right
    const dateStr = `Generated: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`;
    doc.text(dateStr, W - 14, 41, { align: "right" });

    return 52;
  }

  function footer(pageNum: number, totalPages: number) {
    doc.setFillColor(...dark);
    doc.rect(0, H - 12, W, 12, "F");
    doc.setFontSize(7); doc.setTextColor(...orange); doc.setFont("helvetica", "bold");
    doc.text("CIVIL AT HAND — CONFIDENTIAL ANALYTICS REPORT", 14, H - 4.5);
    doc.setTextColor(...medGray); doc.setFont("helvetica", "normal");
    doc.text(`Page ${pageNum} of ${totalPages}`, W - 14, H - 4.5, { align: "right" });
  }

  function sectionTitle(y: number, label: string) {
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...orange);
    doc.text(label, 14, y);
    doc.setLineWidth(0.3); doc.setDrawColor(...orange);
    doc.line(14, y + 2, W - 14, y + 2);
    return y + 8;
  }

  function kpiBox(x: number, y: number, w: number, h: number, label: string, value: string, color: [number, number, number]) {
    doc.setFillColor(248, 250, 252); doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 2, 2, "FD");
    doc.setFillColor(...color); doc.rect(x, y, w, 1.5, "F");
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...medGray);
    doc.text(label.toUpperCase(), x + 3, y + 7);
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(...dark);
    doc.text(value, x + 3, y + 16);
  }

  // ── PAGE 1: Cover + Executive KPIs ──────────────────────────────────────────
  let y = header(0, "Business Analytics Report", "Executive Intelligence Dashboard · NS Construction");

  // Health score badge
  const hs = data.healthScore;
  const hsColor: [number, number, number] = hs >= 80 ? emerald : hs >= 55 ? amber : red;
  doc.setFillColor(...hsColor);
  doc.roundedRect(W - 55, 52, 42, 14, 3, 3, "F");
  doc.setFontSize(8); doc.setTextColor(...white); doc.setFont("helvetica", "bold");
  doc.text(`Business Health: ${hs}/100`, W - 55 + 21, 61, { align: "center" });

  // Intro
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...medGray);
  const intro = `This report covers all key business metrics for NS Construction including revenue performance, client activity, project pipeline, content analytics, and website engagement data compiled from live MongoDB data.`;
  const introLines = doc.splitTextToSize(intro, W - 28);
  doc.text(introLines, 14, y + 5);
  y += introLines.length * 5 + 12;

  // Primary KPI grid (2x4)
  y = sectionTitle(y, "EXECUTIVE SUMMARY — KEY PERFORMANCE INDICATORS");
  const kpiW = (W - 28 - 9) / 4;
  const kpiH = 22;
  const kpis = [
    { label: "Total Revenue Collected", value: `₹${(data.totalRevenue / 100000).toFixed(2)}L`, color: orange },
    { label: "Pending Revenue", value: `₹${(data.pendingRevenue / 100000).toFixed(2)}L`, color: amber },
    { label: "Total Clients", value: `${data.totalClients}`, color: blue },
    { label: "Total Projects", value: `${data.totalProjects}`, color: violet },
    { label: "Total Leads", value: `${data.totalLeads}`, color: emerald },
    { label: "Conversion Rate", value: `${data.totalLeads > 0 ? Math.round((data.convertedLeads / data.totalLeads) * 100) : 0}%`, color: orange },
    { label: "Open Support Tickets", value: `${data.openTickets}`, color: red },
    { label: "Mentorship Applications", value: `${data.mentorshipApplications.length}`, color: blue },
  ];
  kpis.forEach((k, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    kpiBox(14 + col * (kpiW + 3), y + row * (kpiH + 4), kpiW, kpiH, k.label, k.value, k.color as [number, number, number]);
  });
  y += 2 * (kpiH + 4) + 10;

  // Revenue trend table
  if (data.monthlyRevenueTrend.length > 0) {
    y = sectionTitle(y, "6-MONTH REVENUE TREND");
    autoTable(doc, {
      startY: y,
      margin: { left: 14, right: 14 },
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3, lineColor: [226, 232, 240] },
      headStyles: { fillColor: dark, textColor: white, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: lightGray },
      head: [["Month", "Revenue (₹)", "Revenue (Lakh)", "vs. Target"]],
      body: data.monthlyRevenueTrend.map(t => [
        t.month,
        `₹${t.revenue.toLocaleString("en-IN")}`,
        `₹${(t.revenue / 100000).toFixed(2)}L`,
        t.revenue > 0 ? "Active" : "No Data",
      ]),
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 30 },
        1: { cellWidth: 50 },
        2: { cellWidth: 40 },
        3: { cellWidth: 45, halign: "center" },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── PAGE 2: Sales & Pipeline ────────────────────────────────────────────────
  doc.addPage();
  y = header(0, "Sales Pipeline & Client Report", "Lead Performance, Project Status & Invoice Health");

  // Leads breakdown
  y = sectionTitle(y, "LEAD MANAGEMENT BREAKDOWN");
  const leadStatuses = ["new", "contacted", "converted", "closed"];
  const leadRows = leadStatuses.map(s => [
    s.toUpperCase(),
    data.leads.filter(l => l.status === s).length,
    data.totalLeads > 0 ? `${Math.round((data.leads.filter(l => l.status === s).length / data.totalLeads) * 100)}%` : "0%",
  ]);
  autoTable(doc, {
    startY: y, margin: { left: 14, right: 14 }, theme: "striped",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: dark, textColor: white, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: lightGray },
    head: [["Lead Status", "Count", "% of Total"]],
    body: leadRows,
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 50 }, 1: { cellWidth: 30, halign: "center" }, 2: { cellWidth: 35, halign: "center" } },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Projects breakdown
  y = sectionTitle(y, "PROJECT PIPELINE STATUS");
  const projStatuses = ["Planning", "In Progress", "On Hold", "Completed"];
  const projRows = projStatuses.map(s => [
    s, data.projects.filter(p => p.status === s).length,
  ]);
  autoTable(doc, {
    startY: y, margin: { left: 14, right: 14 }, theme: "striped",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: dark, textColor: white, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: lightGray },
    head: [["Project Status", "Count"]],
    body: projRows,
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 }, 1: { cellWidth: 30, halign: "center" } },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Invoice table
  y = sectionTitle(y, "INVOICE FINANCIAL SUMMARY");
  const paidInv = data.invoices.filter(i => i.status === "Paid");
  const unpaidInv = data.invoices.filter(i => i.status === "Unpaid");
  autoTable(doc, {
    startY: y, margin: { left: 14, right: 14 }, theme: "grid",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: dark, textColor: white, fontStyle: "bold", fontSize: 8 },
    head: [["Category", "Count", "Total Amount (₹)"]],
    body: [
      ["Paid Invoices", paidInv.length, `₹${paidInv.reduce((s, i) => s + (i.amount || 0), 0).toLocaleString("en-IN")}`],
      ["Unpaid / Pending", unpaidInv.length, `₹${unpaidInv.reduce((s, i) => s + (i.amount || 0), 0).toLocaleString("en-IN")}`],
      ["Total Invoices", data.invoices.length, `₹${data.invoices.reduce((s, i) => s + (i.amount || 0), 0).toLocaleString("en-IN")}`],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 70 }, 1: { cellWidth: 25, halign: "center" }, 2: { cellWidth: 55 } },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // ── PAGE 3: Content & Engagement ───────────────────────────────────────────
  doc.addPage();
  y = header(0, "Content & Website Engagement", "Blog Performance, Portfolio Views & Traffic Analytics");

  // Engagement KPIs
  y = sectionTitle(y, "SITE-WIDE ENGAGEMENT KPIs");
  const engKpiW = (W - 28 - 9) / 4;
  [
    { label: "Page Visits", value: data.totalPageVisits.toLocaleString("en-IN"), color: blue },
    { label: "UI Clicks", value: data.totalClicks.toLocaleString("en-IN"), color: violet },
    { label: "Content Clicks", value: data.totalContentClicks.toLocaleString("en-IN"), color: amber },
    { label: "Total Shares", value: data.totalShares.toLocaleString("en-IN"), color: emerald },
  ].forEach((k, i) => {
    kpiBox(14 + i * (engKpiW + 3), y, engKpiW, 22, k.label, k.value, k.color as [number, number, number]);
  });
  y += 26;

  // Blog performance table
  y = sectionTitle(y, "BLOG CONTENT PERFORMANCE (Top 10)");
  const topBlogs = [...data.blogs]
    .sort((a, b) => ((b as any).views || 0) - ((a as any).views || 0))
    .slice(0, 10);
  autoTable(doc, {
    startY: y, margin: { left: 14, right: 14 }, theme: "striped",
    styles: { fontSize: 8, cellPadding: 2.5, overflow: "linebreak" },
    headStyles: { fillColor: dark, textColor: white, fontStyle: "bold", fontSize: 7.5 },
    alternateRowStyles: { fillColor: lightGray },
    head: [["#", "Article Title", "Views", "Likes", "Shares"]],
    body: topBlogs.map((b: any, i) => [i + 1, b.title || "—", b.views || 0, b.likes || 0, b.shares || 0]),
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 95 },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 22, halign: "center" },
      4: { cellWidth: 22, halign: "center" },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Most viewed pages
  if (data.mostViewedPages.length > 0) {
    y = sectionTitle(y, "MOST VISITED PAGES");
    autoTable(doc, {
      startY: y, margin: { left: 14, right: 14 }, theme: "striped",
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: dark, textColor: white, fontStyle: "bold", fontSize: 7.5 },
      alternateRowStyles: { fillColor: lightGray },
      head: [["#", "Page / Route", "Label", "Visits"]],
      body: data.mostViewedPages.map((p, i) => [i + 1, p.page, p.label, p.visits]),
      columnStyles: { 0: { cellWidth: 8, halign: "center" }, 1: { cellWidth: 55 }, 2: { cellWidth: 80 }, 3: { cellWidth: 25, halign: "center" } },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── PAGE 4: People & Applications ──────────────────────────────────────────
  doc.addPage();
  y = header(0, "People & Applications Report", "Mentorship, Careers, Support Tickets & Vendor Data");

  // Mentorship summary
  y = sectionTitle(y, "MENTORSHIP APPLICATIONS OVERVIEW");
  const mPending = data.mentorshipApplications.filter(a => a.status === "Pending").length;
  const mContacted = data.mentorshipApplications.filter(a => a.status === "Contacted").length;
  const mApproved = data.mentorshipApplications.filter(a => a.status === "Approved" || a.status === "Enrolled").length;
  autoTable(doc, {
    startY: y, margin: { left: 14, right: 14 }, theme: "grid",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: dark, textColor: white, fontStyle: "bold", fontSize: 8 },
    head: [["Metric", "Count"]],
    body: [
      ["Total Applications", data.mentorshipApplications.length],
      ["Pending Review", mPending],
      ["Contacted", mContacted],
      ["Approved / Enrolled", mApproved],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 80 }, 1: { cellWidth: 30, halign: "center" } },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Career apps
  y = sectionTitle(y, "CAREER APPLICATIONS OVERVIEW");
  autoTable(doc, {
    startY: y, margin: { left: 14, right: 14 }, theme: "grid",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: dark, textColor: white, fontStyle: "bold", fontSize: 8 },
    head: [["Metric", "Count"]],
    body: [
      ["Total Career Applications", data.careerApps.length],
      ["Pending Review", data.careerApps.filter((a: any) => !a.status || a.status === "Pending").length],
      ["Shortlisted / Contacted", data.careerApps.filter((a: any) => a.status === "Shortlisted" || a.status === "Contacted").length],
      ["Hired / Rejected", data.careerApps.filter((a: any) => a.status === "Hired" || a.status === "Rejected").length],
    ],
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 80 }, 1: { cellWidth: 30, halign: "center" } },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Recent activity table
  if (data.recentActivity.length > 0) {
    y = sectionTitle(y, "RECENT SITE ACTIVITY (Last 20 Events)");
    autoTable(doc, {
      startY: y, margin: { left: 14, right: 14 }, theme: "striped",
      styles: { fontSize: 7.5, cellPadding: 2.5 },
      headStyles: { fillColor: dark, textColor: white, fontStyle: "bold", fontSize: 7 },
      alternateRowStyles: { fillColor: lightGray },
      head: [["#", "Event Type", "Page / Label", "Timestamp"]],
      body: data.recentActivity.slice(0, 20).map((a, i) => [
        i + 1,
        a.type.toUpperCase().replace("_", " "),
        a.label || a.page,
        new Date(a.createdAt).toLocaleString("en-IN"),
      ]),
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 30 },
        2: { cellWidth: 90 },
        3: { cellWidth: 45 },
      },
    });
  }

  // ── Footers on all pages ────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    footer(i, totalPages);
  }

  const filename = `civil-at-hand-analytics-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AnalyticsDashboard({
  leads,
  projects,
  invoices,
  blogs,
  portfolio,
  tickets,
  clientBuckets,
  mentorshipApplications,
  careerApps,
  totalRevenue,
  pendingRevenue,
}: AnalyticsDashboardProps) {
  const [engStats, setEngStats] = useState<EngagementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/analytics/summary");
      if (res.ok) {
        const data = await res.json();
        setEngStats(data);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      console.error("Analytics fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);



  // ── Computed metrics ──────────────────────────────────────────────────────
  const totalBlogViews = blogs.reduce((s, b) => s + ((b as any).views || 0), 0);
  const totalBlogLikes = blogs.reduce((s, b) => s + ((b as any).likes || 0), 0);
  const totalBlogShares = blogs.reduce((s, b) => s + ((b as any).shares || 0), 0);
  const totalPortfolioViews = portfolio.reduce((s, p) => s + ((p as any).views || 0), 0);
  const convertedLeads = leads.filter(l => l.status === "converted").length;
  const conversionRate = leads.length > 0 ? Math.round((convertedLeads / leads.length) * 100) : 0;
  const newLeads = leads.filter(l => l.status === "new").length;
  const activeProjects = projects.filter(p => p.status !== "Completed").length;
  const completedProjects = projects.filter(p => p.status === "Completed").length;
  const paidInvoices = invoices.filter(i => i.status === "Paid").length;
  const unpaidInvoices = invoices.filter(i => i.status === "Unpaid").length;
  const openTickets = tickets.filter(t => t.status === "Open" || t.status === "In Progress").length;

  // ── Business health score (0-100) ────────────────────────────────────────
  const healthScore = Math.min(100, Math.round(
    (conversionRate > 0 ? 20 : 0) +
    (totalRevenue > 0 ? 25 : 0) +
    (activeProjects > 0 ? 15 : 0) +
    (totalBlogViews > 0 ? 15 : 0) +
    (clientBuckets.length > 0 ? 15 : 0) +
    (openTickets < 5 ? 10 : 5)
  ));

  // ── Lead status donut data ───────────────────────────────────────────────
  const leadDonut = [
    { value: newLeads, color: "#f97316", label: "New" },
    { value: leads.filter(l => l.status === "contacted").length, color: "#3b82f6", label: "Contacted" },
    { value: convertedLeads, color: "#10b981", label: "Converted" },
    { value: leads.filter(l => l.status === "closed").length, color: "#94a3b8", label: "Closed" },
  ];

  // ── Project status donut data ────────────────────────────────────────────
  const projDonut = [
    { value: projects.filter(p => p.status === "Planning").length, color: "#f59e0b", label: "Planning" },
    { value: projects.filter(p => p.status === "In Progress").length, color: "#3b82f6", label: "In Progress" },
    { value: projects.filter(p => p.status === "On Hold").length, color: "#ef4444", label: "On Hold" },
    { value: completedProjects, color: "#10b981", label: "Completed" },
  ];

  // ── PDF handler ──────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      await downloadAnalyticsPDF({
        totalRevenue,
        pendingRevenue,
        totalClients: clientBuckets.length,
        totalProjects: projects.length,
        totalLeads: leads.length,
        convertedLeads,
        openTickets,
        totalBlogViews,
        totalBlogLikes,
        totalBlogShares,
        totalPortfolioViews,
        totalPageVisits: engStats?.totalPageVisits ?? 0,
        totalClicks: engStats?.totalClicks ?? 0,
        totalContentClicks: engStats?.totalContentClicks ?? 0,
        totalShares: engStats?.totalShares ?? 0,
        monthlyRevenueTrend: engStats?.monthlyRevenueTrend ?? [],
        mostViewedPages: engStats?.mostViewedPages ?? [],
        mostSharedPages: engStats?.mostSharedPages ?? [],
        recentActivity: engStats?.recentActivity ?? [],
        blogs,
        portfolio,
        projects,
        leads,
        invoices,
        mentorshipApplications,
        careerApps,
        healthScore,
      });
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-8 flex-grow"
    >
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-5 w-5 text-orange-500" />
            <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">Analytics & Insights</h3>
            <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />LIVE
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Business intelligence in one place — revenue, traffic, clients, leads, projects, content, and site engagement.{" "}
            <span className="text-slate-400">Last refreshed: {lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          
          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            className="flex items-center gap-1.5 text-[11px] font-extrabold text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-xl transition-all disabled:opacity-60 shadow-sm cursor-pointer"
          >
            {pdfLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Download PDF Report
          </button>
        </div>
      </div>

      {/* ── Row 1: Primary Business KPIs ─────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Revenue Collected"
          value={<AnimatedNumber value={totalRevenue} prefix="₹" />}
          subtext={`₹${(pendingRevenue / 100000).toFixed(2)}L pending`}
          icon={Receipt} color="bg-orange-500" trend="up" trendValue="All Time" delay={0}
        />
        <KpiCard
          title="Total Clients"
          value={<AnimatedNumber value={clientBuckets.length} />}
          subtext={`${newLeads} new leads in queue`}
          icon={Users} color="bg-blue-500" trend="up" trendValue="Active" delay={0.05}
        />
        <KpiCard
          title="Projects"
          value={<AnimatedNumber value={projects.length} />}
          subtext={`${activeProjects} active · ${completedProjects} done`}
          icon={FolderKanban} color="bg-violet-500" delay={0.1}
        />
        <KpiCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          subtext={`${convertedLeads} of ${leads.length} leads`}
          icon={Target} color="bg-emerald-500" trend={conversionRate >= 30 ? "up" : "down"} trendValue={`${convertedLeads} Won`} delay={0.15}
        />
      </div>

      {/* ── Row 2: Traffic + Content KPIs ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Page Visits"
          value={<AnimatedNumber value={engStats?.totalPageVisits ?? 0} />}
          subtext="Tracked site-wide visits"
          icon={Globe} color="bg-cyan-500" delay={0.05}
        />
        <KpiCard
          title="UI Clicks"
          value={<AnimatedNumber value={engStats?.totalClicks ?? 0} />}
          subtext="Total interaction events"
          icon={MousePointerClick} color="bg-indigo-500" delay={0.1}
        />
        <KpiCard
          title="Blog Views"
          value={<AnimatedNumber value={totalBlogViews} />}
          subtext={`${blogs.length} articles · ${totalBlogLikes} likes`}
          icon={BookOpen} color="bg-rose-500" delay={0.15}
        />
        <KpiCard
          title="Total Shares"
          value={<AnimatedNumber value={engStats?.totalShares ?? 0} />}
          subtext={`${totalBlogShares} blog shares`}
          icon={Share2} color="bg-amber-500" delay={0.2}
        />
      </div>

      {/* ── Revenue Chart ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <SectionHeader icon={TrendingUp} title="Monthly Revenue Growth (6 Months)" />
          </div>
          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500 -mt-3">
            <span className="flex items-center gap-1"><span className="w-3 h-1 bg-orange-500 rounded inline-block" /> Revenue</span>
            <span className="flex items-center gap-1"><span className="w-3 h-1 bg-slate-200 rounded inline-block" /> Target Zone</span>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-orange-400" /></div>
        ) : (
          <>
            <RevenueChart trend={engStats?.monthlyRevenueTrend ?? []} />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-3 mt-2 border-t border-slate-100">
              {(engStats?.monthlyRevenueTrend ?? []).map(t => (
                <span key={t.month} className="text-center">
                  <span className="block">{t.month}</span>
                  <span className="block text-slate-600">₹{(t.revenue / 100000).toFixed(1)}L</span>
                </span>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* ── Row 3: Donut Charts + Health Score ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Leads funnel */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
        >
          <SectionHeader icon={Activity} title="Lead Funnel" badge={`${leads.length} Total`} />
          <div className="flex items-center gap-5">
            <DonutChart slices={leadDonut} size={90} />
            <div className="flex-1 space-y-2.5">
              {leadDonut.map(s => (
                <ProgressBar key={s.label} value={s.value} max={leads.length}
                  color={s.color === "#f97316" ? "bg-orange-500" : s.color === "#3b82f6" ? "bg-blue-500" : s.color === "#10b981" ? "bg-emerald-500" : "bg-slate-400"}
                  label={s.label} />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Project status */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
        >
          <SectionHeader icon={FolderKanban} title="Project Status" badge={`${projects.length} Total`} />
          <div className="flex items-center gap-5">
            <DonutChart slices={projDonut} size={90} />
            <div className="flex-1 space-y-2.5">
              {projDonut.map(s => (
                <ProgressBar key={s.label} value={s.value} max={projects.length}
                  color={s.color === "#f59e0b" ? "bg-amber-500" : s.color === "#3b82f6" ? "bg-blue-500" : s.color === "#ef4444" ? "bg-red-500" : "bg-emerald-500"}
                  label={s.label} />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Business Health */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
        >
          <SectionHeader icon={Award} title="Business Health Score" />
          <div className="flex flex-col items-center gap-4 pt-2">
            <HealthScore score={healthScore} />
            <div className="w-full space-y-2 text-[11px]">
              {[
                { label: "Revenue", ok: totalRevenue > 0 },
                { label: "Client Base", ok: clientBuckets.length > 0 },
                { label: "Lead Conversion", ok: conversionRate >= 20 },
                { label: "Active Projects", ok: activeProjects > 0 },
                { label: "Content Engagement", ok: totalBlogViews > 0 },
                { label: "Support Health", ok: openTickets < 5 },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">{item.label}</span>
                  {item.ok
                    ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    : <AlertCircle className="h-3.5 w-3.5 text-amber-400" />}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Row 4: Invoice Health + Support Tickets ───────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Invoice Health */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
        >
          <SectionHeader icon={Receipt} title="Invoice Financial Health" badge={`${invoices.length} Total`} />
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center mb-4">
              {[
                { label: "Paid", value: `₹${(totalRevenue / 100000).toFixed(1)}L`, count: paidInvoices, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
                { label: "Pending", value: `₹${(pendingRevenue / 100000).toFixed(1)}L`, count: unpaidInvoices, color: "text-amber-600 bg-amber-50 border-amber-200" },
                { label: "Total", value: `₹${((totalRevenue + pendingRevenue) / 100000).toFixed(1)}L`, count: invoices.length, color: "text-slate-700 bg-slate-50 border-slate-200" },
              ].map(item => (
                <div key={item.label} className={`rounded-xl border p-3 ${item.color}`}>
                  <div className="text-[9px] font-extrabold uppercase tracking-wider opacity-70">{item.label}</div>
                  <div className="text-base font-extrabold mt-0.5">{item.value}</div>
                  <div className="text-[10px] font-semibold opacity-60">{item.count} inv.</div>
                </div>
              ))}
            </div>
            <ProgressBar value={paidInvoices} max={invoices.length} color="bg-emerald-500" label="Paid Invoices" suffix="" />
            <ProgressBar value={unpaidInvoices} max={invoices.length} color="bg-amber-500" label="Pending Invoices" suffix="" />
          </div>
        </motion.div>

        {/* Support Tickets */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
        >
          <SectionHeader icon={MessageSquare} title="Support Ticket Metrics" badge={`${tickets.length} Total`} />
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "Open", count: tickets.filter(t => t.status === "Open").length, color: "bg-orange-50 text-orange-700 border-orange-200" },
              { label: "In Progress", count: tickets.filter(t => t.status === "In Progress").length, color: "bg-blue-50 text-blue-700 border-blue-200" },
              { label: "Resolved", count: tickets.filter(t => t.status === "Resolved").length, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
              { label: "Urgent", count: tickets.filter(t => t.priority === "Urgent").length, color: "bg-red-50 text-red-700 border-red-200" },
            ].map(item => (
              <div key={item.label} className={`border rounded-xl p-3 ${item.color}`}>
                <div className="text-[9px] font-extrabold uppercase tracking-wider opacity-60">{item.label}</div>
                <div className="text-xl font-extrabold mt-0.5">{item.count}</div>
              </div>
            ))}
          </div>
          <ProgressBar
            value={tickets.filter(t => t.status === "Resolved" || t.status === "Closed").length}
            max={tickets.length} color="bg-emerald-500" label="Resolution Rate"
          />
        </motion.div>
      </div>

      {/* ── Row 5: Most Viewed / Shared / Activity ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Viewed */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
        >
          <SectionHeader icon={Eye} title="Most Visited Pages" badge="Top 7" />
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-orange-400" /></div>
            ) : (engStats?.mostViewedPages ?? []).slice(0, 7).map((p, i) => (
              <div key={p.page} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                <span className="text-[10px] font-extrabold text-slate-400 w-5 text-center shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-slate-900 truncate">{p.label}</div>
                  <div className="text-[10px] text-slate-400 truncate">{p.page}</div>
                </div>
                <span className="text-[10px] font-extrabold text-blue-600 shrink-0 flex items-center gap-0.5">
                  <Eye className="h-3 w-3" />{p.visits}
                </span>
              </div>
            ))}
            {!loading && (!engStats || engStats.mostViewedPages.length === 0) && (
              <p className="text-[11px] text-slate-400 italic py-4 text-center">No page-visit data recorded yet.</p>
            )}
          </div>
        </motion.div>

        {/* Most Shared */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
        >
          <SectionHeader icon={Share2} title="Most Shared Pages" badge="Top 7" />
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-orange-400" /></div>
            ) : (engStats?.mostSharedPages ?? []).slice(0, 7).map((p, i) => (
              <div key={p.page} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors">
                <span className="text-[10px] font-extrabold text-slate-400 w-5 text-center shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-slate-900 truncate">{p.label}</div>
                  <div className="text-[10px] text-slate-400 truncate">{p.page}</div>
                </div>
                <span className="text-[10px] font-extrabold text-indigo-600 shrink-0 flex items-center gap-0.5">
                  <Share2 className="h-3 w-3" />{p.shares}
                </span>
              </div>
            ))}
            {!loading && (!engStats || engStats.mostSharedPages.length === 0) && (
              <p className="text-[11px] text-slate-400 italic py-4 text-center">No share data recorded yet.</p>
            )}
          </div>
        </motion.div>

        {/* Live Activity Feed */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
        >
          <SectionHeader icon={Zap} title="Live Activity Feed" badge="Last 15" />
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-orange-400" /></div>
            ) : (engStats?.recentActivity ?? []).slice(0, 15).map((a, i) => {
              const meta = activityIconMap[a.type] ?? activityIconMap.visit;
              const Icon = meta.icon;
              const typeLabel = a.type === "content_click" ? "Content click" : a.type.charAt(0).toUpperCase() + a.type.slice(1);
              return (
                <div key={i} className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className={`p-1.5 rounded-lg ${meta.color} shrink-0`}>
                    <Icon className="h-3 w-3" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-slate-900 truncate">{typeLabel} · {a.label || a.page}</p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {new Date(a.createdAt).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              );
            })}
            {!loading && (!engStats || engStats.recentActivity.length === 0) && (
              <p className="text-[11px] text-slate-400 italic py-4 text-center">No activity recorded yet.</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Row 6: Blog + Portfolio Performance ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Blog */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
        >
          <SectionHeader icon={BookOpen} title="Blog Articles Performance" />
          {/* Summary chips */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {[
              { icon: Eye, val: totalBlogViews, color: "bg-blue-50 text-blue-700" },
              { icon: Heart, val: totalBlogLikes, color: "bg-rose-50 text-rose-700" },
              { icon: Share2, val: totalBlogShares, color: "bg-indigo-50 text-indigo-700" },
              { icon: FileText, val: blogs.length, color: "bg-slate-50 text-slate-700" },
            ].map(({ icon: I, val, color }, idx) => (
              <span key={idx} className={`flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-lg ${color}`}>
                <I className="h-3 w-3" />{val.toLocaleString()}
              </span>
            ))}
          </div>
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {[...blogs]
              .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
              .slice(0, 7)
              .map((post: any, i) => (
                <div key={post.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-extrabold text-slate-400 w-5 text-center shrink-0">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-slate-900 truncate">{post.title}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-[10px] font-bold text-slate-500">
                    <span className="flex items-center gap-0.5 text-blue-500"><Eye className="h-3 w-3" />{post.views || 0}</span>
                    <span className="flex items-center gap-0.5 text-rose-500"><Heart className="h-3 w-3" />{post.likes || 0}</span>
                    <span className="flex items-center gap-0.5 text-indigo-500"><Share2 className="h-3 w-3" />{post.shares || 0}</span>
                  </div>
                </div>
              ))}
            {blogs.length === 0 && <p className="text-[11px] text-slate-400 italic py-4 text-center">No blog posts yet.</p>}
          </div>
        </motion.div>

        {/* Portfolio */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
        >
          <SectionHeader icon={Briefcase} title="Portfolio Case Studies" badge={`${totalPortfolioViews.toLocaleString()} total views`} />
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {[...portfolio]
              .sort((a: any, b: any) => (b.views || 0) - (a.views || 0))
              .slice(0, 7)
              .map((item: any, i) => {
                const pct = totalPortfolioViews > 0 ? Math.round(((item.views || 0) / totalPortfolioViews) * 100) : 0;
                return (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-extrabold text-slate-400 w-5 text-center shrink-0">#{i + 1}</span>
                        <span className="text-[11px] font-semibold text-slate-900 truncate">{item.title}</span>
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-600 shrink-0 ml-2 flex items-center gap-0.5">
                        <Eye className="h-3 w-3 text-blue-500" />{item.views || 0}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden ml-7">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: i * 0.1 }}
                        className="h-full bg-orange-400 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            {portfolio.length === 0 && <p className="text-[11px] text-slate-400 italic py-4 text-center">No portfolio items yet.</p>}
          </div>
        </motion.div>
      </div>

      {/* ── Row 7: People KPIs Summary ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}
        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
      >
        <SectionHeader icon={Users} title="People & Applications Overview" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Users, label: "Registered Clients", value: clientBuckets.length, color: "bg-blue-50 text-blue-600" },
            { icon: Target, label: "Mentorship Applications", value: mentorshipApplications.length, color: "bg-violet-50 text-violet-600" },
            { icon: Briefcase, label: "Career Applications", value: careerApps.length, color: "bg-amber-50 text-amber-600" },
            { icon: Star, label: "Converted Leads", value: convertedLeads, color: "bg-emerald-50 text-emerald-600" },
          ].map(({ icon: I, label, value, color }, idx) => (
            <div key={idx} className={`rounded-xl p-4 ${color} flex items-center gap-3`}>
              <I className="h-5 w-5 shrink-0" />
              <div>
                <div className="text-[9px] font-extrabold uppercase tracking-wider opacity-70">{label}</div>
                <div className="text-xl font-extrabold mt-0.5"><AnimatedNumber value={value} /></div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Footer note ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 py-4 border-t border-slate-100">
        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          All data sourced live from MongoDB · NS Construction Analytics Engine
        </span>
      </div>
    </motion.div>
  );
}
