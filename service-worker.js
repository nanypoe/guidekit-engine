const CACHE_NAME = "guidekit-shell-v7";
const SHELL = [
  "./",
  "./index.html",
  "./viewer.html",
  "./builder/index.html",
  "./builder/builder.js",
  "./manifest.json",
  "./src/styles.css",
  "./src/hub.js",
  "./src/viewer.js",
  "./src/data.js",
  "./src/ui.js",
  "./src/validation.js",
  "./src/modules/index.js",
  "./src/modules/manifest.json",
  "./src/components/index.js",
  "./src/components/manifest.json",
  "./src/app-manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }))
  );
});
