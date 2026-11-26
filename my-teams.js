/* حسابي ← تابع فريقك: صفحتين (متابعتي | متابعة جديدة) × (فرق | بطولات) + بحث + تصفية بالبطولة */
(() => {
  'use strict';
  const db = window.yrSupabase; const list = document.getElementById('mt-list'); if (!db || !list) return;
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const COLS = 'id,kind,name_ar,name_en,api_id,logo_url,country,leagues';
  const PAGE = 30;
  const st = { v: 'mine', k: 'team', lg: null, page: 1, q: '' };
  let uid = null, mine = [], leagues = [], busy = false, timer = 0, seq = 0;
  const say = (t) => { const m = $('mt-msg'); if (m) m.textContent = t || ''; };
  const names = () => window.YR_NAMES;
  const label = (t) => { if (t.kind === 'team' && names()) { const a = names().team(t.name_en); if (a) return a; } return t.name_ar || t.name_en; };
  const logo = (t) => (t.logo_url && /^https:\/\//.test(t.logo_url) ? `<img src="${esc(t.logo_url)}" alt="" loading="lazy">` : (t.kind === 'league' ? '🏆' : '⚽'));
  const row = (t, on) => `<div class="mt-row"><span class="mt-lg">${logo(t)}</span><b>${esc(label(t))}</b><button type="button" class="fol-btn${on ? ' on' : ''}" data-mt="${esc(t.id)}" data-on="${on ? 1 : 0}" aria-pressed="${on}"><i aria-hidden="true">${on ? '✓' : '＋'}</i><span>${on ? 'إلغاء المتابعة' : 'تابع'}</span></button></div>`;
  const mineIds = () => new Set(mine.map((t) => t.id));

  async function loadMine() {
    const r = await db.from('push_follows').select(`target_id,push_targets(${COLS})`).eq('user_id', uid);
    if (r.error) { say('تعذّر تحميل متابعاتك، جرّب تاني.'); return; }
    mine = (r.data || []).map((x) => x.push_targets).filter(Boolean);
    const n = $('st-teams'); if (n) n.textContent = String(mine.filter((t) => t.kind === 'team').length);
  }
  async function loadLeagues() {
    const r = await db.from('push_targets').select('id,api_id,name_ar,name_en,logo_url,kind').eq('kind', 'league').eq('active', true).order('sort_order').limit(60);
    leagues = r.error ? [] : (r.data || []);
  }
  function chipsLeagues() {
    const box = $('mt-lg'); if (!box) return;
    box.hidden = st.k !== 'team' || !leagues.length;
    box.innerHTML = `<button type="button" class="mt-chip" data-lg="" aria-pressed="${st.lg == null}">كل الفرق</button>` + leagues.filter((l) => l.api_id).map((l) => `<button type="button" class="mt-chip" data-lg="${l.api_id}" aria-pressed="${st.lg === l.api_id}">${esc(l.name_ar || l.name_en)}</button>`).join('');
  }
  async function paint() {
    const my = ++seq;
    document.querySelectorAll('.mt-tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.v === st.v)));
    document.querySelectorAll('.mt-chip[data-k]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === st.k)));
    $('mt-new').hidden = st.v !== 'new'; chipsLeagues();
    if (st.v === 'mine') {
      const rows = mine.filter((t) => t.kind === st.k);
      list.innerHTML = rows.length ? rows.map((t) => row(t, true)).join('') : `<p class="note">${st.k === 'team' ? 'لسه مبتتابعش أي فريق.' : 'لسه مبتتابعش أي بطولة.'} افتح «متابعة جديدة» وأضف.</p>`;
      return;
    }
    list.innerHTML = '<p class="note">جارٍ التحميل…</p>';
    let b = db.from('push_targets').select(COLS).eq('kind', st.k).eq('active', true);
    const term = st.q.trim().replace(/[%_,()"\\]/g, ' ').slice(0, 40);
    if (term.length >= 2) {
      const ors = [`name_ar.ilike.%${term}%`, `name_en.ilike.%${term}%`];
      if (/[\u0600-\u06FF]/.test(term) && names()) {
        const en = names().entries().filter(([, ar]) => ar && ar.includes(term)).slice(0, 20).map(([e]) => `"${String(e).replace(/["\\]/g, '')}"`);
        if (en.length) ors.push(`name_en.in.(${en.join(',')})`);
      }
      b = b.or(ors.join(','));
    }
    if (st.k === 'team' && st.lg) b = b.contains('leagues', [st.lg]);
    const r = await b.order('sort_order').order('name_en').range(0, st.page * PAGE);
    if (my !== seq) return;
    if (r.error) { list.innerHTML = '<p class="note">تعذّر التحميل، جرّب تاني.</p>'; return; }
    const have = mineIds(); const all = (r.data || []).filter((t) => !have.has(t.id));
    const more = (r.data || []).length > st.page * PAGE;
    list.innerHTML = all.length ? all.slice(0, st.page * PAGE).map((t) => row(t, false)).join('') + (more ? '<button type="button" class="btn outline mt-more" id="mt-more">عرض المزيد</button>' : '')
      : `<p class="note">${term.length >= 2 ? 'مفيش نتيجة بالاسم ده.' : (st.k === 'team' ? 'مفيش فرق متاحة هنا لسه — الأدمن بيحدّث القائمة من لوحة التحكم.' : 'مفيش بطولات متاحة لسه.')}</p>`;
  }
  document.addEventListener('click', async (e) => {
    const t = e.target;
    const tab = t.closest('.mt-tab'); if (tab) { st.v = tab.dataset.v; st.page = 1; paint(); return; }
    const kc = t.closest('.mt-chip[data-k]'); if (kc) { st.k = kc.dataset.k; st.page = 1; st.lg = null; paint(); return; }
    const lc = t.closest('.mt-chip[data-lg]'); if (lc) { st.lg = lc.dataset.lg ? Number(lc.dataset.lg) : null; st.page = 1; paint(); return; }
    if (t.closest('#mt-more')) { st.page += 1; paint(); return; }
    const b = t.closest('[data-mt]'); if (!b || busy || !uid) return; busy = true; b.disabled = true; say('');
    try {
      const id = b.dataset.mt; const on = b.dataset.on !== '1';
      const r = on ? await db.from('push_follows').insert({ user_id: uid, target_id: id }) : await db.from('push_follows').delete().eq('user_id', uid).eq('target_id', id);
      if (r.error && !/duplicate/i.test(r.error.message)) say('تعذّر الحفظ، جرّب تاني.');
      await loadMine(); await paint();
    } catch { say('تعذّر الحفظ، جرّب تاني.'); }
    busy = false;
  });
  $('mt-q')?.addEventListener('input', (e) => { clearTimeout(timer); timer = setTimeout(() => { st.q = e.target.value; st.page = 1; paint(); }, 300); });
  const boot = async (id) => { uid = id; await Promise.all([loadMine(), loadLeagues()]); paint(); };
  db.auth.getSession().then(({ data }) => { if (data?.session?.user) boot(data.session.user.id); });
  db.auth.onAuthStateChange((_e, s) => { const n = s?.user?.id; if (n && n !== uid) setTimeout(() => boot(n), 0); });
})();
