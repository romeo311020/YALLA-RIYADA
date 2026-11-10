-- ============ صفحة الانتقالات (بتتدار من لوحة التحكم) ============
-- شغّل الملف كله مرة واحدة في Supabase → SQL Editor. آمن لو اتشغّل أكتر من مرة.
create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  player_name text not null check (char_length(btrim(player_name)) between 2 and 80),
  player_photo text,
  from_team text,
  to_team text,
  fee text,
  status text not null default 'rumor' check (status in ('official','advanced','rumor','loan','free','extended')),
  note text,
  source_url text,
  published boolean not null default true,
  happened_at date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists transfers_date_idx on public.transfers (happened_at desc, created_at desc);
alter table public.transfers enable row level security;
drop policy if exists "transfers public read" on public.transfers;
create policy "transfers public read" on public.transfers for select to anon, authenticated using (published or public.is_admin());
drop policy if exists "transfers admin write" on public.transfers;
create policy "transfers admin write" on public.transfers for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select on public.transfers to anon, authenticated;
grant insert, update, delete on public.transfers to authenticated;
grant all on public.transfers to service_role;
notify pgrst, 'reload schema';
