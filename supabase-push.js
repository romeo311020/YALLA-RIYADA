/* الإشعارات في «حسابي»: تفعيل الإشعارات على الجهاز + اختيار الفرق واللاعبين اللي بيتابعهم المستخدم */
(() => {
  'use strict';
  const db = window.yrSupabase; const host = document.getElementById('my-notifs');
  if (!db || !host) return;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  let user = null; let sub = null; let targets = []; let follows = new Set(); let busy = false; let note = '';

  const b64 = (s) => { const p = '='.repeat((4 - (s.length % 4)) % 4); const r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...r].map((c) => c.charCodeAt(0))); };

  async function currentSub() { if (!supported) return null; try { const reg = await navigator.serviceWorker.ready; return await reg.pushManager.getSubscription(); } catch { return null; } }

  async function load() {
    const { data: u } = await db.auth.getUser(); user = u?.user || null;
    if (!user) { host.innerHTML = ''; return; }
    sub = await currentSub();
    const [t, f] = await Promise.all([
      db.from('push_targets').select('id,kind,name_ar').eq('active', true).order('sort_order'),
      db.from('push_follows').select('target_id').eq('user_id', user.id),
    ]);
    if (t.error) { host.innerHTML = ''; return; } // الجداول لسه ما اتعملتش
    targets = t.data || []; follows = new Set((f.data || []).map((x) => x.target_id)); render();
  }

  function stateBlock() {
    if (!supported) return isIOS && !standalone
      ? '<p class="note">على الآيفون: افتح الموقع في Safari، اضغط زر المشاركة، ثم «إضافة إلى الشاشة الرئيسية»، وافتح التطبيق من هناك وفعّل الإشعارات.</p>'
      : '<p class="note">المتصفح ده مش بيدعم الإشعارات.</p>';
    if (Notification.permission === 'denied') return '<p class="note account-message-error">الإشعارات محظورة لهذا الموقع. فعّلها من إعدادات المتصفح (قفل العنوان ← الإشعارات ← سماح) وبعدين حدّث الصفحة.</p>';
    return sub
      ? '<p class="note ok-note">✓ الإشعارات شغّالة على الجهاز ده.</p><div class="profile-actions"><button class="btn outline" id="pn-test" type="button">جرّب إشعار على جهازي</button><button class="btn outline" id="pn-off" type="button">إيقاف على هذا الجهاز</button></div>'
      : '<button class="btn primary" id="pn-on" type="button">🔔 فعّل الإشعارات على هذا الجهاز</button>';
  }
  const group = (kind, title) => { const l = targets.filter((x) => x.kind === kind); return l.length ? `<h4>${title}</h4><div class="pn-grid">${l.map((x) => `<label class="pn-item"><input type="checkbox" data-t="${esc(x.id)}"${follows.has(x.id) ? ' checked' : ''}><span>${esc(x.name_ar)}</span></label>`).join('')}</div>` : ''; };
  function render() {
    host.innerHTML = `<div class="follow-box pn-box"><div class="follow-head"><span class="kicker">NOTIFICATIONS</span><h3>الإشعارات 🔔</h3></div>${stateBlock()}${isIOS && supported && !standalone ? '<p class="note">على الآيفون الإشعارات بتشتغل بس من التطبيق المثبّت على الشاشة الرئيسية.</p>' : ''}<p class="note">اختار اللي عايز تتابعه، وهنبعتلك إشعار لما يسجّل هدف أو تبدأ مبارياته.</p>${group('team', 'الفرق')}${group('player', 'اللاعبين')}<p class="note pn-msg" id="pn-msg" role="status">${esc(note)}</p></div>`;
    host.querySelectorAll('[data-t]').forEach((c) => c.addEventListener('change', () => toggle(c)));
    const on = host.querySelector('#pn-on'); if (on) on.addEventListener('click', enable);
    const off = host.querySelector('#pn-off'); if (off) off.addEventListener('click', disable);
    const test = host.querySelector('#pn-test'); if (test) test.addEventListener('click', testLocal);
  }
  const say = (t) => { note = t; const m = document.getElementById('pn-msg'); if (m) m.textContent = t; };

  async function toggle(c) {
    const id = c.dataset.t; c.disabled = true;
    const q = c.checked ? db.from('push_follows').insert({ user_id: user.id, target_id: id }) : db.from('push_follows').delete().eq('user_id', user.id).eq('target_id', id);
    const { error } = await q; c.disabled = false;
    if (error) { c.checked = !c.checked; say('تعذّر الحفظ. حاول تاني.'); return; }
    if (c.checked) follows.add(id); else follows.delete(id);
    say(sub ? 'تم الحفظ ✓' : 'تم الحفظ ✓ — فعّل الإشعارات على الجهاز علشان توصلك.');
  }

  async function enable() {
    if (busy) return; busy = true; const btn = document.getElementById('pn-on'); if (btn) btn.disabled = true;
    try {
      const { data: s } = await db.from('site_settings').select('value').eq('key', 'vapid_public').maybeSingle();
      const key = typeof s?.value === 'string' ? s.value : '';
      if (!key) { say('الإشعارات لسه ما اتجهزتش من السيرفر (المفتاح العام ناقص).'); return; }
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { say('لازم توافق على الإشعارات علشان نقدر نبعتلك.'); render(); return; }
      const reg = await navigator.serviceWorker.ready;
      const s2 = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(key) });
      const j = s2.toJSON();
      const { error } = await db.from('push_subscriptions').upsert({ user_id: user.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, user_agent: navigator.userAgent.slice(0, 200) }, { onConflict: 'endpoint' });
      if (error) { say('تعذّر حفظ الاشتراك: ' + error.message); return; }
      sub = s2; say('تم تفعيل الإشعارات على الجهاز ✓'); render();
    } catch (e) { say('تعذّر التفعيل: ' + (e && e.message ? e.message : e)); } finally { busy = false; const b2 = document.getElementById('pn-on'); if (b2) b2.disabled = false; }
  }
  async function disable() {
    try { const s = sub || await currentSub(); if (s) { const ep = s.endpoint; await s.unsubscribe(); await db.from('push_subscriptions').delete().eq('endpoint', ep); } sub = null; say('تم إيقاف الإشعارات على الجهاز ده.'); render(); } catch (e) { say('تعذّر الإيقاف.'); }
  }
  async function testLocal() {
    try { const reg = await navigator.serviceWorker.ready; await reg.showNotification('يلا رياضة ⚽', { body: 'الإشعارات شغّالة على جهازك ✓', icon: 'icon-192.png', badge: 'icon-192.png', lang: 'ar', dir: 'rtl', tag: 'yr-test', data: { url: 'account.html' } }); say('اتبعت إشعار تجريبي — لو ما ظهرش شوف إعدادات الإشعارات في الموبايل.'); } catch (e) { say('تعذّر عرض الإشعار: ' + e.message); }
  }

  db.auth.onAuthStateChange(() => { load(); });
  load();
})();
