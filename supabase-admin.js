// يلا رياضة — لوحة الإدارة. كل الصلاحيات تُفرض في قاعدة البيانات (RLS) ودالة admin-users، وليس هنا فقط.
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const client = window.yrSupabase;
  const loginPanel = $('admin-login-panel');
  const workspace = $('admin-workspace');
  const logoutButton = $('admin-logout');
  let currentUser = null;

  const toast = (m) => { if (!m) return; let t = document.getElementById('toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); } t.textContent = m; t.className = 'show'; clearTimeout(toast.t); toast.t = setTimeout(() => { t.className = ''; }, 3200); };
  const say = (id, message) => { const el = $(id); if (el) el.textContent = message; if (message && /^(تم|اتحفظ|✓)/.test(String(message))) toast(message); };
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const httpsOk = (value) => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };
  const localDT = (value) => {
    if (!value) return '';
    const d = new Date(value); if (Number.isNaN(d.getTime())) return '';
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };
  const fmt = (value) => value ? new Date(value).toLocaleString('ar-EG', { timeZone: 'Africa/Cairo', dateStyle: 'medium', timeStyle: 'short' }) : '—';
  const cairoDate = (offset) => {
    const v = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
    return new Date(Date.UTC(Number(v.year), Number(v.month) - 1, Number(v.day) + offset)).toISOString().slice(0, 10);
  };

  if (!client) { say('admin-auth-message', 'أكمل إعداد supabase-config.js أولًا، ثم ارفع الملفات إلى الموقع.'); return; }

  // استدعاء دالة Edge مع استخراج رسالة الخطأ الحقيقية
  async function callFn(name, body) {
    const { data, error } = await client.functions.invoke(name, { body });
    if (error) {
      let msg = error.message || 'خطأ غير معروف';
      try { const j = await error.context?.json?.(); if (j?.error) msg = j.error; } catch { /* نكتفي بالرسالة */ }
      if (/failed to send a request/i.test(msg)) msg = `تعذّر الوصول إلى الدالة ${name}. تأكد أنها منشورة بهذا الاسم بالظبط.`;
      throw new Error(msg);
    }
    if (data?.error) throw new Error(data.error);
    return data;
  }

  /* ======================== الدخول والتبويبات ======================== */
  async function checkSession() {
    try {
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      if (data.session) await verifyAdmin(data.session.user);
      else { loginPanel.hidden = false; workspace.hidden = true; }
    } catch (error) { say('admin-auth-message', `تعذّر التحقق من الجلسة: ${error.message}`); }
  }

  let myRole = 'admin';
  async function verifyAdmin(user) {
    const { data: profile, error } = await client.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (error) { say('admin-auth-message', `تعذّر التحقق من صلاحيات الحساب: ${error.message}`); return; }
    if (profile?.role !== 'admin' && profile?.role !== 'editor') {
      currentUser = null; workspace.hidden = true; loginPanel.hidden = false; logoutButton.hidden = false;
      say('admin-auth-message', 'هذا الحساب ليس مسؤولًا. يجب أن يعيّن مسؤول المشروع role=admin لهذا الحساب.');
      return;
    }
    currentUser = user; myRole = profile.role; document.body.classList.toggle('adm-editor', myRole === 'editor');
    loginPanel.hidden = true; workspace.hidden = false; logoutButton.hidden = false;
    say('admin-auth-message', '');
    if (myRole === 'admin') refreshOrdersBadge();
    openTab(myRole === 'editor' ? 'news' : (new URLSearchParams(location.search).get('tab') || 'overview'));
  }

  $('admin-login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    say('admin-auth-message', 'جارٍ التحقق...');
    const { data, error } = await client.auth.signInWithPassword({ email: $('admin-email').value.trim(), password: $('admin-password').value });
    if (error) { say('admin-auth-message', `تعذّر تسجيل الدخول: ${error.message}`); return; }
    await verifyAdmin(data.user);
  });
  logoutButton.addEventListener('click', async () => {
    const { error } = await client.auth.signOut();
    if (error) { say('admin-auth-message', `تعذّر تسجيل الخروج: ${error.message}`); return; }
    currentUser = null; workspace.hidden = true; loginPanel.hidden = false; logoutButton.hidden = true;
    say('admin-auth-message', 'تم تسجيل الخروج.');
  });

  const loaded = new Set();
  const loaders = {
    overview: () => loadOverview(),
    stats: () => loadStats(),
    matches: () => loadMatches(),
    apimatches: () => ovRefreshList(),
    important: () => loadImportant(),
    lineups: () => luSrcChange(),
    names: () => { loadUnknownNames(); return loadSavedNames(); },
    streams: () => Promise.all([loadStreams(), loadApiFixtures('stream')]),
    store: () => Promise.all([loadStoreSetting(), loadProducts(), loadCategories()]),
    orders: () => loadOrders(),
    news: () => loadNews(),
    transfers: () => loadTransfers(),
    ads: () => loadAds(),
    push: () => loadPush(),
    pushtargets: () => loadPushTargets(),
    users: () => loadUsers(true),
    audit: () => loadAudit(),
    leagues: () => loadLeagueOrderAdmin(),
    teams: () => loadTopTeamsAdmin(),
  };
  /* ---------- شريط البحث: بيفلتر عناصر القسم المفتوح ---------- */
  const normQ = (t) => String(t || '').toLowerCase().replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').trim();
  const SEARCH_ITEMS = '.admin-list-item, .user-row, .order-item, .lg-list li, .qa, .stat-card, .audit-row';
  function applySearch() {
    const box = $('admin-search'); const q = normQ(box.value); const pane = document.querySelector('.admin-pane:not([hidden])'); const cnt = $('admin-search-count');
    if (!pane) return;
    const items = [...pane.querySelectorAll(SEARCH_ITEMS)]; let shown = 0;
    items.forEach((el) => { const hit = !q || normQ(el.textContent).includes(q); el.classList.toggle('search-hide', !hit); if (hit) shown += 1; });
    const msg = q ? (items.length ? `${shown} من ${items.length}` : 'لا توجد عناصر في هذا القسم') : ''; if (cnt.textContent !== msg) cnt.textContent = msg;
    let none = pane.querySelector('.search-none'); if (q && items.length && !shown) { if (!none) { none = document.createElement('p'); none.className = 'note search-none'; none.textContent = 'مفيش نتائج مطابقة.'; pane.appendChild(none); } } else if (none) none.remove();
  }
  $('admin-search').addEventListener('input', applySearch);
  document.addEventListener('keydown', (e) => { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) { e.preventDefault(); $('admin-search').focus(); } if (e.key === 'Escape' && document.activeElement === $('admin-search')) { $('admin-search').value = ''; applySearch(); $('admin-search').blur(); } });
  // لما القوائم تتحدّث (تحميل/حفظ/حذف) نعيد تطبيق البحث
  let searchTimer; new MutationObserver((muts) => { if (!$('admin-search').value || muts.every((m) => m.target.closest?.('.admin-search') || m.target.classList?.contains('search-none') || m.target === $('admin-search-count'))) return; clearTimeout(searchTimer); searchTimer = setTimeout(applySearch, 60); }).observe(document.getElementById('admin-workspace'), { childList: true, subtree: true });

  /* ---------- بحث شامل: مباريات، فرق، أخبار، منتجات، طلبات، أقسام ---------- */
  const TABS = [['overview', 'نظرة عامة'], ['transfers', 'الانتقالات'], ['ads', 'الإعلانات'], ['stats', 'الإحصائيات والتقارير'], ['apimatches', 'تعديل مباراة API'], ['matches', 'مباريات يدوية'], ['important', 'المباريات المهمة'], ['lineups', 'التشكيلات والأحداث'], ['streams', 'المشغّلات'], ['leagues', 'ترتيب البطولات'], ['teams', 'الفرق المهمة'], ['names', 'أسماء الفرق'], ['push', 'إرسال إشعار'], ['pushtargets', 'فرق ولاعبو الإشعارات'], ['news', 'الأخبار'], ['store', 'المتجر'], ['orders', 'الطلبات'], ['users', 'المستخدمون'], ['audit', 'السجل']];
  let gTimer; let gSeq = 0;
  const likeQ = (q) => q.replace(/[%,()*]/g, ' ').trim();
  const gRow = (icon, title, sub, attrs) => `<button type="button" class="g-row" ${attrs}><i>${icon}</i><span><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span></button>`;
  async function globalSearch() {
    const box = $('gsearch'); const raw = $('admin-search').value.trim(); const q = normQ(raw);
    if (q.length < 2) { box.hidden = true; box.innerHTML = ''; return; }
    const my = ++gSeq; const lq = likeQ(raw); const sections = [];
    const tabs = TABS.filter(([, n]) => normQ(n).includes(q));
    if (tabs.length) sections.push(['الأقسام', tabs.map(([k, n]) => gRow('➜', n, 'افتح القسم', `data-g-tab="${k}"`)).join('')]);
    // فرق: القاموس + اللي عدّلته + فرق اليوم — مع تعديل الاسم مباشرة
    const teams = new Map();
    (window.YR_NAMES?.entries?.() || []).forEach(([en, a]) => { if (normQ(en).includes(q) || normQ(a).includes(q)) teams.set(en, a); });
    nmSaved.forEach((r) => { if (normQ(r.en).includes(q) || normQ(r.ar).includes(q)) teams.set(r.en.toLowerCase(), r.ar); });
    tmSeen.forEach((a, en) => { if (normQ(en).includes(q) || normQ(a).includes(q)) teams.set(en.toLowerCase(), nmSaved.get(en.toLowerCase())?.ar || a); });
    const tl = [...teams].slice(0, 8);
    if (tl.length) sections.push(['الفرق (عدّل الاسم من هنا)', tl.map(([en, a]) => `<div class="g-team" data-g-en="${esc(en)}"><span dir="ltr" class="g-en">${esc(en)}</span><input value="${esc(a)}" maxlength="60" aria-label="الاسم بالعربي"><button type="button" class="btn primary" data-g-name="${esc(en)}">حفظ</button></div>`).join('')]);
    const jobs = [
      ['المباريات', () => client.from('matches').select('id,home_team,away_team,league,kickoff').or(`home_team.ilike.%${lq}%,away_team.ilike.%${lq}%,league.ilike.%${lq}%`).limit(6), (r) => gRow('⚽', `${ar(r.home_team)} × ${ar(r.away_team)}`, r.league, 'data-g-tab="matches" data-g-q="' + esc(r.home_team) + '"')],
      ['الأخبار', () => client.from('news').select('id,title').ilike('title', `%${lq}%`).limit(5), (r) => gRow('📰', r.title, '', 'data-g-tab="news" data-g-q="' + esc(r.title.slice(0, 30)) + '"')],
      ['المنتجات', () => client.from('products').select('id,name,category').ilike('name', `%${lq}%`).limit(5), (r) => gRow('🛍️', r.name, r.category, 'data-g-tab="store" data-g-q="' + esc(r.name.slice(0, 30)) + '"')],
      ['الطلبات', () => client.from('orders').select('order_no,customer_name,phone,product_name').or(`customer_name.ilike.%${lq}%,phone.ilike.%${lq}%,product_name.ilike.%${lq}%`).limit(5), (r) => gRow('📦', `#${r.order_no} · ${r.customer_name}`, `${r.product_name} · ${r.phone}`, 'data-g-tab="orders" data-g-q="' + esc(String(r.order_no)) + '"')],
    ];
    const res = await Promise.all(jobs.map(async ([title, p, f]) => { try { const { data } = await p(); return data?.length ? [title, data.map(f).join('')] : null; } catch { return null; } }));
    if (my !== gSeq) return;
    res.forEach((r) => r && sections.push(r));
    sections.push(['مستخدمون', gRow('👥', `ابحث عن «${raw}» في المستخدمين`, 'بالإيميل أو الاسم', 'data-g-tab="users" data-g-q="' + esc(raw) + '"')]);
    box.innerHTML = sections.map(([t, body]) => `<div class="g-sec"><h4>${esc(t)}</h4>${body}</div>`).join('');
    box.hidden = false;
  }
  $('admin-search').addEventListener('input', () => { clearTimeout(gTimer); gTimer = setTimeout(globalSearch, 280); });
  document.addEventListener('click', async (e) => {
    const box = $('gsearch');
    const t = e.target.closest('[data-g-tab]');
    if (t) { const q = t.dataset.gQ || ''; openTab(t.dataset.gTab); box.hidden = true; if (q) { $('admin-search').value = q; setTimeout(() => { applySearch(); }, 600); } return; }
    const sv = e.target.closest('[data-g-name]');
    if (sv) {
      const en = sv.dataset.gName; const val = sv.closest('.g-team').querySelector('input').value.trim(); if (!val) return;
      const { error } = await client.from('name_translations').upsert({ kind: 'team', en, ar: val }, { onConflict: 'kind,en' });
      sv.textContent = error ? '✗' : 'تم ✓'; if (!error) { nmSaved.set(en.toLowerCase(), { en, ar: val }); loadSavedNames(); }
      return;
    }
    if (!e.target.closest('.admin-search')) box.hidden = true;
  });
  const PAGE_META = {
    overview: ['نظرة عامة', 'ملخص سريع لحالة الموقع واختصارات للمهام اليومية.'],
    apimatches: ['تعديل مباراة API', 'تأجيل أو إلغاء أو تغيير النتيجة والموعد لأي مباراة قادمة من الـ API.'],
    matches: ['المباريات اليدوية', 'أضف مباراة بنفسك وعدّل بياناتها ومشغّلها.'],
    important: ['المباريات المهمة', 'اختار التاريخ وحمّل المباريات واحفظ المهم منها دفعة واحدة.'],
    lineups: ['التشكيلات والأحداث', 'تشكيلة الفريقين وملخص الأحداث لأي مباراة (يدوية أو API).'],
    names: ['أسماء الفرق', 'عدّل اسم أي فريق أو لاعب بالعربي.'],
    leagues: ['البطولات', 'رتّب البطولات اللي تظهر للزوار أولًا.'],
    teams: ['الفرق المهمة', 'الفرق اللي مبارياتها بتظهر الأول.'],
    streams: ['المشغّلات', 'اربط روابط المشاهدة بالمباريات لتظهر للأعضاء.'],
    store: ['المتجر', 'المنتجات وإعدادات فتح المتجر.'],
    stats: ['الإحصائيات والتقارير', 'زيارات، مستخدمين، مبيعات، ومتابعين الفرق — كلها في مكان واحد.'],
    orders: ['الطلبات', 'متابعة طلبات العملاء وتغيير حالتها.'],
    push: ['إرسال إشعار', 'ابعت إشعار لكل المشتركين أو لمتابعي فريق/لاعب، أو حوّل خبر لإشعار.'],
    pushtargets: ['فرق ولاعبو الإشعارات', 'تحكم في الفرق واللاعبين اللي المستخدم يقدر يتابعهم.'],
    transfers: ['الانتقالات', 'أضف وعدّل صفقات سوق الانتقالات اللي بتظهر في الصفحة العامة.'],
    ads: ['الإعلانات', 'إعلانات منبثقة بصورة أو فيديو، مع عدّاد مشاهدات ونقرات.'],
    news: ['الأخبار', 'اكتب أخبارًا حصرية وضمّن منشورات X وإنستجرام وتيك توك ويوتيوب.'],
    users: ['المستخدمون', 'إدارة الحسابات والصلاحيات والحظر.'],
    audit: ['السجل', 'آخر عمليات المسؤولين.'],
  };
  function openTab(name) {
    if ($('admin-search')) { $('admin-search').value = ''; setTimeout(applySearch, 0); }
    if (!loaders[name]) name = 'overview';
    if (myRole === 'editor') name = 'news';
    document.querySelectorAll('[data-atab]').forEach((b) => { const on = b.dataset.atab === name; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); });
    document.querySelectorAll('.admin-pane').forEach((p) => { p.hidden = p.id !== `pane-${name}`; });
    const meta = PAGE_META[name] || PAGE_META.overview; if ($('adm-title')) { $('adm-title').textContent = meta[0]; $('adm-desc').textContent = meta[1]; }
    document.body.classList.remove('adm-open'); window.scrollTo({ top: 0 });
    try { const p = new URLSearchParams(location.search); p.set('tab', name); history.replaceState(null, '', `?${p}`); } catch { /* لا مشكلة */ }
    if (!loaded.has(name)) { loaded.add(name); Promise.resolve(loaders[name]()).catch((e) => console.error(`admin tab ${name}:`, e)); }
  }
  document.addEventListener('click', (e) => { const g = e.target.closest('[data-goto]'); if (g) { openTab(g.dataset.goto); window.scrollTo({ top: 0, behavior: 'smooth' }); } });
  document.querySelector('.admin-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-atab]'); if (b) openTab(b.dataset.atab); });

  /* ======================== نظرة عامة ======================== */
  async function count(table) {
    const { count: n, error } = await client.from(table).select('*', { count: 'exact', head: true });
    return error ? null : n;
  }
  async function loadOverview() {
    const host = $('overview-cards');
    host.innerHTML = '<p class="note">جارٍ التحميل…</p>';
    const [matches, streams, products, news, newOrders, storeRow, usersRes] = await Promise.all([
      count('matches'), count('fixture_streams'), count('products'), count('news'), client.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'new'),
      client.from('site_settings').select('value').eq('key', 'store_enabled').maybeSingle(),
      callFn('admin-users', { action: 'list', perPage: 200 }).catch((e) => ({ error: e.message })),
    ]);
    const users = usersRes.users || [];
    const week = Date.now() - 7 * 864e5;
    const cards = [
      ['المستخدمون', usersRes.error ? '—' : (usersRes.total ?? users.length), usersRes.error ? '' : `${users.filter((u) => new Date(u.created_at).getTime() > week).length} جديد هذا الأسبوع`],
      ['المحظورون', usersRes.error ? '—' : users.filter((u) => u.banned).length, 'حسابات موقوفة'],
      ['مباريات يدوية', matches ?? '—', ''],
      ['مشغّلات', streams ?? '—', 'مباريات عليها زر شاهد'],
      ['منتجات', products ?? '—', ''],
      ['طلبات جديدة', newOrders.error ? '—' : (newOrders.count ?? 0), newOrders.error ? 'شغّل supabase-orders.sql' : 'بانتظار التأكيد'],
      ['أخبار', news ?? '—', 'كتبتها بنفسك'],
    ];
    host.innerHTML = cards.map(([t, n, s]) => `<div class="stat-card"><span>${esc(t)}</span><b>${esc(n)}</b><small>${esc(s)}</small></div>`).join('');
    const storeOn = storeRow.data?.value === true;
    const checks = [
      [!usersRes.error, usersRes.error ? `دالة المستخدمين لا تعمل: ${usersRes.error}` : 'دالة إدارة المستخدمين تعمل'],
      [storeRow.error ? null : true, storeRow.error ? 'جدول الإعدادات غير موجود — شغّل ملف supabase-admin-upgrade.sql' : 'جدول الإعدادات موجود'],
      [storeOn ? true : null, storeOn ? 'المتجر مفتوح للزوار' : 'المتجر مغلق حاليًا (يظهر «قريبًا») — فعّله من تبويب المتجر'],
      [matches !== null && streams !== null, matches === null || streams === null ? 'بعض الجداول ناقصة — شغّل supabase-admin-upgrade.sql' : 'جداول المباريات والمشغّلات موجودة'],
    ];
    $('overview-status').innerHTML = checks.map(([ok, text]) => `<li class="${ok === true ? 'ok' : ok === false ? 'bad' : 'warn'}"><span aria-hidden="true">${ok === true ? '✓' : ok === false ? '✕' : '!'}</span>${esc(text)}</li>`).join('');
  }

  /* ======================== الإحصائيات والتقارير ======================== */
  const nAr = (n) => Number(n || 0).toLocaleString('ar-EG');
  const dayKey = (d) => { const x = new Date(d); return new Date(x.getTime() + 2 * 3600e3).toISOString().slice(0, 10); }; // بتوقيت القاهرة تقريبًا
  const lastDays = (n) => Array.from({ length: n }, (_, i) => dayKey(Date.now() - (n - 1 - i) * 864e5));
  function bars(days, map, unit = '') {
    const vals = days.map((d) => Number(map[d] || 0)); const max = Math.max(1, ...vals); const total = vals.reduce((a, b) => a + b, 0);
    const every = Math.ceil(days.length / 6);
    return `<div class="st-total"><b>${nAr(total)}</b><span>${unit} في الفترة</span></div><div class="st-bars" role="img" aria-label="رسم بياني">${vals.map((v, i) => `<i style="height:${Math.max(v ? 6 : 2, Math.round((v / max) * 100))}%" class="${v ? '' : 'z'}" title="${days[i]} · ${nAr(v)}"></i>`).join('')}</div><div class="st-axis">${days.map((d, i) => (i % every === 0 || i === days.length - 1 ? `<span>${d.slice(5)}</span>` : '')).join('')}</div>`;
  }
  function hbars(rows, unit = '') {
    if (!rows.length) return '<p class="note">لا توجد بيانات بعد.</p>';
    const max = Math.max(1, ...rows.map((r) => r[1]));
    return `<div class="st-h">${rows.map(([name, v]) => `<div class="st-hrow"><span>${esc(name)}</span><div><i style="width:${Math.max(3, Math.round((v / max) * 100))}%"></i></div><b>${nAr(v)}${unit}</b></div>`).join('')}</div>`;
  }
  async function loadStats() {
    const range = Number($('st-range').value) || 30; const days = lastDays(range); const since = days[0];
    $('st-msg').textContent = '';
    ['st-visits', 'st-users', 'st-orders', 'st-pages', 'st-follows', 'st-products'].forEach((id) => { $(id).innerHTML = '<p class="note">جارٍ التحميل…</p>'; });
    const [stats, usersRes, orders, subs, follows, targets, news, products] = await Promise.all([
      client.from('site_stats').select('day,page,hits').gte('day', since).limit(5000),
      callFn('admin-users', { action: 'list', perPage: 200 }).catch((e) => ({ error: e.message })),
      client.from('orders').select('created_at,total,status,product_name,quantity').gte('created_at', new Date(Date.now() - range * 864e5).toISOString()).limit(2000),
      client.from('push_subscriptions').select('id', { count: 'exact', head: true }),
      client.from('push_follows').select('target_id'),
      client.from('push_targets').select('id,name_ar,kind'),
      count('news'), count('products'),
    ]);
    // زيارات
    let visitors = 0; let views = 0;
    if (stats.error) { $('st-visits').innerHTML = `<p class="note">${/site_stats|relation|function/.test(stats.error.message) ? 'شغّل ملف supabase-stats.sql في Supabase لتفعيل عدّاد الزيارات.' : esc(stats.error.message)}</p>`; $('st-pages').innerHTML = ''; }
    else {
      const vMap = {}; const pMap = {}; const vis = {};
      (stats.data || []).forEach((r) => { if (r.page === '_visitor') { vis[r.day] = (vis[r.day] || 0) + r.hits; visitors += r.hits; } else { vMap[r.day] = (vMap[r.day] || 0) + r.hits; views += r.hits; pMap[r.page] = (pMap[r.page] || 0) + r.hits; } });
      $('st-visits').innerHTML = `<div class="st-two"><div>${bars(days, vis, 'زائر')}</div><div>${bars(days, vMap, 'مشاهدة صفحة')}</div></div>`;
      const NAMES = { index: 'الرئيسية', matches: 'المباريات', match: 'تفاصيل مباراة', news: 'الأخبار', article: 'خبر', store: 'المتجر', product: 'منتج', account: 'حسابي', notifications: 'الإشعارات', team: 'فريق', about: 'عن المنصة' };
      $('st-pages').innerHTML = hbars(Object.entries(pMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => [NAMES[k] || k, v]));
    }
    // مستخدمون
    const us = usersRes.users || [];
    if (usersRes.error) $('st-users').innerHTML = `<p class="note">${esc(usersRes.error)}</p>`;
    else { const m = {}; us.forEach((u) => { const k = dayKey(u.created_at); m[k] = (m[k] || 0) + 1; }); $('st-users').innerHTML = bars(days, m, 'مستخدم جديد'); }
    // طلبات
    const od = orders.data || []; let revenue = 0; const byDay = {}; const byStatus = {}; const prod = {};
    od.forEach((o) => { const k = dayKey(o.created_at); byDay[k] = (byDay[k] || 0) + 1; byStatus[o.status] = (byStatus[o.status] || 0) + 1; if (o.status !== 'cancelled') { revenue += Number(o.total || 0); prod[o.product_name] = (prod[o.product_name] || 0) + Number(o.quantity || 1); } });
    $('st-orders').innerHTML = orders.error ? '<p class="note">شغّل supabase-orders.sql</p>' : `${bars(days, byDay, 'طلب')}<div class="st-chips">${Object.entries(byStatus).map(([k, v]) => `<span class="pill">${esc(ORDER_STATUS[k] || k)}: ${nAr(v)}</span>`).join('')}</div>`;
    $('st-products').innerHTML = orders.error ? '' : hbars(Object.entries(prod).sort((a, b) => b[1] - a[1]).slice(0, 6), ' قطعة');
    // متابعين
    if (follows.error || targets.error) $('st-follows').innerHTML = '<p class="note">شغّل supabase-push-step1.sql</p>';
    else { const c = {}; (follows.data || []).forEach((f) => { c[f.target_id] = (c[f.target_id] || 0) + 1; }); $('st-follows').innerHTML = hbars((targets.data || []).map((t) => [(t.kind === 'team' ? '👕 ' : '⚽ ') + t.name_ar, c[t.id] || 0]).sort((a, b) => b[1] - a[1]).slice(0, 10)); }
    const devices = subs.error ? '—' : nAr(subs.count);
    const cards = [
      ['زائرون', stats.error ? '—' : nAr(visitors), `آخر ${range} يوم`], ['مشاهدات صفحات', stats.error ? '—' : nAr(views), ''],
      ['المستخدمون', usersRes.error ? '—' : nAr(usersRes.total ?? us.length), usersRes.error ? '' : `${nAr(us.filter((u) => dayKey(u.created_at) >= since).length)} جديد في الفترة`],
      ['أجهزة بالإشعارات', devices, 'مشتركة حاليًا'], ['طلبات', orders.error ? '—' : nAr(od.length), 'في الفترة'],
      ['المبيعات', orders.error ? '—' : nAr(revenue) + ' ج.م', 'من غير الملغي'], ['أخبار', nAr(news), ''], ['منتجات', nAr(products), ''],
    ];
    $('st-cards').innerHTML = cards.map(([t, n, sub]) => `<div class="stat-card"><span>${esc(t)}</span><b>${esc(n)}</b><small>${esc(sub)}</small></div>`).join('');
  }
  $('st-range')?.addEventListener('change', loadStats);
  $('st-refresh')?.addEventListener('click', loadStats);

  /* ======================== مباريات يدوية ======================== */
  $('match-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser) return;
    const embedUrl = $('match-embed').value.trim();
    if (embedUrl && !httpsOk(embedUrl)) { say('match-message', 'يجب أن يكون رابط المشغّل آمنًا ويبدأ بـ https://'); return; }
    say('match-message', 'جارٍ حفظ المباراة...');
    const k = $('match-kickoff').value;
    const row = {
      sport: 'football', home_team: $('match-home').value.trim(), away_team: $('match-away').value.trim(), league: $('match-league').value.trim(),
      kickoff: k ? new Date(k).toISOString() : null, status: $('match-status').value,
      home_score: $('match-home-score').value === '' ? null : Number($('match-home-score').value),
      away_score: $('match-away-score').value === '' ? null : Number($('match-away-score').value),
      embed_url: embedUrl, notes: '', is_published: $('match-published').checked,
      home_logo: $('match-home-logo').value.trim(), away_logo: $('match-away-logo').value.trim(),
      fixture_id: snap?.fixture_id ?? null, featured: $('match-featured').checked,
      details: {
        ...(snap || {}),
        info_manual: { channel: $('match-info-channel').value.trim(), commentator: $('match-info-commentator').value.trim(), notes: $('match-info-notes').value.trim() },
      },
    };
    if ((row.home_logo && !httpsOk(row.home_logo)) || (row.away_logo && !httpsOk(row.away_logo))) { say('match-message', 'رابط اللوجو يجب أن يبدأ بـ https://'); return; }
    const editId = $('match-edit-id').value;
    const save = (r) => (editId ? client.from('matches').update(r).eq('id', editId) : client.from('matches').insert(r));
    let { error } = await save(row);
    if (error && /home_logo|away_logo|details|fixture_id|featured/.test(error.message || '')) { // أعمدة جديدة غير مضافة: نحفظ الأساسي ونُنبّه
      const { home_logo, away_logo, details, fixture_id, featured, ...plain } = row; ({ error } = await save(plain));
      if (!error) say('match-message', 'تم حفظ المباراة، لكن التشكيلة والتفاصيل والإحصائيات لم تُحفظ. شغّل ملف supabase-match-full.sql (وsupabase-manual-upgrade.sql) ثم احفظ تاني.');
    }
    if (error) { say('match-message', `تعذّر حفظ المباراة: ${error.message}`); return; }
    const savedMsg = $('match-message').textContent; resetMatchForm(); say('match-message', /لم تُحفظ|بدون/.test(savedMsg) ? savedMsg : editId ? 'تم تحديث المباراة (مع التشكيلة والإحصائيات والتفاصيل).' : 'تمت إضافة المباراة (مع التشكيلة والإحصائيات والتفاصيل).'); await loadMatches();
  });
  function resetMatchForm() {
    $('match-form').reset(); $('match-edit-id').value = ''; $('match-published').checked = true; $('match-featured').checked = false; snap = null; paintSnap();
    $('match-save').textContent = 'حفظ المباراة'; $('match-cancel-edit').hidden = true;
  }
  $('match-cancel-edit').addEventListener('click', resetMatchForm);
  async function loadMatches() {
    const host = $('admin-matches');
    const { data, error } = await client.from('matches').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) { host.textContent = `تعذّر تحميل المباريات: ${error.message}`; return; }
    host.innerHTML = (data || []).map((m) => `<article class="admin-list-item">
      <div><strong>${esc(ar(m.home_team))} × ${esc(ar(m.away_team))}</strong><small>${esc(m.league || 'كرة القدم')} · ${m.featured ? '<span class="pill star">⭐ مهمة</span>' : ''}<span class="pill ${m.is_published ? 'ok' : 'off'}">${m.is_published ? 'منشورة' : 'مخفية'}</span>${m.details && (m.details.lineups || []).length ? ' · 📋 بيانات كاملة' : ''}</small></div>
      <div class="row"><button type="button" class="btn outline" data-edit-match="${esc(m.id)}">تعديل</button><button type="button" class="btn outline" data-lu-match="${esc(m.id)}">📋 تشكيلة وأحداث</button><button type="button" class="btn outline" data-delete-match="${esc(m.id)}">حذف</button></div>
    </article>`).join('') || '<p class="note">لا توجد مباريات يدوية بعد.</p>';
    host.querySelectorAll('[data-lu-match]').forEach((b) => b.addEventListener('click', () => { openTab('lineups'); $('lu-src').value = 'manual'; luSrcChange().then(() => { $('lu-match').value = b.dataset.luMatch; luPick(); }); }));
    host.querySelectorAll('[data-edit-match]').forEach((b) => b.addEventListener('click', () => {
      const m = data.find((x) => x.id === b.dataset.editMatch); if (!m) return;
      $('match-edit-id').value = m.id; $('match-home').value = m.home_team; $('match-away').value = m.away_team; $('match-league').value = m.league || '';
      $('match-kickoff').value = localDT(m.kickoff); $('match-status').value = m.status; $('match-home-score').value = m.home_score ?? ''; $('match-away-score').value = m.away_score ?? '';
      $('match-home-logo').value = m.home_logo || ''; $('match-away-logo').value = m.away_logo || '';
      const d = m.details || {}; snap = d.fixture_id || m.fixture_id ? { ...d, fixture_id: m.fixture_id ?? d.fixture_id } : null; paintSnap();
      const im = d.info_manual || {}; $('match-info-channel').value = im.channel || ''; $('match-info-commentator').value = im.commentator || ''; $('match-info-notes').value = im.notes || '';
      $('match-embed').value = m.embed_url || ''; $('match-published').checked = m.is_published; $('match-featured').checked = !!m.featured; $('match-save').textContent = 'حفظ التعديلات'; $('match-cancel-edit').hidden = false;
      $('match-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }));
    host.querySelectorAll('[data-delete-match]').forEach((b) => b.addEventListener('click', async () => {
      const m = data.find((x) => x.id === b.dataset.deleteMatch); if (!m) return;
      if (!window.confirm(`حذف المباراة «${ar(m.home_team)} × ${ar(m.away_team)}» نهائيًا؟\n\nهيتمسح معاها من قاعدة البيانات: التشكيلة والإحصائيات والتفاصيل والمشغّل، ومش هترجع.`)) return;
      let msg = '';
      const r = await client.rpc('delete_match_full', { p_id: m.id });
      if (!r.error) { const c = r.data || {}; msg = `تم حذف المباراة نهائيًا مع كل بياناتها${c.stream || c.manual ? ` (مشغّل ${c.stream || 0}، تشكيلة/تفاصيل ${c.manual || 0})` : ''}.`; }
      else {
        // الدالة غير مثبّتة بعد: نحذف يدويًا نفس الأشياء
        if (m.fixture_id) { await client.from('fixture_streams').delete().eq('fixture_id', m.fixture_id); await client.from('fixture_manual').delete().eq('fixture_id', m.fixture_id); }
        const { error: e } = await client.from('matches').delete().eq('id', m.id);
        msg = e ? `تعذّر حذف المباراة: ${e.message}` : 'تم حذف المباراة وبياناتها.';
      }
      say('match-message', msg); await loadMatches();
    }));
  }

  /* ======================== قوائم مباريات المزوّد (للمشغّلات والتشكيلات) ======================== */
  const fixtureCache = new Map();
  const ar = (n) => (window.YR_NAMES ? window.YR_NAMES.team(n) : n) || n;
  async function loadApiFixtures(kind) {
    const select = $(kind === 'stream' ? 'stream-fixture-id' : 'lineup-fixture-select');
    const dayEl = $(kind === 'stream' ? 'stream-fixture-day' : 'lineup-fixture-day');
    const statusId = kind === 'stream' ? 'stream-fixture-status' : 'lineup-fixture-status';
    const offsets = { yesterday: -1, today: 0, tomorrow: 1 };
    select.innerHTML = '<option value="">جارٍ تحميل المباريات...</option>'; say(statusId, '');
    try {
      const data = await callFn('football-matches', { action: 'fixtures', sport: 'football', date: cairoDate(offsets[dayEl.value] ?? 0) });
      const fixtures = Array.isArray(data?.fixtures) ? data.fixtures : [];
      fixtures.forEach((f) => fixtureCache.set(String(f.fixture_id), f));
      select.innerHTML = '<option value="">اختر مباراة</option>' + fixtures.map((f) => `<option value="${esc(f.fixture_id)}">${esc(`${ar(f.home_team)} × ${ar(f.away_team)} · ${f.league_label || f.league} · #${f.fixture_id}`)}</option>`).join('');
      if (!fixtures.length) say(statusId, 'لا توجد مباريات متاحة لهذا اليوم.');
    } catch (error) {
      console.error('fixtures list:', error);
      select.innerHTML = '<option value="">تعذّر تحميل قائمة المباريات</option>';
      say(statusId, `${error.message} — يمكنك كتابة رقم المباراة يدويًا.`);
    }
  }
  $('match-import-load').addEventListener('click', async () => {
    const sel = $('match-import'); sel.innerHTML = '<option value="">جارٍ التحميل...</option>'; say('match-import-status', '');
    try {
      const data = await callFn('football-matches', { action: 'fixtures', sport: 'football', date: cairoDate({ yesterday: -1, today: 0, tomorrow: 1 }[$('match-import-day').value] ?? 0) });
      const fx = Array.isArray(data?.fixtures) ? data.fixtures : []; fx.forEach((f) => fixtureCache.set(String(f.fixture_id), f));
      sel.innerHTML = '<option value="">— اختر مباراة —</option>' + fx.map((f) => `<option value="${esc(f.fixture_id)}">${esc(`${ar(f.home_team)} × ${ar(f.away_team)} · ${f.league_label || f.league}`)}</option>`).join('');
      if (!fx.length) say('match-import-status', 'لا توجد مباريات لهذا اليوم.');
    } catch (e) { sel.innerHTML = '<option value="">— اختر مباراة —</option>'; say('match-import-status', `${e.message} — أضف المباراة يدويًا بالأسفل.`); }
  });


  /* ---------- ترتيب البطولات (site_settings.league_order) ---------- */
  let lgList = []; let lgAvail = [];
  const lgRender = () => {
    $('lg-list').innerHTML = lgList.map((c, i) => `<li><span class="lg-n">${i + 1}</span><b>${esc(c.l)}</b><span class="lg-btns"><button type="button" data-lg="top" data-i="${i}" title="للأول">⤒</button><button type="button" data-lg="up" data-i="${i}" title="فوق">▲</button><button type="button" data-lg="down" data-i="${i}" title="تحت">▼</button><button type="button" data-lg="del" data-i="${i}" title="حذف">✕</button></span></li>`).join('') || '<li class="note">مفيش ترتيب مخصص — بيظهر الترتيب الافتراضي.</li>';
    $('lg-pick').innerHTML = '<option value="">— أضف بطولة من القائمة —</option>' + lgAvail.filter((a) => !lgList.some((c) => c.l === a.label)).map((a) => `<option value="${esc(a.key)}">${esc(a.label)}</option>`).join('');
  };
  async function loadLeagueOrderAdmin() {
    try { const d = await callFn('football-matches', { action: 'fixtures', sport: 'football', date: cairoDate(0) }); lgAvail = Array.isArray(d?.leagues) ? d.leagues : []; } catch { lgAvail = []; }
    const { data } = await client.from('site_settings').select('value').eq('key', 'league_order').maybeSingle();
    lgList = Array.isArray(data?.value) && data.value.length ? data.value.map((c) => ({ k: c.k, l: c.l })) : lgAvail.slice(0, 12).map((a) => ({ k: a.key, l: a.label }));
    lgRender();
  }
  $('lg-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-lg]'); if (!b) return; const i = Number(b.dataset.i); const a = b.dataset.lg;
    if (a === 'del') lgList.splice(i, 1);
    else if (a === 'top' && i > 0) lgList.unshift(...lgList.splice(i, 1));
    else if (a === 'up' && i > 0) [lgList[i - 1], lgList[i]] = [lgList[i], lgList[i - 1]];
    else if (a === 'down' && i < lgList.length - 1) [lgList[i + 1], lgList[i]] = [lgList[i], lgList[i + 1]];
    lgRender();
  });
  $('lg-add').addEventListener('click', () => { const k = $('lg-pick').value; const a = lgAvail.find((x) => x.key === k); if (a) { lgList.push({ k: a.key, l: a.label }); lgRender(); } });
  $('lg-add-custom').addEventListener('click', () => { const l = $('lg-custom').value.trim(); if (l && !lgList.some((c) => c.l === l)) { lgList.push({ k: '', l }); $('lg-custom').value = ''; lgRender(); } });
  $('lg-save').addEventListener('click', async () => {
    const { error } = await client.from('site_settings').upsert({ key: 'league_order', value: lgList, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    say('lg-msg', error ? `تعذّر الحفظ: ${error.message}` : 'تم حفظ الترتيب ✓ (هيظهر للزوار فورًا).');
  });
  $('lg-reset').addEventListener('click', async () => {
    const { error } = await client.from('site_settings').delete().eq('key', 'league_order');
    say('lg-msg', error ? error.message : 'تم الرجوع للترتيب الافتراضي.'); if (!error) loadLeagueOrderAdmin();
  });
  /* ---------- تعديل مباريات الـ API (fixture_overrides) ---------- */
  const ovFx = new Map(); let ovMap = new Map();
  const ovLabel = (id) => { const f = ovFx.get(String(id)); return f ? `${ar(f.home_team)} × ${ar(f.away_team)}` : `مباراة #${id}`; };
  const ST_AR = { scheduled: 'لم تبدأ', live: 'مباشر', finished: 'انتهت', postponed: 'مؤجلة', cancelled: 'ملغاة' };
  async function ovRefreshList() {
    const { data, error } = await client.from('fixture_overrides').select('*').order('updated_at', { ascending: false }).limit(50);
    if (error) { $('ov-list').innerHTML = ''; say('ov-msg', /fixture_overrides|relation/.test(error.message) ? 'شغّل ملف supabase-overrides.sql في Supabase الأول.' : error.message); return; }
    ovMap = new Map((data || []).map((o) => [String(o.fixture_id), o]));
    $('ov-list').innerHTML = (data || []).length ? '<h4>التعديلات الحالية</h4>' + data.map((o) => `<article class="admin-list-item"><div><strong>${o.featured ? '⭐ ' : ''}${esc(o.title || ovLabel(o.fixture_id))}</strong><small>${esc(ST_AR[o.status] || 'بدون تغيير حالة')}${o.home_score != null ? ` · ${o.home_score}-${o.away_score ?? ''}` : ''}${o.note ? ` · ${esc(o.note)}` : ''}</small></div><div class="row"><button class="btn outline" type="button" data-ov-del="${esc(o.fixture_id)}">حذف</button></div></article>`).join('') : '';
  }
  /* مباريات محفوظة (نسخة احتياطية) ليوم معيّن — بتتضاف للقوائم لما الـ API يخلص أو يرجّع فاضي */
  const dayOf = (k) => (k ? new Date(k).toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' }) : '');
  async function snapForDay(iso) {
    try { const { data } = await client.from('fixture_overrides').select('snapshot').not('snapshot', 'is', null).limit(300); return (data || []).map((o) => o.snapshot).filter((s) => s && s.fixture_id && dayOf(s.kickoff) === iso); } catch { return []; }
  }
  const mergeFx = (api, snap) => { const m = new Map(api.map((f) => [String(f.fixture_id), f])); snap.forEach((s) => { if (!m.has(String(s.fixture_id))) m.set(String(s.fixture_id), s); }); return [...m.values()]; };
  $('ov-load').addEventListener('click', async () => {
    const sel = $('ov-fixture'); sel.innerHTML = '<option value="">جارٍ التحميل...</option>'; say('ov-msg', '');
    try {
      const iso = cairoDate(Number($('ov-day').value) || 0); let api = []; let apiErr = '';
      try { const data = await callFn('football-matches', { action: 'fixtures', sport: 'football', date: iso }); api = Array.isArray(data?.fixtures) ? data.fixtures : []; } catch (e) { apiErr = e.message; }
      const fx = mergeFx(api, await snapForDay(iso)); if (!fx.length && apiErr) throw new Error(apiErr); fx.forEach((f) => { fixtureCache.set(String(f.fixture_id), f); ovFx.set(String(f.fixture_id), f); });
      sel.innerHTML = '<option value="">— اختر مباراة —</option>' + fx.map((f) => `<option value="${esc(f.fixture_id)}">${esc(`${ar(f.home_team)} × ${ar(f.away_team)} · ${f.league_label || f.league}`)}</option>`).join('');
      if (!fx.length) say('ov-msg', 'لا توجد مباريات لهذا اليوم.');
    } catch (e) { sel.innerHTML = '<option value="">— اختر مباراة —</option>'; say('ov-msg', e.message); }
  });
  $('ov-fixture').addEventListener('change', () => {
    const id = $('ov-fixture').value; const f = ovFx.get(id); const o = ovMap.get(id);
    $('ov-status').value = o?.status || ''; $('ov-kickoff').value = localDT(o?.kickoff || ''); $('ov-home').value = o?.home_score ?? ''; $('ov-away').value = o?.away_score ?? ''; $('ov-note').value = o?.note || ''; $('ov-featured').checked = !!o?.featured; $('ov-hide').checked = !!o?.hide_important;
    if (f && !o) { $('ov-home').value = f.home_score ?? ''; $('ov-away').value = f.away_score ?? ''; }
  });
  $('ov-form').addEventListener('submit', async (e) => {
    e.preventDefault(); const id = $('ov-fixture').value; if (!id) { say('ov-msg', 'اختر مباراة الأول.'); return; }
    const k = $('ov-kickoff').value; const n = (v) => (v === '' ? null : Number(v));
    const row = { fixture_id: Number(id), status: $('ov-status').value || null, kickoff: k ? new Date(k).toISOString() : null, home_score: n($('ov-home').value), away_score: n($('ov-away').value), note: $('ov-note').value.trim() || null, featured: $('ov-featured').checked && !$('ov-hide').checked, hide_important: $('ov-hide').checked, title: ovLabel(id), updated_at: new Date().toISOString() };
    let { error } = await client.from('fixture_overrides').upsert(row);
    if (error && /featured|hide_important/.test(error.message)) { const { featured, hide_important, ...plain } = row; ({ error } = await client.from('fixture_overrides').upsert(plain)); if (!error) { say('ov-msg', 'اتحفظ التعديل بس «مهمة / إخفاء» محتاجة تشغّل supabase-admin-v34.sql و supabase-hide-important.sql.'); ovRefreshList(); return; } }
    say('ov-msg', error ? (/fixture_overrides|relation/.test(error.message) ? 'شغّل ملف supabase-overrides.sql في Supabase الأول.' : error.message) : 'تم حفظ التعديل ✓ (هيظهر للزوار فورًا بعد تحديث الصفحة).');
    if (!error) ovRefreshList();
  });
  const ovDelete = async (id) => { const { error } = await client.from('fixture_overrides').delete().eq('fixture_id', Number(id)); say('ov-msg', error ? error.message : 'تم حذف التعديل.'); ovRefreshList(); };
  $('ov-clear').addEventListener('click', () => { const id = $('ov-fixture').value; if (id) ovDelete(id); else say('ov-msg', 'اختر مباراة الأول.'); });
  $('ov-list').addEventListener('click', (e) => { const b = e.target.closest('[data-ov-del]'); if (b) ovDelete(b.dataset.ovDel); });
  ovRefreshList();


  /* ---------- المباريات المهمة حسب التاريخ ---------- */
  const impFx = new Map(); let impSavedMap = new Map(); let impOv = new Map();
  const isTopFx = (f) => {
    const keys = new Set(); tmList.forEach((t) => { if (t.en) keys.add(normQ(t.en)); if (t.ar) keys.add(normQ(t.ar)); });
    return [f.home_team, f.away_team].some((n) => n && (keys.has(normQ(n)) || keys.has(normQ(ar(n)))));
  };
  const impDayLabel = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
  const impCount = () => { const n = $('imp-list').querySelectorAll('input[type=checkbox]:checked').length; $('imp-count').textContent = `${n} محددة`; };
  const impTime = (k) => (k ? new Date(k).toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' }) : '');
  async function loadImportant() {
    if (!$('imp-date').value) $('imp-date').value = cairoDate(0);
    if (!tmList.length) await loadTopTeamsAdmin();
    let { data: all, error: ee } = await client.from('fixture_overrides').select('fixture_id,title,featured,hide_important,snapshot').limit(500);
    if (ee) ({ data: all } = await client.from('fixture_overrides').select('fixture_id,title,featured,snapshot').limit(500));
    impOv = new Map((all || []).map((o) => [Number(o.fixture_id), o]));
    const data = (all || []).filter((o) => o.snapshot);
    impSavedMap = new Map(data.map((o) => [Number(o.fixture_id), o]));
    const rows = (data || []).slice().sort((a, b) => String(a.snapshot?.kickoff || '').localeCompare(String(b.snapshot?.kickoff || '')));
    $('imp-saved').innerHTML = rows.length ? rows.map((o) => { const s = o.snapshot || {}; return `<article class="admin-list-item"><div><strong>${esc(ar(s.home_team))} × ${esc(ar(s.away_team))}</strong><small>${esc(s.league_label || s.league || '')} · ${s.kickoff ? esc(new Date(s.kickoff).toLocaleString('ar-EG', { timeZone: 'Africa/Cairo', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) : ''}</small></div><div class="row"><button type="button" class="btn outline" data-imp-ov="${esc(o.fixture_id)}">🛠️ تعديل</button><button type="button" class="btn outline" data-imp-lu="${esc(o.fixture_id)}">📋 تشكيلة وأحداث</button><button type="button" class="btn outline" data-imp-del="${esc(o.fixture_id)}">إزالة من المهمة</button></div></article>`; }).join('') : '<p class="note">لسه مفيش مباريات محفوظة. حمّل مباريات واحفظ المهم منها.</p>';
  }
  $('imp-saved').addEventListener('click', async (e) => {
    const bo = e.target.closest('[data-imp-ov]'); const bl = e.target.closest('[data-imp-lu]'); const b = e.target.closest('[data-imp-del]');
    if (bo || bl) {
      const id = Number((bo || bl).dataset.impOv || (bo || bl).dataset.impLu); const f = impSavedMap.get(id)?.snapshot; if (!f) return;
      if (bl) { openTab('lineups'); $('lu-src').value = 'api'; await luSrcChange(); luRows.set(String(id), f); const s = $('lu-match'); s.innerHTML = `<option value="${id}">${esc(ar(f.home_team))} × ${esc(ar(f.away_team))}</option>`; s.value = String(id); await luPick(); }
      else { openTab('apimatches'); await ovRefreshList(); ovFx.set(String(id), f); const s = $('ov-fixture'); s.innerHTML = `<option value="${id}">${esc(ar(f.home_team))} × ${esc(ar(f.away_team))}</option>`; s.value = String(id); s.dispatchEvent(new Event('change')); }
      return;
    }
    if (!b) return;
    const id = Number(b.dataset.impDel); const { error } = await client.from('fixture_overrides').update({ snapshot: null, featured: false, hide_important: true }).eq('fixture_id', id);
    if (error) say('imp-msg', /hide_important/.test(error.message) ? 'شغّل ملف supabase-hide-important.sql في Supabase الأول.' : error.message); else { say('imp-msg', 'اتشالت من المباريات المهمة (المباراة نفسها لسه ظاهرة في بطولتها).'); loadImportant(); }
  });
  $('imp-load').addEventListener('click', async () => {
    const btn = $('imp-load'); btn.disabled = true; $('imp-list').innerHTML = ''; $('imp-tools').hidden = true; impFx.clear();
    try {
      if (!tmList.length) await loadTopTeamsAdmin();
      const start = $('imp-date').value || cairoDate(0); const n = Number($('imp-days').value) || 1; let fails = 0; const days = [];
      for (let i = 0; i < n; i++) {
        const d = new Date(`${start}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + i); const iso = d.toISOString().slice(0, 10);
        say('imp-msg', `جارٍ تحميل ${impDayLabel(iso)} (${i + 1} من ${n})…`);
        let api = []; try { const data = await callFn('football-matches', { action: 'fixtures', sport: 'football', date: iso }); api = (data?.fixtures || []).filter((f) => f.fixture_id && !f.manual); } catch { fails++; }
        const fx = mergeFx(api, await snapForDay(iso)); fx.forEach((f) => impFx.set(Number(f.fixture_id), f)); days.push([iso, fx]);
      }
      $('imp-list').innerHTML = days.map(([iso, fx]) => `<h4>${esc(impDayLabel(iso))} <small>(${fx.length})</small></h4>` + (fx.length ? fx.map((f) => {
        const id = Number(f.fixture_id); const hid = impOv.get(id)?.hide_important; const pre = !hid && (isTopFx(f) || impOv.get(id)?.featured);
        return `<label class="imp-row"><input type="checkbox" data-fx="${id}" data-top="${isTopFx(f) ? 1 : 0}"${pre ? ' checked' : ''}><span><b>${esc(ar(f.home_team))} × ${esc(ar(f.away_team))}</b><small>${esc(f.league_label || f.league || '')} · ${esc(impTime(f.kickoff))}${impSavedMap.get(id) ? ' · <i class="pill ok">محفوظة</i>' : ''}${isTopFx(f) ? ' · <i class="pill star">فريق مهم</i>' : ''}${hid ? ' · <i class="pill off">مخفية</i>' : ''}</small></span></label>`;
      }).join('') : '<p class="note">لا توجد مباريات.</p>')).join('');
      const total = impFx.size; $('imp-tools').hidden = !total; impCount();
      say('imp-msg', total ? `تم تحميل ${total} مباراة. علّم المهم واضغط حفظ.${fails ? ` (تعذّر تحميل ${fails} يوم — ممكن الحصة خلصت)` : ''}` : (fails ? 'تعذّر تحميل المباريات (ممكن حصة الـ API خلصت).' : 'لا توجد مباريات في الفترة دي.'));
    } catch (e) { say('imp-msg', e.message); } finally { btn.disabled = false; }
  });
  $('imp-list').addEventListener('change', impCount);
  const impSet = (fn) => { $('imp-list').querySelectorAll('input[type=checkbox]').forEach((c) => { c.checked = fn(c); }); impCount(); };
  $('imp-auto').addEventListener('click', () => impSet((c) => c.dataset.top === '1'));
  $('imp-all').addEventListener('click', () => impSet(() => true));
  $('imp-none').addEventListener('click', () => impSet(() => false));
  $('imp-save').addEventListener('click', async () => {
    const boxes = [...$('imp-list').querySelectorAll('input[type=checkbox]')];
    if (!boxes.length) return; const btn = $('imp-save'); btn.disabled = true;
    try {
      const now = new Date().toISOString(); const rows = []; let on = 0; let off = 0;
      boxes.forEach((c) => {
        const id = Number(c.dataset.fx); const f = impFx.get(id); const o = impOv.get(id); if (!f) return;
        const title = `${ar(f.home_team)} × ${ar(f.away_team)}`;
        if (c.checked) { rows.push({ ...(o || {}), fixture_id: id, featured: true, hide_important: false, title, snapshot: f, updated_at: now }); on++; }
        else if (c.dataset.top === '1' || o?.featured || o?.snapshot) { rows.push({ ...(o || {}), fixture_id: id, featured: false, hide_important: true, title, snapshot: null, updated_at: now }); off++; }
      });
      if (!rows.length) { say('imp-msg', 'مفيش تغييرات للحفظ.'); return; }
      const { error } = await client.from('fixture_overrides').upsert(rows);
      if (error) { say('imp-msg', /snapshot/.test(error.message) ? 'شغّل ملف supabase-snapshot.sql في Supabase الأول.' : /hide_important/.test(error.message) ? 'شغّل ملف supabase-hide-important.sql في Supabase الأول.' : error.message); return; }
      say('imp-msg', `تم ✓ — مهمة: ${on}${off ? ` · مخفية من المهمة: ${off}` : ''}`); await loadImportant(); impCount();
    } catch (e) { say('imp-msg', e.message); } finally { btn.disabled = false; }
  });

  /* ---------- التشكيلات والأحداث (مباراة يدوية أو من الـ API) ---------- */
  let luRows = new Map(); let luCur = null; // { kind:'manual'|'api', id, row }
  async function luSrcChange() {
    const api = $('lu-src').value === 'api'; $('lu-day-wrap').hidden = !api; $('lu-load').hidden = !api; $('lu-editor').hidden = true; luCur = null; luRows.clear();
    const sel = $('lu-match'); sel.innerHTML = '<option value="">— اختر مباراة —</option>';
    if (api) { say('lu-msg', 'اختار اليوم واضغط «تحميل المباريات».'); return; }
    say('lu-msg', '');
    const { data, error } = await client.from('matches').select('id,home_team,away_team,league,details,kickoff').order('created_at', { ascending: false }).limit(60);
    if (error) { say('lu-msg', error.message); return; }
    (data || []).forEach((m) => luRows.set(m.id, m));
    sel.innerHTML += (data || []).map((m) => `<option value="${esc(m.id)}">${esc(ar(m.home_team))} × ${esc(ar(m.away_team))}${m.league ? ` · ${esc(m.league)}` : ''}</option>`).join('');
    if (!(data || []).length) say('lu-msg', 'مفيش مباريات يدوية. أضف مباراة من قسم «مباريات يدوية» الأول.');
  }
  $('lu-src').addEventListener('change', luSrcChange);
  $('lu-load').addEventListener('click', async () => {
    const sel = $('lu-match'); sel.innerHTML = '<option value="">جارٍ التحميل…</option>'; luRows.clear();
    try {
      const iso = cairoDate(Number($('lu-day').value) || 0); let api = []; let apiErr = '';
      try { const data = await callFn('football-matches', { action: 'fixtures', sport: 'football', date: iso }); api = data?.fixtures || []; } catch (e) { apiErr = e.message; }
      const fx = mergeFx(api, await snapForDay(iso)).filter((f) => f.fixture_id && !f.manual); if (!fx.length && apiErr) throw new Error(apiErr); fx.forEach((f) => luRows.set(String(f.fixture_id), f));
      sel.innerHTML = '<option value="">— اختر مباراة —</option>' + fx.map((f) => `<option value="${esc(f.fixture_id)}">${esc(`${ar(f.home_team)} × ${ar(f.away_team)} · ${f.league_label || f.league}`)}</option>`).join('');
      say('lu-msg', fx.length ? '' : 'لا توجد مباريات لهذا اليوم.');
    } catch (e) { sel.innerHTML = '<option value="">— اختر مباراة —</option>'; say('lu-msg', e.message); }
  });
  async function luPick() {
    const id = $('lu-match').value; const row = luRows.get(id);
    if (!id || !row) { $('lu-editor').hidden = true; luCur = null; return; }
    const kind = $('lu-src').value; luCur = { kind, id, row };
    $('lu-home').textContent = ar(row.home_team); $('lu-away').textContent = ar(row.away_team);
    const hs = document.querySelectorAll('#mlu-box .mlu-side h5'); hs[0].textContent = ar(row.home_team); hs[1].textContent = ar(row.away_team);
    const to = $('mev-team').options; to[0].textContent = ar(row.home_team); to[1].textContent = ar(row.away_team);
    if (kind === 'manual') { const d = row.details || {}; fillManual(d, d.away_id ?? -2); }
    else {
      const { data } = await client.from('fixture_manual').select('lineups').eq('fixture_id', Number(id)).maybeSingle();
      const l = data?.lineups || {}; fillManual({ manual_lineups: l.home && l.away ? { home: l.home, away: l.away } : {}, events: l.events || [] });
    }
    $('lu-editor').hidden = false; say('lu-msg', '');
  }
  $('lu-match').addEventListener('change', luPick);
  $('lu-clear').addEventListener('click', () => { if (window.confirm('مسح التشكيلة والأحداث من الشاشة؟ (مش هيتحفظ غير لما تضغط حفظ)')) fillManual({}); });
  $('lu-save').addEventListener('click', async () => {
    if (!luCur) return; const btn = $('lu-save'); btn.disabled = true;
    try {
      const d = luCur.kind === 'manual' ? { ...(luCur.row.details || {}) } : {};
      const hid = d.home_id ?? -1; const aid = d.away_id ?? -2; const m = manualDetails(hid, aid);
      if (m.partial) { say('lu-msg', 'اكتب تشكيلة الفريقين معًا (أو سيب الاتنين فاضيين).'); return; }
      if (luCur.kind === 'manual') {
        delete d.manual_lineups; if (m.home && m.away) d.manual_lineups = { home: m.home, away: m.away };
        d.events = m.events; if (m.events.length || (m.home && m.away)) { d.home_id = hid; d.away_id = aid; }
        const { error } = await client.from('matches').update({ details: d }).eq('id', luCur.id);
        if (error) { say('lu-msg', error.message); return; }
        luCur.row.details = d;
      } else {
        const fid = Number(luCur.id);
        if (!m.home && !m.away && !m.events.length) { await client.from('fixture_manual').delete().eq('fixture_id', fid); say('lu-msg', 'تم مسح التعديلات اليدوية لهذه المباراة.'); return; }
        const lineups = { ...(m.home && m.away ? { home: m.home, away: m.away } : {}), events: m.events.map(({ minute, extra, type, detail, side, player, assist }) => ({ minute, extra, type, detail, side, player, assist })) };
        const { error } = await client.from('fixture_manual').upsert({ fixture_id: fid, title: `${ar(luCur.row.home_team)} × ${ar(luCur.row.away_team)}`, lineups, updated_at: new Date().toISOString() });
        if (error) { say('lu-msg', error.message); return; }
      }
      say('lu-msg', 'تم الحفظ ✓ — بيظهر في صفحة المباراة.');
    } catch (e) { say('lu-msg', e.message); } finally { btn.disabled = false; }
  });

  /* ---------- الفرق: الأكثر متابعة + تعديل الأسماء ---------- */
  const DEFAULT_TOP = [['Al Ahly', 'الأهلي'], ['Zamalek', 'الزمالك'], ['Pyramids', 'بيراميدز'], ['Ismaily', 'الإسماعيلي'], ['Al Ittihad Alexandria', 'الاتحاد السكندري'], ['Al Masry', 'المصري'],
    ['Real Madrid', 'ريال مدريد'], ['Barcelona', 'برشلونة'], ['Liverpool', 'ليفربول'], ['Manchester City', 'مانشستر سيتي'], ['Manchester United', 'مانشستر يونايتد'], ['Chelsea', 'تشيلسي'], ['Arsenal', 'أرسنال'],
    ['Bayern Munich', 'بايرن ميونخ'], ['Juventus', 'يوفنتوس'], ['Paris Saint Germain', 'باريس سان جيرمان'], ['Al-Hilal', 'الهلال'], ['Al-Nassr', 'النصر'], ['Al-Ittihad', 'الاتحاد'], ['Inter Miami', 'إنتر ميامي'], ['Trabzonspor', 'طرابزون سبور']].map(([en, ar]) => ({ en, ar }));
  let tmList = []; let tmSeen = new Map(); // en -> ar
  const tmRender = () => {
    $('tm-list').innerHTML = tmList.map((t, i) => `<li><span class="lg-n">${i + 1}</span><b>${esc(t.ar || t.en)}${t.en && t.ar ? ` <small class="note">${esc(t.en)}</small>` : ''}</b><span class="lg-btns"><button type="button" data-tm="top" data-i="${i}" title="للأول">⤒</button><button type="button" data-tm="up" data-i="${i}" title="لفوق">▲</button><button type="button" data-tm="down" data-i="${i}" title="لتحت">▼</button><button type="button" data-tm="del" data-i="${i}" title="حذف">✕</button></span></li>`).join('');
    const taken = new Set(tmList.map((t) => String(t.en).toLowerCase()));
    $('tm-pick').innerHTML = '<option value="">— اختر فريق من مباريات اليوم —</option>' + [...tmSeen].filter(([en]) => !taken.has(en.toLowerCase())).sort((a, b) => a[1].localeCompare(b[1])).map(([en, a]) => `<option value="${esc(en)}">${esc(a)} — ${esc(en)}</option>`).join('');
  };
  async function loadTopTeamsAdmin() {
    try { const d = await callFn('football-matches', { action: 'fixtures', sport: 'football', date: cairoDate(0) }); (d?.fixtures || []).forEach((f) => { [f.home_team, f.away_team].forEach((n) => n && tmSeen.set(n, ar(n))); }); } catch { /* اختياري */ }
    const { data } = await client.from('site_settings').select('value').eq('key', 'top_teams').maybeSingle();
    tmList = Array.isArray(data?.value) && data.value.length ? data.value.map((t) => ({ en: t.en || '', ar: t.ar || '' })) : DEFAULT_TOP.map((t) => ({ ...t }));
    tmRender();
  }
  $('tm-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tm]'); if (!b) return; const i = Number(b.dataset.i); const a = b.dataset.tm;
    if (a === 'del') tmList.splice(i, 1); else if (a === 'top' && i > 0) tmList.unshift(...tmList.splice(i, 1));
    else if (a === 'up' && i > 0) [tmList[i - 1], tmList[i]] = [tmList[i], tmList[i - 1]];
    else if (a === 'down' && i < tmList.length - 1) [tmList[i + 1], tmList[i]] = [tmList[i], tmList[i + 1]];
    tmRender();
  });
  $('tm-add').addEventListener('click', () => { const en = $('tm-pick').value; if (en) { tmList.push({ en, ar: ar(en) }); tmRender(); } });
  $('tm-add-custom').addEventListener('click', () => {
    const v = $('tm-custom').value.trim(); if (!v) return;
    tmList.push(/[a-z]/i.test(v) ? { en: v, ar: ar(v) } : { en: '', ar: v }); $('tm-custom').value = ''; tmRender();
  });
  $('tm-save').addEventListener('click', async () => {
    const { error } = await client.from('site_settings').upsert({ key: 'top_teams', value: tmList, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    say('tm-msg', error ? `تعذّر الحفظ: ${error.message}` : 'تم حفظ الفرق ✓');
  });
  $('tm-reset').addEventListener('click', async () => {
    const { error } = await client.from('site_settings').delete().eq('key', 'top_teams');
    tmList = DEFAULT_TOP.map((t) => ({ ...t })); tmRender(); say('tm-msg', error ? error.message : 'رجعنا للقائمة الأساسية ✓');
  });
  // تعديل الأسماء (جدول name_translations)
  let nmSaved = new Map();
  /* فرق ظهرت للزوار بالإنجليزي لأنها مش في القاموس: اكتب الاسم العربي واحفظ (أو تجاهل) */
  async function loadUnknownNames() {
    const box = $('nm-unknown'); if (!box) return;
    const { data, error } = await client.from('name_unknown').select('en,hits').eq('kind', 'team').order('hits', { ascending: false }).limit(60);
    if (error) { box.innerHTML = /name_unknown|relation|function/.test(error.message) ? '<p class="note">لتفعيل «فرق محتاجة ترجمة» شغّل ملف supabase-names-unknown.sql في Supabase.</p>' : ''; return; }
    const rows = (data || []).filter((r) => !(window.YR_NAMES && window.YR_NAMES.known(r.en)));
    box.innerHTML = rows.length ? `<div class="ptr-wrap"><h3>🔤 فرق محتاجة ترجمة (${nAr(rows.length)})</h3><p class="note">دي فرق ظهرت للزوار بالإنجليزي. اكتب اسمها بالعربي واضغط حفظ.</p>${rows.map((r) => `<article class="admin-list-item" data-unk="${esc(r.en)}"><div><strong dir="ltr">${esc(r.en)}</strong><small>ظهر ${nAr(r.hits)} مرة</small></div><div class="row"><input class="unk-in" maxlength="60" placeholder="الاسم بالعربي" aria-label="الاسم بالعربي"><button type="button" class="btn primary" data-unk-save="${esc(r.en)}">حفظ</button><button type="button" class="btn outline" data-unk-skip="${esc(r.en)}">تجاهل</button></div></article>`).join('')}</div>` : '';
  }
  $('nm-unknown')?.addEventListener('click', async (e) => {
    const sv = e.target.closest('[data-unk-save]'); const sk = e.target.closest('[data-unk-skip]'); if (!sv && !sk) return;
    const row = e.target.closest('[data-unk]'); const en = row.dataset.unk;
    if (sv) {
      const val = row.querySelector('.unk-in').value.trim(); if (!val) { say('nm-msg', 'اكتب الاسم بالعربي.'); return; }
      const { error } = await client.from('name_translations').upsert({ kind: 'team', en, ar: val }, { onConflict: 'kind,en' });
      if (error) { say('nm-msg', `تعذّر الحفظ: ${error.message}`); return; }
      say('nm-msg', `تم حفظ «${val}» ✓ (هيظهر للزوار بعد تحديث الصفحة)`);
    }
    await client.from('name_unknown').delete().eq('kind', 'team').eq('en', en);
    loadUnknownNames(); loadSavedNames();
  });
  /* ======================== الإعلانات ======================== */
  let adCache = [];
  const adReset = () => { $('ad-form').reset(); $('ad-id').value = ''; $('ad-cta').value = 'اعرف أكتر'; $('ad-delay').value = 6; $('ad-freq').value = 12; $('ad-active').checked = true; $('ad-save').textContent = 'حفظ الإعلان'; };
  const adDt = (v) => (v ? new Date(v).toISOString() : null);
  const adLocal = (iso) => { if (!iso) return ''; const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
  async function loadAds() {
    const { data, error } = await client.from('site_ads').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) { $('ad-list').innerHTML = ''; say('ad-msg', /site_ads|relation/.test(error.message) ? 'شغّل ملف supabase-ads.sql في Supabase الأول.' : error.message); return; }
    adCache = data || [];
    const T = { image: '🖼️ صورة', video: '🎬 فيديو', youtube: '▶️ يوتيوب' };
    $('ad-list').innerHTML = adCache.length ? adCache.map((a) => `<article class="admin-list-item"><div><strong>${esc(a.title)} · ${esc(T[a.media_type] || a.media_type)} ${a.active ? '' : '(متوقف)'}</strong><small>👁️ ${Number(a.impressions).toLocaleString('ar-EG')} مشاهدة · 👆 ${Number(a.clicks).toLocaleString('ar-EG')} نقرة${a.impressions ? ' (' + (a.clicks / a.impressions * 100).toFixed(1) + '%)' : ''} · ${esc(a.pages)}</small></div><div class="row"><button class="btn outline" type="button" data-ad-edit="${esc(a.id)}">تعديل</button><button class="btn outline" type="button" data-ad-tg="${esc(a.id)}">${a.active ? 'إيقاف' : 'تشغيل'}</button><button class="btn outline" type="button" data-ad-del="${esc(a.id)}">حذف</button></div></article>`).join('') : '<p class="note">مفيش إعلانات لسه.</p>';
  }
  $('ad-reset')?.addEventListener('click', adReset);
  $('ad-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = (v) => { const x = v.trim(); if (!x) return null; return /^https:\/\//i.test(x) ? x : false; };
    const media = url($('ad-media').value); const poster = url($('ad-poster').value); const link = url($('ad-link').value);
    if (!media || poster === false || link === false) { say('ad-msg', 'الروابط لازم تبدأ بـ https://'); return; }
    if ($('ad-type').value === 'youtube' && !/(youtu\.be\/|youtube\.com\/)/.test(media)) { say('ad-msg', 'رابط يوتيوب غير صحيح.'); return; }
    const row = { title: $('ad-title').value.trim(), media_type: $('ad-type').value, pages: $('ad-pages').value, media_url: media, poster_url: poster, link_url: link, cta_text: $('ad-cta').value.trim() || 'اعرف أكتر', delay_seconds: Number($('ad-delay').value) || 0, frequency_hours: Number($('ad-freq').value) || 0, starts_at: adDt($('ad-from').value), ends_at: adDt($('ad-to').value), active: $('ad-active').checked };
    const id = $('ad-id').value; say('ad-msg', 'جارٍ الحفظ…');
    const { error } = id ? await client.from('site_ads').update(row).eq('id', id) : await client.from('site_ads').insert(row);
    say('ad-msg', error ? `تعذّر الحفظ: ${error.message}` : 'تم الحفظ ✓ والإعلان شغّال للزوار.'); if (!error) { adReset(); loadAds(); }
  });
  $('ad-list')?.addEventListener('click', async (e) => {
    const ed = e.target.closest('[data-ad-edit]'); const del = e.target.closest('[data-ad-del]'); const tg = e.target.closest('[data-ad-tg]');
    if (ed) {
      const a = adCache.find((x) => x.id === ed.dataset.adEdit); if (!a) return;
      $('ad-id').value = a.id; $('ad-title').value = a.title; $('ad-type').value = a.media_type; $('ad-pages').value = a.pages; $('ad-media').value = a.media_url; $('ad-poster').value = a.poster_url || ''; $('ad-link').value = a.link_url || ''; $('ad-cta').value = a.cta_text || ''; $('ad-delay').value = a.delay_seconds; $('ad-freq').value = a.frequency_hours; $('ad-from').value = adLocal(a.starts_at); $('ad-to').value = adLocal(a.ends_at); $('ad-active').checked = a.active; $('ad-save').textContent = 'تحديث الإعلان';
      $('ad-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (tg) {
      const a = adCache.find((x) => x.id === tg.dataset.adTg); if (!a) return;
      const { error } = await client.from('site_ads').update({ active: !a.active }).eq('id', a.id); say('ad-msg', error ? error.message : (a.active ? 'تم إيقاف الإعلان.' : 'تم تشغيل الإعلان.')); loadAds();
    } else if (del) {
      if (!window.confirm('حذف الإعلان ده نهائيًا؟')) return;
      const { error } = await client.from('site_ads').delete().eq('id', del.dataset.adDel); say('ad-msg', error ? error.message : 'تم الحذف.'); loadAds();
    }
  });
  /* ======================== الانتقالات ======================== */
  const TR_ST = { official: '✅ رسمي', advanced: '🔥 مفاوضات متقدمة', rumor: '💬 إشاعة', loan: '🔁 إعارة', free: '🆓 حر', extended: '🖊️ تجديد' };
  let trCache = [];
  const TR_X = [['position', 'tr-pos'], ['nationality', 'tr-nat'], ['age', 'tr-age', 1], ['shirt_number', 'tr-num', 1], ['height_cm', 'tr-h', 1], ['weight_kg', 'tr-w', 1], ['foot', 'tr-foot'], ['market_value', 'tr-mv'], ['contract_until', 'tr-cu'], ['bio', 'tr-bio']];
  const TR_U = [['from_logo', 'tr-flogo'], ['to_logo', 'tr-tlogo'], ['player_img_big', 'tr-big'], ['flag_url', 'tr-flag']];
  const trReset = () => { $('tr-form').reset(); $('tr-id').value = ''; $('tr-date').value = new Date().toISOString().slice(0, 10); $('tr-pub').checked = true; $('tr-save').textContent = 'حفظ الانتقال'; };
  async function loadTransfers() {
    if (!$('tr-date').value) $('tr-date').value = new Date().toISOString().slice(0, 10);
    const { data, error } = await client.from('transfers').select('*').order('happened_at', { ascending: false }).order('created_at', { ascending: false }).limit(100);
    if (error) { $('tr-list').innerHTML = ''; say('tr-msg', /transfers|relation/.test(error.message) ? 'شغّل ملف supabase-transfers.sql في Supabase الأول.' : error.message); return; }
    trCache = data || [];
    $('tr-list').innerHTML = trCache.length ? trCache.map((t) => `<article class="admin-list-item"><div><strong>${esc(t.player_name)} · ${esc(TR_ST[t.status] || t.status)}</strong><small>${esc(t.from_team || '—')} ← ${esc(t.to_team || '—')}${t.fee ? ' · ' + esc(t.fee) : ''} · ${esc(t.happened_at)}${t.published ? '' : ' · (مخفي)'}</small></div><div class="row"><button type="button" class="btn outline" data-tr-edit="${esc(t.id)}">تعديل</button><button type="button" class="btn outline" data-tr-push="${esc(t.id)}">🔔 إشعار</button><button type="button" class="btn outline danger" data-tr-del="${esc(t.id)}">حذف</button></div></article>`).join('') : '<p class="note">لسه مفيش انتقالات.</p>';
  }
  $('tr-reset')?.addEventListener('click', trReset);
  $('tr-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = (v) => { const x = v.trim(); if (!x) return null; return /^https:\/\//i.test(x) ? x : false; };
    const src = url($('tr-src').value); const ph = url($('tr-photo').value);
    const ex = { from_logo: url($('tr-flogo').value), to_logo: url($('tr-tlogo').value), player_img_big: url($('tr-big').value), flag_url: url($('tr-flag').value) };
    if (src === false || ph === false || Object.values(ex).includes(false)) { say('tr-msg', 'الروابط لازم تبدأ بـ https://'); return; }
    const row = { player_name: $('tr-player').value.trim(), status: $('tr-status').value, from_team: $('tr-from').value.trim() || null, to_team: $('tr-to').value.trim() || null, fee: $('tr-fee').value.trim() || null, note: $('tr-note').value.trim() || null, source_url: src, player_photo: ph, ...ex, ...TR_X.reduce((o, [k, id, num]) => { const v = $(id).value.trim(); o[k] = v ? (num ? Number(v) : v) : null; return o; }, {}), league: $('tr-league').value || null, featured: $('tr-feat').checked, published: $('tr-pub').checked, happened_at: $('tr-date').value || new Date().toISOString().slice(0, 10) };
    const id = $('tr-id').value; say('tr-msg', 'جارٍ الحفظ…');
    const { error } = id ? await client.from('transfers').update(row).eq('id', id) : await client.from('transfers').insert(row);
    say('tr-msg', error ? `تعذّر الحفظ: ${error.message}` : 'تم الحفظ ✓ وظهر في صفحة الانتقالات.'); if (!error) { trReset(); loadTransfers(); }
  });
  $('tr-list')?.addEventListener('click', async (e) => {
    const ed = e.target.closest('[data-tr-edit]'); const del = e.target.closest('[data-tr-del]'); const pu = e.target.closest('[data-tr-push]');
    if (ed) {
      const t = trCache.find((x) => x.id === ed.dataset.trEdit); if (!t) return;
      $('tr-league').value = t.league || ''; $('tr-feat').checked = !!t.featured; $('tr-id').value = t.id; $('tr-player').value = t.player_name; $('tr-status').value = t.status; $('tr-from').value = t.from_team || ''; $('tr-to').value = t.to_team || ''; $('tr-fee').value = t.fee || ''; $('tr-date').value = t.happened_at; $('tr-note').value = t.note || ''; $('tr-src').value = t.source_url || ''; $('tr-photo').value = t.player_photo || ''; $('tr-pub').checked = !!t.published; TR_X.concat(TR_U).forEach(([k, id]) => { $(id).value = t[k] ?? ''; }); $('tr-save').textContent = 'حفظ التعديل';
      $('tr-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (del) {
      if (!window.confirm('حذف الانتقال ده نهائيًا؟')) return;
      const { error } = await client.from('transfers').delete().eq('id', del.dataset.trDel); say('tr-msg', error ? error.message : 'تم الحذف.'); loadTransfers();
    } else if (pu) {
      const t = trCache.find((x) => x.id === pu.dataset.trPush); if (!t) return;
      openTab('push'); await loadPush();
      $('push-title').value = `${(TR_ST[t.status] || '').replace(/^\S+\s/, '')}: ${t.player_name}`.slice(0, 60);
      $('push-body').value = (t.status === 'extended' ? `${t.player_name} يجدّد عقده مع ${t.to_team || t.from_team || ''}` : `${t.player_name}: ${t.from_team || '—'} ← ${t.to_team || '—'}${t.fee ? ' (' + t.fee + ')' : ''}`).slice(0, 180);
      $('push-url').value = 'transfers.html';
    }
  });

  async function loadSavedNames() {
    const { data, error } = await client.from('name_translations').select('id,en,ar').eq('kind', 'team').order('en').limit(1000);
    if (error) { $('nm-saved').innerHTML = ''; say('nm-msg', 'جدول الأسماء غير موجود — شغّل supabase-admin-upgrade.sql.'); return; }
    nmSaved = new Map((data || []).map((r) => [r.en.toLowerCase(), r]));
    $('nm-saved').innerHTML = (data || []).length ? data.map((r) => `<article class="admin-list-item"><div><strong>${esc(r.ar)}</strong><small dir="ltr">${esc(r.en)}</small></div><div class="row"><button type="button" class="btn outline" data-nm-del="${esc(r.id)}">حذف</button></div></article>`).join('') : '<p class="note">لسه ما عدّلتش أي اسم.</p>';
  }
  const nmRows = (teams) => teams.map((en) => `<article class="admin-list-item" data-nm-row="${esc(en)}"><div><strong dir="ltr">${esc(en)}</strong></div><div class="row"><input class="nm-in" value="${esc(window.YR_NAMES && window.YR_NAMES.known(en) ? ar(en) : '')}" maxlength="60" aria-label="الاسم بالعربي"><button type="button" class="btn primary" data-nm-save="${esc(en)}">حفظ</button></div></article>`).join('');
  $('nm-load').addEventListener('click', async () => {
    $('nm-list').innerHTML = '<p class="note">جارٍ التحميل…</p>';
    try {
      const d = await callFn('football-matches', { action: 'fixtures', sport: 'football', date: cairoDate(Number($('nm-day').value) || 0) });
      const set = new Set(); (d?.fixtures || []).forEach((f) => { [f.home_team, f.away_team].forEach((n) => n && set.add(n)); });
      (d?.fixtures || []).forEach((f) => { [f.home_team, f.away_team].forEach((n) => n && tmSeen.set(n, ar(n))); });
      $('nm-list').innerHTML = set.size ? nmRows([...set].sort()) : '<p class="note">لا توجد مباريات لهذا اليوم.</p>';
    } catch (e) { $('nm-list').innerHTML = ''; say('nm-msg', e.message); }
  });
  $('nm-list').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-nm-save]'); if (!b) return; const row = b.closest('[data-nm-row]'); const en = b.dataset.nmSave; const val = row.querySelector('.nm-in').value.trim();
    if (!val) { say('nm-msg', 'اكتب الاسم بالعربي.'); return; }
    const { error } = await client.from('name_translations').upsert({ kind: 'team', en, ar: val }, { onConflict: 'kind,en' });
    say('nm-msg', error ? `تعذّر الحفظ: ${error.message}` : `تم حفظ «${val}» ✓ (هيظهر للزوار بعد تحديث الصفحة)`); if (!error) loadSavedNames();
  });
  $('nm-saved').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-nm-del]'); if (!b) return;
    const { error } = await client.from('name_translations').delete().eq('id', b.dataset.nmDel); say('nm-msg', error ? error.message : 'تم الحذف.'); loadSavedNames();
  });

  /* ---------- تشكيلة وملخص المباراة يدويًا ---------- */
  let mEv = [];
  const EV_LABEL = { 'goal|Normal Goal': '⚽ هدف', 'goal|Penalty': '⚽ ركلة جزاء', 'goal|Own Goal': '⚽ هدف عكسي', 'card|Yellow Card': '🟨 إنذار', 'card|Red Card': '🟥 طرد', 'subst|Substitution': '🔄 تبديل' };
  const evRender = () => {
    $('mev-list').innerHTML = mEv.length ? mEv.map((e, i) => `<div class="mev-row"><b>${esc(e.minute)}'</b><span>${esc(EV_LABEL[`${e.type}|${e.detail}`] || e.type)} — <strong>${esc(e.player)}</strong>${e.assist ? ` <small>${e.type === 'subst' ? 'بدل' : 'صناعة'}: ${esc(e.assist)}</small>` : ''} <small>(${e.side === 'home' ? esc($('lu-home').textContent || 'الأول') : esc($('lu-away').textContent || 'الثاني')})</small></span><button type="button" class="btn outline" data-mev-del="${i}">حذف</button></div>`).join('') : '<p class="note">لا توجد أحداث بعد.</p>';
  };
  $('mev-btn').addEventListener('click', () => {
    const min = $('mev-min').value.trim(); const player = $('mev-player').value.trim();
    if (min === '' || !player) { say('match-message', 'اكتب الدقيقة واسم اللاعب.'); return; }
    const [type, detail] = $('mev-type').value.split('|');
    mEv.push({ minute: Number(min), type, detail, side: $('mev-team').value, player, assist: $('mev-other').value.trim() });
    mEv.sort((a, b) => a.minute - b.minute); $('mev-player').value = ''; $('mev-other').value = ''; $('mev-min').value = ''; evRender(); $('mev-min').focus();
  });
  $('mev-list').addEventListener('click', (e) => { const b = e.target.closest('[data-mev-del]'); if (b) { mEv.splice(Number(b.dataset.mevDel), 1); evRender(); } });
  const parsePlayer = (line) => {
    const t = line.trim().replace(/^[-•.]\s*/, ''); if (!t) return null; let m;
    if ((m = t.match(/^(\d{1,2})\s*[-.):]?\s*(.+)$/))) return { number: m[1], name: m[2].trim() };
    if ((m = t.match(/^(.+?)\s+[-(]?(\d{1,2})\)?$/))) return { number: m[2], name: m[1].trim() };
    return { number: '', name: t };
  };
  const parseLines = (id) => $(id).value.split('\n').map(parsePlayer).filter(Boolean);
  /* المراكز لكل طريقة لعب: من الشمال لليمين كما يراها المشاهد (الحارس أولًا ثم الدفاع فالوسط فالهجوم) */
  const BK = { 4: ['ظهير أيسر', 'قلب دفاع (يسار)', 'قلب دفاع (يمين)', 'ظهير أيمن'], 3: ['قلب دفاع أيسر', 'قلب دفاع', 'قلب دفاع أيمن'], 5: ['ظهير جناح أيسر', 'قلب دفاع أيسر', 'قلب دفاع', 'قلب دفاع أيمن', 'ظهير جناح أيمن'] };
  const MD = { 1: ['وسط دفاعي'], 2: ['وسط (يسار)', 'وسط (يمين)'], 3: ['وسط أيسر', 'وسط', 'وسط أيمن'], 4: ['جناح أيسر', 'وسط (يسار)', 'وسط (يمين)', 'جناح أيمن'], 5: ['جناح أيسر', 'وسط (يسار)', 'وسط', 'وسط (يمين)', 'جناح أيمن'] };
  const AM = { 1: ['صانع ألعاب'], 2: ['وسط هجومي (يسار)', 'وسط هجومي (يمين)'], 3: ['جناح أيسر', 'صانع ألعاب', 'جناح أيمن'] };
  const FW = { 1: ['رأس حربة'], 2: ['مهاجم (يسار)', 'مهاجم (يمين)'], 3: ['جناح أيسر', 'رأس حربة', 'جناح أيمن'] };
  const FORMS = ['4-3-3', '4-4-2', '4-2-3-1', '4-1-4-1', '4-5-1', '4-3-2-1', '3-5-2', '3-4-3', '3-4-1-2', '5-3-2', '5-4-1'];
  const slotLabels = (f) => {
    const n = f.split('-').map(Number); const rows = [['حارس مرمى']]; rows.push(BK[n[0]]);
    const mids = n.slice(1, -1);
    mids.forEach((c, i) => rows.push((mids.length > 1 && i === mids.length - 1 && AM[c] ? AM : MD)[c]));
    rows.push(FW[n[n.length - 1]]); return rows;
  };
  const slotRender = (p, f, keep) => {
    const rows = slotLabels(f); const box = $(`mlu-${p}-slots`);
    box.innerHTML = rows.map((r, ri) => `<div class="slot-row">${r.map((l, ci) => { const old = keep?.get(`${ri + 1}:${ci + 1}`) || {}; return `<label class="slot"><span>${l}</span><div><input class="sn" data-g="${ri + 1}:${ci + 1}" inputmode="numeric" maxlength="2" placeholder="#" value="${esc(old.number || '')}" aria-label="رقم ${l}"><input class="sp" maxlength="40" placeholder="اسم اللاعب" value="${esc(old.name || '')}" aria-label="${l}"></div></label>`; }).join('')}</div>`).join('');
  };
  const slotRead = (p) => [...$(`mlu-${p}-slots`).querySelectorAll('.slot')].map((s) => ({ number: s.querySelector('.sn').value.trim(), name: s.querySelector('.sp').value.trim(), grid: s.querySelector('.sn').dataset.g })).filter((x) => x.name);
  ['home', 'away'].forEach((p) => {
    $(`mlu-${p}-form`).innerHTML = FORMS.map((f) => `<option value="${f}">${f}</option>`).join('');
    $(`mlu-${p}-form`).addEventListener('change', () => { const keep = new Map(slotRead(p).map((x) => [x.grid, x])); slotRender(p, $(`mlu-${p}-form`).value, keep); });
    slotRender(p, '4-3-3');
  });
  const buildSide = (p) => {
    const start = slotRead(p); const subs = parseLines(`mlu-${p}-subs`);
    if (!start.length && !subs.length) return null;
    return { formation: $(`mlu-${p}-form`).value, coach: $(`mlu-${p}-coach`).value.trim(), start, subs };
  };
  const manualDetails = (hid, aid) => {
    const home = buildSide('home'); const away = buildSide('away');
    return { home, away, partial: Boolean((home || away) && !(home && away)),
      events: mEv.map((e) => ({ minute: e.minute, extra: null, type: e.type, detail: e.detail, side: e.side, team_id: e.side === 'home' ? hid : aid, player: e.player, assist: e.assist || null })) };
  };
  const fillManual = (d, away_id) => {
    mEv = [];
    const ml = d.manual_lineups || {};
    ['home', 'away'].forEach((p) => {
      const s = ml[p] || {}; const line = (x) => `${x.number ? `${x.number} ` : ''}${x.name}`;
      const f = FORMS.includes(s.formation) ? s.formation : '4-3-3'; $(`mlu-${p}-form`).value = f; $(`mlu-${p}-coach`).value = s.coach || '';
      const withGrid = (s.start || []).every((x) => /^\d+:\d+$/.test(String(x.grid || '')));
      const keep = new Map((s.start || []).map((x, i) => [withGrid ? x.grid : (i === 0 ? '1:1' : null), x]).filter(([g]) => g));
      slotRender(p, f, keep); $(`mlu-${p}-subs`).value = (s.subs || []).map(line).join('\n');
    });
    mEv = (d.events || []).filter((e) => ['goal', 'card', 'subst'].includes(e.type)).map((e) => ({ minute: e.minute ?? 0, type: e.type, detail: e.detail || (e.type === 'card' ? 'Yellow Card' : e.type === 'subst' ? 'Substitution' : 'Normal Goal'), side: e.side || (e.team_id === away_id ? 'away' : 'home'), player: e.player || '', assist: e.assist || '' }));
    evRender();
  };
  evRender();

  /* ---------- نسخة كاملة من المباراة (تشكيلة + أحداث + إحصائيات) تتحفظ مع المباراة ---------- */
  let snap = null; // { fixture_id, home_id, away_id, events, lineups, stats, info, manual, saved_at }
  const snapSummary = (s) => !s ? 'لا يوجد. اختر مباراة من القائمة أعلاه لحفظ التشكيلة والأحداث والإحصائيات مع المباراة.'
    : `تشكيلة ${(s.lineups || []).length ? '✓' : '✗'} · أحداث ${(s.events || []).length ? `✓ (${s.events.length})` : '✗'} · إحصائيات ${Object.keys(s.stats || {}).length ? '✓' : '✗'} · معلومات ${s.info && Object.keys(s.info).length ? '✓' : '✗'}${s.saved_at ? ` · آخر تحديث ${new Date(s.saved_at).toLocaleString('ar-EG', { timeZone: 'Africa/Cairo', dateStyle: 'short', timeStyle: 'short' })}` : ''}`;
  const paintSnap = () => { $('match-snap-status').textContent = snapSummary(snap); $('match-snap-refresh').hidden = !snap?.fixture_id; };
  async function pullSnapshot(fid) {
    const res = await callFn('football-matches', { action: 'fixture', sport: 'football', fixtureId: Number(fid) });
    const f = res?.fixture || {};
    let manual = null;
    try { const { data } = await client.from('fixture_manual').select('lineups,info').eq('fixture_id', Number(fid)).maybeSingle(); manual = data || null; } catch { /* اختياري */ }
    return {
      fixture: f,
      snap: { fixture_id: Number(fid), home_id: f.home_id ?? null, away_id: f.away_id ?? null, events: res.events || [], lineups: res.lineups || [], stats: res.stats || {}, info: res.info || {}, manual_lineups: manual?.lineups || null, saved_at: new Date().toISOString() },
      manualInfo: manual?.info || null,
    };
  }
  $('match-import').addEventListener('change', async () => {
    const f = fixtureCache.get($('match-import').value); if (!f) return;
    $('match-home').value = ar(f.home_team) || ''; $('match-away').value = ar(f.away_team) || ''; $('match-league').value = f.league_label || f.league || '';
    $('match-home-logo').value = httpsOk(f.home_logo || '') ? f.home_logo : ''; $('match-away-logo').value = httpsOk(f.away_logo || '') ? f.away_logo : '';
    $('match-kickoff').value = localDT(f.kickoff); $('match-status').value = ['live', 'finished'].includes(f.status) ? f.status : (/مؤجل/.test(f.status_note || '') ? 'postponed' : /ملغ/.test(f.status_note || '') ? 'cancelled' : 'scheduled');
    $('match-home-score').value = f.home_score ?? ''; $('match-away-score').value = f.away_score ?? '';
    say('match-import-status', 'تم نسخ البيانات. جارٍ جلب التشكيلة والإحصائيات والتفاصيل...');
    try {
      const r = await pullSnapshot(f.fixture_id); snap = r.snap; paintSnap();
      const mi = r.manualInfo || {}; if (mi.channel) $('match-info-channel').value = mi.channel; if (mi.commentator) $('match-info-commentator').value = mi.commentator; if (mi.notes) $('match-info-notes').value = mi.notes;
      say('match-import-status', 'تم. أضف رابط المشغّل (لو عندك) واحفظ، وكل البيانات هتتحفظ مع المباراة.');
    } catch (e) { snap = { fixture_id: Number(f.fixture_id), home_id: f.home_id ?? null, away_id: f.away_id ?? null, events: [], lineups: [], stats: {}, info: {} }; paintSnap(); say('match-import-status', `نُسخت بيانات المباراة الأساسية، لكن تعذّر جلب التشكيلة والإحصائيات (${e.message}). جرّب «تحديث البيانات» لاحقًا.`); }
  });
  $('match-snap-refresh').addEventListener('click', async () => {
    if (!snap?.fixture_id) return;
    const btn = $('match-snap-refresh'); btn.disabled = true; say('match-message', 'جارٍ تحديث البيانات...');
    try {
      const r = await pullSnapshot(snap.fixture_id); snap = r.snap; paintSnap(); const f = r.fixture;
      if (f.status) $('match-status').value = ['live', 'finished'].includes(f.status) ? f.status : (/مؤجل/.test(f.status_note || '') ? 'postponed' : /ملغ/.test(f.status_note || '') ? 'cancelled' : 'scheduled');
      if (f.home_score != null) $('match-home-score').value = f.home_score; if (f.away_score != null) $('match-away-score').value = f.away_score;
      say('match-message', 'تم التحديث. اضغط «حفظ» لتثبيته.');
    } catch (e) { say('match-message', `تعذّر التحديث: ${e.message}`); }
    finally { btn.disabled = false; }
  });
  $('stream-fixture-day').addEventListener('change', () => loadApiFixtures('stream'));

  /* ======================== المشغّلات ======================== */
  $('stream-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser) return;
    const fixtureId = Number($('stream-fixture-id').value);
    const embedUrl = $('stream-embed-url').value.trim();
    if (!Number.isSafeInteger(fixtureId) || fixtureId < 1) { say('stream-message', 'اختر مباراة صحيحة.'); return; }
    if (!httpsOk(embedUrl)) { say('stream-message', 'يجب أن يكون رابط المشغّل آمنًا ويبدأ بـ https://'); return; }
    say('stream-message', 'جارٍ حفظ المشغّل...');
    const prev = $('stream-edit-id').value;
    const row = { fixture_id: fixtureId, embed_url: embedUrl, updated_by: currentUser.id, updated_at: new Date().toISOString() };
    const res = prev && Number(prev) !== fixtureId ? await client.from('fixture_streams').update(row).eq('fixture_id', Number(prev)) : await client.from('fixture_streams').upsert(row, { onConflict: 'fixture_id' });
    if (res.error) { say('stream-message', `تعذّر حفظ المشغّل: ${res.error.message}. شغّل ملف supabase-admin-upgrade.sql لو الجدول غير موجود.`); return; }
    resetStreamForm(); say('stream-message', 'تم ربط المشغّل بالمباراة.'); await loadStreams();
  });
  function resetStreamForm() { $('stream-form').reset(); $('stream-edit-id').value = ''; $('stream-save').textContent = 'حفظ المشغّل'; $('stream-cancel-edit').hidden = true; }
  $('stream-cancel-edit').addEventListener('click', resetStreamForm);
  async function loadStreams() {
    const host = $('admin-streams');
    const { data, error } = await client.from('fixture_streams').select('fixture_id,embed_url,updated_at').order('updated_at', { ascending: false }).limit(100);
    if (error) { host.textContent = `تعذّر تحميل المشغّلات: ${error.message}. شغّل ملف supabase-admin-upgrade.sql.`; return; }
    host.innerHTML = (data || []).map((s) => {
      const f = fixtureCache.get(String(s.fixture_id));
      return `<article class="admin-list-item"><div><strong>${esc(f ? `${ar(f.home_team)} × ${ar(f.away_team)}` : `مباراة #${s.fixture_id}`)}</strong><small>#${esc(s.fixture_id)} · ${esc(fmt(s.updated_at))}</small></div>
      <div class="row"><button type="button" class="btn outline" data-edit-stream="${esc(s.fixture_id)}">تعديل</button><button type="button" class="btn outline" data-delete-stream="${esc(s.fixture_id)}">حذف</button></div></article>`;
    }).join('') || '<p class="note">لم تتم إضافة مشغّلات بعد.</p>';
    host.querySelectorAll('[data-edit-stream]').forEach((b) => b.addEventListener('click', () => {
      const s = data.find((x) => x.fixture_id === Number(b.dataset.editStream)); if (!s) return;
      $('stream-edit-id').value = s.fixture_id;
      if (![...$('stream-fixture-id').options].some((o) => Number(o.value) === s.fixture_id)) { const o = document.createElement('option'); o.value = String(s.fixture_id); o.textContent = `المباراة #${s.fixture_id}`; $('stream-fixture-id').append(o); }
      $('stream-fixture-id').value = s.fixture_id; $('stream-embed-url').value = s.embed_url; $('stream-save').textContent = 'حفظ التعديلات'; $('stream-cancel-edit').hidden = false;
      $('stream-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }));
    host.querySelectorAll('[data-delete-stream]').forEach((b) => b.addEventListener('click', async () => {
      if (!window.confirm('هل تريد إزالة المشغّل من هذه المباراة؟')) return;
      const { error: e } = await client.from('fixture_streams').delete().eq('fixture_id', Number(b.dataset.deleteStream));
      say('stream-message', e ? `تعذّر حذف المشغّل: ${e.message}` : 'تم حذف المشغّل.'); if (!e) await loadStreams();
    }));
  }

  /* ======================== المتجر ======================== */
  async function loadStoreSetting() {
    const { data, error } = await client.from('site_settings').select('value').eq('key', 'store_enabled').maybeSingle();
    const box = $('store-enabled');
    if (error) { say('store-message', `تعذّر قراءة الإعداد: ${error.message}. شغّل ملف supabase-admin-upgrade.sql.`); box.disabled = true; return; }
    box.disabled = false; box.checked = data?.value === true;
    paintStoreState();
  }
  const paintStoreState = () => { $('store-state-text').textContent = $('store-enabled').checked ? 'المتجر ظاهر الآن للزوار.' : 'المتجر مغلق ويظهر للزوار «قريبًا».'; };
  $('store-enabled').addEventListener('change', async (e) => {
    const on = e.target.checked; paintStoreState(); say('store-message', 'جارٍ الحفظ...');
    const { error } = await client.from('site_settings').upsert({ key: 'store_enabled', value: on, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) { e.target.checked = !on; paintStoreState(); say('store-message', `تعذّر الحفظ: ${error.message}`); return; }
    say('store-message', on ? 'تم فتح المتجر للزوار.' : 'تم إغلاق المتجر.');
  });

  $('product-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser) return;
    const image = $('product-image').value.trim(); const buy = $('product-buy').value.trim();
    if ((image && !httpsOk(image)) || (buy && !httpsOk(buy))) { say('product-message', 'روابط الصورة والشراء لازم تبدأ بـ https://'); return; }
    say('product-message', 'جارٍ حفظ المنتج...');
    const row = {
      name: $('product-name').value.trim(), category: currentCategory(), description: $('product-description').value.trim(),
      price: $('product-price').value === '' ? null : Number($('product-price').value), image_url: image, buy_url: buy, is_published: $('product-published').checked,
    };
    const id = $('product-edit-id').value;
    if ($('product-category-select').value === '__new' && !row.category) { say('product-message', 'اكتب اسم الفئة الجديدة أو اختر فئة من القائمة.'); return; }
    const { error } = await (id ? client.from('products').update(row).eq('id', id) : client.from('products').insert(row));
    if (error) { say('product-message', `تعذّر حفظ المنتج: ${error.message}`); return; }
    if (row.category) await client.from('product_categories').upsert({ name: row.category }, { onConflict: 'name', ignoreDuplicates: true }); // تُحفظ الفئة لاستخدامها لاحقًا (اختياري لو الجدول غير موجود)
    resetProductForm(); await loadCategories(); say('product-message', id ? 'تم تحديث المنتج.' : 'تمت إضافة المنتج.'); await loadProducts();
  });
  /* ---- الفئات المحفوظة ---- */
  let categoryCache = [];
  const catSel = () => $('product-category-select');
  const currentCategory = () => (catSel().value === '__new' ? $('product-category-new').value.trim() : catSel().value);
  function paintCategorySelect(selected = '') {
    const sel = catSel(); const keep = selected || (sel.value && sel.value !== '__new' ? sel.value : '');
    sel.innerHTML = `<option value="">بدون فئة</option>${categoryCache.map((c) => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('')}<option value="__new">＋ فئة جديدة…</option>`;
    if (keep && !categoryCache.some((c) => c.name === keep)) sel.insertAdjacentHTML('afterbegin', `<option value="${esc(keep)}">${esc(keep)}</option>`);
    sel.value = keep;
    $('product-category-new-wrap').hidden = sel.value !== '__new';
  }
  function setCategory(name) { paintCategorySelect(name); $('product-category-new').value = ''; }
  catSel().addEventListener('change', () => { const isNew = catSel().value === '__new'; $('product-category-new-wrap').hidden = !isNew; if (isNew) $('product-category-new').focus(); });
  async function loadCategories() {
    const [reg, prods] = await Promise.all([
      client.from('product_categories').select('name').order('name'),
      client.from('products').select('category'),
    ]);
    const counts = new Map();
    (prods.data || []).forEach((p) => { const c = (p.category || '').trim(); if (c) counts.set(c, (counts.get(c) || 0) + 1); });
    const names = new Set([...(reg.data || []).map((r) => r.name), ...counts.keys()]);
    categoryCache = [...names].sort((a, b) => a.localeCompare(b, 'ar')).map((name) => ({ name, count: counts.get(name) || 0 }));
    paintCategorySelect();
    const host = $('category-list');
    if (reg.error) say('category-message', 'جدول الفئات غير موجود — شغّل ملف supabase-store-upgrade.sql (الفئات المستخدمة في المنتجات لسه بتظهر في القائمة).');
    host.innerHTML = categoryCache.map((c) => `<span class="cat-chip"><b>${esc(c.name)}</b><small>${esc(c.count)} منتج</small><button type="button" data-rename-cat="${esc(c.name)}" aria-label="إعادة تسمية">✎</button><button type="button" data-delete-cat="${esc(c.name)}" aria-label="حذف">✕</button></span>`).join('') || '<p class="note">لا توجد فئات بعد. أضف أول فئة من الأعلى.</p>';
  }
  $('category-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('category-name').value.trim(); if (!name) return;
    const { error } = await client.from('product_categories').upsert({ name }, { onConflict: 'name', ignoreDuplicates: true });
    say('category-message', error ? `تعذّر الحفظ: ${error.message}. شغّل ملف supabase-store-upgrade.sql.` : 'تمت إضافة الفئة.');
    if (!error) { $('category-name').value = ''; await loadCategories(); }
  });
  $('category-list').addEventListener('click', async (e) => {
    const ren = e.target.closest('[data-rename-cat]'); const del = e.target.closest('[data-delete-cat]');
    if (ren) {
      const old = ren.dataset.renameCat; const name = (window.prompt('الاسم الجديد للفئة:', old) || '').trim();
      if (!name || name === old) return;
      const a = await client.from('products').update({ category: name }).eq('category', old);
      const b = await client.from('product_categories').update({ name }).eq('name', old);
      if (b.error) await client.from('product_categories').upsert({ name }, { onConflict: 'name', ignoreDuplicates: true });
      say('category-message', a.error ? `تعذّرت إعادة التسمية: ${a.error.message}` : 'تمت إعادة التسمية على كل منتجاتها.'); await loadCategories(); await loadProducts();
    }
    if (del) {
      const name = del.dataset.deleteCat; const used = categoryCache.find((c) => c.name === name)?.count || 0;
      if (used) { say('category-message', `الفئة «${name}» مستخدمة في ${used} منتج. انقل المنتجات لفئة تانية الأول (أو أعد تسمية الفئة).`); return; }
      if (!window.confirm(`حذف الفئة «${name}»؟`)) return;
      const { error } = await client.from('product_categories').delete().eq('name', name);
      say('category-message', error ? `تعذّر الحذف: ${error.message}` : 'تم حذف الفئة.'); await loadCategories();
    }
  });

  function resetProductForm() { $('product-form').reset(); $('product-edit-id').value = ''; paintCategorySelect(''); $('product-category-new').value = ''; $('product-published').checked = true; $('product-save').textContent = 'إضافة المنتج'; $('product-cancel-edit').hidden = true; }
  $('product-cancel-edit').addEventListener('click', resetProductForm);
  async function loadProducts() {
    const host = $('admin-products');
    const { data, error } = await client.from('products').select('id,name,category,description,price,image_url,buy_url,is_published').order('created_at', { ascending: false }).limit(100);
    if (error) { host.textContent = `تعذّر تحميل المنتجات: ${error.message}`; return; }
    host.innerHTML = (data || []).map((p) => `<article class="admin-list-item"><div><strong>${esc(p.name)}</strong><small>${p.price != null ? `${esc(p.price)} · ` : ''}${esc(p.category || 'بدون تصنيف')} · ${p.is_published ? 'ظاهر' : 'مخفي'}</small></div>
      <div class="row"><button type="button" class="btn outline" data-toggle-product="${esc(p.id)}">${p.is_published ? 'إخفاء' : 'إظهار'}</button><button type="button" class="btn outline" data-edit-product="${esc(p.id)}">تعديل</button><button type="button" class="btn outline" data-delete-product="${esc(p.id)}">حذف</button></div></article>`).join('') || '<p class="note">لا توجد منتجات.</p>';
    host.querySelectorAll('[data-toggle-product]').forEach((b) => b.addEventListener('click', async () => {
      const p = data.find((x) => x.id === b.dataset.toggleProduct); if (!p) return;
      const { error: e } = await client.from('products').update({ is_published: !p.is_published }).eq('id', p.id);
      say('product-message', e ? `تعذّر التحديث: ${e.message}` : 'تم التحديث.'); if (!e) await loadProducts();
    }));
    host.querySelectorAll('[data-edit-product]').forEach((b) => b.addEventListener('click', () => {
      const p = data.find((x) => x.id === b.dataset.editProduct); if (!p) return;
      $('product-edit-id').value = p.id; $('product-name').value = p.name; setCategory(p.category || ''); $('product-description').value = p.description || '';
      $('product-price').value = p.price ?? ''; $('product-image').value = p.image_url || ''; $('product-buy').value = p.buy_url || ''; $('product-published').checked = p.is_published;
      $('product-save').textContent = 'حفظ التعديلات'; $('product-cancel-edit').hidden = false; $('product-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }));
    host.querySelectorAll('[data-delete-product]').forEach((b) => b.addEventListener('click', async () => {
      if (!window.confirm('هل تريد حذف هذا المنتج؟')) return;
      const { error: e } = await client.from('products').delete().eq('id', b.dataset.deleteProduct);
      say('product-message', e ? `تعذّر حذف المنتج: ${e.message}` : 'تم حذف المنتج.'); if (!e) await loadProducts();
    }));
  }

  /* ======================== الطلبات ======================== */
  const ORDER_STATUS = { new: 'جديد', confirmed: 'مؤكد', shipped: 'في الشحن', delivered: 'تم التسليم', cancelled: 'ملغي' };
  let orderFilter = 'all'; let ordersCache = [];
  const normO = (t) => String(t ?? '').toLowerCase().replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
  const filterOrders = (list) => { const q = normO(($('order-q')?.value || '').trim()); if (!q) return list; return list.filter((o) => normO([o.order_no, o.customer_name, o.phone, o.product_name, o.city, o.user_email].join(' ')).includes(q)); };
  let oqT; $('order-q')?.addEventListener('input', () => { clearTimeout(oqT); oqT = setTimeout(() => loadOrders(), 250); });
  $('order-csv')?.addEventListener('click', () => {
    const rows = filterOrders(ordersCache); if (!rows.length) { say('orders-message', 'مفيش طلبات للتصدير.'); return; }
    const cell = (v) => { let t = String(v ?? '').replace(/\r?\n/g, ' '); if (/^[=+\-@]/.test(t)) t = "'" + t; return '"' + t.replace(/"/g, '""') + '"'; };
    const head = ['رقم الطلب', 'التاريخ', 'المنتج', 'الكمية', 'الإجمالي', 'الحالة', 'العميل', 'التليفون', 'المدينة', 'العنوان', 'ملاحظات العميل', 'ملاحظة داخلية', 'إيميل الحساب'];
    const lines = [head.map(cell).join(',')].concat(rows.map((o) => [o.order_no, fmt(o.created_at), o.product_name, o.quantity, o.total, ORDER_STATUS[o.status] || o.status, o.customer_name, o.phone, o.city, o.address, o.notes, o.admin_note, o.user_email].map(cell).join(',')));
    const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    say('orders-message', `تم تصدير ${rows.length} طلب ✓`);
  });
  async function refreshOrdersBadge() {
    const { count: n, error } = await client.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'new');
    const b = $('orders-badge'); if (!b) return;
    b.hidden = error || !n; b.textContent = n || '';
  }
  $('order-filter').addEventListener('click', (e) => {
    const b = e.target.closest('[data-of]'); if (!b) return;
    orderFilter = b.dataset.of;
    document.querySelectorAll('#order-filter .chip').forEach((c) => c.classList.toggle('active', c === b));
    loadOrders();
  });
  async function loadOrders() {
    const host = $('admin-orders');
    let q = client.from('orders').select('*').order('created_at', { ascending: false }).limit(200);
    if (orderFilter !== 'all') q = q.eq('status', orderFilter);
    const { data, error } = await q;
    if (error) { host.innerHTML = `<p class="note">تعذّر تحميل الطلبات: ${esc(error.message)}. شغّل ملف supabase-orders.sql في Supabase.</p>`; return; }
    refreshOrdersBadge();
    ordersCache = data || []; const rows = filterOrders(ordersCache);
    const money = rows.filter((o) => o.status !== 'cancelled').reduce((t, o) => t + Number(o.total || 0), 0);
    $('orders-sum').textContent = rows.length ? `${nAr(rows.length)} طلب · إجمالي المبيعات (من غير الملغي): ${money.toLocaleString('ar-EG')} ج.م` : '';
    host.innerHTML = rows.map((o) => `<article class="order-item st-${esc(o.status)}">
      <div class="order-head"><strong>#${esc(o.order_no)} · ${esc(o.product_name)} × ${esc(o.quantity)}</strong><span class="tag">${esc(ORDER_STATUS[o.status] || o.status)}</span></div>
      <p class="order-meta">حساب العميل: <a dir="ltr" href="mailto:${esc(o.user_email)}">${esc(o.user_email || 'غير متاح')}</a></p>
      <p class="order-meta">${esc(o.customer_name)} · <a dir="ltr" href="tel:${esc(o.phone)}">${esc(o.phone)}</a> · <a href="https://wa.me/${esc(String(o.phone).replace(/^0/, '20').replace(/\D/g, ''))}" target="_blank" rel="noopener noreferrer">واتساب</a></p>
      <p class="order-meta">${esc([o.city, o.address].filter(Boolean).join('، '))}</p>
      ${o.notes ? `<p class="order-meta">ملاحظات العميل: ${esc(o.notes)}</p>` : ''}
      <p class="order-meta">${o.total != null ? `الإجمالي: ${esc(Number(o.total).toLocaleString('ar-EG'))} ج.م · ` : ''}${esc(fmt(o.created_at))}</p>
      <div class="row"><select data-order-status="${esc(o.id)}" aria-label="حالة الطلب">${Object.entries(ORDER_STATUS).map(([k, v]) => `<option value="${k}"${k === o.status ? ' selected' : ''}>${v}</option>`).join('')}</select>
      <input data-order-note="${esc(o.id)}" value="${esc(o.admin_note)}" maxlength="300" placeholder="ملاحظة داخلية" aria-label="ملاحظة داخلية">
      <button type="button" class="btn outline" data-save-order="${esc(o.id)}">حفظ</button><button type="button" class="btn outline" data-delete-order="${esc(o.id)}">حذف</button></div></article>`).join('') || '<p class="note">لا توجد طلبات.</p>';
    host.querySelectorAll('[data-save-order]').forEach((b) => b.addEventListener('click', async () => {
      const id = b.dataset.saveOrder;
      const status = host.querySelector(`[data-order-status="${id}"]`).value; const admin_note = host.querySelector(`[data-order-note="${id}"]`).value.trim();
      const { error: e } = await client.from('orders').update({ status, admin_note }).eq('id', id);
      say('orders-message', e ? `تعذّر الحفظ: ${e.message}` : 'تم حفظ الطلب.'); if (!e) await loadOrders();
    }));
    host.querySelectorAll('[data-delete-order]').forEach((b) => b.addEventListener('click', async () => {
      if (!window.confirm('هل تريد حذف هذا الطلب نهائيًا؟')) return;
      const { error: e } = await client.from('orders').delete().eq('id', b.dataset.deleteOrder);
      say('orders-message', e ? `تعذّر الحذف: ${e.message}` : 'تم حذف الطلب.'); if (!e) await loadOrders();
    }));
  }

  /* ======================== الأخبار ======================== */
  $('news-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser) return;
    const image = $('news-image').value.trim(); const source = $('news-source').value.trim();
    if ((image && !httpsOk(image)) || (source && !httpsOk(source))) { say('news-message', 'الروابط لازم تبدأ بـ https://'); return; }
    say('news-message', 'جارٍ الحفظ...');
    const row = { title: $('news-title').value.trim(), body: $('news-body').value.trim(), image_url: image, source_url: source, is_published: $('news-published').checked, category: $('news-category').value, excerpt: $('news-excerpt').value.trim() };
    const id = $('news-edit-id').value;
    let newId = null;
    const { data: ins, error } = id ? await client.from('news').update(row).eq('id', id) : await client.from('news').insert(row).select('id').single();
    if (!id && ins) newId = ins.id;
    if (error) { say('news-message', `تعذّر الحفظ: ${error.message}. شغّل ملف supabase-news-upgrade.sql في Supabase لو لسه ما شغلتوش.`); return; }
    const wantPush = !id && newId && row.is_published && $('news-autopush')?.checked;
    resetNewsForm(); say('news-message', id ? 'تم تحديث الخبر.' : 'تم نشر الخبر.'); await loadNews();
    if (wantPush) {
      const plain = String(row.excerpt || row.body || '').replace(/[#>*\[\]()!-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140);
      try {
        const r = await callFn('send-push', { action: 'send', title: row.title.slice(0, 80), body: plain, url: `article.html?id=${newId}`, audience: 'all' });
        say('news-message', `تم نشر الخبر ✓ والإشعار اتبعت لـ ${nAr(r?.sent ?? 0)} جهاز.`);
      } catch (e) { say('news-message', `تم نشر الخبر ✓ بس الإشعار ما اتبعتش: ${e.message}`); }
    }
  });
  function resetNewsForm() { $('news-form').reset(); $('news-edit-id').value = ''; $('news-published').checked = true; if ($('news-autopush')) $('news-autopush').checked = true; $('news-save').textContent = 'نشر الخبر'; $('news-cancel-edit').hidden = true; }
  $('news-cancel-edit').addEventListener('click', resetNewsForm);
  async function loadNews() {
    const host = $('admin-news');
    let { data, error } = await client.from('news').select('id,title,body,image_url,source_url,is_published,created_at,category,excerpt,views').order('created_at', { ascending: false }).limit(100);
    if (error) ({ data, error } = await client.from('news').select('id,title,body,image_url,source_url,is_published,created_at').order('created_at', { ascending: false }).limit(100));
    if (error) { host.textContent = `تعذّر تحميل الأخبار: ${error.message}`; return; }
    host.innerHTML = (data || []).map((n) => `<article class="admin-list-item"><div><strong>${esc(n.title)}</strong><small>${esc(fmt(n.created_at))} · <span class="pill ${n.is_published ? 'ok' : 'off'}">${n.is_published ? 'منشور' : 'مخفي'}</span>${n.views != null ? ` · ${n.views} مشاهدة` : ''}</small></div>
      <div class="row"><button type="button" class="btn outline" data-toggle-news="${esc(n.id)}">${n.is_published ? 'إخفاء' : 'نشر'}</button><button type="button" class="btn outline" data-push-news="${esc(n.id)}">🔔 إشعار</button><button type="button" class="btn outline" data-edit-news="${esc(n.id)}">تعديل</button><button type="button" class="btn outline" data-delete-news="${esc(n.id)}">حذف</button></div></article>`).join('') || '<p class="note">لا توجد أخبار.</p>';
    host.querySelectorAll('[data-push-news]').forEach((b) => b.addEventListener('click', async () => { openTab('push'); await loadPush(); $('push-news').value = b.dataset.pushNews; $('push-news').dispatchEvent(new Event('change')); }));
    host.querySelectorAll('[data-toggle-news]').forEach((b) => b.addEventListener('click', async () => {
      const n = data.find((x) => x.id === b.dataset.toggleNews); if (!n) return;
      const { error: e } = await client.from('news').update({ is_published: !n.is_published }).eq('id', n.id);
      say('news-message', e ? `تعذّر التحديث: ${e.message}` : 'تم التحديث.'); if (!e) await loadNews();
    }));
    host.querySelectorAll('[data-edit-news]').forEach((b) => b.addEventListener('click', () => {
      const n = data.find((x) => x.id === b.dataset.editNews); if (!n) return;
      $('news-edit-id').value = n.id; $('news-title').value = n.title; $('news-body').value = n.body || ''; $('news-image').value = n.image_url || ''; $('news-source').value = n.source_url || ''; $('news-category').value = n.category || 'أخبار'; $('news-excerpt').value = n.excerpt || ''; $('news-published').checked = n.is_published;
      $('news-save').textContent = 'حفظ التعديلات'; if ($('news-autopush')) $('news-autopush').checked = false; $('news-cancel-edit').hidden = false; $('news-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }));
    host.querySelectorAll('[data-delete-news]').forEach((b) => b.addEventListener('click', async () => {
      if (!window.confirm('حذف هذا الخبر؟')) return;
      const { error: e } = await client.from('news').delete().eq('id', b.dataset.deleteNews);
      say('news-message', e ? `تعذّر الحذف: ${e.message}` : 'تم الحذف.'); if (!e) await loadNews();
    }));
  }

  /* ======================== المستخدمون ======================== */
  let users = []; let usersPage = 1; let usersTotal = 0; let selected = null;
  const dialog = $('user-dialog');
  async function loadUsers(reset = false) {
    if (reset) { users = []; usersPage = 1; }
    say('users-message', 'جارٍ تحميل المستخدمين…');
    try {
      const data = await callFn('admin-users', { action: 'list', page: usersPage, perPage: 100 });
      users = users.concat(data.users || []); usersTotal = data.total ?? users.length;
      say('users-message', '');
      $('users-more').hidden = users.length >= usersTotal || !(data.users || []).length;
      renderUsers();
    } catch (error) {
      $('admin-users').innerHTML = '';
      say('users-message', `${error.message}${/الدالة|admin-users/.test(error.message) ? '' : ''} — تأكد من نشر دالة admin-users (الخطوات في README).`);
    }
  }
  function renderUsers() {
    const q = $('users-search').value.trim().toLowerCase(); const f = $('users-filter').value;
    const rows = users.filter((u) => (!q || `${u.name} ${u.email}`.toLowerCase().includes(q)) && (f === 'all' || (f === 'admin' && u.role === 'admin') || (f === 'editor' && u.role === 'editor') || (f === 'banned' && u.banned) || (f === 'user' && u.role !== 'admin' && u.role !== 'editor')));
    $('admin-users').innerHTML = rows.map((u) => `<article class="user-row${u.banned ? ' is-banned' : ''}" data-uid="${esc(u.id)}">
      <span class="u-avatar">${u.avatar && httpsOk(u.avatar) ? `<img src="${esc(u.avatar)}" alt="" referrerpolicy="no-referrer">` : esc((u.name || u.email || '?').trim().charAt(0).toUpperCase())}</span>
      <div class="u-main"><strong>${esc(u.name || 'بدون اسم')}</strong><small dir="ltr">${esc(u.email)}</small>
        <small>انضم ${esc(fmt(u.created_at))} · آخر دخول ${esc(fmt(u.last_sign_in_at))}</small></div>
      <div class="u-badges">${u.role === 'admin' ? '<span class="tag">مسؤول</span>' : u.role === 'editor' ? '<span class="tag">محرر أخبار</span>' : ''}${u.banned ? '<span class="tag danger">محظور</span>' : ''}<span class="tag muted">${esc(u.provider.includes('google') ? 'Google' : 'بريد')}</span></div>
      <button type="button" class="btn outline" data-manage="${esc(u.id)}">إدارة</button></article>`).join('') || '<p class="note">لا يوجد مستخدمون مطابقون.</p>';
  }
  $('users-search').addEventListener('input', renderUsers);
  $('users-filter').addEventListener('change', renderUsers);
  $('users-refresh').addEventListener('click', () => loadUsers(true));
  $('users-more').addEventListener('click', () => { usersPage += 1; loadUsers(false); });
  $('admin-users').addEventListener('click', (e) => {
    const b = e.target.closest('[data-manage]'); if (!b) return;
    selected = users.find((u) => u.id === b.dataset.manage); if (!selected) return;
    paintDialog(); say('ud-message', ''); dialog.showModal();
  });
  function paintDialog() {
    const u = selected; const self = u.id === currentUser?.id;
    $('ud-title').textContent = u.name || u.email;
    $('ud-meta').textContent = `${u.email} · ${u.role === 'admin' ? 'مسؤول' : u.role === 'editor' ? 'محرر أخبار' : 'مستخدم'} · ${u.banned ? `محظور حتى ${fmt(u.banned_until)}` : 'نشط'}`;
    $('ud-name').value = u.name || '';
    $('ud-ban').hidden = u.banned || self || u.role === 'admin'; $('ud-ban-days').hidden = $('ud-ban').hidden; $('ud-ban-days').parentElement.hidden = $('ud-ban').hidden;
    $('ud-unban').hidden = !u.banned;
    $('ud-role-sel').value = u.role || 'user'; $('ud-role-wrap').hidden = self;
    $('ud-delete').hidden = self || u.role === 'admin';
  }
  async function userAction(payload, okMessage, confirmText) {
    if (confirmText && !window.confirm(confirmText)) return;
    say('ud-message', 'جارٍ التنفيذ…');
    try {
      await callFn('admin-users', { id: selected.id, ...payload });
      say('ud-message', okMessage);
      loaded.delete('audit');
      const keep = selected.id; await loadUsers(true); selected = users.find((u) => u.id === keep) || null;
      if (selected) paintDialog(); else dialog.close();
    } catch (error) { say('ud-message', `تعذّر التنفيذ: ${error.message}`); }
  }
  $('ud-save-name').addEventListener('click', () => userAction({ action: 'update', display_name: $('ud-name').value }, 'تم حفظ الاسم.'));
  $('ud-ban').addEventListener('click', () => userAction({ action: 'ban', days: $('ud-ban-days').value }, 'تم حظر الحساب.', `حظر ${selected.email}؟ لن يستطيع تسجيل الدخول.`));
  $('ud-unban').addEventListener('click', () => userAction({ action: 'unban' }, 'تم فك الحظر.'));
  $('ud-role').addEventListener('click', () => {
    const r = $('ud-role-sel').value; if (r === (selected.role || 'user')) { say('ud-message', 'الدور هو نفسه.'); return; }
    const names = { admin: 'مسؤول (تحكم كامل)', editor: 'محرر أخبار (الأخبار فقط)', user: 'مستخدم عادي' };
    userAction({ action: 'set_role', role: r }, 'تم تغيير الدور.', `تغيير دور ${selected.email} إلى: ${names[r]}؟`);
  });
  $('ud-reset').addEventListener('click', () => userAction({ action: 'reset_password', redirectTo: new URL('password-reset.html', location.href).href }, 'تم إرسال رابط تغيير كلمة المرور لبريد المستخدم.'));
  $('ud-delete').addEventListener('click', () => userAction({ action: 'delete' }, 'تم حذف الحساب.', `حذف ${selected.email} نهائيًا؟ لا يمكن التراجع.`));

  /* ======================== السجل ======================== */
  const AUDIT = { ban: 'حظر مستخدم', unban: 'فك حظر', set_role: 'تغيير دور', update_name: 'تعديل اسم', reset_password: 'إرسال رابط كلمة المرور', delete_user: 'حذف حساب' };
  async function loadAudit() {
    const host = $('admin-audit');
    const { data, error } = await client.from('admin_audit').select('id,actor_email,action,target,detail,created_at').order('created_at', { ascending: false }).limit(100);
    if (error) { host.textContent = `تعذّر تحميل السجل: ${error.message}. شغّل ملف supabase-admin-upgrade.sql.`; return; }
    const emailOf = (id) => users.find((u) => u.id === id)?.email || String(id || '').slice(0, 8);
    host.innerHTML = (data || []).map((r) => `<article class="admin-list-item"><div><strong>${esc(AUDIT[r.action] || r.action)}</strong><small dir="auto">${esc(r.actor_email || '')} ← ${esc(emailOf(r.target))}${r.detail && Object.keys(r.detail).length ? ` · ${esc(JSON.stringify(r.detail))}` : ''}</small></div><small>${esc(fmt(r.created_at))}</small></article>`).join('') || '<p class="note">لا توجد عمليات مسجّلة بعد.</p>';
  }
  $('audit-refresh').addEventListener('click', loadAudit);

  checkSession();

  /* ======================== واجهة اللوحة: قائمة جانبية / مظهر / محرر الأخبار ======================== */
  $('adm-burger').addEventListener('click', () => document.body.classList.toggle('adm-open'));
  $('adm-scrim').addEventListener('click', () => document.body.classList.remove('adm-open'));
  $('adm-theme').addEventListener('click', () => {
    const dark = document.documentElement.getAttribute('data-theme') !== 'light';
    if (dark) document.documentElement.setAttribute('data-theme', 'light'); else document.documentElement.removeAttribute('data-theme');
    try { localStorage.setItem('yr-theme', dark ? 'light' : 'dark'); } catch { /* اختياري */ }
  });
  const body = $('news-body');
  let prevTimer; let lastPrev = null;
  const paintPrev = () => {
    const v = body.value; if (v === lastPrev) return; lastPrev = v;
    const box = $('news-preview'); box.innerHTML = v.trim() ? window.yrRich.render(v) : '<p class="note">المعاينة هتظهر هنا.</p>';
    window.yrRich.hydrate(box);
  };
  const schedulePrev = () => { clearTimeout(prevTimer); prevTimer = setTimeout(paintPrev, 450); };
  body.addEventListener('input', schedulePrev);
  new MutationObserver(schedulePrev).observe(body, { attributes: true });
  $('news-form').addEventListener('reset', () => setTimeout(() => { lastPrev = null; paintPrev(); }, 0));
  const wrap = (pre, post, ph) => {
    const s = body.selectionStart; const e = body.selectionEnd; const sel = body.value.slice(s, e) || ph;
    body.setRangeText(pre + sel + post, s, e, 'end'); body.focus(); body.dispatchEvent(new Event('input'));
  };
  const lineStart = (txt) => { const s = body.selectionStart; const before = body.value.slice(0, s); const pad = !before || before.endsWith('\n') ? '' : '\n'; body.setRangeText(pad + txt, s, body.selectionEnd, 'end'); body.focus(); body.dispatchEvent(new Event('input')); };
  document.querySelector('.ed-bar').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ed]'); if (!b) return;
    const k = b.dataset.ed;
    if (k === 'b') wrap('**', '**', 'نص غامق');
    else if (k === 'h2') lineStart('## عنوان\n');
    else if (k === 'h3') lineStart('### عنوان فرعي\n');
    else if (k === 'q') lineStart('> اقتباس\n');
    else if (k === 'li') lineStart('- نقطة\n');
    else if (k === 'a') { const u = prompt('الصق الرابط (https://…)'); if (u && /^https:\/\//.test(u.trim())) wrap('[', `](${u.trim()})`, 'نص الرابط'); }
    else if (k === 'img') { const u = prompt('رابط الصورة (https://…)'); if (u && /^https:\/\//.test(u.trim())) lineStart(`![وصف الصورة](${u.trim()})\n`); }
    else if (k === 'emb') { const u = prompt('الصق رابط المنشور (X / إنستجرام / تيك توك / يوتيوب / فيسبوك)'); if (u && /^https:\/\//.test(u.trim())) lineStart(`\n${u.trim()}\n\n`); else if (u) toast('الرابط لازم يبدأ بـ https://'); }
  });
  paintPrev();

  /* ======================== الإشعارات ======================== */
  let pushNews = [];
  async function loadPush(keep) {
    if (!keep) say('push-msg', '');
    try {
      const st = await callFn('send-push', { action: 'stats' });
      $('push-devices').textContent = st.devices; const ts = st.targets || []; $('push-ntargets').textContent = ts.filter((t) => t.active).length;
      $('push-audience').innerHTML = `<option value="all">كل المشتركين (${st.devices} جهاز)</option>` + ts.map((t) => `<option value="${esc(t.id)}">متابعو: ${esc(t.name_ar)} (${t.followers})</option>`).join('');
      $('push-stats').innerHTML = ts.length ? ts.map((t) => `<article class="admin-list-item"><div><strong>${t.api_id ? `<img src="https://media.api-sports.io/football/${t.kind === 'team' ? 'teams' : 'players'}/${Number(t.api_id)}.png" alt="" width="26" height="26" loading="lazy" style="border-radius:50%;vertical-align:middle;background:#fff;object-fit:contain" onerror="this.remove()"> ` : (t.kind === 'team' ? '👕 ' : '⚽ ')}${esc(t.name_ar)}</strong><small>${t.active ? 'ظاهر للمستخدمين' : 'مخفي'}</small></div><span class="pill ${t.followers ? 'ok' : 'off'}">${t.followers} متابع</span></article>`).join('') : '<p class="note">لا يوجد.</p>';
    } catch (e) { if (!keep) say('push-msg', /الدالة|send-push|Failed|غير/.test(e.message) ? `الدالة send-push مش جاهزة: ${e.message}` : e.message); }
    const { data } = await client.from('news').select('id,title,excerpt,body').eq('is_published', true).order('created_at', { ascending: false }).limit(25);
    pushNews = data || [];
    $('push-news').innerHTML = '<option value="">— اختر خبر لتعبئة الحقول —</option>' + pushNews.map((n) => `<option value="${esc(n.id)}">${esc(n.title)}</option>`).join('');
  }
  $('push-news').addEventListener('change', () => {
    const n = pushNews.find((x) => String(x.id) === $('push-news').value); if (!n) return;
    $('push-title').value = n.title.slice(0, 80); $('push-body').value = String(n.excerpt || n.body || '').replace(/[#>*\[\]()!-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180); $('push-url').value = `article.html?id=${n.id}`;
  });
  const pushRun = async (action) => {
    const title = $('push-title').value.trim(); if (!title) { say('push-msg', 'اكتب عنوان الإشعار.'); return; }
    const aud = $('push-audience').value; const label = $('push-audience').selectedOptions[0]?.textContent || '';
    if (action === 'send' && !window.confirm(`إرسال الإشعار إلى: ${label}؟\n\n«${title}»`)) return;
    const btns = [$('push-send'), $('push-test')]; btns.forEach((b) => { b.disabled = true; }); say('push-msg', 'جارٍ الإرسال…');
    try {
      const r = await callFn('send-push', { action, title, body: $('push-body').value.trim(), url: $('push-url').value.trim() || 'news.html', audience: aud === 'all' ? 'all' : 'target', target_id: aud === 'all' ? undefined : aud, kind: $('push-kind').value || undefined });
      say('push-msg', r.note || `تم ✓ — اتبعت لـ ${r.sent} جهاز${r.skipped ? ` · تخطّينا ${r.skipped} قفلوا النوع ده` : ''}${r.failed ? ` · فشل ${r.failed}` : ''}${r.removed ? ` · اتشال ${r.removed} اشتراك منتهي` : ''}${action === 'test' && !r.total ? ' — مفيش اشتراك على حسابك. فعّل الإشعارات من «حسابي» الأول.' : ''}`);
      if (action === 'send') loadPush(true);
    } catch (e) { say('push-msg', e.message); } finally { btns.forEach((b) => { b.disabled = false; }); }
  };
  $('push-form').addEventListener('submit', (e) => { e.preventDefault(); pushRun('send'); });
  $('push-test').addEventListener('click', () => pushRun('test'));

  /* طلبات المستخدمين لإضافة فريق/لاعب: الأدمن يعدّل الاسم ويضغط موافق (بيتضاف للقائمة والمستخدم بيتابعه تلقائيًا) أو رفض */
  async function loadRequests() {
    const box = $('ptr-box'); if (!box) return;
    const { data, error } = await client.from('push_target_requests').select('id,kind,name,created_at').eq('status', 'pending').order('created_at');
    if (error) { box.innerHTML = /push_target_requests|relation/.test(error.message) ? '<p class="note">لتفعيل طلبات المستخدمين شغّل ملف supabase-push-requests.sql في Supabase.</p>' : ''; return; }
    if (!data?.length) { box.innerHTML = ''; return; }
    box.innerHTML = `<div class="ptr-wrap"><h3>🕓 طلبات إضافة (${data.length})</h3>${data.map((r) => `<article class="admin-list-item ptr-item" data-rid="${esc(r.id)}"><div><strong>${r.kind === 'team' ? '👕 فريق' : '⚽ لاعب'} · ${esc(r.name)}</strong><small>${new Date(r.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}</small></div><div class="ptr-fields"><input data-f="ar" maxlength="80" value="${esc(r.name)}" placeholder="الاسم بالعربي" aria-label="الاسم بالعربي"><input data-f="en" dir="ltr" maxlength="80" placeholder="English name (as in the API)" aria-label="الاسم بالإنجليزي"></div><div class="row"><button type="button" class="btn primary" data-ptr-ok="${esc(r.id)}">✓ موافق</button><button type="button" class="btn outline" data-ptr-no="${esc(r.id)}">رفض</button></div></article>`).join('')}</div>`;
  }
  $('ptr-box')?.addEventListener('click', async (e) => {
    const ok = e.target.closest('[data-ptr-ok]'); const no = e.target.closest('[data-ptr-no]'); if (!ok && !no) return;
    const item = e.target.closest('.ptr-item'); const id = (ok || no).dataset.ptrOk || (ok || no).dataset.ptrNo; e.target.closest('button').disabled = true;
    const res = ok
      ? await client.rpc('approve_push_request', { p_id: id, p_name_ar: item.querySelector('[data-f="ar"]').value, p_name_en: item.querySelector('[data-f="en"]').value })
      : await client.from('push_target_requests').update({ status: 'rejected' }).eq('id', id);
    say('pt-msg', res.error ? res.error.message : (ok ? 'تمت الموافقة ✓ — اتضاف للقائمة وصاحب الطلب بيتابعه.' : 'تم رفض الطلب.'));
    loadRequests(); loadPushTargets();
  });
  async function loadPushTargets() {
    loadRequests();
    const { data, error } = await client.from('push_targets').select('*').order('kind').order('sort_order');
    if (error) { $('pt-list').innerHTML = ''; say('pt-msg', /push_targets|relation/.test(error.message) ? 'شغّل ملف supabase-push-step1.sql في Supabase الأول.' : error.message); return; }
    $('pt-list').innerHTML = (data || []).map((t) => `<article class="admin-list-item"><div><strong>${t.kind === 'team' ? '👕' : '⚽'} ${esc(t.name_ar)}</strong><small dir="ltr">${esc(t.name_en)} · <span class="pill ${t.active ? 'ok' : 'off'}">${t.active ? 'ظاهر' : 'مخفي'}</span></small></div><div class="row"><button type="button" class="btn outline" data-pt-toggle="${esc(t.id)}" data-on="${t.active ? 1 : 0}">${t.active ? 'إخفاء' : 'إظهار'}</button><button type="button" class="btn outline" data-pt-img="${esc(t.id)}" data-cur="${esc(t.api_id || '')}">رقم الصورة</button><button type="button" class="btn outline" data-pt-del="${esc(t.id)}">حذف</button></div></article>`).join('') || '<p class="note">لا يوجد. أضف أول فريق أو لاعب.</p>';
  }
  $('pt-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const row = { kind: $('pt-kind').value, name_en: $('pt-en').value.trim(), name_ar: $('pt-ar').value.trim(), sort_order: 100 };
    const apiId = parseInt($('pt-api')?.value, 10); if (apiId > 0) row.api_id = apiId;
    if (!row.name_en || !row.name_ar) return;
    const { error } = await client.from('push_targets').insert(row);
    say('pt-msg', error ? (/duplicate|unique/.test(error.message) ? 'موجود بالفعل.' : /api_id/.test(error.message) ? 'شغّل ملف supabase-push-media.sql في Supabase الأول.' : error.message) : 'تمت الإضافة ✓');
    if (!error) { $('pt-en').value = ''; $('pt-ar').value = ''; if ($('pt-api')) $('pt-api').value = ''; loadPushTargets(); }
  });
  $('pt-list').addEventListener('click', async (e) => {
    const im = e.target.closest('[data-pt-img]');
    if (im) { const v = window.prompt('رقم الفريق/اللاعب في API-Football (فاضي = بدون صورة):', im.dataset.cur || ''); if (v === null) return; const n = parseInt(v, 10); const { error } = await client.from('push_targets').update({ api_id: n > 0 ? n : null }).eq('id', im.dataset.ptImg); say('pt-msg', error ? (/api_id/.test(error.message) ? 'شغّل ملف supabase-push-media.sql في Supabase الأول.' : error.message) : 'تم حفظ رقم الصورة ✓'); loadPushTargets(); return; }
    const tg = e.target.closest('[data-pt-toggle]'); const dl = e.target.closest('[data-pt-del]');
    if (tg) { const { error } = await client.from('push_targets').update({ active: tg.dataset.on !== '1' }).eq('id', tg.dataset.ptToggle); say('pt-msg', error ? error.message : 'تم.'); loadPushTargets(); }
    if (dl && window.confirm('حذف الهدف ده؟ هيتشال من متابعات كل المستخدمين.')) { const { error } = await client.from('push_targets').delete().eq('id', dl.dataset.ptDel); say('pt-msg', error ? error.message : 'تم الحذف.'); loadPushTargets(); }
  });
})();
