/* حسابي: التنقل بين الأقسام (بطاقات) داخل نفس الصفحة */
(() => {
  'use strict';
  const tiles = document.getElementById('acc-tiles'); if (!tiles) return;
  const panes = [...document.querySelectorAll('[data-pane-body]')];
  const show = (name) => {
    const ok = panes.some((p) => p.dataset.paneBody === name);
    panes.forEach((p) => { p.hidden = !(ok && p.dataset.paneBody === name); });
    tiles.hidden = ok; const hero = document.querySelector('.acc-hero'); if (hero) hero.classList.toggle('compact', ok);
    if (ok) window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  tiles.addEventListener('click', (e) => { const b = e.target.closest('[data-pane]'); if (b) { history.replaceState(null, '', '#' + b.dataset.pane); show(b.dataset.pane); } });
  document.addEventListener('click', (e) => { if (e.target.closest('[data-back]')) { history.replaceState(null, '', location.pathname); show(''); } });
  window.addEventListener('hashchange', () => show(location.hash.slice(1)));
  show(location.hash.slice(1));
})();
