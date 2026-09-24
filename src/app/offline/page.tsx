import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff, RefreshCw } from "lucide-react";

export const metadata: Metadata = {
  title: "You're Offline | Civil At Hand",
  robots: { index: false, follow: false },
};

// Static, dependency-free fallback so it can be precached by the
// service worker and always render even with no network connection.
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-wix-gray px-4 py-24 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
        <WifiOff className="h-8 w-8 text-orange-500" />
      </div>
      <h1 className="font-display text-2xl md:text-3xl font-extrabold uppercase text-wix-dark mb-3">
        You&apos;re Offline
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-slate-500 mb-8">
        It looks like you&apos;ve lost your internet connection. Please check your network and try
        again — some pages you&apos;ve already visited may still be available.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-orange-500 px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-orange-600"
        >
          <RefreshCw className="h-4 w-4" /> Try Again
        </a>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-700 transition-all hover:bg-slate-50"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}
