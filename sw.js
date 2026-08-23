const CACHE_NAME = "doomed-offline-v1.0.5";

const PRECACHE_URLS = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "doom-cover.png",
  "manifest.webmanifest",
  ".nojekyll",
  "engine/chocolate-doom.js",
  "engine/chocolate-doom.wasm",
  "engine/chocolate-doom.data",
  "icons/icon-16.png",
  "icons/icon-32.png",
  "icons/icon-48.png",
  "icons/icon-128.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "_locales/es/messages.json",
  "_locales/en/messages.json",
  "_locales/pt_BR/messages.json",
  "_locales/fr/messages.json",
  "_locales/de/messages.json",
  "_locales/it/messages.json",
  "_locales/ja/messages.json",
  "_locales/ko/messages.json",
  "_locales/zh_CN/messages.json"
];

self.addEventListener("install", (event) => {
  console.log("[SW] Installing DOOM Offline Cache:", CACHE_NAME);
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Safe precache each item individually
      for (const url of PRECACHE_URLS) {
        try {
          const resp = await fetch(url, { cache: "reload" });
          if (resp.ok) {
            await cache.put(url, resp);
          }
        } catch (err) {
          console.warn("[SW] Precache skipped for:", url, err);
        }
      }
    })
  );
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating DOOM Cache:", CACHE_NAME);
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Purging old cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Cache-First with Network fallback & Navigation offline fallback
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // If navigating to any page (HTML document request)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((networkResp) => {
          if (networkResp && networkResp.status === 200) {
            const clone = networkResp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResp;
        })
        .catch(async () => {
          // Offline navigation fallback: serve cached index.html or root
          const match = await caches.match(event.request, { ignoreSearch: true })
            || await caches.match("./", { ignoreSearch: true })
            || await caches.match("index.html", { ignoreSearch: true });
          if (match) return match;
          return new Response("DOOM Offline Ready", { headers: { "Content-Type": "text/html" } });
        })
    );
    return;
  }

  // Cache-First for all static assets (wasm, data, scripts, css, images, fonts, locales)
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((resp) => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return resp;
        })
        .catch(() => {
          return caches.match(event.request, { ignoreSearch: true });
        });
    })
  );
});
