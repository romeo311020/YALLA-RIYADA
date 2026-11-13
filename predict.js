/* توقعات المباريات: توقّع النتيجة، اكسب نقاط، وتصدّر القائمة. الحساب بيتم في السيرفر بعد نهاية المباراة. */
(() => {
  'use strict';
  const db = window.yrSupabase;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const https = (u) => { try { const x = new URL(u); return x.protocol === 'https:' ? x.href : ''; } catch { return ''; } };
  const nAr = (n) => Number(n).toLocaleString('ar-EG');
  const tn = (n) => (window.YR_NAMES ? window.YR_NAMES.team(n) : n);
  const ico = (n) => (window.yrIco ? window.yrIco(n) : '');
  const MAXG = 20;
  const crest = (name, logo) => `<span class="pd-cr">${https(logo) ? `<img src="${esc(https(logo))}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ''}</span><b>${esc(tn(name))}</b>`;
  const when = (iso) => { try { return new Date(iso).toLocaleString('ar-EG', { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Cairo' }); } catch { return ''; } };
  const cairoDay = (off = 0) => new Date(Date.now() + off * 864e5).toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });

  let user = null; let mine = new Map(); // fixture_id -> row
  async function getUser() { if (!db) return null; try { const { data } = await db.auth.getSession(); user = data?.session?.user || null; } catch { user = null; } return user; }
  async function loadMine() {
    mine = new Map(); if (!user) return [];
    const { data, error } = await db.from('predictions').select('*').order('kickoff', { ascending: false }).limit(200);
    if (error) throw error;
    (data || []).forEach((r) => mine.set(Number(r.fixture_id), r));
    return data || [];
  }

  // ---------- بطاقة التوقع (تُستخدم في الصفحة وفي صفحة المباراة) ----------
  function card(m, opt = {}) {
    const id = Number(m.fixture_id); let saved = mine.get(id);
    const el = document.createElement('article'); el.className = 'pd-card';
    let h = saved ? saved.pick_home : 1; let a = saved ? saved.pick_away : 1; let dirty = !saved;
    const draw = () => {
      el.innerHTML = `${opt.noHead ? '' : `<div class="pd-meta"><span>${esc(m.league_label || m.league || '')}</span><span>${esc(when(m.kickoff))}</span></div>`}
        <div class="pd-row">
          <div class="pd-t">${crest(m.home_team, m.home_logo)}</div>
          <div class="pd-in"><button type="button" class="pd-b" data-k="h+" aria-label="زوّد أهداف المضيف">+</button><output>${nAr(h)}</output><button type="button" class="pd-b" data-k="h-" aria-label="قلّل أهداف المضيف">−</button></div>
          <span class="pd-x">:</span>
          <div class="pd-in"><button type="button" class="pd-b" data-k="a+" aria-label="زوّد أهداف الضيف">+</button><output>${nAr(a)}</output><button type="button" class="pd-b" data-k="a-" aria-label="قلّل أهداف الضيف">−</button></div>
          <div class="pd-t">${crest(m.away_team, m.away_logo)}</div>
        </div>
        <div class="pd-act"><button type="button" class="pd-save${saved && !dirty ? ' ok' : ''}" ${saved && !dirty ? 'disabled' : ''}>${saved && !dirty ? ico('check') + ' تم حفظ توقعك' : (saved ? 'حدّث توقعك' : 'احفظ توقعي')}</button></div>
        <p class="pd-msg" aria-live="polite"></p>`;
    };
    draw();
    el.addEventListener('click', async (e) => {
      const b = e.target.closest('.pd-b'); const s = e.target.closest('.pd-save');
      if (b) {
        const k = b.dataset.k; const d = k[1] === '+' ? 1 : -1;
        if (k[0] === 'h') h = Math.min(MAXG, Math.max(0, h + d)); else a = Math.min(MAXG, Math.max(0, a + d));
        dirty = true; draw(); return;
      }
      if (s && !s.disabled) {
        if (!user) { location.href = 'account.html'; return; }
        if (m.kickoff && new Date(m.kickoff).getTime() <= Date.now()) { $('.pd-msg', el).textContent = 'المباراة بدأت، التوقع اتقفل.'; return; }
        s.disabled = true;
        const row = { fixture_id: id, home_team: m.home_team, away_team: m.away_team, home_logo: https(m.home_logo) || null, away_logo: https(m.away_logo) || null, league: m.league_label || m.league || null, kickoff: m.kickoff, pick_home: h, pick_away: a };
        let error;
        if (saved) ({ error } = await db.from('predictions').update({ pick_home: h, pick_away: a }).eq('id', saved.id));
        else ({ error } = await db.from('predictions').insert(row));
        if (error) { s.disabled = false; $('.pd-msg', el).textContent = /relation|schema/i.test(error.message || '') ? 'ميزة التوقعات لسه متفعّلتش على السيرفر.' : 'تعذّر الحفظ. حاول تاني.'; return; }
        const rows = await loadMine().catch(() => []); saved = mine.get(id); if (saved) { h = saved.pick_home; a = saved.pick_away; }
        dirty = false; draw(); el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 600);
        if (opt.onSave) opt.onSave(rows);
      }
    });
    return el;
  }

  const loginBox = () => `<div class="pd-login"><b>سجّل دخولك عشان تتوقع وتنافس</b><p>التوقعات والنقاط ولوحة الصدارة مرتبطة بحسابك.</p><a class="btn" href="account.html">تسجيل الدخول</a></div>`;

  // ---------- صفحة التوقعات ----------
  async function pagePredict(root) {
    root.innerHTML = '<p class="note">جارٍ التحميل…</p>';
    const days = [cairoDay(0), cairoDay(1), cairoDay(2)]; const all = [];
    for (const d of days) {
      try { const { data } = await db.functions.invoke('football-matches', { body: { action: 'fixtures', sport: 'football', date: d } }); (data?.fixtures || []).forEach((f) => all.push(f)); } catch { /* يوم واحد فاشل ما يوقفش الباقي */ }
    }
    const seen = new Set();
    const up = all.filter((f) => !seen.has(f.fixture_id) && seen.add(f.fixture_id)).filter((f) => f.status === 'scheduled' && f.kickoff && new Date(f.kickoff).getTime() > Date.now() && f.fixture_id).sort((x, y) => new Date(x.kickoff) - new Date(y.kickoff));
    if (!up.length) { root.innerHTML = '<p class="note">مفيش مباريات جاية متاحة للتوقع دلوقتي. ارجع قريب.</p>'; return; }
    root.innerHTML = ''; const groups = new Map();
    up.forEach((f) => { const k = f.league_label || f.league || 'مباريات'; (groups.get(k) || groups.set(k, []).get(k)).push(f); });
    for (const [k, list] of groups) {
      const sec = document.createElement('section'); sec.className = 'pd-grp'; sec.innerHTML = `<h3>${esc(k)}</h3>`;
      list.slice(0, 12).forEach((f) => sec.append(card(f)));
      root.append(sec);
    }
  }

  const BADGE = (r) => r.void ? '<em class="pd-pt v">ملغي</em>' : r.settled ? `<em class="pd-pt p${r.points}">${r.exact ? '+٥ نتيجة تامة' : '+' + nAr(r.points)}</em>` : '<em class="pd-pt w">في الانتظار</em>';
  async function pageMine(root) {
    root.innerHTML = '<p class="note">جارٍ التحميل…</p>';
    let rows = await loadMine();
    const stale = rows.some((r) => !r.settled && new Date(r.kickoff).getTime() < Date.now() - 110 * 60000);
    let last = 0; try { last = Number(localStorage.getItem('yr-settle') || 0); } catch { /* ok */ }
    if (stale && Date.now() - last > 5 * 60000) {
      try { localStorage.setItem('yr-settle', String(Date.now())); } catch { /* ok */ }
      try { await db.functions.invoke('football-matches', { body: { action: 'settle' } }); rows = await loadMine(); } catch { /* هيتحسب المرة الجاية */ }
    }
    if (!rows.length) { root.innerHTML = '<p class="note">لسه ما توقعتش أي مباراة. روح لتبويب "توقّع" وابدأ.</p>'; return; }
    const pts = rows.filter((r) => r.settled && !r.void).reduce((s, r) => s + (r.points || 0), 0);
    const ex = rows.filter((r) => r.exact).length;
    root.innerHTML = `<div class="pd-sum"><div><b>${nAr(pts)}</b><small>نقطة</small></div><div><b>${nAr(ex)}</b><small>نتيجة تامة</small></div><div><b>${nAr(rows.length)}</b><small>توقع</small></div></div>` + rows.map((r) => `<article class="pd-card his">
      <div class="pd-meta"><span>${esc(r.league || '')}</span><span>${esc(when(r.kickoff))}</span></div>
      <div class="pd-row ro"><div class="pd-t">${crest(r.home_team, r.home_logo)}</div>
        <div class="pd-res"><span>توقعك</span><b>${nAr(r.pick_home)} : ${nAr(r.pick_away)}</b>${r.settled ? `<span>النتيجة</span><b class="fin">${nAr(r.result_home)} : ${nAr(r.result_away)}</b>` : ''}</div>
        <div class="pd-t">${crest(r.away_team, r.away_logo)}</div></div>
      <div class="pd-foot">${BADGE(r)}</div></article>`).join('');
  }

  async function pageBoard(root, days) {
    root.innerHTML = '<p class="note">جارٍ التحميل…</p>';
    const { data, error } = await db.rpc('prediction_leaderboard', { p_days: days, p_limit: 50 });
    if (error) { root.innerHTML = '<p class="note">لوحة الصدارة لسه متفعّلتش على السيرفر.</p>'; return; }
    if (!data || !data.length) { root.innerHTML = '<p class="note">لسه مفيش نتايج محسوبة. أول ما تخلص المباريات هتظهر الصدارة هنا.</p>'; return; }
    const medal = ['gold', 'silver', 'bronze'];
    root.innerHTML = `<div class="pd-board">${data.map((r) => `<div class="pd-lb${r.me ? ' me' : ''} ${medal[r.rank - 1] || ''}"><b class="rk">${nAr(r.rank)}</b><span class="nm">${esc(r.name)}${r.me ? ' <small>(أنت)</small>' : ''}</span><span class="ex" title="نتيجة تامة">${ico('check')} ${nAr(r.exact_count)}</span><b class="pt">${nAr(r.points)}</b></div>`).join('')}</div>`;
  }

  async function initPage() {
    const root = $('#pd-root'); const tabs = document.querySelectorAll('[data-pt]'); if (!root) return;
    await getUser();
    const show = async (t) => {
      tabs.forEach((b) => b.classList.toggle('active', b.dataset.pt === t));
      $('#pd-sub').hidden = t !== 'board';
      if (t !== 'board' && !user) { root.innerHTML = loginBox(); return; }
      try {
        await loadMine().catch(() => {});
        if (t === 'predict') await pagePredict(root); else if (t === 'mine') await pageMine(root);
        else await pageBoard(root, $('#pd-sub .active')?.dataset.d ? Number($('#pd-sub .active').dataset.d) : null);
      } catch (e) { root.innerHTML = '<p class="note">تعذّر التحميل. حاول تاني.</p>'; console.error(e); }
    };
    tabs.forEach((b) => b.addEventListener('click', () => show(b.dataset.pt)));
    document.querySelectorAll('#pd-sub button').forEach((b) => b.addEventListener('click', () => { document.querySelectorAll('#pd-sub button').forEach((x) => x.classList.toggle('active', x === b)); pageBoard(root, b.dataset.d ? Number(b.dataset.d) : null); }));
    show('predict');
  }

  // ---------- صندوق التوقع داخل صفحة المباراة ----------
  window.yrPredictMount = async (m) => {
    try {
      if (!db || !m || m.status !== 'scheduled' || !m.fixture_id || !m.kickoff || new Date(m.kickoff).getTime() <= Date.now()) return;
      if ($('#pd-box')) return;
      const slot = $('#pd-slot') || $('#match-hero'); if (!slot) return;
      const box = document.createElement('div'); box.id = 'pd-box'; box.className = 'pd-launch';
      const mn = () => mine.get(Number(m.fixture_id));
      const label = () => { const s = mn(); return s ? `توقعك ${nAr(s.pick_home)} : ${nAr(s.pick_away)} · تعديل` : 'توقّع النتيجة واكسب نقاط'; };
      box.innerHTML = `<button type="button" class="pd-open"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/></svg><span><b>توقّع النتيجة</b><small id="pd-lab">واكسب نقاط وتصدّر</small></span></button>`;
      if (slot.id === 'pd-slot') slot.append(box); else slot.after(box);
      await getUser();
      if (user) { await loadMine().catch(() => {}); const l = $('#pd-lab'); if (l) l.textContent = label(); }
      const close = () => { const o = $('#pd-modal'); if (o) { o.classList.remove('on'); setTimeout(() => o.remove(), 180); } document.removeEventListener('keydown', esc2); };
      const esc2 = (e) => { if (e.key === 'Escape') close(); };
      box.querySelector('.pd-open').addEventListener('click', async () => {
        if ($('#pd-modal')) return;
        const o = document.createElement('div'); o.id = 'pd-modal'; o.className = 'pd-modal';
        o.innerHTML = '<div class="pd-glass" role="dialog" aria-modal="true" aria-label="توقّع النتيجة"><button type="button" class="pd-x2" aria-label="إغلاق">✕</button><div class="pd-hd"><h2>توقّع النتيجة</h2><a href="predictions.html">لوحة الصدارة</a></div><div class="pd-mbody"></div></div>';
        document.body.append(o); requestAnimationFrame(() => o.classList.add('on'));
        o.addEventListener('click', (e) => { if (e.target === o) close(); });
        o.querySelector('.pd-x2').addEventListener('click', close);
        document.addEventListener('keydown', esc2);
        const body = o.querySelector('.pd-mbody');
        if (!user) { body.innerHTML = loginBox(); return; }
        body.append(card(m, { noHead: true, onSave: () => { const l = $('#pd-lab'); if (l) l.textContent = label(); setTimeout(close, 900); } }));
      });
    } catch (e) { console.error(e); }
  };

  if (document.getElementById('pd-root')) initPage();
})();
