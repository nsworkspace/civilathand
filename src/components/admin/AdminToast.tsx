"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";
type Toast = { id: number; message: string; type: ToastType };

export function notifyAdmin(message: string, type: ToastType = "info") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("cah:admin-toast", { detail: { message, type } }));
}

export function AdminToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string; type?: ToastType }>).detail;
      if (!detail?.message) return;
      const id = Date.now() + Math.random();
      setToasts((current) => [...current.slice(-3), { id, message: detail.message!, type: detail.type || "info" }]);
      window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4200);
    };
    window.addEventListener("cah:admin-toast", onToast);
    return () => window.removeEventListener("cah:admin-toast", onToast);
  }, []);

  const dismiss = (id: number) => setToasts((current) => current.filter((toast) => toast.id !== id));

  return (
    <div className="fixed right-4 top-4 z-[200] flex w-[min(92vw,380px)] flex-col gap-2" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => {
        const Icon = toast.type === "success" ? CheckCircle2 : toast.type === "error" ? AlertCircle : Info;
        const tone = toast.type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : toast.type === "error"
            ? "border-red-200 bg-red-50 text-red-900"
            : "border-slate-200 bg-white text-slate-900";
        return (
          <div key={toast.id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-xl backdrop-blur ${tone}`}>
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="min-w-0 flex-1 text-sm font-semibold leading-5">{toast.message}</p>
            <button type="button" onClick={() => dismiss(toast.id)} className="rounded-md p-1 opacity-60 hover:bg-black/5 hover:opacity-100" aria-label="Dismiss notification">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
