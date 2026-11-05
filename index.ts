// يلا رياضة — دالة المباريات (API-Sports). تعمل كوسيط: المفتاح يبقى هنا في Secrets ولا يصل للمتصفح.
// تدعم كرة القدم وكرة السلة، وتعرض البطولات المهمة فقط (عدّل القوائم أدناه لتغييرها).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Sport = 'football' | 'basketball';

// ---------- البطولات المعروضة ----------
// كرة القدم: بالأرقام (IDs) في API-Football لتجنّب تشابه الأسماء. الترتيب هنا هو ترتيب العرض.
// الأرقام من معرفتي بالمزوّد؛ لو بطولة لم تظهر راجع رقمها في https://dashboard.api-football.com (قسم Leagues) وعدّله هنا.
const FOOTBALL_LEAGUE_LIST: [number, string][] = [
  [2, 'دوري أبطال أوروبا'], [3, 'الدوري الأوروبي'], [848, 'دوري المؤتمر الأوروبي'],
  [12, 'دوري أبطال أفريقيا'], [20, 'كأس الكونفدرالية الأفريقية'],
  [39, 'الدوري الإنجليزي الممتاز'], [140, 'الدوري الإسباني'], [135, 'الدوري الإيطالي'], [78, 'الدوري الألماني'], [61, 'الدوري الفرنسي'],
  [307, 'الدوري السعودي'], [233, 'الدوري المصري الممتاز'], [200, 'الدوري المغربي'], [202, 'الدوري التونسي'], [186, 'الدوري الجزائري'], [301, 'الدوري الإماراتي'], [305, 'الدوري القطري'],
  [203, 'الدوري التركي'], [94, 'الدوري البرتغالي'], [88, 'الدوري الهولندي'], [253, 'الدوري الأمريكي MLS'], [71, 'الدوري البرازيلي'], [128, 'الدوري الأرجنتيني'],
  [13, 'كوبا ليبرتادوريس'], [17, 'دوري أبطال آسيا'], [15, 'كأس العالم للأندية'],
  [143, 'كأس ملك إسبانيا'], [45, 'كأس الاتحاد الإنجليزي'], [48, 'كأس الرابطة الإنجليزية'], [137, 'كأس إيطاليا'], [81, 'كأس ألمانيا'], [66, 'كأس فرنسا'],
  [1, 'كأس العالم'], [4, 'كأس أمم أوروبا'], [6, 'كأس الأمم الأفريقية'], [9, 'كوبا أمريكا'], [5, 'دوري الأمم الأوروبية'],
  [29, 'تصفيات كأس العالم - أفريقيا'], [32, 'تصفيات كأس العالم - أوروبا'], [30, 'تصفيات كأس العالم - آسيا'], [34, 'تصفيات كأس العالم - أمريكا الجنوبية'], [10, 'مباريات ودية دولية'],
];
const FOOTBALL_LEAGUES: Record<number, string> = Object.fromEntries(FOOTBALL_LEAGUE_LIST);
// كرة السلة: بالاسم كما يرسله المزوّد.
const BASKETBALL_LEAGUES: { key: string; label: string; test: (name: string) => boolean }[] = [
  { key: 'nba', label: 'NBA', test: (n) => /^nba$/i.test(n.trim()) },
  { key: 'euroleague', label: 'يوروليغ', test: (n) => /^euroleague$/i.test(n.trim()) },
];

const PROVIDERS: Record<Sport, string> = {
  football: 'https://v3.football.api-sports.io/fixtures',
  basketball: 'https://v1.basketball.api-sports.io/games',
};
const FOOTBALL_BASE = 'https://v3.football.api-sports.io';

