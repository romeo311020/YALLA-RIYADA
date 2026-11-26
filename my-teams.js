/* حسابي ← تابع فريقك: فرقك + بحث + إضافة/إلغاء */
(() => {
  'use strict';
  const db = window.yrSupabase; const mine = document.getElementById('mt-mine'); if (!db || !mine) return;
  const res = document.getElementById('mt-res'), q = document.getElementById('mt-q'), msg = document.getElementById('mt-msg');
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const COLS = 'id,name_ar,name_en,api_id,logo_url';
  let uid = null; let mineRows = []; let busy = false; let timer = 0;
  const say = (t) => { if (msg) msg.textContent = t || ''; };
  const row = (t, on) => `<div class="mt-row"><span class="mt-lg">${t.logo_url && /^https:\/\//.test(t.logo_url) ? `<img src="${esc(t.logo_url)}" alt="" loading="lazy">` : '⚽'}</span><b>${esc(t.name_ar || t.name_en)}</b><button type="button" class="fol-btn${on ? ' on' : ''}" data-mt="${esc(t.id)}" data-on="${on ? 1 : 0}" aria-pressed="${on}"><i aria-hidden="true">${on ? '✓' : '＋'}</i><span>${on ? 'إلغاء المتابعة' : 'تابع'}</span></button></div>`;
  async function loadMine() {
    const r = await db.from('push_follows').select(`target_id,push_targets(${COLS},kind)`).eq('user_id', uid);
    if (r.error) { mine.innerHTML = '<p class="note">تعذّر تحميل فرقك، جرّب تاني.</p>'; return; }
    mineRows = (r.data || []).map((x) => x.push_targets).filter((t) => t && t.kind === 'team');
    mine.innerHTML = mineRows.length ? mineRows.map((t) => row(t, true)).join('') : '<p class="note">لسه مبتتابعش أي فريق. ابحث وأضف فريقك من تحت 👇</p>';
    const st = document.getElementById('st-teams'); if (st) st.textContent = String(mineRows.length);
  }
  async function search() {
    const term = (q.value || '').trim().replace(/[%_,()]/g, ' ').slice(0, 40);
    let b = db.from('push_targets').select(COLS).eq('kind', 'team').eq('active', true);
    if (term.length >= 2) b = b.or(`name_ar.ilike.%${term}%,name_en.ilike.%${term}%`);
    const r = await b.order('sort_order').limit(24);
    if (r.error) { res.innerHTML = '<p class="note">تعذّر البحث.</p>'; return; }
    const have = new Set(mineRows.map((t) => t.id)); const list = (r.data || []).filter((t) => !have.has(t.id));
    res.innerHTML = list.length ? list.map((t) => row(t, false)).join('') : `<p class="note">${term.length >= 2 ? 'مفيش فريق بالاسم ده. افتح صفحة الفريق من أي مباراة واضغط «تابع».' : 'ابحث باسم الفريق.'}</p>`;
  }
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-mt]'); if (!b || busy) return; busy = true; b.disabled = true; say('');
    try {
      const id = b.dataset.mt; const on = b.dataset.on !== '1';
      const r = on ? await db.from('push_follows').insert({ user_id: uid, target_id: id }) : await db.from('push_follows').delete().eq('user_id', uid).eq('target_id', id);
      if (r.error && !/duplicate/i.test(r.error.message)) say(/limit|الحد/.test(r.error.message) ? 'وصلت للحد الأقصى.' : 'تعذّر الحفظ، جرّب تاني.');
      await loadMine(); await search();
    } catch { say('تعذّر الحفظ، جرّب تاني.'); }
    busy = false;
  });
  q.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(search, 300); });
  db.auth.getSession().then(({ data }) => { uid = data?.session?.user?.id || null; if (uid) { loadMine().then(search); } });
  db.auth.onAuthStateChange((_e, s) => { const n = s?.user?.id || null; if (n && n !== uid) { uid = n; setTimeout(() => loadMine().then(search), 0); } });
})();
