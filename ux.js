/* يلا رياضة — طبقة تجربة الاستخدام: شاشة بداية، شريط تحميل، إشعارات، حالة الاتصال، حالات فاضية/خطأ مرسومة. */
(() => {
  'use strict';
  if (window.__yrUx) return; window.__yrUx = true;
  const root = document.documentElement; const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LOGO = '<svg viewBox="0 0 128 128" aria-hidden="true"><rect width="128" height="128" rx="30" fill="#07140d"/><path d="M32 40L64 78M96 40L64 78M64 78V106" stroke="#fff" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="64" cy="37" r="12.5" fill="#c6ff3d"/></svg>';

  // ---------- شاشة البداية (مرة في الجلسة) ----------
  let seen = false; try { seen = sessionStorage.getItem('yr-splash') === '1'; } catch { /* اختياري */ }
  if (!seen && !reduce) {
    const sp = document.createElement('div'); sp.id = 'yr-splash'; sp.setAttribute('aria-hidden', 'true');
    sp.innerHTML = `<div class="sp-in"><div class="sp-logo">${LOGO}</div><b>يلا رياضة</b><small>YALLA RIYADA</small><div class="sp-bar"><i></i></div></div>`;
    root.appendChild(sp); root.classList.add('yr-splashing');
    const t0 = Date.now(); let gone = false;
    const hide = () => { if (gone) return; gone = true; const wait = Math.max(0, 650 - (Date.now() - t0)); setTimeout(() => { sp.classList.add('out'); root.classList.remove('yr-splashing'); setTimeout(() => sp.remove(), 450); try { sessionStorage.setItem('yr-splash', '1'); } catch { /* اختياري */ } }, wait); };
    if (document.readyState === 'complete') hide(); else addEventListener('load', hide, { once: true });
    setTimeout(hide, 2600);
  }

  // ---------- شريط تقدّم التنقّل ----------
  const bar = document.createElement('div'); bar.id = 'yr-nav'; bar.setAttribute('aria-hidden', 'true'); bar.innerHTML = '<i></i>'; root.appendChild(bar);
  let tm = 0;
  const startBar = () => { clearTimeout(tm); bar.className = 'on'; tm = setTimeout(() => bar.classList.add('long'), 1500); };
  addEventListener('pageshow', () => { bar.className = ''; });
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href]'); if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    try { const u = new URL(a.href, location.href); if (u.origin !== location.origin || (u.pathname === location.pathname && u.search === location.search)) return; startBar(); } catch { /* تجاهل */ }
  });

  // ---------- إشعارات صغيرة ----------
  let host = null;
  const ensureHost = () => { if (!host) { host = document.createElement('div'); host.id = 'yr-toasts'; host.setAttribute('role', 'status'); host.setAttribute('aria-live', 'polite'); document.body.appendChild(host); } return host; };
  const ICON = { ok: '✓', err: '!', info: 'i', warn: '!' };
  window.yrToast = (msg, kind = 'info', ms = 3200) => {
    const mk = () => { const t = document.createElement('div'); t.className = `yr-toast ${kind}`; t.innerHTML = `<i aria-hidden="true">${ICON[kind] || 'i'}</i><span></span>`; t.lastChild.textContent = String(msg); ensureHost().appendChild(t); requestAnimationFrame(() => t.classList.add('in')); setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, ms); };
    if (document.body) mk(); else addEventListener('DOMContentLoaded', mk, { once: true });
  };

  // ---------- حالة الاتصال ----------
  let off = null;
  const showOffline = () => {
    if (off || !document.body) return;
    off = document.createElement('div'); off.id = 'yr-off'; off.setAttribute('role', 'alert');
    off.innerHTML = '<span class="dot" aria-hidden="true"></span><b>مفيش اتصال بالإنترنت</b><span>هنعرض آخر بيانات محفوظة لحد ما يرجع.</span><button type="button">إعادة المحاولة</button>';
    off.querySelector('button').addEventListener('click', () => { if (navigator.onLine) location.reload(); else window.yrToast('لسه مفيش اتصال، اتأكد من الواي فاي أو البيانات.', 'warn'); });
    document.body.appendChild(off); requestAnimationFrame(() => off.classList.add('in'));
  };
  const hideOffline = () => { if (!off) return; const o = off; off = null; o.classList.remove('in'); setTimeout(() => o.remove(), 300); };
  const sync = () => { if (navigator.onLine === false) showOffline(); };
  addEventListener('offline', showOffline);
  addEventListener('online', () => { hideOffline(); window.yrToast('رجع الاتصال ✓ بنحدّث البيانات…', 'ok'); document.dispatchEvent(new CustomEvent('yr-online')); });
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', sync, { once: true }); else sync();
  try { const c = navigator.connection; if (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ''))) addEventListener('load', () => window.yrToast('الاتصال بطيء شوية، ممكن التحميل ياخد وقت.', 'warn', 4500), { once: true }); } catch { /* اختياري */ }

  // ---------- حالات فاضية/خطأ مرسومة ----------
  const ART = {
    matches: '<svg viewBox="0 0 120 90" aria-hidden="true"><rect x="14" y="18" width="92" height="58" rx="10" class="a"/><path d="M60 18v58M14 47h92" class="b"/><circle cx="60" cy="47" r="12" class="b"/><circle cx="60" cy="47" r="2.6" class="c"/></svg>',
    search: '<svg viewBox="0 0 120 90" aria-hidden="true"><circle cx="52" cy="40" r="24" class="a"/><path d="M70 58l22 22" class="b" stroke-width="7"/><path d="M42 40h20M52 30v20" class="b"/></svg>',
    offline: '<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M20 38a56 56 0 0180 0M32 52a38 38 0 0156 0M46 66a18 18 0 0128 0" class="b"/><circle cx="60" cy="78" r="3.5" class="c"/><path d="M22 14l76 68" class="d"/></svg>',
    error: '<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M60 14L106 76H14z" class="a"/><path d="M60 38v20" class="b" stroke-width="6"/><circle cx="60" cy="67" r="3.5" class="c"/></svg>',
    trophy: '<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M42 14h36v22a18 18 0 01-36 0z" class="a"/><path d="M42 20H28v6a12 12 0 0014 12M78 20h14v6a12 12 0 01-14 12" class="b"/><path d="M60 54v14M46 78h28" class="b"/></svg>',
  };
  window.yrEmpty = (kind, title, text, action) => `<div class="yr-empty ${kind}">${ART[kind] || ART.matches}<b>${title}</b>${text ? `<p>${text}</p>` : ''}${action || ''}</div>`;
})();

/* شريط التحميل العلوي: يظهر لما أي طلب بيانات ياخد أكتر من لحظة، ويكمّل لوحده */
(() => {
  let n = 0, bar = null, v = 0, tm = null, show = null;
  const el = () => bar || (bar = Object.assign(document.createElement('div'), { id: 'yr-bar', innerHTML: '<i></i>' }), bar.setAttribute('role', 'progressbar'), bar.setAttribute('aria-label', 'جارٍ التحميل'), document.body.appendChild(bar), bar);
  const set = (x) => { v = x; el().firstChild.style.transform = `scaleX(${x})`; };
  const begin = () => { if (n++ > 0) return; show = setTimeout(() => { el().classList.add('on'); set(0.12); tm = setInterval(() => set(v + (0.9 - v) * 0.12), 250); }, 180); };
  const end = () => { if (--n > 0) return; n = 0; clearTimeout(show); clearInterval(tm); if (!bar || !bar.classList.contains('on')) return; set(1); setTimeout(() => { bar.classList.remove('on'); setTimeout(() => set(0), 300); }, 220); };
  window.yrBar = { begin, end, wrap: (pr) => { begin(); return Promise.resolve(pr).finally(end); } };
})();
