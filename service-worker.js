const CACHE_VERSION='epi-check-aceptar-cabecera-20260723-v1';
const APP_SHELL=['./manifest.json','./icon-192.png','./icon-512.png','./js/17-supabase-photos.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_VERSION).then(async c=>{for(const u of APP_SHELL){try{await c.add(u)}catch(_){}}}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE_VERSION).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request,{cache:'no-store'}).catch(()=>caches.match('./index.html')));return}e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)))});
