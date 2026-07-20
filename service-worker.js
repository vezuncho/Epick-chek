const CACHE_NAME = 'epi-check-v20260720-menu-fix';
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./css/01-base.css",
  "./css/02-components.css",
  "./css/03-responsive.css",
  "./css/04-bottom-nav.css",
  "./css/05-mobile-safe-area.css",
  "./css/06-config-scroll.css",
  "./css/07-main-scroll.css",
  "./css/08-find-material.css",
  "./css/09-location-map.css",
  "./css/10-storage.css",
  "./css/11-supabase.css",
  "./js/01-service-worker-register.js",
  "./js/02-app-core.js",
  "./js/03-visual-polish.js",
  "./js/04-scroll-position.js",
  "./js/05-bottom-navigation.js",
  "./js/06-config-plan-scroll.js",
  "./js/07-android-back-stack.js",
  "./js/08-main-scroll.js",
  "./js/09-find-material.js",
  "./js/10-find-route-repair.js",
  "./js/11-legacy-location-highlight.js",
  "./js/12-stable-location-highlights.js",
  "./js/13-strict-location-source.js",
  "./js/14-location-selector.js",
  "./js/15-number-highlight.js",
  "./js/16-supabase-sync.js",
  "./js/17-supabase-photos.js"
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});
