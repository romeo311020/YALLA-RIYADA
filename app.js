// يلا رياضة — السكربت المشترك: الهيدر/الفوتر، شريط الموبايل، الثيم.
// المباريات تُحمّل من Supabase Edge Function في supabase-football.js.
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const store = {
    get(k, d = null) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* التخزين غير متاح — لا مشكلة */ } },
  };
  const readJson = (k, d) => { try { return JSON.parse(store.get(k, '') || 'null') ?? d; } catch { return d; } };

  const contact = 'https://romeo311020.github.io/Romany-Profile/';
  const current = location.pathname.split('/').pop() || 'matches.html';

  /* ---------- الشعار (يتبدّل لونه مع الثيم) ---------- */
  const mark = '<svg class="mark" viewBox="0 0 128 128" aria-hidden="true"><rect class="m-bg" width="128" height="128" rx="30"/><path class="m-fg" d="M32 40L64 78M96 40L64 78M64 78V106" fill="none" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><circle class="m-ball" cx="64" cy="37" r="12.5"/></svg>';
  const brand = `<a class="brand" href="matches.html" aria-label="يلا رياضة — المباريات">${mark}<span><b>يلا رياضة</b><small>YALLA RIYADA</small></span></a>`;

  /* ---------- الثيم: فاتح (افتراضي) / داكن ---------- */
  const root = document.documentElement;
  const applyTheme = (t) => {
    if (t === 'dark') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', 'light');
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', t === 'dark' ? '#000000' : '#ffffff'));
  };
  applyTheme(store.get('yr-theme') === 'dark' ? 'dark' : 'light'); // الافتراضي: الوضع الفاتح

  /* ---------- الهيدر ---------- */
  const nav = [
    ['matches.html', 'المباريات'], ['news.html', 'الأخبار'], ['store.html', 'المتجر'], ['account.html', 'حسابي'],
  ];
  const header = $('shared-header');
  if (header) {
    header.innerHTML = `<header class="header"><div class="wrap nav">${brand}
      <nav id="nav" aria-label="القائمة الرئيسية">${nav.map(([u, t]) => `<a class="${current === u ? 'active' : ''}" ${current === u ? 'aria-current="page"' : ''} href="${u}">${t}</a>`).join('')}<a href="${contact}" target="_blank" rel="noopener noreferrer">تواصل معنا ↗</a></nav>
      <button class="icon-btn" id="theme" type="button" aria-label="تبديل الوضع الفاتح/الداكن"></button>
      <button class="icon-btn menu" id="menu" type="button" aria-label="القائمة" aria-expanded="false">☰</button></div></header>`;
    const themeBtn = $('theme');
    const paintTheme = () => { themeBtn.textContent = root.getAttribute('data-theme') === 'light' ? '☾' : '☀'; };
    paintTheme();
    themeBtn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next); store.set('yr-theme', next); paintTheme();
    });
    $('menu').addEventListener('click', (e) => {
      const open = $('nav').classList.toggle('open');
      e.currentTarget.setAttribute('aria-expanded', String(open));
    });
  }

  /* ---------- الدخول المطلوب (مشغّل المباريات والطلبات للأعضاء فقط) ---------- */
  window.yrLogin = (label) => {
    try { localStorage.setItem('yr-next', location.pathname.split('/').pop() + location.search); } catch { /* لا مشكلة */ }
    location.href = 'account.html';
  };
  window.yrLockBox = (title, text) => `<div class="lock-box"><span class="lock-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10.5" width="16" height="10" rx="3"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg></span><h3>${title}</h3><p>${text}</p><button type="button" class="btn primary" data-yr-login>سجّل دخولك الآن</button><small>التسجيل مجاني ويستغرق ثواني.</small></div>`;
  document.addEventListener('click', (e) => { if (e.target.closest('[data-yr-login]')) window.yrLogin(); });

  /* ---------- روابط التواصل الاجتماعي (تظهر في الفوتر وصفحة حسابي) ---------- */
  const SOCIALS = [
    { id: 'whatsapp', name: 'قناة واتساب', note: 'أخبار ومباريات أول بأول', url: 'https://whatsapp.com/channel/0029VbDWnn24dTnGwIUrTz0G', c: '#25d366',
      icon: '<path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.7-5.2A8.5 8.5 0 1 1 21 11.5z"/><path d="M9 8.8c.3 2.6 2.6 4.9 5.2 5.2l1.2-1.3-2-1-.9.7a4.4 4.4 0 0 1-1.7-1.7l.7-.9-1-2z"/>' },
    { id: 'youtube', name: 'يوتيوب', note: '@YALLA-RIYADA', url: 'https://www.youtube.com/@YALLA-RIYADA', c: '#ff2d3d',
      icon: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10 9.2v5.6l5-2.8z" fill="currentColor"/>' },
    { id: 'tiktok', name: 'تيك توك', note: '@yalla_riyada', url: 'https://www.tiktok.com/@yalla_riyada', c: '#25f4ee',
      icon: '<path d="M14 3v11.2a3.7 3.7 0 1 1-3.7-3.7"/><path d="M14 3c.4 2.4 1.9 3.9 4.5 4.2"/>' },
  ];
  const socialCards = () => `<div class="follow-grid">${SOCIALS.map((s, i) => `<a class="follow-card" style="--c:${s.c};--i:${i}" href="${s.url}" target="_blank" rel="noopener noreferrer" aria-label="${s.name}">
      <span class="follow-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${s.icon}</svg></span>
      <span class="follow-txt"><b>${s.name}</b><small dir="ltr">${s.note}</small></span><span class="follow-go" aria-hidden="true">↗</span></a>`).join('')}</div>`;
  const socialDots = () => `<div class="follow-dots" role="group" aria-label="تابعنا">${SOCIALS.map((s, i) => `<a class="follow-dot" style="--c:${s.c};--i:${i}" href="${s.url}" target="_blank" rel="noopener noreferrer" aria-label="${s.name}" title="${s.name}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${s.icon}</svg></a>`).join('')}</div>`;
  const followHost = $('follow-us');
  if (followHost) followHost.innerHTML = `<div class="follow-box"><div class="follow-head"><span class="kicker">FOLLOW US</span><h3>تابعنا على السوشيال</h3><p class="note">كل جديد في المباريات والأخبار والعروض.</p></div>${socialCards()}</div>`;

  /* ---------- الفوتر ---------- */
  const footer = $('shared-footer');
  if (footer) {
    footer.innerHTML = `<footer class="footer"><div class="wrap foot">${brand}
      <div class="foot-links"><a href="matches.html">المباريات</a><a href="news.html">الأخبار</a><a href="store.html">المتجر</a><a href="about.html">عن المنصة</a><a href="${contact}" target="_blank" rel="noopener noreferrer">تواصل معنا</a></div>
      <div class="follow-foot"><span>تابعنا</span>${socialDots()}</div>
      <div class="credit">تصميم وتطوير <a href="${contact}" target="_blank" rel="noopener noreferrer">Romany Garges</a></div>
      <small class="copyright">© ${new Date().getFullYear()} YALLA RIYADA</small></div></footer>`;
  }

  /* ---------- شريط التنقل السفلي (موبايل) ---------- */
  const ico = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const tabs = [
    ['matches.html', 'المباريات', ico('<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 5h-5L8 10z"/>')],
    ['news.html', 'الأخبار', ico('<path d="M4 5h13a1 1 0 0 1 1 1v13H6a2 2 0 0 1-2-2z"/><path d="M18 9h2v8a2 2 0 0 1-2 2"/><path d="M8 9h6M8 13h6"/>')],
    ['store.html', 'المتجر', ico('<path d="M6 8h12l-1 12H7z"/><path d="M9 8a3 3 0 0 1 6 0"/>')],
    ['account.html', 'حسابي', ico('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>')],
  ];
  const tabbar = document.createElement('nav');
  tabbar.className = 'tabbar';
  tabbar.setAttribute('aria-label', 'التنقل السريع');
  const activeIndex = Math.max(0, tabs.findIndex(([u]) => u === current || (current === 'match.html' && u === 'matches.html') || (current === 'product.html' && u === 'store.html')));
  tabbar.innerHTML = `<div class="tab-track" style="--n:${tabs.length}"><i class="tab-pill" aria-hidden="true"></i>${tabs.map(([u, t, i], k) => `<a href="${u}" class="${k === activeIndex ? 'active' : ''}" ${k === activeIndex ? 'aria-current="page"' : ''}>${i}<span>${t}</span></a>`).join('')}</div>`;
  document.body.appendChild(tabbar);
  // المؤشر ينزلق من التبويب السابق إلى الحالي (نتذكّر مكانه بين الصفحات)
  const pill = tabbar.querySelector('.tab-pill');
  const prev = Number(store.get('yr-tab-prev', activeIndex));
  pill.style.setProperty('--i', Number.isFinite(prev) ? prev : activeIndex);
  requestAnimationFrame(() => requestAnimationFrame(() => pill.style.setProperty('--i', activeIndex)));
  store.set('yr-tab-prev', String(activeIndex));

  /* ---------- زر رجوع داخل الموقع (صفحات التفاصيل) ---------- */
  const parents = { 'match.html': ['matches.html', 'المباريات'], 'product.html': ['store.html', 'المتجر'] };
  if (parents[current]) {
    const [href, label] = parents[current];
    const main = document.querySelector('main');
    const a = document.createElement('a');
    a.className = 'back'; a.href = href; a.textContent = `→ رجوع إلى ${label}`;
    a.addEventListener('click', (e) => {
      // لو جاء المستخدم من صفحة داخل نفس الموقع نرجع خطوة واحدة (يحفظ مكانه)، وإلا نذهب للصفحة الأم.
      try { if (document.referrer && new URL(document.referrer).origin === location.origin) { e.preventDefault(); history.back(); } } catch { /* نكمل بالرابط العادي */ }
    });
    main?.prepend(a);
  }
})();

