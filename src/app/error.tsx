"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw, Home } from "lucide-react";

// Next.js renders this automatically whenever a page (or anything it
// renders) throws at runtime. Without this file, users would see Next's
// raw unstyled error screen — not something a real business should ship.
// This never leaks internal error details to visitors; it only logs them
// to the browser console for debugging.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <main className="flex-grow flex items-center justify-center px-4 py-24 bg-wix-gray">
      <div className="text-center max-w-lg">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-extrabold text-wix-dark uppercase mt-2 mb-3">
          Something Went Wrong
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed mb-8">
          We hit an unexpected error loading this page. It has been logged — please try again,
          or head back to the homepage.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold uppercase text-xs tracking-wider px-6 py-3 transition"
          >
            <RotateCw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 hover:border-slate-400 text-slate-700 font-bold uppercase text-xs tracking-wider px-6 py-3 transition"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
