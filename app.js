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

  /* ---------- الثيم: داكن (افتراضي) / فاتح ---------- */
  const root = document.documentElement;
  const applyTheme = (t) => { if (t === 'light') root.setAttribute('data-theme', 'light'); else root.removeAttribute('data-theme'); };
  applyTheme(store.get('yr-theme'));

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

  /* ---------- الفوتر ---------- */
  const footer = $('shared-footer');
  if (footer) {
    footer.innerHTML = `<footer class="footer"><div class="wrap foot">${brand}
      <div class="foot-links"><a href="matches.html">المباريات</a><a href="news.html">الأخبار</a><a href="store.html">المتجر</a><a href="about.html">عن المنصة</a><a href="${contact}" target="_blank" rel="noopener noreferrer">تواصل معنا</a></div>
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