/* مشغّل المباراة المشترك (للمباريات اليدوية ومباريات الـ API) */
window.yrMountPlayer = function (url, title) {
  const player = document.getElementById('match-player'); const box = document.getElementById('match-player-frame'); const bar = document.getElementById('match-player-bar');
  const actions = document.getElementById('match-actions');
  if (!player || !box) return null;
  const build = () => {
    const frame = document.createElement('iframe');
    frame.src = url; frame.title = title || 'مشغّل المباراة';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true; frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.sandbox = 'allow-scripts allow-same-origin allow-presentation';
    const load = document.createElement('div'); load.className = 'pf-load'; load.innerHTML = '<i></i><span>جارٍ تحميل البث…</span>';
    box.replaceChildren(frame, load);
    const done = () => load.remove(); frame.addEventListener('load', done, { once: true }); setTimeout(done, 9000);
    return frame;
  };
  const frame = build();
  player.hidden = false; if (actions) actions.hidden = false; window.yrPlayerReady();
  if (bar && !bar.dataset.on) {
    bar.dataset.on = '1';
    const mk = (ico, t, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'pbtn'; b.innerHTML = '<i aria-hidden="true">' + ico + '</i><span></span>'; b.lastChild.textContent = t; b.addEventListener('click', fn); bar.append(b); return b; };
    const label = (b, t) => { b.lastChild.textContent = t; };
    const setTheater = (on) => { player.classList.toggle('theater', on); document.body.style.overflow = on ? 'hidden' : ''; label(th, on ? 'إغلاق' : 'سينما'); };
    const th = mk('🎬', 'سينما', () => setTheater(!player.classList.contains('theater')));
    mk('⛶', 'ملء الشاشة', async () => {
      try {
        await (box.requestFullscreen ? box.requestFullscreen() : box.webkitRequestFullscreen());
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
      } catch (e) { setTheater(true); }
    });
    mk('↻', 'تحديث', () => build());
    const sh = mk('🔗', 'مشاركة', async () => {
      window.yrShare({ title: document.title, text: document.title + ' — شاهد المباراة على يلا رياضة', url: location.href });
    });
    const close = document.getElementById('theater-close'); if (close) close.addEventListener('click', () => setTheater(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && player.classList.contains('theater')) setTheater(false); });
  }
  return frame;
};

