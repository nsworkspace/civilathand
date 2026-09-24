"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import PaymentButton from "./PaymentButton";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

interface PaymentAccessGateProps {
  itemSlug: string;
  title: string;
  description: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function PaymentAccessGate({
  itemSlug,
  title,
  description,
  children,
  fallback,
}: PaymentAccessGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Access is account-bound. Immediately remove protected UI when the
      // account signs out or changes; PaymentButton performs the authoritative
      // server-side ownership check for the new identity.
      setAuthUser(user);
      setUnlocked(false);
      if (!user) return;
    });
    return () => unsubscribe();
  }, []);

  if (unlocked) return <>{children}</>;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-base font-extrabold text-slate-900">{title}</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-emerald-700">
                <ShieldCheck className="h-3 w-3" /> Secure access
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 sm:px-6">
        <div className="mx-auto max-w-lg text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-orange-700">
            <Sparkles className="h-3 w-3" /> Continue to use
          </div>
          <p className="mb-5 text-xs text-slate-500">
            Access is checked before the feature runs. Free items need a verified sign-in; paid items additionally require verified payment.
          </p>
          <div className="flex justify-center">
            <PaymentButton
              itemSlug={itemSlug}
              showDetails={true}
              onUnlocked={() => setUnlocked(true)}
              fallback={fallback || (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
                  This feature is temporarily unavailable. Please try again later.
                </div>
              )}
            />
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-semibold text-slate-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> No access is granted until this step completes
          </div>
        </div>
      </div>
    </section>
  );
}
