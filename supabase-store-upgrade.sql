-- يلا رياضة — فئات المتجر المحفوظة + تفاصيل المباراة (القناة والمعلق).
-- شغّله مرة واحدة في Supabase > SQL Editor (آمن لو أعدت تشغيله). يتطلب: supabase-admin-upgrade.sql قبله.

-- 1) فئات المنتجات
create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(btrim(name)) between 1 and 60),
  created_at timestamptz not null default now()
);
alter table public.product_categories enable row level security;
drop policy if exists "categories public read" on public.product_categories;
create policy "categories public read" on public.product_categories for select to anon, authenticated using (true);
drop policy if exists "categories admin write" on public.product_categories;
create policy "categories admin write" on public.product_categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.product_categories to anon, authenticated;
grant insert, update, delete on public.product_categories to authenticated;
-- نسجّل الفئات اللي مستخدمة فعلًا في المنتجات الحالية
insert into public.product_categories(name)
  select distinct btrim(category) from public.products where btrim(category) <> ''
  on conflict (name) do nothing;

-- 2) تفاصيل المباراة اليدوية: القناة الناقلة، المعلّق، ملاحظات
alter table public.fixture_manual add column if not exists info jsonb not null default '{}'::jsonb;

notify pgrst, 'reload schema';
