// The Zone app shell (Oct 29: served from Supabase Storage, so every path is relative to this file). Caches only the site's own files
// (the page, manifest, icons) so the app opens offline. It never caches Zone data: Supabase, Notion and every other site go to the network.
const SHELL_CACHE = "zone-shell-2026-10-30";
const BASE = new URL("./", self.location).pathname;
const PAGE = BASE + "index.html";
const SHELL = [PAGE, BASE + "manifest.webmanifest", BASE + "icons/icon-192.png", BASE + "icons/icon-512.png", BASE + "icons/icon-maskable-512.png", BASE + "icons/apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(SHELL_CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("zone-shell-") && k !== SHELL_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return; const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  if (req.mode === "navigate") { e.respondWith(fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(SHELL_CACHE).then(c => c.put(PAGE, copy)); } return res; }).catch(() => caches.match(PAGE))); return; }
  if (SHELL.includes(url.pathname)) e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});

// Oct 30: web push. The engine (zone-notify) sends {title, body, url, tag}; a tap opens the Zone (or focuses it).
self.addEventListener("push", e => { let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) { d = { title: "The Zone", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "The Zone", { body: d.body || "", tag: d.tag || "zone", icon: BASE + "icons/icon-192.png", badge: BASE + "icons/icon-192.png", data: { url: d.url || PAGE } })); });
self.addEventListener("notificationclick", e => { e.notification.close(); const url = (e.notification.data && e.notification.data.url) || PAGE;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => { for (const c of list) { if (c.url.startsWith(self.location.origin + BASE)) return c.focus(); } return self.clients.openWindow(url); })); });
