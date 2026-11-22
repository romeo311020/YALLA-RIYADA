-- ============ يلا رياضة — تجربة المشاهدة: مصادر البث + التفاعلات + التعليقات + المشاهدات ============
-- شغّل الملف كله مرة واحدة في Supabase → SQL Editor. آمن لو اتشغّل أكتر من مرة، وما بيمسحش أي بيانات موجودة.
-- يتطلب: supabase-setup.sql (دالة is_admin) و supabase-admin-upgrade.sql (جدول fixture_streams).

-- ---------- 1) مصادر المشاهدة (بث مباشر / ملخص) لكل مباراة ----------
create table if not exists public.match_sources (
  id uuid primary key default gen_random_uuid(),
  fixture_id bigint not null,
  kind text not null check (kind in ('live','highlight')),
  url text not null check (url ~ '^https://'),
  src_type text not null default 'embed' check (src_type in ('embed','mp4','hls')),
  channel text not null default '' check (char_length(channel) <= 80),
  preview_url text not null default '' check (preview_url = '' or preview_url ~ '^https://'),
  active boolean not null default true,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists match_sources_fixture_idx on public.match_sources (fixture_id, kind, sort_order);
alter table public.match_sources enable row level security;
drop policy if exists "members read sources" on public.match_sources;
create policy "members read sources" on public.match_sources for select to authenticated using (active or public.is_admin());
drop policy if exists "admins manage sources" on public.match_sources;
create policy "admins manage sources" on public.match_sources for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.match_sources from anon;
grant select on public.match_sources to authenticated;
grant insert, update, delete on public.match_sources to authenticated; -- الصلاحية الفعلية مقيّدة بالسياسة (أدمن فقط)

-- مصدر افتراضي واحد فقط لكل (مباراة + نوع)
create or replace function public.match_sources_bi() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.url := btrim(new.url); new.channel := btrim(new.channel); new.preview_url := btrim(new.preview_url);
  if new.is_default then
    update public.match_sources set is_default = false where fixture_id = new.fixture_id and kind = new.kind and id <> new.id;
  end if;
  return new;
end $$;
drop trigger if exists trg_match_sources_bi on public.match_sources;
create trigger trg_match_sources_bi before insert or update on public.match_sources for each row execute function public.match_sources_bi();

-- الزائر يعرف بس "إيه الأنواع المتاحة" (بدون روابط): يشمل المصادر الجديدة + رابط fixture_streams القديم
create or replace function public.watch_info(p_fixture bigint) returns jsonb
language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'live', exists (select 1 from public.match_sources where fixture_id = p_fixture and kind = 'live' and active),
    'highlight', exists (select 1 from public.match_sources where fixture_id = p_fixture and kind = 'highlight' and active),
    'legacy', exists (select 1 from public.fixture_streams where fixture_id = p_fixture)
      and not exists (select 1 from public.match_sources where fixture_id = p_fixture and active)
  )
$$;
grant execute on function public.watch_info(bigint) to anon, authenticated;

-- علامة «شاهد» في قايمة المباريات تشمل المصادر الجديدة كمان
create or replace function public.stream_fixture_ids(p_ids int[]) returns int[]
language sql security definer stable set search_path = public as $$
  select coalesce(array_agg(distinct f), '{}') from (
    select fixture_id::int f from public.fixture_streams where fixture_id = any(p_ids)
    union
    select fixture_id::int from public.match_sources where active and fixture_id = any(p_ids)
  ) t
$$;
grant execute on function public.stream_fixture_ids(int[]) to anon, authenticated;

-- ---------- 2) التفاعلات: لايك/ديسلايك (واحد لكل مستخدم لكل مباراة) + حفظ المباراة ----------
create table if not exists public.match_reactions (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fixture_id bigint not null,
  reaction_type text not null check (reaction_type in ('like','dislike')),
  created_at timestamptz not null default now(),
  primary key (user_id, fixture_id)
);
create table if not exists public.match_saves (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fixture_id bigint not null,
  created_at timestamptz not null default now(),
  primary key (user_id, fixture_id)
);
alter table public.match_reactions enable row level security;
alter table public.match_saves enable row level security;
drop policy if exists "own reactions" on public.match_reactions;
create policy "own reactions" on public.match_reactions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own saves" on public.match_saves;
create policy "own saves" on public.match_saves for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.match_reactions, public.match_saves from anon;
grant select, insert, update, delete on public.match_reactions, public.match_saves to authenticated;

