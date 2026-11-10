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
    const stats = [['age', t.age ? nAr(t.age) + ' عام' : '', 'العمر'], ['weight', t.weight_kg ? nAr(t.weight_kg) + ' كجم' : '', 'الوزن'], ['height', t.height_cm ? nAr(t.height_cm) + ' سم' : '', 'الطول'], ['foot', t.foot, 'القدم'], ['num', t.shirt_number ? '#' + nAr(t.shirt_number) : '', 'رقم القميص'], ['cu', t.contract_until ? date(t.contract_until) : '', 'نهاية العقد'], ['mv', t.market_value, 'القيمة السوقية']].filter((x) => x[1]);
    const auto = `${t.player_name}${t.position ? ' — ' + t.position : ''}${t.age ? '، عمره ' + nAr(t.age) + ' سنة' : ''}${t.nationality ? '، من ' + t.nationality : ''}. ${club ? 'يرتبط حاليًا بنادي ' + club + '.' : ''}`;
    host.setAttribute('aria-busy', 'false');
    const chip = (u, txt, cls) => `<span class="pl-chip">${https(u) ? `<img class="${cls || ''}" src="${esc(https(u))}" alt="" referrerpolicy="no-referrer">` : ''}${esc(txt)}</span>`;
    const hero = `<section class="pl-hero" data-num="${t.shirt_number ? esc(t.shirt_number) : ''}"><div class="pl-info"><div class="pl-chips">${t.nationality || flag ? chip(flag, t.nationality || '', 'fl') : ''}${club ? chip(club === t.to_team ? t.to_logo : t.from_logo, club) : ''}</div><h1>${esc(t.player_name)}</h1>${t.position ? `<p class="pl-pos">${esc(t.position)}</p>` : ''}<span class="pl-st">${ST[t.status] || ''}</span></div><div class="pl-fig">${big ? `<img src="${esc(big)}" alt="${esc(t.player_name)}" referrerpolicy="no-referrer">` : small ? `<img class="avatar" src="${esc(small)}" alt="${esc(t.player_name)}" referrerpolicy="no-referrer">` : ''}</div></section>`;
    const sm = stats.filter((x) => x[0] !== 'mv');
    const mv = stats.find((x) => x[0] === 'mv');
    const statsHtml = stats.length ? `<div class="pl-stats">${mv ? `<div class="pl-stat hl"><small>القيمة السوقية</small><b>${esc(mv[1])}</b></div>` : ''}${sm.map(([, v, l]) => `<div class="pl-stat"><b>${esc(v)}</b><small>${l}</small></div>`).join('')}</div>` : '';
    const mvCard = `<section class="pl-card"><h2>آخر انتقال</h2><div class="pl-move"><div class="club">${logo(t.from_logo, t.from_team)}<span>${esc(t.from_team || '—')}</span><small>من</small></div><div class="pl-arrow"><i></i><span>${ST[t.status] ? ST[t.status].replace(/^\S+\s/, '') : ''}</span></div><div class="club">${logo(t.to_logo, t.to_team)}<span>${esc(t.to_team || '—')}</span><small>إلى</small></div></div><div class="pl-pills">${t.fee ? `<span>💰 ${esc(t.fee)}</span>` : ''}<span>📅 ${esc(date(t.happened_at))}</span></div>${t.note ? `<p class="pl-bio" style="margin-top:14px">${esc(t.note)}</p>` : ''}${https(t.source_url) ? `<p style="margin:10px 0 0;text-align:center"><a class="tr-src" href="${esc(https(t.source_url))}" target="_blank" rel="noopener noreferrer">المصدر ↗</a></p>` : ''}</section>`;
    const hist2 = hist && hist.length > 1 ? `<section class="pl-card"><h2>سجل الانتقالات</h2><div class="pl-hist">${hist.map((h) => `<a class="pl-h" href="player.html?id=${encodeURIComponent(h.id)}"><span><b>${esc(h.from_team || '—')} ← ${esc(h.to_team || '—')}</b><small>${esc(date(h.happened_at))}${h.fee ? ' · ' + esc(h.fee) : ''}</small></span><span class="tr-badge" style="background:var(--acc);color:var(--on-acc)">${ST[h.status] || ''}</span></a>`).join('')}</div></section>` : '';
    host.innerHTML = `<div class="plx">${hero}${statsHtml}${mvCard}<section class="pl-card"><h2>نبذة</h2><p class="pl-bio">${esc(t.bio || auto)}</p></section>${hist2}<button class="mh-share pl-share" type="button" id="pl-share"><span aria-hidden="true">✨</span> شارك اللاعب كصورة</button></div>`;
    document.getElementById('pl-share').addEventListener('click', () => window.yrShareImage({ type: 'player', title: t.player_name, sub: [t.position, club].filter(Boolean).join(' · '), tag: ST[t.status] || 'انتقالات', image: big || small, emoji: '👤', move: t.status === 'extended' ? null : { from: { name: t.from_team, logo: https(t.from_logo) }, to: { name: t.to_team, logo: https(t.to_logo) } }, url: location.href }));
  })();
})();
