/* صفحة الانتقالات: بتقرأ جدول transfers (المنشور بس) وبتعرضه بفلاتر وبحث */
(() => {
  'use strict';
  const db = window.yrSupabase; const host = document.getElementById('tr-list'); if (!db || !host) return;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const https = (u) => { try { const x = new URL(u); return x.protocol === 'https:' ? x.href : ''; } catch { return ''; } };
  const I = (n) => (window.yrIco ? window.yrIco(n) : '');
  const ST = { official: ['check', 'رسمي'], advanced: ['fire', 'مفاوضات متقدمة'], rumor: ['chat', 'إشاعة'], loan: ['loan', 'إعارة'], free: ['free', 'انتقال حر'], extended: ['pen', 'تجديد عقد'] };
  const PAGE = 12; let all = []; let filter = 'all'; let lg = 'all'; let q = ''; let shown = PAGE;
  const LG = { 39: 'الإنجليزي الممتاز', 140: 'الإسباني', 135: 'الإيطالي', 78: 'الألماني', 61: 'الفرنسي', 307: 'السعودي', 233: 'المصري', other: 'دوريات أخرى' };
  const norm = (t) => String(t ?? '').toLowerCase().replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
  const date = (d) => { try { return new Date(d + 'T12:00:00').toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return ''; } };
  const logo = (u, name) => { const i = https(u); return i ? `<img class="tr-logo" src="${esc(i)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<span class="tr-logo tr-logo-ph" aria-hidden="true">${esc(String(name || '?').trim().charAt(0) || '?')}</span>`; };
  const card = (t, top) => {
    const [ic, lb] = ST[t.status] || ST.rumor; const label = `${I(ic)} ${lb}`; const img = https(t.player_photo);
    const dest = t.status === 'extended' ? (t.from_team || t.to_team) : t.to_team;
    return `<a class="tr-row${top ? ' top' : ''}" data-s="${esc(t.status)}" href="player.html?id=${encodeURIComponent(t.id)}">
      <div class="tr-who"><span class="tr-ph">${img ? `<img src="${esc(img)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : '⚽'}</span>${t.status === 'extended' ? '' : logo(t.from_logo, t.from_team)}<span class="tr-nm"><b>${esc(t.player_name)}</b><small>${esc(t.position || t.from_team || '')}</small></span></div>
      <div class="tr-mid"><span class="tr-badge">${label}</span><i class="tr-line" aria-hidden="true"></i></div>
      <div class="tr-to">${logo(t.status === 'extended' ? (t.from_logo || t.to_logo) : t.to_logo, dest)}<span class="tr-meta"><b>${esc(dest || '—')}</b><small>${t.fee ? esc(t.fee) + ' · ' : ''}${esc(date(t.happened_at))}</small></span></div>
    </a>`;
  };
  const leaguesBar = () => {
    const el = document.getElementById('tr-leagues'); if (!el) return;
    const have = [...new Set(all.map((t) => t.league).filter(Boolean))].sort((a, b) => Object.keys(LG).indexOf(String(a)) - Object.keys(LG).indexOf(String(b)));
    if (have.length < 1) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = `<small>الظهور حسب البطولة</small><div class="tr-lgs"><button type="button" class="lgc active" data-l="all">الكل</button>${have.map((l) => `<button type="button" class="lgc" data-l="${esc(l)}">${/^\d+$/.test(l) ? `<img src="https://media.api-sports.io/football/leagues/${esc(l)}.png" alt="" loading="lazy" referrerpolicy="no-referrer">` : ''}${esc(LG[l] || l)}</button>`).join('')}</div>`;
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-l]'); if (!b) return; lg = b.dataset.l; shown = PAGE; el.querySelectorAll('.lgc').forEach((c) => c.classList.toggle('active', c === b)); render(); });
  };
  function render() {
    host.setAttribute('aria-busy', 'false');
    const nq = norm(q);
    const rows = all.filter((t) => (filter === 'all' || t.status === filter) && (lg === 'all' || t.league === lg) && (!nq || norm([t.player_name, t.from_team, t.to_team].join(' ')).includes(nq)));
    if (!rows.length) { host.innerHTML = '<p class="note">مفيش انتقالات مطابقة دلوقتي.</p>'; document.getElementById('tr-more').hidden = true; return; }
    const top = nq ? [] : rows.filter((t) => t.featured).slice(0, 5); const ids = new Set(top.map((t) => t.id));
    const rest = rows.filter((t) => !ids.has(t.id));
    host.innerHTML = (top.length ? `<h2 class="tr-h">أهم الانتقالات</h2><div class="tr-top">${top.map((t) => card(t, true)).join('')}</div>${rest.length ? '<h2 class="tr-h sm">آخر الانتقالات</h2>' : ''}` : '') + rest.slice(0, shown).map((t) => card(t)).join('');
    document.getElementById('tr-more').hidden = rest.length <= shown;
  }
  document.getElementById('tr-filter').addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (!b) return; filter = b.dataset.f; shown = PAGE; document.querySelectorAll('#tr-filter .chip').forEach((c) => c.classList.toggle('active', c === b)); render(); });
  let t; document.getElementById('tr-q').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { q = e.target.value; shown = PAGE; render(); }, 200); });
  document.getElementById('tr-more').addEventListener('click', () => { shown += PAGE; render(); });
  (async () => {
    const { data, error } = await db.from('transfers').select('*').eq('published', true).order('happened_at', { ascending: false }).order('created_at', { ascending: false }).limit(300);
    if (error) { host.setAttribute('aria-busy', 'false'); host.innerHTML = '<p class="note">قسم الانتقالات هيتفتح قريبًا.</p>'; return; }
    all = data || []; leaguesBar(); render();
  })();
})();
