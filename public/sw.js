/* UniDoue service worker: API hech qachon keshlanmaydi; sahifa avval tarmoqdan, oflayn boʻlsa keshdan. */
const V = 'unidoue-v14';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(['/', '/app', '/app.css', '/icons/icon-192.png'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return;
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok && (r.mode === 'navigate' || u.pathname.startsWith('/icons/') || u.pathname === '/app.css')) {
        const copy = res.clone();
        caches.open(V).then(c => c.put(r, copy));
      }
      return res;
    }).catch(() => caches.match(r).then(m => m || caches.match(u.pathname.startsWith('/app') ? '/app' : '/')))
  );
});
