// يلا رياضة — مصدر SportSRC (اختياري). للأدمن فقط حاليًا: حالة التشغيل + تشغيل/إيقاف + اختبار الاتصال.
// المفتاح سر في Supabase (SPORTSRC_KEY) ولا يصل للمتصفح أبدًا. الخاصية مقفولة افتراضيًا.
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
// deno-lint-ignore no-explicit-any
type Any = any;
const BASE = 'https://api.sportsrc.org/v3/';
const ALLOWED = new Set(['account', 'matches', 'detail', 'sports']); // المجانية فقط في الاختبار

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'طريقة الطلب غير مدعومة.' }, 405);
  const url = Deno.env.get('SUPABASE_URL'); const sk = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('ADMIN_SERVICE_KEY');
  if (!url || !sk) return json({ error: 'مفتاح الخدمة غير متاح للدالة.' }, 503);
  // deno-lint-ignore no-explicit-any
  const make = (globalThis as any).__yrCreateClient ?? (await import('npm:@supabase/supabase-js@2')).createClient;
  const admin = make(url, sk, { auth: { persistSession: false, autoRefreshToken: false } });
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return json({ error: 'سجّل الدخول أولًا.' }, 401);
  const { data: who, error: we } = await admin.auth.getUser(token);
  if (we || !who?.user) return json({ error: 'الجلسة غير صالحة.' }, 401);
  let body: Any; try { body = await req.json(); } catch { return json({ error: 'صيغة الطلب غير صالحة.' }, 400); }
  const action = String(body?.action ?? '');
  if (action !== 'streams') {
    const { data: prof } = await admin.from('profiles').select('role').eq('id', who.user.id).maybeSingle();
    if (prof?.role !== 'admin') return json({ error: 'هذه العملية للمسؤولين فقط.' }, 403);
  }
  const key = Deno.env.get('SPORTSRC_KEY') ?? '';
  const getOn = async () => { const r = await admin.from('site_settings').select('value').eq('key', 'sportsrc_enabled').maybeSingle(); return r.data?.value?.on === true; };


  /* ---------- روابط البث للمباراة (للأعضاء المسجّلين) — مخزّنة مؤقتًا عشان نحافظ على الحد اليومي ---------- */
  if (action === 'streams') {
    if (!(await getOn()) || !key) return json({ sources: [], enabled: false });
    const home = String(body.home ?? '').slice(0, 80); const away = String(body.away ?? '').slice(0, 80);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(body.date ?? '')) ? String(body.date) : new Date().toISOString().slice(0, 10);
    if (!home || !away) return json({ sources: [] });
    const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\b(fc|cf|ac|sc|afc|club|de|the|real|united|city)\b/g, ' ').replace(/[^a-z0-9\u0600-\u06ff ]/g, ' ').replace(/\s+/g, ' ').trim();
    const toks = (s: string) => { const t = norm(s).split(' ').filter((x) => x.length >= 4); return t.length ? t : (norm(s) ? [norm(s)] : []); };
    const cacheGet = async (k: string) => { const r = await admin.from('api_cache').select('payload,expires_at').eq('key', k).maybeSingle(); return r.data && new Date(r.data.expires_at).getTime() > Date.now() ? r.data.payload : null; };
    const cacheSet = async (k: string, payload: Any, mins: number) => { try { await admin.from('api_cache').upsert({ key: k, payload, expires_at: new Date(Date.now() + mins * 60000).toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'key' }); } catch (_) { /* */ } };
    const call = async (q: Record<string, string>) => { const r = await fetch(`${BASE}?${new URLSearchParams(q)}`, { headers: { 'X-API-KEY': key, Accept: 'application/json' } }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); };
    const rk = `sr:x:${norm(home)}|${norm(away)}|${date}`;
    const hit = await cacheGet(rk); if (hit) return json(hit);
    try {
      let list = await cacheGet(`sr:m:${date}`);
      if (!list) { list = { data: await call({ type: 'matches', sport: 'football', date }) }; await cacheSet(`sr:m:${date}`, list, 15); }
      // نمشي على كل الكائنات في الرد، ونختار أصغر كائن فيه اسم الفريقين (أدق مطابقة)
      const hT = toks(home), aT = toks(away); let best: Any = null; let bestSize = 1e9;
      const strings = (o: Any, d = 0): string[] => { const out: string[] = []; if (d > 2 || !o || typeof o !== 'object') return out; for (const v of Object.values(o)) { if (typeof v === 'string') out.push(norm(v)); else if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...strings(v, d + 1)); } return out; };
      const walk = (o: Any) => {
        if (Array.isArray(o)) { o.forEach(walk); return; } if (!o || typeof o !== 'object') return;
        const st = strings(o); const has = (T: string[]) => T.length > 0 && T.some((t) => st.some((s) => s.includes(t)));
        if (has(hT) && has(aT)) { const size = JSON.stringify(o).length; if (size < bestSize && (o.id != null || o.match_id != null)) { best = o; bestSize = size; } }
        Object.values(o).forEach(walk);
      };
      walk(list.data);
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
