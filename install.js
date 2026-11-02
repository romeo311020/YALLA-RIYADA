// يلا رياضة — تثبيت الموقع كتطبيق: يسجّل الـ Service Worker ويعرض شريطًا في أعلى الصفحة لتثبيت التطبيق.
(() => {
  'use strict';
  const DISMISS_KEY = 'yr-install-dismissed';
  const DISMISS_DAYS = 7;
  const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* لا مشكلة */ } };

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch((e) => console.warn('sw:', e)));
  }

  const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
  if (standalone()) return; // مثبّت بالفعل
  const dismissedAt = Number(read(DISMISS_KEY) || 0);
  if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 864e5) return;

  const ua = navigator.userAgent || '';
  const isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let deferred = null;

  const bar = document.createElement('div');
  bar.className = 'install-bar';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'تثبيت التطبيق');
  bar.hidden = true;
  bar.innerHTML = '<img src="assets/brand/icon-192.png" alt="" width="40" height="40"><div class="install-text"><strong>ثبّت تطبيق يلا رياضة</strong><span id="install-sub">افتحه من شاشتك الرئيسية مثل أي تطبيق.</span></div><button type="button" class="btn primary install-go" id="install-go">تثبيت</button><button type="button" class="install-x" id="install-x" aria-label="إغلاق">×</button>';

  const show = () => { if (!bar.isConnected) document.body.prepend(bar); bar.hidden = false; };
  const hide = (remember) => { bar.hidden = true; if (remember) write(DISMISS_KEY, String(Date.now())); };

  bar.querySelector('#install-x').addEventListener('click', () => hide(true));
  bar.querySelector('#install-go').addEventListener('click', async () => {
    if (deferred) {
      deferred.prompt();
      try { await deferred.userChoice; } catch { /* تجاهل */ }
      deferred = null;
      hide(true);
    } else if (isIOS) {
      bar.querySelector('#install-sub').textContent = 'اضغط زر المشاركة ⎋ في Safari ثم «إضافة إلى الشاشة الرئيسية».';
      bar.querySelector('#install-go').hidden = true;
    }
  });

  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; show(); });
  window.addEventListener('appinstalled', () => hide(true));

  // iOS لا يدعم beforeinstallprompt: نعرض الشريط مع الشرح، في Safari فقط
  if (isIOS && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua)) {
    document.addEventListener('DOMContentLoaded', show);
    if (document.readyState !== 'loading') show();
  }
})();
