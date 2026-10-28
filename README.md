# মেলা (Mela)
Static single-vendor e-commerce website. No build step: open `index.html` or host on GitHub Pages.

## Pages
- `index.html` — home: 3D stall carousel, animated search, product morph, cart drawer, wishlist hearts
- `shop.html` — all products with category chips, search, sort and price filter
- `product.html?id=N` — product detail: variants, quantity, add to cart, buy now, related products
- `wishlist.html` — saved products
- `cart.html` — cart review + delivery form (cash on delivery)
- `order-placed.html` — order confirmation
- `account.html` — saved customer details and order history

## Shared files
- `mela.js` — product and category data, cart, wishlist, orders, header and card helpers (global `Mela`)
- `mela.css` — styles for every page except `index.html`, which keeps its own inline styles

## Data
Everything lives in the browser's localStorage (no backend yet): `mela_cart`, `mela_wish`, `mela_order`, `mela_orders`, `mela_user`.
To add or change a product, edit the `P` list in `mela.js`.

## Next
Phase 2: database, real login, and an admin panel for the shop owner.