/* منع التكبير والتصغير (زوم) */
(function () {
  const stop = (e) => e.preventDefault();
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((t) => document.addEventListener(t, stop, { passive: false }));
  document.addEventListener('touchmove', (e) => { if (e.scale && e.scale !== 1) e.preventDefault(); }, { passive: false });
  document.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
  document.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0', '_'].includes(e.key)) e.preventDefault(); });
  let last = 0;
  document.addEventListener('touchend', (e) => { const n = Date.now(); if (n - last < 300 && !e.target.closest('input,textarea,select')) e.preventDefault(); last = n; }, { passive: false });
})();
/* إظهار زر «المشغّل» في شريط الأزرار (موبايل) */
window.yrPlayerReady = function () {
  const t = document.querySelector('.tab-player'); if (t) t.hidden = false;
  const grid = document.querySelector('.watch-grid'); if (grid) grid.classList.add('has-player');
  if (/[?&]watch=1/.test(location.search) && window.yrSelectTab && window.matchMedia('(max-width:1099px)').matches) window.yrSelectTab('player');
};

/* هيرو المباراة: شارة الحالة + عدّاد تنازلي للمباريات القادمة */
window.yrHero = function (m) {
  const lg = document.getElementById('mh-league'); if (lg) lg.textContent = m.league || '';
  const st = document.getElementById('mh-status');
  if (st) {
    st.className = 'st st-' + (m.status || 'scheduled');
    st.textContent = m.status === 'live' ? '● مباشر' + (m.note ? ' · ' + m.note : '') : m.status === 'finished' ? 'انتهت' : 'قادمة';
  }
  const box = document.getElementById('mh-count'); if (!box) return;
  if (window.__yrCount) { clearInterval(window.__yrCount); window.__yrCount = null; }
  const t = m.kickoff ? new Date(m.kickoff).getTime() : NaN;
  if (m.status !== 'scheduled' || !Number.isFinite(t)) { box.hidden = true; return; }
  const n = (v) => Number(v).toLocaleString('ar-EG', { minimumIntegerDigits: 2, useGrouping: false });
  const tick = () => {
    const d = t - Date.now();
    if (d <= 0) { box.innerHTML = '<span class="cd-now">حان موعد المباراة — حدّث الصفحة</span>'; clearInterval(window.__yrCount); return; }
    const days = Math.floor(d / 864e5), h = Math.floor(d / 36e5) % 24, mi = Math.floor(d / 6e4) % 60, s = Math.floor(d / 1e3) % 60;
    const cell = (v, l) => `<div class="cd"><b>${v}</b><small>${l}</small></div>`;
    box.innerHTML = (days ? cell(n(days), 'يوم') : '') + cell(n(h), 'ساعة') + cell(n(mi), 'دقيقة') + cell(n(s), 'ثانية');
  };
  box.hidden = false; tick(); window.__yrCount = setInterval(tick, 1000);
};

