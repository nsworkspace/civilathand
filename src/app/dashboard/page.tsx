"use client";

import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DashboardView } from "@/components/DashboardView";
import UserAvatar from "@/components/UserAvatar";
import { useProjects } from "@/context/ProjectContext";
import { User, Activity, FolderOpen, Clock, TrendingUp, ArrowRight, CreditCard, GraduationCap, MessageSquare } from "lucide-react";

export default function DashboardPage() {
  const { projects, invoices } = useProjects();
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const userJson = localStorage.getItem("cah_user");
        if (!userJson) return;
        const parsed = JSON.parse(userJson);
        if (parsed && typeof parsed === "object") setUser(parsed);
      } catch (error) {
        console.warn("Ignoring invalid local dashboard session data:", error);
        localStorage.removeItem("cah_user");
      }
    }
  }, []);

  const userProjects = user?.name
    ? projects.filter((p) => String(p.clientName || "").toLowerCase() === String(user.name || "").toLowerCase())
    : [];

  const userInvoices = user
    ? invoices.filter((inv) => userProjects.some((p) => p.id === inv.projectId))
    : [];

  const activeProjects = userProjects.filter((p) => p.status !== "Completed").length;
  const totalProjects = userProjects.length;
  const pendingInvoices = userInvoices.filter((i) => i.status === "Unpaid").length;
  const overdueInvoices = userInvoices.filter((i) => i.status === "Unpaid" && i.dueDate && new Date(i.dueDate).getTime() < Date.now());
  const overdueAmount = overdueInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      <main className="flex-grow py-8 md:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Premium Hero – single greeting */}
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8 mb-8 md:mb-10 overflow-hidden">
            <div className="absolute -top-24 -right-24 h-64 w-64 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 h-48 w-48 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <UserAvatar
                  name={user?.name}
                  profileImageId={user?.profileImageId}
                  profileImageUrl={user?.profileImageUrl}
                  size="lg"
                  className="h-14 w-14 border-white shadow-md"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-900 tracking-tight">
                      Welcome back, <span className="text-orange-600">{user ? user.name : "Guest"}</span>
                    </h1>
                    {user && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-sm">
                    Manage your engineering projects, mock test attempts, mentorship sessions, and invoices – all in one secure portal.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{dateStr}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <div className="flex-1 md:flex-none bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-3 border border-slate-100 hover:border-orange-200 transition-all duration-200">
                  <div className="p-1.5 bg-orange-100 rounded-lg">
                    <Activity className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active</p>
                    <p className="text-lg font-extrabold text-slate-800">{activeProjects}</p>
                  </div>
                </div>
                <div className="flex-1 md:flex-none bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-3 border border-slate-100 hover:border-indigo-200 transition-all duration-200">
                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                    <FolderOpen className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</p>
                    <p className="text-lg font-extrabold text-slate-800">{totalProjects}</p>
                  </div>
                </div>
                <div className="flex-1 md:flex-none bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-3 border border-slate-100 hover:border-red-200 transition-all duration-200">
                  <div className="p-1.5 bg-red-100 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Due</p>
                    <p className="text-lg font-extrabold text-red-600">{pendingInvoices}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/education/courses" className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-orange-50 p-2.5"><GraduationCap className="h-5 w-5 text-orange-600" /></div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-orange-500 transition" />
              </div>
              <h2 className="mt-4 font-extrabold text-slate-900">Continue learning</h2>
              <p className="mt-1 text-xs text-slate-500">Open your courses and study resources.</p>
            </a>
            <a href="/mentorship" className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-indigo-50 p-2.5"><MessageSquare className="h-5 w-5 text-indigo-600" /></div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition" />
              </div>
              <h2 className="mt-4 font-extrabold text-slate-900">Mentorship</h2>
              <p className="mt-1 text-xs text-slate-500">Apply, review your status, or continue your request.</p>
            </a>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-red-50 p-2.5"><CreditCard className="h-5 w-5 text-red-600" /></div>
                <span className={`rounded-full px-2 py-1 text-[9px] font-extrabold uppercase ${overdueInvoices.length ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{overdueInvoices.length ? "Attention" : "Clear"}</span>
              </div>
              <h2 className="mt-4 font-extrabold text-slate-900">Invoice status</h2>
              <p className="mt-1 text-xs text-slate-500">{overdueInvoices.length ? `${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? "s" : ""} · ₹${overdueAmount.toLocaleString("en-IN")}` : "No overdue invoices on your account."}</p>
            </div>
          </section>

          {/* Client project pulse + public opportunity marketplace */}
          <section className="mb-8 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-orange-600">My project pulse</p><h2 className="mt-1 text-lg font-black text-slate-950">Live project workspace</h2></div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-500">{userProjects.length} project{userProjects.length===1?"":"s"}</span>
              </div>
              <div className="p-5">
                {userProjects.length===0 ? <div className="rounded-2xl bg-slate-50 p-5"><p className="text-sm font-bold text-slate-800">No active client project yet.</p><p className="mt-1 text-xs leading-5 text-slate-500">You can still explore the public project marketplace and enquire about an opportunity.</p></div> : <div className="space-y-3">{userProjects.slice(0,3).map((p)=><div key={p.id} className="rounded-2xl border border-slate-100 p-4"><div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-black text-slate-900">{p.title}</h3><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{p.status} · {p.location||"Location pending"}</p></div><span className="text-sm font-black text-orange-600">{p.progress}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-orange-500" style={{width:`${Math.max(0,Math.min(100,p.progress))}%`}}/></div><div className="mt-3 flex items-center justify-between text-[10px] text-slate-400"><span>{p.areaSqFt?p.areaSqFt.toLocaleString("en-IN"):"—"} sq.ft</span><span>{p.quoteAmount?`₹${p.quoteAmount.toLocaleString("en-IN")}`:"Quote on file"}</span></div></div>)}</div>}
              </div>
            </div>
            <a href="/projects" className="group relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-500/20 blur-3xl"/>
              <div className="relative"><div className="flex items-center justify-between"><span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-orange-300">Marketplace</span><ArrowRight className="h-4 w-4 text-orange-300 transition group-hover:translate-x-1"/></div><h2 className="mt-8 text-2xl font-black">Explore open projects</h2><p className="mt-2 text-xs leading-6 text-slate-300">See public construction and engineering opportunities. Choose a project and send a structured enquiry.</p><div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-black">Browse projects <ArrowRight className="h-3.5 w-3.5"/></div></div>
            </a>
          </section>

          {/* DashboardView – existing project workspace */}
          <DashboardView />
        </div>
      </main>
      <Footer />
    </div>
  );
}
