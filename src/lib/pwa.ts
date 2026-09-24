// ============================================================
// SHARED PWA INSTALL HELPERS
// PLACE AT: src/lib/pwa.ts
//
// Every "Install App" surface in the site (footer button, header
// mobile-menu button, floating InstallPrompt banner) shares this one
// set of browser-detection helpers, so behaviour is always identical
// and there is only one place to fix if a browser changes its UA.
// ============================================================

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  // iPadOS 13+ reports as "MacIntel" with touch support, so it needs its
  // own check in addition to the classic iPhone/iPad/iPod UA sniff.
  const ua = navigator.userAgent;
  const isClassicIOS = /iphone|ipad|ipod/i.test(ua);
  const isIPadOS13Plus =
    navigator.platform === "MacIntel" && typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 1;
  return isClassicIOS || isIPadOS13Plus;
}

export function isAndroid(): boolean {
  if (typeof navigator === "undefined") return false;
  return /android/i.test(navigator.userAgent);
}

// Chromium-family browsers are the ones that support installable web apps
// (native beforeinstallprompt + manual "Install app" menu item). Firefox
// and Safari (iOS or desktop) never support this, no matter how correct
// the site is.
export function isChromiumFamily(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isChromeEngine = /Chrome|Chromium|CriOS|Edg\//i.test(ua);
  const isKnownNonInstaller = /Firefox|FxiOS/i.test(ua) || (/Safari/i.test(ua) && !isChromeEngine);
  return isChromeEngine && !isKnownNonInstaller;
}

// In-app browsers (the mini-browser Instagram/Facebook/TikTok/etc. open
// links in) are real Chromium/WebKit engines, so they pass every check
// above — but they deliberately block the install API, so tapping
// "Install" silently does nothing and looks like a broken button. This
// is one of the most common real-world reasons people say "install
// isn't showing on my phone" when it works fine in the same browser
// opened normally.
export function getInAppBrowserName(): string | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "Facebook";
  if (/Instagram/i.test(ua)) return "Instagram";
  if (/Line\//i.test(ua)) return "LINE";
  if (/MicroMessenger/i.test(ua)) return "WeChat";
  if (/Twitter/i.test(ua)) return "X (Twitter)";
  if (/TikTok|musical_ly/i.test(ua)) return "TikTok";
  if (/Snapchat/i.test(ua)) return "Snapchat";
  if (/LinkedInApp/i.test(ua)) return "LinkedIn";
  if (/WhatsApp/i.test(ua)) return "WhatsApp";
  // Generic Android WebView (no browser chrome at all — apps that embed
  // a bare WebView instead of a named in-app browser).
  if (/; wv\)/i.test(ua)) return "an in-app browser";
  return null;
}

export function isUnsupportedBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  if (isIOS()) return false; // iOS has its own manual "Add to Home Screen" path, not "unsupported"
  if (getInAppBrowserName()) return false; // has its own message, not "unsupported"
  return !isChromiumFamily();
}
