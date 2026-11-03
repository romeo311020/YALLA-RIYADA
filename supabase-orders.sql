-- يلا رياضة — نظام الطلبات. شغّله مرة واحدة في Supabase > SQL Editor (آمن لو شغّلته أكتر من مرة).
-- يتطلب وجود الدالة is_admin() (من supabase-admin-upgrade.sql).

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no bigint generated always as identity,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null default '',
  unit_price numeric(10,2),
  quantity int not null default 1 check (quantity between 1 and 20),
  total numeric(12,2),
  customer_name text not null check (char_length(customer_name) between 2 and 100),
  phone text not null check (char_length(phone) between 7 and 20),
  city text not null default '' check (char_length(city) <= 80),
  address text not null check (char_length(address) between 5 and 300),
  notes text not null default '' check (char_length(notes) <= 500),
  status text not null default 'new' check (status in ('new','confirmed','shipped','delivered','cancelled')),
  admin_note text not null default '',
  user_id uuid,
  created_at timestamptz not null default now()
);

-- السعر واسم المنتج يتحددوا من السيرفر (مش من المتصفح) ولا يمكن طلب منتج مخفي
create or replace function public.orders_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record;
begin
  select id, name, price into p from public.products where id = new.product_id and is_published = true;
  if not found then raise exception 'المنتج غير متاح'; end if;
  new.product_name := p.name;
  new.unit_price := p.price;
  new.total := case when p.price is null then null else p.price * new.quantity end;
  new.status := 'new';
  new.admin_note := '';
  new.user_id := auth.uid();
  new.customer_name := btrim(new.customer_name);
  new.phone := btrim(new.phone);
  return new;
end $$;
drop trigger if exists orders_before_insert on public.orders;
create trigger orders_before_insert before insert on public.orders
  for each row execute function public.orders_before_insert();

alter table public.orders enable row level security;
drop policy if exists "orders_insert_public" on public.orders;
create policy "orders_insert_public" on public.orders for insert to anon, authenticated
  with check (product_id is not null);
drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all" on public.orders for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant insert on public.orders to anon, authenticated;
grant select, update, delete on public.orders to authenticated;

notify pgrst, 'reload schema';
