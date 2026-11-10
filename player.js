/* صفحة اللاعب: بتعرض بيانات اللاعب وآخر انتقال له من جدول transfers */
(() => {
  'use strict';
  const db = window.yrSupabase; const host = document.getElementById('pl'); if (!db || !host) return;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const https = (u) => { try { const x = new URL(u); return x.protocol === 'https:' ? x.href : ''; } catch { return ''; } };
  const nAr = (n) => Number(n).toLocaleString('ar-EG');
  const date = (d) => { try { return new Date(d + 'T12:00:00').toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return ''; } };
  const ST = { official: '✅ رسمي', advanced: '🔥 مفاوضات متقدمة', rumor: '💬 إشاعة', loan: '🔁 إعارة', free: '🆓 انتقال حر', extended: '🖊️ تجديد عقد' };
  const logo = (u, name) => { const i = https(u); return i ? `<img class="tr-logo" src="${esc(i)}" alt="" referrerpolicy="no-referrer">` : `<span class="tr-logo tr-logo-ph">${esc(String(name || '?').charAt(0))}</span>`; };
  const id = new URLSearchParams(location.search).get('id');
  const fail = (m) => { host.setAttribute('aria-busy', 'false'); host.innerHTML = `<div class="empty-state"><p>${m}</p><a class="btn outline" href="transfers.html">الانتقالات</a></div>`; };
  (async () => {
    if (!id) return fail('اللاعب مش موجود.');
    const { data: t, error } = await db.from('transfers').select('*').eq('id', id).eq('published', true).maybeSingle();
    if (error || !t) return fail('اللاعب أو الانتقال ده مش موجود أو اتشال.');
    const { data: hist } = await db.from('transfers').select('id,status,from_team,to_team,fee,happened_at').eq('published', true).eq('player_name', t.player_name).order('happened_at', { ascending: false }).limit(20);
    document.title = `${t.player_name} | يلا رياضة`;
    const small = https(t.player_photo), big = https(t.player_img_big), flag = https(t.flag_url);
    const club = t.status === 'extended' ? (t.from_team || t.to_team) : t.to_team;
    const stats = [['position', t.position, 'المركز'], ['age', t.age ? nAr(t.age) + ' عام' : '', 'العمر'], ['weight', t.weight_kg ? nAr(t.weight_kg) + ' كجم' : '', 'الوزن'], ['height', t.height_cm ? nAr(t.height_cm) + ' سم' : '', 'الطول'], ['foot', t.foot, 'القدم'], ['num', t.shirt_number ? '#' + nAr(t.shirt_number) : '', 'رقم القميص'], ['cu', t.contract_until ? date(t.contract_until) : '', 'نهاية العقد'], ['mv', t.market_value, 'القيمة السوقية']].filter((x) => x[1]);
    const auto = `${t.player_name}${t.position ? ' — ' + t.position : ''}${t.age ? '، عمره ' + nAr(t.age) + ' سنة' : ''}${t.nationality ? '، من ' + t.nationality : ''}. ${club ? 'يرتبط حاليًا بنادي ' + club + '.' : ''}`;
    host.setAttribute('aria-busy', 'false');
    host.innerHTML = `<section class="pl-hero"><div class="pl-info"><div class="pl-ids">${flag ? `<img class="pl-flag" src="${esc(flag)}" alt="${esc(t.nationality || '')}" referrerpolicy="no-referrer">` : ''}${logo(club === t.to_team ? t.to_logo : t.from_logo, club)}${small && big ? `<img class="pl-small" src="${esc(small)}" alt="" referrerpolicy="no-referrer">` : ''}</div><h1>${esc(t.player_name)}</h1><p class="note">${esc(t.nationality ? t.nationality + ' · ' : '')}${esc(club || '')}</p><span class="tr-badge" style="background:var(--acc);color:var(--on-acc);justify-self:start">${ST[t.status] || ''}</span></div>${big || small ? `<img class="pl-big" src="${esc(big || small)}" alt="${esc(t.player_name)}" referrerpolicy="no-referrer">` : ''}</section>
      ${stats.length ? `<div class="pl-stats">${stats.map(([k, v, l]) => `<div class="pl-stat${k === 'mv' ? ' hl' : ''}"><b>${esc(v)}</b><small>${l}</small></div>`).join('')}</div>` : ''}
      <section class="pl-sec"><h2>آخر انتقال</h2><div class="pl-move"><div>${logo(t.from_logo, t.from_team)}<span>${esc(t.from_team || '—')}</span></div><i>←</i><div>${logo(t.to_logo, t.to_team)}<span>${esc(t.to_team || '—')}</span></div></div><p class="note">${t.fee ? 'القيمة: <b>' + esc(t.fee) + '</b> · ' : ''}${esc(date(t.happened_at))}</p>${t.note ? `<p class="pl-bio">${esc(t.note)}</p>` : ''}${https(t.source_url) ? `<a class="tr-src" href="${esc(https(t.source_url))}" target="_blank" rel="noopener noreferrer">المصدر ↗</a>` : ''}</section>
      <section class="pl-sec"><h2>نبذة</h2><p class="pl-bio">${esc(t.bio || auto)}</p></section>
      ${hist && hist.length > 1 ? `<section class="pl-sec"><h2>سجل الانتقالات</h2><div class="pl-hist">${hist.map((h) => `<a class="tr-row" data-s="${esc(h.status)}" style="grid-template-columns:1fr auto" href="player.html?id=${encodeURIComponent(h.id)}"><span class="tr-nm"><b>${esc(h.from_team || '—')} ← ${esc(h.to_team || '—')}</b><small>${esc(date(h.happened_at))}${h.fee ? ' · ' + esc(h.fee) : ''}</small></span><span class="tr-badge">${ST[h.status] || ''}</span></a>`).join('')}</div></section>` : ''}
      <div class="row" style="margin:14px 0"><button class="btn primary" type="button" id="pl-share">🖼️ شارك اللاعب</button></div>`;
    document.getElementById('pl-share').addEventListener('click', () => window.yrShareImage({ title: `${t.player_name}: ${t.from_team || '—'} ← ${t.to_team || '—'}${t.fee ? ' (' + t.fee + ')' : ''}`, image: big || small, url: location.href }));
  })();
})();
