// يلا رياضة — لوحة الإدارة. كل الصلاحيات تُفرض في قاعدة البيانات (RLS) ودالة admin-users، وليس هنا فقط.
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const client = window.yrSupabase;
  const loginPanel = $('admin-login-panel');
  const workspace = $('admin-workspace');
  const logoutButton = $('admin-logout');
  let currentUser = null;

  const say = (id, message) => { const el = $(id); if (el) el.textContent = message; };
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

  async function verifyAdmin(user) {
    const { data: profile, error } = await client.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (error) { say('admin-auth-message', `تعذّر التحقق من صلاحيات الحساب: ${error.message}`); return; }
    if (profile?.role !== 'admin') {
      currentUser = null; workspace.hidden = true; loginPanel.hidden = false; logoutButton.hidden = false;
      say('admin-auth-message', 'هذا الحساب ليس مسؤولًا. يجب أن يعيّن مسؤول المشروع role=admin لهذا الحساب.');
      return;
    }
    currentUser = user;
    loginPanel.hidden = true; workspace.hidden = false; logoutButton.hidden = false;
    say('admin-auth-message', '');
    refreshOrdersBadge();
    openTab(new URLSearchParams(location.search).get('tab') || 'overview');
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
    matches: () => loadMatches(),
    streams: () => Promise.all([loadStreams(), loadApiFixtures('stream')]),
    lineups: () => Promise.all([loadLineups(), loadApiFixtures('lineup')]),
    store: () => Promise.all([loadStoreSetting(), loadProducts(), loadCategories()]),
    orders: () => loadOrders(),
    news: () => loadNews(),
    users: () => loadUsers(true),
    audit: () => loadAudit(),
  };
  function openTab(name) {
    if (!loaders[name]) name = 'overview';
    document.querySelectorAll('[data-atab]').forEach((b) => { const on = b.dataset.atab === name; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); });
    document.querySelectorAll('.admin-pane').forEach((p) => { p.hidden = p.id !== `pane-${name}`; });
    try { const p = new URLSearchParams(location.search); p.set('tab', name); history.replaceState(null, '', `?${p}`); } catch { /* لا مشكلة */ }
    if (!loaded.has(name)) { loaded.add(name); Promise.resolve(loaders[name]()).catch((e) => console.error(`admin tab ${name}:`, e)); }
  }
  document.querySelector('.admin-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-atab]'); if (b) openTab(b.dataset.atab); });

  /* ======================== نظرة عامة ======================== */
  async function count(table) {
    const { count: n, error } = await client.from(table).select('*', { count: 'exact', head: true });
    return error ? null : n;
  }
  async function loadOverview() {
    const host = $('overview-cards');
    host.innerHTML = '<p class="note">جارٍ التحميل…</p>';
    const [matches, streams, lineups, products, news, newOrders, storeRow, usersRes] = await Promise.all([
      count('matches'), count('fixture_streams'), count('fixture_manual'), count('products'), count('news'), client.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'new'),
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
      ['تشكيلات يدوية', lineups ?? '—', ''],
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
    };
    if ((row.home_logo && !httpsOk(row.home_logo)) || (row.away_logo && !httpsOk(row.away_logo))) { say('match-message', 'رابط اللوجو يجب أن يبدأ بـ https://'); return; }
    const editId = $('match-edit-id').value;
    const save = (r) => (editId ? client.from('matches').update(r).eq('id', editId) : client.from('matches').insert(r));
    let { error } = await save(row);
    if (error && /home_logo|away_logo/.test(error.message || '')) { // عمود اللوجو غير مضاف: نحفظ بدونه ونُنبّه
      const { home_logo, away_logo, ...plain } = row; ({ error } = await save(plain));
      if (!error) say('match-message', 'تم الحفظ بدون اللوجوهات. شغّل ملف supabase-manual-upgrade.sql لتفعيلها.');
    }
    if (error) { say('match-message', `تعذّر حفظ المباراة: ${error.message}`); return; }
    resetMatchForm(); say('match-message', editId ? 'تم تحديث المباراة.' : 'تمت إضافة المباراة.'); await loadMatches();
  });
  function resetMatchForm() {
    $('match-form').reset(); $('match-edit-id').value = ''; $('match-published').checked = true;
    $('match-save').textContent = 'حفظ المباراة'; $('match-cancel-edit').hidden = true;
  }
  $('match-cancel-edit').addEventListener('click', resetMatchForm);
  async function loadMatches() {
    const host = $('admin-matches');
    const { data, error } = await client.from('matches').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) { host.textContent = `تعذّر تحميل المباريات: ${error.message}`; return; }
    host.innerHTML = (data || []).map((m) => `<article class="admin-list-item">
      <div><strong>${esc(m.home_team)} × ${esc(m.away_team)}</strong><small>${esc(m.league || 'كرة القدم')} · ${m.is_published ? 'منشورة' : 'مخفية'}</small></div>
      <div class="row"><button type="button" class="btn outline" data-edit-match="${esc(m.id)}">تعديل</button><button type="button" class="btn outline" data-delete-match="${esc(m.id)}">حذف</button></div>
    </article>`).join('') || '<p class="note">لا توجد مباريات يدوية بعد.</p>';
    host.querySelectorAll('[data-edit-match]').forEach((b) => b.addEventListener('click', () => {
      const m = data.find((x) => x.id === b.dataset.editMatch); if (!m) return;
      $('match-edit-id').value = m.id; $('match-home').value = m.home_team; $('match-away').value = m.away_team; $('match-league').value = m.league || '';
      $('match-kickoff').value = localDT(m.kickoff); $('match-status').value = m.status; $('match-home-score').value = m.home_score ?? ''; $('match-away-score').value = m.away_score ?? '';
      $('match-home-logo').value = m.home_logo || ''; $('match-away-logo').value = m.away_logo || '';
      $('match-embed').value = m.embed_url || ''; $('match-published').checked = m.is_published; $('match-save').textContent = 'حفظ التعديلات'; $('match-cancel-edit').hidden = false;
      $('match-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }));
    host.querySelectorAll('[data-delete-match]').forEach((b) => b.addEventListener('click', async () => {
      if (!window.confirm('هل تريد حذف هذه المباراة؟')) return;
      const { error: e } = await client.from('matches').delete().eq('id', b.dataset.deleteMatch);
      say('match-message', e ? `تعذّر حذف المباراة: ${e.message}` : 'تم حذف المباراة.'); if (!e) await loadMatches();
    }));
  }

  /* ======================== قوائم مباريات المزوّد (للمشغّلات والتشكيلات) ======================== */
  const fixtureCache = new Map();
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
      select.innerHTML = '<option value="">اختر مباراة</option>' + fixtures.map((f) => `<option value="${esc(f.fixture_id)}">${esc(`${f.home_team} × ${f.away_team} · ${f.league_label || f.league} · #${f.fixture_id}`)}</option>`).join('');
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
      sel.innerHTML = '<option value="">— اختر مباراة —</option>' + fx.map((f) => `<option value="${esc(f.fixture_id)}">${esc(`${f.home_team} × ${f.away_team} · ${f.league_label || f.league}`)}</option>`).join('');
      if (!fx.length) say('match-import-status', 'لا توجد مباريات لهذا اليوم.');
    } catch (e) { sel.innerHTML = '<option value="">— اختر مباراة —</option>'; say('match-import-status', `${e.message} — أضف المباراة يدويًا بالأسفل.`); }
  });
  $('match-import').addEventListener('change', () => {
    const f = fixtureCache.get($('match-import').value); if (!f) return;
    $('match-home').value = f.home_team || ''; $('match-away').value = f.away_team || ''; $('match-league').value = f.league_label || f.league || '';
    $('match-home-logo').value = httpsOk(f.home_logo || '') ? f.home_logo : ''; $('match-away-logo').value = httpsOk(f.away_logo || '') ? f.away_logo : '';
    $('match-kickoff').value = localDT(f.kickoff); $('match-status').value = ['live', 'finished'].includes(f.status) ? f.status : 'scheduled';
    $('match-home-score').value = f.home_score ?? ''; $('match-away-score').value = f.away_score ?? '';
    say('match-import-status', 'تم نسخ البيانات. أضف رابط المشغّل واحفظ.');
  });
  $('stream-fixture-day').addEventListener('change', () => loadApiFixtures('stream'));
  $('lineup-fixture-day').addEventListener('change', () => loadApiFixtures('lineup'));

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
      return `<article class="admin-list-item"><div><strong>${esc(f ? `${f.home_team} × ${f.away_team}` : `مباراة #${s.fixture_id}`)}</strong><small>#${esc(s.fixture_id)} · ${esc(fmt(s.updated_at))}</small></div>
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

  /* ======================== التشكيلات اليدوية ======================== */
  // سطر اللاعب: "10 محمد صلاح" أو "محمد صلاح" — الرقم اختياري
  const parsePlayers = (text) => String(text || '').split('\n').map((l) => l.trim()).filter(Boolean).map((line) => {
    const m = line.match(/^(\d{1,2})[\s.\-)]+(.+)$/);
    return m ? { number: Number(m[1]), name: m[2].trim().slice(0, 80) } : { number: null, name: line.slice(0, 80) };
  });
  // يحوّل الخطة 4-3-3 + ترتيب اللاعبين (حارس ثم دفاع...) إلى مواقع "صف:عمود" لرسم الملعب
  const buildGrid = (formation, count) => {
    const parts = String(formation || '').trim().split('-').map((n) => Number(n));
    if (parts.length < 2 || parts.some((n) => !Number.isInteger(n) || n < 1) || 1 + parts.reduce((a, b) => a + b, 0) !== count) return null;
    const grid = ['1:1'];
    parts.forEach((n, i) => { for (let c = 1; c <= n; c += 1) grid.push(`${i + 2}:${c}`); });
    return grid;
  };
  const teamPayload = (side) => {
    const formation = $(`lineup-${side}-formation`).value.trim();
    const start = parsePlayers($(`lineup-${side}-start`).value);
    const grid = buildGrid(formation, start.length);
    return {
      name: $(`lineup-${side}-name`).value.trim(), formation, coach: $(`lineup-${side}-coach`).value.trim(),
      start: start.map((p, i) => ({ ...p, grid: grid ? grid[i] : null })),
      subs: parsePlayers($(`lineup-${side}-subs`).value),
      gridOk: !!grid,
    };
  };
  const fillTeam = (side, t = {}) => {
    $(`lineup-${side}-name`).value = t.name || ''; $(`lineup-${side}-formation`).value = t.formation || ''; $(`lineup-${side}-coach`).value = t.coach || '';
    const line = (p) => `${p.number ?? ''} ${p.name}`.trim();
    $(`lineup-${side}-start`).value = (t.start || []).map(line).join('\n'); $(`lineup-${side}-subs`).value = (t.subs || []).map(line).join('\n');
  };
  async function loadExistingManual(id) {
    const n = Number(id); if (!Number.isSafeInteger(n) || n < 1) return;
    let q = await client.from('fixture_manual').select('lineups,info').eq('fixture_id', n).maybeSingle();
    if (q.error) q = await client.from('fixture_manual').select('lineups').eq('fixture_id', n).maybeSingle();
    const r = q.data; if (!r) return;
    fillTeam('home', r.lineups?.home); fillTeam('away', r.lineups?.away);
    const i = r.info || {}; $('info-channel').value = i.channel || ''; $('info-commentator').value = i.commentator || ''; $('info-notes').value = i.notes || '';
    say('lineup-message', 'تم تحميل البيانات المحفوظة لهذه المباراة — عدّلها واحفظ.');
  }
  $('lineup-fixture-id').addEventListener('change', (e) => loadExistingManual(e.target.value));
  $('lineup-fixture-select').addEventListener('change', (e) => {
    if (!e.target.value) return;
    $('lineup-fixture-id').value = e.target.value; loadExistingManual(e.target.value);
    const f = fixtureCache.get(e.target.value);
    if (f) { if (!$('lineup-home-name').value) $('lineup-home-name').value = f.home_team; if (!$('lineup-away-name').value) $('lineup-away-name').value = f.away_team; }
  });
  $('lineup-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser) return;
    const fixtureId = Number($('lineup-fixture-id').value);
    if (!Number.isSafeInteger(fixtureId) || fixtureId < 1) { say('lineup-message', 'اكتب رقم مباراة صحيحًا أو اخترها من القائمة.'); return; }
    const home = teamPayload('home'); const away = teamPayload('away');
    const info = { channel: $('info-channel').value.trim(), commentator: $('info-commentator').value.trim(), notes: $('info-notes').value.trim() };
    const hasInfo = Object.values(info).some(Boolean);
    const hasLineup = home.start.length > 0 || away.start.length > 0;
    if (!hasLineup && !hasInfo) { say('lineup-message', 'اكتب تشكيلة أو تفاصيل (قناة/معلق) على الأقل.'); return; }
    if (hasLineup && (home.start.length !== 11 || away.start.length !== 11)) { say('lineup-message', `الأساسيون لازم يكونوا 11 لكل فريق (الآن ${home.start.length} و${away.start.length}).`); return; }
    const warn = hasLineup && (!home.gridOk || !away.gridOk) ? ' (الخطة غير مطابقة لعدد اللاعبين فسيُعرض الفريق كقائمة بدل الملعب)' : '';
    say('lineup-message', 'جارٍ الحفظ...');
    const f = fixtureCache.get(String(fixtureId));
    const row = {
      fixture_id: fixtureId, title: `${home.name || f?.home_team || 'الأول'} × ${away.name || f?.away_team || 'الثاني'}`,
      info, updated_by: currentUser.id, updated_at: new Date().toISOString(),
    };
    if (hasLineup) row.lineups = { home: { name: home.name, formation: home.formation, coach: home.coach, start: home.start, subs: home.subs }, away: { name: away.name, formation: away.formation, coach: away.coach, start: away.start, subs: away.subs } };
    const { error } = await client.from('fixture_manual').upsert(row, { onConflict: 'fixture_id' });
    if (error) { say('lineup-message', `تعذّر الحفظ: ${error.message}. ${/info/.test(error.message) ? 'شغّل ملف supabase-store-upgrade.sql.' : 'شغّل ملف supabase-admin-upgrade.sql لو الجدول غير موجود.'}`); return; }
    resetLineupForm(); say('lineup-message', `تم الحفظ${warn}.`); await loadLineups();
  });
  function resetLineupForm() { $('lineup-form').reset(); $('lineup-edit-id').value = ''; $('lineup-save').textContent = 'حفظ'; $('lineup-cancel-edit').hidden = true; }
  $('lineup-cancel-edit').addEventListener('click', resetLineupForm);
  async function loadLineups() {
    const host = $('admin-lineups');
    const { data, error } = await client.from('fixture_manual').select('fixture_id,title,lineups,updated_at').order('updated_at', { ascending: false }).limit(100);
    if (error) { host.textContent = `تعذّر تحميل التشكيلات: ${error.message}. شغّل ملف supabase-admin-upgrade.sql.`; return; }
    host.innerHTML = (data || []).map((r) => `<article class="admin-list-item"><div><strong>${esc(r.title || `مباراة #${r.fixture_id}`)}</strong><small>#${esc(r.fixture_id)} · ${esc(fmt(r.updated_at))}</small></div>
      <div class="row"><button type="button" class="btn outline" data-edit-lineup="${esc(r.fixture_id)}">تعديل</button><button type="button" class="btn outline" data-delete-lineup="${esc(r.fixture_id)}">حذف</button></div></article>`).join('') || '<p class="note">لا توجد تشكيلات يدوية.</p>';
    host.querySelectorAll('[data-edit-lineup]').forEach((b) => b.addEventListener('click', () => {
      const r = data.find((x) => x.fixture_id === Number(b.dataset.editLineup)); if (!r) return;
      $('lineup-edit-id').value = r.fixture_id; $('lineup-fixture-id').value = r.fixture_id;
      fillTeam('home', r.lineups?.home); fillTeam('away', r.lineups?.away); loadExistingManual(r.fixture_id);
      $('lineup-save').textContent = 'حفظ التعديلات'; $('lineup-cancel-edit').hidden = false;
      $('lineup-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
    host.querySelectorAll('[data-delete-lineup]').forEach((b) => b.addEventListener('click', async () => {
      if (!window.confirm('حذف التشكيلة اليدوية؟ سيعود الموقع لتشكيلة المزوّد إن وُجدت.')) return;
      const { error: e } = await client.from('fixture_manual').delete().eq('fixture_id', Number(b.dataset.deleteLineup));
      say('lineup-message', e ? `تعذّر الحذف: ${e.message}` : 'تم حذف التشكيلة.'); if (!e) await loadLineups();
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
  let orderFilter = 'all';
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
    host.innerHTML = (data || []).map((o) => `<article class="order-item st-${esc(o.status)}">
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
    const row = { title: $('news-title').value.trim(), body: $('news-body').value.trim(), image_url: image, source_url: source, is_published: $('news-published').checked };
    const id = $('news-edit-id').value;
    let newId = null;
    const { data: ins, error } = id ? await client.from('news').update(row).eq('id', id) : await client.from('news').insert(row).select('id').single();
    if (!id && ins) newId = ins.id;
    if (error) { say('news-message', `تعذّر الحفظ: ${error.message}. شغّل ملف supabase-admin-upgrade.sql لو العمود source_url ناقص.`); return; }
    resetNewsForm(); say('news-message', id ? 'تم تحديث الخبر.' : 'تم نشر الخبر.'); await loadNews();
  });
  function resetNewsForm() { $('news-form').reset(); $('news-edit-id').value = ''; $('news-published').checked = true; $('news-save').textContent = 'نشر الخبر'; $('news-cancel-edit').hidden = true; }
  $('news-cancel-edit').addEventListener('click', resetNewsForm);
  async function loadNews() {
    const host = $('admin-news');
    const { data, error } = await client.from('news').select('id,title,body,image_url,source_url,is_published,created_at').order('created_at', { ascending: false }).limit(100);
    if (error) { host.textContent = `تعذّر تحميل الأخبار: ${error.message}`; return; }
    host.innerHTML = (data || []).map((n) => `<article class="admin-list-item"><div><strong>${esc(n.title)}</strong><small>${esc(fmt(n.created_at))} · ${n.is_published ? 'منشور' : 'مخفي'}</small></div>
      <div class="row"><button type="button" class="btn outline" data-toggle-news="${esc(n.id)}">${n.is_published ? 'إخفاء' : 'نشر'}</button><button type="button" class="btn outline" data-edit-news="${esc(n.id)}">تعديل</button><button type="button" class="btn outline" data-delete-news="${esc(n.id)}">حذف</button></div></article>`).join('') || '<p class="note">لا توجد أخبار.</p>';
    host.querySelectorAll('[data-toggle-news]').forEach((b) => b.addEventListener('click', async () => {
      const n = data.find((x) => x.id === b.dataset.toggleNews); if (!n) return;
      const { error: e } = await client.from('news').update({ is_published: !n.is_published }).eq('id', n.id);
      say('news-message', e ? `تعذّر التحديث: ${e.message}` : 'تم التحديث.'); if (!e) await loadNews();
    }));
    host.querySelectorAll('[data-edit-news]').forEach((b) => b.addEventListener('click', () => {
      const n = data.find((x) => x.id === b.dataset.editNews); if (!n) return;
      $('news-edit-id').value = n.id; $('news-title').value = n.title; $('news-body').value = n.body || ''; $('news-image').value = n.image_url || ''; $('news-source').value = n.source_url || ''; $('news-published').checked = n.is_published;
      $('news-save').textContent = 'حفظ التعديلات'; $('news-cancel-edit').hidden = false; $('news-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    const rows = users.filter((u) => (!q || `${u.name} ${u.email}`.toLowerCase().includes(q)) && (f === 'all' || (f === 'admin' && u.role === 'admin') || (f === 'banned' && u.banned) || (f === 'user' && u.role !== 'admin')));
    $('admin-users').innerHTML = rows.map((u) => `<article class="user-row${u.banned ? ' is-banned' : ''}" data-uid="${esc(u.id)}">
      <span class="u-avatar">${u.avatar && httpsOk(u.avatar) ? `<img src="${esc(u.avatar)}" alt="" referrerpolicy="no-referrer">` : esc((u.name || u.email || '?').trim().charAt(0).toUpperCase())}</span>
      <div class="u-main"><strong>${esc(u.name || 'بدون اسم')}</strong><small dir="ltr">${esc(u.email)}</small>
        <small>انضم ${esc(fmt(u.created_at))} · آخر دخول ${esc(fmt(u.last_sign_in_at))}</small></div>
      <div class="u-badges">${u.role === 'admin' ? '<span class="tag">مسؤول</span>' : ''}${u.banned ? '<span class="tag danger">محظور</span>' : ''}<span class="tag muted">${esc(u.provider.includes('google') ? 'Google' : 'بريد')}</span></div>
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
    $('ud-meta').textContent = `${u.email} · ${u.role === 'admin' ? 'مسؤول' : 'مستخدم'} · ${u.banned ? `محظور حتى ${fmt(u.banned_until)}` : 'نشط'}`;
    $('ud-name').value = u.name || '';
    $('ud-ban').hidden = u.banned || self || u.role === 'admin'; $('ud-ban-days').hidden = $('ud-ban').hidden; $('ud-ban-days').parentElement.hidden = $('ud-ban').hidden;
    $('ud-unban').hidden = !u.banned;
    $('ud-role').hidden = self; $('ud-role').textContent = u.role === 'admin' ? 'سحب صلاحية المسؤول' : 'جعله مسؤولًا';
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
  $('ud-role').addEventListener('click', () => userAction({ action: 'set_role', role: selected.role === 'admin' ? 'user' : 'admin' }, 'تم تغيير الدور.', selected.role === 'admin' ? 'سحب صلاحية المسؤول من هذا الحساب؟' : 'سيصبح هذا الحساب مسؤولًا بكامل الصلاحيات. متأكد؟'));
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
})();
