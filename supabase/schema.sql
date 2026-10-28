-- মেলা (Mela) — Supabase schema, phase 2
-- Run once: Supabase dashboard → SQL Editor → New query → paste → Run.

-- ============ Tables ============
create table if not exists categories (
  id text primary key,
  name text not null,
  emoji text,
  color text,
  sort int not null default 0
);

create table if not exists products (
  id serial primary key,
  name text not null,
  category_id text references categories(id),
  price int not null check (price >= 0),
  emoji text,
  description text,
  stock int not null default 100,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create sequence if not exists order_seq;

create table if not exists orders (
  id text primary key,
  user_id uuid references auth.users(id),
  name text not null,
  phone text not null,
  address text not null,
  subtotal int not null,
  shipping int not null,
  total int not null,
  status text not null default 'pending'
    check (status in ('pending','shipped','delivered','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id bigserial primary key,
  order_id text not null references orders(id) on delete cascade,
  product_id int references products(id),
  name text not null,
  emoji text,
  unit_price int not null,
  qty int not null check (qty > 0)
);

-- shop owner accounts (single vendor)
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- ============ Helper ============
create or replace function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid())
$$;

-- ============ Row level security ============
alter table categories  enable row level security;
alter table products    enable row level security;
alter table orders      enable row level security;
alter table order_items enable row level security;
alter table admins      enable row level security;

-- anyone can browse the shop
create policy "categories read"  on categories for select using (true);
create policy "products read"    on products   for select using (active or is_admin());
-- only the owner can change the catalogue
create policy "categories admin" on categories for all using (is_admin()) with check (is_admin());
create policy "products admin"   on products   for all using (is_admin()) with check (is_admin());

-- customers see their own orders, the owner sees all; nobody inserts directly
create policy "orders read"   on orders for select using (user_id = auth.uid() or is_admin());
create policy "orders update" on orders for update using (is_admin()) with check (is_admin());
create policy "items read"    on order_items for select using (
  exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or is_admin()))
);
create policy "admins self"   on admins for select using (user_id = auth.uid());

-- ============ Place an order (prices are computed on the server) ============
create or replace function place_order(
  p_name text, p_phone text, p_address text, p_items jsonb
) returns json
language plpgsql security definer set search_path = public as $$
declare
  v_id text; v_sub int := 0; v_ship int; v_unit int; v_q int; v_gift boolean;
  it jsonb; pr record;
begin
  if length(trim(coalesce(p_name,''))) < 2
     or coalesce(p_phone,'') !~ '^01[3-9][0-9]{8}$'
     or length(trim(coalesce(p_address,''))) < 5 then
    raise exception 'invalid details';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'empty cart';
  end if;

  v_id := 'M' || lpad(nextval('order_seq')::text, 6, '0');
  insert into orders(id, user_id, name, phone, address, subtotal, shipping, total)
  values (v_id, auth.uid(), trim(p_name), p_phone, trim(p_address), 0, 0, 0);

  for it in select * from jsonb_array_elements(p_items) loop
    select * into pr from products where id = (it->>'id')::int and active;
    if not found then raise exception 'product not found'; end if;
    v_q := (it->>'qty')::int;
    if v_q < 1 or v_q > 20 then raise exception 'bad quantity'; end if;
    v_gift := coalesce((it->>'gift')::boolean, false);
    v_unit := pr.price + case when v_gift then 60 else 0 end;
    insert into order_items(order_id, product_id, name, emoji, unit_price, qty)
    values (v_id, pr.id, pr.name || case when v_gift then ' (উপহার প্যাক)' else '' end, pr.emoji, v_unit, v_q);
    v_sub := v_sub + v_unit * v_q;
  end loop;

  v_ship := case when v_sub < 2000 then 60 else 0 end;
  update orders set subtotal = v_sub, shipping = v_ship, total = v_sub + v_ship where id = v_id;
  return json_build_object('id', v_id, 'total', v_sub + v_ship);
end $$;

grant execute on function place_order(text, text, text, jsonb) to anon, authenticated;

-- ============ Starter data (same as the phase 1 shop) ============
insert into categories(id, name, emoji, color, sort) values
  ('cloth','শাড়ি ও পোশাক','🥻','#f28ba0',1),
  ('craft','হাতের কাজ','🏺','#e9a56b',2),
  ('food','খাবার','🍯','#9fd8a3',3),
  ('toy','খেলনা','🪁','#8ec5f2',4),
  ('home','ঘরকন্না','🪔','#c9a7ec',5)
on conflict (id) do nothing;

insert into products(id, name, category_id, price, emoji, description) values
  (1,'জামদানি শাড়ি','cloth',4800,'🥻','হাতে বোনা জামদানি, নকশাদার পাড়।'),
  (2,'নকশি কাঁথা','cloth',2200,'🧵','গ্রামের মায়েদের হাতে সেলাই করা কাঁথা।'),
  (3,'পাঞ্জাবি','cloth',1450,'👘','নরম সুতি কাপড়ের হালকা পাঞ্জাবি।'),
  (4,'মাটির পুতুল','craft',350,'🪆','কুমারপাড়ার হাতে গড়া রঙিন পুতুল।'),
  (5,'শীতলপাটি','craft',1800,'🧺','সিলেটের ঐতিহ্যবাহী শীতলপাটি, গরমে আরাম।'),
  (6,'বাঁশের ঝুড়ি','craft',420,'🧺','শক্ত বাঁশের বুননে তৈরি বহুমুখী ঝুড়ি।'),
  (7,'খাঁটি মধু','food',650,'🍯','সুন্দরবনের ফুলের মধু, ৫০০ গ্রাম।'),
  (8,'নলেন গুড়','food',380,'🟤','খেজুরের রসের সুগন্ধি গুড়, ১ কেজি।'),
  (9,'আচারের সেট','food',520,'🫙','আম, জলপাই ও চালতার তিন স্বাদের আচার।'),
  (10,'রঙিন ঘুড়ি','toy',120,'🪁','হালকা কাগজ ও বাঁশের কঞ্চির ঘুড়ি।'),
  (11,'কাঠের লাটিম','toy',150,'🪀','হাতে কাটা কাঠের লাটিম, সুতোসহ।'),
  (12,'মাটির প্রদীপ','home',180,'🪔','১২টি প্রদীপের এক সেট।'),
  (13,'পিতলের ঘটি','home',950,'🏺','খাঁটি পিতলের ঘটি, ঝকঝকে পালিশ।'),
  (14,'তালপাখা','home',90,'🪭','বিদ্যুৎ ছাড়াই বাতাস, গরমের বন্ধু।')
on conflict (id) do nothing;

select setval(pg_get_serial_sequence('products','id'), (select max(id) from products));
