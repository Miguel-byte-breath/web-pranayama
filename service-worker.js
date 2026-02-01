const CACHE_NAME = 'respira-v20-offline'; //
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

// 3. INTERCEPTOR: ¿Tienes internet? Pide fuera. ¿No? Sirve de la caché.
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );

});















