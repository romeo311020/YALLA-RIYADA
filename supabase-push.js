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
  let view = 'summary'; let step = 'team'; let adding = false; let busy = false; let note = ''; let devNote = '';

  const b64 = (s) => { const p = '='.repeat((4 - (s.length % 4)) % 4); const r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))); };
  async function currentSub() { if (!supported) return null; try { const reg = await navigator.serviceWorker.ready; return await reg.pushManager.getSubscription(); } catch { return null; } }

  async function load(first) {
    const { data: u } = await db.auth.getUser(); user = u?.user || null;
    if (!user) { host.innerHTML = '<div class="nw-card"><h2>سجّل دخولك الأول</h2><p class="sub">الإشعارات مرتبطة بحسابك علشان نعرف تتابع إيه.</p><a class="nw-btn pri" style="display:inline-flex;align-items:center" href="account.html" id="pn-login">تسجيل الدخول</a></div>'; try { localStorage.setItem('yr-next', 'notifications.html'); } catch { /* اختياري */ } return; }
    sub = await currentSub();
    const [t, f, r] = await Promise.all([
      db.from('push_targets').select('id,kind,name_ar').eq('active', true).order('sort_order'),
      db.from('push_follows').select('target_id').eq('user_id', user.id),
      db.from('push_target_requests').select('id,kind,name').eq('user_id', user.id).eq('status', 'pending').order('created_at'),
    ]);
    if (t.error) { host.innerHTML = ''; return; } // الجداول لسه ما اتعملتش
    targets = t.data || []; follows = new Set((f.data || []).map((x) => x.target_id));
    reqOk = !r.error; pending = r.error ? [] : (r.data || []);
    if (first) { view = follows.size ? 'summary' : 'wizard'; step = 'team'; }
    render();
  }

  /* ----- حالة الجهاز ----- */
  function device() {
    if (!supported) return `<div class="nw-device warn"><div class="ico">📲</div><div class="txt"><b>${isIOS && !standalone ? 'ثبّت التطبيق الأول' : 'المتصفح مش بيدعم الإشعارات'}</b><small>${isIOS && !standalone ? 'على الآيفون: مشاركة ← «إضافة إلى الشاشة الرئيسية»، وافتح التطبيق من هناك وفعّل الإشعارات.' : 'جرّب Chrome أو ثبّت التطبيق.'}</small></div></div>`;
    if (Notification.permission === 'denied') return '<div class="nw-device warn"><div class="ico">🔕</div><div class="txt"><b>الإشعارات محظورة</b><small>فعّلها من إعدادات المتصفح (قفل العنوان ← الإشعارات ← سماح) وبعدين حدّث الصفحة.</small></div></div>';
    if (sub) return `<div class="nw-device"><div class="ico">🔔</div><div class="txt"><b>الإشعارات شغّالة على جهازك ✓</b><small id="pn-devnote">${esc(devNote)}</small></div><div class="acts"><button class="nw-btn" id="pn-test" type="button">جرّب</button><button class="nw-btn" id="pn-off" type="button">إيقاف</button></div></div>`;
    return `<div class="nw-device warn"><div class="ico">🔕</div><div class="txt"><b>الإشعارات مش مفعّلة على جهازك</b><small id="pn-devnote">${esc(devNote) || 'فعّلها علشان توصلك إشعارات اللي بتتابعه.'}</small></div><div class="acts"><button class="nw-btn pri" id="pn-on" type="button">فعّل الإشعارات</button></div></div>`;
  }

  /* ----- الخطوات ----- */
  const stepper = () => `<div class="nw-steps" aria-label="الخطوات"><div class="nw-step ${step === 'team' ? 'on' : 'done'}"><i>${step === 'team' ? '1' : '✓'}</i>الفرق</div><div class="nw-line ${step === 'player' ? 'on' : ''}"></div><div class="nw-step ${step === 'player' ? 'on' : ''}"><i>2</i>اللاعبين</div></div>`;
  function wizard() {
    const k = KIND[step]; const list = targets.filter((x) => x.kind === step); const mine = pending.filter((x) => x.kind === step);
    const chips = list.map((x) => `<label class="nw-chip"><input type="checkbox" data-t="${esc(x.id)}"${follows.has(x.id) ? ' checked' : ''}><span class="box" aria-hidden="true">✓</span><span>${esc(x.name_ar)}</span></label>`).join('')
      + mine.map((x) => `<div class="nw-chip pending"><span class="box" aria-hidden="true">🕓</span><span>${esc(x.name)}<small>قيد المراجعة</small></span></div>`).join('')
      + (reqOk ? `<button type="button" class="nw-add" id="nw-add">＋ أضف ${k.one}</button>` : '');
    const form = adding ? `<form class="nw-form" id="nw-form"><input id="nw-name" maxlength="60" minlength="2" required placeholder="${k.ph}" aria-label="اسم ${k.one}" autocomplete="off"><button class="nw-btn pri" type="submit">إرسال</button><button class="nw-btn" type="button" id="nw-cancel">إلغاء</button><p class="hint note">هنراجع الطلب، ولما نوافق عليه هيظهر لك ويتفعّل تلقائيًا.</p></form>` : '';
    const n = list.filter((x) => follows.has(x.id)).length;
    return `${stepper()}<div class="nw-card"><h2>${k.pick}<span class="nw-count">${n} / ${list.length}</span></h2><p class="sub">${k.sub}</p>
      <div class="nw-grid">${chips || '<p class="nw-empty">لا يوجد حاليًا.</p>'}</div>${form}<p class="nw-msg note" id="nw-msg" role="status">${esc(note)}</p>
      <div class="nw-nav">${step === 'player' ? '<button class="nw-btn" id="nw-prev" type="button">→ الفرق</button>' : ''}<button class="nw-btn pri grow" id="nw-next" type="button">${step === 'team' ? 'التالي: اللاعبين ←' : 'تم ✓'}</button></div></div>`;
  }
  function summary() {
    const sec = (kind) => {
      const k = KIND[kind]; const got = targets.filter((x) => x.kind === kind && follows.has(x.id)); const mine = pending.filter((x) => x.kind === kind);
      return `<div class="nw-card nw-sum"><h3>${k.many} اللي بتتابعها<button type="button" class="nw-btn" data-edit="${kind}">تعديل</button></h3>${got.length || mine.length ? `<div class="nw-tags">${got.map((x) => `<span class="nw-tag">${esc(x.name_ar)}</span>`).join('')}${mine.map((x) => `<span class="nw-tag pend">${esc(x.name)} · قيد المراجعة</span>`).join('')}</div>` : '<p class="nw-empty">لسه ما اخترتش.</p>'}</div>`;
    };
    return `${sec('team')}${sec('player')}<p class="nw-msg note" id="nw-msg" role="status">${esc(note)}</p>`;
  }
  function render() {
    host.innerHTML = device() + (view === 'wizard' ? wizard() : summary());
    host.querySelectorAll('[data-t]').forEach((c) => c.addEventListener('change', () => toggle(c)));
    const on = (id, fn) => { const e = host.querySelector(id); if (e) e.addEventListener('click', fn); };
    on('#pn-on', enable); on('#pn-off', disable); on('#pn-test', testLocal);
    on('#nw-add', () => { adding = true; note = ''; render(); const i = host.querySelector('#nw-name'); if (i) i.focus(); });
    on('#nw-cancel', () => { adding = false; render(); });
    on('#nw-next', () => { adding = false; note = ''; if (step === 'team') { step = 'player'; window.scrollTo({ top: 0, behavior: 'smooth' }); render(); } else { view = 'summary'; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); } });
    on('#nw-prev', () => { adding = false; step = 'team'; note = ''; render(); });
    host.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => { step = b.dataset.edit; view = 'wizard'; note = ''; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }));
    const form = host.querySelector('#nw-form'); if (form) form.addEventListener('submit', request);
  }
  const say = (t) => { note = t; const m = document.getElementById('nw-msg'); if (m) m.textContent = t; };

  async function toggle(c) {
    const id = c.dataset.t; c.disabled = true;
    const q = c.checked ? db.from('push_follows').insert({ user_id: user.id, target_id: id }) : db.from('push_follows').delete().eq('user_id', user.id).eq('target_id', id);
    const { error } = await q; c.disabled = false;
    if (error) { c.checked = !c.checked; say('تعذّر الحفظ. حاول تاني.'); return; }
    if (c.checked) follows.add(id); else follows.delete(id);
    const k = KIND[step]; const list = targets.filter((x) => x.kind === step); const cnt = host.querySelector('.nw-count'); if (cnt) cnt.textContent = `${list.filter((x) => follows.has(x.id)).length} / ${list.length}`;
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
