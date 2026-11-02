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
  return { events, lineups, stats };
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

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'طريقة الطلب غير مدعومة.' }, 405);

  const apiKey = Deno.env.get('API_FOOTBALL_KEY');
  if (!apiKey) return jsonResponse({ error: 'مفتاح API-Football غير مضبوط في إعدادات الخادم.' }, 503);

  let body: { action?: string; date?: string; fixtureId?: number; sport?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'صيغة الطلب غير صالحة.' }, 400);
  }

  const sport: Sport = body.sport === 'basketball' ? 'basketball' : 'football';
  const params = new URLSearchParams({ timezone: 'Africa/Cairo' });
  if (body.action === 'fixtures') {
    if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return jsonResponse({ error: 'التاريخ المطلوب غير صالح.' }, 400);
    const parsed = new Date(`${body.date}T00:00:00Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== body.date) {
      return jsonResponse({ error: 'التاريخ المطلوب غير صالح.' }, 400);
    }
    if (![cairoDate(-1), cairoDate(), cairoDate(1)].includes(body.date)) {
      return jsonResponse({ error: 'يمكن طلب مباريات أمس أو اليوم أو غدًا فقط.' }, 400);
    }
    params.set('date', body.date);
  } else if (body.action === 'fixture') {
    if (!Number.isSafeInteger(body.fixtureId) || Number(body.fixtureId) < 1) return jsonResponse({ error: 'رقم المباراة غير صالح.' }, 400);
    params.set('id', String(body.fixtureId));
  } else {
    return jsonResponse({ error: 'نوع الطلب غير معروف.' }, 400);
  }

  const cacheKey = `${sport}:${body.action === 'fixtures' ? `d:${body.date}` : `f:${body.fixtureId}`}`;
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > Date.now()) return jsonResponse(hit.payload);

  let job = inflight.get(cacheKey);
  if (!job) {
    job = (async (): Promise<JobResult> => {
      if (!takeBudget(sport)) {
        return hit ? { payload: hit.payload } : { error: 'تم الوصول للحد اليومي لطلبات المزوّد. حاول غدًا.', status: 429 };
      }
      try {
        const response = await fetch(`${PROVIDERS[sport]}?${params}`, {
          headers: { 'x-apisports-key': apiKey },
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) {
          if (hit) return { payload: hit.payload };
          return {
            error: response.status === 429 ? 'تم تجاوز حد الطلبات في المزوّد. حاول لاحقًا.' : 'تعذّر جلب البيانات من المزوّد.',
            status: response.status === 429 ? 429 : 502,
          };
        }
        const payload = await response.json();
        const hasErrors = Array.isArray(payload.errors) ? payload.errors.length > 0 : payload.errors && Object.keys(payload.errors).length > 0;
        if (hasErrors) return { error: 'رفض المزوّد الطلب. تحقق من صلاحية المفتاح والباقة.', status: 502 };

        const normalize = sport === 'football' ? normalizeFootball : normalizeBasketball;
        const rows = Array.isArray(payload.response) ? payload.response : [];
        let out: Record<string, unknown>;
        let ttl: number;
        if (body.action === 'fixture') {
          const raw = rows.find((r: { fixture?: { id?: number }; id?: number }) => (sport === 'football' ? r.fixture?.id : r.id) === body.fixtureId);
          const fixture = raw ? normalize(raw) : null;
          out = fixture && sport === 'football' ? { fixture, ...extractDetails(raw) } : { fixture };
          const soon = fixture?.kickoff ? new Date(fixture.kickoff).getTime() - Date.now() < 2 * 60 * MIN : false;
          ttl = fixture?.status === 'live' ? 3 * MIN : fixture?.status === 'finished' ? 6 * 60 * MIN : soon ? 10 * MIN : 60 * MIN;
        } else {
          const fixtures = rows.filter((item: unknown) => isImportant(sport, item)).map(normalize);
          out = { fixtures, leagues: leaguesFor(sport) };
          const anyLive = fixtures.some((item: Normalized) => item.status === 'live');
          ttl = anyLive ? 5 * MIN : body.date === cairoDate() ? 10 * MIN : 60 * MIN;
        }
        cache.set(cacheKey, { payload: out, expires: Date.now() + ttl });
        return { payload: out };
      } catch (error) {
        console.error('Sports provider request failed:', error);
        if (hit) return { payload: hit.payload };
        return { error: 'تعذّر الاتصال بالمزوّد. حاول مرة أخرى.', status: 502 };
      }
    })().finally(() => inflight.delete(cacheKey));
    inflight.set(cacheKey, job);
  }

  const result = await job;
  if (result.payload) return jsonResponse(result.payload);
  return jsonResponse({ error: result.error ?? 'خطأ غير معروف.' }, result.status ?? 502);
});
