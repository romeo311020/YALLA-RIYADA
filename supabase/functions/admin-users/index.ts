// يلا رياضة — إدارة المستخدمين للأدمن فقط (حظر / تعديل / حذف / تغيير الدور / إعادة تعيين كلمة المرور).
// تعمل بمفتاح الخدمة (service role) الذي يضيفه Supabase تلقائيًا للدوال، ولا يصل للمتصفح أبدًا.
// أمان: كل طلب يُتحقق من هويته من توكن الجلسة، ثم من أن profiles.role = 'admin'، وإلا يُرفض.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FOREVER = '876000h'; // ~100 سنة

// deno-lint-ignore no-explicit-any
type Any = any;

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'طريقة الطلب غير مدعومة.' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('ADMIN_SERVICE_KEY');
  if (!url || !serviceKey) return json({ error: 'مفتاح الخدمة غير متاح للدالة. أضف سرًّا باسم ADMIN_SERVICE_KEY (انظر README).' }, 503);

  // deno-lint-ignore no-explicit-any
  const make = (globalThis as any).__yrCreateClient ?? (await import('npm:@supabase/supabase-js@2')).createClient;
  const admin = make(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // 1) من الذي يطلب؟
  const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return json({ error: 'سجّل الدخول أولًا.' }, 401);
  const { data: who, error: whoError } = await admin.auth.getUser(token);
  if (whoError || !who?.user) return json({ error: 'الجلسة غير صالحة. سجّل الدخول من جديد.' }, 401);
  const me = who.user as Any;

  // 2) هل هو أدمن؟
  const { data: prof } = await admin.from('profiles').select('role').eq('id', me.id).maybeSingle();
  if (prof?.role !== 'admin') return json({ error: 'هذه العملية للمسؤولين فقط.' }, 403);

  let body: Any;
  try { body = await request.json(); } catch { return json({ error: 'صيغة الطلب غير صالحة.' }, 400); }
  const action = String(body?.action ?? '');

  const audit = async (act: string, target: string, detail: Record<string, unknown> = {}) => {
    try { await admin.from('admin_audit').insert({ actor: me.id, actor_email: me.email ?? null, action: act, target, detail }); } catch (e) { console.error('audit failed', e); }
  };
  const roleOf = async (id: string) => (await admin.from('profiles').select('role').eq('id', id).maybeSingle()).data?.role ?? 'user';
  const needId = () => (typeof body.id === 'string' && UUID.test(body.id) ? body.id : null);

  try {
    /* ---------- قائمة المستخدمين ---------- */
    if (action === 'list') {
      const page = Math.max(1, Number(body.page) || 1);
      const perPage = Math.min(200, Math.max(1, Number(body.perPage) || 100));
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      const users: Any[] = data?.users ?? [];
      const ids = users.map((u) => u.id);
      const roles = new Map<string, string>();
      if (ids.length) {
        const { data: rows } = await admin.from('profiles').select('id,role').in('id', ids);
        (rows ?? []).forEach((r: Any) => roles.set(r.id, r.role));
      }
      const now = Date.now();
      return json({
        total: data?.total ?? users.length,
        users: users.map((u) => ({
          id: u.id,
          email: u.email ?? '',
          name: u.user_metadata?.display_name || u.user_metadata?.full_name || u.user_metadata?.name || '',
          avatar: typeof u.user_metadata?.avatar_url === 'string' ? u.user_metadata.avatar_url : '',
          provider: (u.app_metadata?.providers ?? [u.app_metadata?.provider]).filter(Boolean).join(','),
          role: roles.get(u.id) ?? 'user',
          created_at: u.created_at ?? null,
          last_sign_in_at: u.last_sign_in_at ?? null,
          banned_until: u.banned_until ?? null,
          banned: !!u.banned_until && new Date(u.banned_until).getTime() > now,
          confirmed: !!(u.email_confirmed_at || u.confirmed_at),
        })),
      });
    }

    const id = needId();
    if (!id) return json({ error: 'معرّف المستخدم غير صالح.' }, 400);
    const isSelf = id === me.id;

    /* ---------- تغيير الدور ---------- */
    if (action === 'set_role') {
      const role = body.role === 'admin' ? 'admin' : 'user';
      if (isSelf) return json({ error: 'لا يمكنك تغيير دور حسابك أنت.' }, 400);
      const { error } = await admin.from('profiles').upsert({ id, role }, { onConflict: 'id' });
      if (error) throw error;
      await audit('set_role', id, { role });
      return json({ ok: true });
    }

    /* ---------- حظر / فك الحظر ---------- */
    if (action === 'ban') {
      if (isSelf) return json({ error: 'لا يمكنك حظر حسابك.' }, 400);
      if ((await roleOf(id)) === 'admin') return json({ error: 'لا يمكن حظر مسؤول. اسحب صلاحية الأدمن منه أولًا.' }, 400);
      const days = body.days === 'forever' ? null : Math.min(3650, Math.max(1, Number(body.days) || 1));
      const duration = days === null ? FOREVER : `${days * 24}h`;
      const { error } = await admin.auth.admin.updateUserById(id, { ban_duration: duration });
      if (error) throw error;
      await audit('ban', id, { days: days ?? 'forever', reason: String(body.reason ?? '').slice(0, 200) });
      return json({ ok: true });
    }
    if (action === 'unban') {
      const { error } = await admin.auth.admin.updateUserById(id, { ban_duration: 'none' });
      if (error) throw error;
      await audit('unban', id);
      return json({ ok: true });
    }

    /* ---------- تعديل الاسم ---------- */
    if (action === 'update') {
      const name = String(body.display_name ?? '').trim().slice(0, 80);
      if (!name) return json({ error: 'الاسم لا يمكن أن يكون فارغًا.' }, 400);
      const { data: cur, error: e1 } = await admin.auth.admin.getUserById(id);
      if (e1 || !cur?.user) return json({ error: 'المستخدم غير موجود.' }, 404);
      const { error } = await admin.auth.admin.updateUserById(id, { user_metadata: { ...(cur.user.user_metadata ?? {}), display_name: name } });
      if (error) throw error;
      await audit('update_name', id, { display_name: name });
      return json({ ok: true });
    }

    /* ---------- إرسال رابط إعادة تعيين كلمة المرور ---------- */
    if (action === 'reset_password') {
      const { data: cur, error: e1 } = await admin.auth.admin.getUserById(id);
      if (e1 || !cur?.user?.email) return json({ error: 'المستخدم غير موجود أو بلا بريد.' }, 404);
      const redirectTo = typeof body.redirectTo === 'string' && /^https:\/\//.test(body.redirectTo) ? body.redirectTo : undefined;
      const { error } = await admin.auth.resetPasswordForEmail(cur.user.email, redirectTo ? { redirectTo } : undefined);
      if (error) throw error;
      await audit('reset_password', id);
      return json({ ok: true });
    }

    /* ---------- حذف الحساب ---------- */
    if (action === 'delete') {
      if (isSelf) return json({ error: 'لا يمكنك حذف حسابك من هنا.' }, 400);
      if ((await roleOf(id)) === 'admin') return json({ error: 'لا يمكن حذف مسؤول. اسحب صلاحية الأدمن منه أولًا.' }, 400);
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) throw error;
      await audit('delete_user', id);
      return json({ ok: true });
    }

    return json({ error: 'نوع الطلب غير معروف.' }, 400);
  } catch (error) {
    console.error('admin-users failed:', error);
    return json({ error: `تعذّر تنفيذ العملية: ${(error as Error)?.message ?? 'خطأ غير معروف'}` }, 500);
  }
});
