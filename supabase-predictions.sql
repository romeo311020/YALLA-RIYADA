-- ============ توقعات المباريات + لوحة الصدارة ============
-- شغّل الملف كله مرة واحدة في Supabase → SQL Editor. آمن لو اتشغّل أكتر من مرة.
create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fixture_id bigint not null,
  home_team text not null,
  away_team text not null,
  home_logo text,
  away_logo text,
  league text,
  kickoff timestamptz not null,
  pick_home smallint not null check (pick_home between 0 and 20),
  pick_away smallint not null check (pick_away between 0 and 20),
  result_home smallint,
  result_away smallint,
  points smallint,
  exact boolean not null default false,
  void boolean not null default false,
  settled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, fixture_id)
);
create index if not exists predictions_user_idx on public.predictions (user_id, kickoff desc);
create index if not exists predictions_open_idx on public.predictions (settled, kickoff);
alter table public.predictions enable row level security;

drop policy if exists "pred read own" on public.predictions;
create policy "pred read own" on public.predictions for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "pred insert own" on public.predictions;
create policy "pred insert own" on public.predictions for insert to authenticated with check (user_id = auth.uid() and settled = false and points is null);
drop policy if exists "pred update own" on public.predictions;
create policy "pred update own" on public.predictions for update to authenticated using (user_id = auth.uid() and settled = false) with check (user_id = auth.uid() and settled = false);
drop policy if exists "pred delete own" on public.predictions;
create policy "pred delete own" on public.predictions for delete to authenticated using (user_id = auth.uid() and settled = false);

-- المستخدم يكتب التوقع بس؛ النقاط والنتيجة بيحسبها السيرفر
revoke all on public.predictions from anon, authenticated;
grant select on public.predictions to authenticated;
grant insert (fixture_id, home_team, away_team, home_logo, away_logo, league, kickoff, pick_home, pick_away) on public.predictions to authenticated;
grant update (pick_home, pick_away) on public.predictions to authenticated;
grant delete on public.predictions to authenticated;
grant all on public.predictions to service_role;

create or replace function public.predictions_touch() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then new.created_at := now(); end if;
  return new;
end $$;
drop trigger if exists predictions_touch on public.predictions;
create trigger predictions_touch before insert or update on public.predictions for each row execute function public.predictions_touch();

-- حساب النقاط بعد نهاية المباراة (بتتنادى من دالة football-matches بمفتاح السيرفر فقط)
-- تمام النتيجة = 5، الفائز + فرق الأهداف = 3، الفائز/التعادل بس = 1.
-- أي توقع اتعدّل بعد ركلة البداية الحقيقية (من المزوّد) بيتلغي ولا يدخل الصدارة.
create or replace function public.settle_fixture(p_fixture bigint, p_home int, p_away int, p_kickoff timestamptz)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.predictions p set
    result_home = p_home, result_away = p_away, settled = true,
    void = (p.updated_at >= p_kickoff),
    exact = (p.updated_at < p_kickoff and p.pick_home = p_home and p.pick_away = p_away),
    points = case
      when p.updated_at >= p_kickoff then 0
      when p.pick_home = p_home and p.pick_away = p_away then 5
      when sign(p.pick_home - p.pick_away) = sign(p_home - p_away) and (p.pick_home - p.pick_away) = (p_home - p_away) then 3
      when sign(p.pick_home - p.pick_away) = sign(p_home - p_away) then 1
      else 0 end
  where p.fixture_id = p_fixture and p.settled = false;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.settle_fixture(bigint, int, int, timestamptz) from public, anon, authenticated;
grant execute on function public.settle_fixture(bigint, int, int, timestamptz) to service_role;

-- لوحة الصدارة: p_days = عدد الأيام الأخيرة (null = كل الوقت)
create or replace function public.prediction_leaderboard(p_days int default null, p_limit int default 50)
returns table (rank bigint, user_id uuid, name text, points bigint, exact_count bigint, total bigint, me boolean)
language sql stable security definer set search_path = public, auth as $$
  with agg as (
    select p.user_id, sum(p.points)::bigint as pts, count(*) filter (where p.exact)::bigint as ex, count(*)::bigint as tot
    from public.predictions p
    where p.settled and not p.void and (p_days is null or p.kickoff > now() - make_interval(days => p_days))
    group by p.user_id
  )
  select row_number() over (order by a.pts desc, a.ex desc, a.tot asc) as rank,
         a.user_id,
         coalesce(nullif(btrim(u.raw_user_meta_data->>'display_name'), ''), nullif(btrim(u.raw_user_meta_data->>'full_name'), ''), 'مشجع ' || substr(a.user_id::text, 1, 4)) as name,
         a.pts, a.ex, a.tot, (a.user_id = auth.uid()) as me
  from agg a join auth.users u on u.id = a.user_id
  order by a.pts desc, a.ex desc, a.tot asc
  limit greatest(1, least(coalesce(p_limit, 50), 100));
$$;
revoke all on function public.prediction_leaderboard(int, int) from public;
grant execute on function public.prediction_leaderboard(int, int) to anon, authenticated, service_role;
notify pgrst, 'reload schema';
