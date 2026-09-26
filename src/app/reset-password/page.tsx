"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader,
  ShieldCheck,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";

const PASSWORD_MIN_LENGTH = 8;

function passwordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "Too weak", color: "bg-red-500" },
    { label: "Weak", color: "bg-red-500" },
    { label: "Fair", color: "bg-amber-500" },
    { label: "Good", color: "bg-emerald-500" },
    { label: "Strong", color: "bg-emerald-500" },
  ];
  return { score, ...levels[score] };
}

// useSearchParams() requires a Suspense boundary during Next.js's static
// build pass, otherwise the build fails with a prerender error — this page
// is entirely link-driven (?oobCode=...) so there's nothing meaningful to
// prerender anyway.
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <Loader className="h-5 w-5 animate-spin text-orange-500" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");
  const mode = searchParams.get("mode");

  const [checking, setChecking] = useState(true);
  const [validCode, setValidCode] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [redirectSeconds, setRedirectSeconds] = useState(3);

  const strength = useMemo(() => passwordStrength(password), [password]);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const linkStatus = useMemo(() => {
    if (mode && mode !== "resetPassword") {
      return "wrong-mode";
    }
    if (!oobCode) return "missing-code";
    return "ok";
  }, [mode, oobCode]);

  useEffect(() => {
    if (linkStatus !== "ok" || !oobCode) {
      setChecking(false);
      return;
    }
    verifyPasswordResetCode(auth, oobCode)
      .then((verifiedEmail) => {
        setEmail(verifiedEmail);
        setValidCode(true);
      })
      .catch(() => {
        setValidCode(false);
      })
      .finally(() => setChecking(false));
  }, [linkStatus, oobCode]);

  // Countdown shown to the user during the short pause before we redirect
  // them to sign in, so "Taking you to sign in..." isn't just a vague
  // promise — it visibly counts down.
  useEffect(() => {
    if (!done) return;
    setRedirectSeconds(3);
    const interval = setInterval(() => {
      setRedirectSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    const timeout = setTimeout(() => router.replace("/auth"), 3000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [done, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < PASSWORD_MIN_LENGTH) {
      setErrorMsg(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords don't match.");
      return;
    }
    if (!oobCode) return;

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setDone(true);
    } catch (err: any) {
      if (err?.code === "auth/expired-action-code") {
        setErrorMsg("This reset link has expired. Please request a new one.");
      } else if (err?.code === "auth/weak-password") {
        setErrorMsg(`Password should be at least ${PASSWORD_MIN_LENGTH} characters.`);
      } else if (err?.code === "auth/invalid-action-code") {
        setErrorMsg("This reset link has already been used. Please request a new one.");
      } else {
        setErrorMsg("Couldn't reset your password. Please request a new link.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Left brand panel — matches the Sign In / Sign Up page for a
         consistent, premium feel across the whole auth experience. */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-orange-950/40 border-r border-slate-800/80">
        <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:28px_28px]" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="text-2xl font-extrabold text-white">
            CIVIL <span className="text-orange-500">AT HAND</span>
          </Link>
          <div className="space-y-8 max-w-md">
            <h2 className="text-3xl font-bold text-white leading-tight">
              Choose a strong new password to keep your account secure.
            </h2>
            <ul className="space-y-4">
              {[
                { icon: ShieldCheck, text: "Protected by Firebase Authentication" },
                { icon: KeyRound, text: "This link can only be used once, for your security" },
                { icon: Sparkles, text: "Back to your dashboard in seconds" },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-300">
                  <item.icon className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} NS Construction. All rights reserved.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:hidden">
            <Link href="/" className="text-2xl font-extrabold text-white">
              CIVIL <span className="text-orange-500">AT HAND</span>
            </Link>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/40">
            {checking ? (
              <div className="flex flex-col items-center gap-3 py-10">
                <div className="relative flex h-12 w-12 items-center justify-center">
                  <span className="absolute inset-0 rounded-full border-2 border-orange-500/20" />
                  <Loader className="h-6 w-6 animate-spin text-orange-500" />
                </div>
                <p className="text-sm text-slate-400">Verifying your reset link&hellip;</p>
              </div>
            ) : done ? (
              <div className="text-center py-4">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 ring-4 ring-emerald-500/10">
                  <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                </div>
                <h1 className="text-lg font-bold text-white mb-2">Password updated</h1>
                <p className="text-sm text-slate-400 mb-6">
                  Your password has been changed successfully. Taking you to sign in in{" "}
                  <span className="text-orange-400 font-semibold">{redirectSeconds}s</span>&hellip;
                </p>
                <button
                  onClick={() => router.replace("/auth")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold py-2.5 px-5 text-sm transition"
                >
                  Sign in now
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : !validCode ? (
              <div className="text-center py-4">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 ring-4 ring-red-500/10">
                  <AlertCircle className="h-7 w-7 text-red-400" />
                </div>
                <h1 className="text-lg font-bold text-white mb-2">Link expired or invalid</h1>
                <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                  This password reset link is no longer valid. Reset links only work once and
                  expire after a while, for your security.
                </p>
                <Link
                  href="/forgot-password"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold py-2.5 px-5 text-sm transition"
                >
                  Request a new link
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="text-xs text-slate-500 mt-5">
                  Remembered it after all?{" "}
                  <Link href="/auth" className="text-orange-400 hover:text-orange-300 font-semibold">
                    Sign in instead
                  </Link>
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
                    <KeyRound className="h-6 w-6 text-orange-500" />
                  </div>
                  <h1 className="text-xl font-bold text-white">Set a new password</h1>
                  {email && (
                    <p className="text-sm text-slate-400 mt-1">
                      for <span className="text-slate-200 font-medium">{email}</span>
                    </p>
                  )}
                </div>

                {errorMsg && (
                  <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="New password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={PASSWORD_MIN_LENGTH}
                        autoFocus
                        autoComplete="new-password"
                        className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {password.length > 0 && (
                      <div className="mt-2">
                        <div className="flex gap-1">
                          {[0, 1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                i < strength.score ? strength.color : "bg-slate-800"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{strength.label}</p>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className={`w-full rounded-xl bg-slate-950 border outline-none pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-500 transition-colors ${
                        confirmPassword.length > 0 && !passwordsMatch
                          ? "border-red-500/60 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                          : "border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      }`}
                    />
                    {passwordsMatch && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold py-2.5 text-sm transition disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader className="h-4 w-4 animate-spin" /> Updating...
                      </span>
                    ) : (
                      <>
                        Update password
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>

                <p className="text-center text-xs text-slate-500 mt-6 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-600" />
                  This link only works once and expires automatically for your security.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
