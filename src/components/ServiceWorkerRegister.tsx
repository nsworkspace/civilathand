"use client";

import { useEffect } from "react";

// Registers the service worker and keeps it fresh by checking for
// updates on route changes and activating a waiting worker as soon as
// one is found (the app itself is not versioned per-page, so there is
// no need to prompt the user — the new SW takes over silently on the
// next navigation).
//
// BUG FIX: this used to skip registration entirely outside production
// (`next build && next start` / a real deploy). That meant no service
// worker ever ran while testing with `next dev`, and — since Chrome
// only offers the install prompt (and the Footer/InstallPrompt "Install
// App" buttons only have anything to trigger) once an active service
// worker is registered — the app never appeared as installable and the
// buttons only showed manual instructions instead of a real one-tap
// install. Registering unconditionally fixes that: it now installs
// correctly in `next dev` too, not just in production.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let refreshing = false;

    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // If an update is already waiting, activate it.
        if (registration.waiting) {
          registration.waiting.postMessage("SKIP_WAITING");
        }

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              newWorker.postMessage("SKIP_WAITING");
            }
          });
        });

        // Periodically check for a new service worker version.
        const interval = setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 60 * 1000);
        return () => clearInterval(interval);
      })
      .catch(() => {
        // Registration failures should never break the app.
      });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
