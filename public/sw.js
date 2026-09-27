const CACHE_NAME = "rimuflix-static-v1";

const STATIC_ASSETS = [
  "/",
  "/styles/reset.css",
  "/styles/style.css",
  "/js/global.js",
  "/js/utils.js",
  "/img/logo.png",
  "/img/favicon.ico",
  "/img/android-chrome-192x192.png",
  "/img/android-chrome-512x512.png",
];

const IGNORED_ROUTES = [
  "/api/",
  "/admin/",
  "/video/",
  "webtor.io",
  "tmdb.org",
  "supabase",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log(
        "[Service Worker] Instalando e cacheando assets estáticos...",
      );
      return cache
        .addAll(STATIC_ASSETS)
        .catch((err) => console.warn("Erro ao fazer pré-cache", err));
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log("[Service Worker] Limpando cache antigo:", name);
            return caches.delete(name);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  const shouldIgnore = IGNORED_ROUTES.some((route) => url.href.includes(route));
  if (event.request.method !== "GET" || shouldIgnore) {
    return;
  }

  if (
    url.pathname.startsWith("/styles/") ||
    url.pathname.startsWith("/js/") ||
    url.pathname.startsWith("/img/")
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              // CLONE FEITO DE FORMA SÍNCRONA AQUI
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {});

        return cachedResponse || fetchPromise;
      }),
    );
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // CLONE FEITO DE FORMA SÍNCRONA AQUI
          const responseToCache = response.clone();
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
            return response;
          });
        })
        .catch(() => {
          console.log(
            "[Service Worker] Usuário offline, servindo página do cache.",
          );
          return caches.match(event.request);
        }),
    );
    return;
  }
});
