-- يلا رياضة — الفرق اللي فيه مستخدمين بيتابعوها (بتستخدمها دالة football-matches عشان توفّر حصة الـ API).
-- شغّله مرة واحدة في Supabase > SQL Editor (آمن لو أعدت تشغيله). مفيش بيانات مستخدمين بتتكشف: بس أرقام الفرق.
create or replace function public.followed_team_api_ids()
returns int[] language sql security definer set search_path = public stable as $$
  select coalesce(array_agg(distinct t.api_id), '{}')
  from push_follows f join push_targets t on t.id = f.target_id
  where t.kind = 'team' and t.api_id is not null and t.active;
$$;
revoke all on function public.followed_team_api_ids() from public, anon, authenticated;
grant execute on function public.followed_team_api_ids() to service_role;
create index if not exists push_follows_target_idx on public.push_follows (target_id);
notify pgrst, 'reload schema';
