// يلا رياضة — صفحات المباريات (الرئيسية، مركز المباريات، تفاصيل المباراة).
// البيانات الحقيقية تأتي من دالة Supabase `football-matches` (المفتاح السري يبقى هناك).
(() => {
  'use strict';

  const db = window.yrSupabase;
  const $ = (id) => document.getElementById(id);
  const page = location.pathname.split('/').pop() || 'matches.html';

  /* ---------- أدوات ---------- */
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const safeUrl = (value) => { try { const u = new URL(value); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } };
  const cairoParts = (date) => Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date).map(({ type, value }) => [type, value]));
  const localDate = (offset) => {
    const v = cairoParts(new Date());
    return new Date(Date.UTC(Number(v.year), Number(v.month) - 1, Number(v.day) + offset)).toISOString().slice(0, 10);
  };
  const cairoDay = (value) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
  const formatDate = (value) => value ? new Date(value).toLocaleString('ar-EG', { timeZone: 'Africa/Cairo', dateStyle: 'medium', timeStyle: 'short' }) : 'الموعد لم يحدد';
  const formatTime = (value) => value ? new Date(value).toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' }) : '—';
  const SPORT_ICON = { football: '⚽', basketball: '🏀' };
  const SPORT_NAME = { football: 'كرة القدم', basketball: 'كرة السلة' };

  const tn = (name) => (window.YR_NAMES ? window.YR_NAMES.team(name) : name);
  const pn = (name) => (window.YR_NAMES ? window.YR_NAMES.player(name) : name);

  /* كاش مؤقت في الذاكرة: نفس الطلب لا يتكرر خلال مدة صلاحيته، وعند الفشل نعرض آخر نسخة من نفس الجلسة */
  const TTL = { fixtures: (b) => (b.date === localDate(0) ? 3 : 30) * 60e3, fixture: () => 2 * 60e3, team: () => 12 * 3600e3, form: () => 2 * 3600e3, player: () => 12 * 3600e3 };
  /* الكاش في ذاكرة الصفحة فقط (مش بيتحفظ على جهاز الزائر): بيختفي بمجرد إغلاق/تحديث الصفحة.
     الدالة نفسها على السيرفر عندها كاش، فمفيش داعي لتخزين بيانات المباريات على الجهاز. */
  const memCache = new Map();
  const cacheRead = (k) => memCache.get(k) || null;
  const cacheWrite = (k, v) => { memCache.set(k, { t: Date.now(), v }); if (memCache.size > 60) memCache.delete(memCache.keys().next().value); };
  try { Object.keys(localStorage).filter((x) => x.startsWith('yr-c:')).forEach((x) => localStorage.removeItem(x)); } catch { /* التخزين غير متاح */ } // تنظيف نسخ قديمة اتحفظت قبل كده
  const inflight = new Map();
  const request = async (body) => {
    if (!db) throw new Error('إعدادات Supabase غير مكتملة.');
    const key = JSON.stringify(body); const ttl = TTL[body.action]?.(body) || 0;
    const hit = cacheRead(key);
    if (hit && ttl && Date.now() - hit.t < ttl) { try { await window.YR_NAMES?.ready; } catch { /* اختياري */ } return hit.v; }
    if (inflight.has(key)) return inflight.get(key);
    const job = (async () => {
      const { data, error } = await db.functions.invoke('football-matches', { body });
      if (error || data?.error) {
        if (hit) return hit.v; // خدمة مشغولة أو الحد اليومي خلص: نعرض آخر نسخة بدل الخطأ
        if (error) {
          if (/failed to send a request to the edge function/i.test(error.message || '')) { console.error('football-matches function unreachable:', error); throw new Error('الخدمة غير متاحة حاليًا. حاول لاحقًا.'); }
          throw error;
        }
        throw new Error(data.error);
      }
      if (ttl) cacheWrite(key, data);
      try { await window.YR_NAMES?.ready; } catch { /* الأسماء الإضافية اختيارية */ }
      return data;
    })().finally(() => inflight.delete(key));
    inflight.set(key, job);
    return job;
  };

  /* مصدر احتياطي أخير للمباريات: SportSRC (لو الأدمن مفعّله) */
  const srFixtures = async (date) => {
    try { const r = await db.functions.invoke('sportsrc', { body: { action: 'fixtures', date } }); if (r.data?.fixtures?.length) { try { await window.YR_NAMES?.ready; } catch { /* اختياري */ } return r.data; } } catch { /* مش متاح */ }
    return null;
  };
  const initials = (n, sport) => { const w = String(n || '').trim().replace(/(^|\s)ال(?=\S)/g, '$1').split(/\s+/).filter(Boolean); return w.length ? (w.length > 1 ? w[0][0] + w[1][0] : w[0].slice(0, 2)) : (SPORT_ICON[sport] || '⚽'); };
  const teamMarkup = (name, logo, sport = 'football', id = null) => {
    const image = safeUrl(logo);
    const inner = `<span class="crest${image ? '' : ' nologo'}">${image ? `<img src="${escapeHtml(image)}" alt="" loading="lazy">` : escapeHtml(initials(tn(name), sport))}</span><span class="team-name">${escapeHtml(tn(name))}</span>`;
    // الضغط على الفريق (صفحة المباراة) يفتح معلوماته
    return id && sport === 'football' && id > 0 && page === 'match.html'
      ? `<a class="team team-link" href="team.html?id=${encodeURIComponent(id)}" title="معلومات الفريق">${inner}</a>`
      : `<div class="team">${inner}</div>`;
  };
  const statusTag = (m) => {
    if (m.status === 'live') return `<span class="tag live">● مباشر${m.minute ? ` · ${escapeHtml(m.minute)}'` : ''}</span>`;
    if (m.status === 'finished') return '<span class="tag">انتهت</span>';
    if (m.status === 'postponed') return '<span class="tag warn">مؤجلة</span>';
    if (m.status === 'cancelled') return '<span class="tag warn">ملغاة</span>';
    if (m.status_note) return `<span class="tag">${escapeHtml(m.status_note)}</span>`;
    return '<span class="tag">قادمة</span>';
  };
  const centerMarkup = (m) => {
    if (m.status === 'postponed' || m.status === 'cancelled') return `<div class="kick off">${m.status === 'postponed' ? 'مؤجلة' : 'ملغاة'}${m.kickoff && m.status === 'postponed' ? `<small>${escapeHtml(formatTime(m.kickoff))}</small>` : ''}</div>`;
    if (m.home_score == null || m.away_score == null) return `<div class="kick">${escapeHtml(formatTime(m.kickoff))}</div>`;
    // الصفحة من اليمين لليسار: الفريق صاحب الأرض على اليمين، والرقم يُكتب LTR، فنكتب الضيف أولًا ليكون صاحب الأرض على اليمين
    return `<div class="score" dir="ltr">${escapeHtml(m.away_score)} : ${escapeHtml(m.home_score)}</div>`;
  };
  // سطر الحالة تحت النتيجة (بدل رأس البطاقة وتذييلها): الدقيقة للمباشر، "انتهت"، أو التاريخ للقادمة
  const stLine = (m) => {
    if (m.status === 'live') return `<span class="mx-st live">${m.minute ? `${escapeHtml(m.minute)}'` : 'مباشر'}</span>`;
    if (m.status === 'finished') return '<span class="mx-st">انتهت</span>';
    if (m.status === 'postponed' || m.status === 'cancelled') return '';
    return '';
  };
  /* المفضلة: محفوظة في المتصفح (localStorage) */
  let favSet = new Set(); try { favSet = new Set(JSON.parse(localStorage.getItem('yr-fav-m') || '[]')); } catch { /* اختياري */ }
  const favKey = (m) => (m.manual ? `m:${m.id}` : `${m.sport || 'football'}:${m.fixture_id}`);
  // فرق المستخدم المتابَعة (من صفحة المفضلة): تظهر مبارياتها في فلتر «المفضلة» وعليها علامة
  let followed = new Set();
  const hero0f = (m) => Number(m.home_id) > 0 && Number(m.away_id) > 0;
  const isFollowed = (m) => followed.size > 0 && (followed.has(Number(m.home_id)) || followed.has(Number(m.away_id)));
  let followReady = false, followSigned = false, followErr = false;
  const loadFollows = async () => { try { const { data: s } = await db.auth.getSession(); followSigned = !!s?.session; if (!followSigned) return false; const r = await db.from('push_follows').select('push_targets(api_id,kind)'); if (r.error) { followErr = true; return false; } followed = new Set((r.data || []).map((x) => x.push_targets).filter((t) => t && t.kind === 'team' && t.api_id).map((t) => Number(t.api_id))); return followed.size > 0; } catch { followErr = true; return false; } finally { followReady = true; } };
  const saveFav = () => { try { localStorage.setItem('yr-fav-m', JSON.stringify([...favSet].slice(-300))); } catch { /* اختياري */ } };
  const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6L3.3 9.9l6-.9z"/></svg>';
  const pill = (m) => {
    if (m.status === 'live') return `<span class="mx-pill live">● مباشر${m.minute ? ` ${escapeHtml(m.minute)}'` : ''}</span>`;
    if (m.status === 'finished') return '<span class="mx-pill fin">انتهت</span>';
    if (m.status === 'postponed') return '<span class="mx-pill warn">مؤجلة</span>';
    if (m.status === 'cancelled') return '<span class="mx-pill warn">ملغاة</span>';
    return '<span class="mx-pill">لم تبدأ</span>';
  };
  const BELL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 1112 0v5l1.5 2h-15zM10 20a2 2 0 004 0"/></svg>';
  let bells = new Set();
  const bellable = (m) => !m.manual && m.status === 'scheduled' && Number(m.fixture_id) > 0 && m.kickoff && new Date(m.kickoff).getTime() > Date.now();
  const bellBtn = (m) => (bellable(m) ? `<button type="button" class="mx-bell${bells.has(Number(m.fixture_id)) ? ' on' : ''}" data-bell="${Number(m.fixture_id)}" data-t="${escapeHtml(tn(m.home_team) + ' × ' + tn(m.away_team))}" data-ko="${escapeHtml(m.kickoff)}" aria-pressed="${bells.has(Number(m.fixture_id))}" aria-label="ذكّرني قبل المباراة" title="ذكّرني قبل المباراة">${BELL}</button>` : '');
  const mxCard = (m, href, watch) => { const k = favKey(m); const on = favSet.has(k); return `<article class="match mx${m.status === 'live' ? ' is-live' : ''}${isFollowed(m) ? ' is-followed' : ''}" data-fk="${escapeHtml(k)}">
      <div class="mx-head"><button type="button" class="mx-fav${on ? ' on' : ''}" data-fav="${escapeHtml(k)}" aria-pressed="${on}" aria-label="${on ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}">${STAR}</button>${bellBtn(m)}<span class="mx-lg">${escapeHtml(m.league_label || m.league || '')}${m.round ? ` • ${escapeHtml(m.round)}` : ''}</span>${isFollowed(m) ? '<span class="mx-fol">من فرقك</span>' : ''}${pill(m)}</div>
      <a class="mx-link" href="${href}"><div class="teams">${teamMarkup(m.home_team, m.home_logo, m.sport)}<div class="mx-mid">${centerMarkup(m)}${stLine(m)}</div>${teamMarkup(m.away_team, m.away_logo, m.sport)}</div>
      <div class="mx-foot"><span class="mx-more">التفاصيل <i aria-hidden="true"></i></span>${watch ? `<b class="mx-watch"><i class="mx-pl" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 6.5v11l9-5.5z"/></svg></i>${m.status === 'live' ? 'شاهد البث' : m.status === 'finished' ? 'شاهد الملخص' : 'شاهد'}</b>` : ''}</div></a>
    </article>`; };
  const fixtureCard = (m, ctx) => mxCard(m, `match.html?fixture=${encodeURIComponent(m.fixture_id)}&sport=${encodeURIComponent(m.sport || 'football')}&day=${encodeURIComponent(ctx.day)}`, m.has_stream);
  const manualCard = (m) => mxCard(m, `match.html?id=${encodeURIComponent(m.id)}`, m.has_embed);


  // أي مباراة لها رابط مشغّل رسمي في fixture_streams تُعلَّم لتظهر عليها علامة «شاهد»
  const markStreams = async (fixtures) => {
    const ids = fixtures.filter((m) => m.sport !== 'basketball' && Number.isSafeInteger(Number(m.fixture_id))).map((m) => Number(m.fixture_id));
    if (!db || !ids.length) return;
    try {
      // الزائر يعرف فقط أي مباراة عليها مشغّل (بدون الرابط). الرابط نفسه للأعضاء المسجّلين فقط.
      let have = null;
      const r = await db.rpc('stream_fixture_ids', { p_ids: ids });
      if (!r.error && Array.isArray(r.data)) have = new Set(r.data.map(Number));
      if (!have) { // دالة غير منشورة بعد → نرجع للقراءة المباشرة (تعمل للمسجّلين فقط)
        const { data, error } = await db.from('fixture_streams').select('fixture_id,embed_url').in('fixture_id', ids);
        if (error) throw error;
        have = new Set((data || []).filter((x) => safeUrl(x.embed_url)).map((x) => Number(x.fixture_id)));
      }
      const ok = have;
      fixtures.forEach((m) => { if (ok.has(Number(m.fixture_id)) && m.sport !== 'basketball') m.has_stream = true; });
    } catch (e) { console.error('streams lookup:', e); }
  };


  /* ---- صفحة المباراة: كارت المصدر والجودة + مباريات أخرى مباشرة ---- */
  const hostName = (u) => { try { const h = new URL(u).hostname.replace(/^www\./, ''); if (/youtube|youtu\.be/.test(h)) return 'YouTube'; if (/facebook|fb\.watch/.test(h)) return 'Facebook'; if (/tiktok/.test(h)) return 'TikTok'; return h; } catch { return 'مباشر'; } };
  const mdChan = (url, m) => {
    const box = $('md-chan'); const btn = $('md-chan-b'); const dd = $('md-chan-d'); if (!box || !btn || !dd) return;
    const name = hostName(url); const yt = name === 'YouTube';
    $('md-src-t').textContent = name; $('md-q-t').textContent = m.status === 'finished' ? 'ملخص المباراة' : 'جودة البث';
    dd.innerHTML = `<div class="md-row on"><span>المصدر</span><b>${escapeHtml(name)}</b></div><div class="md-row"><span>الجودة</span><b>${yt ? 'تلقائية — حسب سرعة الاتصال' : 'حسب المصدر'}</b></div><p>مصدر واحد متاح لهذه المباراة. السرعة بتتغيّر من زر السرعة داخل المشغّل.</p>`;
    box.hidden = false;
    btn.addEventListener('click', () => { const o = dd.hidden; dd.hidden = !o; btn.setAttribute('aria-expanded', String(o)); box.classList.toggle('open', o); });
  };
  const mdMore = async (cur, sport, day) => {
    const sec = $('md-more'); const track = $('md-track'); if (!sec || !track) return;
    try {
      const res = await request({ action: 'fixtures', sport, date: localDate(dayOff(day)) });
      const live = (res?.fixtures || []).filter((x) => x.status === 'live' && String(x.fixture_id) !== String(cur.fixture_id)).slice(0, 12);
      if (!live.length) return;
      const crest = (n, l) => { const u = safeUrl(l); return `<span class="mc-c">${u ? `<img src="${escapeHtml(u)}" alt="" loading="lazy" decoding="async">` : `<b>${escapeHtml(String(tn(n)).charAt(0))}</b>`}</span>`; };
      const tm = (n, l) => `<div class="mc-tm">${crest(n, l)}<span class="mc-nm">${escapeHtml(tn(n))}</span></div>`;
      track.innerHTML = live.map((x) => `<a class="md-card" href="match.html?fixture=${encodeURIComponent(x.fixture_id)}&sport=${encodeURIComponent(sport)}&day=${encodeURIComponent(day)}"><div class="mc-row">${tm(x.home_team, x.home_logo)}<div class="mc-mid">${x.home_score != null ? `<b class="mc-s">${escapeHtml(String(x.home_score))} - ${escapeHtml(String(x.away_score))}</b>` : '<em>VS</em>'}</div>${tm(x.away_team, x.away_logo)}</div><span class="mc-l"><i></i>مباشر الآن</span></a>`).join('');
      sec.hidden = false;
      const step = () => Math.max(160, track.clientWidth * 0.8);
      $('md-prev')?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
      $('md-next')?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    } catch (e) { console.error('other live:', e); }
  };
  const dayOff = (v) => { const n = { yesterday: -1, today: 0, tomorrow: 1 }[v] ?? parseInt(v, 10); return Number.isFinite(n) ? Math.max(-7, Math.min(7, n)) : 0; };
  /* تعديلات الأدمن على مباريات الـ API (تأجيل/إلغاء/نتيجة/موعد) */
  /* أشهر الفرق عند الجمهور المصري (ترتيب تقديري حسب الشعبية). بيتطابق بالاسم الإنجليزي من الـ API أو العربي */
  const TOP_TEAMS = [
    /al[ -]?ahly(?! tripoli| benghazi)|الأهلي(?! السعودي)/i, /zamalek|الزمالك/i, /^egypt$|مصر$/i, /pyramids|بيراميدز/i, /ismaily|الإسماعيلي/i, /ittihad.*alex|alex.*ittihad|الاتحاد السكندري/i, /al[ -]?masry|المصري البورسعيدي/i,
    /real madrid|ريال مدريد/i, /barcelona|برشلونة/i, /liverpool|ليفربول/i, /manchester city|مانشستر سيتي/i, /manchester united|مانشستر يونايتد/i, /chelsea|تشيلسي/i, /arsenal|أرسنال/i,
    /bayern|بايرن/i, /juventus|يوفنتوس/i, /paris saint|psg|باريس سان/i,
    /inter miami|إنتر ميامي/i, /trabzonspor|طرابزون/i,
    /al[- ]?hilal|الهلال/i, /al[- ]?nassr|النصر/i, /^al[- ]?ittihad( jeddah)?$|^الاتحاد$|الاتحاد السعودي/i,
  ];
  let customTop = null; // [{en, ar}] من لوحة التحكم (site_settings.top_teams) — لو فاضي بنستخدم القائمة الأساسية
  const nz = (t) => String(t || '').toLowerCase().replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[-.]/g, ' ').replace(/\s+/g, ' ').trim();
  const isEgyLeague = (m) => String(m.league_key) === '233' || /مصر/.test(String(m.league_label || ''));
  const teamRank = (m) => {
    let best = 99;
    [m.home_team, m.away_team].forEach((n) => {
      const raw = String(n || '').trim(); let i = -1;
      if (customTop && customTop.length) {
        const ar = nz(window.YR_NAMES ? window.YR_NAMES.team(raw) : raw); const en = nz(raw);
        i = customTop.findIndex((t) => (t.en && nz(t.en) === en) || (t.ar && nz(t.ar) === ar) || (t.ar && nz(t.ar) === en));
      } else if (/^al[- ]?ittihad$|^الاتحاد$/i.test(raw)) i = isEgyLeague(m) ? 5 : 20;
      else i = TOP_TEAMS.findIndex((re) => re.test(raw));
      if (i >= 0 && i < best) best = i;
    });
    return best;
  };
  const applyOverrides = async (fixtures) => {
    const ids = fixtures.filter((m) => m.sport !== 'basketball' && Number.isSafeInteger(Number(m.fixture_id))).map((m) => Number(m.fixture_id));
    if (!db || !ids.length) return fixtures;
    try {
      const { data, error } = await db.from('fixture_overrides').select('*').in('fixture_id', ids);
      if (error || !Array.isArray(data) || !data.length) return fixtures;
      const by = new Map(data.map((o) => [Number(o.fixture_id), o]));
      return fixtures.map((m) => { const o = by.get(Number(m.fixture_id)); return o ? mergeOverride(m, o) : m; });
    } catch { return fixtures; }
  };
  const mergeOverride = (m, o) => {
    const r = { ...m, edited: true };
    if (o.status) { r.status = o.status; r.status_note = ''; if (o.status === 'postponed' || o.status === 'cancelled') { r.home_score = null; r.away_score = null; } }
    if (o.kickoff) r.kickoff = o.kickoff;
    if (o.home_score != null) r.home_score = o.home_score;
    if (o.away_score != null) r.away_score = o.away_score;
    if (o.note) r.status_note = o.note;
    if (o.hide_important) r.hide_important = true;
    else if (o.featured) r.featured = true;
    return r;
  };
  /* نسخة احتياطية للمباريات المهمة (fixture_overrides.snapshot) — تُعرض لما الـ API يفشل أو يرجع فاضي */
  const loadSnapshots = async (day) => {
    try {
      const { data, error } = await db.from('fixture_overrides').select('*').not('snapshot', 'is', null).limit(300);
      if (error || !Array.isArray(data)) return [];
      return data.map((o) => mergeOverride({ ...o.snapshot, from_snapshot: true }, o)).filter((m) => m.kickoff && cairoDay(m.kickoff) === day);
    } catch { return []; }
  };
  /* ترتيب البطولات اللي حدده الأدمن (site_settings.league_order) — لو مفيش، ترتيب الدالة الافتراضي */
  let leagueOrder = null;
  const loadLeagueOrder = async () => {
    if (leagueOrder !== null || !db) return leagueOrder || [];
    const one = async (key) => { try { return await db.from('site_settings').select('value').eq('key', key).maybeSingle(); } catch { return { data: null }; } };
    const [tt, lo] = await Promise.all([one('top_teams'), one('league_order')]);
    customTop = Array.isArray(tt?.data?.value) ? tt.data.value : null;
    leagueOrder = Array.isArray(lo?.data?.value) ? lo.data.value : [];
    return leagueOrder;
  };
  const loadManualMatches = async (day) => {
    let { data, error } = await db.from('matches')
      .select('id,home_team,away_team,league,kickoff,status,home_score,away_score,home_logo,away_logo,featured')
      .eq('is_published', true).order('kickoff', { ascending: true }).limit(100);
    if (error) ({ data, error } = await db.from('matches')
      .select('id,home_team,away_team,league,kickoff,status,home_score,away_score,home_logo,away_logo')
      .eq('is_published', true).order('kickoff', { ascending: true }).limit(100));
    if (error) ({ data, error } = await db.from('matches') // أعمدة اللوجو غير مضافة بعد
      .select('id,home_team,away_team,league,kickoff,status,home_score,away_score')
      .eq('is_published', true).order('kickoff', { ascending: true }).limit(100));
    if (error) throw error;
    const target = localDate(dayOff(day));
    return (data || []).filter((m) => {
      if (!m.kickoff) return dayOff(day) === 0;
      const t = new Date(m.kickoff).getTime();
      return Number.isFinite(t) && cairoDay(t) === target;
    }).map((m) => ({ ...m, manual: true, league_key: 'manual', league_label: m.league || 'مباريات منشورة' }));
  };

  /* ---------- بحث: توحيد الحروف العربية + أسماء عربية شائعة للفرق ---------- */
  const norm = (s) => String(s ?? '').toLowerCase()
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ').trim();
  const ALIASES = {
    'real madrid': 'ريال مدريد', barcelona: 'برشلونة', atletico: 'أتلتيكو مدريد', sevilla: 'إشبيلية', valencia: 'فالنسيا', villarreal: 'فياريال', 'real sociedad': 'ريال سوسيداد', 'athletic club': 'أتلتيك بلباو', betis: 'ريال بيتيس',
    'manchester city': 'مانشستر سيتي', 'manchester united': 'مانشستر يونايتد', liverpool: 'ليفربول', arsenal: 'أرسنال', chelsea: 'تشيلسي', tottenham: 'توتنهام', newcastle: 'نيوكاسل', 'aston villa': 'أستون فيلا', 'west ham': 'وست هام', brighton: 'برايتون', everton: 'إيفرتون',
    bayern: 'بايرن ميونخ', dortmund: 'دورتموند', 'paris saint': 'باريس سان جيرمان', juventus: 'يوفنتوس', inter: 'إنتر ميلان', milan: 'ميلان', napoli: 'نابولي', roma: 'روما', benfica: 'بنفيكا', porto: 'بورتو', ajax: 'أياكس', psv: 'آيندهوفن',
    'al ahly': 'الأهلي', zamalek: 'الزمالك', pyramids: 'بيراميدز', 'al masry': 'المصري', ismaily: 'الإسماعيلي', 'future fc': 'فيوتشر', ceramica: 'سيراميكا كليوباترا', enppi: 'إنبي', pharco: 'فاركو', smouha: 'سموحة', 'modern': 'مودرن', 'ghazl': 'غزل المحلة', 'el gouna': 'الجونة', 'national bank': 'البنك الأهلي',
    sundowns: 'صن داونز', esperance: 'الترجي', wydad: 'الوداد', raja: 'الرجاء', mazembe: 'مازيمبي',
    lakers: 'ليكرز', celtics: 'سلتيكس', warriors: 'واريرز', bulls: 'بولز', heat: 'هيت', nets: 'نتس', knicks: 'نيكس', bucks: 'باكس', suns: 'صنز', mavericks: 'مافريكس', nuggets: 'ناجتس', clippers: 'كليبرز', spurs: 'سبيرز', fenerbahce: 'فنربخشة', olympiacos: 'أولمبياكوس', panathinaikos: 'باناثينايكوس',
  };
  const ALIAS_RULES = Object.entries(ALIASES).map(([k, v]) => [new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'), v]);
  const aliasesFor = (name) => ALIAS_RULES.filter(([re]) => re.test(name)).map(([, ar]) => ar).join(' ');
  const haystack = (m) => norm(`${m.home_team} ${m.away_team} ${m.league || ''} ${m.league_label || ''} ${aliasesFor(m.home_team)} ${aliasesFor(m.away_team)} ${tn(m.home_team)} ${tn(m.away_team)}`);


  /* ---------- تفاصيل المباراة: الملخص + التشكيلة + الإحصائيات ---------- */
  const STAT_ROWS = [
    ['Ball Possession', 'الاستحواذ'], ['expected_goals', 'الأهداف المتوقعة (xG)'], ['Total Shots', 'التسديدات'], ['Shots on Goal', 'تسديدات على المرمى'], ['Shots off Goal', 'تسديدات خارج المرمى'],
    ['Blocked Shots', 'تسديدات مصدودة'], ['Corner Kicks', 'الركنيات'], ['Offsides', 'التسلل'], ['Fouls', 'الأخطاء'], ['Yellow Cards', 'بطاقات صفراء'], ['Red Cards', 'بطاقات حمراء'],
    ['Goalkeeper Saves', 'تصديات الحارس'], ['Total passes', 'التمريرات'], ['Passes accurate', 'تمريرات صحيحة'], ['Passes %', 'دقة التمرير'],
  ];
  const num = (v) => { const n = parseFloat(String(v ?? '').replace('%', '')); return Number.isFinite(n) ? n : null; };
  const statValue = (v) => (v == null ? '0' : String(v));
  const emptyMsg = (text) => `<p class="note empty-note">${escapeHtml(text)}</p>`;

  const eventIcon = (e) => {
    if (e.type === 'goal') return /own/i.test(e.detail) ? '⚽<small>عكسي</small>' : /missed/i.test(e.detail) ? '✖<small>ركلة ضائعة</small>' : /penalty/i.test(e.detail) ? '⚽<small>ركلة جزاء</small>' : '⚽';
    if (e.type === 'card') return /red/i.test(e.detail) ? '<span class="card red"></span>' : '<span class="card yellow"></span>';
    if (e.type === 'subst') return '🔄';
    if (e.type === 'var') return '📺';
    return '•';
  };
  const eventText = (e) => {
    if (e.type === 'subst') return `<b>${escapeHtml(pn(e.assist))}</b><span class="ev-sub"> ↔ ${escapeHtml(pn(e.player))}</span>`;
    const assist = e.type === 'goal' && e.assist ? `<span class="ev-sub"> صناعة: ${escapeHtml(pn(e.assist))}</span>` : '';
    return `<b>${escapeHtml(pn(e.player))}</b>${assist}`;
  };
  const renderSummary = (m, res) => {
    const events = (res.events || []).filter((e) => ['goal', 'card', 'subst', 'var'].includes(e.type));
    if (!events.length) return emptyMsg(m.status === 'scheduled' ? 'الأحداث تظهر بعد بداية المباراة.' : 'لا توجد أحداث مسجلة لهذه المباراة.');
    return `<ol class="events">${events.map((e) => {
      const home = e.team_id != null && e.team_id === m.home_id;
      const min = `${e.minute ?? ''}${e.extra ? `+${e.extra}` : ''}'`;
      return `<li class="ev ${home ? 'ev-home' : 'ev-away'}"><span class="ev-side">${home ? `<span class="ev-ico">${eventIcon(e)}</span><span class="ev-txt">${eventText(e)}</span>` : ''}</span><span class="ev-min">${escapeHtml(min)}</span><span class="ev-side">${!home ? `<span class="ev-ico">${eventIcon(e)}</span><span class="ev-txt">${eventText(e)}</span>` : ''}</span></li>`;
    }).join('')}</ol>`;
  };

  /* ---------- صور اللاعبين ونافذة بيانات اللاعب ---------- */
  const photoOf = (id) => (Number.isSafeInteger(Number(id)) && Number(id) > 0 ? `https://media.api-sports.io/football/players/${Number(id)}.png` : '');
  const photoImg = (id) => { const u = photoOf(id); return u ? `<img src="${u}" alt="" loading="lazy" decoding="async">` : ''; };
  document.addEventListener('error', (e) => { const c = e.target?.tagName === 'IMG' && e.target.closest('.crest'); if (c) { const n = c.parentElement?.querySelector('.team-name')?.textContent || ''; e.target.remove(); c.classList.add('nologo'); const w = n.trim().replace(/(^|\s)ال(?=\S)/g, '$1').split(/\s+/).filter(Boolean); c.textContent = w.length > 1 ? w[0][0] + w[1][0] : (w[0] || '⚽').slice(0, 2); } }, true);
  document.addEventListener('error', (e) => { if (e.target?.tagName === 'IMG' && e.target.closest('.pl-img,.sq-img,.pm-photo')) e.target.remove(); }, true);
  const POS_AR = { Goalkeeper: 'حارس مرمى', Defender: 'مدافع', Midfielder: 'لاعب وسط', Attacker: 'مهاجم', G: 'حارس مرمى', D: 'مدافع', M: 'لاعب وسط', F: 'مهاجم' };
  const COUNTRY_AR = { Egypt: 'مصر', Morocco: 'المغرب', Algeria: 'الجزائر', Tunisia: 'تونس', 'Saudi-Arabia': 'السعودية', 'Saudi Arabia': 'السعودية', Senegal: 'السنغال', Nigeria: 'نيجيريا', Ghana: 'غانا', Cameroon: 'الكاميرون', 'Ivory-Coast': 'ساحل العاج', 'Ivory Coast': 'ساحل العاج', Mali: 'مالي', 'South-Africa': 'جنوب أفريقيا', Spain: 'إسبانيا', England: 'إنجلترا', France: 'فرنسا', Germany: 'ألمانيا', Italy: 'إيطاليا', Portugal: 'البرتغال', Netherlands: 'هولندا', Belgium: 'بلجيكا', Brazil: 'البرازيل', Argentina: 'الأرجنتين', Uruguay: 'الأوروغواي', Colombia: 'كولومبيا', Croatia: 'كرواتيا', Turkey: 'تركيا', Greece: 'اليونان', Scotland: 'اسكتلندا', Wales: 'ويلز', Ireland: 'أيرلندا', Switzerland: 'سويسرا', Austria: 'النمسا', Denmark: 'الدنمارك', Sweden: 'السويد', Norway: 'النرويج', Poland: 'بولندا', Serbia: 'صربيا', Ukraine: 'أوكرانيا', Russia: 'روسيا', Japan: 'اليابان', 'South-Korea': 'كوريا الجنوبية', USA: 'الولايات المتحدة', Canada: 'كندا', Mexico: 'المكسيك', Chile: 'تشيلي', Ecuador: 'الإكوادور', Paraguay: 'باراغواي', Peru: 'بيرو', Venezuela: 'فنزويلا', Iran: 'إيران', Iraq: 'العراق', Jordan: 'الأردن', Syria: 'سوريا', Lebanon: 'لبنان', Palestine: 'فلسطين', UAE: 'الإمارات', 'United-Arab-Emirates': 'الإمارات', Qatar: 'قطر', Kuwait: 'الكويت', Oman: 'عُمان', Sudan: 'السودان', Libya: 'ليبيا', Gabon: 'الغابون', Guinea: 'غينيا', 'DR-Congo': 'الكونغو الديمقراطية', Congo: 'الكونغو', Angola: 'أنغولا', Zambia: 'زامبيا', Zimbabwe: 'زيمبابوي', Kenya: 'كينيا', Uganda: 'أوغندا', Tanzania: 'تنزانيا', Ethiopia: 'إثيوبيا', 'Burkina-Faso': 'بوركينا فاسو', 'Cape-Verde': 'الرأس الأخضر', Albania: 'ألبانيا', Slovenia: 'سلوفينيا', Slovakia: 'سلوفاكيا', 'Czech-Republic': 'التشيك', Hungary: 'المجر', Romania: 'رومانيا', Bulgaria: 'بلغاريا', Finland: 'فنلندا', Iceland: 'آيسلندا', 'Bosnia-and-Herzegovina': 'البوسنة والهرسك', Georgia: 'جورجيا', Israel: 'إسرائيل', China: 'الصين', India: 'الهند', Australia: 'أستراليا', 'New-Zealand': 'نيوزيلندا' };
  const countryAr = (c) => (c ? COUNTRY_AR[c] || COUNTRY_AR[String(c).replace(/\s+/g, '-')] || c : '');
  const posAr = (p) => (p ? POS_AR[p] || p : '');
  const unitAr = (v) => String(v || '').replace(/\s*cm\b/i, ' سم').replace(/\s*kg\b/i, ' كجم');
  const dash = (v) => (v == null || v === '' || v === 0 ? '—' : v);
  const fmtBirth = (d) => (d ? new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) : '');

  let lastFocus = null;
  const closeModal = () => { const m = document.querySelector('.pmodal'); if (m) { m.remove(); document.body.classList.remove('modal-open'); lastFocus?.focus?.(); } };
  const openModal = (html) => {
    closeModal(); lastFocus = document.activeElement;
    const el = document.createElement('div'); el.className = 'pmodal'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="pmodal-back" data-close></div><div class="pmodal-card"><button type="button" class="pmodal-x" data-close aria-label="إغلاق">✕</button><div class="pmodal-body">${html}</div></div>`;
    el.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
    document.body.appendChild(el); document.body.classList.add('modal-open');
    el.querySelector('.pmodal-x').focus();
    return el.querySelector('.pmodal-body');
  };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  const playerHead = (name, photoId, extra = '') => `<div class="pm-head"><span class="pm-photo">${photoImg(photoId)}</span><div><h3>${escapeHtml(pn(name))}</h3>${extra}</div></div>`;
  const openPlayer = async (id, hint = {}) => {
    const body = openModal(`${playerHead(hint.name || '', id)}<p class="note">جارٍ تحميل بيانات اللاعب…</p>`);
    try {
      const r = await request({ action: 'player', sport: 'football', playerId: Number(id) });
      const p = r.player; const s = r.stats || {};
      const teamLine = r.team?.name ? `<span class="pm-team">${r.team.logo ? `<img src="${escapeHtml(safeUrl(r.team.logo))}" alt="">` : ''}${escapeHtml(tn(r.team.name))}</span>` : '';
      const facts = [['المركز', posAr(r.position)], ['الرقم', r.number], ['العمر', p.age ? `${p.age} سنة` : ''], ['الجنسية', countryAr(p.nationality)], ['الطول', unitAr(p.height)], ['الوزن', unitAr(p.weight)], ['تاريخ الميلاد', fmtBirth(p.birth)], ['بلد الميلاد', countryAr(p.birth_country)]].filter(([, v]) => v);
      body.innerHTML = `${playerHead(p.name || hint.name, id, teamLine)}
        <dl class="pm-facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHtml(v)}</dd></div>`).join('')}</dl>
        <h4 class="pm-sub">إحصائيات موسم ${escapeHtml(r.season)}/${escapeHtml(String(Number(r.season) + 1).slice(2))}</h4>
        <div class="pm-stats">${[['مباريات', s.appearances], ['أهداف', s.goals], ['تمريرات حاسمة', s.assists], ['دقائق', s.minutes], ['إنذارات', s.yellow], ['طرد', s.red], ['التقييم', s.rating]].map(([k, v]) => `<div><b>${v == null || v === '' ? '—' : escapeHtml(v)}</b><span>${k}</span></div>`).join('')}</div>`;
    } catch (e) {
      console.error('player:', e);
      const bits = [hint.number ? `<span>الرقم ${escapeHtml(hint.number)}</span>` : '', hint.pos ? `<span>${escapeHtml(posAr(hint.pos))}</span>` : ''].join('');
      body.innerHTML = `${playerHead(hint.name || '', id, `<div class="pm-chips">${bits}</div>`)}<p class="note">بيانات اللاعب التفصيلية غير متاحة حاليًا. حاول بعد قليل.</p>`;
    }
  };
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-pid]'); if (!el) return;
    const id = Number(el.dataset.pid);
    if (id > 0) location.href = `footballer.html?id=${id}`;
  });
  const pAttrs = (p) => (p.id > 0 ? ` data-pid="${p.id}" data-pname="${escapeHtml(p.name || '')}" data-pno="${escapeHtml(p.number ?? '')}" data-ppos="${escapeHtml(p.pos || '')}"` : '');

  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('.ts-btn'); if (!b) return;
    const root = b.closest('#tab-lineup') || document;
    root.querySelectorAll('.ts-btn').forEach((x) => { const on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-selected', on); });
    root.querySelectorAll('.pitch-wrap').forEach((w) => { w.hidden = w.dataset.team !== b.dataset.lt; });
  });
  const shortName = (name) => pn(name);
  const pitchPlayers = (lineup, isHome) => {
    const rows = new Map();
    lineup.start.forEach((p) => {
      const [r, c] = String(p.grid || '').split(':').map(Number);
      if (!Number.isFinite(r) || !Number.isFinite(c)) return;
      if (!rows.has(r)) rows.set(r, []);
      rows.get(r).push({ ...p, c });
    });
    const rmax = Math.max(...rows.keys(), 1);
    const out = [];
    rows.forEach((arr, r) => {
      arr.sort((a, b) => a.c - b.c);
      arr.forEach((p, i) => {
        const x = arr.length === 1 ? 50 : 15 + (i / (arr.length - 1)) * 70;
        const t = rmax === 1 ? 0 : (r - 1) / (rmax - 1);
        const y = 88 - t * 76; // الحارس أسفل والمهاجمون أعلى، والملعب كله لفريق واحد
        out.push(`<${p.id > 0 ? 'button type="button"' : 'div'} class="pl ${isHome ? 'pl-home' : 'pl-away'}"${pAttrs(p)} style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%"><span class="pl-img">${photoImg(p.id)}</span><span class="pl-no">${escapeHtml(p.number ?? '')}</span><span class="pl-name">${escapeHtml(shortName(p.name))}</span></${p.id > 0 ? 'button' : 'div'}>`);
      });
    });
    return out.join('');
  };
  const pitchBox = (l, isHome, hidden, name = '') => `<div class="pitch-wrap" data-team="${isHome ? 'home' : 'away'}"${hidden ? ' hidden' : ''}><div class="pitch" dir="ltr" aria-label="تشكيلة الفريق"><i class="pitch-mid"></i><i class="pitch-circle"></i><i class="pitch-box top"></i><i class="pitch-box bottom"></i>${pitchPlayers(l, isHome)}<span class="pt-team" dir="rtl">${escapeHtml(name)}</span><span class="pt-brand">YALLA RIYADA</span><span class="pt-form">${escapeHtml(l.formation || '')}</span></div>${l.coach ? `<div class="coach-card"><span class="cc-av">${safeUrl(l.coach_photo) ? `<img src="${escapeHtml(safeUrl(l.coach_photo))}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}<i>${escapeHtml(String(pn(l.coach)).trim().charAt(0))}</i></span><span class="cc-tx"><b>${escapeHtml(pn(l.coach))}</b><small>المدرب</small></span></div>` : ''}</div>`;
  const benchList = (title, lineup, teamName) => `<div class="bench"><h3>${escapeHtml(title)}</h3>
      <ul>${lineup.subs.map((p) => `<li${pAttrs(p)} class="${p.id > 0 ? 'clickable' : ''}"><span class="sq-img sm">${photoImg(p.id)}</span><span class="pl-no sm">${escapeHtml(p.number ?? '')}</span>${escapeHtml(shortName(p.name))}</li>`).join('') || '<li class="note">لا يوجد احتياط معلن.</li>'}</ul></div>`;
  const renderLineup = (m, res) => {
    const lineups = res.lineups || [];
    const home = lineups.find((l) => l.team_id === m.home_id);
    const away = lineups.find((l) => l.team_id === m.away_id);
    if (!home || !away || !home.start.length || !away.start.length) return emptyMsg('التشكيلة لم تُعلن بعد، وتظهر عادةً قبل المباراة بحوالي ساعة.');
    const gridOk = [...home.start, ...away.start].every((p) => /^\d+:\d+$/.test(String(p.grid || '')));
    const H = tn(m.home_team); const A = tn(m.away_team);
    const pitch = gridOk
      ? `<div class="team-switch" role="tablist" aria-label="اختر الفريق"><button type="button" class="ts-btn active" data-lt="home" aria-selected="true"><span>${escapeHtml(H)}</span><b dir="ltr">${escapeHtml(home.formation)}</b></button><button type="button" class="ts-btn" data-lt="away" aria-selected="false"><span>${escapeHtml(A)}</span><b dir="ltr">${escapeHtml(away.formation)}</b></button></div>
         <div class="pitch-stage">${pitchBox(home, true, false, H)}${pitchBox(away, false, true, A)}</div>`
      : `<div class="starters">${[[H, home], [A, away]].map(([n, l]) => `<div class="bench"><h3>${escapeHtml(n)} <small dir="ltr">${escapeHtml(l.formation)}</small></h3><ul>${l.start.map((p) => `<li${pAttrs(p)} class="${p.id > 0 ? 'clickable' : ''}"><span class="sq-img sm">${photoImg(p.id)}</span><span class="pl-no sm">${escapeHtml(p.number ?? '')}</span>${escapeHtml(shortName(p.name))}</li>`).join('')}</ul></div>`).join('')}</div>`;
    return `${pitch}<div class="benches">${benchList(`احتياط ${H}`, home)}${benchList(`احتياط ${A}`, away)}</div>`;
  };

  const renderStats = (m, res) => {
    const h = (res.stats || {})[String(m.home_id)] || {};
    const a = (res.stats || {})[String(m.away_id)] || {};
    const rows = STAT_ROWS.filter(([k]) => k in h || k in a);
    if (!rows.length) return emptyMsg(m.status === 'scheduled' ? 'الإحصائيات تظهر بعد بداية المباراة.' : 'لا توجد إحصائيات متاحة لهذه المباراة.');
    return `<div class="stat-head"><span>${escapeHtml(tn(m.home_team))}</span><span>${escapeHtml(tn(m.away_team))}</span></div>` + rows.map(([k, label]) => {
      const hv = num(h[k]) ?? 0; const av = num(a[k]) ?? 0;
      const total = hv + av;
      const hp = total ? (hv / total) * 100 : 50;
      return `<div class="stat"><div class="stat-nums"><b>${escapeHtml(statValue(h[k]))}</b><span>${escapeHtml(label)}</span><b>${escapeHtml(statValue(a[k]))}</b></div>
        <div class="sbar"><i style="width:${hp.toFixed(1)}%"></i><i class="away" style="width:${(100 - hp).toFixed(1)}%"></i></div></div>`;
    }).join('');
  };

  const renderInfo = (m, res, manualInfo) => {
    const i = res.info || {}; const mi = manualInfo || {};
    const rows = [
      ['القناة الناقلة', mi.channel], ['المعلّق', mi.commentator],
      ['البطولة', m.league_label || m.league], ['الجولة', i.round],
      ['الملعب', [i.venue, i.city].filter(Boolean).join(' — ')], ['الحكم', i.referee],
      ['الموعد', formatDate(m.kickoff)],
    ].filter(([, v]) => v);
    const extra = mi.notes ? `<p class="info-note">${escapeHtml(mi.notes)}</p>` : '';
    if (!rows.length) return emptyMsg('لا توجد تفاصيل إضافية لهذه المباراة.');
    return `<dl class="info-list">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHtml(k === 'الملعب' ? tn(v) : k === 'الحكم' ? pn(v) : v)}</dd></div>`).join('')}</dl>${extra}`;
  };

  const manualSide = (s, teamId) => ({
    team_id: teamId, formation: s.formation || '', coach: s.coach || '',
    start: (s.start || []).map((p) => ({ id: null, name: p.name, number: p.number, pos: null, grid: p.grid || null })),
    subs: (s.subs || []).map((p) => ({ id: null, name: p.name, number: p.number, pos: null, grid: null })),
  });

  function renderDetails(m0, res0, manual, manualInfo) {
    let m = m0; let res = res0;
    if (manual?.home?.start?.length && manual?.away?.start?.length) {
      m = { ...m0, home_id: m0.home_id ?? -1, away_id: m0.away_id ?? -2 };
      res = { ...res0, lineups: [manualSide(manual.home, m.home_id), manualSide(manual.away, m.away_id)] };
    }
    if (manual?.events?.length) res = { ...res, events: manual.events.map((e) => ({ ...e, team_id: e.side === 'away' ? m.away_id : m.home_id })) };
    const body = $('match-body');
    $('tab-summary').innerHTML = renderSummary(m, res);
    $('tab-lineup').innerHTML = renderLineup(m, res);
    $('tab-stats').innerHTML = renderStats(m, res);
    if ($('tab-info')) $('tab-info').innerHTML = renderInfo(m, res, manualInfo);
    body.hidden = false;
    const grid = document.querySelector('.watch-grid'); let lastContent = 'summary';
    const select = (name) => {
      if (name !== 'player') lastContent = name;
      body.querySelectorAll('[data-tab]').forEach((b) => { const on = b.dataset.tab === name; b.classList.toggle('active', on); b.classList.toggle('was', name === 'player' && b.dataset.tab === lastContent); b.setAttribute('aria-selected', String(on)); });
      // «المشغّل» لا يخفي لوحات التفاصيل بالـ hidden حتى تظل ظاهرة على الكمبيوتر (يخفيها CSS على الموبايل فقط)
      if (name !== 'player') ['summary', 'lineup', 'stats', 'info'].forEach((t) => { if ($(`tab-${t}`)) $(`tab-${t}`).hidden = t !== name; });
      if (grid) grid.dataset.view = name;
    };
    window.yrSelectTab = select;
    if (grid) { grid.classList.add('tabbed'); grid.dataset.view = 'summary'; }
    body.querySelector('.tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) select(b.dataset.tab); });
    // قبل المباراة: افتح التشكيلة لو أُعلنت
    if (m.status === 'scheduled' && (res.lineups || []).length) select('lineup');
  }

  /* ======================================================================
     صفحة مركز المباريات
     ====================================================================== */
  if (page === 'matches.html') {
    const host = $('matches-list');
    if (!host) return;
    const params = new URLSearchParams(location.search);
    const state = {
      sport: SPORT_NAME[params.get('sport')] ? params.get('sport') : 'football',
      day: String(dayOff(params.get('day'))),
      league: params.get('league') || 'all',
      q: '',
      fav: false,
      st: 'all',
    };
    let data = { fixtures: [], leagues: [], manual: [], error: '' };
    let token = 0;
    let closed = new Set(); try { closed = new Set(JSON.parse(localStorage.getItem('yr-lg-closed') || '[]')); } catch { /* اختياري */ }
    host.addEventListener('click', (e) => {
      const h = e.target.closest('.league-title[data-lg]'); if (!h) return;
      const k = h.dataset.lg; const sec = h.closest('.league-group'); const off = !sec.classList.contains('closed');
      sec.classList.toggle('closed', off); if (off) closed.add(k); else closed.delete(k);
      try { localStorage.setItem('yr-lg-closed', JSON.stringify([...closed].slice(-40))); } catch { /* اختياري */ }
    });
    host.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.league-title[data-lg]')) { e.preventDefault(); e.target.click(); } });

    const syncUrl = () => {
      const p = new URLSearchParams({ sport: state.sport, day: state.day });
      if (state.league !== 'all') p.set('league', state.league);
      try { history.replaceState(null, '', `?${p}`); } catch { /* لا مشكلة */ }
    };
    const renderDays = () => {
      const strip = $('day-strip'); if (!strip) return;
      const cur = dayOff(state.day);
      if (!strip.dataset.built) {
        strip.dataset.built = '1';
        strip.innerHTML = Array.from({ length: 15 }, (_, i) => i - 7).map((o) => {
          const d = new Date(`${localDate(o)}T12:00:00Z`);
          const wk = o === 0 ? 'اليوم' : o === -1 ? 'أمس' : o === 1 ? 'غدًا' : d.toLocaleDateString('ar-EG', { weekday: 'long', timeZone: 'UTC' });
          const num = d.toLocaleDateString('ar-EG', { day: 'numeric', timeZone: 'UTC' });
          const mon = d.toLocaleDateString('ar-EG', { month: 'short', timeZone: 'UTC' });
          return `<button type="button" class="dchip${o === 0 ? ' is-today' : ''}" data-off="${o}"><small>${wk}</small><b>${num}</b><em>${mon}</em></button>`;
        }).join('');
      }
      strip.querySelectorAll('.dchip').forEach((b) => { const on = Number(b.dataset.off) === cur; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); if (on) { try { strip.scrollTo({ left: b.offsetLeft - strip.clientWidth / 2 + b.offsetWidth / 2, behavior: 'smooth' }); } catch { /* قديم */ } } });
      const pv = $('day-prev-btn'); const nx = $('day-next-btn');
      if (pv) pv.disabled = cur >= 7; if (nx) nx.disabled = cur <= -7;
    };
    const goDay = (o) => { const n = Math.max(-7, Math.min(7, o)); if (String(n) === state.day) return; host.classList.remove('swipe-l', 'swipe-r'); void host.offsetWidth; host.classList.add(n > dayOff(state.day) ? 'swipe-r' : 'swipe-l'); state.day = String(n); syncUrl(); load(); };
    const paintControls = () => {
      document.querySelectorAll('[data-sport]').forEach((b) => { const on = b.dataset.sport === state.sport; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); });
      renderDays();
      document.querySelectorAll('.dq-b[data-q]').forEach((b) => { const on = Number(b.dataset.q) === dayOff(state.day); b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
      const nm = $('sc-nm'); const ic = $('sc-ic'); if (nm) nm.textContent = SPORT_NAME[state.sport]; if (ic) ic.textContent = SPORT_ICON[state.sport];
    };

    const all = () => (state.sport === 'football' ? [...data.fixtures, ...data.manual] : data.fixtures);
    const leagueList = () => {
      const list = all();
      const rows = [{ key: 'all', label: 'كل البطولات', n: list.length, logo: '' }, ...[...data.leagues].sort((x, y) => { const f = (l) => { const i = (leagueOrder || []).findIndex((c) => String(c.k) === l.key || c.l === l.label); return i >= 0 ? i : 1000; }; return f(x) - f(y); }).map((l) => ({ key: l.key, label: l.label, n: list.filter((m) => m.league_key === l.key).length, logo: safeUrl(list.find((m) => m.league_key === l.key && m.league_logo)?.league_logo) }))];
      if (state.sport === 'football' && data.manual.length) rows.push({ key: 'manual', label: 'مباريات منشورة', n: data.manual.length, logo: '' });
      return rows;
    };
    const renderChips = () => {
      const cur = leagueList().find((c) => c.key === state.league); const el = $('lg-cur'); if (el) el.textContent = cur ? cur.label : 'كل البطولات';
      const fb = $('fav-filter'); if (fb) { fb.setAttribute('aria-pressed', String(state.fav)); fb.classList.toggle('on', state.fav); const n = $('fav-n'); if (n) n.textContent = favSet.size ? String(favSet.size) : ''; }
    };
    const closeSheet = () => { const o = $('lg-sheet'); if (o) { o.classList.remove('on'); setTimeout(() => o.remove(), 180); } document.removeEventListener('keydown', escSheet); };
    const escSheet = (e) => { if (e.key === 'Escape') closeSheet(); };
    const openSheet = () => {
      if ($('lg-sheet')) return;
      const o = document.createElement('div'); o.id = 'lg-sheet'; o.className = 'lg-sheet';
      o.innerHTML = '<div class="lg-panel" role="dialog" aria-modal="true" aria-label="اختيار البطولة"><div class="lg-ph"><h2>البطولات</h2><button type="button" class="lg-x" aria-label="إغلاق">✕</button></div><label class="lg-find"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><input id="lg-q" type="search" placeholder="ابحث عن بطولة" autocomplete="off"></label><div class="lg-list" id="lg-list"></div></div>';
      document.body.append(o); requestAnimationFrame(() => o.classList.add('on'));
      const paint = () => {
        const q = norm($('lg-q').value); const rows = leagueList().filter((c) => !q || norm(c.label).includes(q));
        $('lg-list').innerHTML = rows.map((c) => `<button type="button" class="lg-row${state.league === c.key ? ' on' : ''}" data-league="${escapeHtml(c.key)}">${c.logo ? `<img src="${escapeHtml(c.logo)}" alt="" loading="lazy">` : '<span class="lg-ph0" aria-hidden="true">⚽</span>'}<span>${escapeHtml(c.label)}</span><small>${c.n}</small><i class="lg-ck" aria-hidden="true"></i></button>`).join('') || '<p class="note">مفيش بطولة بالاسم ده.</p>';
      };
      paint();
      $('lg-q').addEventListener('input', paint);
      o.addEventListener('click', (e) => {
        if (e.target === o || e.target.closest('.lg-x')) return closeSheet();
        const b = e.target.closest('[data-league]'); if (!b) return;
        state.league = b.dataset.league; syncUrl(); closeSheet(); render();
      });
      document.addEventListener('keydown', escSheet);
    };
    const stOf = (m) => (m.status === 'live' ? 'live' : m.status === 'finished' ? 'fin' : 'up');
    const renderSeg = () => {
      const box = $('st-seg'); if (!box) return;
      const list = all(); const c = { all: list.length, live: 0, up: 0, fin: 0 }; list.forEach((m) => { c[stOf(m)] += 1; });
      box.innerHTML = [['all', 'الكل'], ['live', 'مباشرة'], ['up', 'قادمة'], ['fin', 'منتهية']].map(([k, l]) => `<button type="button" data-st="${k}" class="${k === 'live' ? 'is-live' : ''}" aria-pressed="${state.st === k}">${k === 'live' ? '<i class="ld" aria-hidden="true"></i>' : ''}<span>${l}</span><em>${c[k].toLocaleString('ar-EG')}</em></button>`).join('');
    };
    const render = () => {
      paintControls(); renderChips(); renderSeg();
      const q = norm(state.q);
      const rows = all()
        .filter((m) => state.league === 'all' || m.league_key === state.league)
        .filter((m) => state.st === 'all' || stOf(m) === state.st)
        .filter((m) => !state.fav || favSet.has(favKey(m)) || isFollowed(m))
        .filter((m) => !q || q.split(' ').every((w) => haystack(m).includes(w)));
      const count = $('results-count');
      if (data.error && !rows.length) {
        host.innerHTML = `<div class="empty-state"><p>${escapeHtml(data.error)}</p><button class="btn outline" type="button" id="retry">إعادة المحاولة</button></div>`;
        if (count) count.textContent = '';
        return;
      }
      if (!rows.length) {
        host.innerHTML = `<div class="empty-state"><p>${q ? 'لا توجد مباريات مطابقة لبحثك.' : (state.fav ? 'مفيش مباريات مفضلة في اليوم ده. اضغط على ⭐ في أي مباراة لإضافتها.' : `لا توجد مباريات ${SPORT_NAME[state.sport]} في البطولات المهمة لهذا اليوم.`)}</p>${q || state.league !== 'all' ? '<button class="btn outline" type="button" id="reset-filters">إزالة التصفية</button>' : ''}</div>`;
        if (count) count.textContent = '';
        return;
      }
      // تجميع حسب البطولة. أولًا «مباريات مهمة» (يحددها الأدمن)، ثم البطولات بالترتيب المحدد
      const custom = leagueOrder || [];
      const base = [...data.leagues.map((l) => l.key), 'manual'];
      const pos = (k, label) => { const i = custom.findIndex((c) => String(c.k) === String(k) || (c.l && c.l === label)); return i >= 0 ? i : 1000 + ((base.indexOf(k) + 1) || 99); };
      const groups = new Map();
      rows.forEach((m) => { if (!groups.has(m.league_key)) groups.set(m.league_key, []); groups.get(m.league_key).push(m); });
      const rank = (m) => (m.status === 'live' ? 0 : 1);
      const byTime = (a, b) => rank(a) - rank(b) || teamRank(a) - teamRank(b) || new Date(a.kickoff || 0) - new Date(b.kickoff || 0);
      const keys = [...groups.keys()].sort((a, b) => pos(a, groups.get(a)[0].league_label) - pos(b, groups.get(b)[0].league_label));
      const card = (m) => (m.manual ? manualCard(m) : fixtureCard(m, state));
      const secOf = (m) => (m.status === 'live' ? 'live' : m.status === 'finished' ? 'fin' : 'up');
      const SEC = { live: ['مباريات مباشرة', 'bolt'], up: ['المباريات القادمة', 'cal'], fin: ['المباريات المنتهية', 'cup'] };
      const SEC_ICO = { bolt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>', cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>', cup: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v5a5 5 0 01-10 0zM7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3M12 14v4M8.5 20h7"/></svg>' };
      const sections = ['live', 'up', 'fin'].map((sk) => {
        const part = rows.filter((m) => secOf(m) === sk); if (!part.length) return '';
        const gs = new Map(); part.forEach((m) => { if (!gs.has(m.league_key)) gs.set(m.league_key, []); gs.get(m.league_key).push(m); });
        const ks = [...gs.keys()].sort((a, b) => pos(a, gs.get(a)[0].league_label) - pos(b, gs.get(b)[0].league_label));
        const shut = closed.has('s-' + sk) || (sk === 'fin' && !q && !closed.has('s-fin-open') && rows.some((m) => secOf(m) !== 'fin'));
        const body = ks.map((k) => { const items = gs.get(k).sort(byTime); const logo = safeUrl(items.find((m) => m.league_logo)?.league_logo);
          return `<div class="lg-sub">${logo ? `<img src="${escapeHtml(logo)}" alt="" loading="lazy" decoding="async">` : ''}<span>${escapeHtml(items[0].league_label)}</span><small>${items.length}</small></div><div class="match-grid">${items.map(card).join('')}</div>`; }).join('');
        return `<section class="st-sec ${sk}${shut ? ' closed' : ''}" aria-label="${SEC[sk][0]}"><button type="button" class="st-head" data-sec="${sk}" aria-expanded="${!shut}"><span class="st-ic">${SEC_ICO[SEC[sk][1]]}</span><b>${SEC[sk][0]}</b><small>${part.length}</small>${sk === 'live' ? '<em class="st-live">مباشر الآن</em>' : ''}<i class="lg-chev" aria-hidden="true"></i></button><div class="st-body">${body}</div></section>`;
      }).join('');
      host.innerHTML = sections;
      if (count) count.textContent = `${rows.length} ${rows.length === 1 ? 'مباراة' : 'مباراة'}${q ? ' مطابقة للبحث' : ''}`;
    };

    async function load() {
      const my = ++token;
      host.setAttribute('aria-busy', 'true');
      host.innerHTML = '<div class="skeleton-list" aria-hidden="true"><div></div><div></div><div></div></div>';
      $('results-count') && ($('results-count').textContent = 'جارٍ التحميل…');
      data = { fixtures: [], leagues: [], manual: [], error: '' };
      if (!db) { data.error = 'بيانات Supabase غير مكتملة. أضف رابط المشروع والمفتاح في supabase-config.js.'; host.removeAttribute('aria-busy'); return render(); }
      const orderP = loadLeagueOrder(); // بالتوازي مع طلب المباريات بدل ما ينتظرها
      const [api, manual] = await Promise.allSettled([
        request({ action: 'fixtures', sport: state.sport, date: localDate(dayOff(state.day)) }),
        state.sport === 'football' ? loadManualMatches(state.day) : Promise.resolve([]),
      ]);
      if (my !== token) return; // وصل رد قديم بعد تغيير الاختيار
      let late = false; // تعديلات الأدمن وعلامة «شاهد» بتتحمّل بعد أول عرض عشان الصفحة تظهر أسرع
      if (api.status === 'fulfilled') { data.fixtures = api.value?.fixtures || []; data.leagues = api.value?.leagues || []; late = true; }
      else { console.error('matches:', api.reason); data.error = 'فيه عطل مؤقت في مصدر المباريات دلوقتي، ونعمل على إصلاحه. جرّب تاني بعد شوية.'; }
      if (state.sport === 'football' && (api.status !== 'fulfilled' || !data.fixtures.length)) {
        const saved = await loadSnapshots(localDate(dayOff(state.day))); if (my !== token) return;
        if (saved.length) { data.fixtures = saved; data.leagues = []; data.error = ''; data.fromSnapshot = true; late = true; }
        else { const sr = await srFixtures(localDate(dayOff(state.day))); if (my !== token) return; if (sr) { data.fixtures = sr.fixtures; data.leagues = sr.leagues || []; data.error = ''; data.fromBackup = true; late = true; } }
      }
      await orderP; if (my !== token) return;
      if (manual.status === 'fulfilled') data.manual = manual.value;
      host.removeAttribute('aria-busy');
      if (state.league !== 'all' && !data.leagues.some((l) => l.key === state.league) && state.league !== 'manual') state.league = 'all';
      render();
      loadFollows().then(() => render());
      if (late && data.fixtures.length) {
        const ov = await applyOverrides(data.fixtures); if (my !== token) return;
        data.fixtures = ov; await markStreams(data.fixtures); if (my !== token) return;
        if (ov.some((m) => m.edited || m.has_stream)) render();
      }
    }

    /* أحداث */
    document.querySelectorAll('[data-sport]').forEach((b) => b.addEventListener('click', () => { if (state.sport === b.dataset.sport) return; state.sport = b.dataset.sport; state.league = 'all'; syncUrl(); load(); }));
    /* سحب بالإصبع يمين/شمال لتقليب الأيام (موبايل) */
    let sx = 0, sy = 0, st = 0;
    host.addEventListener('touchstart', (e) => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; st = Date.now(); }, { passive: true });
    host.addEventListener('touchend', (e) => {
      const t = e.changedTouches[0]; const dx = t.clientX - sx; const dy = t.clientY - sy;
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.6 || Date.now() - st > 700) return;
      goDay(dayOff(state.day) + (dx > 0 ? 1 : -1));
    }, { passive: true });
    $('day-strip')?.addEventListener('click', (e) => { const b = e.target.closest('.dchip'); if (b) goDay(Number(b.dataset.off)); });
    // حالة المباراة + اختيار اليوم السريع + التاريخ
    $('st-seg')?.addEventListener('click', (e) => { const b = e.target.closest('button[data-st]'); if (!b) return; state.st = b.dataset.st; render(); });
    document.querySelectorAll('.dq-b[data-q]').forEach((b) => b.addEventListener('click', () => goDay(Number(b.dataset.q))));
    const pick = $('day-pick');
    if (pick) {
      pick.min = localDate(-7); pick.max = localDate(7);
      pick.addEventListener('change', () => { if (!pick.value) return; const off = Math.round((Date.parse(pick.value + 'T00:00:00Z') - Date.parse(localDate(0) + 'T00:00:00Z')) / 864e5); if (off < -7 || off > 7) { pick.value = ''; return; } goDay(off); });
    }
    // تذكير قبل المباراة (زر الجرس)
    const loadBells = async () => { try { const { data: s0 } = await db.auth.getSession(); if (!s0?.session) return; const r = await db.from('match_reminders').select('fixture_id').is('sent_at', null); if (r.error) return; bells = new Set((r.data || []).map((x) => Number(x.fixture_id))); render(); } catch { /* الجدول لسه متفعّلش */ } };
    host.addEventListener('click', async (e) => {
      const b = e.target.closest('.mx-bell'); if (!b) return; e.preventDefault(); e.stopPropagation();
      const fid = Number(b.dataset.bell); const { data: s0 } = await db.auth.getSession(); const u = s0?.session?.user;
      if (!u) { if (window.yrLogin) window.yrLogin('سجّل دخولك علشان نذكّرك قبل المباراة'); else location.href = 'account.html'; return; }
      const on = !bells.has(fid); b.disabled = true;
      try {
        if (on && window.yrPush) { const st = await window.yrPush.state(); if (st !== 'on') { const r0 = await window.yrPush.enable(); if (!r0.ok) { b.disabled = false; alert(r0.msg || 'فعّل الإشعارات من المتصفح علشان توصلك التذكيرات.'); return; } } }
        const r = on ? await db.from('match_reminders').insert({ fixture_id: fid, title: b.dataset.t, kickoff: b.dataset.ko }) : await db.from('match_reminders').delete().eq('user_id', u.id).eq('fixture_id', fid);
        if (r.error && !/duplicate/i.test(r.error.message || '')) { alert(/relation|schema/i.test(r.error.message || '') ? 'ميزة التذكير لسه متفعّلتش على السيرفر.' : 'تعذّر الحفظ، جرّب تاني.'); }
        else { if (on) bells.add(fid); else bells.delete(fid); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }
      } catch { alert('تعذّر الحفظ، جرّب تاني.'); }
      b.disabled = false;
    });
    loadBells();
    $('day-prev-btn')?.addEventListener('click', () => goDay(dayOff(state.day) + 1));
    $('day-next-btn')?.addEventListener('click', () => goDay(dayOff(state.day) - 1));
    $('lg-open')?.addEventListener('click', openSheet);
    $('fav-filter')?.addEventListener('click', () => { state.fav = !state.fav; render(); });
    const dd = $('sport-menu'); const ddb = $('sport-cur');
    const ddClose = () => { if (dd) dd.hidden = true; if (ddb) ddb.setAttribute('aria-expanded', 'false'); };
    ddb?.addEventListener('click', (e) => { e.stopPropagation(); const open = dd.hidden; dd.hidden = !open; ddb.setAttribute('aria-expanded', String(open)); });
    document.addEventListener('click', (e) => { if (!e.target.closest('#sport-dd')) ddClose(); });
    dd?.addEventListener('click', ddClose);
    host.addEventListener('click', (e) => {
      const f = e.target.closest('[data-fav]');
      if (f) { e.preventDefault(); const k = f.dataset.fav; const on = !favSet.has(k); if (on) favSet.add(k); else favSet.delete(k); saveFav(); if (state.fav) { render(); return; } f.classList.toggle('on', on); f.setAttribute('aria-pressed', String(on)); renderChips(); return; }
      const h = e.target.closest('.st-head[data-sec]'); if (!h) return;
      const sec = h.closest('.st-sec'); const k = h.dataset.sec; const shut = !sec.classList.contains('closed');
      sec.classList.toggle('closed', shut); h.setAttribute('aria-expanded', String(!shut));
      if (shut) { closed.add('s-' + k); closed.delete('s-fin-open'); } else { closed.delete('s-' + k); if (k === 'fin') closed.add('s-fin-open'); }
      try { localStorage.setItem('yr-lg-closed', JSON.stringify([...closed].slice(-40))); } catch { /* اختياري */ }
    });
    host.addEventListener('click', (e) => {
      if (e.target.closest('#retry')) load();
      if (e.target.closest('#reset-filters')) { state.q = ''; state.league = 'all'; $('match-search').value = ''; $('search-clear').hidden = true; syncUrl(); render(); }
    });
    const input = $('match-search'); const clear = $('search-clear');
    let timer;
    input?.addEventListener('input', () => { clear.hidden = !input.value; clearTimeout(timer); timer = setTimeout(() => { state.q = input.value; render(); }, 150); });
    input?.addEventListener('keydown', (e) => { if (e.key === 'Escape') { input.value = ''; clear.click(); } });
    clear?.addEventListener('click', () => { input.value = ''; clear.hidden = true; state.q = ''; render(); input.focus(); });

    paintControls(); syncUrl(); load();
  }

  /* تعرضها صفحة المباراة اليدوية (supabase-public.js) من النسخة المحفوظة في قاعدة البيانات */
  window.yrRenderDetails = renderDetails;

  /* ======================================================================
     تفاصيل المباراة
     ====================================================================== */
  if (page === 'match.html') {
    const p = new URLSearchParams(location.search);
    const fixtureId = p.get('fixture');
    if (!fixtureId) return;
    const sport = p.get('sport') === 'basketball' ? 'basketball' : 'football';
    const day = String(dayOff(p.get('day')));
    const title = $('match-title'); const score = $('match-score');
    const note = document.querySelector('main .panel .note');
    const body = $('match-body');
    const player = $('match-player'); const frameBox = $('match-player-frame');
    if (player) player.hidden = true; // يظهر فقط لو أضاف المسؤول رابط مشغّل رسمي
    const back = document.querySelector('main .back');
    if (back) back.href = `matches.html?sport=${sport}&day=${day}`;

    if (!db) { if (note) note.textContent = 'بيانات Supabase غير مكتملة، تعذّر تحميل تفاصيل المباراة.'; return; }
    (async () => {
      try {
        let res = null; let m = null; let degraded = false; let lastMan = null; let lastInf = null;
        if (Number(fixtureId) < 3e9) {
          // توفير الـAPI: المباراة اللي لسه قدامها أكتر من 90 دقيقة بنعرضها من قائمة اليوم (مخزّنة ومشتركة) من غير طلب تفاصيل لوحدها
          try { const lr = await request({ action: 'fixtures', sport, date: localDate(Number(day)) }); const f0 = (lr?.fixtures || []).find((x) => String(x.fixture_id) === String(fixtureId)); if (f0 && f0.status === 'scheduled' && f0.kickoff && new Date(f0.kickoff).getTime() - Date.now() > 90 * 60000) { m = f0; res = {}; } } catch { /* نكمل بطلب التفاصيل */ }
          if (!m) try { res = await request({ action: 'fixture', sport, fixtureId: Number(fixtureId) }); m = res?.fixture; } catch (e) { console.error('fixture:', e); }
        }
        if (!m) { // المباراة المهمة المحفوظة (من لوحة التحكم) تفتح حتى لو الـ API واقف
          try { const q = await db.from('fixture_overrides').select('*').eq('fixture_id', Number(fixtureId)).not('snapshot', 'is', null).maybeSingle(); if (q.data?.snapshot) { m = mergeOverride({ ...q.data.snapshot, from_snapshot: true }, q.data); res = {}; degraded = true; } } catch { /* نكمل */ }
        }
        if (!m) { // الـ API واقف/خلص: نجيب بيانات المباراة الأساسية من قائمة اليوم (الكاش) عشان الصفحة والمشغّل يفضلوا شغّالين
          const days = [...new Set([Number(day), 0, -1, 1])];
          for (const d of days) {
            let r = null; try { r = await request({ action: 'fixtures', sport, date: localDate(d) }); } catch { /* نجرّب المصدر الاحتياطي */ } let f = (r?.fixtures || []).find((x) => String(x.fixture_id) === String(fixtureId)); if (!f) { const sr = await srFixtures(localDate(d)); f = (sr?.fixtures || []).find((x) => String(x.fixture_id) === String(fixtureId)); } if (f) { m = f; break; }
          }
          if (m) { res = {}; degraded = true; }
        }
        if (!m) { if (note) note.textContent = 'فيه عطل مؤقت في مصدر المباريات دلوقتي، ونعمل على إصلاحه. جرّب تاني بعد شوية.'; return; }
        if (sport === 'football') { const [mm] = await applyOverrides([m]); m = mm; }
        const H = tn(m.home_team); const A = tn(m.away_team);
        title.textContent = `${H} × ${A}`;
        document.title = `${H} × ${A} | يلا رياضة`;
        score.innerHTML = `${teamMarkup(m.home_team, m.home_logo, sport, m.home_id)}${centerMarkup(m)}${teamMarkup(m.away_team, m.away_logo, sport, m.away_id)}`;
        if (note) note.textContent = formatDate(m.kickoff) + (degraded ? ' — تفاصيل الأحداث مؤقتًا غير متاحة' : '');
        { const hero0 = $('match-hero'); if (hero0 && !hero0.querySelector('.mh-when')) {
          const d = new Date(m.kickoff); const ok = !Number.isNaN(d.getTime());
          const iso = ok ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '';
          const clock = m.status === 'live' && m.minute ? `${m.minute}'` : ok ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : '';
          const ic = (p) => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
          const w = document.createElement('div'); w.className = 'mh-when'; w.setAttribute('dir', 'ltr');
          w.innerHTML = `<span>${ic('<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>')}<b>${iso}</b></span><i></i><span>${ic('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>')}<b>${clock}</b></span>`;
          (iso || clock) && hero0.insertBefore(w, $('mh-count') || null);
        } }
        window.yrMatchShare = () => {
          const live = m.status === 'live', fin = m.status === 'finished', has = m.home_score != null && m.away_score != null;
          window.yrShareBloom({ type: 'match', url: location.href.split('#')[0], league: m.league_label || m.league, home: { name: H, logo: safeUrl(m.home_logo) }, away: { name: A, logo: safeUrl(m.away_logo) }, score: has ? `${m.away_score} - ${m.home_score}` : '', live, finished: fin, minute: m.minute, time: formatTime(m.kickoff), when: formatDate(m.kickoff), title: `${H} × ${A}` });
        };
        { const hero = $('match-hero'); if (hero && !hero.querySelector('.mh-share')) { const b = document.createElement('button'); b.type = 'button'; b.className = 'mh-share'; b.innerHTML = window.yrIco('share') + ' شارك المباراة'; b.addEventListener('click', () => window.yrMatchShare()); hero.append(b); } }
        if (sport === 'football' && window.yrFollow && hero0f(m)) { const hero = $('match-hero'); if (hero && !hero.querySelector('.mh-fol')) { const r = document.createElement('div'); r.className = 'mh-fol'; r.innerHTML = window.yrFollow.button(m.home_id, m.home_team, H, m.home_logo) + window.yrFollow.button(m.away_id, m.away_team, A, m.away_logo); hero.append(r); window.yrFollow.sync(); window.yrFollow.nudge([{ id: m.home_id, name: m.home_team, dn: H, logo: m.home_logo }, { id: m.away_id, name: m.away_team, dn: A, logo: m.away_logo }]); } }
        if (sport === 'football' && window.yrPredictMount) window.yrPredictMount(m);
        window.yrHero && window.yrHero({ league: m.league_label || m.league, kickoff: m.kickoff, status: m.status, note: ['live', 'postponed', 'cancelled'].includes(m.status) ? m.status_note : '' });
        mdMore(m, sport, day);
        if (sport === 'football' && body) {
          // تشكيلة يدوية من لوحة الأدمن (إن وُجدت) تتفوق على تشكيلة المزوّد
          let manual = null; let manualInfo = null;
          try {
            let q = await db.from('fixture_manual').select('lineups,info').eq('fixture_id', Number(fixtureId)).maybeSingle();
            if (q.error) q = await db.from('fixture_manual').select('lineups').eq('fixture_id', Number(fixtureId)).maybeSingle(); // العمود info غير موجود بعد
            manual = q.data?.lineups || null; manualInfo = q.data?.info || null;
          } catch (e) { console.error('manual lineup lookup:', e); }
          lastMan = manual; lastInf = manualInfo; renderDetails(m, res, manual, manualInfo);
        }

        // بطاقة المشاهدة: بتظهر فقط لو المسؤول أضاف رابط (بث/ملخص) لهذه المباراة. مفيش روابط = مفيش بطاقة ولا زر
        if (sport === 'football' && player && frameBox && window.yrWatch) {
          const { data: sess } = await db.auth.getSession();
          const user = sess?.session?.user || null;
          player.classList.add('wc-host');
          const shown = await window.yrWatch.mount({
            host: frameBox, db, fixtureId, status: m.status, title: `${H} ضد ${A}`, league: m.league_label || m.league || '',
            signedIn: Boolean(user), userId: user?.id || null, shareUrl: location.href, autoOpen: false, kickoff: m.kickoff,
            src: { home: m.home_team, away: m.away_team, date: String(m.kickoff || '').slice(0, 10), sr_id: m.sr_id || '' },
          });
          if (shown) { player.hidden = false; window.yrPlayerReady && window.yrPlayerReady(); window.yrSelectTab && window.yrSelectTab('player'); }
        }
        // تحديث تلقائي من نفس المصدر: المباشرة وقبل البداية بقليل، كل دقيقة (الدالة بتقدّم الكاش فمش بيستهلك حصة زيادة)
        if (sport === 'football' && Number(fixtureId) < 3e9 && !degraded && m.status !== 'finished') {
          let busyR = false; let timer = 0;
          const near = () => m.status === 'live' || (m.kickoff && new Date(m.kickoff).getTime() - Date.now() < 20 * 60000);
          const tick = async () => {
            if (document.hidden || busyR || !near()) return; busyR = true;
            try {
              const r = await request({ action: 'fixture', sport, fixtureId: Number(fixtureId) }); let n = r?.fixture; if (!n) { busyR = false; return; }
              [n] = await applyOverrides([n]);
              const changed = n.status !== m.status || n.home_score !== m.home_score || n.away_score !== m.away_score || n.minute !== m.minute || JSON.stringify(r.events || []) !== JSON.stringify(res?.events || []);
              if (changed) {
                m = n; res = r;
                score.innerHTML = `${teamMarkup(m.home_team, m.home_logo, sport, m.home_id)}${centerMarkup(m)}${teamMarkup(m.away_team, m.away_logo, sport, m.away_id)}`;
                window.yrHero && window.yrHero({ league: m.league_label || m.league, kickoff: m.kickoff, status: m.status, note: ['live', 'postponed', 'cancelled'].includes(m.status) ? m.status_note : '' });
                renderDetails(m, res, lastMan, lastInf);
              }
              if (m.status === 'finished') clearInterval(timer);
            } catch { /* هنحاول المرة الجاية */ }
            busyR = false;
          };
          timer = setInterval(tick, 60000);
          document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
        }
      } catch (error) {
        console.error('match details:', error);
        if (note) note.textContent = `تعذّر تحميل تفاصيل المباراة: ${error.message || 'خطأ غير معروف'}.`;
      }
    })();
  }

  /* ======================================================================
     صفحة الفريق
     ====================================================================== */
  if (page === 'team.html' || page === 'footballer.html') {
    const root = $('team-root');
    const id = Number(new URLSearchParams(location.search).get('id'));
    const isTeam = page === 'team.html';
    const fmtDay = (v) => new Date(v).toLocaleDateString('ar-EG', { timeZone: 'Africa/Cairo', day: 'numeric', month: 'short' });
    const fmtTime = (v) => new Date(v).toLocaleTimeString('ar-EG', { timeZone: 'Africa/Cairo', hour: 'numeric', minute: '2-digit', hour12: true });
    const nAr = (n) => (n == null || n === '' ? '—' : Number(n).toLocaleString('ar-EG'));
    const setTitle = (t) => { const e = $('tp-ttl'); if (e) e.textContent = t; };
    const tile = (ico, v, k) => `<div class="tp-t"><b>${escapeHtml(v)}</b><span>${k}</span></div>`;
    const bindTabs = () => {
      const tabs = root.querySelectorAll('.tp-tab');
      tabs.forEach((b) => b.addEventListener('click', () => {
        tabs.forEach((x) => { const on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-selected', on); });
        root.querySelectorAll('.tp-pane').forEach((p) => { p.hidden = p.id !== 'pane-' + b.dataset.t; });
      }));
    };
    const toM = (x) => ({ sport: 'football', fixture_id: x.fixture_id, status: x.result ? 'finished' : 'scheduled', home_team: x.home, away_team: x.away, home_logo: x.home_logo, away_logo: x.away_logo, home_score: x.home_goals ?? null, away_score: x.away_goals ?? null, kickoff: x.date, league_label: x.league, round: fmtDay(x.date) });
    const mRow = (x) => mxCard(toM(x), `match.html?fixture=${encodeURIComponent(x.fixture_id)}&sport=football`, false);
    const mList = (arr) => `<div class="tp-mxs">${arr.map(mRow).join('')}</div>`;
    const err = (m) => { root.removeAttribute('aria-busy'); root.innerHTML = `<p class="note tp-note">${m} <a href="matches.html">العودة للمباريات</a></p>`; };
    (async () => {
      if (!db || !Number.isSafeInteger(id) || id < 1) { err(isTeam ? 'الفريق غير موجود.' : 'اللاعب غير موجود.'); return; }
      try {
        if (isTeam) {
          const r = await request({ action: 'team', sport: 'football', teamId: id });
          const t = r.team; const v = r.venue || {}; const c = r.coach;
          document.title = `${tn(t.name)} | يلا رياضة`; setTitle('ملف الفريق');
          const logo = safeUrl(t.logo);
          const groups = [['Goalkeeper', 'حراس المرمى'], ['Defender', 'المدافعون'], ['Midfielder', 'لاعبو الوسط'], ['Attacker', 'المهاجمون']];
          const squad = r.squad || [];
          window.yrTeamShare = () => window.yrShareBloom && window.yrShareBloom({ type: 'team', title: tn(t.name), sub: [countryAr(t.country), t.founded ? 'تأسس ' + t.founded : ''].filter(Boolean).join(' · '), image: logo, tag: 'ملف الفريق', emoji: '🛡️', url: location.href });
          root.removeAttribute('aria-busy');
          root.innerHTML = `<section class="tp-hero"><span class="tp-av">${logo ? `<img src="${escapeHtml(logo)}" alt="">` : '⚽'}</span>
              <div class="tp-hi"><small>${t.national ? 'منتخب' : 'نادي'}${t.country ? ' · ' + escapeHtml(countryAr(t.country)) : ''}</small><h1>${escapeHtml(tn(t.name))}</h1>
              <div class="tp-acts"><button type="button" class="tp-btn" onclick="window.yrTeamShare&&window.yrTeamShare()">مشاركة</button>${window.yrFollow ? window.yrFollow.button(id, t.name, tn(t.name), logo, 'tp-btn') : ''}<a class="tp-btn ghost" href="notification-preferences.html?follow=team:${id}&n=${encodeURIComponent(t.name || '')}">🔔 الإشعارات</a></div></div></section>
            <nav class="tp-tabs" role="tablist"><button class="tp-tab active" data-t="ov" role="tab" aria-selected="true">نظرة عامة</button><button class="tp-tab" data-t="mt" role="tab" aria-selected="false">المباريات</button><button class="tp-tab" data-t="st" role="tab" aria-selected="false">الترتيب</button><button class="tp-tab" data-t="pl" role="tab" aria-selected="false">اللاعبين</button></nav>
            <div class="tp-pane" id="pane-ov">
              <section class="tp-card"><h2>معلومات الفريق</h2><div class="tp-tiles">${[['سنة التأسيس', t.founded], ['الملعب', v.name ? tn(v.name) : ''], ['المدينة', v.city], ['السعة', v.capacity ? nAr(v.capacity) : ''], ['المدرب', c && c.name ? pn(c.name) : '']].filter((x) => x[1]).map(([k, x]) => tile('', String(x), k)).join('')}</div></section>
              <section class="tp-card" id="tp-last5"><h2>آخر النتائج</h2><p class="note">جارٍ التحميل…</p></section>
              <section class="tp-card" id="tp-next3"><h2>المباريات القادمة</h2><p class="note">جارٍ التحميل…</p></section>
              <button type="button" class="tp-more" data-go="mt">جميع مباريات الفريق</button>
            </div>
            <div class="tp-pane" id="pane-mt" hidden><section class="tp-card" id="tp-nextall"><h2>القادمة</h2></section><section class="tp-card" id="tp-lastall"><h2>آخر المباريات</h2></section></div>
            <div class="tp-pane" id="pane-st" hidden><section class="tp-card" id="tp-stc"><h2>ترتيب البطولات</h2><p class="note">جارٍ التحميل…</p></section></div>
            <div class="tp-pane" id="pane-pl" hidden>${squad.length ? groups.map(([k, label]) => { const list = squad.filter((p) => p.position === k); return list.length ? `<section class="tp-card"><h2>${label}</h2><div class="tp-pls">${list.map((p) => `<a class="tp-p" href="footballer.html?id=${p.id}"><span class="tp-ph">${photoImg(p.id)}</span><b>${escapeHtml(pn(p.name))}</b><small>${p.number ? '#' + escapeHtml(p.number) : ''}${p.number && p.age ? ' · ' : ''}${p.age ? escapeHtml(p.age) + ' سنة' : ''}</small></a>`).join('')}</div></section>` : ''; }).join('') : '<p class="note tp-note">قائمة اللاعبين غير متاحة حاليًا.</p>'}</div>`;
          const LGN = { 39: 'الدوري الإنجليزي', 140: 'الدوري الإسباني', 135: 'الدوري الإيطالي', 78: 'الدوري الألماني', 61: 'الدوري الفرنسي', 2: 'دوري أبطال أوروبا', 3: 'الدوري الأوروبي', 848: 'دوري المؤتمر', 233: 'الدوري المصري', 307: 'الدوري السعودي', 12: 'دوري أبطال أفريقيا', 1: 'كأس العالم' };
          const normT = (v) => String(v || '').toLowerCase().replace(/\b(fc|cf|afc|sc|club|de|cd)\b/g, '').replace(/[^a-z0-9؀-ۿ]/g, '');
          const isMe = (x) => (x.team.id && Number(x.team.id) === id) || (normT(x.team.name) && normT(t.name) && (normT(x.team.name).includes(normT(t.name)) || normT(t.name).includes(normT(x.team.name))));
          let stSel = 0; let stDone = false;
          const drawStandings = async () => {
            const box = $('tp-stc'); const lgs = window.yrTeamLeagues || [];
            if (!box) return;
            if (!lgs.length) { box.innerHTML = '<h2>ترتيب البطولات</h2><p class="note">لا يوجد ترتيب متاح لبطولات الفريق حاليًا.</p>'; return; }
            const chips = lgs.length > 1 ? `<div class="tp-chips">${lgs.map((l, i) => `<button type="button" class="tp-chip${i === stSel ? ' on' : ''}" data-i="${i}">${escapeHtml(LGN[l.id] || l.name || 'بطولة')}</button>`).join('')}</div>` : '';
            box.innerHTML = `<h2>ترتيب البطولات</h2>${chips}<div id="tp-stb"><p class="note">جارٍ التحميل…</p></div>`;
            box.querySelectorAll('.tp-chip').forEach((b) => b.addEventListener('click', () => { stSel = Number(b.dataset.i); drawStandings(); }));
            const body = $('tp-stb');
            try {
              const d = await request({ action: 'standings', sport: 'football', leagueId: lgs[stSel].id });
              const lg = (d.league && d.league.logo && safeUrl(d.league.logo)) ? `<img src="${escapeHtml(safeUrl(d.league.logo))}" alt="" referrerpolicy="no-referrer">` : '';
              const groups = d.groups || [];
              const table = (rows, title) => `${title ? `<h3 class="tp-grp">${escapeHtml(title)}</h3>` : ''}<div class="tp-lt"><div class="tp-lr th"><b>#</b><span class="tn">الفريق</span><span>لعب</span><span>ف</span><span>ت</span><span>خ</span><span class="gd">+/-</span><span>نقاط</span></div>${rows.map((x) => `<${x.team.id ? `a href="team.html?id=${x.team.id}"` : 'div'} class="tp-lr${isMe(x) ? ' me' : ''}"><b>${nAr(x.rank)}</b><span class="tn">${safeUrl(x.team.logo) ? `<img src="${escapeHtml(safeUrl(x.team.logo))}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ''}<em>${escapeHtml(tn(x.team.name))}</em></span><span>${nAr(x.played)}</span><span>${nAr(x.win)}</span><span>${nAr(x.draw)}</span><span>${nAr(x.lose)}</span><span class="gd" dir="ltr">${x.gd > 0 ? '+' : ''}${x.gd}</span><span class="pt">${nAr(x.points)}</span></${x.team.id ? 'a' : 'div'}>`).join('')}</div>`;
              body.innerHTML = `<p class="tp-lgn">${lg}<b>${escapeHtml(LGN[lgs[stSel].id] || (d.league && d.league.name) || '')}</b>${d.league && d.league.season ? `<small>موسم ${escapeHtml(String(d.league.season))}/${escapeHtml(String(Number(d.league.season) + 1).slice(2))}</small>` : ''}</p>` + (groups.length ? groups.map((g) => table(g, groups.length > 1 ? (g[0] && g[0].group) || '' : '')).join('') : '<p class="note">الترتيب غير متاح حاليًا.</p>');
              stDone = true;
            } catch (e) { body.innerHTML = `<p class="note">${escapeHtml(e && e.message ? e.message : 'تعذّر تحميل الترتيب.')}</p>`; }
          };
          window.yrTeamStandings = () => { if (!stDone) drawStandings(); };
          window.yrStWanted = false; window.yrTeamLeaguesReady = false;
          root.querySelector('.tp-tab[data-t="st"]').addEventListener('click', () => { window.yrStWanted = true; if (window.yrTeamLeaguesReady) window.yrTeamStandings(); });
          bindTabs();
          root.querySelector('[data-go="mt"]').addEventListener('click', () => root.querySelector('.tp-tab[data-t="mt"]').click());
          (async () => {
            const empty = (sel, m) => { const b = $(sel); if (b) b.insertAdjacentHTML('beforeend', `<p class="note">${m}</p>`); };
            try {
              const f = await request({ action: 'form', sport: 'football', teamId: id });
              const list = f.matches || []; const up = f.upcoming || [];
              window.yrTeamLeagues = f.leagues || [];
              window.yrTeamLeaguesReady = true; if (window.yrStWanted) window.yrTeamStandings();
              const L5 = list.slice(0, 5);
              const w = list.filter((x) => x.result === 'W').length; const d = list.filter((x) => x.result === 'D').length;
              const clear = (sel) => { const b = $(sel); b && b.querySelectorAll('.note').forEach((n) => n.remove()); };
              ['tp-last5', 'tp-next3'].forEach(clear);
              if (L5.length) {
                $('tp-last5').insertAdjacentHTML('beforeend', `<div class="tp-strip" dir="rtl">${list.map((x) => `<i class="fm fm-${x.result}">${x.result === 'W' ? 'ف' : x.result === 'D' ? 'ت' : 'خ'}</i>`).join('')}</div><p class="tp-sum"><b>${nAr(w)}</b> فوز · <b>${nAr(d)}</b> تعادل · <b>${nAr(list.length - w - d)}</b> خسارة</p>${mList(L5)}`);
                $('tp-lastall').insertAdjacentHTML('beforeend', mList(list));
              } else { empty('tp-last5', 'لا توجد نتائج متاحة حاليًا.'); empty('tp-lastall', 'لا توجد نتائج متاحة حاليًا.'); }
              if (up.length) {
                $('tp-next3').insertAdjacentHTML('beforeend', mList(up.slice(0, 3)));
                $('tp-nextall').insertAdjacentHTML('beforeend', mList(up));
              } else { empty('tp-next3', 'لا توجد مباريات قادمة معروفة حاليًا.'); empty('tp-nextall', 'لا توجد مباريات قادمة معروفة حاليًا.'); }
            } catch (e) {
              console.error('team form:', e);
              ['tp-last5', 'tp-next3', 'tp-nextall', 'tp-lastall'].forEach((s) => { const b = $(s); if (b) { b.querySelectorAll('.note').forEach((n) => n.remove()); b.insertAdjacentHTML('beforeend', '<p class="note">غير متاح حاليًا. حاول بعد قليل.</p>'); } });
            }
          })();
        } else {
          const r = await request({ action: 'player', sport: 'football', playerId: id });
          const p = r.player; const s = r.stats || {}; const tm = r.team || {};
          document.title = `${pn(p.name)} | يلا رياضة`; setTitle('ملف اللاعب');
          const tl = safeUrl(tm.logo);
          const comps = r.competitions || [];
          root.removeAttribute('aria-busy');
          root.innerHTML = `<section class="tp-hero"><span class="tp-av round">${photoImg(id)}</span>
              <div class="tp-hi"><small>${[posAr(r.position), p.nationality ? countryAr(p.nationality) : ''].filter(Boolean).join(' · ')}</small><h1>${escapeHtml(pn(p.name))}</h1>
              ${tm.name ? `<a class="tp-tl" href="${tm.id ? 'team.html?id=' + tm.id : '#'}">${tl ? `<img src="${escapeHtml(tl)}" alt="">` : ''}${escapeHtml(tn(tm.name))}</a>` : ''}<div class="tp-acts"><a class="tp-btn" href="notification-preferences.html?follow=player:${id}&n=${encodeURIComponent(p.name || '')}">🔔 متابعة اللاعب</a></div></div></section>
            <div class="tp-tiles tp-tiles4">${[['العمر', p.age ? p.age + ' سنة' : ''], ['الطول', unitAr(p.height)], ['الوزن', unitAr(p.weight)], ['الرقم', r.number ? '#' + r.number : '']].filter((x) => x[1]).map(([k, x]) => tile('', String(x), k)).join('')}</div>
            <nav class="tp-tabs" role="tablist"><button class="tp-tab active" data-t="ov" role="tab" aria-selected="true">نظرة عامة</button><button class="tp-tab" data-t="cp" role="tab" aria-selected="false">البطولات</button><button class="tp-tab" data-t="inf" role="tab" aria-selected="false">معلومات</button></nav>
            <div class="tp-pane" id="pane-ov"><section class="tp-card"><h2>إحصائيات موسم ${escapeHtml(String(r.season))}/${escapeHtml(String(Number(r.season) + 1).slice(2))}</h2>
              <div class="tp-tiles tp-tiles3">${[['مباريات', s.appearances], ['أهداف', s.goals], ['تمريرات حاسمة', s.assists], ['دقائق', s.minutes], ['إنذارات', s.yellow], ['طرد', s.red], ['التقييم', s.rating]].map(([k, x]) => tile('', x == null ? '—' : nAr(x), k)).join('')}</div></section></div>
            <div class="tp-pane" id="pane-cp" hidden><section class="tp-card"><h2>الأداء حسب البطولة</h2>${comps.length ? comps.map((c) => `<div class="tp-cp"><span class="tp-cn">${safeUrl(c.league_logo) ? `<img src="${escapeHtml(safeUrl(c.league_logo))}" alt="" loading="lazy">` : ''}<b>${escapeHtml(c.league)}</b><small>${escapeHtml(tn(c.team))}</small></span><span class="tp-cs"><em>${nAr(c.appearances)}<small>مباراة</small></em><em>${nAr(c.goals)}<small>هدف</small></em><em>${nAr(c.assists)}<small>تمريرة</small></em></span></div>`).join('') : '<p class="note">لا توجد إحصائيات متاحة.</p>'}</section></div>
            <div class="tp-pane" id="pane-inf" hidden><section class="tp-card"><h2>معلومات اللاعب</h2><dl class="tp-dl">${[['الاسم الكامل', [p.firstname, p.lastname].filter(Boolean).join(' ')], ['تاريخ الميلاد', fmtBirth(p.birth)], ['بلد الميلاد', countryAr(p.birth_country)], ['الجنسية', countryAr(p.nationality)], ['المركز', posAr(r.position)], ['الفريق', tm.name ? tn(tm.name) : '']].filter((x) => x[1]).map(([k, x]) => `<div><dt>${k}</dt><dd>${escapeHtml(x)}</dd></div>`).join('')}</dl></section></div>`;
          bindTabs();
        }
      } catch (e) {
        console.error(page, e);
        err(isTeam ? 'معلومات الفريق غير متاحة حاليًا. حاول بعد قليل.' : 'بيانات اللاعب غير متاحة حاليًا. حاول بعد قليل.');
      }
    })();
  }
})();