// طلب واحد للمزوّد (مباشر أو عبر الوسيط لو RELAY_URL مضبوط). path: fixtures | teams | players/squads | players | coachs | games
async function providerFetch(sport: Sport, path: string, params: URLSearchParams, apiKey: string, relayUrl?: string, relaySecret?: string) {
  if (relayUrl && relaySecret) {
    return await fetch(`${relayUrl.replace(/\/$/, '')}/fetch`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-relay-secret': relaySecret },
      body: JSON.stringify({ sport, path, params: Object.fromEntries(params) }),
      signal: AbortSignal.timeout(12000),
    });
  }
  const url = sport === 'football' && path !== 'fixtures' ? `${FOOTBALL_BASE}/${path}` : PROVIDERS[sport];
  return await fetch(`${url}?${params}`, { headers: { 'x-apisports-key': apiKey }, signal: AbortSignal.timeout(10000) });
}

const leaguesFor = (sport: Sport) =>
  sport === 'football'
    ? FOOTBALL_LEAGUE_LIST.map(([key, label]) => ({ key: String(key), label }))
    : BASKETBALL_LEAGUES.map(({ key, label }) => ({ key, label }));

// ---------- أدوات ----------
const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=30' },
  });

function cairoDate(offset = 0) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return new Date(Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day) + offset)).toISOString().slice(0, 10);
}

const NOTES: Record<string, string> = {
  PST: 'مؤجلة', POST: 'مؤجلة', CANC: 'ملغاة', SUSP: 'موقوفة', ABD: 'متوقفة', AWD: 'قرار إداري', WO: 'انسحاب', TBD: 'الموعد غير محدد',
};

type Normalized = {
  fixture_id: number | undefined;
  sport: Sport;
  kickoff: string | null;
  status: 'live' | 'finished' | 'scheduled';
  status_note: string;
  minute: number | null;
  home_team: string;
  away_team: string;
  home_id: number | null;
  away_id: number | null;
  home_logo: string | null;
  away_logo: string | null;
  league: string;
  league_key: string;
  league_label: string;
  league_logo: string | null;
  home_score: number | null;
  away_score: number | null;
};

// deno-lint-ignore no-explicit-any
function normalizeFootball(item: any): Normalized {
  const short: string = item.fixture?.status?.short ?? '';
  const live = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT']);
  const done = new Set(['FT', 'AET', 'PEN']);
  const id = Number(item.league?.id);
  return {
    fixture_id: item.fixture?.id,
    sport: 'football',
    kickoff: item.fixture?.date ?? null,
    status: live.has(short) ? 'live' : done.has(short) ? 'finished' : 'scheduled',
    status_note: NOTES[short] ?? '',
    minute: typeof item.fixture?.status?.elapsed === 'number' ? item.fixture.status.elapsed : null,
    home_team: item.teams?.home?.name ?? 'الفريق الأول',
    away_team: item.teams?.away?.name ?? 'الفريق الثاني',
    home_id: item.teams?.home?.id ?? null,
    away_id: item.teams?.away?.id ?? null,
    home_logo: item.teams?.home?.logo ?? null,
    away_logo: item.teams?.away?.logo ?? null,
    league: item.league?.name ?? 'كرة القدم',
    league_key: String(id),
    league_label: FOOTBALL_LEAGUES[id] ?? item.league?.name ?? 'كرة القدم',
    league_logo: item.league?.logo ?? null,
    home_score: item.goals?.home ?? null,
    away_score: item.goals?.away ?? null,
  };
}

// deno-lint-ignore no-explicit-any
function normalizeBasketball(item: any): Normalized {
  const short: string = item.status?.short ?? '';
  const live = new Set(['Q1', 'Q2', 'Q3', 'Q4', 'OT', 'BT', 'HT']);
  const done = new Set(['FT', 'AOT']);
  const name: string = item.league?.name ?? '';
  const found = BASKETBALL_LEAGUES.find((l) => l.test(name));
  return {
    fixture_id: item.id,
    sport: 'basketball',
    kickoff: item.date ?? null,
    status: live.has(short) ? 'live' : done.has(short) ? 'finished' : 'scheduled',
    status_note: NOTES[short] ?? '',
    minute: null,
    home_team: item.teams?.home?.name ?? 'الفريق الأول',
    away_team: item.teams?.away?.name ?? 'الفريق الثاني',
    home_id: item.teams?.home?.id ?? null,
    away_id: item.teams?.away?.id ?? null,
    home_logo: item.teams?.home?.logo ?? null,
    away_logo: item.teams?.away?.logo ?? null,
    league: name || 'كرة السلة',
    league_key: found?.key ?? name,
    league_label: found?.label ?? (name || 'كرة السلة'),
    league_logo: item.league?.logo ?? null,
    home_score: item.scores?.home?.total ?? null,
    away_score: item.scores?.away?.total ?? null,
  };
}

