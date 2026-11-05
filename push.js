// يلا رياضة — اشتراك المستخدم في إشعارات الأخبار (للأعضاء المسجّلين).
(() => {
  'use strict';
  const db = window.yrSupabase; const KEY = window.YR_VAPID_PUBLIC_KEY || '';
  const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  const b64 = (s) => { const p = '='.repeat((4 - (s.length % 4)) % 4); const r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, (c) => c.charCodeAt(0)); };
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const getReg = async () => (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register('sw.js'));
  const current = async () => { try { return await (await navigator.serviceWorker.ready).pushManager.getSubscription(); } catch { return null; } };

  async function enable() {
    const { data: s } = await db.auth.getSession();
    if (!s?.session) { try { sessionStorage.setItem('yr-next', location.pathname.split('/').pop() || 'news.html'); } catch { /* */ } location.href = 'account.html'; return { ok: false, reason: 'login' }; }
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return { ok: false, reason: perm === 'denied' ? 'denied' : 'dismissed' };
    await getReg(); const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(KEY) });
    const j = sub.toJSON();
    const { error } = await db.rpc('push_subscribe', { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth });
    if (error) { console.error('push_subscribe:', error); try { await sub.unsubscribe(); } catch { /* */ } return { ok: false, reason: 'server' }; }
    return { ok: true };
  }
  async function disable() {
    const sub = await current(); if (!sub) return;
    try { await db.rpc('push_unsubscribe', { p_endpoint: sub.endpoint }); } catch { /* */ }
    try { await sub.unsubscribe(); } catch { /* */ }
  }

  // يرسم بطاقة/زر الإشعارات داخل عنصر
  async function mount(el, opts = {}) {
    if (!el || !db || !KEY) return;
    const compact = Boolean(opts.compact);
    const paint = async (msg = '') => {
      let state = 'off'; let hint = msg;
      if (!supported()) { state = 'unsupported'; hint = ios && !standalone ? 'على الآيفون: افتح الموقع في Safari ← مشاركة ← «إضافة إلى الشاشة الرئيسية» ثم فعّل الإشعارات من التطبيق.' : 'متصفحك لا يدعم الإشعارات.'; }
      else if (Notification.permission === 'denied') { state = 'denied'; hint = 'الإشعارات محظورة من إعدادات المتصفح لهذا الموقع. اسمح بها ثم أعد المحاولة.'; }
      else if (await current()) state = 'on';
      el.className = `push-box push-${state}${compact ? ' compact' : ''}`;
      el.innerHTML = `<span class="push-ico" aria-hidden="true">${state === 'on' ? '🔔' : '🔕'}</span>
        <div class="push-txt"><b>${state === 'on' ? 'إشعارات الأخبار مفعّلة' : 'فعّل إشعارات الأخبار'}</b><small>${hint || (state === 'on' ? 'هتوصلك أهم الأخبار لحظة نشرها.' : 'اعرف أهم الأخبار والمباريات فور نشرها (للأعضاء).')}</small></div>
        ${state === 'unsupported' || state === 'denied' ? '' : `<button type="button" class="btn ${state === 'on' ? 'outline' : 'primary'} push-btn">${state === 'on' ? 'إيقاف' : 'تفعيل'}</button>`}`;
      const btn = el.querySelector('.push-btn'); if (!btn) return;
      btn.addEventListener('click', async () => {
        btn.disabled = true; btn.textContent = '…';
        try {
          if (state === 'on') { await disable(); await paint(); return; }
          const r = await enable();
          await paint(r.ok ? '' : r.reason === 'denied' ? 'تم رفض الإذن. تقدر تسمح به من إعدادات المتصفح.' : r.reason === 'server' ? 'تعذّر حفظ الاشتراك. شغّل ملف supabase-push.sql.' : '');
        } catch (e) { console.error('push:', e); await paint('تعذّر تفعيل الإشعارات الآن. حاول لاحقًا.'); }
      });
    };
    await paint();
  }
  window.yrPush = { supported, mount, enable, disable };
  const auto = () => { const el = document.getElementById('push-box'); if (el) mount(el); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();
