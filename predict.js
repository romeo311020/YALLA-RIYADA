/* توقعات المباريات: «توقّع» · «توقعاتي» · «المتصدرين». الحساب بيتم في السيرفر بعد نهاية المباراة من النتيجة الحقيقية. */
(() => {
  'use strict';
  const db = window.yrSupabase;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const https = (u) => { try { const x = new URL(u); return x.protocol === 'https:' ? x.href : ''; } catch { return ''; } };
  const nAr = (n) => Number(n).toLocaleString('ar-EG');
  const tn = (n) => (window.YR_NAMES ? window.YR_NAMES.team(n) : n);
  const ico = (n) => (window.yrIco ? window.yrIco(n) : '');
  const MAXG = 20; const SR_MIN = 3_000_000_000; // أرقام SportSRC مش بتتحسب تلقائيًا
  const crest = (name, logo) => `<span class="pq-cr">${https(logo) ? `<img src="${esc(https(logo))}" alt="" loading="lazy" referrerpolicy="no-referrer">` : '⚽'}</span><b>${esc(tn(name))}</b>`;
  const dtf = (iso, o) => { try { return new Date(iso).toLocaleString('ar-EG', { ...o, timeZone: 'Africa/Cairo' }); } catch { return ''; } };
  const when = (iso) => dtf(iso, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const cairoDay = (off = 0) => new Date(Date.now() + off * 864e5).toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
  const missing = (e) => /relation|schema|function|does not exist|could not find/i.test(e?.message || '');

  let user = null; let mine = new Map();
  async function getUser() { if (!db) return null; try { const { data } = await db.auth.getSession(); user = data?.session?.user || null; } catch { user = null; } return user; }
  async function loadMine() {
    mine = new Map(); if (!user) return [];
    const { data, error } = await db.from('predictions').select('*').order('kickoff', { ascending: false }).limit(300);
    if (error) throw error;
    (data || []).forEach((r) => mine.set(Number(r.fixture_id), r));
    return data || [];
  }

  // ---------- بطاقة التوقع (الصفحة + صفحة المباراة) ----------
  const outcome = (h, a) => (h > a ? 'h' : h < a ? 'a' : 'd');
  function card(m, opt = {}) {
    const id = Number(m.fixture_id); let saved = mine.get(id);
    const el = document.createElement('article'); el.className = 'pq-card';
    let h = saved ? saved.pick_home : 1; let a = saved ? saved.pick_away : 0; let dirty = !saved;
    const HN = tn(m.home_team), AN = tn(m.away_team);
    const draw = () => {
      const o = outcome(h, a); const clean = saved && !dirty;
      el.innerHTML = `${opt.noHead ? '' : `<div class="pq-top"><span class="pq-badge${saved ? ' done' : ''}">${saved ? 'تم توقعك' : 'متاح الآن'}</span><span class="pq-lg">${esc(m.league_label || m.league || '')}</span></div>`}
        <div class="pq-teams"><div class="pq-t">${crest(m.home_team, m.home_logo)}</div><div class="pq-mid"><strong>VS</strong><small>${esc(when(m.kickoff))}</small></div><div class="pq-t">${crest(m.away_team, m.away_logo)}</div></div>
        <div class="pq-q">اختر توقعك:</div>
        <div class="pq-opts" role="group" aria-label="اختر نتيجة المباراة">
          <button type="button" class="pq-o${o === 'h' ? ' on' : ''}" data-o="h" aria-pressed="${o === 'h'}">فوز ${esc(HN)}</button>
          <button type="button" class="pq-o${o === 'd' ? ' on' : ''}" data-o="d" aria-pressed="${o === 'd'}">تعادل</button>
          <button type="button" class="pq-o${o === 'a' ? ' on' : ''}" data-o="a" aria-pressed="${o === 'a'}">فوز ${esc(AN)}</button>
        </div>
        <div class="pq-score" aria-label="النتيجة المتوقعة">
          <div class="pq-st"><button type="button" class="pq-b" data-k="h-" aria-label="قلّل أهداف ${esc(HN)}">−</button><output>${nAr(h)}</output><button type="button" class="pq-b" data-k="h+" aria-label="زوّد أهداف ${esc(HN)}">+</button></div>
          <span class="pq-hint">النتيجة الدقيقة = ٥ نقاط</span>
          <div class="pq-st"><button type="button" class="pq-b" data-k="a-" aria-label="قلّل أهداف ${esc(AN)}">−</button><output>${nAr(a)}</output><button type="button" class="pq-b" data-k="a+" aria-label="زوّد أهداف ${esc(AN)}">+</button></div>
        </div>
        <button type="button" class="pq-save${clean ? ' ok' : ''}" ${clean ? 'disabled' : ''}>${clean ? ico('check') + ' تم حفظ توقعك' : (saved ? 'حدّث التوقع' : 'حفظ التوقع') + ' ' + ico('check')}</button>
        <p class="pd-msg" aria-live="polite"></p>`;
    };
    draw();
    el.addEventListener('click', async (e) => {
      const ob = e.target.closest('.pq-o'); const b = e.target.closest('.pq-b'); const s = e.target.closest('.pq-save');
      if (ob) { const k = ob.dataset.o; if (outcome(h, a) !== k) { [h, a] = k === 'h' ? [1, 0] : k === 'd' ? [1, 1] : [0, 1]; } dirty = true; draw(); return; }
      if (b) { const k = b.dataset.k; const d = k[1] === '+' ? 1 : -1; if (k[0] === 'h') h = Math.min(MAXG, Math.max(0, h + d)); else a = Math.min(MAXG, Math.max(0, a + d)); dirty = true; draw(); return; }
      if (s && !s.disabled) {
        if (!user) { location.href = 'account.html'; return; }
        if (m.kickoff && new Date(m.kickoff).getTime() <= Date.now()) { $('.pd-msg', el).textContent = 'المباراة بدأت، التوقع اتقفل.'; return; }
        s.disabled = true;
        const row = { fixture_id: id, home_team: m.home_team, away_team: m.away_team, home_logo: https(m.home_logo) || null, away_logo: https(m.away_logo) || null, league: m.league_label || m.league || null, kickoff: m.kickoff, pick_home: h, pick_away: a };
        let error;
        if (saved) ({ error } = await db.from('predictions').update({ pick_home: h, pick_away: a }).eq('id', saved.id));
        else ({ error } = await db.from('predictions').insert(row));
        if (error) { s.disabled = false; $('.pd-msg', el).textContent = missing(error) ? 'ميزة التوقعات لسه متفعّلتش على السيرفر (الأدمن لازم يشغّل ملف SQL).' : 'تعذّر الحفظ. حاول تاني.'; return; }
        const rows = await loadMine().catch(() => []); saved = mine.get(id); if (saved) { h = saved.pick_home; a = saved.pick_away; }
        dirty = false; draw(); el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 600);
        if (opt.onSave) opt.onSave(rows);
        if (opt.afterSave) opt.afterSave();
      }
    });
    return el;
  }

  const loginBox = (t = 'سجّل دخولك عشان تتوقع وتنافس') => `<div class="pq-login"><b>${esc(t)}</b><p>التوقعات والنقاط ولوحة المتصدرين مرتبطة بحسابك.</p><a class="btn primary" href="account.html">تسجيل الدخول</a></div>`;

  // ---------- شريط الإحصائيات (فوق) ----------
  async function paintStats() {
    const box = $('#pq-stats'); if (!box) return;
    if (!user) { box.innerHTML = `<a class="pq-cta" href="account.html">سجّل دخولك علشان تبدأ تجمع النقاط ←</a>`; return; }
    const { data, error } = await db.rpc('my_prediction_stats');
    const s = !error && Array.isArray(data) ? data[0] : null;
    const cell = (i, v, l) => `<div class="pq-sc"><i aria-hidden="true">${i}</i><b>${v}</b><span>${l}</span></div>`;
    box.innerHTML = cell('🏆', s ? nAr(s.points) : '–', 'نقطة') + cell('📊', s && s.rank ? '#' + nAr(s.rank) : '–', 'ترتيبك') + cell(ico('check') || '✓', s ? `${nAr(s.correct)}/${nAr(s.settled)}` : '–', 'توقع صحيح');
    window.__pqStats = s;
  }

  // ---------- مباريات متاحة: الدالة ← النسخ المحفوظة ----------
  async function loadUpcoming() {
    const all = [];
    for (const d of [cairoDay(0), cairoDay(1), cairoDay(2)]) {
      try { const { data } = await db.functions.invoke('football-matches', { body: { action: 'fixtures', sport: 'football', date: d } }); (data?.fixtures || []).forEach((f) => all.push(f)); } catch { /* يوم واحد فاشل ما يوقفش الباقي */ }
    }
    if (!all.length) {
      try {
        const { data } = await db.from('fixture_overrides').select('fixture_id,status,kickoff,snapshot').not('snapshot', 'is', null).limit(300);
        (data || []).forEach((o) => { if (o.snapshot) all.push({ ...o.snapshot, fixture_id: o.fixture_id, status: o.status || o.snapshot.status, kickoff: o.kickoff || o.snapshot.kickoff }); });
      } catch { /* بدون نسخ */ }
    }
    const seen = new Set(); const now = Date.now();
    return all.filter((f) => f.fixture_id && !seen.has(f.fixture_id) && seen.add(f.fixture_id))
      .filter((f) => Number(f.fixture_id) < SR_MIN && f.status === 'scheduled' && f.kickoff && new Date(f.kickoff).getTime() > now && f.home_team && f.away_team)
      .sort((x, y) => new Date(x.kickoff) - new Date(y.kickoff));
  }
  async function pagePredict(root) {
    root.innerHTML = '<p class="note">جارٍ التحميل…</p>';
    const up = await loadUpcoming();
    if (!up.length) { root.innerHTML = '<div class="pq-empty"><b>مفيش مباريات متاحة للتوقع دلوقتي</b><p>المباريات بتظهر هنا قبل ركلة البداية. ارجع قريب.</p></div>'; return; }
    root.innerHTML = '<h2 class="pq-h"><span>المباريات المتاحة للتوقع</span><i class="dot" aria-hidden="true"></i></h2><div class="pq-grid"></div>';
    const grid = $('.pq-grid', root);
    up.slice(0, 40).forEach((f) => grid.append(card(f, { afterSave: paintStats })));
  }

  // ---------- توقعاتي ----------
  const state = (r) => (r.void ? 'void' : !r.settled ? 'wait' : r.points > 0 ? 'ok' : 'bad');
  const CHIP = { ok: ['ناجح', 'ok'], bad: ['خاطئ', 'bad'], void: ['ملغي', 'void'], wait: ['في الانتظار', 'wait'] };
  let mineFilter = 'all';
  async function pageMine(root) {
    root.innerHTML = '<p class="note">جارٍ التحميل…</p>';
    let rows = await loadMine();
    const stale = rows.some((r) => !r.settled && new Date(r.kickoff).getTime() < Date.now() - 110 * 60000);
    let last = 0; try { last = Number(localStorage.getItem('yr-settle') || 0); } catch { /* ok */ }
    if (stale && Date.now() - last > 3 * 60000) {
      try { localStorage.setItem('yr-settle', String(Date.now())); } catch { /* ok */ }
      try { await db.functions.invoke('football-matches', { body: { action: 'settle' } }); rows = await loadMine(); paintStats(); } catch { /* هيتحسب المرة الجاية */ }
    }
    if (!rows.length) { root.innerHTML = '<div class="pq-empty"><b>لسه ما توقعتش أي مباراة</b><p>افتح تبويب «توقّع» واختار مباراة وابدأ تجمع النقاط.</p></div>'; return; }
    const settled = rows.filter((r) => r.settled && !r.void); const ok = settled.filter((r) => r.points > 0);
    const pct = settled.length ? Math.round((ok.length / settled.length) * 100) : 0; const pts = settled.reduce((s, r) => s + (r.points || 0), 0);
    const FL = [['all', 'كل التوقعات'], ['ok', 'الناجحة'], ['bad', 'الخاطئة'], ['wait', 'الجارية']];
    const draw = () => {
      const list = rows.filter((r) => mineFilter === 'all' || state(r) === mineFilter);
      $('.pq-list', root).innerHTML = list.length ? list.map((r) => { const st = state(r); const [t, c] = CHIP[st];
        return `<article class="pq-card his ${c}"><div class="pq-top"><span class="pq-chip ${c}">${st === 'ok' ? ico('check') : st === 'bad' ? '✕' : ''} ${t}</span><span class="pq-lg">${esc(r.league || '')} · ${esc(dtf(r.kickoff, { day: 'numeric', month: 'numeric', year: 'numeric' }))}</span></div>
          <div class="pq-teams"><div class="pq-t">${crest(r.home_team, r.home_logo)}</div>
          <div class="pq-mid">${r.settled ? `<div class="pq-fin"><span>${nAr(r.result_home)}</span><i>-</i><span>${nAr(r.result_away)}</span></div>` : '<strong>VS</strong>'}<small class="pq-pk">توقعك: <span class="pq-n">${nAr(r.pick_home)}</span> - <span class="pq-n">${nAr(r.pick_away)}</span></small></div>
          <div class="pq-t">${crest(r.away_team, r.away_logo)}</div></div>
          ${r.settled && !r.void ? `<div class="pq-pts p${r.points}">${r.exact ? '🎯 نتيجة دقيقة ' : ''}+${nAr(r.points)} نقطة</div>` : ''}</article>`; }).join('') : '<p class="note">مفيش توقعات في القسم ده.</p>';
      root.querySelectorAll('.pq-chips button').forEach((b) => { const on = b.dataset.f === mineFilter; b.setAttribute('aria-pressed', String(on)); });
    };
    root.innerHTML = `<section class="pq-sum"><div class="pq-ring" style="--p:${pct}"><div><b>${nAr(pct)}٪</b><small>نسبة النجاح</small></div></div>
      <div class="pq-sg"><div><b>${nAr(rows.length)}</b><span>إجمالي التوقعات</span></div><div><b>${nAr(ok.length)}</b><span>توقع صحيح</span></div><div><b>${nAr(pts)}</b><span>نقطة</span></div></div></section>
      <div class="pq-chips" role="group" aria-label="تصفية">${FL.map(([k, l]) => `<button type="button" data-f="${k}" aria-pressed="${k === mineFilter}">${l}</button>`).join('')}</div><div class="pq-list pq-grid"></div>`;
    root.querySelector('.pq-chips').addEventListener('click', (e) => { const b = e.target.closest('button[data-f]'); if (!b) return; mineFilter = b.dataset.f; draw(); });
    draw();
  }

  // ---------- المتصدرين ----------
  let boardDays = 7;
  const av = (r) => (https(r.avatar) ? `<img src="${esc(https(r.avatar))}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<span>${esc(String(r.name || '؟').trim().charAt(0))}</span>`);
  async function pageBoard(root) {
    root.innerHTML = '<p class="note">جارٍ التحميل…</p>';
    const { data, error } = await db.rpc('prediction_leaderboard', { p_days: boardDays, p_limit: 50 });
    const TABS = [[7, 'الأسبوعي'], [30, 'الشهري'], [null, 'الموسمي']];
    const tabs = `<div class="pq-seg" role="tablist" aria-label="الفترة">${TABS.map(([d, l]) => `<button type="button" role="tab" data-d="${d ?? ''}" aria-selected="${d === boardDays}">${l}</button>`).join('')}</div>`;
    let body;
    if (error) body = `<div class="pq-empty"><b>لوحة المتصدرين لسه متفعّلتش</b><p>الأدمن لازم يشغّل ملف SQL الخاص بالتوقعات.</p></div>`;
    else if (!data || !data.length) body = '<div class="pq-empty"><b>لسه مفيش نتايج محسوبة</b><p>أول ما تخلص المباريات وتتحسب النقاط هتظهر الصدارة هنا.</p></div>';
    else {
      const top = data.slice(0, 3); const order = [top[1], top[0], top[2]].filter(Boolean);
      const pod = `<div class="pq-pod n${top.length}">${order.map((r) => `<div class="pq-pc r${r.rank}${r.me ? ' me' : ''}"><div class="pq-av">${r.rank === 1 ? '<i class="crown" aria-hidden="true">👑</i>' : ''}${av(r)}<em>${nAr(r.rank)}</em></div><b class="nm">${esc(r.name)}</b><span class="pt">${nAr(r.points)}</span><small>نقطة</small></div>`).join('')}</div>`;
      const rest = data.slice(3).map((r) => `<div class="pq-lb${r.me ? ' me' : ''}"><b class="rk">${nAr(r.rank)}</b><span class="pq-av s">${av(r)}</span><span class="nm">${esc(r.name)}${r.me ? ' <small>(أنت)</small>' : ''}</span><span class="ex" title="نتيجة دقيقة">🎯 ${nAr(r.exact_count)}</span><span class="pt"><b>${nAr(r.points)}</b><small>نقطة</small></span></div>`).join('');
      const meIn = data.some((r) => r.me); const s = window.__pqStats;
      const mine2 = user && !meIn && s && s.rank ? `<div class="pq-lb me"><b class="rk">${nAr(s.rank)}</b><span class="pq-av s"><span>أنا</span></span><span class="nm">ترتيبك (موسمي) <small>(أنت)</small></span><span class="ex"></span><span class="pt"><b>${nAr(s.points)}</b><small>نقطة</small></span></div>` : '';
      body = pod + `<div class="pq-lbs">${rest}${mine2}</div><button type="button" class="pq-chal" id="pq-chal"><span class="ic" aria-hidden="true">🏆</span><span><b>تحدّى أصدقاءك</b><small>مين هيكون المتصدر القادم؟</small></span><i aria-hidden="true">←</i></button>`;
    }
    root.innerHTML = tabs + body;
    root.querySelector('.pq-seg').addEventListener('click', (e) => { const b = e.target.closest('button[data-d]'); if (!b) return; boardDays = b.dataset.d ? Number(b.dataset.d) : null; pageBoard(root); });
    $('#pq-chal', root)?.addEventListener('click', async () => {
      const data2 = { title: 'يلا رياضة — توقعات المباريات', text: 'تحداني في توقعات المباريات على يلا رياضة!', url: location.origin + location.pathname };
      try { if (navigator.share) await navigator.share(data2); else { await navigator.clipboard.writeText(data2.url); const b = $('#pq-chal small', root); if (b) b.textContent = 'تم نسخ الرابط ✓'; } } catch { /* ألغى المشاركة */ }
    });
  }

  async function initPage() {
    const root = $('#pd-root'); const tabs = document.querySelectorAll('[data-pt]'); if (!root) return;
    await getUser(); paintStats();
    const show = async (t) => {
      tabs.forEach((b) => { const on = b.dataset.pt === t; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); });
      try { history.replaceState(null, '', t === 'predict' ? location.pathname : '#' + t); } catch { /* اختياري */ }
      if (t !== 'board' && !user) { root.innerHTML = loginBox(); return; }
      try {
        await loadMine().catch(() => {});
        if (t === 'predict') await pagePredict(root); else if (t === 'mine') await pageMine(root); else await pageBoard(root);
      } catch (e) { root.innerHTML = `<div class="pq-empty"><b>${missing(e) ? 'ميزة التوقعات لسه متفعّلتش على السيرفر' : 'تعذّر التحميل'}</b><p>${missing(e) ? 'الأدمن لازم يشغّل ملفات SQL الخاصة بالتوقعات.' : 'حاول تاني بعد شوية.'}</p></div>`; console.error(e); }
    };
    tabs.forEach((b) => b.addEventListener('click', () => show(b.dataset.pt)));
    const h = location.hash.slice(1); show(['mine', 'board'].includes(h) ? h : 'predict');
    if (db) db.auth.onAuthStateChange((_e, s) => { const u = s?.user || null; if ((u && !user) || (!u && user)) { user = u; paintStats(); const act = $('[data-pt].active'); if (act) show(act.dataset.pt); } });
  }

  // ---------- صندوق التوقع داخل صفحة المباراة ----------
  window.yrPredictMount = async (m) => {
    try {
      if (!db || !m || m.status !== 'scheduled' || !m.fixture_id || Number(m.fixture_id) >= SR_MIN || !m.kickoff || new Date(m.kickoff).getTime() <= Date.now()) return;
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
        o.innerHTML = '<div class="pd-glass" role="dialog" aria-modal="true" aria-label="توقّع النتيجة"><button type="button" class="pd-x2" aria-label="إغلاق">✕</button><div class="pd-hd"><h2>توقّع النتيجة</h2><a href="predictions.html#board">المتصدرين</a></div><div class="pd-mbody"></div></div>';
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
