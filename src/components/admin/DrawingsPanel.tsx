"use client";

import React from "react";
import { useProjects } from "@/context/ProjectContext";
import { motion } from "framer-motion";
import { FileText, CheckCircle, Trash2 } from "lucide-react";
import { ClientAvatar } from "./AdminShared";

export function DrawingsPanel() {
  const { drawings, updateDrawingStatus, deleteDrawing } = useProjects();

  return (
    <motion.div
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 flex-grow"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-display font-extrabold text-xl text-navy-950">Drawing Audit Desk</h3>
          <p className="text-xs text-navy-600 mt-1">Review and manage client design blueprints, model analysis states, and engineering drawings.</p>
        </div>
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2 flex items-center gap-3">
          <span className="text-xs font-semibold text-navy-600">Total Drawings: <strong className="text-navy-950">{drawings.length}</strong></span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Analyzing</span>
            <p className="text-xl font-extrabold text-amber-950 mt-0.5">{drawings.filter(d => d.status === "Analyzing").length}</p>
          </div>
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
        </div>
        <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Ready / Approved</span>
            <p className="text-xl font-extrabold text-emerald-950 mt-0.5">{drawings.filter(d => d.status === "Ready").length}</p>
          </div>
          <CheckCircle className="h-5 w-5 text-emerald-500" />
        </div>
        <div className="bg-blue-50/50 border border-blue-200/60 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">Processed</span>
            <p className="text-xl font-extrabold text-blue-950 mt-0.5">{drawings.filter(d => d.status === "Processed").length}</p>
          </div>
          <FileText className="h-5 w-5 text-blue-500" />
        </div>
      </div>
      <div className="border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-navy-950 text-white font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4 border-r border-white/10">Drawing Name</th>
                <th className="p-4 border-r border-white/10">Client</th>
                <th className="p-4 border-r border-white/10">Service Category</th>
                <th className="p-4 border-r border-white/10">Size & Date</th>
                <th className="p-4 border-r border-white/10">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {drawings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-navy-600">
                    No drawings uploaded yet in the system.
                  </td>
                </tr>
              ) : (
                drawings.map((draw) => (
                  <tr key={draw.id} className="even:bg-slate-50/60 hover:bg-orange-50/50 transition-colors">
                    <td className="p-4 font-semibold text-navy-950 max-w-xs truncate border-r border-slate-100">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        {draw.url ? (
                          <a
                            href={draw.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-orange-600 underline transition-colors truncate cursor-pointer font-bold"
                            title={`Click to open/download ${draw.name}`}
                          >
                            {draw.name}
                          </a>
                        ) : (
                          <span className="truncate" title={draw.name}>{draw.name}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 border-r border-slate-100">
                      <div className="flex items-center gap-2">
                        <ClientAvatar name={(draw as any).clientName || "Unknown"} size="sm" />
                        <div className="flex flex-col">
                          <span className="font-bold text-navy-950">{(draw as any).clientName || "Unknown Client"}</span>
                          {(draw as any).clientEmail && (
                            <span className="text-[9px] text-slate-400">{(draw as any).clientEmail}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 border-r border-slate-100">
                      <span className="bg-slate-100 text-navy-700 px-2 py-0.5 rounded font-medium text-[10px]">
                        {draw.serviceType}
                      </span>
                    </td>
                    <td className="p-4 text-navy-600 border-r border-slate-100">
                      <div>{draw.size}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">Uploaded {draw.uploadDate}</div>
                    </td>
                    <td className="p-4 border-r border-slate-100">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        draw.status === "Ready" ? "bg-emerald-100 text-emerald-700" :
                        draw.status === "Analyzing" ? "bg-amber-100 text-amber-700 flex animate-pulse" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {draw.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <select
                        value={draw.status}
                        onChange={(e) => updateDrawingStatus(draw.id, e.target.value as any)}
                        className="bg-white border border-slate-200 rounded px-2 py-1 text-[11px] font-bold text-navy-950 focus:outline-none cursor-pointer focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      >
                        <option value="Analyzing">Set Analyzing</option>
                        <option value="Ready">Set Ready</option>
                        <option value="Processed">Set Processed</option>
                      </select>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${draw.name}"?`)) {
                            deleteDrawing(draw.id);
                          }
                        }}
                        className="inline-flex items-center justify-center p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 border border-transparent hover:border-red-100 transition-all cursor-pointer"
                        title="Delete Drawing"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
