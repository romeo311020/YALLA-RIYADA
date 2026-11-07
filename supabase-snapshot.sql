-- نسخة احتياطية للمباريات المهمة: تظهر للزوار حتى لو حصة الـ API خلصت. شغّله مرة واحدة.
alter table public.fixture_overrides add column if not exists snapshot jsonb;
alter table public.fixture_overrides add column if not exists featured boolean not null default false;
