# মেলা (Mela)
Single-vendor e-commerce website. Static pages (no build step) with a Supabase database behind them. Host on GitHub Pages or open `index.html`.

## Pages
- `index.html` — home: 3D stall carousel, animated search, product morph, cart drawer, wishlist hearts
- `shop.html` — all products with category chips, search, sort and price filter
- `product.html?id=N` — product detail: variants, quantity, add to cart, buy now, related products
- `wishlist.html` — saved products
- `cart.html` — cart review + delivery form (cash on delivery); the order is saved in Supabase
- `order-placed.html` — order confirmation
- `account.html` — customer login (email + password), password reset, saved delivery details, order history
- `admin.html` — shop owner panel: orders and their status, products and stock, categories (only accounts listed in the `admins` table get in)

## Shared files
- `mela.js` — catalogue loading, Supabase calls, customer login, cart, wishlist, orders, header and card helpers (global `Mela`)
- `mela.css` — styles for every page except `index.html`, which keeps its own inline styles
- `supabase/schema.sql` — tables, access rules, `place_order` function and starter data (already applied to the project)
- `supabase/migrations/` — later database changes, one file each (already applied)

## How data flows
- Products and categories are read from Supabase. A built-in copy in `mela.js` shows first, and the last downloaded copy is cached in the browser.
- Checkout calls the `place_order` database function. It recomputes every price on the server, takes the stock, and refuses sold-out products. The same checkout sent twice creates one order, and one phone number can place at most 3 orders per hour. Logged-in customers' orders are linked to their account; ordering without login still works.
- After an order is created only its status can change, and only along allowed steps (pending -> shipped -> delivered, or cancelled); each change is logged in `order_events`, and cancelling puts the items back into stock.
- Cart and wishlist stay in the browser's localStorage: `mela_cart`, `mela_wish`, `mela_order`, `mela_orders`, `mela_user`, `mela_catalog`, `mela_order_key`, and `mela_session` while logged in.
- The Supabase URL and publishable key in `mela.js` are public by design. Access is limited by the row level security rules in `schema.sql`. Never put a `service_role` or secret key in this repo.

## Docs (`Doc/`)
1. [`1.plan.md`](Doc/1.plan.md) — goals, decisions, status, phases, what is skipped
2. [`2.architecture.md`](Doc/2.architecture.md) — structure, modules, data flow, limits
3. [`3.business-rules.md`](Doc/3.business-rules.md) — fixed rules, proposed defaults, open decisions, order statuses
4. [`4.database.md`](Doc/4.database.md) — tables, access rules, functions, known gaps
5. [`5.api.md`](Doc/5.api.md) — Supabase calls and error shapes
6. [`6.security.md`](Doc/6.security.md) — security checklist and status
7. [`7.testing.md`](Doc/7.testing.md) — test plan
8. [`8.deployment.md`](Doc/8.deployment.md) — environments, changes, rollback, backups, go-live checklist
9. [`9.auth.md`](Doc/9.auth.md) — customer login design, Supabase settings to change, login tests
10. [`10.admin.md`](Doc/10.admin.md) — admin panel, first admin, order status rules, tests and results
11. [`11.orders-safety.md`](Doc/11.orders-safety.md) — stock, duplicate-order protection, spam limit, tests
- [`Boundary.md`](Doc/Boundary.md) — known limits to fix before launch

## Next
Show guest customers the real status of their orders; then phase F (payments, notifications) and the launch checklist.
