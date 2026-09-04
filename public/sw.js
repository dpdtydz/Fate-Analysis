// Inyeon Saju PWA Service Worker (inyeon-saju-v2)
const CACHE_NAME = "inyeon-saju-v2";

const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/zodiac/space_balanced.webp",
  "/zodiac/space_metal.webp",
  "/zodiac/zodiac_rabbit_item_glasses.webp",
  "/zodiac/zodiac_dragon_item_bowtie.webp"
];

// Install Event: Pre-cache essential offline shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("PWA precache partial failure (ignored):", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clear stale cache versions
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Cache-First strategy for Zodiac graphics, Network-First for APIs
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. Pass-through API and dynamic backend routes
  if (url.pathname.startsWith("/api/") || event.request.method !== "GET") {
    return;
  }

  // 2. Cache-First with Network fallback for images (WebP/PNG/SVG)
  if (url.pathname.startsWith("/zodiac/") || /\.(webp|png|jpe?g|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        }).catch(() => {
          // Fallback if offline
          return caches.match("/zodiac/space_balanced.webp");
        });
      })
    );
    return;
  }

  // 3. Stale-While-Revalidate for SPA navigation and scripts
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return networkResponse;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
