/* UniDoue service worker: API hech qachon keshlanmaydi; sahifa avval tarmoqdan, oflayn boʻlsa keshdan. */
const V = 'unidoue-v79';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(['/', '/app', '/app.css', '/atlas.css', '/controls.css', '/landing.css', '/contour.svg', '/icons/icon-192.png'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return;
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok && (r.mode === 'navigate' || u.pathname.startsWith('/icons/') || u.pathname === '/app.css' || u.pathname === '/atlas.css' || u.pathname === '/controls.css' || u.pathname === '/landing.css' || u.pathname === '/contour.svg' || u.pathname === '/tiers.css')) {
        const copy = res.clone();
        caches.open(V).then(c => c.put(r, copy));
      }
      return res;
    }).catch(() => caches.match(r).then(m => m || caches.match(u.pathname.startsWith('/app') ? '/app' : '/')))
  );
});

/* ---------- Web Push: bildirishnomalar ---------- */
// Havola faqat shu saytning ichida boʻlishi kerak (server ham tekshiradi, bu — ikkinchi qatlam)
const safeUrl = u => { try { const x = new URL(u || '/app', location.origin); return x.origin === location.origin ? x.href : location.origin + '/app'; } catch (e) { return location.origin + '/app'; } };
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  // Chrome har bir push uchun bildirishnoma koʻrsatishni talab qiladi (userVisibleOnly)
  e.waitUntil(self.registration.showNotification(String(d.title || 'UniDoue').slice(0, 80), {
    body: String(d.body || '').slice(0, 240), icon: '/icons/icon-192.png', badge: '/icons/icon-192.png',
    tag: d.tag || undefined, renotify: !!d.tag, data: { url: safeUrl(d.url) }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const to = new URL(safeUrl(e.notification.data && e.notification.data.url));
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    // Shu sahifa allaqachon ochiq boʻlsa — oʻshani oldinga chiqaramiz va kerakli boʻlimga oʻtkazamiz
    const c = list.find(w => { try { return new URL(w.url).pathname === to.pathname; } catch (x) { return false; } });
    if (c) return c.focus().then(w => (w && w.url !== to.href && 'navigate' in w ? w.navigate(to.href) : w));
    return self.clients.openWindow(to.href);
  }));
});
// Brauzer obunani yangilasa (muddati tugagan, kalit almashgan) — jimgina qayta yozamiz
self.addEventListener('pushsubscriptionchange', e => {
  e.waitUntil((async () => {
    try {
      const { key } = await (await fetch('/api/push/key')).json();
      const raw = atob(key.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(key.length / 4) * 4, '='));
      const sub = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: Uint8Array.from(raw, c => c.charCodeAt(0)) });
      const j = sub.toJSON();
      await fetch('/api/push/subscribe', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: j.endpoint, keys: j.keys }) });
    } catch (x) {}
  })());
});
