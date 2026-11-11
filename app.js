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
    ['matches.html', 'المباريات'], ['news.html', 'الأخبار'], ['leagues.html', 'الدوريات'], ['transfers.html', 'الانتقالات'], ['store.html', 'المتجر'], ['account.html', 'حسابي'],
  ];
  const header = $('shared-header');
  if (header) {
    header.innerHTML = `<header class="header"><div class="wrap nav">${brand}
      <nav id="nav" aria-label="القائمة الرئيسية">${nav.map(([u, t]) => `<a class="${current === u ? 'active' : ''}" ${current === u ? 'aria-current="page"' : ''} href="${u}">${t}</a>`).join('')}<a href="${contact}" target="_blank" rel="noopener noreferrer">تواصل معنا ↗</a></nav>
      <button class="icon-btn bell" id="bell" type="button" aria-label="الإشعارات"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg><i class="bell-dot" aria-hidden="true"></i></button>
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
      <div class="foot-links"><a href="matches.html">المباريات</a><a href="news.html">الأخبار</a><a href="leagues.html">الدوريات</a><a href="transfers.html">الانتقالات</a><a href="store.html">المتجر</a><a href="about.html">عن المنصة</a><a href="${contact}" target="_blank" rel="noopener noreferrer">تواصل معنا</a></div>
      <div class="follow-foot"><span>تابعنا</span>${socialDots()}</div>
      <div class="credit">تصميم وتطوير <a href="${contact}" target="_blank" rel="noopener noreferrer">Romany Garges</a></div>
      <small class="copyright">© ${new Date().getFullYear()} YALLA RIYADA</small></div></footer>`;
  }

  /* ---------- شريط التنقل السفلي (موبايل) ---------- */
  const ico = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const tabs = [
    ['matches.html', 'المباريات', ico('<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 5h-5L8 10z"/>')],
    ['news.html', 'الأخبار', ico('<path d="M4 5h13a1 1 0 0 1 1 1v13H6a2 2 0 0 1-2-2z"/><path d="M18 9h2v8a2 2 0 0 1-2 2"/><path d="M8 9h6M8 13h6"/>')],
    ['leagues.html', 'الدوريات', ico('<path d="M8 21h8M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>')],
    ['transfers.html', 'الانتقالات', ico('<path d="M7 7h13l-3-3"/><path d="M17 17H4l3 3"/>')],
    ['store.html', 'المتجر', ico('<path d="M6 8h12l-1 12H7z"/><path d="M9 8a3 3 0 0 1 6 0"/>')],
    ['account.html', 'حسابي', ico('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>')],
  ];
  const tabbar = document.createElement('nav');
  tabbar.className = 'tabbar';
  tabbar.setAttribute('aria-label', 'التنقل السريع');
  const activeIndex = Math.max(0, tabs.findIndex(([u]) => u === current || (current === 'match.html' && u === 'matches.html') || (current === 'product.html' && u === 'store.html') || (current === 'league.html' && u === 'leagues.html') || (current === 'player.html' && u === 'transfers.html')));
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
  const ytId = window.yrYT ? window.yrYT.parse(url) : (String(url).match(/(?:embed\/|watch\?v=|youtu\.be\/)([\w-]{11})/) || [])[1];
  let ytCtl = null;
  const buildYT = () => {
    // فيديو يوتيوب: مشغّل يلا رياضة الخاص (شعار + أزرار + شريط تحميل). أي رابط تاني بيفضل في الإطار العادي.
    const go = () => { if (ytCtl) ytCtl.destroy(); ytCtl = window.yrYT.mount(box, ytId, title || '', url); };
    if (window.yrYT) { go(); return; }
    const sc = document.createElement('script'); sc.src = 'yt-player.js'; sc.onload = go; sc.onerror = () => { box.replaceChildren(); const f = document.createElement('iframe'); f.src = url; f.allowFullscreen = true; f.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0'; box.appendChild(f); }; document.head.appendChild(sc);
  };
  const build = () => {
    if (ytId && /(^|\.)youtube(-nocookie)?\.com|youtu\.be/.test((() => { try { return new URL(url).hostname; } catch (e) { return ''; } })())) { buildYT(); return null; }
    const frame = document.createElement('iframe');
    frame.src = url; frame.title = title || 'مشغّل المباراة';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true; frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.sandbox = 'allow-scripts allow-same-origin allow-presentation';
    const load = document.createElement('div'); load.className = 'pf-load'; load.innerHTML = '<i></i><span>جارٍ تحميل البث…</span><div class="pf-bar" role="progressbar" aria-label="تحميل البث"><b></b></div><small class="pf-pct">0%</small>';
    box.replaceChildren(frame, load);
    // شريط تحميل: بيتقدم تدريجيًا لحد ~٩٣٪ وبيكمّل ١٠٠٪ أول ما البث يفتح، والرسالة بتتغير عشان المستخدم يطمّن
    const msg = load.querySelector('span'); const pct = load.querySelector('.pf-pct'); const t0 = Date.now();
    const steps = [[0, 'جارٍ تحميل البث…'], [2500, 'جارٍ الاتصال بالسيرفر…'], [6000, 'لحظات ويبدأ البث…'], [10000, 'التحميل بياخد وقت أطول من المعتاد… ممكن تضغط تحديث']];
    const tick = setInterval(() => {
      const el = Date.now() - t0; const last = steps.filter(([t]) => el >= t).pop(); if (last && msg.textContent !== last[1]) msg.textContent = last[1];
      pct.textContent = Math.min(93, Math.round(100 * (1 - Math.exp(-el / 3200)) * 0.93 + 2)) + '%';
    }, 250);
    let finished = false;
    const done = () => { if (finished) return; finished = true; clearInterval(tick); pct.textContent = '100%'; msg.textContent = 'تم ✓'; load.classList.add('done'); setTimeout(() => load.remove(), 700); };
    frame.addEventListener('load', done, { once: true }); setTimeout(done, 14000);
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
      if (window.yrMatchShare) window.yrMatchShare(); else window.yrShare({ title: document.title, text: document.title + ' — شاهد المباراة على يلا رياضة', url: location.href });
    });
    const close = document.getElementById('theater-close'); if (close) close.addEventListener('click', () => setTheater(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && player.classList.contains('theater')) setTheater(false); });
  }
  return frame;
};