/* مشاركة: قائمة المشاركة الأصلية في الموبايل، ولوحة بديلة (واتساب/تيليجرام/إكس/فيسبوك/نسخ) على الكمبيوتر */
window.yrShare = async function (data) {
  const url = data.url || location.href; const title = data.title || document.title; const text = data.text || title;
  try { if (navigator.share) { await navigator.share({ title, text, url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  document.getElementById('yr-share')?.remove();
  const q = encodeURIComponent; const msg = `${text}\n${url}`;
  const items = [
    ['واتساب', '💬', `https://wa.me/?text=${q(msg)}`], ['تيليجرام', '✈️', `https://t.me/share/url?url=${q(url)}&text=${q(text)}`],
    ['إكس', '𝕏', `https://twitter.com/intent/tweet?text=${q(text)}&url=${q(url)}`], ['فيسبوك', '📘', `https://www.facebook.com/sharer/sharer.php?u=${q(url)}`],
  ];
  const w = document.createElement('div'); w.id = 'yr-share'; w.className = 'share-back'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', 'مشاركة');
  w.innerHTML = '<div class="share-sheet"><div class="share-head"><b>مشاركة</b><button type="button" class="share-x" aria-label="إغلاق">✕</button></div><p class="share-title"></p><div class="share-grid"></div><button type="button" class="share-copy">🔗 نسخ الرابط</button></div>';
  w.querySelector('.share-title').textContent = title;
  const g = w.querySelector('.share-grid');
  items.forEach(([n, ico, href]) => { const l = document.createElement('a'); l.href = href; l.target = '_blank'; l.rel = 'noopener noreferrer'; l.innerHTML = `<i>${ico}</i><span>${n}</span>`; g.append(l); });
  const close = () => { w.classList.remove('in'); setTimeout(() => w.remove(), 200); };
  w.addEventListener('click', (e) => { if (e.target === w || e.target.closest('.share-x')) close(); });
  w.querySelector('.share-copy').addEventListener('click', async (e) => { try { await navigator.clipboard.writeText(url); e.target.textContent = '✓ تم النسخ'; setTimeout(close, 900); } catch (err) { e.target.textContent = url; } });
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
  document.body.append(w); requestAnimationFrame(() => w.classList.add('in'));
};
