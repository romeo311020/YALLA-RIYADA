-- يلا رياضة — متابعة أي فريق بضغطة واحدة (من صفحة الفريق أو المباراة).
-- شغّله مرة واحدة في Supabase > SQL Editor (آمن لو أعدت تشغيله). لازم يكون supabase-push-step1.sql و supabase-push-media.sql اتشغّلوا قبله.
create or replace function public.follow_team(p_api_id int, p_name_en text, p_logo text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); tid uuid; nm text := left(btrim(coalesce(p_name_en, '')), 80); cnt int;
begin
  if uid is null then raise exception 'سجّل الدخول أولًا'; end if;
  if p_api_id is null or p_api_id < 1 or p_api_id > 100000000 then raise exception 'فريق غير صالح'; end if;
  if char_length(nm) < 2 then raise exception 'اسم الفريق غير صالح'; end if;
  select count(*) into cnt from push_follows f join push_targets t on t.id = f.target_id where f.user_id = uid and t.kind = 'team';
  select id into tid from push_targets where kind = 'team' and api_id = p_api_id limit 1;
  if tid is null then select id into tid from push_targets where kind = 'team' and name_en = nm limit 1; end if;
  if tid is not null and exists (select 1 from push_follows where user_id = uid and target_id = tid) then return tid; end if;
  if cnt >= 40 then raise exception 'وصلت للحد الأقصى (40 فريق)'; end if;
  if tid is null then
    insert into push_targets (kind, name_en, name_ar, api_id, logo_url, active, sort_order)
    values ('team', nm, nm, p_api_id, case when p_logo ~ '^https://' then left(p_logo, 300) end, true, 500)
    on conflict (kind, name_en) do update set api_id = coalesce(push_targets.api_id, excluded.api_id)
    returning id into tid;
  end if;
  insert into push_follows (user_id, target_id) values (uid, tid) on conflict do nothing;
  return tid;
end $$;
revoke all on function public.follow_team(int, text, text) from public, anon;
grant execute on function public.follow_team(int, text, text) to authenticated;

create or replace function public.unfollow_team(p_api_id int)
returns void language sql security definer set search_path = public as $$
  delete from push_follows f using push_targets t
  where f.target_id = t.id and f.user_id = auth.uid() and t.kind = 'team' and t.api_id = p_api_id;
$$;
revoke all on function public.unfollow_team(int) from public, anon;
grant execute on function public.unfollow_team(int) to authenticated;
notify pgrst, 'reload schema';
