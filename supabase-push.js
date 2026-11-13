/* صفحة الإشعارات: حالة الجهاز (تفعيل/تجربة/إيقاف) + ملخص المفضلة + أنواع الإشعارات. اختيار الفرق واللاعبين في notification-preferences.html */
(() => {
  'use strict';
  const db = window.yrSupabase; const host = document.getElementById('my-notifs');
  if (!db || !host) return;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const nAr = (n) => Number(n).toLocaleString('ar-EG');
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const sv = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const I = {
    bell: sv('<path d="M6 9a6 6 0 0112 0c0 5 2 6.5 2 6.5H4S6 14 6 9z"/><path d="M10 19a2 2 0 004 0"/>'),
    off: sv('<path d="M6 9a6 6 0 019.5-4.8M18 9c0 3.2.9 4.8 1.6 5.7M4 15.5S6 14 6 9"/><path d="M10 19a2 2 0 004 0"/><path d="M3 3l18 18"/>'),
    ok: sv('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    users: sv('<circle cx="9" cy="8" r="3.2"/><path d="M3 19c.6-3.3 3-5 6-5s5.4 1.7 6 5"/><circle cx="17" cy="9" r="2.4"/><path d="M17 14c2.4.2 3.7 1.7 4 4"/>'),
    go: sv('<path d="M15 5l-7 7 7 7"/>'),
    gear: sv('<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"/>'),
    save: sv('<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>'),
    play: sv('<path d="M8 5l11 7-11 7z"/>'),
    timer: sv('<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 1.5M9.5 3h5"/>'),
    ball: sv('<circle cx="12" cy="12" r="9"/><path d="M12 7.5l3.6 2.6-1.4 4.2H9.8L8.4 10.1zM12 7.5V3.2M15.6 10.1l4-1.2M14.2 14.3l2.5 3.3M9.8 14.3l-2.5 3.3M8.4 10.1l-4-1.2"/>'),
    news: sv('<path d="M5 4h14v16H5z"/><path d="M8.5 9h7M8.5 12.5h7M8.5 16h4"/>'),
    user: sv('<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c.8-4 3.7-6 7.5-6s6.7 2 7.5 6"/>'),
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="fillg" d="M12 2.8l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.6l-5.8 3.1 1.1-6.5L2.6 9.6l6.5-.9z"/></svg>',
    shirt: sv('<path d="M8 4l-5 3 2 4 2-1v10h10V10l2 1 2-4-5-3a4 4 0 01-8 0z"/>'),
    sliders: sv('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
    swap: sv('<path d="M4 8h14l-3-3M20 16H6l3 3"/>'),
  };
  /* أنواع الإشعارات — المفتاح بيتخزّن في push_prefs.kinds ويتفلتر به الإرسال من الإدارة */
  const KINDS = [
    ['match_start', 'بداية المباريات', 'تنبيه عند اقتراب أو انطلاق المباراة.', I.timer],
    ['goals', 'الأهداف والنتائج', 'تنبيه عند تسجيل هدف أو انتهاء المباراة.', I.ball],
    ['team_news', 'أخبار الفرق', 'أحدث أخبار الفرق التي تتابعها.', I.news],
    ['player_news', 'أخبار اللاعبين', 'آخر أخبار اللاعبين المفضلين لديك.', I.user],
    ['transfers', 'الانتقالات', 'أخبار الانتقالات والتعاقدات المتعلقة بمفضلاتك.', I.swap],
  ];
  const b64 = (s) => { const p = '='.repeat((4 - (s.length % 4)) % 4); const r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))); };
  async function currentSub() { if (!supported) return null; try { const reg = await navigator.serviceWorker.ready; return await reg.pushManager.getSubscription(); } catch { return null; } }

  let user = null; let sub = null; let busy = false; let devNote = ''; let devKind = '';
  let counts = { team: 0, player: 0, ok: true }; let kinds = {}; let prefsOk = true; let dirty = false; let saving = false; let saveMsg = ''; let saveErr = false;

  async function load() {
    const { data: u } = await db.auth.getUser(); user = u?.user || null;
    if (!user) {
      host.innerHTML = `<section class="np-card np-login"><div class="np-orb">${I.bell}</div><h2>سجّل دخولك الأول</h2><p class="np-sub">الإشعارات مرتبطة بحسابك علشان نعرف تتابع إيه.</p><a class="nw-btn pri" href="account.html" id="pn-login">تسجيل الدخول</a></section>`;
      try { localStorage.setItem('yr-next', 'notifications.html'); } catch { /* اختياري */ }
      return;
    }
    sub = await currentSub();
    const [f, p] = await Promise.all([
      db.from('push_follows').select('target_id, push_targets(kind)').eq('user_id', user.id),
      db.from('push_prefs').select('kinds').eq('user_id', user.id).maybeSingle(),
    ]);
    counts = { team: 0, player: 0, ok: !f.error };
    (f.data || []).forEach((r) => { const k = r.push_targets && r.push_targets.kind; if (k === 'team' || k === 'player') counts[k]++; });
    prefsOk = !p.error; kinds = (p.data && p.data.kinds) || {};
    if (!dirty) render();
  }

  const on = (k) => kinds[k] !== false;
  function status() {
    let st = 'off'; let title; let desc; let acts = '';
    if (!supported) {
      st = 'warn'; title = isIOS && !standalone ? 'ثبّت التطبيق الأول' : 'المتصفح مش بيدعم الإشعارات';
      desc = isIOS && !standalone ? 'على الآيفون: مشاركة ← «إضافة إلى الشاشة الرئيسية»، وافتح التطبيق من هناك وفعّل الإشعارات.' : 'جرّب Chrome أو ثبّت التطبيق.';
    } else if (Notification.permission === 'denied') {
      st = 'warn'; title = 'الإشعارات محظورة في المتصفح';
      desc = 'اضغط على الأيقونة جنب عنوان الموقع ← «الإشعارات» ← سماح، وبعدين حدّث الصفحة.';
    } else if (sub) {
      st = 'on'; title = 'الإشعارات مفعّلة'; desc = devNote || 'تقدر تستقبل التنبيهات على جهازك.';
      acts = `<button class="nw-btn" id="pn-test" type="button">${I.bell}<span>تجربة إشعار</span></button><button class="nw-btn ghost" id="pn-off" type="button">إيقاف</button>`;
    } else {
      title = 'الإشعارات غير مفعّلة'; desc = devNote || 'فعّلها علشان توصلك تنبيهات اللي بتتابعه.';
      acts = '<button class="nw-btn pri" id="pn-on" type="button">تفعيل الإشعارات</button>';
    }
    return `<section class="np-status ${st}">${acts ? `<div class="np-acts">${acts}</div>` : ''}<div class="np-st-t"><b>${title}</b><p id="pn-devnote" class="${devKind}">${esc(desc)}</p></div><div class="np-ico">${st === 'on' ? I.ok : st === 'warn' ? I.off : I.bell}</div></section>`;
  }
  function favs() {
    const sumHtml = !counts.ok ? '<p class="np-sub err">تعذّر تحميل اختياراتك. حاول تحدّث الصفحة.</p>'
      : `<div class="np-sum"><div>${I.users}<b>${nAr(counts.player)}</b><small>${counts.player === 1 ? 'لاعب مختار' : 'لاعبين مختارين'}</small></div><div>${I.shirt}<b>${nAr(counts.team)}</b><small>${counts.team === 1 ? 'فريق مختار' : 'فرق مختارة'}</small></div></div>`;
    return `<section class="np-card np-fav"><div class="np-ch"><span class="np-star">${I.star}</span><div><h2>مفضلاتك</h2><p class="np-sub">الفرق واللاعبون الذين تتابعهم للحصول على إشعارات خاصة بهم.</p></div></div>${sumHtml}<a class="np-cta" href="notification-preferences.html"><span>${I.sliders}<b>إدارة المفضلات</b></span></a></section>`;
  }
  function types() {
    const rows = KINDS.map(([k, t, d, ic]) => `<label class="np-row"><span class="np-ri">${ic}</span><span class="np-rt"><b>${t}</b><small>${d}</small></span><input type="checkbox" class="np-sw" data-k="${k}"${on(k) ? ' checked' : ''} aria-label="${t}"><i class="np-knob" aria-hidden="true"></i></label>`).join('');
    const warn = prefsOk ? '' : '<p class="np-note err">حفظ التفضيلات لسه مش متفعّل على السيرفر (ملف SQL ناقص).</p>';
    return `<section class="np-card np-types"><div class="np-ch"><span class="np-chico">${I.gear}</span><div><h2>تخصيص أنواع الإشعارات</h2><p class="np-sub">اختر نوع الإشعارات التي ترغب في استقبالها.</p></div></div>${rows}${warn}<p class="np-note">اختياراتك بتتطبّق على الإشعارات اللي بتتبعت من الإدارة حسب نوعها. إشعارات المباريات التلقائية (الأهداف وبداية المباراة) لسه ما اتفعّلتش على السيرفر.</p></section>
      <button class="np-save" id="np-save" type="button"${prefsOk && !saving ? '' : ' disabled'}>${saving ? '<i class="np-spin"></i><span>جارٍ الحفظ…</span>' : I.save + '<span>حفظ التفضيلات</span>'}</button><p class="np-msg${saveErr ? ' err' : ''}" id="np-msg" role="status">${esc(saveMsg)}</p>`;
  }
  function render() {
    host.innerHTML = status() + favs() + types();
    const q = (id, fn) => { const e = host.querySelector(id); if (e) e.addEventListener('click', fn); };
    q('#pn-on', enable); q('#pn-off', disable); q('#pn-test', testLocal); q('#np-save', savePrefs);
    host.querySelectorAll('.np-sw').forEach((c) => c.addEventListener('change', () => { kinds[c.dataset.k] = c.checked; dirty = true; saveMsg = ''; const m = host.querySelector('#np-msg'); if (m) m.textContent = ''; }));
  }

  async function savePrefs() {
    if (saving || !user) return; saving = true; saveMsg = ''; saveErr = false; render();
    const clean = {}; KINDS.forEach(([k]) => { clean[k] = on(k); });
    const { error } = await db.from('push_prefs').upsert({ user_id: user.id, kinds: clean, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    saving = false;
    if (error) { saveErr = true; saveMsg = 'تعذّر الحفظ: ' + error.message; } else { dirty = false; kinds = clean; saveMsg = 'تم حفظ التفضيلات ✓'; }
    render();
  }

  /* ----- تفعيل الجهاز (بضغطة المستخدم فقط، مفيش طلب إذن تلقائي) ----- */
  const dev = (t, kind) => { devNote = t; devKind = kind || ''; const m = document.getElementById('pn-devnote'); if (m) { m.textContent = t; m.className = devKind; } };
  async function enable() {
    if (busy) return; busy = true; const btn = document.getElementById('pn-on'); if (btn) btn.disabled = true;
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { devNote = 'لازم توافق على الإشعارات علشان نقدر نبعتلك.'; render(); return; }
      const { data: s } = await db.from('site_settings').select('value').eq('key', 'vapid_public').maybeSingle();
      const key = typeof s?.value === 'string' ? s.value : '';
      if (!key) { dev('الإشعارات لسه ما اتجهزتش من السيرفر (المفتاح العام ناقص).', 'err'); return; }
      const reg = await navigator.serviceWorker.ready;
      const s2 = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(key) });
      const j = s2.toJSON();
      const { error } = await db.from('push_subscriptions').upsert({ user_id: user.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, user_agent: navigator.userAgent.slice(0, 200) }, { onConflict: 'endpoint' });
      if (error) { dev('تعذّر حفظ الاشتراك: ' + error.message, 'err'); return; }
      sub = s2; devNote = 'تم تفعيل الإشعارات على الجهاز ✓'; render(); document.dispatchEvent(new CustomEvent('yr-push-change'));
    } catch (e) { dev('تعذّر التفعيل: ' + (e && e.message ? e.message : e), 'err'); } finally { busy = false; const b2 = document.getElementById('pn-on'); if (b2) b2.disabled = false; }
  }
  async function disable() {
    try {
      const s = sub || await currentSub();
      if (s) { const ep = s.endpoint; await s.unsubscribe(); await db.from('push_subscriptions').delete().eq('endpoint', ep); }
      sub = null; devNote = 'تم إيقاف الإشعارات على الجهاز ده.'; render(); document.dispatchEvent(new CustomEvent('yr-push-change'));
    } catch (e) { dev('تعذّر الإيقاف: ' + (e && e.message ? e.message : e), 'err'); }
  }
  async function testLocal() {
    try {
      if (Notification.permission !== 'granted') { dev('الإذن مش متاح. فعّل الإشعارات الأول.', 'err'); return; }
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification('يلا رياضة ⚽', { body: 'الإشعارات شغّالة على جهازك ✓', icon: 'icon-192.png', badge: 'icon-192.png', lang: 'ar', dir: 'rtl', tag: 'yr-test', data: { url: 'notifications.html' } });
      dev('اتبعت إشعار تجريبي لجهازك — لو ما ظهرش، راجع إعدادات إشعارات المتصفح/الجهاز.', '');
    } catch (e) { dev('تعذّر إرسال التجربة: ' + (e && e.message ? e.message : e), 'err'); }
  }

  db.auth.onAuthStateChange(() => { load(); });
  window.addEventListener('pageshow', (e) => { if (e.persisted) load(); });
  load();
})();
