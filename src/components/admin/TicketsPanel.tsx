"use client";

import React, { useState } from "react";
import { useProjects } from "@/context/ProjectContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  LifeBuoy, Search, Filter, MessageSquare, Trash2, X, Loader2
} from "lucide-react";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { ChatComposer } from "@/components/chat/ChatComposer";
import type { TicketAttachment } from "@/context/ProjectContext";

export function TicketsPanel() {
  const { tickets, updateTicketStatus, deleteTicket, addTicketReply } = useProjects();
  const [adminTicketSearch, setAdminTicketSearch] = useState("");
  const [adminTicketStatusFilter, setAdminTicketStatusFilter] = useState<string>("All");
  const [adminTicketPriorityFilter, setAdminTicketPriorityFilter] = useState<string>("All");
  const [selectedAdminTicketId, setSelectedAdminTicketId] = useState<string | null>(null);
  const [submittingAdminReply, setSubmittingAdminReply] = useState(false);

  // Only support tickets (non-chat)
  const supportTickets = tickets.filter(t => !t.subject.startsWith("[Live Chat]") && (t as any).source !== "public-chat");
  const urgentTicketsCount = supportTickets.filter(t => t.priority === "Urgent" && t.status !== "Closed").length;
  const resolvedTicketsCount = supportTickets.filter(t => t.status === "Resolved" || t.status === "Closed").length;
  const openSupportTicketsCount = supportTickets.filter(t => t.status === "Open" || t.status === "In Progress").length;

  const filteredSupportTickets = supportTickets.filter((t) => {
    const matchesSearch =
      t.subject.toLowerCase().includes(adminTicketSearch.toLowerCase()) ||
      t.clientName.toLowerCase().includes(adminTicketSearch.toLowerCase()) ||
      t.clientEmail.toLowerCase().includes(adminTicketSearch.toLowerCase()) ||
      (t.ticketNumber || t.id).toLowerCase().includes(adminTicketSearch.toLowerCase()) ||
      (t.clientPhone || "").toLowerCase().includes(adminTicketSearch.toLowerCase()); // Added phone search
    const matchesStatus = adminTicketStatusFilter === "All" || t.status === adminTicketStatusFilter;
    const matchesPriority = adminTicketPriorityFilter === "All" || t.priority === adminTicketPriorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const selectedAdminTicket = supportTickets.find((t) => t.id === selectedAdminTicketId);

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
      key="tickets"
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="font-display font-extrabold text-xl text-navy-950">Help Desk — Support Tickets</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage client support tickets (non-chat).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Tickets</span>
          <span className="text-2xl font-extrabold text-navy-950 font-display mt-1 block">{supportTickets.length}</span>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
          <span className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider">Open / Pending</span>
          <span className="text-2xl font-extrabold text-amber-700 font-display mt-1 block">{openSupportTicketsCount}</span>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
          <span className="block text-[10px] font-bold text-red-600 uppercase tracking-wider">Urgent Priority</span>
          <span className="text-2xl font-extrabold text-red-600 font-display mt-1 block">{urgentTicketsCount}</span>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
          <span className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Resolved / Closed</span>
          <span className="text-2xl font-extrabold text-emerald-700 font-display mt-1 block">{resolvedTicketsCount}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={adminTicketSearch}
            onChange={(e) => setAdminTicketSearch(e.target.value)}
            placeholder="Search by ticket #, client, phone, or subject..."
            className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold focus:outline-none focus:border-orange-500 text-slate-800"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 w-1/2 sm:w-auto">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Status:</span>
            <select
              value={adminTicketStatusFilter}
              onChange={(e) => setAdminTicketStatusFilter(e.target.value)}
              className="bg-white border border-slate-300 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-500"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5 w-1/2 sm:w-auto">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Priority:</span>
            <select
              value={adminTicketPriorityFilter}
              onChange={(e) => setAdminTicketPriorityFilter(e.target.value)}
              className="bg-white border border-slate-300 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-500"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredSupportTickets.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center space-y-2">
            <LifeBuoy className="h-10 w-10 text-slate-300 mx-auto" />
            <h4 className="font-display font-bold text-slate-700 text-base">No Tickets Found</h4>
            <p className="text-xs text-slate-400">No help desk requests match the current search query or filter selection.</p>
          </div>
        ) : (
          filteredSupportTickets.map((ticket) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 hover:border-orange-500/40 p-5 rounded-2xl shadow-sm space-y-3 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      #{ticket.ticketNumber || ticket.id}
                    </span>
                    <span className="text-[10px] font-bold text-navy-950 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {ticket.category}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                      ticket.priority === "Urgent" ? "bg-red-100 text-red-700 border border-red-200" :
                      ticket.priority === "High" ? "bg-orange-100 text-orange-700 border border-orange-200" :
                      ticket.priority === "Medium" ? "bg-blue-100 text-blue-700 border border-blue-200" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {ticket.priority}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      ticket.status === "Open" ? "bg-amber-100 text-amber-800" :
                      ticket.status === "In Progress" ? "bg-sky-100 text-sky-800" :
                      ticket.status === "Resolved" ? "bg-emerald-100 text-emerald-800" :
                      "bg-slate-200 text-slate-700"
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <h4 className="font-display font-extrabold text-navy-950 text-base">{ticket.subject}</h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Client: <strong className="text-slate-800">{ticket.clientName}</strong>
                    <span className="ml-1">({ticket.clientEmail})</span>
                    {/* ADDED: Show Phone Number in the list */}
                    {ticket.clientPhone && (
                      <span className="block mt-1 text-slate-500 font-medium text-[11px]">
                        📞 {ticket.clientPhone}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
                  <select
                    value={ticket.status}
                    onChange={(e) => updateTicketStatus(ticket.id, e.target.value as any)}
                    className="bg-slate-100 border border-slate-200 text-xs font-bold rounded-lg px-2.5 py-2 focus:outline-none focus:border-orange-500 text-slate-700 cursor-pointer"
                  >
                    <option value="Open">Status: Open</option>
                    <option value="In Progress">Status: In Progress</option>
                    <option value="Resolved">Status: Resolved</option>
                    <option value="Closed">Status: Closed</option>
                  </select>
                  <button
                    onClick={() => setSelectedAdminTicketId(ticket.id)}
                    className="bg-navy-950 hover:bg-orange-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> View & Reply ({(ticket.messages || []).length})
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete ticket #${ticket.ticketNumber || ticket.id}? This cannot be undone.`)) {
                        deleteTicket(ticket.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Ticket"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                &ldquo;{ticket.description}&rdquo;
              </p>
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
                  
                  {/* UPDATED: Shows Email AND Phone Number in the Tickets Modal popup */}
                  <p className="text-[11px] text-slate-400">
                    Client: <strong className="text-white">{selectedAdminTicket.clientName}</strong>
                    <br /> 📧 {selectedAdminTicket.clientEmail}
                    {selectedAdminTicket.clientPhone && (
                      <span className="block mt-1">📞 {selectedAdminTicket.clientPhone}</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAdminTicketId(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
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
