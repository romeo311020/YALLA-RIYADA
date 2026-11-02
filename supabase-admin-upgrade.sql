-- ============================================================
-- يلا رياضة — ترقية لوحة الأدمن (آمن لو شغّلته أكثر من مرة)
-- الصقه كله في Supabase > SQL Editor ثم Run
-- ============================================================

-- دالة التحقق من الأدمن (موجودة غالبًا، نعيد تعريفها بأمان)
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- 1) جدول المشغّلات (لو لم يكن موجودًا)
create table if not exists public.fixture_streams (
  fixture_id bigint primary key check (fixture_id > 0),
  embed_url text not null check (embed_url ~ '^https://'),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.fixture_streams enable row level security;
drop policy if exists "public read fixture streams" on public.fixture_streams;
create policy "public read fixture streams" on public.fixture_streams for select to anon, authenticated using (true);
drop policy if exists "admins manage fixture streams" on public.fixture_streams;
create policy "admins manage fixture streams" on public.fixture_streams for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.fixture_streams to anon, authenticated;
grant insert, update, delete on public.fixture_streams to authenticated;

-- 2) التشكيلات اليدوية
create table if not exists public.fixture_manual (
  fixture_id bigint primary key check (fixture_id > 0),
  title text not null default '',
  lineups jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.fixture_manual enable row level security;
drop policy if exists "public read fixture manual" on public.fixture_manual;
create policy "public read fixture manual" on public.fixture_manual for select to anon, authenticated using (true);
drop policy if exists "admins manage fixture manual" on public.fixture_manual;
create policy "admins manage fixture manual" on public.fixture_manual for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.fixture_manual to anon, authenticated;
grant insert, update, delete on public.fixture_manual to authenticated;

-- 3) إعدادات الموقع (مثل تفعيل المتجر)
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
drop policy if exists "public read settings" on public.site_settings;
create policy "public read settings" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "admins manage settings" on public.site_settings;
create policy "admins manage settings" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;
insert into public.site_settings (key, value) values ('store_enabled', 'false'::jsonb) on conflict (key) do nothing;

-- 4) سجل عمليات الأدمن (تكتبه دالة admin-users فقط، ويقرؤه الأدمن)
create table if not exists public.admin_audit (
  id bigint generated always as identity primary key,
  actor uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  target text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_audit enable row level security;
drop policy if exists "admins read audit" on public.admin_audit;
create policy "admins read audit" on public.admin_audit for select to authenticated using (public.is_admin());
grant select on public.admin_audit to authenticated;

-- 5) المنتجات: عمود ترتيب/تصنيف اختياري + صلاحيات
alter table public.products add column if not exists category text not null default '';
alter table public.news add column if not exists source_url text not null default '';

-- 6) أسماء عربية إضافية (اختياري، موجود من التحديث السابق)
create table if not exists public.name_translations (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('team','player')),
  en text not null,
  ar text not null,
  unique (kind, en)
);
alter table public.name_translations enable row level security;
drop policy if exists "name_translations_read" on public.name_translations;
create policy "name_translations_read" on public.name_translations for select using (true);
drop policy if exists "name_translations_admin_write" on public.name_translations;
create policy "name_translations_admin_write" on public.name_translations for all
  using (public.is_admin()) with check (public.is_admin());

notify pgrst, 'reload schema';
