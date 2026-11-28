-- يلا رياضة — التوقعات v2: إحصائيات المستخدم + صدارة بصور + حساب النقاط من قاعدة البيانات (بدون API).
-- شغّله مرة واحدة في Supabase > SQL Editor بعد supabase-predictions.sql (آمن لو أعدت تشغيله).

-- 1) حساب النقاط من نتائج محفوظة عندنا (team_matches + fixture_overrides) — مجاني ومش بيستهلك حصة الـAPI
create or replace function public.settle_from_db()
returns int language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in
    select distinct on (x.fid) x.fid, x.h, x.a, x.ko from (
      select t.fixture_id as fid, t.home_goals as h, t.away_goals as a, t.date as ko, 1 as pri
        from public.team_matches t where t.status in ('FT','AET','PEN') and t.home_goals is not null and t.away_goals is not null
      union all
      select o.fixture_id, o.home_score, o.away_score, o.kickoff, 0
        from public.fixture_overrides o where o.status = 'finished' and o.home_score is not null and o.away_score is not null and o.kickoff is not null
    ) x
    where exists (select 1 from public.predictions p where p.fixture_id = x.fid and not p.settled)
    order by x.fid, x.pri
  loop
    n := n + public.settle_fixture(r.fid, r.h, r.a, r.ko);
  end loop;
  return n;
end $$;
revoke all on function public.settle_from_db() from public, anon, authenticated;
grant execute on function public.settle_from_db() to service_role;

-- 2) إحصائيات المستخدم الحالي
create or replace function public.my_prediction_stats()
returns table (points bigint, rank bigint, exact_count bigint, correct bigint, settled bigint, pending bigint, total bigint)
language sql stable security definer set search_path = public as $$
  with mine as (
    select coalesce(sum(p.points) filter (where p.settled and not p.void), 0)::bigint as pts,
           count(*) filter (where p.exact)::bigint as ex,
           count(*) filter (where p.settled and not p.void and p.points > 0)::bigint as ok,
           count(*) filter (where p.settled and not p.void)::bigint as st,
           count(*) filter (where not p.settled)::bigint as pe,
           count(*)::bigint as tot
    from public.predictions p where p.user_id = auth.uid()
  ), agg as (
    select p.user_id, sum(p.points)::bigint as pts from public.predictions p where p.settled and not p.void group by p.user_id
  )
  select m.pts, case when m.st = 0 then null else (select 1 + count(*) from agg a where a.pts > m.pts) end, m.ex, m.ok, m.st, m.pe, m.tot from mine m where auth.uid() is not null;
$$;
revoke all on function public.my_prediction_stats() from public, anon;
grant execute on function public.my_prediction_stats() to authenticated;

-- 3) لوحة الصدارة (الاسم + الصورة): p_days = 7 أسبوعي، 30 شهري، null موسمي/كل الوقت
drop function if exists public.prediction_leaderboard(int, int);
create or replace function public.prediction_leaderboard(p_days int default null, p_limit int default 50)
returns table (rank bigint, user_id uuid, name text, avatar text, points bigint, exact_count bigint, correct bigint, total bigint, me boolean)
language sql stable security definer set search_path = public, auth as $$
  with agg as (
    select p.user_id, sum(p.points)::bigint as pts, count(*) filter (where p.exact)::bigint as ex,
           count(*) filter (where p.points > 0)::bigint as ok, count(*)::bigint as tot
    from public.predictions p
    where p.settled and not p.void and (p_days is null or p.kickoff > now() - make_interval(days => p_days))
    group by p.user_id
  )
  select row_number() over (order by a.pts desc, a.ex desc, a.tot asc) as rank, a.user_id,
         coalesce(nullif(btrim(u.raw_user_meta_data->>'display_name'), ''), nullif(btrim(u.raw_user_meta_data->>'full_name'), ''), 'مشجع ' || substr(a.user_id::text, 1, 4)) as name,
         case when coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture', '') ~ '^https://' then coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture') end as avatar,
         a.pts, a.ex, a.ok, a.tot, (a.user_id = auth.uid()) as me
  from agg a join auth.users u on u.id = a.user_id
  order by a.pts desc, a.ex desc, a.tot asc
  limit greatest(1, least(coalesce(p_limit, 50), 100));
$$;
revoke all on function public.prediction_leaderboard(int, int) from public;
grant execute on function public.prediction_leaderboard(int, int) to anon, authenticated, service_role;

-- 3b) مباريات جاية متاحة للتوقع من الأرشيف المحفوظ (بديل لما حصة الـAPI تخلص)
create or replace function public.predictable_fixtures()
returns table (fixture_id bigint, kickoff timestamptz, home_team text, away_team text, home_logo text, away_logo text, league text)
language sql stable security definer set search_path = public as $$
  select t.fixture_id, t.date, t.home, t.away, t.home_logo, t.away_logo, t.league
  from public.team_matches t
  where t.status in ('NS','TBD') and t.date > now() + interval '5 minutes' and t.date < now() + interval '3 days' and t.home <> '' and t.away <> ''
  order by t.date limit 80;
$$;
revoke all on function public.predictable_fixtures() from public;
grant execute on function public.predictable_fixtures() to anon, authenticated, service_role;

-- 4) جدولة حساب النقاط كل 5 دقايق من القاعدة مباشرة (محتاج pg_cron: Database > Extensions)
do $$ begin
  create extension if not exists pg_cron;
  perform cron.unschedule(jobid) from cron.job where jobname = 'settle-from-db';
  perform cron.schedule('settle-from-db', '*/5 * * * *', 'select public.settle_from_db()');
exception when others then raise notice 'تعذّرت جدولة pg_cron: % — فعّل pg_cron من Extensions وأعد التشغيل', sqlerrm; end $$;
notify pgrst, 'reload schema';
