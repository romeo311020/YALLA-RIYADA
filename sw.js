// يلا رياضة — Service Worker: يجعل الموقع قابلًا للتثبيت كتطبيق، ويعرض آخر نسخة محفوظة لو انقطع الإنترنت.
// الاستراتيجية: الشبكة أولًا (تحديثاتك تظهر فورًا)، والنسخة المحفوظة احتياطية فقط. لا نحفظ طلبات Supabase أو المباريات.
const CACHE = 'yalla-riyada-v6';
const SHELL = ['./', 'matches.html', 'news.html', 'article.html', 'store.html', 'about.html', 'styles.css', 'app.js', 'icon-192.png', 'favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => Promise.allSettled(SHELL.map((u) => c.add(u)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase وCDN والخطوط: بدون تدخل
  event.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      if (fresh.ok) { const c = await caches.open(CACHE); c.put(req, fresh.clone()); }
      return fresh;
    } catch (error) {
      const hit = await caches.match(req, { ignoreSearch: req.mode === 'navigate' });
      if (hit) return hit;
      if (req.mode === 'navigate') { const home = await caches.match('matches.html'); if (home) return home; }
      throw error;
    }
  })());
});

// ----- إشعارات الأخبار (Web Push) -----
self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { title: 'يلا رياضة', body: event.data ? event.data.text() : '' }; }
  const title = String(d.title || 'يلا رياضة').slice(0, 80);
  event.waitUntil(self.registration.showNotification(title, {
    body: String(d.body || '').slice(0, 200),
    icon: 'icon-192.png', badge: 'icon-192.png', lang: 'ar', dir: 'rtl',
    tag: d.tag || 'yr-news', renotify: true,
    data: { url: String(d.url || 'news.html') },
  }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || 'news.html', self.registration.scope).href;
  if (new URL(target).origin !== self.location.origin) return;
  event.waitUntil((async () => {
    const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) { if ('focus' in c) { try { await c.navigate(target); } catch (e) { /* ignore */ } return c.focus(); } }
    return clients.openWindow(target);
  })());
});
