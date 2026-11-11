-- ============ حساب نقاط التوقعات أوتوماتيك كل 10 دقايق ============
-- قبل التشغيل: Supabase → Database → Extensions → فعّل pg_cron و pg_net (لو مش مفعّلين).
-- بعدها شغّل الملف كله مرة واحدة في SQL Editor. آمن لو اتشغّل أكتر من مرة.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule(jobid) from cron.job where jobname = 'settle-predictions';

select cron.schedule(
  'settle-predictions',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://kwezvusicohjcxhekupj.supabase.co/functions/v1/football-matches',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_k-P5KK1-w1XnNhgmfQHRyA_XE7OeMF6',
      'Authorization', 'Bearer sb_publishable_k-P5KK1-w1XnNhgmfQHRyA_XE7OeMF6'
    ),
    body := '{"action":"settle"}'::jsonb
  );
  $$
);

-- للتأكد إن المهمة اشتغلت (بعد 10 دقايق): 
-- select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;
-- ولنتيجة آخر نداء للدالة:
-- select id, status_code, content from net._http_response order by created desc limit 5;