-- ---------- 3) المشاهدات ----------
create table if not exists public.match_views (
  id bigint generated always as identity primary key,
  fixture_id bigint not null,
  user_id uuid references auth.users(id) on delete set null,
  viewer_key text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists match_views_fixture_idx on public.match_views (fixture_id, created_at desc);
alter table public.match_views enable row level security;
revoke all on public.match_views from anon, authenticated; -- الكتابة والقراءة عن طريق الدوال بس
-- تسجيل مشاهدة: مرة لكل (مستخدم/جهاز) لكل مباراة كل ساعة (حماية من التلاعب)
create or replace function public.record_view(p_fixture bigint, p_key text default '') returns void
language plpgsql security definer set search_path = public as $$
declare k text := left(coalesce(p_key,''), 64);
begin
  if p_fixture is null or p_fixture < 1 then return; end if;
  if exists (select 1 from public.match_views where fixture_id = p_fixture and created_at > now() - interval '1 hour'
             and ((auth.uid() is not null and user_id = auth.uid()) or (auth.uid() is null and k <> '' and viewer_key = k))) then return; end if;
  insert into public.match_views (fixture_id, user_id, viewer_key) values (p_fixture, auth.uid(), k);
end $$;
grant execute on function public.record_view(bigint, text) to anon, authenticated;

-- ---------- 4) التعليقات ----------
create table if not exists public.match_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fixture_id bigint not null,
  content text not null,
  parent_comment_id uuid references public.match_comments(id) on delete cascade,
  author_name text not null default '',
  author_avatar text,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists match_comments_fixture_idx on public.match_comments (fixture_id, parent_comment_id, created_at desc);
