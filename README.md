# iquee storefront

Headless storefront for [store.iquee.tech](https://store.iquee.tech). WooCommerce stays on [woo.iquee.tech](https://woo.iquee.tech). The browser never calls `/wp-json/wc/v3`.

The UI runs on local fixtures until `WC_BASE_URL`, `WC_CONSUMER_KEY`, and `WC_CONSUMER_SECRET` are set. Checkout is not production-ready. Without those Woo credentials it stays an explicit demo and never marks an order confirmed.

## Stack

- Next.js 15 App Router, React 19, TypeScript strict
- Tailwind CSS 4 with the CSS variables in `app/globals.css`
- Zustand cart, shaped to sync with Woo Store API `wc/store/v1`
- BFF route handlers under `/api/*`
- Vitest unit tests and a Playwright smoke spec

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm run typecheck
npm run test
npm run lint
npm run test:e2e   # requires Playwright browsers: npx playwright install chromium
```

`npm run images` regenerates the editorial PNGs in `public/products`.

Demo card that passes format checks and is not charged: `4242 4242 4242 4242`, any future `MM / YY`, any 3-digit CVC.

## Environment

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public | Storefront origin. Default `https://store.iquee.tech`. |
| `WC_BASE_URL` | Server | WooCommerce origin. Default `https://woo.iquee.tech`. |
| `WC_CONSUMER_KEY` | Server | WooCommerce REST consumer key. |
| `WC_CONSUMER_SECRET` | Server | WooCommerce REST consumer secret. |
| `WC_WEBHOOK_SECRET` | Server | HMAC secret for `/api/webhooks/woocommerce`. |
| `STRIPE_SECRET_KEY` | Server | Creates a PaymentIntent at checkout when present. |
| `STRIPE_WEBHOOK_SECRET` | Server | Verifies `/api/webhooks/stripe`. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public | Stripe.js. Required with the secret key before a card can be confirmed. Express Pay stays disabled until wallets are wired. |
| `CHECKOUT_DEMO` | Server | Set to `true` to force a no-charge preview even when Woo and Stripe are configured. Demo orders stay `demo` and are never confirmed. |

Copy `.env.example` to `.env.local`. Do not prefix the WooCommerce secrets or Stripe secret with `NEXT_PUBLIC_`.

## Hosts and CORS

| Host | Role |
| --- | --- |
| `https://store.iquee.tech` | This Next.js app. Browser calls are same-origin `/api/*`. |
| `https://woo.iquee.tech` | WooCommerce. Reached only from the server. |

`/api/*` responses allow the storefront origin from `NEXT_PUBLIC_SITE_URL` (`Access-Control-Allow-Origin`, credentials, `Cart-Token`). They do not use `*`.

WooCommerce does not need a browser CORS allowlist for the current MVP, because `wc/v3` and `wc/store/v1` are called on the server. If a later change calls the Store API from the browser, allow origin `https://store.iquee.tech` on `woo.iquee.tech`.

Webhook endpoints to register:

- `https://store.iquee.tech/api/webhooks/woocommerce`
- `https://store.iquee.tech/api/webhooks/stripe`

Product images from Woo are allowed when they are served from `WC_BASE_URL` under `/wp-content/uploads/`.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Hero, eight featured products, category row, trust strip |
| `/products` | Catalog with category, price, and stock filters, chips, and sort |
| `/products/[slug]` | Gallery, variants, quantity, sticky mobile add-to-cart, details tabs |
| `/search` | Search. Empty state until a query is entered |
| `/checkout` | One page: express pay, contact, shipping, payment, sticky summary |
| `/checkout/confirmation` | Order confirmation for this browser |
| `/account/login` | Sign-in stub |
| `/account/register` | Register stub |
| `/account/orders` | Sample order history |
| Unmatched URL | 404 |

Loading skeletons, empty cart, empty search, out of stock, inline form errors, and an error boundary are included. The cart drawer is in the store layout.

## Architecture

```
app/(store)          header, footer, cart drawer
app/api/*            BFF. Browser entry for catalog, cart, checkout, account, webhooks
lib/woo/rest.ts      server-only wc/v3 client
lib/woo/store-api.ts server-only wc/store/v1 client
lib/fixtures         catalog and sample orders used when Woo is not configured
store/cart.ts        Zustand cart (local, persisted)
```

When WooCommerce credentials are set, catalog routes try REST and fall back to fixtures if the request fails. Cart UI state stays in Zustand. `GET/POST /api/cart` is the sync point: send `Cart-Token` and it proxies `wc/store/v1` when `WC_BASE_URL` is set.

Checkout reprices and merges lines on the server, caps each line at 99 (unknown stock is not unlimited), and refuses another site's `Origin`. Requests need an `Idempotency-Key` and are rate limited per process. Card numbers are not posted to this app.

Orders go through `ordersStoreFor()`. The memory store is not durable. When `WC_*` is set and both Stripe keys are set, checkout creates a pending WooCommerce order (`wc/v3`, `set_paid: false`) before the PaymentIntent. The cart is cleared only after `GET /api/orders/:id` returns `confirmed`, which happens when the signed Stripe webhook matches the stored total. A Stripe status of `processing` or `redirect_status=succeeded` does not clear the cart.

Without Woo credentials, or with `CHECKOUT_DEMO=true`, the API returns a `demo` order in process memory. That is not a stored paid order. The confirmation page says no charge was made.

`GET /api/orders/:id` requires the checkout session's `X-Confirmation-Token` and returns items and totals only, not email or address.

## What to wire next

1. Set the WooCommerce and Stripe variables in the host environment for `store.iquee.tech`.
2. Confirm `GET /api/products` returns `source: "woocommerce"`.
3. Persist Store API `Cart-Token` from `/api/cart` into the Zustand cart.
4. Point the webhook at this server so a Woo pending order can be marked paid. The in-memory cache is still not durable on its own.
5. Replace the account stub with WooCommerce customers. Order history should read `wc/v3` orders for the signed-in customer.
6. Currency is USD until the BFF reads the WooCommerce currency setting.
