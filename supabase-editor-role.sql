-- دور "محرر": يكتب الأخبار فقط. شغّل الملف مرة واحدة في Supabase → SQL Editor.
do $$
declare c text;
begin
  for c in select conname from pg_constraint where conrelid = 'public.profiles'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%role%' loop
    execute format('alter table public.profiles drop constraint %I', c);
  end loop;
end $$;
alter table public.profiles add constraint profiles_role_check check (role in ('user','editor','admin'));

create or replace function public.is_editor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin','editor'));
$$;
revoke all on function public.is_editor() from public;
grant execute on function public.is_editor() to authenticated;

-- الأخبار: الأدمن والمحرر. كل الجداول الأخرى تبقى للأدمن فقط.
drop policy if exists "public read published news" on public.news;
create policy "public read published news" on public.news for select to anon, authenticated using (is_published or public.is_editor());
drop policy if exists "admins manage news" on public.news;
drop policy if exists "editors manage news" on public.news;
create policy "editors manage news" on public.news for all to authenticated using (public.is_editor()) with check (public.is_editor());
