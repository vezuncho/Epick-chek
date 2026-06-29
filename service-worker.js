const CACHE_NAME = 'epicheck-v4';

// Instalación: sin precache
self.addEventListener('install', event => {
    self.skipWaiting();
});

// Activación: limpia cachés antiguas
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: SIEMPRE red primero, caché solo si falla la red (offline)
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Guardar copia fresca en caché
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            })
            .catch(() => {
                // Solo usa caché si no hay red
                return caches.match(event.request);
            })
    );
});

// Push notifications
self.addEventListener('push', event => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'EPI-Check';
    const options = {
        body: data.body || 'Tienes alertas pendientes.',
        icon: '/Epick-chek/icon-192.png',
        badge: '/Epick-chek/icon-192.png',
        tag: data.tag || 'epicheck-alert',
        data: { url: '/Epick-chek/' },
        requireInteraction: true
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

// Clic en notificación
self.addEventListener('notificationclick', event => {
    event.notification.close();
    if (event.action === 'dismiss') return;
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
            for (const client of list) {
                if (client.url.includes('/Epick-chek/') && 'focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow('/Epick-chek/');
        })
    );
});
