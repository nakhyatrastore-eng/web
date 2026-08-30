# Nakhyatra homepage UX implementation plan

## Outcome

Create a mobile-first storefront that helps a shopper answer three questions quickly:

1. What does Nakhyatra sell?
2. Is there a design for my phone and taste?
3. Can I buy the correct fit without making a mistake?

The homepage should behave like a guided shop, not a visual demo. Desktop should expand the same information hierarchy rather than introduce a different experience.

## Reference study: what to borrow from Kreo

Kreo's live homepage uses a four-page hero slideshow, followed immediately by prominent links to its primary shopping categories: Keyboards, Gaming Mouse, Ergonomic WFH Chairs, Audio & Video Devices, and All Products. Below that, it repeats the taxonomy as category-specific product rails such as Gaming Keyboards, Gaming Mouse, Audio and Video, and Gaming Controllers.

The useful pattern is:

- a campaign-led hero that establishes energy and promotes one offer at a time;
- persistent, obvious controls and an explicit pause/play affordance;
- category choices before a shopper reaches a long catalogue;
- product rails grouped by shopping intent;
- direct commerce actions on cards;
- mobile scanning first, with horizontal rails instead of compressed desktop grids.

Do not copy Kreo's density, taxonomy, or aggressive sale language. Nakhyatra has fewer product families and a stronger design-led identity. Its key conversion risk is incorrect phone-model selection, not product-spec comparison.

## Current Nakhyatra audit

### Strengths to preserve

- Distinctive black, orange, and editorial visual language.
- Large product imagery that makes the artwork the focal point.
- Real Shopify variant, inventory, price, discount, and checkout data.
- Existing saved-device flow and exact-model validation.
- Search, quick add, cart drawer, mobile navigation, collection SEO, and checkout handoff already exist.
- Product cards already avoid invented ratings, urgency, and discounts.

### Problems to solve

- The current `app/page.tsx` renders a calm heading plus a flat product grid. It does not use the existing `DropHero`, `DropRail`, `ThemeRail`, or `TabbedProductRail` components.
- The repository includes screenshots of an earlier high-impact slider, but the latest commit says it reverted the homepage slider and collection rail. Those screenshots are not reliable documentation of the current route.
- End-to-end tests still expect the reverted hero, carousel, compact rail, `01 / 05`, and `Swipe the drop` copy. The implementation and tests are out of sync.
- Mobile screenshots show oversized type and cards being cropped at the right edge. That can signal horizontal interaction, but important text, prices, and controls must never appear accidentally clipped.
- The fixed mobile bar competes with homepage carousel controls and covers content unless every page reserves safe bottom space.
- Category discovery is split between the header, mobile bottom bar, and optional theme rail. The homepage itself does not currently provide a clear two-level taxonomy.
- The announcement marquee, sticky header, hero motion, carousel motion, and fixed bottom navigation can create too much simultaneous movement.
- `globals.css` contains several generations of homepage/immersive styles. Shipping another concept without removing unused paths will increase regression risk.

## Recommended information architecture

### Mobile order

1. Announcement bar: one short operational promise, not several rotating claims.
2. Compact header: menu, wordmark, search, cart.
3. Hero slider: maximum three slides.
4. Primary category rail: Phone Cases, Metal Posters, Custom Design (only when purchasable), View All.
5. My Phone fit strip: saved model or a strong `Choose your phone` action.
6. New / Bestselling phone cases rail.
7. Shop by vibe rail: Cyberpunk, JDM, Anime, Samurai, Space, Minimal.
8. Metal posters editorial tile and small product rail.
9. Trust strip: exact-model ordering, tracked dispatch, issue support.
10. Footer; reserve space above the fixed mobile navigation.

### Desktop order

Use the same order. The hero becomes a two-column composition, categories become four visible cards, and product rails show four cards with arrow controls. Do not replace horizontal discovery with a wall of products.

## Component specification

### 1. CampaignHero

