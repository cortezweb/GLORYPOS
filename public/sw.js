const CACHE_NAME = 'glorypos-v5';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png'
];

// Guarda también el JS y CSS que pide index.html (nombres con hash de cada despliegue).
// Así la app abre sin conexión desde la primera visita, no recién desde la segunda.
async function precache() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(ASSETS_TO_CACHE);
  try {
    const html = await (await fetch('/index.html', { cache: 'no-store' })).text();
    const assets = [...new Set(html.match(/\/assets\/[\w.-]+\.(?:js|css)/g) || [])];
    await cache.addAll(assets);
  } catch {
    // Sin red durante la instalación: se completará en la próxima visita
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // 1. Network-First para documentos HTML / navegación
  // Garantiza que al desplegar en Cloudflare Pages, los celulares reciban la última versión de inmediato
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        // Sin red: la última versión guardada de la página (no la de la instalación)
        .catch(async () => (await caches.match(event.request)) || (await caches.match('/')) || caches.match('/index.html'))
    );
    return;
  }

  // 2. Cache-First para assets estáticos con fallback a red
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (
          !networkResponse ||
          networkResponse.status !== 200 ||
          networkResponse.type !== 'basic'
        ) {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
