/* صفحة الانتقالات: بتقرأ جدول transfers (المنشور بس) وبتعرضه بفلاتر وبحث */
(() => {
  'use strict';
  const db = window.yrSupabase; const host = document.getElementById('tr-list'); if (!db || !host) return;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const https = (u) => { try { const x = new URL(u); return x.protocol === 'https:' ? x.href : ''; } catch { return ''; } };
  const ST = { official: ['✅ رسمي', 'تم'], advanced: ['🔥 مفاوضات متقدمة', ''], rumor: ['💬 إشاعة', ''], loan: ['🔁 إعارة', ''], free: ['🆓 انتقال حر', ''], extended: ['🖊️ تجديد عقد', ''] };
  const PAGE = 12; let all = []; let filter = 'all'; let q = ''; let shown = PAGE;
  const norm = (t) => String(t ?? '').toLowerCase().replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
  const date = (d) => { try { return new Date(d + 'T12:00:00').toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return ''; } };
  const card = (t) => {
    const [label] = ST[t.status] || ST.rumor; const src = https(t.source_url); const img = https(t.player_photo);
    const move = t.status === 'extended' ? `<span>${esc(t.to_team || t.from_team || '')}</span>` : `<span>${esc(t.from_team || '—')}</span><i aria-hidden="true">←</i><span>${esc(t.to_team || '—')}</span>`;
    return `<article class="tr-card" data-s="${esc(t.status)}"><div class="tr-top"><div class="tr-ph">${img ? `<img src="${esc(img)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : '⚽'}</div><div class="tr-who"><h2>${esc(t.player_name)}</h2><span class="tr-badge">${label}</span></div></div>
      <div class="tr-move">${move}</div>${t.note ? `<p class="tr-note">${esc(t.note)}</p>` : ''}
      <div class="tr-meta"><span>${t.fee ? `القيمة: <b>${esc(t.fee)}</b>` : ''}</span><span>${esc(date(t.happened_at))}</span></div>${src ? `<a class="tr-src" href="${esc(src)}" target="_blank" rel="noopener noreferrer">المصدر ↗</a>` : ''}</article>`;
  };
  function render() {
    host.setAttribute('aria-busy', 'false');
    const nq = norm(q);
    const rows = all.filter((t) => (filter === 'all' || t.status === filter) && (!nq || norm([t.player_name, t.from_team, t.to_team].join(' ')).includes(nq)));
    host.innerHTML = rows.length ? rows.slice(0, shown).map(card).join('') : '<p class="note">مفيش انتقالات مطابقة دلوقتي.</p>';
    const more = document.getElementById('tr-more'); more.hidden = rows.length <= shown;
  }
  document.getElementById('tr-filter').addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (!b) return; filter = b.dataset.f; shown = PAGE; document.querySelectorAll('#tr-filter .chip').forEach((c) => c.classList.toggle('active', c === b)); render(); });
  let t; document.getElementById('tr-q').addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => { q = e.target.value; shown = PAGE; render(); }, 200); });
  document.getElementById('tr-more').addEventListener('click', () => { shown += PAGE; render(); });
  (async () => {
    const { data, error } = await db.from('transfers').select('*').eq('published', true).order('happened_at', { ascending: false }).order('created_at', { ascending: false }).limit(300);
    if (error) { host.setAttribute('aria-busy', 'false'); host.innerHTML = '<p class="note">قسم الانتقالات هيتفتح قريبًا.</p>'; return; }
    all = data || []; render();
  })();
})();
