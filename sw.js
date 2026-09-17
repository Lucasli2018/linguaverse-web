// LinguaVerse Service Worker (P3: 离线可安装)
const CACHE = "lv-v1";
const ASSETS = ["/", "/index.html", "/manifest.webmanifest", "/icon.svg", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // 后端 API 永远走网络，不缓存
  if (url.pathname.startsWith("/api/")) return;
  // 导航请求：网络优先，失败回退缓存的 index.html（离线壳）
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }
  // 静态资源：缓存优先，回源并写入缓存
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(rr => {
      const cp = rr.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return rr;
    }).catch(() => caches.match("/index.html")))
  );
});
