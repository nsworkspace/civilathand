"use client";

import React, { useState } from "react";
import { Download, Check, Share, Info, ExternalLink } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { isIOS, isUnsupportedBrowser, getInAppBrowserName } from "@/lib/pwa";

// Always-visible "Install App" entry point for the footer. Unlike the
// floating InstallPrompt (which only appears once Chrome fires
// beforeinstallprompt, and can be dismissed), this gives users a permanent
// way to install — and when there is no native prompt available yet, it
// shows accurate, browser-specific next steps instead of a generic message
// that doesn't apply to the browser/device they're actually using.
export function FooterInstallApp() {
  const { canPrompt, installed, promptInstall } = useInstallPrompt();
  const [showHelp, setShowHelp] = useState(false);
  const inAppBrowser = getInAppBrowserName();

  const handleClick = async () => {
    if (canPrompt) {
      await promptInstall();
      return;
    }
    setShowHelp((v) => !v);
  };

  if (installed) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
        <Check className="h-3.5 w-3.5" /> App Installed
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 rounded-md bg-orange-500 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-orange-600 cursor-pointer"
      >
        <Download className="h-3.5 w-3.5" /> Install App
      </button>

      {showHelp && (
        <div className="absolute bottom-full left-0 mb-2 w-72 rounded-lg border border-slate-700 bg-wix-dark p-3 text-xs text-slate-300 shadow-premium-lg z-20">
          {inAppBrowser ? (
            <>
              <p className="mb-1 flex items-center gap-1.5 font-bold text-white">
                <ExternalLink className="h-3.5 w-3.5" /> Open in your browser
              </p>
              <p>
                You&apos;re viewing this inside the {inAppBrowser} app, which blocks installing
                websites as apps. Tap the <strong>⋮</strong> or <strong>•••</strong> menu in{" "}
                {inAppBrowser} and choose &quot;Open in Chrome&quot; (or your default browser),
                then look for the install option there.
              </p>
            </>
          ) : isIOS() ? (
            <>
              <p className="mb-1 flex items-center gap-1.5 font-bold text-white">
                <Share className="h-3.5 w-3.5" /> Add to Home Screen
              </p>
              <p>On iPhone/iPad, Safari does not allow an in-page install button. Tap the Share icon at the bottom of Safari, then choose &quot;Add to Home Screen&quot;.</p>
            </>
          ) : isUnsupportedBrowser() ? (
            <>
              <p className="mb-1 flex items-center gap-1.5 font-bold text-white">
                <Info className="h-3.5 w-3.5" /> Not supported in this browser
              </p>
              <p>Installing apps from websites only works in Chrome, Edge, Brave or Opera. Open this site in one of those to install it.</p>
            </>
          ) : (
            <>
              <p className="mb-1 flex items-center gap-1.5 font-bold text-white">
                <Info className="h-3.5 w-3.5" /> Install not offered yet
              </p>
              <p>
                Look for an install icon (⊕ or a small monitor) in the address bar, or open the
                browser menu (⋮) and choose &quot;Install app&quot; / &quot;Add to Home
                screen&quot;. If you don&apos;t see it, browse a page or two first — Chrome
                waits for a little engagement before offering install, and it won&apos;t offer it
                again if you&apos;ve already dismissed it recently.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
