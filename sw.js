/* 완도 섬 부동산 — 오프라인에서도 열리게: 화면은 캐시 우선, 매물 데이터는 최신 우선 */
const CACHE = "wando-v23";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (u.pathname.endsWith("listings.json")) {            // 매물: 네트워크 먼저, 안 되면 마지막 저장본
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(u.origin + u.pathname, c)); return r; })
      .catch(() => caches.match(u.origin + u.pathname)));
    return;
  }
  if (u.origin !== location.origin) return;
  if (e.request.mode === "navigate" || u.pathname.endsWith(".html") || u.pathname.endsWith("/")) {   // 화면: 항상 최신 → 안 되면 저장본
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./#/alert";
  e.waitUntil(clients.matchAll({ type: "window" }).then(ws => { for (const w of ws) { if ("focus" in w) { w.navigate(url); return w.focus(); } } return clients.openWindow(url); }));
});
