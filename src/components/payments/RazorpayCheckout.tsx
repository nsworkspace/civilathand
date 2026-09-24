"use client";

// ─────────────────────────────────────────────────────────────────────
// Reusable "Pay with Razorpay" button used across the site (course
// enrollment, mentorship, client invoices, and any
// admin-created custom payment item via PaymentButton.tsx).
//
// This uses Razorpay's Orders API + Checkout ("Standard Checkout"),
// which Razorpay charges a lower fee on (~2%) than Payment Links / QR
// codes (~2.2%). The flow is:
//   1. Click → POST /api/payments/create-order (server looks up the
//      real price from the database and creates a Razorpay Order, or
//      fulfills instantly if the price is ₹0).
//   2. Open the Razorpay Checkout modal in-page (no redirect away from
//      your site) using the order id returned above.
//   3. On success, Razorpay calls our handler function with a payment
//      id + signature → we POST /api/payments/verify-order to confirm
//      it server-side and mark the item as paid.
//   4. onSuccess(...) fires so the calling page can unlock content /
//      show a confirmation / redirect, however it wants.
//
// FUTURE: to move to a different Razorpay account, you only need to
// update RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in your hosting
// provider's environment variables — nothing here changes.
// ─────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import { Loader2, ShieldCheck, LogIn } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

// Firebase restores a signed-in session asynchronously — `auth.currentUser`
// can be momentarily null on first page load even for someone who's
// actually logged in. Waiting for the first onAuthStateChanged callback
// avoids incorrectly showing "please sign in" to an already-signed-in
// visitor who just refreshed the page.
let authReadyPromise: Promise<User | null> | null = null;
function getCurrentUser(): Promise<User | null> {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  if (!authReadyPromise) {
    authReadyPromise = new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, (user) => {
        unsub();
        // Do not cache a temporary signed-out state forever. Firebase may
        // restore a session or the visitor may sign in later.
        authReadyPromise = null;
        resolve(user);
      });
    });
  }
  return authReadyPromise;
}

type CheckoutType = "course" | "mentorship" | "invoice" | "custom";

export interface RazorpayCheckoutProps {
  type: CheckoutType;
  /** slug for type="course" */
  slug?: string;
  /** invoiceId for type="invoice" */
  invoiceId?: string;
  /** itemSlug for type="custom" (see PaymentButton.tsx / admin Payments panel) */
  itemSlug?: string;
  /** Optional discount coupon code to apply — re-validated server-side. */
  offerId?: string;
  /** Optional coupon code; the server validates it again before charging. */
  couponCode?: string;
  /** Button label, e.g. "Pay ₹4,999 & Enroll" */
  label: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onSuccess?: (result: any) => void;
  onError?: (message: string) => void;
}

let scriptLoadingPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).Razorpay) return Promise.resolve();
  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("razorpay-checkout-js");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay checkout script.")));
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout script."));
    document.body.appendChild(script);
  });
  return scriptLoadingPromise;
}

function getPrefill() {
  try {
    const userJson = typeof window !== "undefined" ? localStorage.getItem("cah_user") : null;
    const user = userJson ? JSON.parse(userJson) : null;
    return {
      name: user?.name || "",
      email: user?.email || "",
      contact: user?.phone || "",
    };
  } catch {
    return { name: "", email: "", contact: "" };
  }
}

