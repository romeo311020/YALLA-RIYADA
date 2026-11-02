-- YALLA RIYADA: initial schema. Run once in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  sport text not null default 'football',
  league text not null default '',
  home_team text not null,
  away_team text not null,
  kickoff timestamptz,
  status text not null default 'scheduled',
  home_score integer,
  away_score integer,
  embed_url text not null default '',
  notes text not null default '',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fixture_streams (
  fixture_id bigint primary key check (fixture_id > 0),
  embed_url text not null check (embed_url ~ '^https://'),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(10,2),
  image_url text not null default '',
  buy_url text not null default '',
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  image_url text not null default '',
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- Create a profile automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.fixture_streams enable row level security;
alter table public.products enable row level security;
alter table public.news enable row level security;

-- Profiles: users can read their own profile; only admins can manage roles.
drop policy if exists "profile read own or admin" on public.profiles;
create policy "profile read own or admin" on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.is_admin());
drop policy if exists "admins manage profiles" on public.profiles;
create policy "admins manage profiles" on public.profiles for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Public visitors can read published content. Only admins can write.
drop policy if exists "public read published matches" on public.matches;
create policy "public read published matches" on public.matches for select to anon, authenticated using (is_published or public.is_admin());
drop policy if exists "admins manage matches" on public.matches;
create policy "admins manage matches" on public.matches for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Public match pages can read authorized embed URLs; only admins can manage them.
drop policy if exists "public read fixture streams" on public.fixture_streams;
create policy "public read fixture streams" on public.fixture_streams for select to anon, authenticated using (true);
drop policy if exists "admins manage fixture streams" on public.fixture_streams;
create policy "admins manage fixture streams" on public.fixture_streams for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read published products" on public.products;
create policy "public read published products" on public.products for select to anon, authenticated using (is_published or public.is_admin());
drop policy if exists "admins manage products" on public.products;
create policy "admins manage products" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read published news" on public.news;
create policy "public read published news" on public.news for select to anon, authenticated using (is_published or public.is_admin());
drop policy if exists "admins manage news" on public.news;
create policy "admins manage news" on public.news for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.matches, public.products, public.news to anon, authenticated;
grant select, insert, update, delete on public.matches, public.products, public.news to authenticated;
grant select on public.fixture_streams to anon, authenticated;
grant insert, update, delete on public.fixture_streams to authenticated;
grant select on public.profiles to authenticated;
grant update, insert, delete on public.profiles to authenticated;

-- IMPORTANT: after signing up your admin account on the site, run this separately,
-- replacing the email with the exact admin email. Never let public users choose their role.
-- update public.profiles set role = 'admin' where email = 'YOUR_ADMIN_EMAIL';

-- ============================================================
-- أسماء عربية إضافية للفرق واللاعبين (اختياري) — تُقرأ من الموقع وتتفوق على القاموس المدمج
-- kind = 'team' أو 'player'، en = الاسم الإنجليزي كما يظهر من المزوّد، ar = الاسم العربي
-- ============================================================
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
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
