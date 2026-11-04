-- 007: product pictures. The picture lives on Cloudinary; the shop keeps only its https address.
-- The check below only allows Cloudinary upload addresses, so nothing else can be stored there.
-- Applied to the project on 2026-11-03 as mela_007_product_image.

alter table products add column if not exists image_url text;
alter table products drop constraint if exists products_image_url_check;
alter table products add constraint products_image_url_check
  check (image_url is null or image_url ~ '^https://res\.cloudinary\.com/[A-Za-z0-9_-]+/image/upload/[^ <>"'']+$');

-- rollback:
-- alter table products drop constraint if exists products_image_url_check;
-- alter table products drop column if exists image_url;
