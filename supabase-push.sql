-- يلا رياضة — إشعارات الأخبار (Web Push). شغّله مرة واحدة في Supabase > SQL Editor (آمن لو كررته).
-- يتطلب الدالة is_admin() من supabase-admin-upgrade.sql.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique check (endpoint ~ '^https://' and char_length(endpoint) <= 1000),
  p256dh text not null check (char_length(p256dh) between 20 and 200),
  auth text not null check (char_length(auth) between 8 and 100),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
-- لا توجد سياسات: لا أحد يقرأ الاشتراكات من المتصفح. التسجيل والإلغاء عبر الدوال أدناه، والإرسال عبر الدالة السحابية.
revoke all on public.push_subscriptions from anon, authenticated;

create or replace function public.push_subscribe(p_endpoint text, p_p256dh text, p_auth text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'سجّل دخولك أولًا'; end if;
  if (select count(*) from public.push_subscriptions where user_id = auth.uid()) >= 10
     and not exists (select 1 from public.push_subscriptions where endpoint = p_endpoint) then
    delete from public.push_subscriptions where id in (select id from public.push_subscriptions where user_id = auth.uid() order by created_at limit 1);
  end if;
  insert into public.push_subscriptions(endpoint, p256dh, auth, user_id) values (p_endpoint, p_p256dh, p_auth, auth.uid())
  on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth, user_id = auth.uid();
end $$;
revoke all on function public.push_subscribe(text, text, text) from public, anon;
grant execute on function public.push_subscribe(text, text, text) to authenticated;

create or replace function public.push_unsubscribe(p_endpoint text) returns void
language sql security definer set search_path = public as $$
  delete from public.push_subscriptions where endpoint = p_endpoint and user_id = auth.uid();
$$;
revoke all on function public.push_unsubscribe(text) from public, anon;
grant execute on function public.push_unsubscribe(text) to authenticated;

create or replace function public.push_count() returns bigint
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'للمسؤولين فقط'; end if;
  return (select count(*) from public.push_subscriptions);
end $$;
revoke all on function public.push_count() from public, anon;
grant execute on function public.push_count() to authenticated;

-- سجل الإشعارات المرسلة (يكتب فيه السيرفر فقط، ويقرأه الأدمن)
create table if not exists public.push_log (
  id bigint generated always as identity primary key,
  title text not null, body text not null default '', url text not null default '',
  sent int not null default 0, failed int not null default 0,
  sent_by uuid, created_at timestamptz not null default now()
);
alter table public.push_log enable row level security;
drop policy if exists "push_log_admin_read" on public.push_log;
create policy "push_log_admin_read" on public.push_log for select to authenticated using (public.is_admin());
revoke all on public.push_log from anon;
grant select on public.push_log to authenticated;

notify pgrst, 'reload schema';