// ---------- تفاصيل المباراة (كرة القدم): الأحداث والتشكيلة والإحصائيات من نفس الطلب ----------
// deno-lint-ignore no-explicit-any
const pl = (p: any) => (p ? { id: p.id ?? null, name: p.name ?? '', number: p.number ?? null, pos: p.pos ?? null, grid: p.grid ?? null } : null);

// deno-lint-ignore no-explicit-any
function extractDetails(item: any) {
  const events = (Array.isArray(item.events) ? item.events : []).map(
    // deno-lint-ignore no-explicit-any
    (e: any) => ({
      minute: e.time?.elapsed ?? null,
      extra: e.time?.extra ?? null,
      team_id: e.team?.id ?? null,
      player: e.player?.name ?? '',
      assist: e.assist?.name ?? '',
      type: String(e.type ?? '').toLowerCase(),
      detail: e.detail ?? '',
    }),
  );
  const lineups = (Array.isArray(item.lineups) ? item.lineups : []).map(
    // deno-lint-ignore no-explicit-any
    (l: any) => ({
      team_id: l.team?.id ?? null,
      formation: l.formation ?? '',
      coach: l.coach?.name ?? '',
      // deno-lint-ignore no-explicit-any
      start: (l.startXI ?? []).map((x: any) => pl(x.player)).filter(Boolean),
      // deno-lint-ignore no-explicit-any
      subs: (l.substitutes ?? []).map((x: any) => pl(x.player)).filter(Boolean),
    }),
  );
  const stats: Record<string, Record<string, unknown>> = {};
  // deno-lint-ignore no-explicit-any
  for (const t of (Array.isArray(item.statistics) ? item.statistics : []) as any[]) {
    // deno-lint-ignore no-explicit-any
    stats[String(t.team?.id)] = Object.fromEntries((t.statistics ?? []).map((s: any) => [s.type, s.value]));
  }
  const info = {
    venue: item.fixture?.venue?.name ?? '',
    city: item.fixture?.venue?.city ?? '',
    referee: item.fixture?.referee ?? '',
    round: item.league?.round ?? '',
  };
  return { events, lineups, stats, info };
}

// deno-lint-ignore no-explicit-any
const isImportant = (sport: Sport, item: any) =>
  sport === 'football'
    ? Number(item.league?.id) in FOOTBALL_LEAGUES
    : BASKETBALL_LEAGUES.some((l) => l.test(String(item.league?.name ?? '')));

// ---------- ذاكرة مؤقتة وحد يومي (الخطة المجانية 100 طلب يوميًا لكل رياضة) ----------
type Cached = { payload: Record<string, unknown>; expires: number };
type JobResult = { payload?: Record<string, unknown>; error?: string; status?: number };
const cache = new Map<string, Cached>();
const inflight = new Map<string, Promise<JobResult>>();
const DAILY_BUDGET = 90; // نترك هامشًا من الـ100
const budgets = new Map<string, { day: string; used: number }>();
const takeBudget = (sport: Sport) => {
  const today = cairoDate();
  const b = budgets.get(sport);
  if (!b || b.day !== today) budgets.set(sport, { day: today, used: 0 });
  const cur = budgets.get(sport)!;
  if (cur.used >= DAILY_BUDGET) return false;
  cur.used += 1;
  return true;
};
const MIN = 60_000;
const MINUTE_BUDGET = 8; // الخطة المجانية 10 طلبات في الدقيقة

