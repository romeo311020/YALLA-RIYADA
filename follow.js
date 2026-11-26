/* متابعة الفرق بضغطة واحدة — بتربط صفحة الفريق والمباراة بصفحة «المفضلة» والإشعارات. */
(() => {
  'use strict';
  const db = window.yrSupabase; if (!db) return;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  let user = null; const set = new Set(); let loaded = false; let busy = false;
  const ready = (async () => {
    try {
      const { data: s } = await db.auth.getSession(); user = s?.session?.user || null;
      if (user) { const r = await db.from('push_follows').select('push_targets(api_id,kind)'); (r.data || []).forEach((x) => { const t = x.push_targets; if (t && t.kind === 'team' && t.api_id) set.add(Number(t.api_id)); }); }
    } catch { /* بدون متابعات */ }
    loaded = true; sync();
  })();
  const isF = (id) => set.has(Number(id));
  const label = (b) => { const on = isF(b.dataset.fol); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); b.querySelector('i').textContent = on ? '✓' : '＋'; b.querySelector('span').textContent = (on ? 'تتابع ' : 'تابع ') + (b.dataset.dn || ''); };
  function sync() { document.querySelectorAll('[data-fol]').forEach(label); }
  // نص الزر: name = الاسم بالإنجليزي (للحفظ)، dn = الاسم المعروض
  const button = (id, name, dn, logo, cls = '') => Number(id) > 0 ? `<button type="button" class="fol-btn ${cls}" data-fol="${Number(id)}" data-n="${esc(name)}" data-dn="${esc(dn || name)}" data-l="${esc(logo || '')}" aria-pressed="false"><i aria-hidden="true">＋</i><span>تابع ${esc(dn || name)}</span></button>` : '';
  const toast = (t) => { let e = document.getElementById('fol-toast'); if (!e) { e = document.createElement('div'); e.id = 'fol-toast'; e.setAttribute('role', 'status'); document.body.append(e); } e.textContent = t; e.classList.add('show'); clearTimeout(e._t); e._t = setTimeout(() => e.classList.remove('show'), 2600); };
  async function toggle(b) {
    if (busy) return; await ready;
    if (!user) { if (window.yrLogin) window.yrLogin('سجّل دخولك علشان تتابع فرقك وتوصلك إشعاراتها'); else location.href = 'account.html'; return; }
    const id = Number(b.dataset.fol); const on = !isF(id); busy = true; b.disabled = true;
    try {
      const r = on ? await db.rpc('follow_team', { p_api_id: id, p_name_en: b.dataset.n || b.dataset.dn, p_logo: b.dataset.l || null }) : await db.rpc('unfollow_team', { p_api_id: id });
      if (r.error) { toast(/الحد الأقصى/.test(r.error.message) ? 'وصلت للحد الأقصى (40 فريق).' : 'تعذّر الحفظ، جرّب تاني.'); }
      else { if (on) set.add(id); else set.delete(id); toast(on ? `تمام! هتوصلك أخبار ومباريات ${b.dataset.dn || 'الفريق'} ✓` : 'تم إلغاء المتابعة'); document.dispatchEvent(new CustomEvent('yr-follow', { detail: { id, on } })); }
    } catch { toast('تعذّر الحفظ، جرّب تاني.'); }
    busy = false; b.disabled = false; sync();
  }
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-fol]'); if (b) { e.preventDefault(); toggle(b); } });
  // اقتراح خفيف مرة كل 3 أيام: لو الفريق مش متابَع
  async function nudge(items) {
    await ready; if (!loaded) return;
    try { const last = Number(localStorage.getItem('yr-fol-nudge') || 0); if (Date.now() - last < 3 * 864e5) return; } catch { return; }
    const t = (items || []).find((x) => Number(x.id) > 0 && !isF(x.id)); if (!t) return;
    setTimeout(() => {
      if (document.getElementById('fol-nudge') || isF(t.id)) return;
      const n = document.createElement('div'); n.id = 'fol-nudge'; n.setAttribute('role', 'dialog'); n.setAttribute('aria-label', 'متابعة الفريق');
      n.innerHTML = `<p>بتحب <b>${esc(t.dn || t.name)}</b>؟ تابعه وهتوصلك مبارياته وأخباره.</p>${button(t.id, t.name, t.dn, t.logo, 'lg')}<button type="button" class="fol-x" aria-label="مش دلوقتي">✕</button>`;
      document.body.append(n); sync();
      const close = () => { try { localStorage.setItem('yr-fol-nudge', String(Date.now())); } catch { /* اختياري */ } n.remove(); };
      n.querySelector('.fol-x').addEventListener('click', close);
      document.addEventListener('yr-follow', close, { once: true });
    }, 12000);
  }
  window.yrFollow = { button, sync, nudge, isFollowing: isF, ready };
})();
