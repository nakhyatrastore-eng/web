# Nakhyatra Store

Headless storefront: **Next.js (Vercel)** frontend + **Shopify** backend (products, orders, checkout) + **Razorpay** (payments, configured inside Shopify — zero custom payment code in this app).

Right now this runs entirely on mock data (`lib/mock-data.ts`) so you can preview design and flow before Shopify exists. Once you connect real credentials, everything switches over automatically — no code changes needed.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll see the two mock collections (Poster Wall, Phone Cases) fully browsable, add-to-cart working, cart drawer working. Checkout will show an error until Shopify is connected (expected).

## Step 1 — Create the Shopify store

1. shopify.com → Start free trial → pick a plan (Basic is enough; you do **not** need Plus for this setup)
2. Settings > General — set store name, currency (INR)
3. Products — add your steel posters and phone cases. For phone cases, use **Variants** (option name "Model": iPhone 15, iPhone 15 Pro, etc.) — this maps directly to the variant picker already built into this app
4. Products > Collections — create two collections with these exact handles so the code matches:
   - `poster-wall`
   - `phone-cases`
   (Set the handle under the collection's "Search engine listing" section if Shopify doesn't auto-match it.)

## Step 2 — Enable Razorpay

1. Shopify admin > Settings > Payments
2. Browse third-party providers > find Razorpay ("Razorpay Secure" app) > install
3. Enter your Razorpay Merchant ID / API key / secret (from razorpay.com dashboard, after KYC)
4. Test in sandbox mode first, then switch live

This is entirely inside Shopify — nothing to build here.

## Step 3 — Get Storefront API credentials

1. Shopify admin > Settings > Apps and sales channels > Develop apps > Create an app
2. Configure Storefront API scopes: `unauthenticated_read_product_listings`, `unauthenticated_read_product_inventory`, `unauthenticated_read_checkouts`, `unauthenticated_write_checkouts`
3. Install the app > reveal the **Storefront API access token**
4. Copy `.env.example` to `.env.local` and fill in:
   ```
   SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
   SHOPIFY_STOREFRONT_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

## Step 3.5 — Enable custom design uploads (phone cases & posters)

Customers can upload their own photo, see it live in a case/poster mockup on the product page, then add to cart. No positioning/cropping yet (phase 2) — the photo auto-fits.

1. uploadthing.com → sign up → create an app
2. Copy the token from the API Keys page into `.env.local`:
   ```
   UPLOADTHING_TOKEN=your_token_here
   ```
3. That's it — `app/api/uploadthing/` already has the upload endpoint wired up

**How the uploaded image reaches you:** it's attached to the Shopify cart line as a custom "Custom Design" property. When the order comes in, open it in Shopify admin — the image URL is right there on the order, no separate dashboard needed. (This is also where your n8n automation could hook in later, if you want it auto-forwarded to a printer.)

**What's customizable right now:** any product with `productType` set to `Phone Case` or `Poster` in Shopify automatically gets the upload + mockup UI on its product page — nothing to configure per-product.

## Step 4 — Deploy to Vercel

1. Push this project to a GitHub repo
2. vercel.com > Add New Project > import the repo
3. Add the two env vars from `.env.local` in Vercel's Project Settings > Environment Variables
4. Deploy

## Step 5 — Point nakhyatra.store at Vercel

1. Vercel > Project > Settings > Domains > add `nakhyatra.store`
2. Vercel shows you the DNS records to add (A record or CNAME depending on your registrar)
3. Update those records wherever nakhyatra.store is currently registered
4. Shopify's own domain/checkout stays on `your-store.myshopify.com` under the hood — customers only ever see `nakhyatra.store` except for the ~10 seconds on the checkout page itself, unless you set up a custom checkout domain (possible later, not required to launch)

## Managing the store day-to-day

Once live, you do NOT touch this code for regular operations. Use the **Shopify app** (iPhone/Android) for:
- adding/editing products, prices, photos
- tracking orders, fulfillment, refunds
- inventory counts
- viewing sales analytics

You only touch this Next.js project when you want to change the site's design/layout, or add new page types.

## Project structure

```
app/
  page.tsx                    → homepage
  collections/[handle]/       → catalog pages (poster-wall, phone-cases)
  products/[handle]/          → product detail pages
  layout.tsx, globals.css     → design system (fonts, colors, tokens)
components/                   → Header, Footer, ProductCard, CartDrawer, ProductDetail
lib/
  shopify.ts                  → Storefront API client + checkout handoff
  mock-data.ts                → fallback data (remove once Shopify is live)
  cart-context.tsx            → client-side cart state
```
