// يلا رياضة — Service Worker: يجعل الموقع قابلًا للتثبيت كتطبيق، ويعرض آخر نسخة محفوظة لو انقطع الإنترنت.
// الاستراتيجية: الشبكة أولًا (تحديثاتك تظهر فورًا)، والنسخة المحفوظة احتياطية فقط. لا نحفظ طلبات Supabase أو المباريات.
const CACHE = 'yalla-riyada-v3';
const NET_TIMEOUT = 5000; // لو الشبكة بطيئة أكثر من 5 ثواني نعرض النسخة المحفوظة بدل شاشة تحميل لا تنتهي
const SHELL = ['./', 'matches.html', 'news.html', 'store.html', 'about.html', 'styles.css', 'app.js', 'icon-192.png', 'favicon.svg'];

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
    const network = fetch(req).then((fresh) => {
      if (fresh.ok) { const copy = fresh.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); }
      return fresh;
    });
    try {
      const cached = await caches.match(req, { ignoreSearch: req.mode === 'navigate' });
      if (!cached) return await network; // لا توجد نسخة محفوظة: ننتظر الشبكة عادي
      return await Promise.race([network, new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), NET_TIMEOUT))]);
    } catch (error) {
      const hit = await caches.match(req, { ignoreSearch: req.mode === 'navigate' });
      if (hit) return hit;
      if (req.mode === 'navigate') { const home = await caches.match('matches.html'); if (home) return home; }
      throw error;
    }
  })());
});
