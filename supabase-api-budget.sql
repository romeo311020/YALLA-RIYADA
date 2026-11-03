-- يلا رياضة — كاش وحصة مشتركة لطلبات مزوّد المباريات (يمنع استهلاك الـ100 طلب/يوم من أكتر من نسخة).
-- شغّله مرة واحدة في Supabase > SQL Editor (آمن لو أعدت تشغيله).

create table if not exists public.api_cache (
  key text primary key,
  payload jsonb not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.api_budget (
  bucket text primary key,          -- مثال: d:football:2026-11-03  أو  m:football:2026-11-03T02:51
  used int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.api_cache enable row level security;
alter table public.api_budget enable row level security;
-- لا سياسات: الوصول من الدالة فقط (service role). نمنع الزوار تمامًا.
revoke all on public.api_cache, public.api_budget from anon, authenticated;

-- يحجز طلبًا واحدًا بشكل ذري. يرجع: ok | day | minute
create or replace function public.take_api_budget(p_sport text, p_day text, p_minute text, p_day_limit int, p_min_limit int)
returns text language plpgsql security definer set search_path = public as $$
declare dk text := 'd:' || p_sport || ':' || p_day; mk text := 'm:' || p_sport || ':' || p_minute; du int; mu int;
begin
  insert into api_budget(bucket) values (dk), (mk) on conflict do nothing;
  select used into du from api_budget where bucket = dk for update;
  select used into mu from api_budget where bucket = mk for update;
  if du >= p_day_limit then return 'day'; end if;
  if mu >= p_min_limit then return 'minute'; end if;
  update api_budget set used = used + 1, updated_at = now() where bucket in (dk, mk);
  if random() < 0.02 then
    delete from api_budget where updated_at < now() - interval '2 days';
    delete from api_cache where expires_at < now() - interval '2 days';
  end if;
  return 'ok';
end $$;
revoke all on function public.take_api_budget(text, text, text, int, int) from public, anon, authenticated;
grant execute on function public.take_api_budget(text, text, text, int, int) to service_role;

notify pgrst, 'reload schema';
