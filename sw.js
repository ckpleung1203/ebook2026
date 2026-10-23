/* 全球賺錢趨勢 2026 — offline reader service worker */
const CACHE = 'ebook2026-v86';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './cover.jpg'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => caches.open(CACHE))
      .then((c) => c.addAll(CORE))   // self-heal: make sure every core asset is present
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      if (hit) {
        // refresh copy in background when online
        fetch(e.request).then((resp) => {
          if (resp && resp.ok) caches.open(CACHE).then((c) => c.put(e.request, resp.clone()));
        }).catch(() => {});
        return hit;
      }
      return fetch(e.request).then((resp) => {
        if (resp && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return resp;
      }).catch(() => caches.match('./index.html').then((r) => r || caches.match('./')));
    })
  );
});
