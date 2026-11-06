-- يلا رياضة v34 — مباريات مهمة (تظهر الأول) + ترتيب البطولات
alter table public.fixture_overrides add column if not exists featured boolean not null default false;
alter table public.matches add column if not exists featured boolean not null default false;
do $$ begin
  execute 'grant select (featured) on public.matches to anon, authenticated';
exception when others then null; end $$;
-- ترتيب البطولات يتخزن في site_settings (مفتاح league_order) — الجدول موجود من supabase-admin-upgrade.sql
