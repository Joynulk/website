-- 005: Telegram message to the owner when a new order is complete (applied to the project as mela_005_telegram_new_order_notification)
-- The bot token and chat id are NOT in this file or in the repo: the owner stores them in Supabase Vault (see Doc/12.notifications.md).
create extension if not exists pg_net with schema extensions;

-- the message the owner receives: order number, items, total (no name, phone or address)
create or replace function build_order_message(p_id text) returns text
language plpgsql security definer set search_path = public as $$
declare o record; items text;
begin
  select id, total into o from orders where id = p_id;
  if not found then return null; end if;
  select string_agg('• ' || name || ' × ' || qty, E'\n' order by id) into items
  from order_items where order_id = p_id;
  return '🛒 নতুন অর্ডার ' || o.id || E'\n' || coalesce(items, '') ||
         E'\nমোট: ৳' || o.total || ' (ক্যাশ অন ডেলিভারি)' ||
         E'\nনাম, ফোন ও ঠিকানা দেখতে admin panel খুলুন।';
end $$;

-- sends the message through Telegram; a failure here never fails the order
create or replace function notify_new_order() returns trigger
language plpgsql security definer set search_path = public as $$
declare tok text; chat text; msg text;
begin
  begin
    select decrypted_secret into tok from vault.decrypted_secrets where name = 'telegram_bot_token';
    select decrypted_secret into chat from vault.decrypted_secrets where name = 'telegram_chat_id';
    if tok is not null and chat is not null then
      msg := build_order_message(new.id);
      perform net.http_post(
        url := 'https://api.telegram.org/bot' || tok || '/sendMessage',
        body := jsonb_build_object('chat_id', chat, 'text', msg),
        headers := '{"Content-Type":"application/json"}'::jsonb
      );
    end if;
  exception when others then
    null;
  end;
  return null;
end $$;

-- run by the owner in the SQL Editor to check the Telegram setup
create or replace function send_test_telegram() returns text
language plpgsql security definer set search_path = public as $$
declare tok text; chat text;
begin
  select decrypted_secret into tok from vault.decrypted_secrets where name = 'telegram_bot_token';
  select decrypted_secret into chat from vault.decrypted_secrets where name = 'telegram_chat_id';
  if tok is null or chat is null then
    return 'secrets missing: add telegram_bot_token and telegram_chat_id to Vault first';
  end if;
  perform net.http_post(
    url := 'https://api.telegram.org/bot' || tok || '/sendMessage',
    body := jsonb_build_object('chat_id', chat, 'text', '✅ মেলা: টেস্ট বার্তা। নতুন অর্ডার এলে এখানে জানানো হবে।'),
    headers := '{"Content-Type":"application/json"}'::jsonb
  );
  return 'request queued: check Telegram, then select status_code, content from net._http_response order by id desc limit 1';
end $$;

revoke execute on function build_order_message(text) from public, anon, authenticated;
revoke execute on function notify_new_order() from public, anon, authenticated;
revoke execute on function send_test_telegram() from public, anon, authenticated;

drop trigger if exists orders_notify on orders;
create trigger orders_notify after update on orders
for each row when (old.total = 0 and new.total > 0)
execute function notify_new_order();

-- rollback:
-- drop trigger if exists orders_notify on orders;
-- drop function if exists notify_new_order();
-- drop function if exists build_order_message(text);
-- drop function if exists send_test_telegram();
