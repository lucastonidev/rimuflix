// Mude a versão aqui (ex: v2, v3) sempre que quiser forçar a limpeza e atualização
const CACHE_NAME = "rimuflix-static-v2";

const STATIC_ASSETS = [
  "/",
  "/styles/reset.css",
  "/styles/style.css",
  "/js/global.js",
  // adicione aqui os outros caminhos dos seus assets estáticos
];

// 1. INSTALAÇÃO: Salva os arquivos no cache
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Fazendo cache dos arquivos estáticos");
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  // Força o novo Service Worker a assumir o controle imediatamente
  self.skipWaiting();
});

// 2. ATIVAÇÃO: Remove os caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Se o nome do cache salvo for diferente do atual (CACHE_NAME), ele deleta
          if (cacheName !== CACHE_NAME) {
            console.log("[Service Worker] Deletando cache antigo:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  // Garante que o Service Worker controle as páginas abertas imediatamente
  self.clients.claim();
});

// 3. INTERCEPTAÇÃO DE REQUISIÇÕES (Fetch)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Retorna o cache se existir, senão busca na rede
      return cachedResponse || fetch(event.request);
    }),
  );
});
