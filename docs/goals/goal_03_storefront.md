# Goal 03 — Storefront

## Goal

Rebuild the public Monechai experience on server-rendered, reusable Next.js routes.

## Why this exists

The existing design is useful, but duplicated HTML and browser-wide catalog scripts prevent maintainable growth.

## Requirements from the master prompt

- Implement `/`, `/shop`, `/products/[slug]`, and useful redirects from legacy HTML URLs. Use Server Components by default; Client Components only for interactive parts.
- Preserve black/gold identity, existing logo, home sections, category feel, product cards, cart-drawer appearance, simple checkout visual direction, responsive desktop/tablet/mobile layout and WhatsApp affordance.
- Compose homepage from reusable blocks such as Hero, HowToOrder, CategoryGrid, FeaturedProducts, ProductGrid, Promotion, TrustBenefits and Testimonials; blocks receive clean data interfaces and know nothing about PostgreSQL.
- Build useful reusable commerce elements: ProductCard/Grid/Price/Gallery/Badge, search/filter/pagination/quantity UI and shared header/footer. Avoid trivial abstractions.
- Shop URL params support `q`, category, price-asc, price-desc, default/relevance and page; filter/sort/page in PostgreSQL, with hundreds/thousands of products in mind. Do not download the full catalog to the browser.
- Add loading, empty catalog/no-results, missing product, unavailable/out-of-stock and 404 states. Use safe rendering, image optimization, accessible controls/labels/alt/focus/drawer behavior and reasonable performance/caching.
- Do not present false sales, countdowns, reviews, sold counts or delivery claims from the prototype. A promotion block appears only when supported by real configured data.

## Scope

Public home/shop/product pages, shared visual system and components, server query integration, responsive/accessibility baseline.

## Out of scope

Functional cart/checkout (04), admin catalog (06), full i18n/SEO/security pass (08), final visual regression (09).

## Dependencies

02 catalog and 01 base app; legacy pages/CSS/logos for visual comparison.

## External requirements

None for code. Real store images from Supabase Storage or the owner are needed before publishing production products; prototype Unsplash images remain clearly development-only.

## Files expected to change

`src/app/(store)`, `src/components/blocks`, `src/components/commerce`, `src/components/layout`, `src/styles`, `public`, redirects in `next.config.*`.

## Implementation checklist

- [x] Build shared branded header, navigation, footer and responsive shell.
- [x] Implement reusable homepage blocks with truthful content (omit unverified promotions/testimonials).
- [x] Implement server-rendered `/shop` search/category/sort/page and stateful URL controls.
- [x] Implement product details/gallery and unavailable/404 states (ordering is intentionally disabled until 04).
- [x] Add loading/empty/error states, accessible controls and optimized images where verified Storage is configured; otherwise show local logo placeholder.
- [x] Compare desktop, tablet and mobile with legacy visual baseline (Firefox headless screenshots); Chromium Playwright keyboard navigation checked skip link, header search, shop filters/sort, product link and pagination.
- [x] Run lint/typecheck/tests/build and update docs/status.

## Validation / tests

Server query tests for URL filters and pagination; browse routes at desktop/tablet/mobile widths; keyboard checks; lint/typecheck/build.

## Definition of done

Public routes render DB-backed products with useful parity to the old visual design, scalable server filtering and accessible responsive behavior.

## Work log

2026-10-06: Started goal. Reviewed legacy homepage/shop (unverified sale, delivery, reviews and social/contact claims removed), catalog visibility policy and Next.js 16.3.8 bundled App Router guides. Server page searchParams/params are promises; uncached ORM reads must occur at request time, not build/prerender time. Demo imagery remains hidden.

