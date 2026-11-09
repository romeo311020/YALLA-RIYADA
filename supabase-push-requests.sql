-- ============ طلبات إضافة فريق/لاعب للإشعارات ============
-- شغّل الملف كله مرة واحدة في Supabase → SQL Editor. آمن لو اتشغّل أكتر من مرة.

create table if not exists public.push_target_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('team','player')),
  name text not null check (char_length(btrim(name)) between 2 and 60),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
create unique index if not exists push_target_requests_uniq on public.push_target_requests (user_id, kind, lower(btrim(name)));
alter table public.push_target_requests enable row level security;

drop policy if exists "ptr own read" on public.push_target_requests;
create policy "ptr own read" on public.push_target_requests for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
drop policy if exists "ptr own insert" on public.push_target_requests;
create policy "ptr own insert" on public.push_target_requests for insert to authenticated with check (user_id = (select auth.uid()) and status = 'pending');
drop policy if exists "ptr admin update" on public.push_target_requests;
create policy "ptr admin update" on public.push_target_requests for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "ptr own delete" on public.push_target_requests;
create policy "ptr own delete" on public.push_target_requests for delete to authenticated using (public.is_admin() or (user_id = (select auth.uid()) and status = 'pending'));

grant select, insert, update, delete on public.push_target_requests to authenticated;
grant all on public.push_target_requests to service_role;

-- موافقة الأدمن: بتضيف الفريق/اللاعب للقائمة العامة + بتخلّي صاحب الطلب يتابعه تلقائيًا
create or replace function public.approve_push_request(p_id uuid, p_name_ar text, p_name_en text)
returns uuid language plpgsql security definer set search_path = public as $$
declare r public.push_target_requests; t uuid; en text; ar text;
begin
  if not public.is_admin() then raise exception 'not allowed'; end if;
  select * into r from public.push_target_requests where id = p_id and status = 'pending';
  if not found then raise exception 'الطلب مش موجود أو اتعالج قبل كده'; end if;
  ar := nullif(btrim(p_name_ar), ''); if ar is null then ar := btrim(r.name); end if;
  en := nullif(btrim(p_name_en), ''); if en is null then en := ar; end if;
  insert into public.push_targets (kind, name_en, name_ar, sort_order) values (r.kind, en, ar, 200)
    on conflict (kind, name_en) do update set active = true returning id into t;
  update public.push_target_requests set status = 'approved' where id = p_id;
  insert into public.push_follows (user_id, target_id) values (r.user_id, t) on conflict do nothing;
  return t;
end $$;
revoke all on function public.approve_push_request(uuid, text, text) from public, anon;
grant execute on function public.approve_push_request(uuid, text, text) to authenticated;

notify pgrst, 'reload schema';
