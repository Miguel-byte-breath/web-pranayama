const CACHE_NAME = 'respira-v3.0.3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/ambient.mp3',
  '/nadi-assets/mage_dertap_izqinh.png',
  '/nadi-assets/mage_dertap_izqexh.png',
  '/nadi-assets/mage_izqtap_derinh.png',
  '/nadi-assets/mage_izqtap_derexh.png',
  '/nadi-assets/mage_izqtap_dertap.png'
  // NOTA: NO añadimos aquí el vídeo ni el audio de invierno.
];

// 1. INSTALACIÓN
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Instalando nueva version...');
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. ACTIVACIÓN: Limpia cachés antiguas y toma el control
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Borrando cache vieja:', key);
          return caches.delete(key);
        }
      }));
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 3. MENSAJE DESDE LA PÁGINA
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 4. INTERCEPTOR: Estrategia mixta
//    - HTML, JS, CSS -> red primero (codigo fresco con conexion, cache offline)
//    - imagenes, audio, iconos -> cache primero (cambian poco, pesan mucho)
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  const isHTML = url.pathname === '/' || url.pathname.endsWith('.html');
  const isCore = url.pathname.endsWith('.js') || url.pathname.endsWith('.css');

  if (isHTML || isCore) {
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
    // Cache primero para assets pesados (imagenes, audio, iconos)
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(e.request).then((networkResponse) => {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, cl