-- يلا رياضة — لوجوهات الفريقين للمباريات اليدوية. شغّله مرة واحدة في Supabase > SQL Editor (آمن لو كررته).
alter table public.matches add column if not exists home_logo text not null default '';
alter table public.matches add column if not exists away_logo text not null default '';
alter table public.matches drop constraint if exists matches_logo_https;
alter table public.matches add constraint matches_logo_https check (
  (home_logo = '' or home_logo ~ '^https://') and (away_logo = '' or away_logo ~ '^https://'));
-- لو الجدول عنده صلاحيات أعمدة (column grants) نسمح للزوار بقراءة اللوجو فقط
do $$ begin
  begin execute 'grant select (home_logo, away_logo) on public.matches to anon, authenticated'; exception when others then null; end;
end $$;
notify pgrst, 'reload schema';
