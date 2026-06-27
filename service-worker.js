const CACHE_NAME = 'respira-v1.5.2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/ambient.mp3'
  // NOTA: NO añadimos aquí el vídeo ni el audio de invierno.
];

// 1. INSTALACIÓN: Guarda los archivos básicos
//    ⚠️  SIN skipWaiting(): el nuevo SW espera a que todas las
//    pestañas cierren antes de activarse. Esto evita que Chrome
//    invalide la instalación de la PWA durante un deploy.
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Instalando nueva versión...');
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
      return self.clients.claim();
    })
  );
});

// 3. MENSAJE DESDE LA PÁGINA: permite actualización controlada
//    La página puede enviar { type: 'SKIP_WAITING' } cuando el
//    usuario confirme que quiere actualizar.
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 4. INTERCEPTOR: Estrategia mixta
//    - index.html / raíz → red primero (siempre la versión más nueva si hay conexión)
//    - resto de assets  → caché primero (más rápido, cambian menos)
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  const isHTML = url.pathname === '/' || url.pathname.endsWith('.html');

  if (isHTML) {
    // Red primero: si falla (offline), usamos la caché como respaldo
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
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
