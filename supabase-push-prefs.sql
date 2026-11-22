-- ============ تفضيلات أنواع الإشعارات لكل مستخدم ============
-- شغّل الملف كله مرة واحدة في Supabase → SQL Editor. آمن لو اتشغّل أكتر من مرة.
create table if not exists public.push_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  kinds jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.push_prefs enable row level security;
drop policy if exists "push prefs own" on public.push_prefs;
create policy "push prefs own" on public.push_prefs for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select, insert, update, delete on public.push_prefs to authenticated;
grant all on public.push_prefs to service_role;
notify pgrst, 'reload schema';
