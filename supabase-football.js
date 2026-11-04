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

  const request = async (body) => {
    if (!db) throw new Error('إعدادات Supabase غير مكتملة.');
    const { data, error } = await db.functions.invoke('football-matches', { body });
    if (error) {
      if (/failed to send a request to the edge function/i.test(error.message || '')) {
        console.error('football-matches function unreachable:', error); throw new Error('الخدمة غير متاحة حاليًا. حاول لاحقًا.');
      }
      throw error;
    }
    if (data?.error) throw new Error(data.error);
    try { await window.YR_NAMES?.ready; } catch { /* الأسماء الإضافية اختيارية */ }
    return data;
  };

  const teamMarkup = (name, logo, sport = 'football', id = null) => {
    const image = safeUrl(logo);
    const inner = `<span class="crest">${image ? `<img src="${escapeHtml(image)}" alt="" loading="lazy">` : SPORT_ICON[sport] || '⚽'}</span><span class="team-name">${escapeHtml(tn(name))}</span>`;
    // الضغط على الفريق (صفحة المباراة) يفتح معلوماته
    return id && sport === 'football' && id > 0 && page === 'match.html'
      ? `<a class="team team-link" href="team.html?id=${encodeURIComponent(id)}" title="معلومات الفريق">${inner}</a>`
      : `<div class="team">${inner}</div>`;
  };
  const statusTag = (m) => {
    if (m.status === 'live') return `<span class="tag live">● مباشر${m.minute ? ` · ${escapeHtml(m.minute)}'` : ''}</span>`;
    if (m.status === 'finished') return '<span class="tag">انتهت</span>';
    if (m.status_note) return `<span class="tag">${escapeHtml(m.status_note)}</span>`;
    return '<span class="tag">قادمة</span>';
  };
  const centerMarkup = (m) => {
    if (m.home_score == null || m.away_score == null) return `<div class="kick">${escapeHtml(formatTime(m.kickoff))}</div>`;
    // الصفحة من اليمين لليسار: الفريق صاحب الأرض على اليمين، والرقم يُكتب LTR، فنكتب الضيف أولًا ليكون صاحب الأرض على اليمين
    return `<div class="score" dir="ltr">${escapeHtml(m.away_score)} : ${escapeHtml(m.home_score)}</div>`;
  };
  const fixtureCard = (m, ctx) => `<a class="match" href="match.html?fixture=${encodeURIComponent(m.fixture_id)}&sport=${encodeURIComponent(m.sport || 'football')}&day=${encodeURIComponent(ctx.day)}${m.has_stream ? '&watch=1' : ''}">
      <div class="match-meta"><span>${escapeHtml(m.league_label || m.league || '')}</span>${statusTag(m)}</div>
      <div class="teams">${teamMarkup(m.home_team, m.home_logo, m.sport)}${centerMarkup(m)}${teamMarkup(m.away_team, m.away_logo, m.sport)}</div>
      <div class="match-foot"><span>${escapeHtml(formatDate(m.kickoff))}</span><span>${m.has_stream ? '<b class="watch-tag">▶ شاهد</b> ' : ''}التفاصيل ←</span></div>
    </a>`;
  const manualCard = (m) => `<a class="match" href="match.html?id=${encodeURIComponent(m.id)}">
      <div class="match-meta"><span>${escapeHtml(m.league || 'كرة القدم')}</span>${statusTag(m)}</div>
      <div class="teams">${teamMarkup(m.home_team)}${centerMarkup(m)}${teamMarkup(m.away_team)}</div>
      <div class="match-foot"><span>${escapeHtml(formatDate(m.kickoff))}</span><span>التفاصيل ←</span></div>
    </a>`;


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

  const loadManualMatches = async (day) => {
    const { data, error } = await db.from('matches')
      .select('id,home_team,away_team,league,kickoff,status,home_score,away_score')
      .eq('is_published', true).order('kickoff', { ascending: true }).limit(100);
    if (error) throw error;
    const target = localDate({ yesterday: -1, today: 0, tomorrow: 1 }[day] ?? 0);
    return (data || []).filter((m) => {
      if (!m.kickoff) return day === 'today';
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
    if (id > 0) openPlayer(id, { name: el.dataset.pname || '', number: el.dataset.pno || '', pos: el.dataset.ppos || '' });
  });
  const pAttrs = (p) => (p.id > 0 ? ` data-pid="${p.id}" data-pname="${escapeHtml(p.name || '')}" data-pno="${escapeHtml(p.number ?? '')}" data-ppos="${escapeHtml(p.pos || '')}"` : '');

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
        let x = ((i + 1) / (arr.length + 1)) * 100;
        if (!isHome) x = 100 - x;
        const t = rmax === 1 ? 0 : (r - 1) / (rmax - 1);
        const y = isHome ? 7 + t * 38 : 93 - t * 38;
        out.push(`<${p.id > 0 ? 'button type="button"' : 'div'} class="pl ${isHome ? 'pl-home' : 'pl-away'}"${pAttrs(p)} style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%"><span class="pl-img">${photoImg(p.id)}</span><span class="pl-no">${escapeHtml(p.number ?? '')}</span><span class="pl-name">${escapeHtml(shortName(p.name))}</span></${p.id > 0 ? 'button' : 'div'}>`);
      });
    });
    return out.join('');
  };
  const benchList = (title, lineup, teamName) => `<div class="bench"><h3>${escapeHtml(title)}</h3>
      ${lineup.coach ? `<p class="coach">المدرب: <b>${escapeHtml(pn(lineup.coach))}</b></p>` : ''}
      <ul>${lineup.subs.map((p) => `<li${pAttrs(p)} class="${p.id > 0 ? 'clickable' : ''}"><span class="sq-img sm">${photoImg(p.id)}</span><span class="pl-no sm">${escapeHtml(p.number ?? '')}</span>${escapeHtml(shortName(p.name))}</li>`).join('') || '<li class="note">لا يوجد احتياط معلن.</li>'}</ul></div>`;
  const renderLineup = (m, res) => {
    const lineups = res.lineups || [];
    const home = lineups.find((l) => l.team_id === m.home_id);
    const away = lineups.find((l) => l.team_id === m.away_id);
    if (!home || !away || !home.start.length || !away.start.length) return emptyMsg('التشكيلة لم تُعلن بعد، وتظهر عادةً قبل المباراة بحوالي ساعة.');
    const gridOk = [...home.start, ...away.start].every((p) => /^\d+:\d+$/.test(String(p.grid || '')));
    const H = tn(m.home_team); const A = tn(m.away_team);
    const pitch = gridOk
      ? `<div class="pitch-head"><span>${escapeHtml(H)} <b dir="ltr">${escapeHtml(home.formation)}</b></span><span>${escapeHtml(A)} <b dir="ltr">${escapeHtml(away.formation)}</b></span></div>
         <div class="pitch" dir="ltr" aria-label="ملعب التشكيلة"><i class="pitch-mid"></i><i class="pitch-circle"></i><i class="pitch-box top"></i><i class="pitch-box bottom"></i>${pitchPlayers(home, true)}${pitchPlayers(away, false)}</div>`
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
    const body = $('match-body');
    $('tab-summary').innerHTML = renderSummary(m, res);
    $('tab-lineup').innerHTML = renderLineup(m, res);
    $('tab-stats').innerHTML = renderStats(m, res);
    if ($('tab-info')) $('tab-info').innerHTML = renderInfo(m, res, manualInfo);
    body.hidden = false;
    const select = (name) => {
      body.querySelectorAll('[data-tab]').forEach((b) => { const on = b.dataset.tab === name; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); });
      ['summary', 'lineup', 'stats', 'info'].forEach((t) => { if ($(`tab-${t}`)) $(`tab-${t}`).hidden = t !== name; });
    };
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
    const DAYS = ['yesterday', 'today', 'tomorrow'];
    const offsets = { yesterday: -1, today: 0, tomorrow: 1 };
    const state = {
      sport: SPORT_NAME[params.get('sport')] ? params.get('sport') : 'football',
      day: DAYS.includes(params.get('day')) ? params.get('day') : 'today',
      league: params.get('league') || 'all',
      q: '',
    };
    let data = { fixtures: [], leagues: [], manual: [], error: '' };
    let token = 0;

    const syncUrl = () => {
      const p = new URLSearchParams({ sport: state.sport, day: state.day });
      if (state.league !== 'all') p.set('league', state.league);
      try { history.replaceState(null, '', `?${p}`); } catch { /* لا مشكلة */ }
    };
    const paintControls = () => {
      document.querySelectorAll('[data-sport]').forEach((b) => { const on = b.dataset.sport === state.sport; b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); });
      document.querySelectorAll('[data-day]').forEach((b) => { const on = b.dataset.day === state.day; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
      const sub = $('mc-sub');
      if (sub) sub.textContent = state.sport === 'football'
        ? 'أهم البطولات حول العالم: أوروبا وأفريقيا، الدوريات الخمسة الكبرى، السعودي والمصري والعربية.'
        : 'أهم البطولات: NBA ويوروليغ.';
    };

    const all = () => (state.sport === 'football' ? [...data.fixtures, ...data.manual] : data.fixtures);
    const renderChips = () => {
      const box = $('league-chips'); if (!box) return;
      const list = all();
      const chips = [{ key: 'all', label: 'كل البطولات المهمة', n: list.length }, ...data.leagues.map((l) => ({ key: l.key, label: l.label, n: list.filter((m) => m.league_key === l.key).length })).filter((c) => c.n > 0 || c.key === state.league)];
      if (state.sport === 'football' && data.manual.length) chips.push({ key: 'manual', label: 'مباريات منشورة', n: data.manual.length });
      box.innerHTML = chips.map((c) => `<button type="button" class="chip${state.league === c.key ? ' active' : ''}" data-league="${escapeHtml(c.key)}" aria-pressed="${state.league === c.key}">${escapeHtml(c.label)} <span class="chip-n">${c.n}</span></button>`).join('');
    };
    const render = () => {
      paintControls(); renderChips();
      const q = norm(state.q);
      const rows = all()
        .filter((m) => state.league === 'all' || m.league_key === state.league)
        .filter((m) => !q || q.split(' ').every((w) => haystack(m).includes(w)));
      const count = $('results-count');
      if (data.error && !rows.length) {
        host.innerHTML = `<div class="empty-state"><p>${escapeHtml(data.error)}</p><button class="btn outline" type="button" id="retry">إعادة المحاولة</button></div>`;
        if (count) count.textContent = '';
        return;
      }
      if (!rows.length) {
        host.innerHTML = `<div class="empty-state"><p>${q ? 'لا توجد مباريات مطابقة لبحثك.' : `لا توجد مباريات ${SPORT_NAME[state.sport]} في البطولات المهمة لهذا اليوم.`}</p>${q || state.league !== 'all' ? '<button class="btn outline" type="button" id="reset-filters">إزالة التصفية</button>' : ''}</div>`;
        if (count) count.textContent = '';
        return;
      }
      // تجميع حسب البطولة بترتيب القائمة، والمباشر أولًا ثم الأقرب موعدًا
      const order = [...data.leagues.map((l) => l.key), 'manual'];
      const groups = new Map();
      rows.forEach((m) => { if (!groups.has(m.league_key)) groups.set(m.league_key, []); groups.get(m.league_key).push(m); });
      const rank = (m) => (m.status === 'live' ? 0 : 1);
      const keys = [...groups.keys()].sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
      host.innerHTML = keys.map((k) => {
        const items = groups.get(k).sort((a, b) => rank(a) - rank(b) || new Date(a.kickoff || 0) - new Date(b.kickoff || 0));
        const logo = safeUrl(items.find((m) => m.league_logo)?.league_logo);
        return `<section class="league-group" aria-label="${escapeHtml(items[0].league_label)}">
          <h2 class="league-title">${logo ? `<img src="${escapeHtml(logo)}" alt="" loading="lazy">` : ''}<span>${escapeHtml(items[0].league_label)}</span><small>${items.length}</small></h2>
          <div class="match-grid">${items.map((m) => (m.manual ? manualCard(m) : fixtureCard(m, state))).join('')}</div></section>`;
      }).join('');
      if (count) count.textContent = `${rows.length} ${rows.length === 1 ? 'مباراة' : 'مباراة'}${q ? ' مطابقة للبحث' : ''}`;
    };

    async function load() {
      const my = ++token;
      host.setAttribute('aria-busy', 'true');
      host.innerHTML = '<div class="skeleton-list" aria-hidden="true"><div></div><div></div><div></div></div>';
      $('results-count') && ($('results-count').textContent = 'جارٍ التحميل…');
      data = { fixtures: [], leagues: [], manual: [], error: '' };
      if (!db) { data.error = 'بيانات Supabase غير مكتملة. أضف رابط المشروع والمفتاح في supabase-config.js.'; host.removeAttribute('aria-busy'); return render(); }
      const [api, manual] = await Promise.allSettled([
        request({ action: 'fixtures', sport: state.sport, date: localDate(offsets[state.day]) }),
        state.sport === 'football' ? loadManualMatches(state.day) : Promise.resolve([]),
      ]);
      if (my !== token) return; // وصل رد قديم بعد تغيير الاختيار
      if (api.status === 'fulfilled') { data.fixtures = api.value?.fixtures || []; data.leagues = api.value?.leagues || []; await markStreams(data.fixtures); if (my !== token) return; }
      else { console.error('matches:', api.reason); data.error = `تعذّر تحميل المباريات: ${api.reason?.message || 'خطأ غير معروف'}`; }
      if (manual.status === 'fulfilled') data.manual = manual.value;
      host.removeAttribute('aria-busy');
      if (state.league !== 'all' && !data.leagues.some((l) => l.key === state.league) && state.league !== 'manual') state.league = 'all';
      render();
    }

    /* أحداث */
    document.querySelectorAll('[data-sport]').forEach((b) => b.addEventListener('click', () => { if (state.sport === b.dataset.sport) return; state.sport = b.dataset.sport; state.league = 'all'; syncUrl(); load(); }));
    document.querySelectorAll('[data-day]').forEach((b) => b.addEventListener('click', () => { if (state.day === b.dataset.day) return; state.day = b.dataset.day; syncUrl(); load(); }));
    $('league-chips')?.addEventListener('click', (e) => { const b = e.target.closest('[data-league]'); if (!b) return; state.league = b.dataset.league; syncUrl(); render(); });
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

  /* ======================================================================
     تفاصيل المباراة
     ====================================================================== */
  if (page === 'match.html') {
    const p = new URLSearchParams(location.search);
    const fixtureId = p.get('fixture');
    if (!fixtureId) return;
    const sport = p.get('sport') === 'basketball' ? 'basketball' : 'football';
    const day = ['yesterday', 'today', 'tomorrow'].includes(p.get('day')) ? p.get('day') : 'today';
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
        const res = await request({ action: 'fixture', sport, fixtureId: Number(fixtureId) });
        const m = res?.fixture;
        if (!m) { if (note) note.textContent = 'المباراة غير متاحة حاليًا.'; return; }
        const H = tn(m.home_team); const A = tn(m.away_team);
        title.textContent = `${H} × ${A}`;
        document.title = `${H} × ${A} | يلا رياضة`;
        score.innerHTML = `${teamMarkup(m.home_team, m.home_logo, sport, m.home_id)}${centerMarkup(m)}${teamMarkup(m.away_team, m.away_logo, sport, m.away_id)}`;
        if (note) note.textContent = `${m.league_label || m.league} · ${formatDate(m.kickoff)} · ${m.status === 'live' ? 'مباشرة' : m.status === 'finished' ? 'انتهت' : m.status_note || 'قادمة'}`;
        if (sport === 'football' && body) {
          // تشكيلة يدوية من لوحة الأدمن (إن وُجدت) تتفوق على تشكيلة المزوّد
          let manual = null; let manualInfo = null;
          try {
            let q = await db.from('fixture_manual').select('lineups,info').eq('fixture_id', Number(fixtureId)).maybeSingle();
            if (q.error) q = await db.from('fixture_manual').select('lineups').eq('fixture_id', Number(fixtureId)).maybeSingle(); // العمود info غير موجود بعد
            manual = q.data?.lineups || null; manualInfo = q.data?.info || null;
          } catch (e) { console.error('manual lineup lookup:', e); }
          renderDetails(m, res, manual, manualInfo);
        }

        // المشغّل: لكرة القدم فقط حاليًا (جدول fixture_streams مفتاحه رقم المباراة)، ولا يظهر إلا لو يوجد رابط
        if (sport === 'football' && player && frameBox) {
          const { data: sess } = await db.auth.getSession();
          const signedIn = Boolean(sess?.session?.user);
          let url = '';
          if (signedIn) {
            const { data: stream, error } = await db.from('fixture_streams').select('embed_url').eq('fixture_id', Number(fixtureId)).maybeSingle();
            if (error) { console.error('stream lookup:', error); return; }
            url = safeUrl(stream?.embed_url);
            if (!url) return;
          } else {
            // زائر غير مسجّل: نعرف فقط إن كان في مشغّل، ونعرض قفل الدخول بدل الرابط
            const r = await db.rpc('stream_fixture_ids', { p_ids: [Number(fixtureId)] });
            if (r.error || !(r.data || []).map(Number).includes(Number(fixtureId))) return;
          }
          if (!signedIn) {
            frameBox.innerHTML = window.yrLockBox ? window.yrLockBox('المشغّل للأعضاء فقط', 'سجّل دخولك بحسابك لمشاهدة هذه المباراة.') : '';
            player.hidden = false;
          } else {
          const frame = document.createElement('iframe');
          frame.src = url;
          frame.title = `مشغّل مباراة ${H} ضد ${A}`;
          frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
          frame.allowFullscreen = true;
          frame.referrerPolicy = 'strict-origin-when-cross-origin';
          frame.sandbox = 'allow-scripts allow-same-origin allow-presentation';
          frameBox.replaceChildren(frame);
          player.hidden = false;
          }
          if (note && !$('watch-btn')) {
            const btn = document.createElement('button');
            btn.type = 'button'; btn.id = 'watch-btn'; btn.className = 'btn primary watch-btn'; btn.textContent = '▶ شاهد المباراة';
            btn.addEventListener('click', () => player.scrollIntoView({ behavior: 'smooth', block: 'start' }));
            note.after(btn);
            if (p.get('watch') === '1') setTimeout(() => player.scrollIntoView({ block: 'start' }), 300);
          }
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
  if (page === 'team.html') {
    const root = $('team-root');
    const id = Number(new URLSearchParams(location.search).get('id'));
    (async () => {
      if (!db || !Number.isSafeInteger(id) || id < 1) { root.innerHTML = '<p class="note">الفريق غير موجود. <a href="matches.html">العودة للمباريات</a></p>'; return; }
      try {
        const r = await request({ action: 'team', sport: 'football', teamId: id });
        const t = r.team; const v = r.venue || {}; const c = r.coach;
        document.title = `${tn(t.name)} | يلا رياضة`;
        const logo = safeUrl(t.logo);
        const groups = [['Goalkeeper', 'حراس المرمى'], ['Defender', 'المدافعون'], ['Midfielder', 'لاعبو الوسط'], ['Attacker', 'المهاجمون']];
        const facts = [['الدولة', countryAr(t.country)], ['سنة التأسيس', t.founded], ['الملعب', v.name ? tn(v.name) : ''], ['المدينة', v.city], ['سعة الملعب', v.capacity ? Number(v.capacity).toLocaleString('ar-EG') : ''], ['الأرضية', v.surface === 'grass' ? 'عشب طبيعي' : v.surface === 'artificial turf' ? 'عشب صناعي' : '']].filter(([, x]) => x);
        const vimg = safeUrl(v.image);
        root.removeAttribute('aria-busy');
        root.innerHTML = `<a class="back-link" href="javascript:history.back()">← رجوع</a>
          <section class="panel team-hero"><span class="crest big">${logo ? `<img src="${escapeHtml(logo)}" alt="">` : '⚽'}</span><div><span class="kicker">${t.national ? 'منتخب' : 'نادي'}</span><h1>${escapeHtml(tn(t.name))}</h1></div></section>
          <section class="panel"><h2>معلومات الفريق</h2><dl class="info-list">${facts.map(([k, x]) => `<div><dt>${k}</dt><dd>${escapeHtml(x)}</dd></div>`).join('')}${c?.name ? `<div><dt>المدرب</dt><dd>${escapeHtml(pn(c.name))}</dd></div>` : ''}</dl>${vimg ? `<img class="venue-img" src="${escapeHtml(vimg)}" alt="" loading="lazy">` : ''}</section>
          ${(r.squad || []).length ? `<section class="panel"><h2>التشكيلة الحالية</h2>${groups.map(([k, label]) => { const list = r.squad.filter((p) => p.position === k); return list.length ? `<h3 class="sq-title">${label}</h3><div class="squad-grid">${list.map((p) => `<button type="button" class="sq" data-pid="${p.id}" data-pname="${escapeHtml(p.name)}" data-pno="${escapeHtml(p.number ?? '')}" data-ppos="${escapeHtml(p.position)}"><span class="sq-img">${photoImg(p.id)}</span><b>${escapeHtml(pn(p.name))}</b><small>${p.number ? `#${escapeHtml(p.number)} · ` : ''}${p.age ? `${escapeHtml(p.age)} سنة` : ''}</small></button>`).join('')}</div>` : ''; }).join('')}</section>` : ''}`;
      } catch (e) {
        console.error('team:', e);
        root.removeAttribute('aria-busy');
        root.innerHTML = '<p class="note">معلومات الفريق غير متاحة حاليًا. حاول بعد قليل. <a href="matches.html">العودة للمباريات</a></p>';
      }
    })();
  }
})();