- Maximum three slides: New Drop, Shop Phone Cases, Metal Posters.
- Every slide has one headline, one supporting line, one primary CTA, and an optional secondary link.
- Make the whole artwork area non-clickable; use explicit CTAs so the destination is predictable.
- Mobile height: roughly 62-70svh after the announcement/header, with the CTA visible without scrolling on common 390 x 844 screens.
- Desktop height: 620-720px, not full viewport.
- Swipe on touch; arrows on desktop; dots on both.
- Autoplay may begin only after the first paint, at 6-8 seconds per slide. Pause after user interaction, while focus is inside, when the page is hidden, and when reduced motion is requested.
- Include a real pause/play button and announce slide changes politely to assistive technology.
- Preload only the first hero image. Lazy-load later slides and provide separate mobile crops through `<picture>` or Shopify image transforms.
- Avoid infinite clone slides. Use a finite index and wrap in logic so keyboard and screen-reader order stays clean.

### 2. CategoryRail

- Place directly below the hero, before product cards.
- Four destination cards: Phone Cases, Metal Posters, Custom Design, View All.
- If Custom Design is not backed by published Shopify products, hide it instead of routing shoppers back to a collection.
- Use image-led cards with a persistent text label and short intent cue (`Find your fit`, `Style your wall`).
- Mobile: 78-82vw first card with 12-16px next-card peek, `scroll-snap-type: x mandatory`, and no hidden text.
- Desktop: four-column grid; hover may lift the image slightly but cannot reveal required information.

### 3. MyPhoneBar

- Put the existing saved-device capability near the top of the homepage.
- Empty state: `What phone do you use? Choose once to see compatible cases.`
- Saved state: `Shopping for iPhone 15` with Change and Clear actions.
- Filter or annotate case rails based on compatibility, but do not hide the whole catalogue without explaining the filter.
- Persist the selection as the current implementation does and revalidate it against live Shopify variants before add-to-cart.

### 4. ProductRail

- One reusable component for homepage groups, with server-provided product data and a small client interaction layer.
- Mobile: 1.35 cards visible, snap scrolling, 16px gutters, and a visible `View all` link.
- Desktop: four full cards plus arrow buttons; mouse wheel remains vertical unless the pointer is directly interacting with the rail.
- Keep product title, live price, compare-at price, availability, and quick-add action visible.
- The quick-add label should reflect the saved phone model when available.
- Do not autoplay product rails.

### 5. ThemeRail

- Themes are secondary discovery, not the primary category level.
- Use real product imagery rather than abstract empty cards.
- Only show themes that currently contain published products.
- Keep labels short and use Shopify metafields/tags as the source of truth.

## Interaction and visual rules

- Mobile touch targets: minimum 44 x 44px.
- Body text: minimum 16px for explanatory copy; supporting labels must remain legible at 12-13px.
- Never use thin gray text for price or primary navigation on black.
- Keep one moving region above the fold. If the hero moves, freeze the announcement marquee.
- Preserve the brand's orange as the action color; use white for content and green only for verified status.
- Maintain consistent 16px mobile page gutters and 24-32px desktop gutters.
- All horizontal rails need a next-card peek, touch scrolling, keyboard access, and visible focus states.
- Reserve `calc(68px + env(safe-area-inset-bottom))` below mobile page content.
- Support reduced motion, high zoom, keyboard navigation, and 320px-wide screens.

## Shopify data model

- Add a homepage configuration source rather than hardcoding product handles in the client. A small typed server configuration is sufficient initially; Shopify metaobjects can follow when non-developers need merchandising control.
- Each hero slide needs: status, eyebrow, title, body, desktop image, mobile image, primary label/URL, optional secondary label/URL, theme colors, and sort order.
- Each category needs: title, handle, image, short cue, visibility, and order.
- Product rails should query collections by handle and limit results server-side.
- Theme cards should be derived from published products' `custom.theme` metafield or supported tags.
- Never cache availability or price into homepage configuration; obtain those values from Shopify.

## Delivery phases

### Phase 0: reconcile the baseline

