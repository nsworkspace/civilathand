// NS Construction — Service Worker
// Strategy:
//  - App shell / offline fallback page is precached on install.
//  - Static assets (Next build output, icons, images, fonts) use a
//    cache-first strategy since they are hashed/immutable.
//  - HTML page navigations use a network-first strategy so users always
//    get the latest content when online, falling back to a cached copy
//    of the page (or the offline page) when the network is unavailable.
//  - Everything else (API routes, admin/auth/account routes) is never
//    cached and always goes straight to the network — this app has
//    live/private data that must not be served stale.

const SW_VERSION = "cah-v1";
const STATIC_CACHE = `${SW_VERSION}-static`;
const PAGES_CACHE = `${SW_VERSION}-pages`;
const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"];

// Never cache or intercept these — always go straight to the network.
const NEVER_CACHE_PREFIXES = ["/api/", "/cah-expert-control", "/auth", "/dashboard", "/profile"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("cah-") && !key.startsWith(SW_VERSION))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

function isNeverCached(pathname) {
  return NEVER_CACHE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isStaticAsset(request, url) {
  if (url.pathname.startsWith("/_next/static/")) return true;
  if (url.pathname.startsWith("/icons/")) return true;
  return ["style", "script", "font", "image"].includes(request.destination);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isNeverCached(url.pathname)) return;

  // HTML navigations: network-first, cached copy / offline page fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          const cache = await caches.open(PAGES_CACHE);
          cache.put(request, response.clone());
          return response;
        } catch {
          const cache = await caches.open(PAGES_CACHE);
          const cached = await cache.match(request);
          return cached || (await caches.match(OFFLINE_URL));
        }
      })()
    );
    return;
  }

  // Static, hashed build assets: cache-first.
  if (isStaticAsset(request, url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return cached || Response.error();
        }
      })()
    );
  }
});

// Allow the page to trigger immediate activation of a waiting SW
// (used by the update-available prompt in ServiceWorkerRegister).
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
