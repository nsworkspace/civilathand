"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Gift,
  IndianRupee,
  Loader2,
  LockKeyhole,
  LogIn,
  ShieldCheck,
  Sparkles,
  Tag,
  WalletCards,
  XCircle,
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import RazorpayCheckout from "./RazorpayCheckout";

interface Offer {
  id: string;
  title: string;
  description?: string;
  discountedAmount: number;
  discountAmount: number;
  originalAmount: number;
  endsAt?: string | null;
}

interface Item {
  slug: string;
  title: string;
  description?: string;
  amount: number;
  buttonLabel: string;
  successMessage: string;
  category?: string;
  owned?: boolean;
  offer?: Offer | null;
}

export interface PaymentButtonProps {
  itemSlug: string;
  onUnlocked?: (result: any) => void;
  showDetails?: boolean;
  className?: string;
  fallback?: React.ReactNode;
}

const money = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const amountOf = (value: unknown) => Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0);

export default function PaymentButton({
  itemSlug,
  onUnlocked,
  showDetails = true,
  className,
  fallback = null,
}: PaymentButtonProps) {
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<{
    code: string;
    discountAmount: number;
    discountedAmount: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const callbackRef = useRef(onUnlocked);

  useEffect(() => {
    callbackRef.current = onUnlocked;
  }, [onUnlocked]);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setNotFound(false);
      setError("");
      setCouponApplied(null);
      setCouponCode("");
      setCouponError("");

      const headers: Record<string, string> = {};
      try {
        if (authUser) {
          const token = await authUser.getIdToken();
          if (token) headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // The server remains the source of truth for authentication and price.
      }

      try {
        const response = await fetch(`/api/payment-items/${encodeURIComponent(itemSlug)}`, {
          cache: "no-store",
          headers,
        });
        if (!response.ok) throw new Error("Payment item unavailable");
        const data = await response.json();
        if (cancelled) return;

        setItem(data);
        if (data.accessible) {
          setUnlocked(true);
          setSuccess(
            Number(data.amount) === 0
              ? "Free access is enabled for your account."
              : data.successMessage || "Already purchased — access is linked to your account.",
          );
          callbackRef.current?.({ owned: !!data.owned, free: Number(data.amount) === 0, itemSlug });
        } else {
          setUnlocked(false);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [authReady, authUser, itemSlug]);

  const category = useMemo(() => {
    if (item?.category === "course") return "course";
    if (item?.category === "mentorship") return "mentorship";
    return "custom";
  }, [item?.category]);

  const originalAmount = amountOf(item?.amount);
  const isFree = originalAmount === 0;
  const autoOffer = item?.offer && amountOf(item.offer.discountedAmount) < originalAmount ? item.offer : null;
  const offerAmount = autoOffer ? Math.min(originalAmount, amountOf(autoOffer.discountedAmount)) : originalAmount;
  const payable = couponApplied ? Math.min(offerAmount, amountOf(couponApplied.discountedAmount)) : offerAmount;
  const savings = Math.max(0, originalAmount - payable);
  const savingsPercent = originalAmount > 0 ? Math.round((savings / originalAmount) * 100) : 0;

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code || !item) {
      setCouponError("Enter a coupon code.");
      return;
    }

    setCouponLoading(true);
    setCouponError("");
    setError("");

    try {
      const response = await fetch("/api/payments/check-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ code, category, baseAmount: offerAmount }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.valid) {
        setCouponApplied(null);
        setCouponError(data.error || "This coupon is not valid for this purchase.");
        return;
      }

      setCouponApplied({
        code: data.code || code,
        discountAmount: Math.max(0, amountOf(data.discountAmount)),
        discountedAmount: Math.max(0, amountOf(data.discountedAmount)),
      });
    } catch {
      setCouponError("Unable to validate the coupon. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponCode("");
    setCouponError("");
    setError("");
  };

  if (loading) {
    return (
      <div className={`inline-flex min-w-0 items-center gap-2 text-sm text-slate-500 ${className || ""}`}>
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        <span className="truncate">Loading secure payment…</span>
      </div>
    );
  }

  if (notFound || !item) return <>{fallback}</>;

  if (unlocked) {
    return (
      <div className={`w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 ${className || ""}`}>
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white">
            <Check className="h-4 w-4" />
          </span>
          <span className="min-w-0">{success || item.successMessage || "Payment received successfully."}</span>
        </span>
      </div>
    );
  }

  let verifiedCached = false;
  try {
    if (typeof window !== "undefined") {
      const cached = JSON.parse(localStorage.getItem("cah_user") || "null");
      verifiedCached = cached?.emailVerified === true && cached?.id === authUser?.uid;
    }
  } catch {
    verifiedCached = false;
  }

  if (isFree && !authUser?.emailVerified && !verifiedCached) {
    return (
      <div className={`w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className || ""}`}>
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Gift className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              {showDetails && <p className="truncate text-sm font-extrabold text-slate-900">{item.title}</p>}
              <p className="mt-0.5 text-xs font-semibold text-emerald-700">Free access</p>
            </div>
          </div>
          {showDetails && item.description && <p className="mt-3 text-xs leading-5 text-slate-500">{item.description}</p>}
        </div>
        <div className="space-y-3 p-4 sm:p-5">
          <div className="rounded-xl bg-emerald-50 px-3.5 py-3 text-xs font-semibold leading-5 text-emerald-800">
            Verify your account once to unlock this free resource.
          </div>
          <a
            href={`/auth?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <LogIn className="h-4 w-4" />
            Sign in to continue
          </a>
        </div>
      </div>
    );
  }

  const checkoutLabel = isFree
    ? item.buttonLabel || "Get free access"
    : `Pay ${money(payable)}`;

  return (
    <section
      aria-label="Secure payment"
      className={`mx-auto w-full max-w-xl min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className || ""}`}
    >
      <header className="min-w-0 border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
            <WalletCards className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 inline-flex max-w-full items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              Secure checkout
            </div>
            {showDetails && (
              <>
                <h3 className="break-words text-base font-bold leading-6 text-slate-950 sm:text-lg">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="mt-1 break-words text-xs leading-5 text-slate-500 sm:text-sm">
                    {item.description}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <div className="min-w-0 px-4 py-4 sm:px-6 sm:py-5">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-4 py-2 text-sm">
            <span className="text-slate-500">Original price</span>
            <span className={savings > 0 ? "font-medium text-slate-400 line-through" : "font-semibold text-slate-900"}>
              {money(originalAmount)}
            </span>
          </div>

          {autoOffer && !couponApplied && savings > 0 && (
            <div className="flex min-w-0 items-center justify-between gap-4 py-2 text-sm">
              <span className="flex min-w-0 items-center gap-1.5 text-emerald-700">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{autoOffer.title || "Offer"}</span>
              </span>
              <span className="shrink-0 font-semibold text-emerald-700">− {money(originalAmount - offerAmount)}</span>
            </div>
          )}

          {couponApplied && (
            <div className="flex min-w-0 items-center justify-between gap-4 py-2 text-sm">
              <span className="flex min-w-0 items-center gap-1.5 text-emerald-700">
                <Tag className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Coupon {couponApplied.code}</span>
              </span>
              <span className="shrink-0 font-semibold text-emerald-700">− {money(couponApplied.discountAmount)}</span>
            </div>
          )}

          <div className="mt-2 flex min-w-0 items-end justify-between gap-4 border-t border-slate-200 pt-4">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">Total to pay</p>
              {savings > 0 && !isFree && (
                <p className="mt-1 text-xs font-medium text-emerald-700">
                  You save {money(savings)}{savingsPercent ? ` · ${savingsPercent}%` : ""}
                </p>
              )}
            </div>
            <p className="shrink-0 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {isFree ? "FREE" : money(payable)}
            </p>
          </div>
        </div>

        {!isFree && (
          <div className="mt-5 min-w-0">
            <button
              type="button"
              aria-expanded={couponOpen}
              aria-controls="payment-coupon-panel"
              onClick={() => {
                setCouponOpen((open) => !open);
                setCouponError("");
              }}
              className="flex min-h-11 w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Tag className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="truncate">{couponApplied ? `Coupon ${couponApplied.code} applied` : "Have a coupon?"}</span>
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${couponOpen ? "rotate-180" : ""}`} />
            </button>

            {couponOpen && (
              <div id="payment-coupon-panel" className="mt-2 min-w-0">
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                  <label htmlFor="payment-coupon-code" className="sr-only">Coupon code</label>
                  <input
                    id="payment-coupon-code"
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value.toUpperCase().replace(/\s/g, ""))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void applyCoupon();
                      }
                    }}
                    placeholder="Enter coupon code"
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    disabled={!!couponApplied}
                    className="min-h-11 min-w-0 w-full flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold uppercase tracking-wide text-slate-900 outline-none transition placeholder:normal-case placeholder:tracking-normal focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50 sm:min-w-0"
                  />
                  {couponApplied ? (
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="min-h-11 shrink-0 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void applyCoupon()}
                      disabled={couponLoading || !couponCode.trim()}
                      className="min-h-11 shrink-0 rounded-lg bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {couponLoading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Apply"}
                    </button>
                  )}
                </div>
                {couponError && (
                  <p role="alert" className="mt-2 break-words text-xs font-medium leading-5 text-red-600">
                    {couponError}
                  </p>
                )}
                {couponApplied && (
                  <p className="mt-2 break-words text-xs font-medium leading-5 text-emerald-700">
                    Coupon verified. Your updated total is {money(couponApplied.discountedAmount)}.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {!authUser?.emailVerified && !verifiedCached && (
          <div className="mt-5 flex min-w-0 items-start gap-2.5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-600">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <p className="min-w-0">
              Sign in with a verified email before checkout. Your purchase and receipt stay linked to your account.
            </p>
          </div>
        )}

        <div className="mt-5 min-w-0">
          <RazorpayCheckout
            type={category}
            slug={category === "course" ? item.slug.replace(/^course-/i, "") : undefined}
            itemSlug={item.slug}
            offerId={couponApplied ? undefined : autoOffer?.id}
            couponCode={couponApplied?.code}
            label={
              <span className="flex min-w-0 items-center justify-center gap-2">
                <WalletCards className="h-4 w-4 shrink-0" />
                <span className="truncate">{checkoutLabel}</span>
              </span>
            }
            className="flex min-h-12 w-full min-w-0 items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-14"
            onSuccess={(result) => {
              setUnlocked(true);
              setSuccess(item.successMessage || "Payment received successfully.");
              callbackRef.current?.(result);
            }}
            onError={setError}
          />
        </div>

        {error && (
          <div role="alert" className="mt-3 min-w-0 break-words rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium leading-5 text-red-700">
            {error}
          </div>
        )}

        <div className="mt-4 flex min-w-0 items-start gap-2 border-t border-slate-100 pt-4 text-[11px] leading-4 text-slate-400">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p className="min-w-0">
            Price is verified on the server before payment. Payment details are handled securely by Razorpay.
          </p>
        </div>
      </div>
    </section>
  );
}