create table if not exists public.comment_likes (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  comment_id uuid not null references public.match_comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, comment_id)
);
create table if not exists public.comment_reports (
  id bigint generated always as identity primary key,
  comment_id uuid not null references public.match_comments(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reason text not null default '' check (char_length(reason) <= 200),
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);
alter table public.match_comments enable row level security;
alter table public.comment_likes enable row level security;
alter table public.comment_reports enable row level security;

drop policy if exists "read comments" on public.match_comments;
create policy "read comments" on public.match_comments for select to anon, authenticated using (not hidden or user_id = auth.uid() or public.is_admin());
drop policy if exists "insert own comment" on public.match_comments;
create policy "insert own comment" on public.match_comments for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "update own comment" on public.match_comments;
create policy "update own comment" on public.match_comments for update to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "delete own comment" on public.match_comments;
create policy "delete own comment" on public.match_comments for delete to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "own likes" on public.comment_likes;
create policy "own likes" on public.comment_likes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own reports" on public.comment_reports;
create policy "own reports" on public.comment_reports for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "admin reads reports" on public.comment_reports;
create policy "admin reads reports" on public.comment_reports for select to authenticated using (public.is_admin());
revoke all on public.match_comments, public.comment_likes, public.comment_reports from anon;
grant select on public.match_comments to anon;
grant select, insert, update, delete on public.match_comments, public.comment_likes to authenticated;
grant select, insert on public.comment_reports to authenticated;

-- التحقق في الخادم: نص مش فاضي، حد أقصى، اسم الكاتب من حسابه، ردود مستوى واحد، حد للسرعة
create or replace function public.match_comments_bi() returns trigger language plpgsql security definer set search_path = public as $$
declare u record; par record; recent int;
begin
  if tg_op = 'INSERT' then
    if auth.uid() is null then raise exception 'سجّل الدخول أولًا'; end if;
    new.user_id := auth.uid(); new.hidden := false;
    new.content := btrim(regexp_replace(new.content, '\s+', ' ', 'g'));
    if char_length(new.content) < 1 then raise exception 'اكتب تعليقًا'; end if;
    if char_length(new.content) > 1000 then raise exception 'التعليق طويل (الحد 1000 حرف)'; end if;
    select count(*) into recent from public.match_comments where user_id = auth.uid() and created_at > now() - interval '1 minute';
    if recent >= 5 then raise exception 'استنى شوية قبل التعليق تاني'; end if;
    if exists (select 1 from public.match_comments where user_id = auth.uid() and fixture_id = new.fixture_id and content = new.content and created_at > now() - interval '10 minutes') then
      raise exception 'التعليق ده اتبعت قبل كده';
    end if;
    if new.parent_comment_id is not null then
      select * into par from public.match_comments where id = new.parent_comment_id;
      if not found then raise exception 'التعليق الأصلي غير موجود'; end if;
      new.fixture_id := par.fixture_id;
      if par.parent_comment_id is not null then new.parent_comment_id := par.parent_comment_id; end if; -- ردود بمستوى واحد
    end if;
    select email, raw_user_meta_data into u from auth.users where id = auth.uid();
    new.author_name := left(coalesce(nullif(btrim(u.raw_user_meta_data->>'full_name'), ''), nullif(btrim(u.raw_user_meta_data->>'name'), ''), split_part(coalesce(u.email,''), '@', 1), 'مشجع'), 40);
    new.author_avatar := nullif(coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture', ''), '');
    new.created_at := now(); new.updated_at := now();
  else
    -- التعديل: النص فقط (صاحب التعليق)، والإخفاء للأدمن فقط
    new.user_id := old.user_id; new.fixture_id := old.fixture_id; new.parent_comment_id := old.parent_comment_id;
    new.author_name := old.author_name; new.author_avatar := old.author_avatar; new.created_at := old.created_at;
    if not public.is_admin() then new.hidden := old.hidden; end if;
    if new.content is distinct from old.content then
      new.content := btrim(regexp_replace(new.content, '\s+', ' ', 'g'));
      if char_length(new.content) < 1 or char_length(new.content) > 1000 then raise exception 'نص التعليق غير صالح'; end if;
      new.updated_at := now();
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_match_comments_bi on public.match_comments;
create trigger trg_match_comments_bi before insert or update on public.match_comments for each row execute function public.match_comments_bi();

-- ---------- 5) دوال القراءة (عدّادات + قائمة تعليقات بالترتيب والتحميل التدريجي) ----------
create or replace function public.watch_counts(p_fixture bigint) returns jsonb
language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'likes', (select count(*) from public.match_reactions where fixture_id = p_fixture and reaction_type = 'like'),
    'dislikes', (select count(*) from public.match_reactions where fixture_id = p_fixture and reaction_type = 'dislike'),
    'views', (select count(*) from public.match_views where fixture_id = p_fixture),
    'comments', (select count(*) from public.match_comments where fixture_id = p_fixture and not hidden),
    'mine', (select reaction_type from public.match_reactions where fixture_id = p_fixture and user_id = auth.uid()),
    'saved', exists (select 1 from public.match_saves where fixture_id = p_fixture and user_id = auth.uid())
  )
$$;
grant execute on function public.watch_counts(bigint) to anon, authenticated;

create or replace function public.watch_comments(p_fixture bigint, p_sort text default 'new', p_limit int default 15, p_offset int default 0, p_parent uuid default null)
returns table (id uuid, user_id uuid, content text, parent_comment_id uuid, author_name text, author_avatar text, created_at timestamptz, updated_at timestamptz,
               like_count bigint, liked boolean, reply_count bigint)
language sql security definer stable set search_path = public as $$
  select c.id, c.user_id, c.content, c.parent_comment_id, c.author_name, c.author_avatar, c.created_at, c.updated_at,
         (select count(*) from public.comment_likes l where l.comment_id = c.id) as like_count,
         exists (select 1 from public.comment_likes l where l.comment_id = c.id and l.user_id = auth.uid()) as liked,
         (select count(*) from public.match_comments r where r.parent_comment_id = c.id and not r.hidden) as reply_count
  from public.match_comments c
  where c.fixture_id = p_fixture and not c.hidden
    and ((p_parent is null and c.parent_comment_id is null) or c.parent_comment_id = p_parent)
  order by case when p_parent is not null then 0 end asc nulls last,
           case when p_sort = 'top' and p_parent is null then (select count(*) from public.comment_likes l where l.comment_id = c.id) end desc nulls last,
           case when p_parent is not null then c.created_at end asc,
           c.created_at desc
  limit least(greatest(p_limit, 1), 50) offset greatest(p_offset, 0)
$$;
grant execute on function public.watch_comments(bigint, text, int, int, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
