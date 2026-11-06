-- يلا رياضة — حفظ المباراة كاملة (تشكيلة + أحداث + إحصائيات + تفاصيل) وحذفها كاملة من قاعدة البيانات.
-- شغّله مرة واحدة في Supabase > SQL Editor (آمن لو كررته). يتطلب is_admin() من supabase-admin-upgrade.sql.

alter table public.matches add column if not exists fixture_id bigint;
alter table public.matches add column if not exists details jsonb not null default '{}'::jsonb;
alter table public.matches drop constraint if exists matches_details_size;
alter table public.matches add constraint matches_details_size check (octet_length(details::text) <= 400000);
create index if not exists matches_fixture_id_idx on public.matches(fixture_id) where fixture_id is not null;

-- الزوار يقرأون التفاصيل (بدون رابط المشغّل اللي بقي للأعضاء فقط)
do $$ begin
  begin execute 'grant select (fixture_id, details) on public.matches to anon, authenticated'; exception when others then null; end;
end $$;

-- حذف كامل: المباراة + مشغّلها + تشكيلتها/تفاصيلها اليدوية + نسخة الكاش، ويرجّع كام صف اتمسح
create or replace function public.delete_match_full(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare fid bigint; n_stream int := 0; n_manual int := 0; n_cache int := 0; n_match int := 0;
begin
  if not public.is_admin() then raise exception 'للمسؤولين فقط'; end if;
  select fixture_id into fid from public.matches where id = p_id;
  if fid is not null then
    delete from public.fixture_streams where fixture_id = fid; get diagnostics n_stream = row_count;
    delete from public.fixture_manual  where fixture_id = fid; get diagnostics n_manual = row_count;
    begin delete from public.api_cache where key = 'football:f:' || fid; get diagnostics n_cache = row_count;
    exception when undefined_table then null; end;
  end if;
  delete from public.matches where id = p_id; get diagnostics n_match = row_count;
  return jsonb_build_object('match', n_match, 'stream', n_stream, 'manual', n_manual, 'cache', n_cache);
end $$;
revoke all on function public.delete_match_full(uuid) from public, anon;
grant execute on function public.delete_match_full(uuid) to authenticated;

notify pgrst, 'reload schema';
