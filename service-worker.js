
const CACHE_NAME='vitals-cache-v1';
const PRECACHE=['./','./index.html','./styles.css','./main.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(PRECACHE))); self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim());});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(url.origin===location.origin){ e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))); return; }
  e.respondWith(caches.match(e.request).then(cached=>{
    return fetch(e.request).then(resp=>{ const copy=resp.clone(); caches.open(CACHE_NAME).then(c=>c.put(e.request, copy)); return resp; }).catch(()=>cached);
  }));
});
