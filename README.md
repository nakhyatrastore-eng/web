# Nakhyatra storefront

Production headless Shopify storefront for Nakhyatra’s curated phone cases and metal wall posters, fulfilled with production partners.

`nakhyatra.store` is the public, indexable Next.js storefront on Vercel. `checkout.nakhyatra.store` is reserved for Shopify-hosted checkout and customer accounts.

## Architecture

```text
Customer
  → nakhyatra.store (Next.js 16 on Vercel)
      → Shopify Storefront API (catalogue, variants, inventory state, cart)
      → UploadThing (custom artwork only)
  → checkout.nakhyatra.store (Shopify checkout and customer account)
```

The browser never receives the Shopify Storefront token. A Shopify cart ID is stored in an HTTP-only, same-site cookie; cart totals and variant availability are refreshed from Shopify rather than trusted from browser storage. The storefront does not require Shopify's optional aggregate-inventory Storefront scope.

## Local setup

Use Node.js 20.9 or newer.

1. Copy `.env.example` to `.env.local`.
2. Add a Storefront API token with unauthenticated product, collection, and cart access.
3. Add the UploadThing token if the custom-artwork studio is enabled.
4. Install and run:

```bash
npm install
npm run dev
```

Required production checks:

```bash
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

## Shopify catalogue setup

### Collections

Create and publish these collections to the **Headless** sales channel:

- `phone-cases`
- `poster-wall`

Theme pages do not require duplicate products. Set the pinned `custom.theme` product metafield or add a tag such as `theme:cyberpunk`. Supported theme routes are cyberpunk, JDM, samurai, anime, space, dark minimal, and abstract.

### Phone cases

Use one Shopify product per artwork. Make the exact phone model a product option (for example `Phone model` or `Device`), with each supported model represented by a real purchasable variant. The storefront derives its family and searchable model picker from those variants; it never hardcodes availability.

Shopify Bundles can link each design/model variant to an internal blank-shell component so inventory is shared across artworks. Keep the blank component unpublished and publish only sellable design products.

### Posters

Use real Shopify variants for size and finish. Add the products to `poster-wall`. The `/bundle` route lets customers select three available products and adds them to one Shopify cart.

If “buy two, get one” is active, configure it as an automatic Shopify discount. The storefront intentionally does not fake discounted totals.

### Custom products

Create and publish:

- `custom-metal-phone-case`
- `custom-metal-poster`

The handles can be changed through `SHOPIFY_CUSTOM_CASE_HANDLE` and `SHOPIFY_CUSTOM_POSTER_HANDLE`. Add every supported model, size, and price as a real variant. The custom studio uploads the customer file and attaches the file URL, filename, crop values, and optional note to the Shopify cart line.

### Optional product data

- `reviews.rating` and `reviews.rating_count`: standardized rating metafields written by a review provider and exposed to Storefront API.
- `custom.theme`: a pinned single-line theme value with Storefront read access.
- `custom.pairs_with`: a pinned list of product references for case ↔ poster cross-selling. A `pairs:other-handle` tag also works.
- `new`, `new-drop`, `bestseller`, or `best-seller` tags enable honest product badges.

Ratings, review counts, low-stock badges, compare-at discounts, and sale percentages render only when real Shopify data supports them.

## Checkout domain and SEO

Keep the domain roles separate:

- `nakhyatra.store`: Vercel, canonical storefront, robots file, and sitemap.
- `checkout.nakhyatra.store`: Shopify checkout and account only.

The app never rewrites Shopify’s signed `checkoutUrl`; it verifies the returned hostname against `SHOPIFY_CHECKOUT_DOMAIN` and then hands the browser to Shopify. Every headless product and collection page emits a `nakhyatra.store` canonical URL, and `/sitemap.xml` contains only headless URLs.

The current Shopify-hosted catalogue routes on `checkout.nakhyatra.store` already return `noindex` and canonicalize to `nakhyatra.store`. In Google Search Console, submit only `https://nakhyatra.store/sitemap.xml`; do not submit Shopify’s checkout-subdomain sitemap. Product-feed apps must use the matching headless product URL rather than the Shopify theme URL.

## Payments, accounts, reviews, and tracking

- Enable UPI, cards, wallets, COD, or partial COD in Shopify/payment-provider settings. The storefront does not claim a method is available until Shopify shows it at checkout.
- Set `NEXT_PUBLIC_SHOPIFY_ACCOUNT_URL` to the active Shopify customer-account URL.
- Connect a headless-compatible review provider that writes the standardized review metafields before expecting stars or individual reviews.
- `/track` uses authenticated Shopify accounts and order-status links. A public order-number/phone lookup should only be added through a vetted tracking provider; the storefront will not expose Admin API order data.

## Deployment

The repository is linked locally to the Vercel project named `web`. Add every variable from `.env.example` to Vercel Production and Preview, using separate tokens where appropriate, then deploy. After deployment:

1. Confirm the Shopify Headless channel publishes the intended products and collections.
2. Add one real item to cart, reload, change quantity, and open checkout.
3. Confirm the checkout host is `checkout.nakhyatra.store`.
4. Submit `https://nakhyatra.store/sitemap.xml` in Search Console.
5. Revoke and remove any unused Shopify Admin/private token; this storefront does not use one.
