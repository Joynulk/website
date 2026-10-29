-- 004: stock check and take, duplicate-order key, spam limit (applied to the project as mela_004_stock_idempotency_spam)
alter table orders add column if not exists idempotency_key text;
create unique index if not exists orders_idempotency_key_idx on orders(idempotency_key) where idempotency_key is not null;
create index if not exists orders_phone_created_idx on orders(phone, created_at desc);

drop function if exists place_order(text, text, text, jsonb);

create or replace function place_order(
  p_name text, p_phone text, p_address text, p_items jsonb, p_key text default null
) returns json
language plpgsql security definer set search_path = public as $$
declare
  v_id text; v_sub int := 0; v_ship int; v_unit int; v_q int; v_gift boolean;
  it jsonb; pr record; ex record;
begin
  if p_key is not null and p_key !~ '^[A-Za-z0-9-]{8,64}$' then
    raise exception 'invalid details';
  end if;
  -- the same checkout sent twice returns the first order instead of creating another
  if p_key is not null then
    select id, total into ex from orders where idempotency_key = p_key;
    if found then
      return json_build_object('id', ex.id, 'total', ex.total, 'duplicate', true);
    end if;
  end if;
  if length(trim(coalesce(p_name,''))) < 2
     or coalesce(p_phone,'') !~ '^01[3-9][0-9]{8}$'
     or length(trim(coalesce(p_address,''))) < 5 then
    raise exception 'invalid details';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'empty cart';
  end if;
  -- spam limit: at most 3 orders per phone number per hour
  if (select count(*) from orders where phone = p_phone and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'too many orders';
  end if;

  v_id := 'M' || lpad(nextval('order_seq')::text, 6, '0');
  begin
    insert into orders(id, user_id, name, phone, address, subtotal, shipping, total, idempotency_key)
    values (v_id, auth.uid(), trim(p_name), p_phone, trim(p_address), 0, 0, 0, p_key);
  exception when unique_violation then
    select id, total into ex from orders where idempotency_key = p_key;
    if found then
      return json_build_object('id', ex.id, 'total', ex.total, 'duplicate', true);
    end if;
    raise;
  end;

  for it in select * from jsonb_array_elements(p_items) loop
    select * into pr from products where id = (it->>'id')::int and active;
    if not found then raise exception 'product not found'; end if;
    v_q := (it->>'qty')::int;
    if v_q < 1 or v_q > 20 then raise exception 'bad quantity'; end if;
    -- take stock in one atomic step; if there is not enough the whole order fails
    update products set stock = stock - v_q where id = pr.id and stock >= v_q;
    if not found then raise exception 'out of stock: %', pr.name; end if;
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

grant execute on function place_order(text, text, text, jsonb, text) to anon, authenticated;

-- cancelling an order puts its items back into stock
create or replace function guard_order_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.total = 0 and old.subtotal = 0 then
    return new;
  end if;
  if new.id is distinct from old.id or new.user_id is distinct from old.user_id
     or new.name is distinct from old.name or new.phone is distinct from old.phone
     or new.address is distinct from old.address or new.subtotal is distinct from old.subtotal
     or new.shipping is distinct from old.shipping or new.total is distinct from old.total
     or new.created_at is distinct from old.created_at
     or new.idempotency_key is distinct from old.idempotency_key then
    raise exception 'only status can change';
  end if;
  if new.status is distinct from old.status then
    if not ((old.status = 'pending' and new.status in ('shipped','cancelled'))
         or (old.status = 'shipped' and new.status in ('delivered','cancelled'))) then
      raise exception 'invalid status change';
    end if;
    if new.status = 'cancelled' then
      update products p set stock = p.stock + i.q
      from (select product_id, sum(qty) as q from order_items
            where order_id = old.id and product_id is not null group by product_id) i
      where p.id = i.product_id;
    end if;
    insert into order_events(order_id, from_status, to_status, changed_by)
    values (old.id, old.status, new.status, auth.uid());
  end if;
  return new;
end $$;

-- rollback (restores migration 003 behaviour): re-create the 4-argument place_order from schema.sql,
-- drop function place_order(text, text, text, jsonb, text); then drop index orders_idempotency_key_idx,
-- orders_phone_created_idx and column orders.idempotency_key, and re-apply guard_order_update from 003.
