-- يلا رياضة — تذكير قبل المباراة (زر الجرس في كروت المباريات).
-- شغّل الملف كله مرة واحدة في Supabase > SQL Editor (آمن لو أعدت تشغيله). محتاج supabase-push-step1.sql متشغّل قبله.
create table if not exists public.match_reminders (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fixture_id bigint not null,
  title text not null,
  kickoff timestamptz not null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, fixture_id)
);
create index if not exists match_reminders_due_idx on public.match_reminders (kickoff) where sent_at is null;
alter table public.match_reminders enable row level security;
drop policy if exists "rem own read" on public.match_reminders;
create policy "rem own read" on public.match_reminders for select to authenticated using (user_id = auth.uid());
drop policy if exists "rem own insert" on public.match_reminders;
create policy "rem own insert" on public.match_reminders for insert to authenticated with check (user_id = auth.uid() and sent_at is null);
drop policy if exists "rem own delete" on public.match_reminders;
create policy "rem own delete" on public.match_reminders for delete to authenticated using (user_id = auth.uid());
revoke all on public.match_reminders from anon, authenticated;
grant select on public.match_reminders to authenticated;
grant insert (fixture_id, title, kickoff) on public.match_reminders to authenticated;
grant delete on public.match_reminders to authenticated;
grant all on public.match_reminders to service_role;

-- إرسال التذكيرات المستحقة كل 5 دقايق (محتاج pg_cron و pg_net مفعّلين من Database > Extensions)
do $$ begin
  create extension if not exists pg_cron; create extension if not exists pg_net;
  perform cron.unschedule(jobid) from cron.job where jobname = 'match-reminders';
  perform cron.schedule('match-reminders', '*/5 * * * *', $c$
    select net.http_post(
      url := 'https://kwezvusicohjcxhekupj.supabase.co/functions/v1/send-push',
      headers := jsonb_build_object('Content-Type','application/json','apikey','sb_publishable_k-P5KK1-w1XnNhgmfQHRyA_XE7OeMF6','Authorization','Bearer sb_publishable_k-P5KK1-w1XnNhgmfQHRyA_XE7OeMF6'),
      body := '{"action":"remind"}'::jsonb);
  $c$);
exception when others then raise notice 'تعذّرت الجدولة: % — فعّل pg_cron و pg_net وأعد التشغيل', sqlerrm; end $$;
notify pgrst, 'reload schema';
