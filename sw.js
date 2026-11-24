// Staging PWA only: scope and cache do not overlap production service worker.
const CACHE = 'planner-test-v6';
const ASSETS = ['./','./index.html','./manifest.json','./css/style.css','./js/db.js','./js/auth.js','./js/day.js','./js/habits.js','./js/week.js','./js/month.js','./js/profile.js','./js/test-bootstrap.js','./js/app.js','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('planner-test-')&&k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{
  if(e.request.method==='GET' && e.request.url.startsWith(self.registration.scope)){
    e.respondWith(caches.match(e.request).then(cached=>cached || fetch(e.request)));
  }
});