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
  // الترتيب حسب شعبية البطولات عند الجمهور المصري (الأدمن يقدر يغيّره من لوحة التحكم ← البطولات).
  // كأس مصر بتتعرف بالاسم وبتتحط تلقائيًا بعد الدوري الإيطالي/الألماني/الفرنسي (المركز ١٠).
  [233, 'الدوري المصري الممتاز'], [39, 'الدوري الإنجليزي الممتاز'], [2, 'دوري أبطال أوروبا'], [140, 'الدوري الإسباني'], [6, 'كأس أمم أفريقيا'],
  [5, 'دوري الأمم الأوروبية'], [36, 'تصفيات كأس أمم أفريقيا'],
  [307, 'الدوري السعودي'], [135, 'الدوري الإيطالي'], [78, 'الدوري الألماني'], [61, 'الدوري الفرنسي'],
  [3, 'الدوري الأوروبي'], [20, 'كأس الكونفدرالية الأفريقية'],
  // بعد الـ١٢ المطلوبين: بطولات مهمة للمصريين
  [12, 'دوري أبطال أفريقيا'], [1, 'كأس العالم'], [29, 'تصفيات كأس العالم - أفريقيا'], [15, 'كأس العالم للأندية'],
  [10, 'مباريات ودية للمنتخبات'], [667, 'مباريات ودية للأندية'],
  [143, 'كأس ملك إسبانيا'], [45, 'كأس الاتحاد الإنجليزي'], [48, 'كأس الرابطة الإنجليزية'],
];
// فرق مهمة للجمهور المصري: مبارياتها تظهر حتى لو بطولتها مش في القائمة (إنتر ميامي = ميسي، طرابزون سبور = محمد صلاح...)
// مباريات الفرق دي بتظهر في أي بطولة (كأس مصر، ودي، ...). الأدمن يقدر يضيف فرق من لوحة التحكم (site_settings.top_teams)
const PRIORITY_TEAMS = /al[ -]?ahly(?! tripoli| benghazi)|zamalek|pyramids|ismaily|al[ -]?masry|ittihad.*alex|alex.*ittihad|real madrid|barcelona|liverpool|manchester city|manchester united|chelsea|arsenal|bayern|juventus|paris saint|inter miami|trabzonspor|al[- ]?hilal(?! al)|al[- ]?nassr/i;
let customTeams: { at: number; names: string[] } = { at: 0, names: [] };
const loadCustomTeams = async () => {
  if (Date.now() - customTeams.at < 5 * 60_000) return customTeams.names;
  try {
    const res = await sb('site_settings?key=eq.top_teams&select=value');
    const rows = res ? await res.json().catch(() => null) : null;
    const v = Array.isArray(rows) ? rows[0]?.value : null;
    customTeams = { at: Date.now(), names: Array.isArray(v) ? v.map((t: { en?: string }) => String(t?.en ?? '').trim().toLowerCase()).filter(Boolean) : [] };
  } catch { customTeams = { at: Date.now(), names: [] }; }
  return customTeams.names;
};
const FOOTBALL_LEAGUES: Record<number, string> = Object.fromEntries(FOOTBALL_LEAGUE_LIST);
// الودية: نعرض بس المباريات المهمة (منتخبات كبيرة / أندية كبيرة) عشان القائمة ما تتملّاش بمباريات مالهاش لازمة
const FRIENDLY_NATIONS = /^(egypt|saudi arabia|morocco|algeria|tunisia|senegal|nigeria|ivory coast|cameroon|ghana|mali|brazil|argentina|france|england|spain|germany|italy|portugal|netherlands|belgium|croatia|uruguay|colombia|mexico|usa|united states|japan|south korea|turkey|denmark|switzerland)$/i;
const FRIENDLY_CLUBS = /atl[eé]tico madrid|tottenham|dortmund|napoli|ac milan|\broma\b|benfica|porto|ajax|newcastle|aston villa|leverkusen|sevilla|al[- ]?ittihad(?! alex)|al[- ]?ahli (jeddah|saudi)|al[- ]?ahli$|al[- ]?shabab|al[- ]?ettifaq|wydad|raja|esperance|mamelodi|inter\b/i;
// deno-lint-ignore no-explicit-any
const nameLabel = (item: any): string | null => {
  const n = String(item.league?.name ?? '');
  if (/^uefa nations league$/i.test(n)) return 'دوري الأمم الأوروبية';
  if (/africa cup of nations.*qualif|afcon.*qualif/i.test(n)) return 'تصفيات كأس أمم أفريقيا';
  return null;
};
// بطولات مصرية بالاسم (احتياطًا لو رقمها مختلف) + أسماء البلدان للبطولات الأخرى
const EGYPT_NAMED: [RegExp, string][] = [[/super/i, 'السوبر المصري'], [/league cup/i, 'كأس الرابطة المصرية'], [/cup|kass|كأس/i, 'كأس مصر'], [/second league|2nd division|division 2/i, 'الدوري المصري - الدرجة الثانية']];
const COUNTRY_AR: Record<string, string> = { Egypt: 'مصر', Saudi_Arabia: 'السعودية', 'Saudi-Arabia': 'السعودية', Morocco: 'المغرب', Tunisia: 'تونس', Algeria: 'الجزائر', UAE: 'الإمارات', 'United-Arab-Emirates': 'الإمارات', Qatar: 'قطر', Kuwait: 'الكويت', Jordan: 'الأردن', Iraq: 'العراق', Libya: 'ليبيا', Sudan: 'السودان', Lebanon: 'لبنان', Syria: 'سوريا', Bahrain: 'البحرين', Oman: 'عمان', England: 'إنجلترا', Spain: 'إسبانيا', Italy: 'إيطاليا', Germany: 'ألمانيا', France: 'فرنسا', Portugal: 'البرتغال', Netherlands: 'هولندا', Belgium: 'بلجيكا', Turkey: 'تركيا', Scotland: 'اسكتلندا', Greece: 'اليونان', Russia: 'روسيا', Ukraine: 'أوكرانيا', Brazil: 'البرازيل', Argentina: 'الأرجنتين', USA: 'أمريكا', Mexico: 'المكسيك', Japan: 'اليابان', China: 'الصين', 'South-Korea': 'كوريا الجنوبية', Australia: 'أستراليا', 'South-Africa': 'جنوب أفريقيا', Nigeria: 'نيجيريا', Ghana: 'غانا', Senegal: 'السنغال', World: 'العالم', Europe: 'أوروبا', Africa: 'أفريقيا', Asia: 'آسيا', 'South-America': 'أمريكا الجنوبية' };
const SKIP_NAME = /women|femin|\bu-?\d{2}\b|youth|reserve|junior|\bw\b/i;
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
const egyptLabel = (item: any): string | null => {
  if (!/^egypt$/i.test(String(item.league?.country ?? ''))) return null;
  const n = String(item.league?.name ?? '');
  return EGYPT_NAMED.find(([re]) => re.test(n))?.[1] ?? null;
};
// deno-lint-ignore no-explicit-any
const otherLabel = (item: any): string => {
  const name = String(item.league?.name ?? 'كرة القدم'); const c = String(item.league?.country ?? '');
  const ar = COUNTRY_AR[c.replace(/ /g, '-')] ?? COUNTRY_AR[c.replace(/ /g, '_')];
  return ar ? `${name} · ${ar}` : (c && c !== 'World' ? `${name} · ${c}` : name);
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
    league_label: FOOTBALL_LEAGUES[id] ?? nameLabel(item) ?? egyptLabel(item) ?? otherLabel(item),
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
      coach_photo: l.coach?.photo ?? null,
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
const isImportant = (sport: Sport, item: any, custom: string[] = []) =>
  sport === 'football'
    ? !SKIP_NAME.test(String(item.league?.name ?? '')) && (
        (() => {
          const lid = Number(item.league?.id);
          const t = [item.teams?.home?.name, item.teams?.away?.name].map((n) => String(n ?? '').trim());
          if (lid === 10) return t.some((n) => FRIENDLY_NATIONS.test(n)); // ودية المنتخبات: لو أي منتخب كبير
          if (lid === 667) return t.some((n) => PRIORITY_TEAMS.test(n) || FRIENDLY_CLUBS.test(n) || custom.includes(n.toLowerCase()));
          return lid in FOOTBALL_LEAGUES || nameLabel(item) !== null;
        })() || egyptLabel(item) !== null ||
        [item.teams?.home?.name, item.teams?.away?.name].some((n) => PRIORITY_TEAMS.test(String(n ?? '')) || custom.includes(String(n ?? '').trim().toLowerCase())))
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
// حفظ تلقائي للمباريات المهمة (fixture_overrides.snapshot): تظهر للزوار حتى لو الـ API وقف، والأدمن يقدر يعدّلها.
// بنضيف الجديد بس ونحدّث النسخة القديمة، وما بنلمسش اللي الأدمن عدّله بنفسه (_edited) أو شاله من المهمة (hide_important).
async function autoSaveImportant(fixtures: Normalized[]) {
  try {
    if (!sbReady()) return;
    const now = Date.now();
    const list = fixtures.filter((f) => f.fixture_id && f.kickoff && Date.parse(f.kickoff) > now - 36 * 3600_000 && Date.parse(f.kickoff) < now + 8 * 24 * 3600_000).slice(0, 80);
    if (!list.length) return;
    const ids = list.map((f) => f.fixture_id).join(',');
    const res = await sb(`fixture_overrides?fixture_id=in.(${ids})&select=fixture_id,hide_important,snapshot`);
    const rows: { fixture_id: number; hide_important?: boolean; snapshot?: { _edited?: boolean } | null }[] = res ? await res.json().catch(() => []) : [];
    const have = new Map(rows.map((r) => [Number(r.fixture_id), r]));
    const fresh: Record<string, unknown>[] = []; const refresh: Record<string, unknown>[] = []; const stamp = new Date().toISOString();
    for (const f of list) {
      const old = have.get(Number(f.fixture_id));
      if (!old) fresh.push({ fixture_id: f.fixture_id, snapshot: f, featured: true, title: `${f.home_team} × ${f.away_team}`, updated_at: stamp });
      else if (!old.hide_important && !old.snapshot?._edited) refresh.push({ fixture_id: f.fixture_id, snapshot: f });
    }
    const post = (body: Record<string, unknown>[]) => body.length ? sb('fixture_overrides?on_conflict=fixture_id', { method: 'POST', headers: { prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(body) }) : Promise.resolve(null);
    await Promise.all([post(fresh), post(refresh)]);
  } catch (error) { console.error('auto-save important failed:', error); }
}
// أولويات الحصة اليومية: القوائم أهم من التفاصيل، والتفاصيل أهم من الفرق/اللاعبين — عشان القوائم ما تتحرمش لو حد فتح مباريات كتير.
const BUDGET_LIST = 90, BUDGET_DETAIL = 72, BUDGET_EXTRA = 55;
async function takeSharedBudget(sport: Sport, limit = BUDGET_LIST): Promise<'ok' | 'day' | 'minute'> {
  const res = await sb('rpc/take_api_budget', {
    method: 'POST',
    body: JSON.stringify({ p_sport: sport, p_day: cairoDate(), p_minute: new Date().toISOString().slice(0, 16), p_day_limit: limit, p_min_limit: MINUTE_BUDGET }),
  });
  const verdict = res ? await res.json().catch(() => null) : null;
  if (verdict === 'ok' || verdict === 'day' || verdict === 'minute') return verdict;
  return takeBudget(sport) ? 'ok' : 'day'; // المخزن المشترك غير متاح → الحد المحلي
}
const cairoDateOf = (iso: string) => { try { return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' }); } catch { return ''; } };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// حد لكل IP على الطلبات اللي هتروح للمزوّد فعلًا (مش اللي من الكاش) — يمنع واحد يستنزف الحصة بأرقام مباريات عشوائية.
async function ipAllowed(request: Request): Promise<boolean> {
  const ip = (request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '').split(',')[0].trim().slice(0, 45);
  if (!ip) return true;
  const res = await sb('rpc/take_api_budget', { method: 'POST', body: JSON.stringify({ p_sport: 'ip:' + ip, p_day: cairoDate(), p_minute: new Date().toISOString().slice(0, 16), p_day_limit: 300, p_min_limit: 10 }) });
  const v = res ? await res.json().catch(() => null) : null;
  return v === null || v === 'ok';
}
// قفل بسيط بين النسخ: أول نسخة تاخد القفل وتروح للمزوّد، والباقي ينتظر نتيجتها من الكاش بدل ما كل واحدة تصرف طلب.
async function claimLock(key: string, secs = 15): Promise<boolean> {
  const slot = Math.floor(Date.now() / (secs * 1000));
  const res = await sb('api_budget?on_conflict=bucket', { method: 'POST', headers: { prefer: 'resolution=ignore-duplicates,return=representation' }, body: JSON.stringify({ bucket: `l:${key}:${slot}`.slice(0, 200), used: 1 }) });
  if (!res) return true; // المخزن مش متاح → كمّل
  const rows = await res.json().catch(() => null);
  return Array.isArray(rows) ? rows.length > 0 : true;
}
// استهلاك النهارده (للمراقبة وللتوسيع التلقائي للكاش لما الحصة تقل)
let usedMemo = { at: 0, used: 0 };
async function budgetUsed(): Promise<number> {
  if (Date.now() - usedMemo.at < 30_000) return usedMemo.used;
  const res = await sb(`api_budget?bucket=eq.${encodeURIComponent('d:football:' + cairoDate())}&select=used`);
  const rows = res ? await res.json().catch(() => null) : null;
  const used = Array.isArray(rows) && rows[0] ? Number(rows[0].used) || 0 : 0;
  usedMemo = { at: Date.now(), used }; return used;
}
// الفرق اللي فيه مستخدمين بيتابعوها: المباريات دي بتتحدّث بسرعة، وباقي المباريات المباشرة بتتحدّث أبطأ — توفير للحصة.
let folMemo: { at: number; ids: Set<number> } = { at: 0, ids: new Set() };
async function followedIds(): Promise<Set<number>> {
  if (Date.now() - folMemo.at < 5 * MIN) return folMemo.ids;
  const res = await sb('rpc/followed_team_api_ids', { method: 'POST', body: '{}' });
  const rows = res ? await res.json().catch(() => null) : null;
  folMemo = { at: Date.now(), ids: new Set<number>((Array.isArray(rows) ? rows : []).map(Number).filter((n: number) => n > 0)) };
  return folMemo.ids;
}
const isFol = (fol: Set<number>, f: { home_id?: unknown; away_id?: unknown } | null | undefined) => Boolean(f && (fol.has(Number(f.home_id)) || fol.has(Number(f.away_id))));
const ttlFactor = async () => { const u = await budgetUsed(); return u >= 70 ? 3 : u >= 45 ? 1.6 : 1; };


// ---------- أرشيف مباريات الفرق المهمة (جدول team_matches) ----------
// الفرق المهمة = الفرق اللي ليها api_id في push_targets. أي مباراة ليهم بتتحفظ، فآخر النتائج والقادمة تفضل متاحة حتى لو حصة الـ API خلصت.
const STANDINGS_LEAGUES = new Set([39, 140, 135, 78, 61, 2, 3, 848, 233, 307, 305, 301, 200, 202, 186, 12, 1, 4, 5, 9, 15, 29, 32, 34]);
let archiveIds: { ids: Set<number>; exp: number } | null = null;
async function importantTeamIds(): Promise<Set<number>> {
  if (archiveIds && archiveIds.exp > Date.now()) return archiveIds.ids;
  const res = await sb('push_targets?kind=eq.team&active=eq.true&api_id=not.is.null&select=api_id');
  const rows = res ? await res.json().catch(() => null) : null;
  const ids = new Set<number>((Array.isArray(rows) ? rows : []).map((r: { api_id: number }) => Number(r.api_id)).filter((n: number) => n > 0));
  archiveIds = { ids, exp: Date.now() + 30 * MIN };
  return ids;
}
// deno-lint-ignore no-explicit-any
async function archiveFixtures(rows: any[]) {
  try {
    const ids = await importantTeamIds();
    if (!ids.size) return;
    const keep = rows.filter((r) => ids.has(r.teams?.home?.id) || ids.has(r.teams?.away?.id)).map((r) => ({
      fixture_id: r.fixture?.id, date: r.fixture?.date, status: r.fixture?.status?.short ?? '',
      league_id: r.league?.id ?? null, league: r.league?.name ?? '',
      home_id: r.teams?.home?.id ?? null, away_id: r.teams?.away?.id ?? null,
      home: r.teams?.home?.name ?? '', away: r.teams?.away?.name ?? '', home_logo: r.teams?.home?.logo ?? null, away_logo: r.teams?.away?.logo ?? null,
      home_goals: r.goals?.home ?? null, away_goals: r.goals?.away ?? null, updated_at: new Date().toISOString(),
    })).filter((x) => x.fixture_id && x.date);
    if (!keep.length) return;
    await sb('team_matches?on_conflict=fixture_id', { method: 'POST', headers: { prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(keep) });
  } catch (e) { console.error('archive failed:', e); }
}
async function archivedFor(teamId: number) {
  const res = await sb(`team_matches?or=(home_id.eq.${teamId},away_id.eq.${teamId})&order=date.desc&limit=80&select=*`);
  const rows = res ? await res.json().catch(() => null) : null;
  return Array.isArray(rows) ? rows : [];
}


Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse({ error: 'طريقة الطلب غير مدعومة.' }, 405);

  const relayUrl = Deno.env.get('RELAY_URL'); // لو مضبوط، الطلبات تمر عبر سيرفر بعنوان IP ثابت بدل الاتصال المباشر
  const relaySecret = Deno.env.get('RELAY_SECRET') ?? '';
  const apiKey = Deno.env.get('API_FOOTBALL_KEY') ?? '';
  if (!apiKey && !(relayUrl && relaySecret)) return jsonResponse({ error: 'الخدمة غير مهيأة بعد.' }, 503);

  let body: { action?: string; date?: string; fixtureId?: number; teamId?: number; playerId?: number; leagueId?: number; sport?: string; step?: string; ids?: number[] };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'صيغة الطلب غير صالحة.' }, 400);
  }



  // ---------- ترتيب الدوري والهدافين (كاش مشترك: الترتيب 3 ساعات، الهدافين 6 ساعات) ----------
  if (body.action === 'standings' || body.action === 'scorers') {
    const LEAGUES = STANDINGS_LEAGUES;
    const lid = Number(body.leagueId);
    if (!LEAGUES.has(lid)) return jsonResponse({ error: 'البطولة غير مدعومة.' }, 400);
    const key = `football:${body.action}:${lid}`;
    const mem = cache.get(key);
    if (mem && mem.expires > Date.now()) return jsonResponse(mem.payload);
    const shared = await dbGet(key);
    if (shared && shared.expires > Date.now()) { cache.set(key, shared); return jsonResponse(shared.payload); }
    const stale = mem ?? shared;
    // deno-lint-ignore no-explicit-any
    const call = async (path: string, q: Record<string, string>): Promise<any[]> => {
      if ((await takeSharedBudget('football', BUDGET_EXTRA)) !== 'ok') throw new Error('budget');
      const r = await providerFetch('football', path, new URLSearchParams(q), apiKey, relayUrl, relaySecret);
      if (!r.ok) throw new Error(`http ${r.status}`);
      const j = await r.json();
      const errs = j.errors && typeof j.errors === 'object' ? Object.values(j.errors as Record<string, unknown>).join(' | ') : '';
      if (errs && !(Array.isArray(j.response) && j.response.length)) throw new Error('api:' + errs);
      return Array.isArray(j.response) ? j.response : [];
    };
    // football-data.org (خطة مجانية بتدعم الموسم الحالي للدوريات الكبرى)
    const FD: Record<number, string> = { 39: 'PL', 140: 'PD', 135: 'SA', 78: 'BL1', 61: 'FL1', 2: 'CL', 1: 'WC', 4: 'EC' };
    const fdKey = Deno.env.get('FOOTBALL_DATA_KEY') ?? '';
    // deno-lint-ignore no-explicit-any
    const fd = async (path: string): Promise<any> => {
      const r = await fetch('https://api.football-data.org/v4/' + path, { headers: { 'X-Auth-Token': fdKey } });
      if (!r.ok) throw new Error(`fd ${r.status}`);
      return await r.json();
    };
    try {
      const c = cairoDate(); const y = Number(c.slice(0, 4)); const m = Number(c.slice(5, 7));
      const first = m >= 8 ? y : y - 1;
      let season = first;
      if (fdKey && FD[lid]) {
        const code = FD[lid];
        // deno-lint-ignore no-explicit-any
        let fo: Record<string, any> | null = null;
        try {
          if (body.action === 'standings') {
            const j = await fd(`competitions/${code}/standings`);
            // deno-lint-ignore no-explicit-any
            const sts = (j.standings ?? []).filter((g: any) => g.type === 'TOTAL');
            if (sts.length) fo = {
              league: { id: lid, name: j.competition?.name ?? '', logo: j.competition?.emblem ?? null, country: j.area?.name ?? '', season: Number(String(j.season?.startDate ?? '').slice(0, 4)) || season },
              // deno-lint-ignore no-explicit-any
              groups: sts.map((g: any) => (g.table ?? []).map((t: any) => ({
                rank: t.position, team: { id: null, name: t.team?.shortName || t.team?.name || '', logo: t.team?.crest ?? null },
                played: t.playedGames ?? 0, win: t.won ?? 0, draw: t.draw ?? 0, lose: t.lost ?? 0,
                gf: t.goalsFor ?? 0, ga: t.goalsAgainst ?? 0, gd: t.goalDifference ?? 0, points: t.points ?? 0,
                form: String(t.form ?? '').replace(/,/g, ''), note: '', group: g.group ? String(g.group).replace(/_/g, ' ') : '',
              }))),
            };
          } else {
            const j = await fd(`competitions/${code}/scorers?limit=20`);
            if ((j.scorers ?? []).length) fo = {
              season: Number(String(j.season?.startDate ?? '').slice(0, 4)) || season,
              // deno-lint-ignore no-explicit-any
              players: j.scorers.map((r: any) => ({
                id: null, name: r.player?.name ?? '', photo: null, nationality: r.player?.nationality ?? '',
                team: { id: null, name: r.team?.shortName || r.team?.name || '', logo: r.team?.crest ?? null },
                goals: r.goals ?? 0, assists: r.assists ?? 0, apps: r.playedMatches ?? 0, penalty: r.penalties ?? 0,
              })),
            };
          }
        } catch (e) { console.error('football-data failed:', e); }
        if (fo) {
          const exp = Date.now() + (body.action === 'standings' ? 3 : 6) * 60 * MIN;
          cache.set(key, { payload: fo, expires: exp });
          await dbSet(key, fo, exp);
          return jsonResponse(fo);
        }
      }
      // deno-lint-ignore no-explicit-any
      let out: Record<string, any>;
      if (body.action === 'standings') {
        let rows: any[] = []; let lastErr: unknown = null;
        for (const sx of [first, first - 1]) { if (rows.length) break; season = sx; try { rows = await call('standings', { league: String(lid), season: String(season) }); } catch (e) { lastErr = e; if ((e as Error).message === 'budget') throw e; } }
        if (!rows.length && lastErr) throw lastErr;
        const lg = rows[0]?.league;
        if (!lg) { console.error('standings empty', lid, first); return jsonResponse({ error: `لا توجد بيانات ترتيب لهذا الدوري (مواسم ${first} و${first - 1}) من المزوّد.` }, 404); }
        out = {
          league: { id: lid, name: lg.name ?? '', logo: lg.logo ?? null, country: lg.country ?? '', season: lg.season ?? season },
          // deno-lint-ignore no-explicit-any
          groups: (lg.standings ?? []).map((g: any[]) => g.map((t: any) => ({
            rank: t.rank, team: { id: t.team?.id, name: t.team?.name ?? '', logo: t.team?.logo ?? null },
            played: t.all?.played ?? 0, win: t.all?.win ?? 0, draw: t.all?.draw ?? 0, lose: t.all?.lose ?? 0,
            gf: t.all?.goals?.for ?? 0, ga: t.all?.goals?.against ?? 0, gd: t.goalsDiff ?? 0, points: t.points ?? 0,
            form: t.form ?? '', note: t.description ?? '', group: t.group ?? '',
          }))),
        };
      } else {
        let rows: any[] = []; let lastErr: unknown = null;
        for (const sx of [first, first - 1]) { if (rows.length) break; season = sx; try { rows = await call('players/topscorers', { league: String(lid), season: String(season) }); } catch (e) { lastErr = e; if ((e as Error).message === 'budget') throw e; } }
        if (!rows.length && lastErr) throw lastErr;
        if (!rows.length) return jsonResponse({ error: 'الهدافون غير متاحين حاليًا.' }, 404);
        out = {
          season,
          // deno-lint-ignore no-explicit-any
          players: rows.slice(0, 20).map((r: any) => {
            const s = r.statistics?.[0] ?? {};
            return {
              id: r.player?.id, name: r.player?.name ?? '', photo: r.player?.photo ?? null, nationality: r.player?.nationality ?? '',
              team: { id: s.team?.id ?? null, name: s.team?.name ?? '', logo: s.team?.logo ?? null },
              goals: s.goals?.total ?? 0, assists: s.goals?.assists ?? 0, apps: s.games?.appearences ?? 0, penalty: s.penalty?.scored ?? 0,
            };
          }),
        };
      }
      const exp = Date.now() + (body.action === 'standings' ? 3 : 6) * 60 * MIN;
      cache.set(key, { payload: out, expires: exp });
      await dbSet(key, out, exp);
      return jsonResponse(out);
    } catch (error) {
      console.error('league failed:', error);
      if (stale) return jsonResponse(stale.payload);
      const em = (error as Error).message;
      if (em.startsWith('api:')) return jsonResponse({ error: 'مزوّد البيانات رفض الطلب: ' + em.slice(4) }, 502);
      return jsonResponse({ error: em === 'budget' ? 'الخدمة مشغولة حاليًا. حاول بعد قليل.' : 'تعذّر تحميل البيانات.' }, 502);
    }
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
      if ((await takeSharedBudget('football', BUDGET_EXTRA)) !== 'ok') throw new Error('budget');
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
        // أرشيف السيرفر: بيكمّل أي نقص (أو بيعوّض لو الـ API رفضت)
        const arch = await archivedFor(id);
        if (!rows.length && failed && !arch.length) throw failed; // لا نخزّن قائمة فاضية بسبب خطأ مؤقت
        // deno-lint-ignore no-explicit-any
        const have = new Set(rows.map((r: any) => r.fixture?.id));
        for (const a of arch) {
          if (have.has(a.fixture_id)) continue;
          rows.push({ fixture: { id: a.fixture_id, date: a.date, status: { short: a.status } }, league: { id: a.league_id, name: a.league }, teams: { home: { id: a.home_id, name: a.home, logo: a.home_logo }, away: { id: a.away_id, name: a.away, logo: a.away_logo } }, goals: { home: a.home_goals, away: a.away_goals } });
        }
        const done = new Set(['FT', 'AET', 'PEN']);
        const matches = rows
          .filter((r) => done.has(r.fixture?.status?.short) && r.goals?.home != null && r.goals?.away != null)
          .sort((a, b) => new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime())
          .slice(0, 10)
          .map((r) => {
            const isHome = r.teams?.home?.id === id;
            const gf = isHome ? r.goals.home : r.goals.away; const ga = isHome ? r.goals.away : r.goals.home;
            return {
              fixture_id: r.fixture.id, date: r.fixture.date, league: r.league?.name ?? '', league_id: r.league?.id ?? null,
              home: r.teams?.home?.name ?? '', away: r.teams?.away?.name ?? '', home_logo: r.teams?.home?.logo ?? null, away_logo: r.teams?.away?.logo ?? null,
              home_goals: r.goals.home, away_goals: r.goals.away, is_home: isHome,
              result: gf > ga ? 'W' : gf < ga ? 'L' : 'D',
            };
          });
        // المباريات القادمة (طلب منفصل: فشله لا يمنع آخر النتائج)
        // deno-lint-ignore no-explicit-any
        let upRows: any[] = [];
        try { upRows = await call('fixtures', { team: String(id), next: '8', timezone: 'Africa/Cairo' }); } catch { /* الخطة قد لا تدعم next */ }
        const upSeen = new Set(upRows.map((r) => r.fixture?.id));
        for (const r of rows) if (!upSeen.has(r.fixture?.id) && new Date(r.fixture?.date).getTime() > Date.now() - 2 * 60 * MIN) upRows.push(r);
        const upcoming = upRows
          .filter((r) => ['NS', 'TBD', 'PST'].includes(r.fixture?.status?.short) && new Date(r.fixture?.date).getTime() > Date.now() - 2 * 60 * MIN)
          .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime())
          .slice(0, 8)
          .map((r) => ({
            fixture_id: r.fixture.id, date: r.fixture.date, league: r.league?.name ?? '', league_id: r.league?.id ?? null,
            home: r.teams?.home?.name ?? '', away: r.teams?.away?.name ?? '', home_logo: r.teams?.home?.logo ?? null, away_logo: r.teams?.away?.logo ?? null,
            is_home: r.teams?.home?.id === id,
          }));
        // بطولات الفريق (لتبويب الترتيب): من المباريات المعروفة، وإلا من المزوّد
        // deno-lint-ignore no-explicit-any
        let lids: number[] = [...new Set<number>(rows.map((r: any) => Number(r.league?.id)).filter((n: number) => STANDINGS_LEAGUES.has(n)))];
        if (!lids.length) {
          try {
            // deno-lint-ignore no-explicit-any
            const lr = await call('leagues', { team: String(id), current: 'true' }); lids = lr.map((x: any) => Number(x.league?.id)).filter((n: number) => STANDINGS_LEAGUES.has(n));
          } catch { /* اختياري */ }
        }
        const leagues = lids.map((lid) => ({ id: lid, name: (rows.find((r: { league?: { id?: number } }) => r.league?.id === lid)?.league?.name) ?? '' }));
        out = { matches, upcoming, leagues };
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
          competitions: st.map((x: any) => ({
            league: x.league?.name ?? '', league_logo: x.league?.logo ?? null, team: x.team?.name ?? '',
            appearances: Number(x.games?.appearences) || 0, minutes: Number(x.games?.minutes) || 0,
            goals: Number(x.goals?.total) || 0, assists: Number(x.goals?.assists) || 0,
            yellow: Number(x.cards?.yellow) || 0, red: Number(x.cards?.red) || 0,
            rating: Number(x.games?.rating) > 0 ? Number(Number(x.games.rating).toFixed(1)) : null,
          })),
          injured: Boolean(row.player?.injured),
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
      const exp = Date.now() + (body.action === 'form' ? 180 : body.action === 'team' ? 7 * 24 * 60 : 3 * 24 * 60) * MIN;
      cache.set(key, { payload: out, expires: exp });
      await dbSet(key, out, exp);
      return jsonResponse(out);
    } catch (error) {
      console.error('team/player failed:', error);
      if (stale) return jsonResponse(stale.payload);
      return jsonResponse({ error: (error as Error).message === 'budget' ? 'الخدمة مشغولة حاليًا. حاول بعد قليل.' : 'تعذّر تحميل البيانات.' }, 502);
    }
  }


  // ---------- كتالوج البطولات والفرق (أدمن فقط): step=leagues ثم step=teams لكل بطولة ----------
  if (body.action === 'catalog') {
    let admin = false;
    try {
      const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
      const r = await fetch(`${SB_URL}/rest/v1/rpc/is_admin`, { method: 'POST', headers: { apikey: anon, authorization: request.headers.get('authorization') ?? '', 'content-type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(4000) });
      admin = r.ok && (await r.json().catch(() => false)) === true;
    } catch { admin = false; }
    if (!admin) return jsonResponse({ error: 'هذه العملية للمسؤولين فقط.' }, 403);
    const call = async (path: string, q: Record<string, string>) => {
      const v = await takeSharedBudget('football', BUDGET_EXTRA);
      if (v === 'minute') return { wait: true } as const;
      if (v !== 'ok') return { budget: true } as const;
      const r = await providerFetch('football', path, new URLSearchParams(q), apiKey, relayUrl, relaySecret);
      if (!r.ok) return { fail: r.status } as const;
      const j = await r.json().catch(() => null);
      return { data: (j?.response ?? []) as Record<string, any>[] } as const;
    };
    const upsert = async (kind: string, rows: unknown[]) => {
      const r = await sb('rpc/catalog_upsert', { method: 'POST', body: JSON.stringify({ p_kind: kind, p_rows: rows }) });
      return r ? Number(await r.json().catch(() => 0)) || 0 : -1;
    };
    // ترتيب الأولوية عند الجمهور المصري + مطابقة بالاسم/الدولة (fb = رقم احتياطي لو البطولة مش «حالية» الآن)
    const RULES: { ar: string; c: RegExp; n: RegExp; fb?: number; t?: boolean }[] = [
      { t: true, ar: 'الدوري المصري الممتاز', c: /^egypt$/i, n: /^premier league$/i },
      { t: true, ar: 'الدوري الإنجليزي الممتاز', c: /^england$/i, n: /^premier league$/i },
      { t: true, ar: 'دوري أبطال أوروبا', c: /^world$/i, n: /^uefa champions league$/i, fb: 2 },
      { t: true, ar: 'الدوري الإسباني', c: /^spain$/i, n: /^la liga$/i },
      { t: true, ar: 'دوري أبطال أفريقيا', c: /^world$/i, n: /^caf champions league$/i, fb: 12 },
      { t: true, ar: 'الدوري السعودي للمحترفين', c: /^saudi/i, n: /pro league|professional league/i },
      { t: true, ar: 'كأس الأمم الأفريقية', c: /^world$/i, n: /^africa cup of nations$/i, fb: 6 },
      { t: true, ar: 'الدوري الإيطالي', c: /^italy$/i, n: /^serie a$/i },
      { t: true, ar: 'الدوري الألماني', c: /^germany$/i, n: /^bundesliga$/i },
      { t: true, ar: 'الدوري الفرنسي', c: /^france$/i, n: /^ligue 1$/i },
      { t: true, ar: 'كأس العالم', c: /^world$/i, n: /^world cup$/i, fb: 1 },
      { t: true, ar: 'الدوري الأوروبي', c: /^world$/i, n: /^uefa europa league$/i, fb: 3 },
      { ar: 'دوري أبطال آسيا للنخبة', c: /^world$/i, n: /afc champions league/i },
      { ar: 'كأس مصر', c: /^egypt$/i, n: /^(egypt|egyptian) cup$/i },
      { t: true, ar: 'كأس الكونفدرالية الأفريقية', c: /^world$/i, n: /^caf confederation cup$/i, fb: 20 },
      { ar: 'كأس السوبر المصري', c: /^egypt$/i, n: /super cup/i },
      { ar: 'كأس السوبر الأفريقي', c: /^world$/i, n: /^caf super cup$/i },
      { ar: 'كأس ملك إسبانيا', c: /^spain$/i, n: /^copa del rey$/i, fb: 143 },
      { ar: 'كأس الاتحاد الإنجليزي', c: /^england$/i, n: /^fa cup$/i, fb: 45 },
      { ar: 'كأس إيطاليا', c: /^italy$/i, n: /^coppa italia$/i },
      { ar: 'كأس ألمانيا', c: /^germany$/i, n: /^dfb pokal$/i },
      { ar: 'كأس فرنسا', c: /^france$/i, n: /^coupe de france$/i },
      { t: true, ar: 'كأس العالم للأندية', c: /^world$/i, n: /club world cup/i, fb: 15 },
      { ar: 'كأس العرب', c: /^world$/i, n: /arab cup/i },
    ];
    const seasonOf = (it: Record<string, any>) => { const ss = (it.seasons ?? []) as { year: number; current?: boolean }[]; return (ss.find((x) => x.current) ?? ss.sort((a, b) => b.year - a.year)[0])?.year ?? null; };
    // أندية مشهورة عند الجمهور المصري (تظهر الأول في القوائم)
    const FAMOUS = /^(al[ -]?ahly( sc| cairo)?|zamalek( sc)?|pyramids( fc)?|ismaily|al[ -]?masry|al[ -]?ittihad( alexandria| alex)?|ceramica cleopatra|modern (sport|future)|smouha|enppi|national bank|al[ -]?mokawloon|manchester (city|united)|liverpool|arsenal|chelsea|tottenham|newcastle|aston villa|real madrid|barcelona|atletico madrid|athletic club|sevilla|real betis|inter|ac milan|juventus|napoli|as roma|lazio|bayern m.nchen|bayern munich|borussia dortmund|bayer leverkusen|rb leipzig|vfb stuttgart|paris saint germain|marseille|lyon|monaco|lille|al[ -]?hilal( saudi)?|al[ -]?nassr|al[ -]?ittihad|al[ -]?qadsiah|al[ -]?shabab|esperance|wydad|mamelodi sundowns|tp mazembe|rs berkane|usm alger|cr belouizdad)$/i;
    if (body.step === 'prune') {
      const ids = (Array.isArray(body.ids) ? body.ids : []).map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 60);
      const r = await sb('rpc/catalog_prune', { method: 'POST', body: JSON.stringify({ p_leagues: ids }) });
      return jsonResponse({ hidden: r ? Number(await r.json().catch(() => 0)) || 0 : -1 });
    }
    if (body.step === 'leagues') {
      const res = await call('leagues', { current: 'true' });
      if ('wait' in res) return jsonResponse({ wait: true });
      if ('budget' in res) return jsonResponse({ error: 'خلصت حصة اليوم من المزوّد، كمّل بكرة.' }, 429);
      if ('fail' in res) return jsonResponse({ error: `المزوّد رد بخطأ ${res.fail}` }, 502);
      const all = res.data; const rows: unknown[] = []; const missing: string[] = []; const found: { id: number; ar: string }[] = [];
      for (let i = 0; i < RULES.length; i++) {
        const R = RULES[i]; let it = all.find((x) => R.c.test(String(x.country?.name ?? '')) && R.n.test(String(x.league?.name ?? '')) && !/women|u\d\d|youth/i.test(String(x.league?.name ?? '')));
        if (!it && R.fb) { const r2 = await call('leagues', { id: String(R.fb) }); if ('wait' in r2) return jsonResponse({ wait: true }); if ('data' in r2) it = r2.data[0]; }
        if (!it) { missing.push(R.ar); continue; }
        rows.push({ api_id: it.league.id, name_en: `${it.league.name}${it.country?.name && it.country.name !== 'World' ? ' - ' + it.country.name : ''}`, name_ar: R.ar, logo: it.league.logo, country: it.country?.name ?? '', season: seasonOf(it), sort: (i + 1) * 10 });
        found.push({ id: it.league.id, ar: R.ar, t: Boolean(R.t) });
      }
      const n = await upsert('league', rows);
      return jsonResponse({ saved: n, leagues: found, missing });
    }
    if (body.step === 'teams') {
      const lid = Number(body.leagueId); if (!Number.isInteger(lid) || lid < 1) return jsonResponse({ error: 'رقم بطولة غير صالح' }, 400);
      const lr = await sb(`push_targets?kind=eq.league&api_id=eq.${lid}&select=season`); const lrows = lr ? await lr.json().catch(() => []) : [];
      const season = Number(lrows?.[0]?.season); if (!season) return jsonResponse({ error: 'شغّل مزامنة البطولات الأول.' }, 400);
      const res = await call('teams', { league: String(lid), season: String(season) });
      if ('wait' in res) return jsonResponse({ wait: true });
      if ('budget' in res) return jsonResponse({ error: 'خلصت حصة اليوم من المزوّد، كمّل بكرة.' }, 429);
      if ('fail' in res) return jsonResponse({ error: `المزوّد رد بخطأ ${res.fail}` }, 502);
      const rows = res.data.filter((x) => x.team?.id && x.team?.name).map((x) => ({ api_id: x.team.id, name_en: x.team.name, logo: x.team.logo, country: x.team.country ?? '', league_id: lid, season, sort: FAMOUS.test(String(x.team.name)) ? 100 : 500 }));
      for (let i = 0; i < rows.length; i += 60) await upsert('team', rows.slice(i, i + 60));
      return jsonResponse({ teams: rows.length, leagueId: lid, season });
    }
    return jsonResponse({ error: 'خطوة غير معروفة' }, 400);
  }

  if (body.action === 'budget') { // مراقبة استهلاك الحصة (أرقام فقط، من غير أي أسرار)
    return jsonResponse({ used: await budgetUsed(), limit: BUDGET_LIST, date: cairoDate(), followed: (await followedIds()).size });
  }

  // ---------- حساب نقاط التوقعات: النتائج من المزوّد (عبر نفس الدالة/الكاش) والحساب في قاعدة البيانات ----------
  if (body.action === 'settle') {
    let dbSettled = 0; // أولًا من النتائج المحفوظة عندنا (مجاني)
    try { const rr = await sb('rpc/settle_from_db', { method: 'POST', body: '{}' }); if (rr) dbSettled = Number(await rr.json().catch(() => 0)) || 0; } catch { /* الدالة لسه متثبتتش */ }
    const lastRun = cache.get('settle:last');
    if (lastRun && lastRun.expires > Date.now()) return jsonResponse({ settled: dbSettled, skipped: true });
    cache.set('settle:last', { payload: {}, expires: Date.now() + 2 * MIN });
    if (!(await claimLock('settle', 180)) || (await budgetUsed()) >= 70) return jsonResponse({ settled: dbSettled, skipped: true }); // مرة كل 3 دقايق على مستوى كل النسخ، وبس لو الحصة مش قاربت تخلص
    const cutoff = new Date(Date.now() - 110 * MIN).toISOString();
    const res = await sb(`predictions?settled=eq.false&kickoff=lt.${encodeURIComponent(cutoff)}&select=fixture_id&order=kickoff.asc&limit=200`);
    const list = res ? await res.json().catch(() => []) : [];
    const ids = [...new Set((Array.isArray(list) ? list : []).map((r: { fixture_id: number }) => Number(r.fixture_id)).filter((n: number) => n < 3_000_000_000))].slice(0, 3);
    let done = 0;
    const used = await budgetUsed(); const apiMax = used >= 45 ? 1 : 2; let apiCalls = 0; // توفير: أقل عدد طلبات كل ما الحصة تقرب تخلص
    for (const id of ids) {
      if (apiCalls >= apiMax) break;
      const bk = `settle:id:${id}`; const bo = cache.get(bk); if (bo && bo.expires > Date.now()) continue; // مباراة لسه ماخلصتش: ماننادي عليها كل 3 دقايق
      apiCalls++;
      try {
        const h = new Headers(request.headers); h.delete('content-length');
        const r = await fetch(request.url, { method: 'POST', headers: h, body: JSON.stringify({ action: 'fixture', sport: 'football', fixtureId: id }) });
        if (!r.ok) continue;
        const f = (await r.json())?.fixture;
        if (!f || f.status !== 'finished' || f.home_score == null || f.away_score == null || !f.kickoff) { cache.set(bk, { payload: {}, expires: Date.now() + 40 * MIN }); continue; }
        const rr = await sb('rpc/settle_fixture', { method: 'POST', body: JSON.stringify({ p_fixture: id, p_home: f.home_score, p_away: f.away_score, p_kickoff: f.kickoff }) });
        if (rr) done += Number(await rr.json().catch(() => 0)) || 0;
      } catch (e) { console.error('settle failed', id, e); }
    }
    // مباريات SportSRC (أرقام ≥ 3 مليار): النتيجة من قائمة اليوم المخزّنة في دالة sportsrc (مش بتستهلك حصة API-Football)
    try {
      const cutoff2 = new Date(Date.now() - 110 * MIN).toISOString();
      const r2 = await sb(`predictions?settled=eq.false&fixture_id=gte.3000000000&kickoff=lt.${encodeURIComponent(cutoff2)}&select=fixture_id,kickoff&order=kickoff.asc&limit=40`);
      const pend = r2 ? await r2.json().catch(() => []) : [];
      const byDate = new Map<string, Set<number>>();
      for (const x of (Array.isArray(pend) ? pend : [])) { const d = cairoDateOf(String(x.kickoff)); (byDate.get(d) ?? byDate.set(d, new Set()).get(d)!).add(Number(x.fixture_id)); }
      for (const [d, set] of [...byDate].slice(0, 3)) {
        const fr = await fetch(`${SB_URL}/functions/v1/sportsrc`, { method: 'POST', headers: { 'content-type': 'application/json', apikey: SB_KEY, authorization: `Bearer ${SB_KEY}` }, body: JSON.stringify({ action: 'fixtures', date: d }), signal: AbortSignal.timeout(9000) });
        const list = fr.ok ? ((await fr.json().catch(() => null))?.fixtures ?? []) : [];
        for (const f of list) {
          if (!set.has(Number(f.fixture_id)) || f.status !== 'finished' || f.home_score == null || f.away_score == null || !f.kickoff) continue;
          const rr = await sb('rpc/settle_fixture', { method: 'POST', body: JSON.stringify({ p_fixture: Number(f.fixture_id), p_home: f.home_score, p_away: f.away_score, p_kickoff: f.kickoff }) });
          if (rr) done += Number(await rr.json().catch(() => 0)) || 0;
        }
      }
    } catch (e) { console.error('sportsrc settle failed', e); }
    return jsonResponse({ settled: done + dbSettled, checked: ids.length });
  }

  // ---------- حفظ مباريات الفرق المهمة: بيُستدعى من cron كل كام ساعة (أمس/النهارده/بكرة/بعده) ----------
  if (body.action === 'archive') {
    const last = cache.get('archive:last');
    if (last && last.expires > Date.now()) return jsonResponse({ skipped: true });
    cache.set('archive:last', { payload: {}, expires: Date.now() + 20 * MIN });
    let ok = 0;
    for (const off of [-1, 0, 1, 2]) {
      try {
        const h = new Headers(request.headers); h.delete('content-length');
        const r = await fetch(request.url, { method: 'POST', headers: h, body: JSON.stringify({ action: 'fixtures', sport: 'football', date: cairoDate(off) }) });
        if (r.ok) ok += 1;
      } catch (e) { console.error('archive day failed', off, e); }
    }
    return jsonResponse({ days: ok });
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
      if (!(await claimLock(cacheKey))) { // نسخة تانية بتجيب نفس البيانات دلوقتي: نستنى نتيجتها من الكاش
        for (let i = 0; i < 8; i++) { await sleep(700); const s = await dbGet(cacheKey); if (s && s.expires > Date.now()) { cache.set(cacheKey, s); return { payload: s.payload }; } }
        if (hit) return { payload: hit.payload };
      }
      if (!(await ipAllowed(request))) { if (hit) return { payload: hit.payload }; return { error: 'طلبات كتير في وقت قصير. حاول بعد دقيقة.', status: 429 }; }
      const limit = body.action === 'fixtures' ? BUDGET_LIST : BUDGET_DETAIL;
      let verdict = await takeSharedBudget(sport, limit);
      if (verdict === 'minute') { await sleep(1200 + Math.floor(Math.random() * 800)); verdict = await takeSharedBudget(sport, limit); } // زحمة لحظية: نحاول مرة تانية بدل ما نفشل
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
        if (sport === 'football' && body.action === 'fixtures') await archiveFixtures(rows);
        let out: Record<string, unknown>;
        let ttl: number;
        if (body.action === 'fixture') {
          const raw = rows.find((r: { fixture?: { id?: number }; id?: number }) => (sport === 'football' ? r.fixture?.id : r.id) === body.fixtureId);
          const fixture = raw ? normalize(raw) : null;
          out = fixture && sport === 'football' ? { fixture, ...extractDetails(raw) } : { fixture };
          const soon = fixture?.kickoff ? new Date(fixture.kickoff).getTime() - Date.now() < 2 * 60 * MIN : false;
          const fol = fixture?.status === 'live' ? await followedIds() : new Set<number>();
          const ko = fixture?.kickoff ? new Date(fixture.kickoff).getTime() : 0;
          const sinceKo = ko ? Date.now() - ko : 0;
          // توفير الحصة: المنتهية بعد ما تستقر تتخزن أسبوع، والبعيدة 12 ساعة، والمباشرة لغير المتابَعة كل 20 دقيقة
          ttl = fixture?.status === 'live' ? (isFol(fol, fixture as Normalized) ? 3 : 20) * MIN
            : fixture?.status === 'finished' ? (sinceKo > 4 * 60 * MIN ? 7 * 24 * 60 * MIN : 45 * MIN)
            : soon ? 10 * MIN : (ko && ko - Date.now() > 3 * 60 * MIN ? 12 * 60 * MIN : 3 * 60 * MIN);
        } else {
          const custom = sport === 'football' ? await loadCustomTeams() : [];
          const fixtures = rows.filter((item: unknown) => isImportant(sport, item, custom)).map(normalize);
          const base = leaguesFor(sport);
          if (sport === 'football') {
            // بطولات مصرية بالاسم (كأس مصر...) + بطولات فرق مهمة (إنتر ميامي...) — كأس مصر في المركز ١٠
            const have = new Set(base.map((l) => l.key)); const egy: { key: string; label: string }[] = []; const extra: { key: string; label: string }[] = [];
            for (const f of fixtures as Normalized[]) {
              if (have.has(f.league_key)) continue; have.add(f.league_key);
              (/^(كأس مصر|السوبر المصري|كأس الرابطة المصرية|الدوري المصري - الدرجة الثانية)$/.test(f.league_label) ? egy : extra).push({ key: f.league_key, label: f.league_label });
            }
            egy.sort((a, b) => (a.label === 'كأس مصر' ? -1 : b.label === 'كأس مصر' ? 1 : 0));
            const at = base.findIndex((l) => l.key === '61') + 1;
            base.splice(at || base.length, 0, ...egy);
            base.push(...extra);
          }
          out = { fixtures, leagues: base };
          if (sport === 'football') await autoSaveImportant(fixtures as Normalized[]);
          const anyLive = fixtures.some((item: Normalized) => item.status === 'live');
          const fol = anyLive ? await followedIds() : new Set<number>();
          const liveFol = (fixtures as Normalized[]).some((x) => x.status === 'live' && isFol(fol, x));
          // اليوم من غير مباراة مباشرة: نحدّث قبل أول ركلة بساعة، وبعدها كل 12 دقيقة. لو كله خلص نخزّن 3 ساعات
          const nowMs = Date.now(); const aheads = (fixtures as Normalized[]).filter((x) => x.status === 'scheduled' && x.kickoff).map((x) => new Date(x.kickoff as string).getTime() - nowMs).filter((d) => d > 0);
          const nextIn = aheads.length ? Math.min(...aheads) : Infinity;
          const idleToday = nextIn === Infinity ? 3 * 60 * MIN : nextIn > 75 * MIN ? Math.min(90 * MIN, nextIn - 60 * MIN) : 12 * MIN;
          ttl = liveFol ? 5 * MIN : anyLive ? 15 * MIN : body.date === cairoDate() ? idleToday : body.date < cairoDate() ? (body.date < cairoDate(-1) ? 24 : 12) * 60 * MIN : (body.date > cairoDate(1) ? 6 : 3) * 60 * MIN;
        }
        ttl = Math.round(ttl * (await ttlFactor()));
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
