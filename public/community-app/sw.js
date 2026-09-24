const VERSION = "cah-community-v2";
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;
const APP_SCOPE = "/community-app/";
const PRECACHE = [APP_SCOPE];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith("cah-community-") && key !== STATIC_CACHE && key !== PAGE_CACHE)
        .map((key) => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

function isPrivateRequest(url) {
  return url.pathname.startsWith("/api/") || url.pathname.startsWith("/community/auth");
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(APP_SCOPE) || isPrivateRequest(url)) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, { cache: "no-store" });
        const cache = await caches.open(PAGE_CACHE);
        await cache.put(request, response.clone());
        return response;
      } catch {
        const cached = await caches.match(request);
        return cached || caches.match(APP_SCOPE);
      }
    })());
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch {
        return Response.error();
      }
    })());
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