/* فك قفل اتجاه الشاشة: القفل على landscape (بعد ملء الشاشة) كان بيفضل شغّال ويمنع تدوير الشاشة */
(function () {
  const unlock = () => { try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) { /* غير مدعوم */ } };
  unlock();
  const onFs = () => { if (!document.fullscreenElement && !document.webkitFullscreenElement) unlock(); };
  document.addEventListener('fullscreenchange', onFs); document.addEventListener('webkitfullscreenchange', onFs);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !document.fullscreenElement) unlock(); });
})();

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
    st.textContent = m.status === 'live' ? '● مباشر' + (m.note ? ' · ' + m.note : '') : m.status === 'finished' ? 'انتهت' : m.status === 'postponed' ? 'مؤجلة' : m.status === 'cancelled' ? 'ملغاة' : 'قادمة';
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

/* مشاركة كصورة: بيحمّل share-card.js وقت الحاجة بس */
window.yrShareImage = function (d) {
  const go = () => window.yrShareStudio(d);
  if (window.yrShareStudio) return go();
  const sc = document.createElement('script'); sc.src = 'share-card.js'; sc.onload = go; sc.onerror = () => window.yrShare({ title: d.title, text: d.title + ' — يلا رياضة', url: d.url }); document.head.appendChild(sc);
};

