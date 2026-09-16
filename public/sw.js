// Inyeon Saju PWA Service Worker (inyeon-saju-v4)
const CACHE_NAME = "inyeon-saju-v4";

const PRECACHE_ASSETS = [
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

// Activate Event: Clear stale cache versions immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 0. Only handle http and https requests (Ignore chrome-extension://, moz-extension://, data:, blob:, etc.)
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // 1. Pass-through API and dynamic backend routes
  if (url.pathname.startsWith("/api/") || event.request.method !== "GET") {
    return;
  }

  // 2. Navigation / HTML requests: Network-First (CRITICAL: prevents stale index.html ChunkLoadError)
  const isNavigate = event.request.mode === "navigate" || url.pathname === "/" || url.pathname.endsWith(".html");
  if (isNavigate) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback only when network fails
          return caches.match(event.request).then((cached) => cached || caches.match("/"));
        })
    );
    return;
  }

  // 3. Cache-First with Network fallback for static images (WebP/PNG/SVG)
  if (url.pathname.startsWith("/zodiac/") || /\.(webp|png|jpe?g|svg|ico|woff2?|ttf)$/i.test(url.pathname)) {
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
          return caches.match("/zodiac/space_balanced.webp");
        });
      })
    );
    return;
  }

  // 4. Stale-While-Revalidate for other static assets (CSS, JS)
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
