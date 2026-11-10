-- ============ إحصائيات الزيارات (بدون أي بيانات شخصية) ============
-- شغّل الملف كله مرة واحدة في Supabase → SQL Editor. آمن لو اتشغّل أكتر من مرة.
create table if not exists public.site_stats (
  day date not null,
  page text not null,
  hits int not null default 0,
  primary key (day, page)
);
alter table public.site_stats enable row level security;
drop policy if exists "site_stats admin read" on public.site_stats;
create policy "site_stats admin read" on public.site_stats for select to authenticated using (public.is_admin());
grant select on public.site_stats to authenticated;
grant all on public.site_stats to service_role;

-- بتسجّل زيارة صفحة (أو زائر جديد اليوم لو page = _visitor). أسماء الصفحات بس حروف وأرقام.
create or replace function public.track_visit(p_page text)
returns void language plpgsql security definer set search_path = public as $$
declare pg text := lower(left(coalesce(p_page, ''), 40)); d date := (now() at time zone 'Africa/Cairo')::date;
begin
  if pg !~ '^[a-z0-9_.-]+$' then return; end if;
  insert into public.site_stats (day, page, hits) values (d, pg, 1)
    on conflict (day, page) do update set hits = public.site_stats.hits + 1;
end $$;
revoke all on function public.track_visit(text) from public;
grant execute on function public.track_visit(text) to anon, authenticated;

notify pgrst, 'reload schema';
