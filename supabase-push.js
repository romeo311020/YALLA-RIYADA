/* صفحة الإشعارات: خطوات (الفرق ← اللاعبين) ثم ملخص. المستخدم يختار، يعدّل، ويطلب إضافة فريق/لاعب (الأدمن يوافق من لوحة التحكم). */
(() => {
  'use strict';
  const db = window.yrSupabase; const host = document.getElementById('my-notifs');
  if (!db || !host) return;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const KIND = { team: { one: 'فريق', many: 'الفرق', pick: 'اختار فرقك', sub: 'علّم على الفرق اللي عايز تتابعها. تقدر تغيّر اختيارك في أي وقت.', ph: 'اسم الفريق (مثلًا: ليفربول)' }, player: { one: 'لاعب', many: 'اللاعبين', pick: 'اختار لاعبينك', sub: 'علّم على اللاعبين اللي عايز تتابعهم.', ph: 'اسم اللاعب (مثلًا: مبابي)' } };
  const MAX_PENDING = 5;
  let user = null; let sub = null; let targets = []; let follows = new Set(); let pending = []; let reqOk = true;
  let step = 'team'; let adding = false; let busy = false; let note = ''; let devNote = '';

  const b64 = (s) => { const p = '='.repeat((4 - (s.length % 4)) % 4); const r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))); };
  async function currentSub() { if (!supported) return null; try { const reg = await navigator.serviceWorker.ready; return await reg.pushManager.getSubscription(); } catch { return null; } }

  async function load(first) {
    const { data: u } = await db.auth.getUser(); user = u?.user || null;
    if (!user) { host.innerHTML = '<div class="np-card np-login"><div class="np-orb">' + I.bell + '</div><h2>سجّل دخولك الأول</h2><p class="np-sub">الإشعارات مرتبطة بحسابك علشان نعرف تتابع إيه.</p><a class="nw-btn pri" href="account.html" id="pn-login">تسجيل الدخول</a></div>'; try { localStorage.setItem('yr-next', 'notifications.html'); } catch { /* اختياري */ } return; }
    sub = await currentSub();
    const [t, f, r] = await Promise.all([
      db.from('push_targets').select('id,kind,name_ar').eq('active', true).order('sort_order'),
      db.from('push_follows').select('target_id').eq('user_id', user.id),
      db.from('push_target_requests').select('id,kind,name').eq('user_id', user.id).eq('status', 'pending').order('created_at'),
    ]);
    if (t.error) { host.innerHTML = ''; return; } // الجداول لسه ما اتعملتش
    targets = t.data || []; follows = new Set((f.data || []).map((x) => x.target_id));
    reqOk = !r.error; pending = r.error ? [] : (r.data || []);
    if (first) { step = 'team'; }
    render();
  }

  /* ----- حالة الجهاز (العمود الجانبي) ----- */
  const I = {
    bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9a6 6 0 0112 0c0 5 2 6.5 2 6.5H4S6 14 6 9z"/><path d="M10 19a2 2 0 004 0"/></svg>',
    off: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9a6 6 0 019.5-4.8M18 9c0 3.2.9 4.8 1.6 5.7M4 15.5S6 14 6 9"/><path d="M10 19a2 2 0 004 0"/><path d="M3 3l18 18"/></svg>',
    ok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>',
  };
  function device() {
    let st = 'off'; let title; let desc; let acts = '';
    if (!supported) {
      st = 'warn'; title = isIOS && !standalone ? 'ثبّت التطبيق الأول' : 'المتصفح مش بيدعم الإشعارات';
      desc = isIOS && !standalone ? 'على الآيفون: مشاركة ← «إضافة إلى الشاشة الرئيسية»، وافتح التطبيق من هناك وفعّل الإشعارات.' : 'جرّب Chrome أو ثبّت التطبيق.';
    } else if (Notification.permission === 'denied') {
      st = 'warn'; title = 'الإشعارات محظورة في المتصفح';
      desc = 'اضغط على الأيقونة جنب عنوان الموقع ← «الإشعارات» ← سماح، وبعدين حدّث الصفحة.';
    } else if (sub) {
      st = 'on'; title = 'الإشعارات شغّالة على جهازك'; desc = devNote || 'هتوصلك إشعارات الفرق واللاعبين اللي بتتابعهم.';
      acts = '<button class="nw-btn" id="pn-test" type="button">جرّب إشعار</button><button class="nw-btn ghost" id="pn-off" type="button">إيقاف</button>';
    } else {
      title = 'الإشعارات مش مفعّلة على جهازك'; desc = devNote || 'فعّلها علشان توصلك إشعارات اللي بتتابعه.';
      acts = '<button class="nw-btn pri" id="pn-on" type="button">فعّل الإشعارات</button>';
    }
    return `<section class="np-dev ${st}"><div class="np-orb">${st === 'on' ? I.bell : I.off}</div><div class="np-dt"><b>${title}</b><p id="pn-devnote">${esc(desc)}</p></div>${acts ? `<div class="np-acts">${acts}</div>` : ''}</section>`;
  }
  const countOf = (kind) => targets.filter((x) => x.kind === kind && follows.has(x.id)).length;
  function stats() {
    const t = countOf('team'); const p = countOf('player');
    return `<section class="np-stats"><div><b>${t}</b><small>فريق</small></div><div><b>${p}</b><small>لاعب</small></div></section>`;
  }

  /* ----- الاختيار: تبويبان (الفرق / اللاعبين) + بحث + حفظ فوري ----- */
  const initial = (n) => esc(String(n).trim().charAt(0));
  function panel() {
    const k = KIND[step]; const list = targets.filter((x) => x.kind === step); const mine = pending.filter((x) => x.kind === step);
    const tab = (kind, label) => `<button type="button" role="tab" class="np-tab${step === kind ? ' on' : ''}" data-tab="${kind}" aria-selected="${step === kind}">${label}<span>${countOf(kind)}</span></button>`;
    const chips = list.map((x) => `<label class="np-chip" data-n="${esc(x.name_ar.toLowerCase())}"><input type="checkbox" data-t="${esc(x.id)}"${follows.has(x.id) ? ' checked' : ''}><i class="av" aria-hidden="true">${initial(x.name_ar)}</i><span class="nm">${esc(x.name_ar)}</span><i class="ck" aria-hidden="true">${I.ok}</i></label>`).join('')
      + mine.map((x) => `<div class="np-chip pending"><i class="av" aria-hidden="true">${initial(x.name)}</i><span class="nm">${esc(x.name)}<small>قيد المراجعة</small></span></div>`).join('');
    const form = adding ? `<form class="np-form" id="nw-form"><input id="nw-name" maxlength="60" minlength="2" required placeholder="${k.ph}" aria-label="اسم ${k.one}" autocomplete="off"><button class="nw-btn pri" type="submit">إرسال</button><button class="nw-btn ghost" type="button" id="nw-cancel">إلغاء</button><p class="hint">هنراجع الطلب، ولما نوافق عليه هيظهر لك ويتفعّل تلقائيًا.</p></form>` : '';
    return `<section class="np-card"><div class="np-tabs" role="tablist">${tab('team', 'الفرق')}${tab('player', 'اللاعبين')}</div>
      <p class="np-sub">${k.sub}</p>
      <label class="np-search">${I.search}<input id="np-q" type="search" placeholder="ابحث في ${k.many}" autocomplete="off" aria-label="بحث"></label>
      <div class="np-grid2" id="np-chips">${chips || '<p class="np-empty">لا يوجد حاليًا.</p>'}</div>
      <p class="np-none" id="np-none" hidden>مفيش نتيجة مطابقة.</p>
      ${reqOk ? `<button type="button" class="np-add" id="nw-add">${I.plus}<span>مش لاقي ${k.one}؟ اطلب إضافته</span></button>` : ''}${form}
      <p class="nw-msg" id="nw-msg" role="status">${esc(note)}</p></section>`;
  }
  function render() {
    host.innerHTML = panel();
    const side = document.getElementById('np-side'); if (side) side.innerHTML = device() + stats();
    host.querySelectorAll('[data-t]').forEach((c) => c.addEventListener('change', () => toggle(c)));
    const on = (id, fn) => { const e = document.querySelector(id); if (e) e.addEventListener('click', fn); };
    on('#pn-on', enable); on('#pn-off', disable); on('#pn-test', testLocal);
    on('#nw-add', () => { adding = true; note = ''; render(); const i = host.querySelector('#nw-name'); if (i) i.focus(); });
    on('#nw-cancel', () => { adding = false; render(); });
    host.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { if (step === b.dataset.tab) return; step = b.dataset.tab; adding = false; note = ''; render(); }));
    const q = host.querySelector('#np-q');
    if (q) q.addEventListener('input', () => {
      const v = q.value.trim().toLowerCase(); let n = 0;
      host.querySelectorAll('#np-chips .np-chip[data-n]').forEach((c) => { const hit = !v || c.dataset.n.includes(v); c.hidden = !hit; if (hit) n++; });
      const none = host.querySelector('#np-none'); if (none) none.hidden = n > 0;
    });
    const form = host.querySelector('#nw-form'); if (form) form.addEventListener('submit', request);
  }
  const say = (t) => { note = t; const m = document.getElementById('nw-msg'); if (m) m.textContent = t; };

  async function toggle(c) {
    const id = c.dataset.t; c.disabled = true;
    const q = c.checked ? db.from('push_follows').insert({ user_id: user.id, target_id: id }) : db.from('push_follows').delete().eq('user_id', user.id).eq('target_id', id);
    const { error } = await q; c.disabled = false;
    if (error) { c.checked = !c.checked; say('تعذّر الحفظ. حاول تاني.'); return; }
    if (c.checked) follows.add(id); else follows.delete(id);
    host.querySelectorAll('.np-tab').forEach((t) => { const sp = t.querySelector('span'); if (sp) sp.textContent = countOf(t.dataset.tab); });
    const side = document.getElementById('np-side'); const stt = side && side.querySelector('.np-stats'); if (stt) stt.outerHTML = stats();
    say(sub ? 'تم الحفظ ✓' : 'تم الحفظ ✓ — فعّل الإشعارات على الجهاز علشان توصلك.');
  }

  async function request(e) {
    e.preventDefault(); if (busy) return;
    const input = host.querySelector('#nw-name'); const name = (input.value || '').replace(/\s+/g, ' ').trim();
    if (name.length < 2) { say('اكتب الاسم.'); return; }
    const mine = pending.filter((x) => x.kind === step);
    if (mine.length >= MAX_PENDING) { say(`عندك ${MAX_PENDING} طلبات لسه تحت المراجعة. استنى لما نراجعهم.`); return; }
    if (targets.some((x) => x.kind === step && x.name_ar.trim() === name)) { say('الاسم ده موجود في القايمة فوق، علّم عليه.'); return; }
    busy = true;
    const { data, error } = await db.from('push_target_requests').insert({ user_id: user.id, kind: step, name }).select('id,kind,name').maybeSingle();
    busy = false;
    if (error) { say(/duplicate|unique/i.test(error.message) ? 'انت طلبت الاسم ده قبل كده.' : 'تعذّر إرسال الطلب: ' + error.message); return; }
    pending.push(data || { id: String(Date.now()), kind: step, name }); adding = false; note = 'اتبعت للمراجعة ✓ — هيظهر لك لما نوافق عليه.'; render();
  }

  /* ----- تفعيل الجهاز (زي ما هو) ----- */
  const dev = (t) => { devNote = t; const m = document.getElementById('pn-devnote'); if (m) m.textContent = t; };
  async function enable() {
    if (busy) return; busy = true; const btn = document.getElementById('pn-on'); if (btn) btn.disabled = true;
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { devNote = 'لازم توافق على الإشعارات علشان نقدر نبعتلك.'; render(); return; }
      const { data: s } = await db.from('site_settings').select('value').eq('key', 'vapid_public').maybeSingle();
      const key = typeof s?.value === 'string' ? s.value : '';
      if (!key) { dev('الإشعارات لسه ما اتجهزتش من السيرفر (المفتاح العام ناقص).'); return; }
      const reg = await navigator.serviceWorker.ready;
      const s2 = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(key) });
      const j = s2.toJSON();
      const { error } = await db.from('push_subscriptions').upsert({ user_id: user.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, user_agent: navigator.userAgent.slice(0, 200) }, { onConflict: 'endpoint' });
      if (error) { dev('تعذّر حفظ الاشتراك: ' + error.message); return; }
      sub = s2; devNote = 'تم تفعيل الإشعارات على الجهاز ✓'; render(); document.dispatchEvent(new CustomEvent('yr-push-change'));
    } catch (e) { dev('تعذّر التفعيل: ' + (e && e.message ? e.message : e)); } finally { busy = false; const b2 = document.getElementById('pn-on'); if (b2) b2.disabled = false; }
  }
  async function disable() {
    try { const s = sub || await currentSub(); if (s) { const ep = s.endpoint; await s.unsubscribe(); await db.from('push_subscriptions').delete().eq('endpoint', ep); } sub = null; devNote = 'تم إيقاف الإشعارات على الجهاز ده.'; render(); document.dispatchEvent(new CustomEvent('yr-push-change')); } catch (e) { dev('تعذّر الإيقاف.'); }
  }
  async function testLocal() {
    try { const reg = await navigator.serviceWorker.ready; await reg.showNotification('يلا رياضة ⚽', { body: 'الإشعارات شغّالة على جهازك ✓', icon: 'icon-192.png', badge: 'icon-192.png', lang: 'ar', dir: 'rtl', tag: 'yr-test', data: { url: 'notifications.html' } }); dev('اتبعت إشعار تجريبي — لو ما ظهرش شوف إعدادات الإشعارات في الموبايل.'); } catch (e) { dev('تعذّر عرض الإشعار: ' + e.message); }
  }

  let first = true;
  db.auth.onAuthStateChange(() => { load(first); first = false; });
  load(true); first = false;
})();
