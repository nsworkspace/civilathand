"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { auth } from "@/lib/firebase";
import { Footer } from "@/components/Footer";
import { CheckCircle2, XCircle, Loader2, ArrowLeft, ReceiptText } from "lucide-react";

type VerifyState = "checking" | "success" | "failed" | "no-params";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerifyState>("checking");
  const [message, setMessage] = useState<string>("");
  const [invoiceId, setInvoiceId] = useState<string>("");
  const [kind, setKind] = useState<string>("invoice");

  useEffect(() => {
    const razorpay_payment_id = searchParams.get("razorpay_payment_id");
    const razorpay_payment_link_id = searchParams.get("razorpay_payment_link_id");
    const razorpay_payment_link_reference_id = searchParams.get("razorpay_payment_link_reference_id");
    const razorpay_payment_link_status = searchParams.get("razorpay_payment_link_status");
    const razorpay_signature = searchParams.get("razorpay_signature");

    if (
      !razorpay_payment_id ||
      !razorpay_payment_link_id ||
      !razorpay_payment_link_reference_id ||
      !razorpay_payment_link_status ||
      !razorpay_signature
    ) {
      setState("no-params");
      return;
    }

    setInvoiceId(razorpay_payment_link_reference_id);

    (async () => {
      const token = auth.currentUser ? await auth.currentUser.getIdToken().catch(() => "") : "";
      const res = await fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        razorpay_payment_id,
        razorpay_payment_link_id,
        razorpay_payment_link_reference_id,
        razorpay_payment_link_status,
        razorpay_signature,
      }),
      });
      return res.json();
    })()
      .then((data) => {
        if (data.verified && data.paid) {
          setState("success");
          setKind(data.kind || "invoice");

          if (data.kind === "invoice" && !data.updated) {
            setMessage("Payment verified, but we couldn't automatically match it to an invoice. Our team will update it shortly.");
          }

          // Entitlements are server-side and account-bound. Never grant a
          // browser-only unlock flag from a payment redirect.
        } else {
          setState("failed");
          setMessage(data.error || "We couldn't verify this payment.");
        }
      })
      .catch((err) => {
        console.error("Error verifying payment:", err);
        setState("failed");
        setMessage("Something went wrong while verifying your payment.");
      });
  }, [searchParams]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      <main className="flex-grow flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
          {state === "checking" && (
            <>
              <Loader2 className="h-12 w-12 text-orange-500 animate-spin mx-auto mb-4" />
              <h1 className="text-lg font-extrabold text-navy-950">Verifying your payment…</h1>
              <p className="text-sm text-slate-500 mt-2">Please wait a moment, don't close this page.</p>
            </>
          )}

          {state === "success" && (
            <>
              <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto mb-4" />
              <h1 className="text-xl font-extrabold text-navy-950">Payment Successful!</h1>
              {kind === "invoice" && invoiceId && (
                <p className="text-xs text-slate-500 mt-2 flex items-center justify-center gap-1">
                  <ReceiptText className="h-3.5 w-3.5" /> Invoice #{invoiceId.toUpperCase()}
                </p>
              )}
              {message && <p className="text-xs text-amber-600 mt-3 bg-amber-50 border border-amber-200 rounded-lg p-2.5">{message}</p>}

              {kind === "invoice" && (
                <p className="text-sm text-slate-600 mt-4">Thank you! Your invoice has been marked as paid.</p>
              )}
              {kind === "course" && (
                <p className="text-sm text-slate-600 mt-4">Thank you for enrolling! Our team will reach out shortly with your course access details.</p>
              )}

              {kind === "mentorship" && (
                <p className="text-sm text-slate-600 mt-4">Welcome aboard! Our mentorship team will contact you within 24 hours to get started.</p>
              )}

              <Link
                href={kind === "mentorship" ? "/mentorship" : kind === "course" ? "/education/courses" : "/dashboard"}
                className="inline-flex items-center gap-1.5 mt-6 bg-navy-950 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> {kind === "mentorship" ? "Back to Mentorship" : kind === "course" ? "Back to Courses" : "Go to Dashboard"}
              </Link>
            </>
          )}

          {state === "failed" && (
            <>
              <XCircle className="h-14 w-14 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-extrabold text-navy-950">Payment Verification Failed</h1>
              <p className="text-sm text-slate-600 mt-2">{message}</p>
              <p className="text-xs text-slate-500 mt-3">
                If money was deducted, please don't worry — contact us with your payment details and we'll resolve it.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 mt-6 bg-slate-100 hover:bg-slate-200 text-navy-950 font-bold px-5 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
              </Link>
            </>
          )}

          {state === "no-params" && (
            <>
              <XCircle className="h-14 w-14 text-slate-300 mx-auto mb-4" />
              <h1 className="text-lg font-extrabold text-navy-950">No Payment Info Found</h1>
              <p className="text-sm text-slate-500 mt-2">This page is meant to be opened via a Razorpay payment redirect.</p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 mt-6 bg-slate-100 hover:bg-slate-200 text-navy-950 font-bold px-5 py-2.5 rounded-lg text-xs uppercase tracking-wider transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Go to Dashboard
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-screen bg-slate-50 items-center justify-center">
          <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
