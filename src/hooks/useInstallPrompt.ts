"use client";

// ============================================================
// SHARED INSTALL-PROMPT HOOK
// PLACE AT: src/hooks/useInstallPrompt.ts
//
// Captures the native `beforeinstallprompt` event once (the browser only
// ever fires it once per page load, and only to the first listener that
// calls preventDefault() early enough), and exposes it to every
// "Install App" button in the site — footer, header mobile menu, and the
// floating banner — so whichever one the user taps actually works,
// instead of only the first-mounted component getting a live prompt.
// ============================================================

import { useCallback, useEffect, useState } from "react";
import { BeforeInstallPromptEvent, isStandaloneDisplay } from "@/lib/pwa";

// Module-level (not component-level) so it survives across every
// component that mounts this hook, and so a prompt captured by one
// component is usable by another that mounts later.
let sharedDeferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<(event: BeforeInstallPromptEvent | null) => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    sharedDeferredPrompt = event as BeforeInstallPromptEvent;
    listeners.forEach((listener) => listener(sharedDeferredPrompt));
  });
  window.addEventListener("appinstalled", () => {
    sharedDeferredPrompt = null;
    listeners.forEach((listener) => listener(null));
  });
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(sharedDeferredPrompt);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isStandaloneDisplay());
    setDeferredPrompt(sharedDeferredPrompt);

    const onChange = (event: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(event);
      if (!event) setInstalled(isStandaloneDisplay());
    };
    listeners.add(onChange);

    const onAppInstalled = () => setInstalled(true);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      listeners.delete(onChange);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return "unavailable" as const;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    sharedDeferredPrompt = null;
    setDeferredPrompt(null);
    return outcome;
  }, [deferredPrompt]);

  return { canPrompt: !!deferredPrompt, installed, promptInstall };
}
