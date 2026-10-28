-- 002: indexes for order history and catalogue queries (applied to the project as mela_002_order_indexes)
create index if not exists orders_user_id_idx on orders(user_id);
create index if not exists orders_created_at_idx on orders(created_at desc);
create index if not exists order_items_order_id_idx on order_items(order_id);
create index if not exists products_category_id_idx on products(category_id);

-- rollback:
-- drop index if exists orders_user_id_idx, orders_created_at_idx, order_items_order_id_idx, products_category_id_idx;