export default function RazorpayCheckout({
  type,
  slug,
  invoiceId,
  itemSlug,
  offerId,
  couponCode,
  label,
  className,
  disabled,
  onSuccess,
  onError,
}: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Tracks consecutive failures so we can offer a clearer "try again"
  // affordance instead of a one-shot dead-end button after a network blip.
  const [retryCount, setRetryCount] = useState(0);
  const [needsAuth, setNeedsAuth] = useState(false);

  const handleClick = async () => {
    if (loading || disabled) return;
    setError("");
    setNeedsAuth(false);
    setLoading(true);
    let authHeader: Record<string, string> = {};
    try {
      // Every checkout path is tied to a verified account. Free items do
      // not open Razorpay, but the server still requires sign-in so access
      // and receipts remain attached to the correct user.
      const user = await getCurrentUser();
      if (user) {
        const idToken = await user.getIdToken();
        authHeader = { Authorization: `Bearer ${idToken}` };
      }

      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ type, slug, invoiceId, itemSlug, offerId: offerId || undefined, couponCode: couponCode || undefined }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        if (orderRes.status === 401 && orderData.requiresAuth) {
          setLoading(false);
          setNeedsAuth(true);
          return;
        }
        throw new Error(orderData.error || "Could not start payment. Please try again.");
      }

      // ── Free (₹0) item — already fulfilled server-side, nothing to open. ──
      if (orderData.free) {
        setLoading(false);
        onSuccess?.(orderData);
        return;
      }

      await loadRazorpayScript();
      const prefill = getPrefill();

      const options: any = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Civil At Hand",
        description: orderData.description,
        order_id: orderData.orderId,
        prefill,
        theme: { color: "#f97316" },
        handler: async (response: any) => {
          try {
            let verifyAuthHeader: Record<string, string> = authHeader;
            try {
              const latestUser = await getCurrentUser();
              if (latestUser) {
                verifyAuthHeader = {
                  Authorization: `Bearer ${await latestUser.getIdToken(true)}`,
                };
              }
            } catch {
              // The server will reject an absent/invalid token safely.
            }
            let verifyRes: Response | null = null;
            let verifyData: any = null;

            // Razorpay can return from Checkout milliseconds before its API
            // has finished propagating the capture/order state. Retry the
            // server verification briefly instead of showing a false failure
            // immediately after a successful payment.
            for (let attempt = 0; attempt < 5; attempt += 1) {
              try {
                const latestUser = await getCurrentUser();
                if (latestUser) {
                  verifyAuthHeader = {
                    Authorization: `Bearer ${await latestUser.getIdToken(true)}`,
                  };
                }
              } catch {
                // Keep the previous verified header; the server remains authoritative.
              }

              verifyRes = await fetch("/api/payments/verify-order", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...verifyAuthHeader },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              verifyData = await verifyRes.json().catch(() => ({}));

              if (verifyData?.verified && verifyData?.paid) break;

              const retryable =
                verifyRes.status >= 500 ||
                verifyRes.status === 502 ||
                /not marked as paid|not captured|authorized|could not confirm|failed to verify|temporarily/i.test(String(verifyData?.error || ""));
              if (!retryable || attempt === 4) break;

              await new Promise((resolve) => setTimeout(resolve, 900 * (attempt + 1)));
            }

            // Final reconciliation: the payment event/entitlement in MongoDB is the
            // durable source of truth. A webhook can fulfill the payment while the
            // browser's verify response is delayed or a non-critical response write
            // fails. Never make a customer pay twice just because that response failed.
            if (!(verifyData?.verified && verifyData?.paid) && authHeader.Authorization) {
              for (let attempt = 0; attempt < 4; attempt += 1) {
                try {
                  const latestUser = await getCurrentUser();
                  const latestToken = latestUser ? await latestUser.getIdToken(true) : "";
                  if (latestToken) {
                    const purchasesRes = await fetch(
                      `/api/user/purchases?itemSlug=${encodeURIComponent(itemSlug || "")}`,
                      {
                        cache: "no-store",
                        headers: { Authorization: `Bearer ${latestToken}` },
                      }
                    );
                    const purchasesData = await purchasesRes.json().catch(() => ({}));
                    const reconciled = purchasesRes.ok &&
                      Array.isArray(purchasesData?.purchases) &&
                      purchasesData.purchases.some((purchase: any) =>
                        !purchase.refunded &&
                        (Number(purchase.amount) > 0 ||
                          (purchase.free === true && !!purchase.couponCode))
                      );
                    if (reconciled) {
                      verifyData = {
                        verified: true,
                        paid: true,
                        reconciled: true,
                        itemSlug,
                        message: "Payment received and access confirmed.",
                      };
                      break;
                    }
                  }
                } catch {
                  // Continue briefly; the webhook may still be processing.
                }
                if (attempt < 3) {
                  await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
                }
              }
            }

            setLoading(false);
            if (verifyData?.verified && verifyData?.paid) {
              onSuccess?.(verifyData);
            } else {
              const message = verifyData?.error || "Payment verification is still pending. If money was deducted, please wait a moment and refresh before paying again.";
              setError(message);
              void fetch("/api/user/payment-activity", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeader },
                body: JSON.stringify({ status: "failed", type, slug, invoiceId, itemSlug, orderId: orderData.orderId, message }),
              }).catch(() => undefined);
              onError?.(message);
            }
          } catch (e) {
            setLoading(false);
            const message = "We received the payment response but access confirmation is still pending. Please refresh your account before paying again.";
            setError(message);
            void fetch("/api/user/payment-activity", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...authHeader },
              body: JSON.stringify({ status: "failed", type, slug, invoiceId, itemSlug, orderId: orderData.orderId, message }),
            }).catch(() => undefined);
            onError?.(message);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            void fetch("/api/user/payment-activity", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...authHeader },
              body: JSON.stringify({ status: "cancelled", type, slug, invoiceId, itemSlug, orderId: orderData.orderId, message: "Checkout was closed before payment completed." }),
            }).catch(() => undefined);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (resp: any) => {
        setLoading(false);
        const message = resp?.error?.description || "Payment failed. Please try again.";
        setError(message);
        void fetch("/api/user/payment-activity", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify({
            status: "failed",
            type,
            slug,
                      invoiceId,
            itemSlug,
            orderId: orderData.orderId,
            paymentId: resp?.error?.metadata?.payment_id || null,
            errorCode: resp?.error?.code || null,
            message,
          }),
        }).catch(() => undefined);
        onError?.(message);
      });
      rzp.open();
    } catch (e: any) {
      setLoading(false);
      const message = e?.message || "Something went wrong. Please try again.";
      setError(message);
      setRetryCount((n) => n + 1);
      void fetch("/api/user/payment-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ status: "failed", type, slug, invoiceId, itemSlug, message }),
      }).catch(() => undefined);
      onError?.(message);
    }
  };

  return (
    <div>
      {needsAuth ? (
        <a
          href={`/auth?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`}
          className={className}
        >
          <LogIn className="h-4 w-4" /> Sign In to Pay & Continue
        </a>
      ) : (
        <button type="button" onClick={handleClick} disabled={loading || disabled} className={className}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Processing…
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" /> {retryCount > 0 ? "Try Again" : label}
            </>
          )}
        </button>
      )}
      {needsAuth && (
        <p className="text-xs text-slate-500 mt-2">
          Create a free account or sign in to continue — this keeps your purchases, enrollments, and receipts tied to you.
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600 mt-2" role="alert">
          {error}
          {retryCount >= 2 && " Please do not pay again until your account purchase history has been checked."}
        </p>
      )}
    </div>
  );
}
