// يلا رياضة — إرسال إشعارات Web Push (للأدمن فقط).
// الأسرار المطلوبة في Supabase → Edge Functions → Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
// (SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY بيضيفهم Supabase تلقائيًا). اجعل Verify JWT = OFF (التحقق يدوي هنا).
import webpush from 'npm:web-push@3.6.7';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// deno-lint-ignore no-explicit-any
type Any = any;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'طريقة الطلب غير مدعومة.' }, 405);

  const url = Deno.env.get('SUPABASE_URL'); const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('ADMIN_SERVICE_KEY');
  const vPub = Deno.env.get('VAPID_PUBLIC_KEY'); const vPriv = Deno.env.get('VAPID_PRIVATE_KEY'); const vSub = Deno.env.get('VAPID_SUBJECT');
  if (!url || !key) return json({ error: 'مفتاح الخدمة غير متاح للدالة.' }, 503);
  if (!vPub || !vPriv || !vSub) return json({ error: 'أسرار VAPID ناقصة (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT).' }, 503);
  webpush.setVapidDetails(vSub, vPub, vPriv);

  const { createClient } = await import('npm:@supabase/supabase-js@2');
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return json({ error: 'سجّل الدخول أولًا.' }, 401);
  const { data: who, error: we } = await admin.auth.getUser(token);
  if (we || !who?.user) return json({ error: 'الجلسة غير صالحة.' }, 401);
  const me = who.user as Any;
  const { data: prof } = await admin.from('profiles').select('role').eq('id', me.id).maybeSingle();
  if (prof?.role !== 'admin') return json({ error: 'هذه العملية للمسؤولين فقط.' }, 403);

  let body: Any; try { body = await req.json(); } catch { return json({ error: 'صيغة الطلب غير صالحة.' }, 400); }
  const action = String(body?.action ?? '');

  try {
    if (action === 'stats') {
      const [subs, follows, targets] = await Promise.all([
        admin.from('push_subscriptions').select('id', { count: 'exact', head: true }),
        admin.from('push_follows').select('target_id'),
        admin.from('push_targets').select('id,kind,name_ar,active').order('sort_order'),
      ]);
      const per: Record<string, number> = {};
      (follows.data ?? []).forEach((f: Any) => { per[f.target_id] = (per[f.target_id] ?? 0) + 1; });
      return json({ devices: subs.count ?? 0, targets: (targets.data ?? []).map((t: Any) => ({ ...t, followers: per[t.id] ?? 0 })) });
    }

    if (action === 'send' || action === 'test') {
      const title = String(body.title ?? '').trim().slice(0, 80);
      const text = String(body.body ?? '').trim().slice(0, 200);
      let link = String(body.url ?? 'news.html').trim();
      if (!title) return json({ error: 'اكتب عنوان الإشعار.' }, 400);
      if (!/^[\w./?=&%#:@+-]{1,300}$/.test(link) || /^[a-z][a-z0-9+.-]*:/i.test(link) || link.startsWith('//')) return json({ error: 'الرابط لازم يكون رابط داخل الموقع (مثل article.html?id=…).' }, 400);

      let q = admin.from('push_subscriptions').select('id,endpoint,p256dh,auth,user_id');
      let audience = 'all';
      if (action === 'test') { q = q.eq('user_id', me.id); audience = 'me'; }
      else if (body.audience === 'target') {
        if (typeof body.target_id !== 'string' || !UUID.test(body.target_id)) return json({ error: 'اختر الفريق أو اللاعب.' }, 400);
        const { data: fl } = await admin.from('push_follows').select('user_id').eq('target_id', body.target_id);
        const ids = (fl ?? []).map((x: Any) => x.user_id);
        if (!ids.length) return json({ sent: 0, failed: 0, removed: 0, total: 0, note: 'مفيش متابعين للهدف ده.' });
        q = q.in('user_id', ids); audience = body.target_id;
      }
      const { data: subs, error: se } = await q.limit(5000);
      if (se) throw se;
      const list: Any[] = subs ?? [];
      const payload = JSON.stringify({ title, body: text, url: link, tag: String(body.tag ?? 'yr-' + Date.now()).slice(0, 60) });
      let sent = 0; let failed = 0; const dead: string[] = [];
      for (let i = 0; i < list.length; i += 25) {
        const res = await Promise.allSettled(list.slice(i, i + 25).map((s) => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600 })));
        res.forEach((r, j) => {
          if (r.status === 'fulfilled') sent++;
          else { failed++; const code = (r.reason as Any)?.statusCode; if (code === 404 || code === 410) dead.push(list[i + j].id); }
        });
      }
      if (dead.length) await admin.from('push_subscriptions').delete().in('id', dead);
      try { await admin.from('admin_audit').insert({ actor: me.id, actor_email: me.email ?? null, action: action === 'test' ? 'push_test' : 'push_send', target: audience, detail: { title, sent, failed } }); } catch (_e) { /* السجل اختياري */ }
      return json({ sent, failed, removed: dead.length, total: list.length });
    }
    return json({ error: 'عملية غير معروفة.' }, 400);
  } catch (e) {
    console.error('send-push', e);
    return json({ error: 'حصل خطأ في الإرسال: ' + ((e as Any)?.message ?? e) }, 500);
  }
});
