/* يلا رياضة — عدّاد زيارات خفيف: صفحة واحدة مرة في الجلسة + زائر واحد في اليوم. مفيش أي بيانات شخصية. */
(() => {
  'use strict';
  const page = ((location.pathname.split('/').pop() || 'index.html').replace(/\.html$/i, '') || 'index').toLowerCase();
  if (/^(admin|password-reset)$/.test(page)) return;
  try { if (navigator.doNotTrack === '1') return; } catch { /* تجاهل */ }
  const get = (s, k) => { try { return s.getItem(k); } catch { return null; } };
  const set = (s, k, v) => { try { s.setItem(k, v); } catch { /* تجاهل */ } };
  const today = new Date().toISOString().slice(0, 10);
  const jobs = [];
  if (!get(sessionStorage, 'yr-pv:' + page)) { set(sessionStorage, 'yr-pv:' + page, '1'); jobs.push(page); }
  if (get(localStorage, 'yr-vd') !== today) { set(localStorage, 'yr-vd', today); jobs.push('_visitor'); }
  if (!jobs.length) return;
  const cfg = () => new Promise((res) => {
    if (window.YR_SUPABASE_URL) return res(true);
    const s = document.createElement('script'); s.src = 'supabase-config.js'; s.onload = () => res(Boolean(window.YR_SUPABASE_URL)); s.onerror = () => res(false); document.head.appendChild(s);
  });
  const go = async () => {
    if (!(await cfg()) || /PASTE_/.test(window.YR_SUPABASE_URL + window.YR_SUPABASE_PUBLISHABLE_KEY)) return;
    for (const p of jobs) {
      try { await fetch(window.YR_SUPABASE_URL + '/rest/v1/rpc/track_visit', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', apikey: window.YR_SUPABASE_PUBLISHABLE_KEY, Authorization: 'Bearer ' + window.YR_SUPABASE_PUBLISHABLE_KEY }, body: JSON.stringify({ p_page: p }) }); } catch { /* تجاهل */ }
    }
  };
  if (document.readyState === 'complete') setTimeout(go, 1200); else window.addEventListener('load', () => setTimeout(go, 1200));
})();
