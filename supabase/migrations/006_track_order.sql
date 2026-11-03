-- 006: customers can check an order's status with the order number + the phone number used on it.
-- Works for orders placed without login too (this closes the X7 gap in Doc/10.admin.md).
-- Returns only status, items, totals and the status timeline: never the name, address or phone.
-- Applied to the project on 2026-11-03 as mela_006_track_order.

create or replace function track_order(p_id text, p_phone text) returns json
language plpgsql security definer stable set search_path = public as $$
declare
  o record; v_items json; v_events json;
begin
  select id, status, total, shipping, created_at into o
  from orders
  where id = upper(trim(coalesce(p_id, ''))) and phone = trim(coalesce(p_phone, ''));
  if not found then return null; end if;

  select coalesce(json_agg(json_build_object('name', name, 'emoji', emoji, 'qty', qty) order by id), '[]'::json)
    into v_items from order_items where order_id = o.id;
  select coalesce(json_agg(json_build_object('status', to_status, 'at', created_at) order by created_at, id), '[]'::json)
    into v_events from order_events where order_id = o.id;

  return json_build_object('id', o.id, 'status', o.status, 'total', o.total, 'shipping', o.shipping,
                           'created_at', o.created_at, 'items', v_items, 'events', v_events);
end $$;

revoke execute on function track_order(text, text) from public;
grant execute on function track_order(text, text) to anon, authenticated;

-- rollback:
-- drop function if exists track_order(text, text);
