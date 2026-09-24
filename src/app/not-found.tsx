import React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Home, ArrowRight } from "lucide-react";
import { ProjectProvider } from "@/context/ProjectContext";

export default function NotFound() {
  return (
    <ProjectProvider>
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <main className="flex-grow flex items-center justify-center px-4 py-24 bg-wix-gray">
          <div className="text-center max-w-lg">
            <p className="font-display text-7xl md:text-8xl font-extrabold text-orange-500">404</p>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-wix-dark uppercase mt-4 mb-3">Page Not Found</h1>
            <p className="text-sm text-slate-500 leading-relaxed mb-8">
              The page you are looking for has moved or no longer exists. Let&apos;s get you back on track.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/" className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 text-xs uppercase tracking-widest rounded-md transition-all">
                <Home className="h-4 w-4" /> Back to Home
              </Link>
              <Link href="/education" className="inline-flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold px-6 py-3 text-xs uppercase tracking-widest rounded-md transition-all">
                Explore Learning <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </ProjectProvider>
  );
}
