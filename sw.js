const CACHE_NAME = "sajiloqr-v2";

// Bump CACHE_NAME above on every content update. The activate handler
// below deletes any cache that doesn't match it, so old assets are purged.

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./about.html",
  "./blog.html",
  "./contact.html",
  "./privacy.html",
  "./styles.css",
  "./script.js",
  "./manifest.json",
  "./guides/how-to-create-a-qr-code.html",
  "./guides/wifi-qr-code.html",
  "./guides/how-qr-codes-work.html",
  "./guides/qr-codes-for-restaurants.html",
  "./guides/qr-code-vs-barcode.html",
  "./guides/qr-code-printing-best-practices.html",
  "./guides/qr-code-safety.html",
  "./images/qr-code-50.png",
  "./images/icon-192.png",
  "./images/icon-512.png",
  "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js",
  "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Pages: network-first so deployed HTML is always fresh when online.
  // Cache is only the fallback for offline use.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("./index.html"))
        )
    );
    return;
  }

  // Static assets: stale-while-revalidate (cache-first, update in background).
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
