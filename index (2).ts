// يلا رياضة — إرسال إشعارات الأخبار للمشتركين (للأدمن فقط).
// الأسرار المطلوبة في Supabase > Edge Functions > Secrets:
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY  (تولّدهم بالأمر: npx web-push generate-vapid-keys)
//   VAPID_SUBJECT (اختياري، مثال: mailto:you@example.com)  — ومفتاح الخدمة يضيفه Supabase تلقائيًا.
// أمان: كل طلب يتحقق من توكن الجلسة ثم من أن profiles.role = 'admin'. اترك Verify JWT مقفولًا (التحقق يدوي هنا).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
// deno-lint-ignore no-explicit-any
type Any = any;

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'طريقة الطلب غير مدعومة.' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('ADMIN_SERVICE_KEY');
  const pub = Deno.env.get('VAPID_PUBLIC_KEY'); const priv = Deno.env.get('VAPID_PRIVATE_KEY');
  if (!url || !serviceKey) return json({ error: 'مفتاح الخدمة غير متاح للدالة.' }, 500);
  if (!pub || !priv) return json({ error: 'مفاتيح الإشعارات (VAPID) غير مضافة في أسرار الدالة.' }, 500);

  // deno-lint-ignore no-explicit-any
  const make = (globalThis as any).__yrCreateClient ?? (await import('npm:@supabase/supabase-js@2')).createClient;
  const admin = make(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return json({ error: 'سجّل الدخول أولًا.' }, 401);
  const { data: who, error: whoError } = await admin.auth.getUser(token);
  if (whoError || !who?.user) return json({ error: 'الجلسة غير صالحة. سجّل الدخول من جديد.' }, 401);
  const { data: prof } = await admin.from('profiles').select('role').eq('id', who.user.id).maybeSingle();
  if (prof?.role !== 'admin') return json({ error: 'هذه العملية للمسؤولين فقط.' }, 403);

  let body: Any;
  try { body = await request.json(); } catch { return json({ error: 'صيغة الطلب غير صالحة.' }, 400); }

  const title = String(body?.title ?? '').trim().slice(0, 80);
  const text = String(body?.body ?? '').trim().slice(0, 200);
  let link = String(body?.url ?? '').trim();
  if (!title) return json({ error: 'اكتب عنوان الإشعار.' }, 400);
  // الرابط: مسار داخل الموقع فقط (يمنع إرسال المشتركين لمواقع خارجية)
  if (link && !/^\/?[\w\-./?=&%#]*$/.test(link)) return json({ error: 'الرابط لازم يكون صفحة داخل الموقع، مثل news.html' }, 400);
  link = link.replace(/^\//, '') || 'news.html';

  const webpush = (await import('npm:web-push@3.6.7')).default;
  webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT') || 'https://yalla-riyada-embd.vercel.app', pub, priv);

  const { data: subs, error } = await admin.from('push_subscriptions').select('id,endpoint,p256dh,auth').limit(5000);
  if (error) return json({ error: 'تعذّر قراءة المشتركين. شغّل ملف supabase-push.sql.' }, 500);
  const payload = JSON.stringify({ title, body: text, url: link, tag: 'yr-news' });

  let sent = 0; let failed = 0; const dead: string[] = [];
  const list: Any[] = subs ?? [];
  for (let i = 0; i < list.length; i += 25) {
    await Promise.all(list.slice(i, i + 25).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 6 });
        sent++;
      } catch (e: Any) {
        failed++;
        if (e?.statusCode === 404 || e?.statusCode === 410) dead.push(s.id); // الاشتراك انتهى: نحذفه
        else console.error('push failed:', e?.statusCode, String(e?.body ?? e?.message ?? '').slice(0, 120));
      }
    }));
  }
  if (dead.length) await admin.from('push_subscriptions').delete().in('id', dead);
  try { await admin.from('push_log').insert({ title, body: text, url: link, sent, failed, sent_by: who.user.id }); } catch (e) { console.error('log:', e); }
  return json({ ok: true, total: list.length, sent, failed, removed: dead.length });
});
