const CACHE_NAME = 'epicheck-v1';
const URLS_TO_CACHE = [
  '/epi-check/',
  '/epi-check/index.html',
  '/epi-check/manifest.json'
];

// ── Instalación: guarda en caché los archivos principales ──────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

// ── Activación: limpia cachés antiguas ─────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: sirve desde caché si está disponible (modo offline) ─────────────
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

// ── Push: recibe notificaciones del servidor ───────────────────────────────
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'EPI-Check';
  const options = {
    body:    data.body    || 'Tienes alertas pendientes.',
    icon:    data.icon    || '/epi-check/icon-192.png',
    badge:   data.badge   || '/epi-check/icon-192.png',
    tag:     data.tag     || 'epicheck-alert',
    data:    { url: data.url || '/epi-check/' },
    actions: [
      { action: 'open',    title: 'Ver alertas' },
      { action: 'dismiss', title: 'Ignorar'     }
    ],
    requireInteraction: true
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Clic en notificación: abre la app ─────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const urlToOpen = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/epi-check/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      // Si ya hay una ventana abierta, la enfoca
      for (const client of list) {
        if (client.url.includes('/epi-check/') && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abre una nueva
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});

// ── Sincronización en segundo plano (para notificaciones programadas) ──────
self.addEventListener('sync', event => {
  if (event.tag === 'check-alerts') {
    event.waitUntil(checkAndNotify());
  }
});

async function checkAndNotify() {
  // Lee los datos del inventario desde un endpoint o cache
  // En esta implementación las notificaciones las lanza la propia app al abrirse
  return Promise.resolve();
}
