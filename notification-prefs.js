/* صفحة اختيار المفضلة: الفرق / اللاعبين + بحث + ملخص ثابت + حفظ فعلي في push_follows. */
(() => {
  'use strict';
  const db = window.yrSupabase; const host = document.getElementById('pf-root');
  if (!db || !host) return;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const nAr = (n) => Number(n).toLocaleString('ar-EG');
  const sv = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const I = { ok: sv('<path d="M5 12.5l4.5 4.5L19 7.5"/>'), plus: sv('<path d="M12 5v14M5 12h14"/>'), search: sv('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>') };
  const KIND = {
    team: { one: 'فريق', many: 'الفرق', sub: 'علّم على الفرق اللي عايز تتابعها.', ph: 'اسم الفريق (مثلًا: ليفربول)' },
    player: { one: 'لاعب', many: 'اللاعبين', sub: 'علّم على اللاعبين اللي عايز تتابع أخبارهم.', ph: 'اسم اللاعب (مثلًا: هالاند)' },
  };
  const MAX_PENDING = 5;
  let user = null; let targets = []; let saved = new Set(); let draft = new Set(); let pending = []; let reqOk = true;
  let tab = 'team'; let q = ''; let adding = false; let saving = false; let busy = false; let msg = ''; let err = false;

  const back = document.getElementById('pf-back');
  if (back) back.addEventListener('click', (e) => {
    let same = false; try { same = document.referrer && new URL(document.referrer).origin === location.origin; } catch { /* ok */ }
    if (same && history.length > 1) { e.preventDefault(); history.back(); }
  });
  const isDirty = () => draft.size !== saved.size || [...draft].some((x) => !saved.has(x));
  window.addEventListener('beforeunload', (e) => { if (isDirty() && !saving) { e.preventDefault(); e.returnValue = ''; } });

  const cnt = (kind) => targets.filter((x) => x.kind === kind && draft.has(x.id)).length;
  const media = (x) => {
    if (x.logo_url && /^https:\/\//.test(x.logo_url)) return x.logo_url;
    return x.api_id > 0 ? `https://media.api-sports.io/football/${x.kind === 'team' ? 'teams' : 'players'}/${Number(x.api_id)}.png` : '';
  };
  const avatar = (x, name) => { const u = media(x); return `<i class="av ${x.kind}" aria-hidden="true">${u ? `<img src="${esc(u)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">` : ''}<b>${initial(name)}</b></i>`; };
  const initial = (n) => esc(String(n).trim().charAt(0));

  async function load() {
    const { data: u } = await db.auth.getUser(); user = u?.user || null;
    if (!user) { host.innerHTML = '<section class="np-card np-login"><h2>سجّل دخولك الأول</h2><p class="np-sub">الاختيارات مرتبطة بحسابك.</p><a class="nw-btn pri" href="account.html">تسجيل الدخول</a></section>'; try { localStorage.setItem('yr-next', 'notification-preferences.html'); } catch { /* ok */ } return; }
    const getT = async () => { let x = await db.from('push_targets').select('id,kind,name_ar,name_en,api_id,logo_url').eq('active', true).order('sort_order'); if (x.error) x = await db.from('push_targets').select('id,kind,name_ar,name_en').eq('active', true).order('sort_order'); return x; };
    const [t, f, r] = await Promise.all([
      getT(),
      db.from('push_follows').select('target_id').eq('user_id', user.id),
      db.from('push_target_requests').select('id,kind,name').eq('user_id', user.id).eq('status', 'pending').order('created_at'),
    ]);
    if (t.error) { host.innerHTML = '<section class="np-card"><p class="np-sub err">تعذّر تحميل القوائم. حدّث الصفحة وحاول تاني.</p></section>'; return; }
    targets = t.data || []; saved = new Set((f.data || []).map((x) => x.target_id)); draft = new Set(saved);
    reqOk = !r.error; pending = r.error ? [] : (r.data || []);
    render();
  }

  function list() {
    const k = KIND[tab]; const qq = q.trim().toLowerCase();
    const items = targets.filter((x) => x.kind === tab && (!qq || x.name_ar.toLowerCase().includes(qq)));
    const mine = pending.filter((x) => x.kind === tab && (!qq || x.name.toLowerCase().includes(qq)));
    const chips = items.map((x) => `<label class="pf-row"><input type="checkbox" data-t="${esc(x.id)}"${draft.has(x.id) ? ' checked' : ''}>${avatar(x, x.name_ar)}<span class="nm"><b>${esc(x.name_ar)}</b>${x.name_en ? `<small dir="ltr">${esc(x.name_en)}</small>` : ''}</span><i class="ck" aria-hidden="true">${I.ok}</i></label>`).join('')
      + mine.map((x) => `<div class="pf-row pending"><i class="av ${x.kind}" aria-hidden="true"><b>${initial(x.name)}</b></i><span class="nm"><b>${esc(x.name)}</b><small>قيد المراجعة</small></span></div>`).join('');
    const empty = qq ? `<p class="np-empty">مفيش نتيجة لـ «${esc(q.trim())}».</p>` : `<p class="np-empty">لا يوجد ${k.many} متاحين حاليًا.</p>`;
    return chips ? `<div class="pf-list">${chips}</div>` : empty;
  }
  function render() {
    const k = KIND[tab]; const total = cnt('team') + cnt('player'); const dirty = isDirty();
    const TI = { team: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4l-5 3 2 4 2-1v10h10V10l2 1 2-4-5-3a4 4 0 01-8 0z"/></svg>', player: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c.8-4 3.7-6 7.5-6s6.7 2 7.5 6"/></svg>' };
    const tabBtn = (kind, label) => `<button type="button" role="tab" class="pf-tab${tab === kind ? ' on' : ''}" data-tab="${kind}" aria-selected="${tab === kind}"><span class="pf-ti">${TI[kind]}</span><b>${label}</b><small>${nAr(cnt(kind))} مختار</small></button>`;
    const form = adding ? `<form class="np-form" id="nw-form"><input id="nw-name" maxlength="60" minlength="2" required placeholder="${k.ph}" aria-label="اسم ${k.one}" autocomplete="off"><button class="nw-btn pri" type="submit">إرسال</button><button class="nw-btn ghost" type="button" id="nw-cancel">إلغاء</button><p class="hint">هنراجع الطلب، ولما نوافق عليه هيظهر لك ويتفعّل تلقائيًا.</p></form>` : '';
    host.innerHTML = `<section class="np-card"><div class="pf-tabs" role="tablist">${tabBtn('team', 'الفرق')}${tabBtn('player', 'اللاعبون')}</div>
      <p class="np-sub">${k.sub}</p>
      <label class="np-search">${I.search}<input id="np-q" type="search" value="${esc(q)}" placeholder="ابحث في ${k.many}" autocomplete="off" aria-label="بحث"></label>
      <div id="pf-list">${list()}</div>
      ${reqOk ? `<button type="button" class="np-add" id="nw-add">${I.plus}<span>مش لاقي ${k.one}؟ اطلب إضافته</span></button>` : ''}${form}</section>
      <div class="sv-bar"><div class="pf-sum"><b>${nAr(cnt('team'))}</b> فرق · <b>${nAr(cnt('player'))}</b> لاعبين</div>
      <button class="np-save" id="pf-save" type="button"${saving || !dirty ? ' disabled' : ''}>${saving ? '<i class="np-spin"></i><span>جارٍ الحفظ…</span>' : '<span>حفظ الاختيارات</span>'}</button></div>
      <p class="np-msg${err ? ' err' : ''}" id="np-msg" role="status">${esc(msg || (total && !dirty ? '' : ''))}</p>`;
    wire();
  }
  function relist() { const el = document.getElementById('pf-list'); if (el) { el.innerHTML = list(); wireChips(); } }
  function wireChips() {
    host.querySelectorAll('[data-t]').forEach((c) => c.addEventListener('change', () => { if (c.checked) draft.add(c.dataset.t); else draft.delete(c.dataset.t); msg = ''; refresh(); }));
  }
  function refresh() {
    host.querySelectorAll('.pf-tab').forEach((t) => { const sp = t.querySelector('small'); if (sp) sp.textContent = `${nAr(cnt(t.dataset.tab))} مختار`; });
    const s = host.querySelector('.pf-sum'); if (s) s.innerHTML = `<b>${nAr(cnt('team'))}</b> فرق · <b>${nAr(cnt('player'))}</b> لاعبين`;
    const b = document.getElementById('pf-save'); if (b) b.disabled = saving || !isDirty();
    const m = document.getElementById('np-msg'); if (m) m.textContent = '';
  }
  function wire() {
    wireChips();
    host.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { if (tab === b.dataset.tab) return; tab = b.dataset.tab; q = ''; adding = false; msg = ''; render(); }));
    const qi = host.querySelector('#np-q'); if (qi) qi.addEventListener('input', () => { q = qi.value; relist(); });
    const on = (id, fn) => { const e = host.querySelector(id); if (e) e.addEventListener('click', fn); };
    on('#pf-save', save);
    on('#nw-add', () => { adding = true; render(); const i = host.querySelector('#nw-name'); if (i) i.focus(); });
    on('#nw-cancel', () => { adding = false; render(); });
    const form = host.querySelector('#nw-form'); if (form) form.addEventListener('submit', request);
  }
  const say = (t, bad) => { msg = t; err = !!bad; const m = document.getElementById('np-msg'); if (m) { m.textContent = t; m.classList.toggle('err', !!bad); } };

  async function save() {
    if (saving || !isDirty()) return; saving = true; render();
    const add = [...draft].filter((x) => !saved.has(x)); const del = [...saved].filter((x) => !draft.has(x));
    let bad = null;
    if (add.length) { const { error } = await db.from('push_follows').upsert(add.map((id) => ({ user_id: user.id, target_id: id })), { onConflict: 'user_id,target_id', ignoreDuplicates: true }); if (error) bad = error; }
    if (!bad && del.length) { const { error } = await db.from('push_follows').delete().eq('user_id', user.id).in('target_id', del); if (error) bad = error; }
    saving = false;
    if (bad) { render(); say('تعذّر الحفظ: ' + bad.message, true); return; }
    saved = new Set(draft); render(); say('تم حفظ اختياراتك ✓ — جارٍ الرجوع…', false);
    setTimeout(() => { location.href = 'notifications.html'; }, 700);
  }

  async function request(e) {
    e.preventDefault(); if (busy) return;
    const input = host.querySelector('#nw-name'); const name = (input.value || '').replace(/\s+/g, ' ').trim();
    if (name.length < 2) { say('اكتب الاسم.', true); return; }
    if (pending.filter((x) => x.kind === tab).length >= MAX_PENDING) { say(`عندك ${MAX_PENDING} طلبات لسه تحت المراجعة. استنى لما نراجعهم.`, true); return; }
    if (targets.some((x) => x.kind === tab && x.name_ar.trim() === name)) { say('الاسم ده موجود في القايمة فوق، علّم عليه.', true); return; }
    busy = true;
    const { data, error } = await db.from('push_target_requests').insert({ user_id: user.id, kind: tab, name }).select('id,kind,name').maybeSingle();
    busy = false;
    if (error) { say(/duplicate|unique/i.test(error.message) ? 'انت طلبت الاسم ده قبل كده.' : 'تعذّر إرسال الطلب: ' + error.message, true); return; }
    pending.push(data || { id: String(Date.now()), kind: tab, name }); adding = false; render(); say('اتبعت للمراجعة ✓ — هيظهر لك لما نوافق عليه.', false);
  }

  load();
})();
