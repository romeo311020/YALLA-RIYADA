-- يلا رياضة — تعديل أي مباراة (تأجيل / إلغاء / تصحيح موعد أو نتيجة) حتى لو جاية من الـ API
create table if not exists public.fixture_overrides (
  fixture_id bigint primary key,
  status text,                 -- scheduled | live | finished | postponed | cancelled (فاضي = زي ما هي)
  kickoff timestamptz,
  home_score int,
  away_score int,
  note text,
  title text,
  updated_at timestamptz not null default now()
);
alter table public.fixture_overrides enable row level security;
drop policy if exists "fo read" on public.fixture_overrides;
drop policy if exists "fo admin write" on public.fixture_overrides;
create policy "fo read" on public.fixture_overrides for select using (true);
create policy "fo admin write" on public.fixture_overrides for all using (public.is_admin()) with check (public.is_admin());
grant select on public.fixture_overrides to anon, authenticated;
grant insert, update, delete on public.fixture_overrides to authenticated;
