-- يلا رياضة — المشغّلات والطلبات للأعضاء المسجّلين فقط (حماية من قاعدة البيانات نفسها، مش من الواجهة بس).
-- شغّله مرة واحدة في Supabase > SQL Editor (آمن لو أعدت تشغيله). يتطلب: supabase-admin-upgrade.sql و supabase-orders.sql قبله.

-- 1) روابط المشغّل في fixture_streams: للمسجّلين فقط
drop policy if exists "public read fixture streams" on public.fixture_streams;
drop policy if exists "members read fixture streams" on public.fixture_streams;
create policy "members read fixture streams" on public.fixture_streams for select to authenticated using (true);
revoke select on public.fixture_streams from anon;
grant select on public.fixture_streams to authenticated;

-- 2) الزائر يعرف فقط "أي مباريات عليها مشغّل" (لعلامة شاهد) بدون الرابط
create or replace function public.stream_fixture_ids(p_ids int[]) returns int[]
language sql security definer stable set search_path = public as $$
  select coalesce(array_agg(fixture_id::int), '{}') from public.fixture_streams where fixture_id = any(p_ids)
$$;
grant execute on function public.stream_fixture_ids(int[]) to anon, authenticated;

-- 3) رابط المشغّل في المباريات اليدوية (matches.embed_url): مخفي عن الزائر
revoke select on public.matches from anon;
grant select (id, sport, league, home_team, away_team, kickoff, status, home_score, away_score, notes, is_published, created_at, updated_at) on public.matches to anon;
create or replace function public.match_has_stream(p_id uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.matches where id = p_id and is_published and embed_url <> '')
$$;
grant execute on function public.match_has_stream(uuid) to anon, authenticated;

-- 4) الطلبات: للمسجّلين فقط، والعضو يشوف طلباته هو بس
drop policy if exists "orders_insert_public" on public.orders;
drop policy if exists "orders_insert_members" on public.orders;
create policy "orders_insert_members" on public.orders for insert to authenticated
  with check (auth.uid() is not null and product_id is not null);
revoke insert on public.orders from anon;
grant insert on public.orders to authenticated;
drop policy if exists "orders_read_own" on public.orders;
create policy "orders_read_own" on public.orders for select to authenticated using (user_id = auth.uid());

create or replace function public.orders_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record;
begin
  if auth.uid() is null then raise exception 'سجّل الدخول أولًا'; end if;
  select id, name, price into p from public.products where id = new.product_id and is_published = true;
  if not found then raise exception 'المنتج غير متاح'; end if;
  new.product_name := p.name;
  new.unit_price := p.price;
  new.total := case when p.price is null then null else p.price * new.quantity end;
  new.status := 'new';
  new.admin_note := '';
  new.user_id := auth.uid();
  new.customer_name := btrim(new.customer_name);
  new.phone := btrim(new.phone);
  return new;
end $$;

notify pgrst, 'reload schema';
