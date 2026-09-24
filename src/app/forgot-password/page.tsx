"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2, Loader } from "lucide-react";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { SITE } from "@/data/site";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const friendlyError = (code: string) => {
    switch (code) {
      case "auth/user-not-found":
        // Deliberately vague — confirming "no account with this email"
        // exists lets an attacker enumerate registered emails.
        return null;
      case "auth/invalid-email":
        return "That doesn't look like a valid email address.";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait a moment and try again.";
      default:
        return "Something went wrong. Please try again.";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${SITE.url}/reset-password`,
        handleCodeInApp: false,
      });
      setSent(true);
    } catch (err: any) {
      const msg = friendlyError(err?.code);
      // If msg is null (user-not-found), still show the success state —
      // never reveal whether an email is registered.
      if (msg) setErrorMsg(msg);
      else setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="text-2xl font-extrabold text-white">
            CIVIL <span className="text-orange-500">AT HAND</span>
          </Link>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/40">
          <Link
            href="/auth"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </Link>

          {sent ? (
            <div className="text-center py-4">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>
              <h1 className="text-lg font-bold text-white mb-2">Check your email</h1>
              <p className="text-sm text-slate-400">
                If an account exists for <span className="text-slate-200">{email}</span>, a
                password reset link is on its way. It'll bring you back here to set a new
                password.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-xl font-bold text-white">Forgot your password?</h1>
                <p className="text-sm text-slate-400 mt-1">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              {errorMsg && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="email"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold py-2.5 text-sm transition disabled:opacity-60"
                >
                  {loading ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Send reset link
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
