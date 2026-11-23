const cacheName = "fw-dental-public-v1";
const offlinePage = "/offline.html";
const publicAssets = [offlinePage, "/icons/clinic-192.png", "/icons/clinic-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(publicAssets)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("fw-dental-public-") && key !== cacheName).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate" && !url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request).catch(async () => (await caches.match(offlinePage)) ?? Response.error()));
  } else if (publicAssets.includes(url.pathname)) {
    event.respondWith(caches.match(url.pathname).then((response) => response ?? fetch(event.request)));
  }
});