// ---------- تخزين مشترك بين كل نسخ الدالة (جدولا api_cache و api_budget) ----------
// لو الجدولان غير موجودين أو المفتاح غير متاح، نرجع تلقائيًا للذاكرة المحلية بدل أن تتعطل الدالة.
const SB_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SB_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('ADMIN_SERVICE_KEY') || '';
const sbReady = () => Boolean(SB_URL && SB_KEY);
async function sb(path: string, init: RequestInit = {}): Promise<Response | null> {
  if (!sbReady()) return null;
  try {
    const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
      ...init,
      headers: { apikey: SB_KEY, authorization: `Bearer ${SB_KEY}`, 'content-type': 'application/json', ...(init.headers ?? {}) },
      signal: AbortSignal.timeout(4000),
    });
    return res.ok ? res : null;
  } catch (error) {
    console.error('shared store unavailable:', error);
    return null;
  }
}
async function dbGet(key: string): Promise<Cached | null> {
  const res = await sb(`api_cache?key=eq.${encodeURIComponent(key)}&select=payload,expires_at`);
  const rows = res ? await res.json().catch(() => null) : null;
  const row = Array.isArray(rows) ? rows[0] : null;
  return row ? { payload: row.payload, expires: new Date(row.expires_at).getTime() } : null;
}
async function dbSet(key: string, payload: Record<string, unknown>, expires: number) {
  await sb('api_cache?on_conflict=key', {
    method: 'POST',
    headers: { prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ key, payload, expires_at: new Date(expires).toISOString(), updated_at: new Date().toISOString() }),
  });
}
async function takeSharedBudget(sport: Sport): Promise<'ok' | 'day' | 'minute'> {
  const res = await sb('rpc/take_api_budget', {
    method: 'POST',
    body: JSON.stringify({ p_sport: sport, p_day: cairoDate(), p_minute: new Date().toISOString().slice(0, 16), p_day_limit: DAILY_BUDGET, p_min_limit: MINUTE_BUDGET }),
  });
  const verdict = res ? await res.json().catch(() => null) : null;
  if (verdict === 'ok' || verdict === 'day' || verdict === 'minute') return verdict;
  return takeBudget(sport) ? 'ok' : 'day'; // المخزن المشترك غير متاح → الحد المحلي
}


Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'طريقة الطلب غير مدعومة.' }, 405);

  const relayUrl = Deno.env.get('RELAY_URL'); // لو مضبوط، الطلبات تمر عبر سيرفر بعنوان IP ثابت بدل الاتصال المباشر
  const relaySecret = Deno.env.get('RELAY_SECRET') ?? '';
  const apiKey = Deno.env.get('API_FOOTBALL_KEY') ?? '';
  if (!apiKey && !(relayUrl && relaySecret)) return jsonResponse({ error: 'الخدمة غير مهيأة بعد.' }, 503);

  let body: { action?: string; date?: string; fixtureId?: number; teamId?: number; playerId?: number; sport?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'صيغة الطلب غير صالحة.' }, 400);
  }


  // ---------- الفريق واللاعب (كرة القدم): كاش طويل لتوفير الحصة ----------
  if (body.action === 'team' || body.action === 'player' || body.action === 'form') {
    const id = Number(body.action === 'player' ? body.playerId : body.teamId);
    if (!Number.isSafeInteger(id) || id < 1) return jsonResponse({ error: 'الرقم المطلوب غير صالح.' }, 400);
    const key = `football:${body.action}:${id}`;
    const mem = cache.get(key);
    if (mem && mem.expires > Date.now()) return jsonResponse(mem.payload);
    const shared = await dbGet(key);
    if (shared && shared.expires > Date.now()) { cache.set(key, shared); return jsonResponse(shared.payload); }
    const stale = mem ?? shared;
    const call = async (path: string, q: Record<string, string>) => {
      if ((await takeSharedBudget('football')) !== 'ok') throw new Error('budget');
      const r = await providerFetch('football', path, new URLSearchParams(q), apiKey, relayUrl, relaySecret);
      if (!r.ok) throw new Error(`http ${r.status}`);
      const j = await r.json();
      return Array.isArray(j.response) ? j.response : [];
    };
    try {
      let out: Record<string, unknown>;
      if (body.action === 'form') {
        // آخر 10 مباريات منتهية للفريق (طلب واحد). لو الخطة ما بتدعم last نجرب الموسم ونرتّب.
        // deno-lint-ignore no-explicit-any
        let rows: any[] = []; let failed: unknown = null;
        try { rows = await call('fixtures', { team: String(id), last: '10', timezone: 'Africa/Cairo' }); } catch (e) { failed = e; }
        if (!rows.length && !(failed instanceof Error && failed.message === 'budget')) {
          const c = cairoDate(); const yy = Number(c.slice(0, 4)); const mm = Number(c.slice(5, 7));
          try { rows = await call('fixtures', { team: String(id), season: String(mm >= 8 ? yy : yy - 1), timezone: 'Africa/Cairo' }); failed = null; } catch (e) { failed = e; }
        }
        if (!rows.length && failed) throw failed; // لا نخزّن قائمة فاضية بسبب خطأ مؤقت
        const done = new Set(['FT', 'AET', 'PEN']);
        const matches = rows
          .filter((r) => done.has(r.fixture?.status?.short) && r.goals?.home != null && r.goals?.away != null)
          .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
          .slice(0, 10)
          .map((r) => {
            const isHome = r.teams?.home?.id === id;
            const gf = isHome ? r.goals.home : r.goals.away; const ga = isHome ? r.goals.away : r.goals.home;
            return {
              fixture_id: r.fixture.id, date: r.fixture.date, league: r.league?.name ?? '',
              home: r.teams?.home?.name ?? '', away: r.teams?.away?.name ?? '', home_logo: r.teams?.home?.logo ?? null, away_logo: r.teams?.away?.logo ?? null,
              home_goals: r.goals.home, away_goals: r.goals.away, is_home: isHome,
              result: gf > ga ? 'W' : gf < ga ? 'L' : 'D',
            };
          });
        out = { matches };
      } else if (body.action === 'team') {
        const [t, squad, coach] = [
          await call('teams', { id: String(id) }),
          await call('players/squads', { team: String(id) }).catch(() => []),
          await call('coachs', { team: String(id) }).catch(() => []),
        ];
        const row = t[0];
        if (!row) return jsonResponse({ error: 'الفريق غير متاح.' }, 404);
        out = {
          team: { id, name: row.team?.name ?? '', logo: row.team?.logo ?? null, country: row.team?.country ?? '', founded: row.team?.founded ?? null, national: Boolean(row.team?.national) },
          venue: { name: row.venue?.name ?? '', city: row.venue?.city ?? '', capacity: row.venue?.capacity ?? null, image: row.venue?.image ?? null, surface: row.venue?.surface ?? '' },
          coach: (() => {
            // deno-lint-ignore no-explicit-any
            const cur = (coach as any[]).find((c) => (c.career ?? []).some((x: any) => x.team?.id === id && !x.end)) ?? (coach as any[])[0];
            return cur ? { name: cur.name ?? '', photo: cur.photo ?? null, nationality: cur.nationality ?? '', age: cur.age ?? null } : null;
          })(),
          // deno-lint-ignore no-explicit-any
          squad: ((squad as any[])[0]?.players ?? []).map((p: any) => ({ id: p.id, name: p.name ?? '', age: p.age ?? null, number: p.number ?? null, position: p.position ?? '', photo: p.photo ?? `https://media.api-sports.io/football/players/${p.id}.png` })),
        };
      } else {
        const c = cairoDate(); const y = Number(c.slice(0, 4)); const m = Number(c.slice(5, 7));
        const season = m >= 8 ? y : y - 1;
        let rows = await call('players', { id: String(id), season: String(season) });
        if (!rows.length) rows = await call('players', { id: String(id), season: String(season - 1) });
        const row = rows[0];
        if (!row) return jsonResponse({ error: 'بيانات اللاعب غير متاحة.' }, 404);
        const st = Array.isArray(row.statistics) ? row.statistics : [];
        const sum = (f: (x: any) => number | null | undefined) => st.reduce((a: number, x: any) => a + (Number(f(x)) || 0), 0);
        const first = st[0] ?? {};
        const ratings = st.map((x: any) => Number(x.games?.rating)).filter((n: number) => n > 0);
        out = {
          player: {
            id, name: row.player?.name ?? '', firstname: row.player?.firstname ?? '', lastname: row.player?.lastname ?? '',
            age: row.player?.age ?? null, birth: row.player?.birth?.date ?? null, birth_country: row.player?.birth?.country ?? '',
            nationality: row.player?.nationality ?? '', height: row.player?.height ?? '', weight: row.player?.weight ?? '',
            photo: row.player?.photo ?? `https://media.api-sports.io/football/players/${id}.png`,
          },
          team: { id: first.team?.id ?? null, name: first.team?.name ?? '', logo: first.team?.logo ?? null },
          position: first.games?.position ?? '', number: first.games?.number ?? null, season,
          stats: {
            appearances: sum((x) => x.games?.appearences), minutes: sum((x) => x.games?.minutes),
            goals: sum((x) => x.goals?.total), assists: sum((x) => x.goals?.assists),
            yellow: sum((x) => x.cards?.yellow), red: sum((x) => x.cards?.red),
            rating: ratings.length ? Number((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1)) : null,
          },
        };
      }
      // كاش طويل لتوفير الحصة: الفريق أسبوع، اللاعب 3 أيام، آخر المباريات 6 ساعات
      const exp = Date.now() + (body.action === 'form' ? 6 * 60 : body.action === 'team' ? 7 * 24 * 60 : 3 * 24 * 60) * MIN;
      cache.set(key, { payload: out, expires: exp });
      await dbSet(key, out, exp);
      return jsonResponse(out);
    } catch (error) {
      console.error('team/player failed:', error);
      if (stale) return jsonResponse(stale.payload);
      return jsonResponse({ error: (error as Error).message === 'budget' ? 'الخدمة مشغولة حاليًا. حاول بعد قليل.' : 'تعذّر تحميل البيانات.' }, 502);
    }
  }

  const sport: Sport = body.sport === 'basketball' ? 'basketball' : 'football';
  const params = new URLSearchParams({ timezone: 'Africa/Cairo' });
  if (body.action === 'fixtures') {
    if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return jsonResponse({ error: 'التاريخ المطلوب غير صالح.' }, 400);
    const parsed = new Date(`${body.date}T00:00:00Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== body.date) {
      return jsonResponse({ error: 'التاريخ المطلوب غير صالح.' }, 400);
    }
    if (body.date < cairoDate(-7) || body.date > cairoDate(7)) {
      return jsonResponse({ error: 'يمكن طلب مباريات الأسبوع الماضي والأسبوع القادم فقط.' }, 400);
    }
    params.set('date', body.date);
  } else if (body.action === 'fixture') {
    if (!Number.isSafeInteger(body.fixtureId) || Number(body.fixtureId) < 1) return jsonResponse({ error: 'رقم المباراة غير صالح.' }, 400);
    params.set('id', String(body.fixtureId));
  } else {
    return jsonResponse({ error: 'نوع الطلب غير معروف.' }, 400);
  }

  const cacheKey = `${sport}:${body.action === 'fixtures' ? `d:${body.date}` : `f:${body.fixtureId}`}`;
  let hit = cache.get(cacheKey);
  if (hit && hit.expires > Date.now()) return jsonResponse(hit.payload);
  if (!hit || hit.expires <= Date.now()) {
    const shared = await dbGet(cacheKey); // كاش مشترك بين النسخ
    if (shared) {
      if (shared.expires > Date.now()) { cache.set(cacheKey, shared); return jsonResponse(shared.payload); }
      hit = shared; // منتهٍ لكن نحتفظ به كنسخة احتياطية لو تعذّر الجلب
    }
  }

  let job = inflight.get(cacheKey);
  if (!job) {
    job = (async (): Promise<JobResult> => {
      const verdict = await takeSharedBudget(sport);
      if (verdict !== 'ok') {
        if (hit) { cache.set(cacheKey, { payload: hit.payload, expires: Date.now() + 30_000 }); return { payload: hit.payload }; }
        return { error: verdict === 'minute' ? 'الخدمة مشغولة لحظات. حاول بعد دقيقة.' : 'الخدمة مشغولة حاليًا. حاول لاحقًا.', status: 429 };
      }
      try {
        const response = await providerFetch(sport, sport === 'football' ? 'fixtures' : 'games', params, apiKey, relayUrl, relaySecret);
        if (!response.ok) {
          if (hit) return { payload: hit.payload };
          return {
            error: response.status === 429 ? 'الخدمة مشغولة حاليًا. حاول لاحقًا.' : 'تعذّر جلب البيانات حاليًا.',
            status: response.status === 429 ? 429 : 502,
          };
        }
        const payload = await response.json();
        const hasErrors = Array.isArray(payload.errors) ? payload.errors.length > 0 : payload.errors && Object.keys(payload.errors).length > 0;
        if (hasErrors) return { error: 'تعذّر تحميل البيانات حاليًا.', status: 502 };

        const normalize = sport === 'football' ? normalizeFootball : normalizeBasketball;
        const rows = Array.isArray(payload.response) ? payload.response : [];
        let out: Record<string, unknown>;
        let ttl: number;
        if (body.action === 'fixture') {
          const raw = rows.find((r: { fixture?: { id?: number }; id?: number }) => (sport === 'football' ? r.fixture?.id : r.id) === body.fixtureId);
          const fixture = raw ? normalize(raw) : null;
          out = fixture && sport === 'football' ? { fixture, ...extractDetails(raw) } : { fixture };
          const soon = fixture?.kickoff ? new Date(fixture.kickoff).getTime() - Date.now() < 2 * 60 * MIN : false;
          ttl = fixture?.status === 'live' ? 3 * MIN : fixture?.status === 'finished' ? 6 * 60 * MIN : soon ? 10 * MIN : 3 * 60 * MIN;
        } else {
          const fixtures = rows.filter((item: unknown) => isImportant(sport, item)).map(normalize);
          out = { fixtures, leagues: leaguesFor(sport) };
          const anyLive = fixtures.some((item: Normalized) => item.status === 'live');
          ttl = anyLive ? 5 * MIN : body.date === cairoDate() ? 20 * MIN : body.date < cairoDate() ? (body.date < cairoDate(-1) ? 24 : 12) * 60 * MIN : (body.date > cairoDate(1) ? 6 : 3) * 60 * MIN;
        }
        cache.set(cacheKey, { payload: out, expires: Date.now() + ttl });
        await dbSet(cacheKey, out, Date.now() + ttl);
        return { payload: out };
      } catch (error) {
        console.error('Sports provider request failed:', error);
        if (hit) return { payload: hit.payload };
        return { error: 'تعذّر تحميل البيانات. حاول مرة أخرى.', status: 502 };
      }
    })().finally(() => inflight.delete(cacheKey));
    inflight.set(cacheKey, job);
  }

  const result = await job;
  if (result.payload) return jsonResponse(result.payload);
  return jsonResponse({ error: result.error ?? 'خطأ غير معروف.' }, result.status ?? 502);
});
