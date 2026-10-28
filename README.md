# মেলা (Mela)
Single-vendor e-commerce website. Static pages (no build step) with a Supabase database behind them. Host on GitHub Pages or open `index.html`.

## Pages
- `index.html` — home: 3D stall carousel, animated search, product morph, cart drawer, wishlist hearts
- `shop.html` — all products with category chips, search, sort and price filter
- `product.html?id=N` — product detail: variants, quantity, add to cart, buy now, related products
- `wishlist.html` — saved products
- `cart.html` — cart review + delivery form (cash on delivery); the order is saved in Supabase
- `order-placed.html` — order confirmation
- `account.html` — saved customer details and order history (this browser)

## Shared files
- `mela.js` — catalogue loading, Supabase calls, cart, wishlist, orders, header and card helpers (global `Mela`)
- `mela.css` — styles for every page except `index.html`, which keeps its own inline styles
- `supabase/schema.sql` — tables, access rules, `place_order` function and starter data (already applied to the project)

## How data flows
- Products and categories are read from Supabase. A built-in copy in `mela.js` shows first, and the last downloaded copy is cached in the browser.
- Checkout calls the `place_order` database function. It recomputes every price on the server, so prices sent from the browser are ignored.
- Cart, wishlist and saved details stay in the browser's localStorage: `mela_cart`, `mela_wish`, `mela_order`, `mela_orders`, `mela_user`, `mela_catalog`.
- The Supabase URL and publishable key in `mela.js` are public by design. Access is limited by the row level security rules in `schema.sql`. Never put a `service_role` or secret key in this repo.

## Next
Real customer login, then an admin panel for the shop owner (products, orders, status).
