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
  const { data: prof } = await admin.from('profiles').select('role').eq('id', who.user.id).maybeSingle();
  if (prof?.role !== 'admin') return json({ error: 'هذه العملية للمسؤولين فقط.' }, 403);
  let body: Any; try { body = await req.json(); } catch { return json({ error: 'صيغة الطلب غير صالحة.' }, 400); }
  const action = String(body?.action ?? '');
  const key = Deno.env.get('SPORTSRC_KEY') ?? '';
  const getOn = async () => { const r = await admin.from('site_settings').select('value').eq('key', 'sportsrc_enabled').maybeSingle(); return r.data?.value?.on === true; };

  if (action === 'status') return json({ enabled: await getOn(), hasKey: Boolean(key) });
  if (action === 'set') {
    const on = body.on === true;
    const { error } = await admin.from('site_settings').upsert({ key: 'sportsrc_enabled', value: { on }, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) return json({ error: error.message }, 500);
    return json({ enabled: on, hasKey: Boolean(key) });
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
