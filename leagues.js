/* الدوريات: قائمة البطولات + صفحة الدوري (الترتيب والهدافين) — البيانات من دالة football-matches بكاش طويل */
(() => {
  'use strict';
  const db = window.yrSupabase; const page = location.pathname.split('/').pop();
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const https = (u) => { try { const x = new URL(u); return x.protocol === 'https:' ? x.href : ''; } catch { return ''; } };
  const nAr = (n) => Number(n).toLocaleString('ar-EG');
  const tn = (n) => (window.YR_NAMES ? window.YR_NAMES.team(n) : n);
  const pn = (n) => (window.YR_NAMES ? window.YR_NAMES.player(n) : n);
  const L = [
    ['europe', 'أوروبا', [[39, 'الدوري الإنجليزي الممتاز', 'إنجلترا'], [140, 'الدوري الإسباني', 'إسبانيا'], [135, 'الدوري الإيطالي', 'إيطاليا'], [78, 'الدوري الألماني', 'ألمانيا'], [61, 'الدوري الفرنسي', 'فرنسا'], [2, 'دوري أبطال أوروبا', 'أوروبا'], [3, 'الدوري الأوروبي', 'أوروبا'], [848, 'دوري المؤتمر الأوروبي', 'أوروبا']]],
    ['arab', 'العالم العربي وأفريقيا', [[233, 'الدوري المصري الممتاز', 'مصر'], [307, 'دوري روشن السعودي', 'السعودية'], [305, 'دوري نجوم قطر', 'قطر'], [301, 'دوري المحترفين الإماراتي', 'الإمارات'], [200, 'الدوري المغربي', 'المغرب'], [202, 'الدوري التونسي', 'تونس'], [186, 'الدوري الجزائري', 'الجزائر'], [12, 'دوري أبطال أفريقيا', 'أفريقيا']]],
  ];
  const ALL = new Map(L.flatMap(([, , a]) => a).map(([id, n, c]) => [id, { id, n, c }]));
  const logo = (id) => `https://media.api-sports.io/football/leagues/${id}.png`;
  const ico = (n) => (window.yrIco ? window.yrIco(n) : '');

  const get = async (body, ttlMin) => {
    const key = 'yr-lg:' + JSON.stringify(body);
    try { const c = JSON.parse(localStorage.getItem(key) || 'null'); if (c && Date.now() - c.t < ttlMin * 60000) return c.v; } catch { /* اختياري */ }
    const { data, error } = await db.functions.invoke('football-matches', { body });
    if (error || data?.error || !(data?.groups || data?.players)) {
      try { const c = JSON.parse(localStorage.getItem(key) || 'null'); if (c) return c.v; } catch { /* اختياري */ }
      let msg = data?.error || '';
      if (!msg && error?.context?.json) { try { msg = (await error.context.json())?.error || ''; } catch { /* اختياري */ } }
      if (!msg && !error && data) msg = 'الدالة لسه على نسخة قديمة — لازم تنشر football-matches الجديدة.';
      throw new Error(msg || 'الخدمة غير متاحة حاليًا. حاول بعد قليل.');
    }
    try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), v: data })); } catch { /* اختياري */ }
    return data;
  };

  /* ---------- قائمة الدوريات ---------- */
  if (page === 'leagues.html') {
    const g = document.getElementById('lg-grid');
    g.innerHTML = L.map(([, title, arr]) => `<h2 class="lg-sec">${title}</h2><div class="lg-cards">${arr.map(([id, n, c]) => `<a class="lg-card" href="league.html?id=${id}"><span class="lg-logo"><img src="${logo(id)}" alt="" loading="lazy" referrerpolicy="no-referrer"></span><span class="lg-nm"><b>${esc(n)}</b><small>${esc(c)}</small></span><i aria-hidden="true">←</i></a>`).join('')}</div>`).join('');
    return;
  }

  /* ---------- صفحة الدوري ---------- */
  const id = Number(new URLSearchParams(location.search).get('id'));
  const meta = ALL.get(id); const head = document.getElementById('lg-head'); const body = document.getElementById('lg-body');
  if (!meta) { head.innerHTML = ''; body.setAttribute('aria-busy', 'false'); body.innerHTML = '<p class="note">البطولة دي مش موجودة. <a href="leagues.html">كل الدوريات</a></p>'; return; }
  document.title = `${meta.n} | يلا رياضة`;
  head.innerHTML = `<span class="lg-logo big"><img src="${logo(id)}" alt="" referrerpolicy="no-referrer"></span><div><h1>${esc(meta.n)}</h1><p class="sub" id="lg-season">${esc(meta.c)}</p></div><button type="button" class="mh-share inline" id="lg-share">${ico('share')} شارك</button>`;
  document.getElementById('lg-share').addEventListener('click', () => window.yrShareBloom({ type: 'team', title: meta.n, sub: 'الترتيب والهدافون', image: logo(id), tag: 'يلا رياضة', emoji: '🏆', url: location.href }));
  const ZONE = (note) => { const t = String(note || '').toLowerCase(); if (!t) return ['', '']; if (/relegat/.test(t)) return ['rel', 'هبوط']; if (/conference/.test(t)) return ['uecl', 'دوري المؤتمر']; if (/europa/.test(t)) return ['uel', 'الدوري الأوروبي']; if (/champions/.test(t) && /qualif/.test(t)) return ['uclq', 'تصفيات دوري الأبطال']; if (/champions|promotion/.test(t)) return ['ucl', 'دوري الأبطال / صعود']; if (/round of|next round|knockout|final|play/.test(t)) return ['ucl', 'التأهل']; return ['', '']; };
  const formDots = (f) => String(f || '').slice(-5).split('').map((c) => `<i class="fd ${c}" title="${c}"></i>`).join('');
  const row = (t) => { const [z] = ZONE(t.note); const tg = t.team.id ? `a href="team.html?id=${t.team.id}"` : 'div'; return `<${tg} class="lg-r ${z}"><b class="rk">${nAr(t.rank)}</b><span class="tm">${https(t.team.logo) ? `<img src="${esc(https(t.team.logo))}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ''}<span>${esc(tn(t.team.name))}</span></span><span>${nAr(t.played)}</span><span class="h">${nAr(t.win)}</span><span class="h">${nAr(t.draw)}</span><span class="h">${nAr(t.lose)}</span><span class="h gd">${nAr(t.gd)}</span><b class="pt">${nAr(t.points)}</b><span class="fm">${formDots(t.form)}</span></${tg.split(' ')[0]}>`; };
  const table = (rows, title) => `${title ? `<h3 class="lg-grp">${esc(title)}</h3>` : ''}<div class="lg-t"><div class="lg-r lg-th"><b class="rk">#</b><span class="tm">الفريق</span><span>لعب</span><span class="h">ف</span><span class="h">ت</span><span class="h">خ</span><span class="h gd">+/-</span><b class="pt">نقاط</b><span class="fm">آخر 5</span></div>${rows.map(row).join('')}</div>`;
  async function showTable() {
    body.setAttribute('aria-busy', 'true'); body.innerHTML = '<p class="note">جارٍ التحميل…</p>';
    try {
      const d = await get({ action: 'standings', leagueId: id }, 90);
      document.getElementById('lg-season').textContent = `${meta.c} · موسم ${d.league.season}${Number(d.league.season) ? '/' + String(Number(d.league.season) + 1).slice(2) : ''}`;
      const groups = d.groups || []; const seen = new Set();
      const legend = [...new Set(groups.flat().map((t) => ZONE(t.note).join('|')).filter((x) => x !== '|'))].map((x) => { const [c, l] = x.split('|'); seen.add(c); return `<span class="lg-lg"><i class="z ${c}"></i>${l}</span>`; }).join('');
      body.innerHTML = groups.map((g) => table(g, groups.length > 1 ? (g[0] && g[0].group) || '' : '')).join('') + (legend ? `<div class="lg-legend">${legend}</div>` : '') + '<p class="note">البيانات بتتحدّث تلقائيًا كل بضع ساعات.</p>';
    } catch (e) { body.innerHTML = `<p class="note">${esc(e.message)}</p>`; }
    body.setAttribute('aria-busy', 'false');
  }
  async function showScorers() {
    body.setAttribute('aria-busy', 'true'); body.innerHTML = '<p class="note">جارٍ التحميل…</p>';
    try {
      const d = await get({ action: 'scorers', leagueId: id }, 180);
      body.innerHTML = `<div class="lg-sc">${d.players.map((p, i) => `<article class="lg-p"><b class="rk">${nAr(i + 1)}</b><span class="ph">${https(p.photo) ? `<img src="${esc(https(p.photo))}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ''}</span><span class="nm"><b>${esc(pn(p.name))}</b><small>${https(p.team.logo) ? `<img src="${esc(https(p.team.logo))}" alt="" referrerpolicy="no-referrer">` : ''}${esc(tn(p.team.name))}</small></span><span class="st"><small>صناعة</small><b>${nAr(p.assists)}</b></span><span class="st"><small>مباريات</small><b>${nAr(p.apps)}</b></span><span class="gl"><b>${nAr(p.goals)}</b><small>هدف</small></span></article>`).join('')}</div>`;
    } catch (e) { body.innerHTML = `<p class="note">${esc(e.message)}</p>`; }
    body.setAttribute('aria-busy', 'false');
  }
  document.querySelector('.lg-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (!b) return; document.querySelectorAll('.lg-tabs .tab').forEach((x) => { const on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-selected', on); }); (b.dataset.t === 'table' ? showTable : showScorers)(); });
  (async () => { try { await window.YR_NAMES?.ready; } catch { /* اختياري */ } showTable(); })();
})();
