-- يلا رياضة — كتالوج البطولات والفرق (يتملى من API-Football عن طريق زر «مزامنة» في لوحة التحكم).
-- شغّله مرة واحدة في Supabase > SQL Editor (آمن لو أعدت تشغيله). لازم supabase-push-step1.sql و supabase-push-media.sql و supabase-follow-team.sql يكونوا اتشغّلوا قبله.
alter table public.push_targets drop constraint if exists push_targets_kind_check;
alter table public.push_targets add constraint push_targets_kind_check check (kind in ('team','player','league'));
alter table public.push_targets add column if not exists country text;
alter table public.push_targets add column if not exists leagues int[] not null default '{}';
alter table public.push_targets add column if not exists season int;
alter table public.push_targets add column if not exists api_id int;
do $$ begin
  create unique index if not exists push_targets_kind_api on public.push_targets (kind, api_id) where api_id is not null;
exception when others then raise notice 'تعذّر إنشاء الفهرس الفريد (فيه تكرار قديم): %', sqlerrm; end $$;
create index if not exists push_targets_leagues_gin on public.push_targets using gin (leagues);

create or replace function public.catalog_upsert(p_kind text, p_rows jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare r jsonb; n int := 0; aid int; nm text; lid int; sid int;
begin
  if p_kind not in ('team','league') then raise exception 'نوع غير صالح'; end if;
  for r in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    aid := nullif(r->>'api_id','')::int; nm := left(btrim(coalesce(r->>'name_en','')), 90); lid := nullif(r->>'league_id','')::int; sid := nullif(r->>'sort','')::int;
    continue when aid is null or char_length(nm) < 2;
    begin
      update push_targets set api_id = coalesce(api_id, aid), logo_url = coalesce(nullif(r->>'logo',''), logo_url), country = coalesce(nullif(r->>'country',''), country),
        season = coalesce(nullif(r->>'season','')::int, season), active = true,
        name_ar = case when p_kind = 'league' and nullif(r->>'name_ar','') is not null then r->>'name_ar' else name_ar end,
        sort_order = case when p_kind = 'league' and sid is not null then sid else sort_order end,
        leagues = case when lid is not null and not (leagues @> array[lid]) then leagues || lid else leagues end
      where kind = p_kind and (api_id = aid or (api_id is null and lower(name_en) = lower(nm)));
      if not found then
        insert into push_targets (kind, name_en, name_ar, api_id, logo_url, country, season, active, sort_order, leagues)
        values (p_kind, nm, coalesce(nullif(r->>'name_ar',''), nm), aid, nullif(r->>'logo',''), nullif(r->>'country',''), nullif(r->>'season','')::int, true,
                coalesce(sid, 500), case when lid is not null then array[lid] else '{}' end);
      end if;
      n := n + 1;
    exception when unique_violation then
      begin
        insert into push_targets (kind, name_en, name_ar, api_id, logo_url, country, season, active, sort_order, leagues)
        values (p_kind, nm || ' #' || aid, coalesce(nullif(r->>'name_ar',''), nm), aid, nullif(r->>'logo',''), nullif(r->>'country',''), nullif(r->>'season','')::int, true,
                coalesce(sid, 500), case when lid is not null then array[lid] else '{}' end);
        n := n + 1;
      exception when others then null; end;
    end;
  end loop;
  return n;
end $$;
revoke all on function public.catalog_upsert(text, jsonb) from public, anon, authenticated;
grant execute on function public.catalog_upsert(text, jsonb) to service_role;
-- يخفي الفرق المضافة تلقائيًا اللي مش في دوري/بطولة مهمة (بدون ما يلمس الفرق اللي حد بيتابعها أو الأدمن ضافها يدويًا)
create or replace function public.catalog_prune(p_leagues int[])
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update push_targets t set active = false
  where t.kind = 'team' and t.api_id is not null and t.sort_order >= 100 and t.active
    and cardinality(coalesce(p_leagues, '{}')) > 0 and not (t.leagues && p_leagues)
    and not exists (select 1 from push_follows f where f.target_id = t.id);
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.catalog_prune(int[]) from public, anon, authenticated;
grant execute on function public.catalog_prune(int[]) to service_role;
notify pgrst, 'reload schema';
