-- يلا رياضة — صفحة لكل خبر (تصنيف + ملخص + عدّاد مشاهدات)
alter table public.news add column if not exists category text not null default 'أخبار';
alter table public.news add column if not exists excerpt text not null default '';
alter table public.news add column if not exists views integer not null default 0;
alter table public.news add column if not exists source_url text not null default '';

create or replace function public.news_view(p_id uuid)
returns void language sql security definer set search_path = '' as $$
  update public.news set views = views + 1 where id = p_id and is_published;
$$;
revoke all on function public.news_view(uuid) from public;
grant execute on function public.news_view(uuid) to anon, authenticated;
