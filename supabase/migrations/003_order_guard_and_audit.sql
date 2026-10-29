-- 003: order status rules, locked order data, audit trail (applied to the project as mela_003_order_guard_and_audit)
create table if not exists order_events (
  id bigserial primary key,
  order_id text not null references orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists order_events_order_id_idx on order_events(order_id);
alter table order_events enable row level security;
create policy "events admin read" on order_events for select using (is_admin());

create or replace function guard_order_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- place_order fills in the totals right after creating the row (they start at 0)
  if old.total = 0 and old.subtotal = 0 then
    return new;
  end if;
  if new.id is distinct from old.id or new.user_id is distinct from old.user_id
     or new.name is distinct from old.name or new.phone is distinct from old.phone
     or new.address is distinct from old.address or new.subtotal is distinct from old.subtotal
     or new.shipping is distinct from old.shipping or new.total is distinct from old.total
     or new.created_at is distinct from old.created_at then
    raise exception 'only status can change';
  end if;
  if new.status is distinct from old.status then
    if not ((old.status = 'pending' and new.status in ('shipped','cancelled'))
         or (old.status = 'shipped' and new.status in ('delivered','cancelled'))) then
      raise exception 'invalid status change';
    end if;
    insert into order_events(order_id, from_status, to_status, changed_by)
    values (old.id, old.status, new.status, auth.uid());
  end if;
  return new;
end $$;

revoke execute on function guard_order_update() from public, anon, authenticated;

create trigger orders_guard before update on orders
for each row execute function guard_order_update();

-- rollback:
-- drop trigger if exists orders_guard on orders;
-- drop function if exists guard_order_update();
-- drop table if exists order_events;
