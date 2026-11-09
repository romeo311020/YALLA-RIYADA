-- إمكانية إخفاء مباراة معيّنة من «المباريات المهمة» (من غير ما تشيل الفريق من القائمة). شغّله مرة واحدة.
alter table public.fixture_overrides add column if not exists hide_important boolean not null default false;
