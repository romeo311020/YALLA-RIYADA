-- ============ أرشيف مباريات الفرق المهمة (آخر النتائج والقادمة تفضل موجودة) ============
-- شغّل الملف كله مرة واحدة في Supabase → SQL Editor. آمن لو اتشغّل أكتر من مرة.
-- الفرق المهمة = الفرق اللي ليها api_id في جدول push_targets (قائمة المتابعة).
create table if not exists public.team_matches (
  fixture_id bigint primary key,
  date timestamptz not null,
  status text not null default '',
  league_id integer,
  league text not null default '',
  home_id integer, away_id integer,
  home text not null default '', away text not null default '',
  home_logo text, away_logo text,
  home_goals integer, away_goals integer,
  updated_at timestamptz not null default now()
);
create index if not exists team_matches_home_idx on public.team_matches (home_id, date desc);
create index if not exists team_matches_away_idx on public.team_matches (away_id, date desc);
alter table public.team_matches enable row level security;
-- مفيش سياسات: الدالة بتكتب وتقرأ بمفتاح الخدمة، والمتصفح مش بيلمس الجدول مباشرة.
grant all on public.team_matches to service_role;

-- حفظ أوتوماتيك كل 3 ساعات (أمس/النهارده/بكرة/بعده). محتاج pg_cron و pg_net مفعّلين.
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule(jobid) from cron.job where jobname = 'archive-team-matches';
select cron.schedule(
  'archive-team-matches',
  '15 */3 * * *',
  $$
  select net.http_post(
    url := 'https://kwezvusicohjcxhekupj.supabase.co/functions/v1/football-matches',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_k-P5KK1-w1XnNhgmfQHRyA_XE7OeMF6',
      'Authorization', 'Bearer sb_publishable_k-P5KK1-w1XnNhgmfQHRyA_XE7OeMF6'
    ),
    body := '{"action":"archive"}'::jsonb
  );
  $$
);
notify pgrst, 'reload schema';
