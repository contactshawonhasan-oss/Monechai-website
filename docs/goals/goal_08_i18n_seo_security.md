# Goal 08 — Internationalization, SEO and security

## Goal

Finish bilingual content, truthful production claims, discoverability and public/admin security.

## Why this exists

The prototype uses scattered HTML injection and unsupported marketing claims; a public commerce app also needs strong validation and safe metadata.

## Requirements from the master prompt

- Preserve English/Bangla using structured Next-compatible dictionaries, localized category/product fields and optional client preference without client-rendering the entire app or arbitrary `innerHTML`.
- Dynamic titles/descriptions/canonical/Open Graph, unique product URLs, sitemap, robots and accurate Product JSON-LD. No fake review/rating structured data. Configure site URL and safe optimized storage images.
- Audit/remove or ground all prototype claims: 5000+ customers, sold counts, ratings, verified testimonials, artificial timer/flash sale, unverified 24h delivery/exchange/quality promises and unsupported discounts. Future review/promotions components may remain data-driven but must not pretend seed data is real.
- Centralize/confirm WhatsApp and contact values, encode URLs safely, and make WhatsApp supplemental to a real DB order; messages may use a persisted order number but opening WhatsApp never creates success.
- Review hostile input/validation, safe SQL/rendering, XSS/CSRF, secure cookies, authorization, security headers, body/request limits, safe errors, server secret boundaries and PII-safe structured logging. Add reasonable replaceable public-checkout anti-abuse (rate throttling/honeypot/idempotency); no immediate CAPTCHA without need.
- Cover missing product, unavailable, no results, empty, validation, failed order, DB/server failure and unauthorized admin states with intentional messages.

## Scope

Locale architecture, SEO metadata/routes/schema, security/abuse/privacy pass, truthful content and WhatsApp cleanup.

## Out of scope

Independent full review platform, genuine timed promotion engine without business data, online gateway integration.

## Dependencies

03 public pages, 04 checkout, 06 catalog management and 07 settings.

## External requirements

`NEXT_PUBLIC_SITE_URL` public canonical production URL when known; confirmed store contact values and any verified policy/claim wording from owner. Security controls can be coded with local/test defaults while these details are pending.

## Files expected to change

`src/i18n`, `src/app/sitemap.ts`, `src/app/robots.ts`, metadata files, `src/features/checkout/abuse`, `src/lib/security`, `src/components`, settings and security configuration.

## Implementation checklist

- [x] Implement structured English/Bangla UI, preference and localized catalog output.
- [ ] Verify localized home/shop/product/cart flow against published rows in a database; review mobile layout in both languages.
- [x] Add canonical/OG/sitemap/robots/Product JSON-LD without fake claims.
- [x] Audit the active Next storefront for false metrics, reviews, countdowns and delivery promises; none remain in the active routes. Legacy prototype cleanup remains in goal 10.
- [x] Centralize WhatsApp/contact URLs from database settings and safely encode optional messages.
- [ ] Confirm owner-provided production contact values and canonical domain.
- [ ] Audit authorization, input, cookies, CSRF, XSS, errors, limits, logging, headers and secrets.
- [x] Add replaceable checkout throttling/honeypot/duplicate protections (single-process throttle; reverse-proxy limit still required for multi-process deployment).
- [ ] Verify error/empty/unavailable states and run quality gates.

## Validation / tests

Locale and SEO output tests, security/abuse tests, secret/PII scan, manual English/Bangla and link checks; lint/typecheck/build.

## Definition of done

Both languages work on required routes, metadata is accurate, unsupported claims are absent, and public/admin security checks are verified without leaked PII/secrets.

## Work log

2026-10-08: Owner explicitly requested starting goal 08 before goal 06 image management and live goal 05/07 verification finish. Begin with independent SEO and public security work; keep those cross-goal dependencies visible. Verified installed Next 16.3.8 metadata/sitemap/robots/CSP guides and current official Next/Google guidance before implementation.

2026-10-08: Added validated site origin, crawler-safe sitemap/robots, route/product metadata and escaped Product JSON-LD from published catalog data. Only real prices/stock are emitted, without ratings. Added bounded streaming JSON body reads, a checkout honeypot and a process-local throttle keyed by proxy-controlled X-Real-IP when configured. Added baseline response headers and noindex for checkout/admin. Unit tests 18 passed, 7 DB tests skipped without `DATABASE_URL`; lint, typecheck and production build passed. Production HTTPS origin must be present at build time; contact details are still owner-owned. The throttle is a single-process defense and needs a reverse-proxy limit for multiple workers.

2026-10-08: Added typed English/Bangla dictionaries, a one-year SameSite=Lax preference cookie, server-rendered `<html lang>`, localized home/shop/product/cart/checkout/order success/empty states, Bangla catalog names/descriptions/image alt text with English fallback, and English/Bangla catalog search. Product title/description/OG follow the selected language; the canonical URL stays shared and crawlers default to English. The public preview endpoint localizes item names; historical order snapshots stay unchanged. Added validated WhatsApp/mailto link helpers; WhatsApp remains supplemental and only appears for an owner-configured number. Removed unused `NEXT_PUBLIC_WHATSAPP_NUMBER` example. Active Next routes have no prototype metrics, reviews, artificial timer or unverified delivery/exchange claims; the old static prototype still contains them and remains a goal 10 cleanup item. Built server smoke returned Bangla `<html lang>`, translated checkout heading, noindex, security headers, robots disallow and empty sitemap without production URL. Latest lint/typecheck/build pass; 20 tests pass, 7 DB tests skip because `DATABASE_URL` is unset. DB-backed localized pages, mobile visuals and live Auth/storage remain unverified.

Security review so far: public checkout requires same Origin/Host/protocol, JSON, an 8 KiB streamed byte cap, strict Zod order data, empty honeypot, idempotency, inventory transaction and a bounded in-process throttle. Trusted IP throttling requires `CHECKOUT_TRUST_PROXY_IP_HEADER=true` only behind a proxy that overwrites `X-Real-IP` and blocks direct Node access. Next 16.3.8 Server Actions default to POST, same-host Origin checks and a 1 MiB body limit; every existing admin read/action calls `requireAdmin` server-side. Catalog values render through React, with escaped JSON-LD. The only active log event is a body-free health failure; customer PII stays in PostgreSQL and is absent from cart localStorage. Baseline CSP/header protections are in place, but a nonce-based script CSP, reverse-proxy distributed throttling and live Supabase cookie/session verification remain follow-up work. Do not claim the full audit or goal complete yet.

## Result

Pending.
