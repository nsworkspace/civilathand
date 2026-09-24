const CACHE = "cah-community-v1";
const SCOPE = "/community-app/";
self.addEventListener("install", (event) => { event.waitUntil(caches.open(CACHE).then((cache) => cache.add(SCOPE)).catch(() => undefined)); self.skipWaiting(); });
self.addEventListener("activate", (event) => { event.waitUntil(Promise.all([caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))), self.clients.claim()])); });
self.addEventListener("fetch", (event) => { const url = new URL(event.request.url); if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE) || event.request.method !== "GET") return; event.respondWith(fetch(event.request).then((response) => { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => undefined); return response; }).catch(() => caches.match(event.request).then((cached) => cached || caches.match(SCOPE)))); });
