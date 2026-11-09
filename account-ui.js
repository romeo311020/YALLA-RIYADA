/* حسابي: التنقل بين الأقسام + بانر الإشعارات */
(() => {
  'use strict';
  const hub = document.getElementById('ac-hub'); if (!hub) return;
  const me = document.getElementById('ac-me');
  const panes = [...document.querySelectorAll('[data-pane-body]')];

  /* ----- الأقسام ----- */
  const show = (name) => {
    const ok = panes.some((p) => p.dataset.paneBody === name);
    panes.forEach((p) => { p.hidden = !(ok && p.dataset.paneBody === name); });
    hub.hidden = ok; if (me) me.classList.toggle('compact', ok);
    if (ok) window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-pane]'); if (b) { history.replaceState(null, '', '#' + b.dataset.pane); show(b.dataset.pane); return; }
    if (e.target.closest('[data-back]')) { history.replaceState(null, '', location.pathname); show(''); }
  });
  window.addEventListener('hashchange', () => show(location.hash.slice(1)));
  show(location.hash.slice(1));

  /* ----- بانر الإشعارات ----- */
  const box = document.getElementById('ac-notify'); if (!box) return;
  let busy = false;
  const draw = (cls, ico, title, sub, action) => {
    box.className = 'ac-notify ' + cls;
    box.innerHTML = `<div class="ico" aria-hidden="true">${ico}</div><div class="txt"><b>${title}</b><small>${sub}</small></div>${action || ''}`;
  };
  async function paint(msg) {
    const p = window.yrPush;
    if (!p) { draw('is-off', '🔔', 'الإشعارات', 'اختار فرقك ولاعبينك المفضّلين.', '<a class="go" href="notifications.html">إدارة</a>'); return; }
    const st = await p.state();
    if (st === 'on') draw('is-on', '✅', 'الإشعارات شغّالة على جهازك', msg || 'هتوصلك أخبار وأهداف فرقك ولاعبينك.', '<a class="go" href="notifications.html">إدارة</a>');
    else if (st === 'denied') draw('is-bad', '🔕', 'الإشعارات محظورة', 'فعّلها من إعدادات المتصفح (قفل العنوان ← الإشعارات ← سماح) وحدّث الصفحة.', '<a class="go" href="notifications.html">التفاصيل</a>');
    else if (st === 'ios-install') draw('is-off', '📲', 'ثبّت التطبيق الأول', 'على الآيفون: مشاركة ← «إضافة إلى الشاشة الرئيسية»، وافتح التطبيق من هناك وفعّل الإشعارات.', '');
    else if (st === 'unsupported') draw('is-off', '🔕', 'المتصفح مش بيدعم الإشعارات', 'جرّب Chrome أو ثبّت التطبيق على جهازك.', '');
    else draw('', '🔔', 'فعّل الإشعارات واوصلك كل جديد', msg || 'أهداف وأخبار فرقك ولاعبينك لحظة بلحظة.', '<button class="go" id="ac-notify-go" type="button">فعّل الآن</button>');
  }
  box.addEventListener('click', async (e) => {
    if (!e.target.closest('#ac-notify-go') || busy) return; busy = true;
    const btn = e.target.closest('#ac-notify-go'); btn.disabled = true; btn.textContent = '...';
    const r = await window.yrPush.enable(); busy = false;
    await paint(r.ok ? '' : (r.msg || 'تعذّر التفعيل.'));
  });
  document.addEventListener('yr-push-change', () => paint());
  paint();
  window.addEventListener('load', () => setTimeout(() => paint(), 600)); // لو notify-prompt اتحمّل متأخر
})();