- Decide that the checked-in `app/page.tsx` is the source of truth.
- Remove or archive unused homepage experiment components and their CSS after confirming they are not imported elsewhere.
- Rewrite the stale homepage Playwright tests to match the chosen baseline before adding new behavior.
- Capture fresh 390 x 844, 430 x 932, 768 x 1024, 1440 x 900, and 1920 x 1080 screenshots.

Exit criteria: the current homepage and tests agree; no screenshot is being treated as current when it came from a reverted design.

### Phase 1: information hierarchy

- Build `CampaignHero`, `CategoryRail`, and `MyPhoneBar`.
- Compose them in `app/page.tsx` with live collection data.
- Keep autoplay off for the first release if merchandising images are not ready; manual swipe still provides the correct hierarchy.

Exit criteria: on a 390px screen a new shopper can identify the product families and reach phone cases within two taps; the hero CTA is visible without scrolling.

### Phase 2: commerce rails

- Build one accessible `ProductRail` and use it for phone cases and posters.
- Integrate existing quick add and saved-device behavior.
- Add a data-driven `ThemeRail` below the first product rail.

Exit criteria: product cards show live price/availability, rail navigation works with touch, mouse, and keyboard, and a compatible saved model survives reload.

### Phase 3: motion and polish

- Add optional hero autoplay, progress indicator, pause/play, and transition choreography.
- Tune image crops and performance per breakpoint.
- Remove superseded CSS and components.

Exit criteria: reduced-motion mode is static; no layout shift occurs when images load; interaction remains responsive on a mid-range Android profile.

### Phase 4: measurement and iteration

- Track hero CTA clicks, category clicks, My Phone completion, product-card clicks, quick-add opens, add-to-cart success, and checkout handoff.
- Compare by mobile/desktop and saved-device/no-device cohorts.
- Review after enough traffic for direction, not daily noise.

Primary funnel: homepage view -> category or hero click -> product view/quick add -> validated add to cart -> checkout handoff.

## Implementation map

- `app/page.tsx`: server data assembly and homepage section order.
- `lib/shopify.ts`: limited collection queries and homepage merchandising fetches.
- `components/CampaignHero.tsx`: accessible client slider.
- `components/CategoryRail.tsx`: responsive category navigation.
- `components/MyPhoneBar.tsx`: wrapper around saved-device context.
- `components/ProductRail.tsx`: shared commerce rail.
- `components/ThemeRail.tsx`: refactor to accept live theme data.
- `components/ProductCard.tsx`: retain as the shared product presentation; add only a compact rail variant if measurement proves necessary.
- `app/globals.css`: isolate new homepage styles in one section, then delete unused experiment styles.
- `tests/storefront.spec.ts`: responsive hierarchy, slider accessibility, category routes, saved-device, quick-add, reduced-motion, and no-overflow coverage.

## Verification checklist

- No horizontal page overflow at 320, 360, 390, 430, 768, 1024, 1440, or 1920px.
- Hero CTA and category labels remain visible at 200% zoom.
- Swipe does not trigger accidental navigation.
- Autoplay pauses on hover, focus, interaction, hidden tab, and reduced motion.
- Every slide and category destination has an accessible name.
- The first hero image is the only above-the-fold image loaded eagerly.
- Largest Contentful Paint target: <= 2.5s at the 75th percentile.
- Cumulative Layout Shift target: <= 0.1.
- Interaction to Next Paint target: <= 200ms.
- Saved-device selection always maps to a currently available Shopify variant before cart mutation.
- No fake ratings, stock urgency, discounts, or delivery promises appear.
- Cart and checkout regression tests remain green.

## Recommended first release

Ship a three-slide manual hero, four-card category rail, My Phone bar, one phone-case product rail, one theme rail, and one poster rail. Add autoplay only after image weight and interaction telemetry are healthy. This gives Nakhyatra the same fast category orientation that works on Kreo while keeping the experience calmer, more trustworthy, and specific to exact-fit phone-case shopping.
