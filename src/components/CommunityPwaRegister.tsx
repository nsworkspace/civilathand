"use client";

import { useEffect } from "react";

export default function CommunityPwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/community-app/sw.js", { scope: "/community-app/" }).catch(() => {});
  }, []);
  return null;
}
