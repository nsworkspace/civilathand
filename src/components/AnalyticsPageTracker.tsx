"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AnalyticsPageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Private/admin control areas must never be included in public analytics.
    const excluded = pathname === "/cah-expert-control" || pathname.startsWith("/cah-expert-control/") || pathname === "/private" || pathname.startsWith("/private/");
    if (typeof window !== "undefined" && !excluded) {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "visit", page: pathname }),
      }).catch(() => {});
    }
  }, [pathname]);

  return null; // This component does not render anything
}
