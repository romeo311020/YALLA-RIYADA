-- ============ لوجوهات الفرق وصور اللاعبين في صفحة اختيار المفضلة ============
-- شغّل الملف كله مرة واحدة في Supabase → SQL Editor. آمن لو اتشغّل أكتر من مرة.
-- api_id = رقم الفريق/اللاعب في API-Football (الصورة بتتجاب من media.api-sports.io ومش بتستهلك من حد الطلبات).
-- logo_url = رابط صورة مباشر (اختياري، بيتقدّم على api_id).
alter table public.push_targets add column if not exists api_id integer;
alter table public.push_targets add column if not exists logo_url text;

update public.push_targets set api_id = 541  where kind='team'   and name_en='Real Madrid'       and api_id is null;
update public.push_targets set api_id = 529  where kind='team'   and name_en='Barcelona'         and api_id is null;
update public.push_targets set api_id = 1029 where kind='team'   and name_en='Al Ahly'           and api_id is null;
update public.push_targets set api_id = 1046 where kind='team'   and name_en='Zamalek'           and api_id is null;
update public.push_targets set api_id = 874  where kind='player' and name_en='Cristiano Ronaldo' and api_id is null;
update public.push_targets set api_id = 154  where kind='player' and name_en='Lionel Messi'       and api_id is null;
update public.push_targets set api_id = 306  where kind='player' and name_en='Mohamed Salah'      and api_id is null;
notify pgrst, 'reload schema';
