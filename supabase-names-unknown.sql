-- ============ الفرق اللي لسه مش مترجمة (بتتجمع للأدمن) ============
-- شغّل الملف كله مرة واحدة في Supabase → SQL Editor. آمن لو اتشغّل أكتر من مرة.
create table if not exists public.name_unknown (
  kind text not null default 'team' check (kind in ('team','player')),
  en text not null check (char_length(en) between 2 and 80),
  hits int not null default 1,
  last_seen timestamptz not null default now(),
  primary key (kind, en)
);
alter table public.name_unknown enable row level security;
drop policy if exists "name_unknown admin all" on public.name_unknown;
create policy "name_unknown admin all" on public.name_unknown for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.name_unknown to authenticated;
grant all on public.name_unknown to service_role;

-- الزوار بيبلّغوا باسم الفريق بس (مفيش أي بيانات شخصية). الاسم لازم يكون حروف إنجليزي/أرقام/مسافة/نقطة/شرطة.
create or replace function public.report_unknown_name(p_kind text, p_en text)
returns void language plpgsql security definer set search_path = public as $$
declare n text := btrim(coalesce(p_en, ''));
begin
  if p_kind not in ('team','player') or char_length(n) < 2 or char_length(n) > 80 or n !~ '^[A-Za-z0-9 .''&-]+$' then return; end if;
  if exists (select 1 from public.name_translations t where t.kind = p_kind and lower(t.en) = lower(n)) then return; end if;
  if (select count(*) from public.name_unknown) > 3000 then return; end if;
  insert into public.name_unknown (kind, en) values (p_kind, n)
    on conflict (kind, en) do update set hits = public.name_unknown.hits + 1, last_seen = now();
end $$;
revoke all on function public.report_unknown_name(text, text) from public;
grant execute on function public.report_unknown_name(text, text) to anon, authenticated;

notify pgrst, 'reload schema';
