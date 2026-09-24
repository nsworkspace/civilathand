export const dynamic = "force-dynamic";

const CACHE = "cah-community-v1";

export async function GET() {
  const body = `const CACHE='${CACHE}';self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).catch(()=>null))});self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim())});self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(u.origin!==location.origin||u.pathname.startsWith('/api/'))return;if(event.request.method!=='GET')return;event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));});`;
  return new Response(body, { headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-store", "Service-Worker-Allowed": "/community-app/" } });
}
