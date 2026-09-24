"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  Star,
  RotateCcw,
  KeyRound,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  type UserCredential,
} from "firebase/auth";

type Mode = "signin" | "signup";
type Screen = "form" | "otp";

const PASSWORD_MIN_LENGTH = 8;
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

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

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [screen, setScreen] = useState<Screen>("form");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlMode = params.get("mode");
      if (urlMode === "signup" || urlMode === "signin") setMode(urlMode);
    }
  }, []);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const strength = useMemo(() => passwordStrength(password), [password]);

  const getRedirect = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("redirect") || "/dashboard";
    }
    return "/dashboard";
  };

  const syncProfileToDatabase = async (cred: UserCredential, displayName?: string) => {
    try {
      const idToken = await cred.user.getIdToken();
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          id: cred.user.uid,
          name: displayName ?? cred.user.displayName ?? "",
          email: cred.user.email,
        }),
      });
      const profile = await response.json().catch(() => null);
      if (response.ok && profile) {
        const existing = JSON.parse(localStorage.getItem("cah_user") || "null") || {};
        localStorage.setItem("cah_user", JSON.stringify({
          ...existing,
          ...profile,
          id: cred.user.uid,
          email: profile.email || cred.user.email,
          name: profile.name ?? displayName ?? cred.user.displayName ?? "",
          emailVerified: existing.emailVerified === true || cred.user.emailVerified,
        }));
        window.dispatchEvent(new Event("storage"));
      }
    } catch { /* Best-effort */ }
  };

  const persistLocalSession = (cred: UserCredential, displayName?: string, emailVerified = true) => {
    localStorage.setItem("cah_user", JSON.stringify({
      id: cred.user.uid,
      email: cred.user.email,
      name: displayName ?? cred.user.displayName ?? "",
      emailVerified,
    }));
    window.dispatchEvent(new Event("storage"));
  };

  const friendlyError = (code: string, fallback: string) => {
    switch (code) {
      case "auth/user-not-found": return "No account found with this email.";
      case "auth/wrong-password":
      case "auth/invalid-credential": return "Incorrect email or password.";
      case "auth/email-already-in-use": return "This email is already registered. Please switch to Sign In.";
      case "auth/invalid-email": return "That doesn't look like a valid email address.";
      case "auth/weak-password": return `Password should be at least ${PASSWORD_MIN_LENGTH} characters.`;
      case "auth/too-many-requests": return "Too many attempts. Please wait a moment and try again.";
      case "auth/popup-closed-by-user": return "Google sign-in was cancelled.";
      default: return fallback;
    }
  };

  const checkAppVerification = async (user = auth.currentUser) => {
    if (!user) return false;
    if (user.emailVerified) return true;
    const idToken = await user.getIdToken();
    const res = await fetch("/api/auth/status", {
      headers: { Authorization: `Bearer ${idToken}` },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data?.verified === true;
  };

  // ── Send OTP via server API ──────────────────────────────────────────────
  const sendOtp = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("Your session expired. Please sign in again.");
    const idToken = await currentUser.getIdToken();
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ email: email.trim(), name }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to send OTP.");
    }
  };

  // ── Google Auth ──────────────────────────────────────────────────────────
  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      persistLocalSession(cred);
      void syncProfileToDatabase(cred);
      setSuccessMsg("Signed in with Google!");
      router.replace(getRedirect());
    } catch (err: any) {
      if (err?.code === "auth/popup-blocked" || err?.code === "auth/cancelled-popup-request") {
        setErrorMsg("Popup was blocked! Please allow popups for this site.");
      } else {
        setErrorMsg(friendlyError(err?.code, "Google sign-in failed. Please try again."));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Main Form Submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === "signup") {
      if (!name.trim()) { setErrorMsg("Please enter your full name."); return; }
      if (password.length < PASSWORD_MIN_LENGTH) { setErrorMsg(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`); return; }
      if (password !== confirmPassword) { setErrorMsg("Passwords don't match."); return; }
      if (!agreeTerms) { setErrorMsg("Please agree to the Terms & Conditions and Privacy Policy."); return; }
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        // 1. Create Firebase account
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: name.trim() });
        void syncProfileToDatabase(cred, name.trim());

        // 2. Send OTP email
        await sendOtp();
        setResendCooldown(RESEND_COOLDOWN);
        setScreen("otp");
        setOtpDigits(Array(OTP_LENGTH).fill(""));
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        // Firebase verifies the email/password credentials. The app's OTP
        // verification is checked separately on the server. We never call
        // Firebase's verification-email endpoint here, so login does not
        // generate the auth/too-many-requests problem from the old flow.
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        const appVerified = await checkAppVerification(cred.user);
        if (!appVerified) {
          await sendOtp();
          setResendCooldown(RESEND_COOLDOWN);
          setScreen("otp");
          setOtpDigits(Array(OTP_LENGTH).fill(""));
          setSuccessMsg("We sent a verification code to your email.");
          setTimeout(() => otpRefs.current[0]?.focus(), 100);
          return;
        }
        persistLocalSession(cred, undefined, true);
        void syncProfileToDatabase(cred);
        setSuccessMsg("Signed in successfully!");
        router.replace(getRedirect());
      }
    } catch (err: any) {
      if (err?.code === "auth/email-already-in-use") {
        setMode("signin");
        setErrorMsg("This email is already registered. Please sign in instead.");
        setPassword(""); setConfirmPassword("");
      } else {
        setErrorMsg(friendlyError(err?.code, "Something went wrong. Please try again."));
      }
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handlers ───────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste of full OTP
      const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
      const next = [...otpDigits];
      digits.forEach((d, i) => { if (index + i < OTP_LENGTH) next[index + i] = d; });
      setOtpDigits(next);
      const nextIdx = Math.min(index + digits.length, OTP_LENGTH - 1);
      otpRefs.current[nextIdx]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, "");
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await sendOtp();
      setResendCooldown(RESEND_COOLDOWN);
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      setSuccessMsg("A new code has been sent to your email.");
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to resend code.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = otpDigits.join("");
    if (otp.length < OTP_LENGTH) { setErrorMsg("Please enter all 6 digits."); return; }

    setErrorMsg(null);
    setSuccessMsg(null);
    setOtpLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setErrorMsg("Your session expired. Please sign in again.");
        return;
      }
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ email: email.trim(), otp }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error || "Verification failed."); return; }

      // OTP correct — the custom email-ownership check is complete.
      // Do NOT send Firebase's verification email here; doing so adds a
      // second rate-limited Firebase request and was the source of the
      // auth/too-many-requests error in the old flow.
      if (auth.currentUser) {
        const user = auth.currentUser;
        await user.reload();
        persistLocalSession({ user } as UserCredential, name, true);
        const idToken = await user.getIdToken();
        void fetch("/api/user/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ id: user.uid, name: name || user.displayName || "", email: user.email }),
        }).catch(() => {});
      }
      setSuccessMsg("Email verified! Redirecting to your dashboard…");
      setTimeout(() => router.replace(getRedirect()), 900);
    } catch {
      setErrorMsg("Verification failed. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: OTP Screen
  // ══════════════════════════════════════════════════════════════════════════
  if (screen === "otp") {
    return (
      <div className="min-h-screen flex bg-slate-950">
        {/* Left panel */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-orange-950/40 border-r border-slate-800/80">
          <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:28px_28px]" />
          <div className="relative z-10 flex flex-col justify-between p-12 w-full">
            <Link href="/" className="text-2xl font-extrabold text-white">
              CIVIL <span className="text-orange-500">AT HAND</span>
            </Link>
            <div className="space-y-6 max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                <KeyRound className="h-8 w-8 text-orange-400" />
              </div>
              <h2 className="text-3xl font-bold text-white leading-tight">
                One last step to secure your account
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                We sent a 6-digit code to{" "}
                <strong className="text-orange-400">{email}</strong>.{" "}
                Enter it below to verify your email and activate your account.
              </p>
            </div>
            <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} Civil At Hand.</p>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center lg:hidden mb-6">
              <Link href="/" className="text-2xl font-extrabold text-white">
                CIVIL <span className="text-orange-500">AT HAND</span>
              </Link>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-lg border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/40">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="h-7 w-7 text-orange-400" />
                </div>
                <h1 className="text-xl font-bold text-white">Enter verification code</h1>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  We emailed a 6-digit code to{" "}
                  <span className="text-orange-400 font-semibold break-all">{email}</span>
                </p>
              </div>

              {/* Alerts */}
              {errorMsg && (
                <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* OTP input boxes */}
              <form onSubmit={handleVerifyOtp}>
                <div className="flex gap-3 justify-center mb-8">
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={OTP_LENGTH}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onFocus={(e) => e.target.select()}
                      autoComplete="one-time-code"
                      className={`w-12 h-14 text-center text-xl font-bold rounded-xl border transition-all outline-none
                        bg-slate-950 text-white
                        ${digit
                          ? "border-orange-500 shadow-[0_0_0_3px_rgba(249,115,22,0.15)]"
                          : "border-slate-700"
                        }
                        focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.2)]
                        caret-orange-500`}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={otpLoading || otpDigits.join("").length < OTP_LENGTH}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white font-semibold py-3 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpLoading ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Verify &amp; Activate Account
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Resend */}
              <div className="mt-6 text-center">
                <p className="text-xs text-slate-500 mb-2">Didn&apos;t receive the code?</p>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-400 hover:text-orange-300 disabled:text-slate-600 disabled:cursor-not-allowed transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>

              <p className="text-center text-xs text-slate-600 mt-6">
                Wrong email?{" "}
                <button
                  type="button"
                  onClick={() => { setScreen("form"); setErrorMsg(null); setSuccessMsg(null); }}
                  className="text-orange-400 hover:underline font-semibold"
                >
                  Go back
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: Main Sign In / Sign Up Form
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen flex bg-slate-950">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-orange-950/40 border-r border-slate-800/80">
        <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:28px_28px]" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="text-2xl font-extrabold text-white">
            CIVIL <span className="text-orange-500">AT HAND</span>
          </Link>
          <div className="space-y-8 max-w-md">
            <h2 className="text-3xl font-bold text-white leading-tight">
              One account for every civil engineering service, course and project.
            </h2>
            <ul className="space-y-4">
              {[
                { icon: ShieldCheck, text: "Secure sign-in backed by Firebase Authentication" },
                { icon: Building2, text: "Manage service requests, invoices and drawings in one place" },
                { icon: Star, text: "Track courses and mentorship progress" },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-300">
                  <item.icon className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} Civil At Hand. All rights reserved.</p>
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
            <div className="mb-6 text-center">
              <h1 className="text-xl font-bold text-white">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {mode === "signin" ? "Sign in to access your dashboard" : "Join Civil At Hand in under a minute"}
              </p>
            </div>

            {/* Mode toggle */}
            <div className="flex p-1 rounded-xl bg-slate-900 border border-slate-800 mb-6">
              {(["signin", "signup"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setErrorMsg(null); setSuccessMsg(null); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                    mode === m ? "bg-orange-500 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {m === "signin" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            {/* Alerts */}
            {errorMsg && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /><span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /><span>{successMsg}</span>
              </div>
            )}

            {/* Google button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-white/95 hover:bg-white text-slate-900 font-semibold py-2.5 text-sm transition disabled:opacity-60"
            >
              {googleLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09A6.98 6.98 0 0 1 5.44 12c0-.73.13-1.44.36-2.09V7.07H2.18A10.98 10.98 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Continue with Google
            </button>

            <div className="flex items-center gap-3 my-5">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-xs text-slate-500">or use your email</span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500"
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={mode === "signup" ? PASSWORD_MIN_LENGTH : undefined}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
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
                {mode === "signup" && password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${i < strength.score ? strength.color : "bg-slate-800"}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{strength.label}</p>
                  </div>
                )}
              </div>

              {mode === "signup" && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500"
                  />
                </div>
              )}

              {mode === "signin" ? (
                <div className="flex justify-end">
                  <Link href="/forgot-password" className="text-xs text-orange-400 hover:text-orange-300 font-medium">
                    Forgot password?
                  </Link>
                </div>
              ) : (
                <label className="flex items-start gap-2 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-slate-700 bg-slate-950 accent-orange-500"
                  />
                  <span>
                    I agree to the{" "}
                    <Link href="/terms-and-conditions" className="text-orange-400 hover:underline">Terms &amp; Conditions</Link>{" "}
                    and{" "}
                    <Link href="/privacy-policy" className="text-orange-400 hover:underline">Privacy Policy</Link>.
                  </span>
                </label>
              )}

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold py-2.5 text-sm transition disabled:opacity-60"
              >
                {loading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {mode === "signin" ? "Sign In" : "Create Account"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-500">
            {mode === "signin" ? "New to Civil At Hand?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErrorMsg(null); setSuccessMsg(null); }}
              className="text-orange-400 hover:text-orange-300 font-semibold"
            >
              {mode === "signin" ? "Create an account" : "Sign in instead"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
