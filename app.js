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
