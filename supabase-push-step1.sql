-- ============ الإشعارات — الخطوة ١: الجداول ============
-- شغّل الملف كله مرة واحدة في Supabase → SQL Editor. آمن لو اتشغّل أكتر من مرة.

-- 1) الفرق واللاعبين اللي ينفع المستخدم يتابعهم (بتتحكم فيهم من لوحة التحكم)
create table if not exists public.push_targets (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('team','player')),
  name_en text not null,
  name_ar text not null,
  active boolean not null default true,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  unique (kind, name_en)
);
alter table public.push_targets enable row level security;
drop policy if exists "push targets public read" on public.push_targets;
create policy "push targets public read" on public.push_targets for select to anon, authenticated using (active or public.is_admin());
drop policy if exists "push targets admin write" on public.push_targets;
create policy "push targets admin write" on public.push_targets for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.push_targets (kind, name_en, name_ar, sort_order) values
  ('team','Real Madrid','ريال مدريد',10),
  ('team','Barcelona','برشلونة',20),
  ('team','Al Ahly','الأهلي',30),
  ('team','Zamalek','الزمالك',40),
  ('player','Cristiano Ronaldo','كريستيانو رونالدو',10),
  ('player','Lionel Messi','ميسي',20),
  ('player','Mohamed Salah','محمد صلاح',30)
on conflict (kind, name_en) do nothing;

-- 2) أجهزة المستخدمين المشتركة في الإشعارات (جهاز واحد = اشتراك واحد)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
drop policy if exists "push subs own" on public.push_subscriptions;
create policy "push subs own" on public.push_subscriptions for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "push subs admin read" on public.push_subscriptions;
create policy "push subs admin read" on public.push_subscriptions for select to authenticated using (public.is_admin());

-- 3) اللي كل مستخدم بيتابعه
create table if not exists public.push_follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references public.push_targets(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, target_id)
);
alter table public.push_follows enable row level security;
drop policy if exists "push follows own" on public.push_follows;
create policy "push follows own" on public.push_follows for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "push follows admin read" on public.push_follows;
create policy "push follows admin read" on public.push_follows for select to authenticated using (public.is_admin());

-- 4) سجل اللي اتبعت (علشان نفس الإشعار ما يتبعتش مرتين) — بيستخدمه السيرفر بس
create table if not exists public.push_sent (
  event_key text primary key,
  created_at timestamptz not null default now()
);
alter table public.push_sent enable row level security;

-- 5) المفتاح العام (VAPID public) — بتحطه في الخطوة ١-ج
-- (بيتخزّن في site_settings تحت المفتاح vapid_public)
