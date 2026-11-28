// يلا رياضة — مصدر SportSRC (اختياري). للأدمن فقط حاليًا: حالة التشغيل + تشغيل/إيقاف + اختبار الاتصال.
// المفتاح سر في Supabase (SPORTSRC_KEY) ولا يصل للمتصفح أبدًا. الخاصية مقفولة افتراضيًا.
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
// deno-lint-ignore no-explicit-any
type Any = any;
const BASE = 'https://api.sportsrc.org/v3/';
const ALLOWED = new Set(['account', 'matches', 'detail', 'sports']); // المجانية فقط في الاختبار

// أسماء البطولات والدول بالعربي (للقائمة الاحتياطية). المرتّب أولًا = الأشهر.
const COUNTRY_AR: Record<string, string> = { Egypt: 'مصر', 'Saudi Arabia': 'السعودية', Morocco: 'المغرب', Tunisia: 'تونس', Algeria: 'الجزائر', England: 'إنجلترا', Spain: 'إسبانيا', Italy: 'إيطاليا', Germany: 'ألمانيا', France: 'فرنسا', Portugal: 'البرتغال', Netherlands: 'هولندا', Belgium: 'بلجيكا', Turkey: 'تركيا', Brazil: 'البرازيل', Argentina: 'الأرجنتين', USA: 'أمريكا', 'United States': 'أمريكا', Scotland: 'اسكتلندا', Greece: 'اليونان', Russia: 'روسيا', Ukraine: 'أوكرانيا', Qatar: 'قطر', UAE: 'الإمارات', 'United Arab Emirates': 'الإمارات', Jordan: 'الأردن', Iraq: 'العراق', Libya: 'ليبيا', Sudan: 'السودان', Kuwait: 'الكويت', Japan: 'اليابان', 'South Korea': 'كوريا الجنوبية', China: 'الصين', Mexico: 'المكسيك', Colombia: 'كولومبيا', Chile: 'تشيلي', Uruguay: 'أوروجواي', Switzerland: 'سويسرا', Austria: 'النمسا', Denmark: 'الدنمارك', Sweden: 'السويد', Norway: 'النرويج', Poland: 'بولندا', World: 'العالم', Europe: 'أوروبا', Africa: 'أفريقيا' };
const LEAGUE_RULES: [RegExp | null, RegExp, string][] = [
  [/^egypt$/i, /premier/i, 'الدوري المصري الممتاز'], [null, /\bpremier league\b/i, 'الدوري الإنجليزي الممتاز'],
  [null, /champions league/i, 'دوري أبطال أوروبا'], [null, /la ?liga(?! 2)|primera divisi[oó]n/i, 'الدوري الإسباني'],
  [/^england$/i, /^premier league$/i, 'الدوري الإنجليزي الممتاز'], [/^italy$/i, /serie a/i, 'الدوري الإيطالي'], [/^germany$/i, /bundesliga(?! 2)/i, 'الدوري الألماني'], [/^france$/i, /ligue 1/i, 'الدوري الفرنسي'],
  [/^saudi/i, /pro league|premier|saudi/i, 'الدوري السعودي'], [null, /europa league/i, 'الدوري الأوروبي'], [null, /conference league/i, 'دوري المؤتمر الأوروبي'],
  [null, /caf champions|african champions/i, 'دوري أبطال أفريقيا'], [null, /caf confederation|confederation cup/i, 'كأس الكونفدرالية الأفريقية'],
  [/^egypt$/i, /super/i, 'السوبر المصري'], [/^egypt$/i, /league cup/i, 'كأس الرابطة المصرية'], [/^egypt$/i, /cup/i, 'كأس مصر'], [/^egypt$/i, /second|2nd|division 2/i, 'الدوري المصري - الدرجة الثانية'],
  [null, /world cup/i, 'كأس العالم'], [null, /nations league/i, 'دوري الأمم'], [null, /africa cup of nations|afcon/i, 'كأس أمم أفريقيا'], [null, /friendl/i, 'مباريات ودية'],
  [/^england$/i, /fa cup/i, 'كأس الاتحاد الإنجليزي'], [/^england$/i, /league cup|carabao/i, 'كأس الرابطة الإنجليزية'], [/^england$/i, /championship/i, 'تشامبيونشيب (الدرجة الثانية الإنجليزية)'], [/^spain$/i, /copa del rey/i, 'كأس ملك إسبانيا'],
];
const leagueAr = (name: string, country: string): { label: string; rank: number } => {
  const i = LEAGUE_RULES.findIndex(([c, n]) => (!c || c.test(country)) && n.test(name));
  const women = /women|femin/i.test(name) ? ' (سيدات)' : '';
  if (i >= 0) return { label: LEAGUE_RULES[i][2] + women, rank: i };
  const c = COUNTRY_AR[country] ?? (country && !/^world$/i.test(country) ? country : '');
  return { label: c ? `${name} · ${c}` : name, rank: 1000 };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'طريقة الطلب غير مدعومة.' }, 405);
  const url = Deno.env.get('SUPABASE_URL'); const sk = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('ADMIN_SERVICE_KEY');
  if (!url || !sk) return json({ error: 'مفتاح الخدمة غير متاح للدالة.' }, 503);
  // deno-lint-ignore no-explicit-any
  const make = (globalThis as any).__yrCreateClient ?? (await import('npm:@supabase/supabase-js@2')).createClient;
  const admin = make(url, sk, { auth: { persistSession: false, autoRefreshToken: false } });
  let body: Any; try { body = await req.json(); } catch { return json({ error: 'صيغة الطلب غير صالحة.' }, 400); }
  const action = String(body?.action ?? '');
  const PUBLIC = action === 'fixtures'; // قائمة المباريات الاحتياطية متاحة للزوار (مخزّنة مؤقتًا)
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  let who: Any = { user: { id: '' } };
  if (!PUBLIC) {
    if (!token) return json({ error: 'سجّل الدخول أولًا.' }, 401);
    const r = await admin.auth.getUser(token);
    if (r.error || !r.data?.user) return json({ error: 'الجلسة غير صالحة.' }, 401);
    who = r.data;
  }
  if (action !== 'streams' && !PUBLIC) {
    const { data: prof } = await admin.from('profiles').select('role').eq('id', who.user.id).maybeSingle();
    if (prof?.role !== 'admin') return json({ error: 'هذه العملية للمسؤولين فقط.' }, 403);
  }
  // حماية الحصة (1000 طلب/يوم): سقف يومي ودقيقي لكل الطلبات الخارجة، وسقف لكل مستخدم/زائر.
  const cairo = (off = 0) => new Date(Date.now() + off * 864e5 + 2 * 3600e3).toISOString().slice(0, 10);
  const take = async (scope: string, dayLim: number, minLim: number): Promise<boolean> => {
    try { const r = await admin.rpc('take_api_budget', { p_sport: scope, p_day: cairo(), p_minute: new Date().toISOString().slice(0, 16), p_day_limit: dayLim, p_min_limit: minLim }); return r.error ? true : r.data === 'ok'; } catch (_) { return true; }
  };
  const upstream = async (url: string, k: string) => { if (!(await take('sr', 800, 25))) throw new Error('budget'); return await fetch(url, { headers: { 'X-API-KEY': k, Accept: 'application/json' } }); };
  const dateOk = (d: string) => d >= cairo(-3) && d <= cairo(8);
  const key = Deno.env.get('SPORTSRC_KEY') ?? '';
  const getOn = async () => { const r = await admin.from('site_settings').select('value').eq('key', 'sportsrc_enabled').maybeSingle(); return r.data?.value?.on === true; };


  /* ---------- قائمة مباريات احتياطية من SportSRC (لما API-Football يقف) بنفس شكل الموقع ---------- */
  if (action === 'fixtures') {
    if (!(await getOn()) || !key) return json({ fixtures: [], leagues: [], enabled: false });
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(body.date ?? '')) ? String(body.date) : new Date().toISOString().slice(0, 10);
    if (!dateOk(date)) return json({ fixtures: [], leagues: [], error: 'تاريخ خارج النطاق.' });
    const ck = `sr:f:${date}`;
    const got = await admin.from('api_cache').select('payload,expires_at').eq('key', ck).maybeSingle();
    if (got.data && new Date(got.data.expires_at).getTime() > Date.now()) return json(got.data.payload);
    try {
      const r = await upstream(`${BASE}?${new URLSearchParams({ type: 'matches', sport: 'football', date })}`, key);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % 900000000; };
      const fixtures: Any[] = []; const lg = new Map<string, string>(); const rank = new Map<string, number>();
      for (const L of (Array.isArray(j?.data) ? j.data : [])) {
        const name = String(L?.league?.name ?? 'كرة القدم'); const country = String(L?.league?.country ?? '');
        const la = leagueAr(name, country); const label = la.label;
        const lkey = 'sr:' + name + '|' + country; lg.set(lkey, label); rank.set(lkey, la.rank);
        for (const m of (Array.isArray(L?.matches) ? L.matches : [])) {
          const st = String(m?.status ?? '');
          const mins = /(\d{1,3})/.exec(String(m?.status_detail ?? ''));
          fixtures.push({
            fixture_id: 3000000000 + hash(String(m.id)), sr_id: String(m.id), sport: 'football',
            kickoff: Number.isFinite(Number(m.timestamp)) ? new Date(Number(m.timestamp)).toISOString() : null,
            status: st === 'inprogress' ? 'live' : st === 'finished' ? 'finished' : 'scheduled',
            status_note: st === 'inprogress' || st === 'finished' ? '' : (/postpon/i.test(String(m.status_detail)) ? 'مؤجلة' : ''),
            minute: st === 'inprogress' && mins ? Number(mins[1]) : null,
            home_team: m?.teams?.home?.name ?? '', away_team: m?.teams?.away?.name ?? '', home_id: null, away_id: null,
            home_logo: m?.teams?.home?.badge ?? null, away_logo: m?.teams?.away?.badge ?? null,
            league: name, league_key: lkey, league_label: label, league_logo: L?.league?.logo ?? null,
            home_score: m?.score?.current?.home ?? null, away_score: m?.score?.current?.away ?? null, source: 'sportsrc',
          });
        }
      }
      const out = { fixtures, leagues: [...lg].sort((a, b) => (rank.get(a[0]) ?? 1000) - (rank.get(b[0]) ?? 1000)).map(([k, l]) => ({ key: k, label: l })), source: 'sportsrc' };
      await admin.from('api_cache').upsert({ key: ck, payload: out, expires_at: new Date(Date.now() + 10 * 60000).toISOString(), updated_at: new Date().toISOString() });
      return json(out);
    } catch (e) { return json({ fixtures: [], leagues: [], error: String((e as Error).message || e) }); }
  }

  /* ---------- روابط البث للمباراة (للأعضاء المسجّلين) — مخزّنة مؤقتًا عشان نحافظ على الحد اليومي ---------- */
  if (action === 'streams') {
    if (!(await getOn()) || !key) return json({ sources: [], enabled: false });
    const home = String(body.home ?? '').slice(0, 80); const away = String(body.away ?? '').slice(0, 80);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(body.date ?? '')) ? String(body.date) : new Date().toISOString().slice(0, 10);
    const srId = String(body.sr_id ?? '').slice(0, 160);
    if (!(await take('sru:' + who.user.id, 300, 12))) return json({ sources: [], error: 'طلبات كتير. حاول بعد شوية.' });
    if (!srId && (!home || !away)) return json({ sources: [] });
    const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\b(fc|cf|ac|sc|afc|club|de|the|real|united|city)\b/g, ' ').replace(/[^a-z0-9\u0600-\u06ff ]/g, ' ').replace(/\s+/g, ' ').trim();
    const toks = (s: string) => { const t = norm(s).split(' ').filter((x) => x.length >= 4); return t.length ? t : (norm(s) ? [norm(s)] : []); };
    const cacheGet = async (k: string) => { const r = await admin.from('api_cache').select('payload,expires_at').eq('key', k).maybeSingle(); return r.data && new Date(r.data.expires_at).getTime() > Date.now() ? r.data.payload : null; };
    const cacheSet = async (k: string, payload: Any, mins: number) => { try { await admin.from('api_cache').upsert({ key: k, payload, expires_at: new Date(Date.now() + mins * 60000).toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'key' }); } catch (_) { /* */ } };
    const call = async (q: Record<string, string>) => { const r = await upstream(`${BASE}?${new URLSearchParams(q)}`, key); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); };
    if (!srId && !dateOk(date)) return json({ sources: [] });
    const rk = srId ? `sr:x:id:${srId}` : `sr:x:${norm(home)}|${norm(away)}|${date}`;
    const hit = await cacheGet(rk); if (hit) return json(hit);
    try {
      let list: Any = null;
      // نمشي على كل الكائنات في الرد، ونختار أصغر كائن فيه اسم الفريقين (أدق مطابقة)
      const hT = toks(home), aT = toks(away); let best: Any = null; let bestSize = 1e9;
      const strings = (o: Any, d = 0): string[] => { const out: string[] = []; if (d > 2 || !o || typeof o !== 'object') return out; for (const v of Object.values(o)) { if (typeof v === 'string') out.push(norm(v)); else if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...strings(v, d + 1)); } return out; };
      const walk = (o: Any) => {
        if (Array.isArray(o)) { o.forEach(walk); return; } if (!o || typeof o !== 'object') return;
        const st = strings(o); const has = (T: string[]) => T.length > 0 && T.some((t) => st.some((s) => s.includes(t)));
        if (has(hT) && has(aT)) { const size = JSON.stringify(o).length; if (size < bestSize && (o.id != null || o.match_id != null)) { best = o; bestSize = size; } }
        Object.values(o).forEach(walk);
      };
      if (srId) { best = { id: srId, title: srId }; }
      else {
        const shift = (d: string, n: number) => new Date(Date.parse(d + 'T12:00:00Z') + n * 864e5).toISOString().slice(0, 10);
        for (const dt of [date, shift(date, -1), shift(date, 1)]) { // التاريخ نفسه ثم اليوم اللي قبله وبعده (فرق التوقيت)
          list = await cacheGet(`sr:m:${dt}`);
          if (!list) { list = { data: await call({ type: 'matches', sport: 'football', date: dt }) }; await cacheSet(`sr:m:${dt}`, list, 15); }
          walk(list.data); if (best) break;
        }
      }
      let sources: Any[] = [];
      if (best && best.has_stream !== false) {
        const id = String(best.id ?? best.match_id);
        let det = await cacheGet(`sr:d:${id}`);
        if (!det) { det = { data: await call({ type: 'detail', id }) }; await cacheSet(`sr:d:${id}`, det, 4); }
        const seen = new Set<string>(); const IMG = /\.(png|jpe?g|gif|webp|svg|ico|css|json)(\?|$)/i;
        const grab = (o: Any) => {
          if (Array.isArray(o)) { o.forEach(grab); return; } if (!o || typeof o !== 'object') return;
          for (const [k, v] of Object.entries(o)) {
            if (typeof v === 'string' && /^https:\/\//i.test(v) && !IMG.test(v) && /(embed|stream|source|iframe|player|watch|link|url|src|hls|m3u8)/i.test(k) && !seen.has(v)) {
              seen.add(v);
              const title = ['name', 'title', 'label', 'channel', 'server', 'quality', 'language'].map((t) => (typeof o[t] === 'string' ? o[t] : '')).filter(Boolean).join(' · ').slice(0, 60);
              sources.push({ url: v, title });
            } else if (v && typeof v === 'object') grab(v);
          }
        };
        // الشكل الفعلي للرد: data.sources[] = { streamNo, embedUrl, source, hd, language }
        const real = det.data?.data?.sources;
        if (Array.isArray(real) && real.length) {
          for (const s of real) { const u = typeof s?.embedUrl === 'string' ? s.embedUrl : ''; if (/^https:\/\//i.test(u) && !seen.has(u)) { seen.add(u); const lang = String(s.language ?? ''); const known = lang && !/^unknown$/i.test(lang); const ar = /^(ar|arabic|عرب)/i.test(lang);
            sources.push({ url: u, ar, title: `بث ${s.streamNo ?? sources.length + 1}${s.source ? ' · ' + String(s.source).slice(0, 20) : ''}${s.hd ? ' HD' : ''}${known ? ' · ' + (ar ? 'تعليق عربي' : lang.slice(0, 14)) : ''}` }); } }
          sources.sort((a: Any, b: Any) => Number(b.ar) - Number(a.ar));
        } else grab(det.data);
        sources = sources.slice(0, 6);
      }
      const res = { sources, matched: Boolean(best), matched_title: best ? String(best.title ?? best.name ?? best.id ?? '') : '', has_stream: best ? best.has_stream : null };
      await cacheSet(rk, res, sources.length ? 4 : 10);
      return json(res);
    } catch (e) { return json({ sources: [], error: String((e as Error).message || e) }); }
  }
  if (action === 'status') return json({ enabled: await getOn(), hasKey: Boolean(key) });
  if (action === 'set') {
    const on = body.on === true;
    const { error } = await admin.from('site_settings').upsert({ key: 'sportsrc_enabled', value: { on }, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) return json({ error: error.message }, 500);
    return json({ enabled: on, hasKey: Boolean(key) });
  }
  if (action === 'test_detail') {
    if (!key) return json({ error: 'السر SPORTSRC_KEY غير مضاف.' }, 400);
    try {
      const date = new Date().toISOString().slice(0, 10);
      const call = async (q: Record<string, string>) => { const r = await fetch(`${BASE}?${new URLSearchParams(q)}`, { headers: { 'X-API-KEY': key, Accept: 'application/json' } }); return await r.json(); };
      const list = await call({ type: 'matches', sport: 'football', date });
      const all: Any[] = []; for (const g of list?.data ?? []) for (const m of g?.matches ?? []) all.push(m);
      const pick = all.find((m) => m.has_stream === true) ?? all.find((m) => m.has_highlights === true) ?? all.find((m) => m.status !== 'finished') ?? all[0];
      if (!pick) return json({ error: 'مفيش مباريات النهارده.' });
      const det = await call({ type: 'detail', id: String(pick.id) });
      return json({ status: 200, remaining: null, limit: null, body: `// المباراة المختارة: ${pick.title} | has_stream=${pick.has_stream} | has_highlights=${pick.has_highlights}\n` + JSON.stringify(det).slice(0, 20000), truncated: false });
    } catch (e) { return json({ error: String((e as Error).message || e) }, 502); }
  }
  if (action === 'test') {
    if (!key) return json({ error: 'السر SPORTSRC_KEY غير مضاف في Supabase (Edge Functions → Secrets).' }, 400);
    const type = String(body.type ?? '');
    if (!ALLOWED.has(type)) return json({ error: 'نوع غير مسموح في الاختبار.' }, 400);
    const q = new URLSearchParams({ type });
    for (const k of ['sport', 'status', 'date', 'id']) if (body[k] != null && String(body[k]).trim() !== '') q.set(k, String(body[k]).slice(0, 60));
    try {
      const r = await fetch(`${BASE}?${q}`, { headers: { 'X-API-KEY': key, Accept: 'application/json' } });
      const text = await r.text();
      return json({ status: r.status, remaining: r.headers.get('X-RateLimit-Remaining'), limit: r.headers.get('X-RateLimit-Limit'), body: text.slice(0, 20000), truncated: text.length > 20000 });
    } catch (e) { return json({ error: 'تعذّر الاتصال بـ SportSRC: ' + (e as Error).message }, 502); }
  }
  return json({ error: 'إجراء غير معروف.' }, 400);
});
