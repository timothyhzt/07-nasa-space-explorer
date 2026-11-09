const CACHE_NAME = "space-explorer-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./js/dateRange.js",
  "./manifest.json",
  "./img/nasa-worm-logo.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Cachingapp shell");
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
        .map((key) => {
          console.log("[Service Worker] Removing old cache:", key);
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isApiCall = url.hostname === "api.nasa.gov";

  if (isApiCall) {
    event.respondWith(networkFirst(event.request));
  }
  else {
    event.respondWith(cacheFirst(event.request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (err) {
    console.error("[Service Worker] Network failed, trying cache for:", request.url);
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}