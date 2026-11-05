-- يلا رياضة — تأمين الطلبات: ربط كل طلب ببريد حساب العميل + فلترة بيانات غلط/ألفاظ سيئة + حد للطلبات.
-- شغّله مرة واحدة في Supabase > SQL Editor (آمن لو شغّلته أكتر من مرة). يتطلب supabase-orders.sql قبله.

alter table public.orders add column if not exists user_email text not null default '';

-- كلمات ممنوعة (تقدر تضيف/تحذف منها من Table Editor > blocked_words)
create table if not exists public.blocked_words (word text primary key);
alter table public.blocked_words enable row level security;
drop policy if exists "blocked_words_admin" on public.blocked_words;
create policy "blocked_words_admin" on public.blocked_words for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
insert into public.blocked_words(word) values
  ('كس'),('زب'),('شرموط'),('شرموطة'),('متناك'),('منيك'),('خول'),('عرص'),('ابن الكلب'),('ابن الوسخة'),('قحبة'),('لبوة'),('احا'),('يلعن'),
  ('fuck'),('shit'),('bitch'),('dick'),('asshole'),('pussy')
on conflict do nothing;

create or replace function public.orders_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  p record; w record; txt text; ph text;
begin
  if auth.uid() is null then raise exception 'ORDER:سجّل دخولك أولًا لإتمام الطلب.'; end if;

  select id, name, price into p from public.products where id = new.product_id and is_published = true;
  if not found then raise exception 'ORDER:المنتج غير متاح.'; end if;

  new.customer_name := btrim(regexp_replace(new.customer_name, '\s+', ' ', 'g'));
  ph := regexp_replace(btrim(new.phone), '[\s-]', '', 'g');
  new.phone := ph;
  new.city := btrim(new.city); new.address := btrim(new.address); new.notes := btrim(new.notes);

  -- الاسم: حروف ومسافات فقط (بدون أرقام أو رموز)، وكلمتين على الأقل
  if new.customer_name ~ '[0-9@#$%^&*()_+=<>/\\|{}\[\]~`!?؟]' or new.customer_name !~ '[[:alpha:]]{2}'
     or array_length(regexp_split_to_array(new.customer_name, ' '), 1) < 2 then
    raise exception 'ORDER:اكتب اسمك الحقيقي بالكامل (الاسم الأول والأخير، بدون أرقام أو رموز).';
  end if;
  -- الهاتف: موبايل مصري 11 رقم أو رقم دولي بـ +
  if not (ph ~ '^01[0125][0-9]{8}$' or ph ~ '^\+[1-9][0-9]{8,14}$') then
    raise exception 'ORDER:رقم الهاتف غير صحيح. مثال: 01012345678 أو +966501234567.';
  end if;
  if ph ~ '^(.)\1+$' or ph ~ '0123456789' then raise exception 'ORDER:رقم الهاتف غير صحيح.'; end if;
  -- العنوان لازم يكون له معنى
  if new.address !~ '[[:alpha:]]{3}' then raise exception 'ORDER:اكتب العنوان بالتفصيل.'; end if;

  -- ألفاظ سيئة
  txt := lower(replace(new.customer_name || ' ' || new.city || ' ' || new.address || ' ' || new.notes, 'ـ', ''));
  for w in select word from public.blocked_words loop
    if txt ~* ('(^|[^[:alpha:]])' || regexp_replace(lower(w.word), '([.*+?^${}()|\[\]\\])', '\\\1', 'g') || '([^[:alpha:]]|$)') then
      raise exception 'ORDER:البيانات تحتوي على ألفاظ غير مقبولة. اكتب بياناتك الحقيقية.';
    end if;
  end loop;

  -- حد الطلبات: 5 كل ساعة، وطلب جديد واحد مفتوح لنفس المنتج
  if (select count(*) from public.orders where user_id = auth.uid() and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'ORDER:وصلت للحد الأقصى من الطلبات حاليًا. حاول بعد قليل.';
  end if;
  if exists (select 1 from public.orders where user_id = auth.uid() and product_id = p.id and status = 'new') then
    raise exception 'ORDER:لديك طلب قيد المراجعة لنفس المنتج بالفعل.';
  end if;

  new.product_name := p.name;
  new.unit_price := p.price;
  new.total := case when p.price is null then null else p.price * new.quantity end;
  new.status := 'new';
  new.admin_note := '';
  new.user_id := auth.uid();
  new.user_email := coalesce(auth.jwt() ->> 'email', '');   -- بريد الحساب من التوكن، مش من المتصفح
  return new;
end $$;

drop trigger if exists orders_before_insert on public.orders;
create trigger orders_before_insert before insert on public.orders
  for each row execute function public.orders_before_insert();

-- الطلب للمسجّلين فقط، وبحسابهم هم
drop policy if exists "orders_insert_public" on public.orders;
drop policy if exists "orders_insert_members" on public.orders;
create policy "orders_insert_members" on public.orders for insert to authenticated
  with check (product_id is not null and user_id = auth.uid());
revoke insert on public.orders from anon;
grant insert on public.orders to authenticated;

notify pgrst, 'reload schema';
