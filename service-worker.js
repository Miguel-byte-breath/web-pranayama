const CACHE_NAME = 'respira-v1-offline';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './ambient.mp3'
];

// 1. INSTALACIÓN: Guarda los archivos básicos
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Instalando y cacheando...');
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. ACTIVACIÓN: Limpia cachés antiguas si subes de versión
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
});

// 3. INTERCEPTOR: ¿Tienes internet? Pide fuera. ¿No? Sirve de la caché.
self.addEventListener('fetch', (e) => {
  // Estrategia: Cache First, falling back to Network
  // (Primero busca en casa, si no está, sale a buscar fuera)
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request).catch(() => {
          // Si falla internet y no está en caché, no hacemos nada (o mostramos error)
          // Aquí es donde la magia ocurre: la app carga aunque estés en un avión.
      });
    })
  );
});