/* أيقونات SVG حقيقية (sprite) — الاستخدام: window.yrIco('check') */
(function () {
  const st = (id, d) => `<symbol id="i-${id}" viewBox="0 0 24 24">${d}</symbol>`;
  const br = (id, d) => st(id, `<path fill="currentColor" stroke="none" d="${d}"/>`);
  const S = '<svg id="yr-sprite" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' + [
    st('check', '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16.3 9.5"/>'),
    st('fire', '<path d="M12 3c1 3.2 4.5 4.6 4.5 9a4.5 4.5 0 01-9 0c0-1.6.6-2.7 1.5-3.7.2 1.2.9 1.9 1.7 2C10.4 8 11 5.5 12 3z"/>'),
    st('loan', '<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 014-4h12"/><path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 01-4 4H4"/>'),
    st('free', '<path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/>'),
    st('chat', '<path d="M21 11.5a8.4 8.4 0 01-12.2 7.5L3 20.5l1.6-5A8.5 8.5 0 1121 11.5z"/>'),
    st('pen', '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>'),
    st('coins', '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>'),
    st('calendar', '<rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 10h18M8 2.5v4M16 2.5v4"/>'),
    st('share', '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.6l6.8-4M8.6 13.4l6.8 4"/>'),
    st('image', '<rect x="3" y="3.5" width="18" height="17" rx="3"/><circle cx="8.5" cy="9" r="1.7"/><path d="M21 16l-5-5-8.5 9"/>'),
    st('download', '<path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5"/><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/>'),
    st('copy', '<rect x="9" y="9" width="12" height="12" rx="3"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>'),
    st('link', '<path d="M10 13.5a4.5 4.5 0 006.4 0l3-3a4.5 4.5 0 00-6.4-6.4l-1 1"/><path d="M14 10.5a4.5 4.5 0 00-6.4 0l-3 3a4.5 4.5 0 006.4 6.4l1-1"/>'),
    st('user', '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>'),
    st('shield', '<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z"/>'),
    st('spark', '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>'),
    st('more', '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'),
    st('x', '<path d="M6 6l12 12M18 6L6 18"/>'),
    st('send', '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>'),
    br('whatsapp', 'M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.78h-.01a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 01-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 012.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0012.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 005.68 1.45c6.56 0 11.89-5.34 11.9-11.9a11.82 11.82 0 00-3.48-8.41z'),
    br('telegram', 'M11.94 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.06 0zm4.96 7.22c.1 0 .32.02.47.14a.5.5 0 01.17.33c.02.09.04.3.02.47-.18 1.9-.96 6.5-1.36 8.63-.17.9-.5 1.2-.82 1.23-.7.06-1.22-.46-1.9-.9-1.05-.7-1.65-1.13-2.68-1.8-1.18-.78-.4-1.21.26-1.91.17-.18 3.25-2.98 3.31-3.23.01-.03.01-.15-.06-.21s-.17-.04-.25-.02c-.1.02-1.79 1.14-5.06 3.35-.48.33-.91.49-1.3.48-.43-.01-1.25-.24-1.87-.44-.75-.25-1.35-.37-1.3-.79.03-.22.33-.44.9-.66 3.5-1.52 5.83-2.53 7-3.01 3.33-1.39 4.02-1.63 4.48-1.64z'),
    br('facebook', 'M24 12.07C24 5.45 18.63.07 12 .07S0 5.45 0 12.07c0 5.99 4.39 10.95 10.13 11.85v-8.39H7.08v-3.47h3.05V9.43c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.69.23 2.69.23v2.95h-1.52c-1.49 0-1.96.93-1.96 1.87v2.25h3.33l-.53 3.47h-2.8v8.39C19.61 23.03 24 18.06 24 12.07z'),
    br('xtw', 'M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93zm-1.29 19.5h2.04L6.49 3.24H4.3z'),
  ].join('') + '</defs></svg>';
  const add = () => { if (!document.getElementById('yr-sprite') && document.body) document.body.insertAdjacentHTML('afterbegin', S); };
  if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
  window.yrIco = (n, c) => `<svg class="i${c ? ' ' + c : ''}" aria-hidden="true" focusable="false"><use href="#i-${n}"/></svg>`;
  // آخر عنصر اتضغط (نقطة انطلاق قائمة المشاركة)
  document.addEventListener('click', (e) => { window.__yrLastEl = e.target.closest ? e.target.closest('button,a,[role=button]') || e.target : null; }, true);
})();
window.yrShareBloom = function (d) {
  const go = () => window.yrBloom(d, window.__yrLastEl);
  if (window.yrBloom) return go();
  const sc = document.createElement('script'); sc.src = 'share-bloom.js'; sc.onload = go; sc.onerror = () => window.yrShare({ title: d.title, text: d.title + ' — يلا رياضة', url: d.url }); document.head.appendChild(sc);
};
