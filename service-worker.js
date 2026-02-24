const CACHE_NAME = 'respira-v1.3.0-winter-32'; // ← Nueva versión
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './ambient.mp3'
  // NOTA: NO añadimos aquí el vídeo ni el audio de invierno.
];

// 1. INSTALACIÓN: Guarda los archivos básicos
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Instalando nueva versión...');
  
  // FUERZA A INSTALARSE YA (Sin esperar en la cola)
  self.skipWaiting(); 

  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. ACTIVACIÓN: Limpia cachés antiguas y toma el control
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Borrando caché vieja:', key);
          return caches.delete(key);
        }
      }));
    }).then(() => {
      // FUERZA A TOMAR EL CONTROL DE LA PÁGINA YA
      return self.clients.claim();
    })
  );
});

// 3. INTERCEPTOR: Estrategia mixta
//    - index.html → red primero (siempre la versión más nueva si hay conexión)
//    - resto de assets → caché primero (más rápido, cambian menos)
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  const isHTML = url.pathname.endsWith('/') || url.pathname.endsWith('.html');

  if (isHTML) {
    // Red primero: si falla (offline), usamos la caché como respaldo
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          // Aprovechamos para actualizar la caché con la versión más reciente
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return networkResponse;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Caché primero para assets (imágenes, audio, iconos...)
    e.respondWith(
      caches.match(e.request).then((response) => {
        return response || fetch(e.request);
      })
    );
  }
});
