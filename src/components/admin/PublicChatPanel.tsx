"use client";

import { notifyAdmin } from "./AdminToast";
import React, { useState } from "react";
import { useProjects } from "@/context/ProjectContext";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Search, X, Trash2 } from "lucide-react";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { ChatComposer } from "@/components/chat/ChatComposer";
import type { TicketAttachment } from "@/context/ProjectContext";

export function PublicChatPanel() {
  const { tickets, updateTicketStatus, addTicketReply, refreshTickets } = useProjects();
  const [adminTicketSearch, setAdminTicketSearch] = useState("");
  const [adminTicketStatusFilter, setAdminTicketStatusFilter] = useState<string>("All");
  const [selectedAdminTicketId, setSelectedAdminTicketId] = useState<string | null>(null);
  const [submittingAdminReply, setSubmittingAdminReply] = useState(false);

  const publicChatTickets = tickets.filter((t) =>
    t.subject.startsWith("[Live Chat]") || (t as any).source === "public-chat"
  );
  const publicChatCount = publicChatTickets.filter(
    (t) => t.status === "Open" || t.status === "In Progress"
  ).length;

  const filteredPublicChats = publicChatTickets.filter((t) => {
    const matchesSearch =
      t.subject.toLowerCase().includes(adminTicketSearch.toLowerCase()) ||
      t.clientName.toLowerCase().includes(adminTicketSearch.toLowerCase()) ||
      t.clientEmail.toLowerCase().includes(adminTicketSearch.toLowerCase()) ||
      (t.clientPhone || "").toLowerCase().includes(adminTicketSearch.toLowerCase()); // Added phone search
    const matchesStatus = adminTicketStatusFilter === "All" || t.status === adminTicketStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedAdminTicket = publicChatTickets.find((t) => t.id === selectedAdminTicketId);

  const handleDeletePublicChat = async (ticketId: string, label: string) => {
    if (!window.confirm(`Delete live chat ${label}? This permanently removes the conversation and cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Delete failed");
      await refreshTickets();
      if (selectedAdminTicketId === ticketId) setSelectedAdminTicketId(null);
    } catch (err) {
      console.error("Error deleting public chat:", err);
      notifyAdmin("Could not delete this live chat. Please try again.");
    }
  };

  const handleDeleteClosedChats = async () => {
    const closedChats = publicChatTickets.filter((t) => t.status === "Resolved" || t.status === "Closed");
    if (closedChats.length === 0) {
      notifyAdmin("There are no resolved or closed live chats to delete.");
      return;
    }
    if (!window.confirm(`Delete ${closedChats.length} resolved/closed live chat session${closedChats.length === 1 ? "" : "s"}? This cannot be undone.`)) return;
    try {
      const response = await fetch("/api/admin/public-chat?scope=closed", { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Delete failed");
      await refreshTickets();
    } catch (err) {
      console.error("Error deleting old public chats:", err);
      notifyAdmin("Could not delete the old live chats. Please try again.");
    }
  };

  const handleAdminTicketReplySend = async (text: string, attachments: TicketAttachment[]) => {
    if (!selectedAdminTicketId) return;
    if (!text.trim() && attachments.length === 0) return;
    setSubmittingAdminReply(true);
    try {
      await addTicketReply(selectedAdminTicketId, text.trim(), "admin", "Help Desk Engineer", attachments);
    } catch (err) {
      console.error("Error submitting admin ticket reply:", err);
    } finally {
      setSubmittingAdminReply(false);
    }
  };

  return (
    <motion.div
      key="publicChat"
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="font-display font-extrabold text-xl text-navy-950 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-500" />
            Public Live Chat — civilathan.in/talk
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            All visitor conversations started from the public /talk page. Separate from internal Help Desk tickets.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a href="/talk" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-sm">
            <MessageSquare className="h-3.5 w-3.5" /> Open /talk Page
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Sessions</span>
          <span className="text-2xl font-extrabold text-navy-950 font-display mt-1 block">{publicChatTickets.length}</span>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
          <span className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Active / Open</span>
          <span className="text-2xl font-extrabold text-emerald-700 font-display mt-1 block">{publicChatCount}</span>
        </div>
        <div className="bg-sky-500/10 border border-sky-500/20 p-4 rounded-xl">
          <span className="block text-[10px] font-bold text-sky-700 uppercase tracking-wider">Resolved</span>
          <span className="text-2xl font-extrabold text-sky-700 font-display mt-1 block">{publicChatTickets.filter(t => t.status === "Resolved" || t.status === "Closed").length}</span>
        </div>
        <div className="bg-violet-500/10 border border-violet-500/20 p-4 rounded-xl">
          <span className="block text-[10px] font-bold text-violet-700 uppercase tracking-wider">In Progress</span>
          <span className="text-2xl font-extrabold text-violet-700 font-display mt-1 block">{publicChatTickets.filter(t => t.status === "In Progress").length}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={adminTicketSearch}
            onChange={e => setAdminTicketSearch(e.target.value)}
            placeholder="Search by name, email, phone, or subject…"
            className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold focus:outline-none focus:border-orange-500 text-slate-800"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleDeleteClosedChats}
            className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-[10px] uppercase tracking-wide px-3 py-2 rounded-lg transition-colors"
            title="Delete resolved and closed live chats"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete Closed Chats
          </button>
          <div className="flex items-center gap-1.5 w-1/2 sm:w-auto">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Status:</span>
            <select
              value={adminTicketStatusFilter}
              onChange={e => setAdminTicketStatusFilter(e.target.value)}
              className="bg-white border border-slate-300 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-500"
            >
              <option value="All">All</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredPublicChats.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center space-y-3">
            <MessageSquare className="h-10 w-10 text-slate-300 mx-auto" />
            <h4 className="font-display font-bold text-slate-700 text-base">No Public Chat Sessions Yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">No visitors have started a live chat from civilathan.in/talk yet. Share the link to get conversations going!</p>
            <a href="/talk" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 text-xs rounded-xl transition-all shadow-sm">
              <MessageSquare className="h-3.5 w-3.5" /> Preview Chat Page
            </a>
          </div>
        ) : (
          filteredPublicChats.map((ticket) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 hover:border-emerald-400/60 p-5 rounded-2xl shadow-sm space-y-3 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      #{ticket.ticketNumber || ticket.id}
                    </span>
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE CHAT
                    </span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                      ticket.status === "Open" ? "bg-amber-100 text-amber-700 border border-amber-200" :
                      ticket.status === "In Progress" ? "bg-blue-100 text-blue-700 border border-blue-200" :
                      ticket.status === "Resolved" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-navy-950">{ticket.clientName || "Visitor"}</p>
                  <p className="text-xs text-slate-500">{ticket.subject}</p>
                  
                  {/* UPDATED: Shows Email AND Phone Number */}
                  {ticket.clientEmail && (
                    <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      📧 {ticket.clientEmail}
                    </p>
                  )}
                  {ticket.clientPhone && (
                    <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                      📞 {ticket.clientPhone}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">
                    {new Date(ticket.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {(ticket.messages || []).length} messages
                  </span>
                </div>
              </div>

              {(ticket.messages || []).length > 0 && (() => {
                const lastMsg = ticket.messages[ticket.messages.length - 1];
                return (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                      {lastMsg.sender === "admin" ? "You replied" : "Visitor"} · {new Date(lastMsg.timestamp?.replace(" ", "T")).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-xs text-slate-700 font-medium truncate">{lastMsg.text}</p>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleDeletePublicChat(ticket.id, `#${ticket.ticketNumber || ticket.id}`)}
                  className="inline-flex items-center gap-1.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs px-3 py-2 rounded-lg transition-colors cursor-pointer"
                  title="Delete this live chat"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
                <button
                  onClick={() => setSelectedAdminTicketId(ticket.id)}
                  className="bg-navy-950 hover:bg-orange-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> View & Reply ({(ticket.messages || []).length})
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedAdminTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 bg-navy-950 text-white flex justify-between items-start border-b border-slate-800">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded border border-orange-500/30">
                      #{selectedAdminTicket.ticketNumber || selectedAdminTicket.id}
                    </span>
                    <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                      {selectedAdminTicket.category}
                    </span>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase bg-orange-500/20 text-orange-400">
                      {selectedAdminTicket.priority} Priority
                    </span>
                  </div>
                  <h3 className="font-display font-extrabold text-base text-white">{selectedAdminTicket.subject}</h3>
                  
                  {/* UPDATED: Shows Email AND Phone Number in the Modal popup */}
                  <p className="text-[11px] text-slate-400">
                    Client: <strong className="text-white">{selectedAdminTicket.clientName}</strong>
                    <br /> 📧 {selectedAdminTicket.clientEmail}
                    {selectedAdminTicket.clientPhone && (
                      <span className="block mt-1">📞 {selectedAdminTicket.clientPhone}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeletePublicChat(selectedAdminTicket.id, `#${selectedAdminTicket.ticketNumber || selectedAdminTicket.id}`)}
                    className="h-8 px-3 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                  <button
                    onClick={() => setSelectedAdminTicketId(null)}
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="font-bold text-slate-600">Update Ticket Status:</span>
                <div className="flex items-center gap-1.5">
                  {(["Open", "In Progress", "Resolved", "Closed"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => updateTicketStatus(selectedAdminTicket.id, st)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        selectedAdminTicket.status === st
                          ? "bg-orange-500 text-white shadow-sm"
                          : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-6 overflow-y-auto space-y-4 flex-grow max-h-[380px] bg-slate-50">
                {(selectedAdminTicket.messages || []).map((msg) => {
                  const isAdmin = msg.sender === "admin";
                  return (
                    <ChatBubble
                      key={msg.id}
                      message={msg}
                      isSelf={isAdmin}
                      fallbackName={isAdmin ? "Support Engineer" : selectedAdminTicket.clientName}
                    />
                  );
                })}
              </div>
              <div className="p-4 bg-white border-t border-slate-200">
                <ChatComposer
                  onSend={handleAdminTicketReplySend}
                  sending={submittingAdminReply}
                  placeholder="Write official support engineer response... (image/PDF attachments supported)"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
