// SERVICE WORKER v1.4.0
// Gestión de caché para PWA Respira con soporte Winter

const CACHE_NAME = 'respira-v1.4.0';

// Archivos esenciales (se cachean en instalación)
const ESSENTIAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './ambient.mp3'
];

// Archivos opcionales grandes (se cachean bajo demanda)
const OPTIONAL_ASSETS = [
  './winter.mp4',
  './winter_audio.mp3'
];

// 1. INSTALACIÓN: Cachea archivos esenciales
self.addEventListener('install', (e) => {
  console.log('[SW v1.4.0] Instalando...');
  
  // Fuerza instalación inmediata
  self.skipWaiting();

  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cacheando archivos esenciales');
      return cache.addAll(ESSENTIAL_ASSETS);
    })
  );
});

// 2. ACTIVACIÓN: Limpia cachés antiguas y toma control
self.addEventListener('activate', (e) => {
  console.log('[SW v1.4.0] Activando...');
  
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Borrando caché antigua:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Tomando control de la página');
      return self.clients.claim();
    })
  );
});

// 3. FETCH: Estrategia Network First con Cache Fallback
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  
  // Solo cachear recursos de nuestro dominio
  if (url.origin !== location.origin) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Si la respuesta es válida, cachearla
        if (response && response.status === 200) {
          const responseClone = response.clone();
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar servir desde caché
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] Sirviendo desde caché:', e.request.url);
            return cachedResponse;
          }
          
          // Si no está en caché y es HTML, devolver index
          if (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// 4. MENSAJE: Permite forzar actualización desde la app
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    console.log('[SW] Forzando actualización inmediata');
    self.skipWaiting();
  }
});




