2026-10-06: Built shared shell and query-backed routes; categories only show when containing a non-demo published product; cards expose active variant availability. Opt-in public Supabase Storage image keys are constrained to the `products` bucket and configured project host, with a logo placeholder otherwise. No non-functional cart or speculative WhatsApp number presented until checkout/contact details are verified. Redirected index/shop legacy HTML; checkout/success cannot redirect to fake success. Lint/typecheck/build passed; six tests passed with local DB. Built standalone server smoke-tested against local PostgreSQL: empty home/shop 200, filtered shop 200, temporary published product 200, missing product 404 (after moving loading boundary to `/shop`), index/shop HTML redirects 308, legacy checkout 404. Fixture removed afterward. Headless Firefox screenshots at 1280×900, 800×900 and 390×844 confirmed black/gold layout, logo, legible filters and no horizontal overflow in viewed area; screenshots used standalone static/public assets copied as deployment will do. No browser keyboard-interaction tooling used; focus/labels/semantic forms reviewed in code only. Final lint/typecheck/build, six DB-backed tests and Drizzle no-drift check passed. Optional verified public `NEXT_PUBLIC_WHATSAPP_NUMBER` link is hidden until configured.

## Result

Public routes remain DB-backed, responsive and truthful; home/shop/product/legacy redirects were validated with local PostgreSQL. Lint/typecheck/build, 6 DB-backed tests and no-drift passed at goal 03 validation. On 2026-10-06, the remaining interactive keyboard check passed in Chromium Playwright against local fixture: skip link → brand → search, keyboard shop category/sort/apply, product link and next-page pagination. Goal 04's checkout E2E test owns that fixture and also exercises COD. No production Supabase credentials or verified product imagery have been provided; demo remains unpublished. Future richer accessibility/visual regression belongs to 09.

## Work log addendum

2026-10-06: User requested goal 04 before the last keyboard check; goal 03 was temporarily paused. After Playwright Chromium became available, its keyboard check passed in `tests/e2e/checkout.spec.ts`; closing 03 now while 04 continues.

2026-10-07: At the user's request, refreshed the active App Router site's global theme to warm white, charcoal and restrained champagne gold. The existing `src/app/globals.css` tokens and shared selectors now cover storefront, cart/checkout, admin, forms and states without altering layout or functionality. Also updated the still-openable legacy HTML/CSS reference (which remains obsolete and must not be used for real orders); goal 10 still owns its eventual removal. Next 16 bundled CSS guide reviewed. Lint/typecheck/build passed; 11/16 non-DB tests passed with five skipped without `DATABASE_URL`; Chromium inspected Next login/checkout and legacy desktop/mobile home/shop/checkout plus static order-success color checks. No DB-backed storefront visual test in this session; goal 09 retains full visual regression.

2026-10-07: Owner supplied `/home/shawon/Downloads/monechai-logo.svg` (three paths and local gradients, no external references/scripts/events); copied unchanged to Next public and legacy assets, derived a light footer version and cropped mark for product placeholders and the Next `/icon.svg`/static favicon. Replaced old PNG/text composite in shared header and home hero, footer, fallback imagery and still-openable static headers/footer. Next 16 image/component/app-icon guides reviewed: SVG from public is served unoptimized via `next/image`, app icon file convention provides favicon. Lint/typecheck/build passed; XML parsed; Chromium verified logos loaded Next login at 390/1280 and legacy home/shop/checkout/success mobile, home desktop; favicon and static assets 200. Tests: 11 passed, five skipped without DB URL. Existing prototype home/shop mobile horizontal overflow persists; DB-backed Next homepage/product visuals are not tested in this session. Goal 06 remains active for actual admin product photo storage; logo fallback is not a product photo.

2026-10-07: Owner asked for the newly supplied logo to render at 0.9×. Scaled Next header/hero/footer and product placeholder image dimensions and mirrored header/footer in the static reference; SVG source/icon unchanged. Lint/typecheck/build and diff check passed; Chromium measured Next login/static home header at 194px on 390px mobile and 243px on 1280px desktop, both images loaded. No DB-backed homepage visual run for this sizing-only adjustment.
