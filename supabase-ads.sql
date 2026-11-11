-- ============ إعلانات الموقع (صورة أو فيديو) بتتدار من لوحة التحكم ============
-- شغّل الملف كله مرة واحدة في Supabase → SQL Editor. آمن لو اتشغّل أكتر من مرة.
create table if not exists public.site_ads (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 2 and 80),
  media_type text not null default 'image' check (media_type in ('image','video','youtube')),
  media_url text not null,
  poster_url text,
  link_url text,
  cta_text text default 'اعرف أكتر',
  placement text not null default 'popup' check (placement in ('popup')),
  pages text not null default 'all' check (pages in ('all','home','matches','news','store')),
  delay_seconds int not null default 6 check (delay_seconds between 0 and 120),
  frequency_hours int not null default 12 check (frequency_hours between 0 and 720),
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  created_at timestamptz not null default now()
);
alter table public.site_ads enable row level security;
drop policy if exists "ads public read" on public.site_ads;
create policy "ads public read" on public.site_ads for select to anon, authenticated
  using ((active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())) or public.is_admin());
drop policy if exists "ads admin write" on public.site_ads;
create policy "ads admin write" on public.site_ads for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.site_ads from anon, authenticated;
grant select on public.site_ads to anon, authenticated;
grant insert, update, delete on public.site_ads to authenticated;
grant all on public.site_ads to service_role;

-- عدّاد المشاهدات والنقرات (أي زائر يقدر يزوّدهم بس، مش يقدر يعدّل حاجة تانية)
create or replace function public.ad_track(p_id uuid, p_kind text) returns void
language sql security definer set search_path = public as $$
  update public.site_ads set
    impressions = impressions + (case when p_kind = 'view' then 1 else 0 end),
    clicks = clicks + (case when p_kind = 'click' then 1 else 0 end)
  where id = p_id and p_kind in ('view','click');
$$;
revoke all on function public.ad_track(uuid, text) from public;
grant execute on function public.ad_track(uuid, text) to anon, authenticated;
notify pgrst, 'reload schema';
