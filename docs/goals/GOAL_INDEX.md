# Monechi rebuild — goal index

## Project objective

Replace the static Monechai prototype with one maintainable Next.js modular monolith backed by PostgreSQL: an owner can create and publish products with images in `/admin`, and a customer can place a real, server-priced, inventory-safe COD order that the owner can manage. Preserve the useful brand identity (now warm white, charcoal and restrained champagne gold at the owner's request) and English/Bangla experience. Deploy on a normal Node.js VPS with managed PostgreSQL; Vercel is optional.

## Repository audit and execution order

The initial checkout has no git commits and contains four HTML pages, one stylesheet, three scripts, and logos. `assets/js/products.js` contains 24 products and nine categories; all imagery is external Unsplash placeholder imagery. `app.js` keeps cart, wishlist and last order in localStorage, computes checkout totals in the browser, and redirects to a success page without a database. Search and sort load the full catalog in the browser. The old HTML duplicates chrome, includes fake payment selectors, a midnight-reset sale timer, unsupported reviews/sold counts and business claims, and inconsistent/path-stale documentation. The legacy files remain available during migration; do not expose two active storefronts at completion.

| Goal | Status | Blocked state | Depends on | Description | External access |
|---|---|---|---|---|---|
| [01 Foundation](goal_01_foundation.md) | DONE | Local DB and standalone health verified; live Supabase access unavailable (not required for foundation) | — | Scaffold Next.js, TypeScript, base design, PostgreSQL/Drizzle wiring, environment checks and quality scripts. | Production `DATABASE_URL` later; local PostgreSQL verified. |
| [02 Catalog](goal_02_catalog.md) | DONE | Local migration/seed/tests verified; live production catalog needs owner access and verified assets | 01 | Model products, categories, variants and images; safely import prototype data and query it. | PostgreSQL/Supabase project for live migration. |
| [03 Storefront](goal_03_storefront.md) | DONE | Local routes, responsive and Chromium keyboard checks passed; live display requires published verified products | 02 | Migrate home, shop and product routes into responsive, accessible reusable blocks. | None. |
| [04 Cart and checkout](goal_04_cart_checkout.md) | DONE | Local migration, COD flow, inventory/idempotency and E2E passed; live database and owner-approved zone fees required for rollout | 02, 03 | Build guest cart and transactional server-authoritative COD checkout with inventory and idempotency. | PostgreSQL for integration tests. |
| [05 Admin auth](goal_05_admin_auth.md) | IN_PROGRESS | Local tests/build/migration pass; live session/login authorization test blocked on Supabase project and owner-created user | 01 | Add Supabase Auth, explicit admin whitelist, protected routes and first-admin bootstrap. | Supabase URL/publishable key and an owner-created first user. |
| [06 Admin catalog](goal_06_admin_catalog.md) | IN_PROGRESS | Resumed as next independent work while 07 live verification waits for Supabase; image storage/publish path incomplete | 02, 05 (local auth boundary ready; live check blocked) | Add product/category CRUD, variants, stock and image management. | Supabase Storage credentials/project. |
| [07 Order management](goal_07_order_management.md) | BLOCKED | Local migrations/tests/UI implemented; authenticated customer→admin browser verification waits for owner Supabase access | 04, 05 | Build admin order list/detail, safe status changes and business settings. | Live DB/admin user for end-to-end verification. |
| [08 i18n, SEO and security](goal_08_i18n_seo_security.md) | IN_PROGRESS | Owner requested an independent start while 06 remains unfinished and 05/07 await live access; production domain/contact still unknown | 03, 04, 06, 07 | Complete English/Bangla, SEO, security/abuse controls, claims audit and WhatsApp configuration. | Confirmed business contact details/domain when available. |
| [09 Testing and visual regression](goal_09_testing.md) | IN_PROGRESS | Owner requested early start; 06 image flow, 07 live admin and 08 final review remain incomplete, so those E2E checks cannot close yet | 03, 04, 06, 07, 08 | Add domain, integration and Playwright tests plus desktop/tablet/mobile checks. | Test PostgreSQL and browser tooling. |
| [10 Deployment hardening](goal_10_deployment_hardening.md) | IN_PROGRESS | Old public GitHub repo deleted; new same-name repo verified private/empty, fresh-history push pending; final checks/legacy cleanup wait for 05–09; live deployment needs credentials | 01–09 for final completion; independent Docker/docs slice unblocked | Finalize Docker/VPS deployment, docs, backup guidance, legacy cleanup and final quality gates. | VPS/Cloudflare/DNS access only for actual deployment. |

**Current active goal:** 10 deployment hardening, started early at the owner's explicit request for independent Docker/docs work; 09, 08 and 06 are paused IN_PROGRESS (09 visual/admin E2E, 08 final DB/mobile/security review, 06 image upload/publish incomplete). Goal 07 is BLOCKED on authenticated live owner verification; 05 remains IN_PROGRESS only for owner-blocked live Auth verification. **Next goal:** after independent 10 docs, resume 08 and 06 to unblock remaining 09 test scenarios, then unblock 05/07 with owner Supabase access. See `docs/admin-bootstrap.md` for owner setup; do not mark 05 DONE without live member/nonmember/logout/revocation checks. Production COD remains unavailable until approved shipping fees and live DB setup are provided.

## Master Prompt Coverage

- Full repository audit, recent history, safe git handling and legacy comparison → 01; final legacy cleanup → 10.
- Modular monolith, Next.js App Router/React/TypeScript, Server Components, code boundaries, portable Node/VPS architecture, environment validation, health/logging base and quality scripts → 01.
- PostgreSQL/Drizzle migration tooling → 01; catalog schema, constraints/indexes, integer money, variants, images, stock and legacy product seed/import → 02.
- Home blocks, black/gold CSS/logo, responsive layout, reusable commerce components, shop/product routes, database search/filter/sort/pagination, accessibility and performance → 03.
- Guest cart, price/stock refresh, shipping zones/settings/calculation, customer validation, snapshots, transactional order creation, concurrency, idempotency, safe public order token, COD-only payment boundary, success/error states → 04.
- Supabase Auth, explicit `admin_members`, server authorization, secure sessions, admin login and first-admin bootstrap → 05.
- Source-free product/category creation and editing, image storage abstraction/upload/delete/reorder/primary, localized fields, publishing, featured, stock and storefront cache invalidation → 06.
- Admin order list/detail, valid status transitions/history, payment status protection, central business settings and management → 07.
- English/Bangla dictionaries and preference, metadata/canonical/Open Graph/sitemap/robots/Product JSON-LD, headers, XSS/CSRF/input/body/error protections, checkout abuse prevention, PII review, WhatsApp and false-claim cleanup → 08.
- Money/shipping/phone/schema/totals/stock/status domain tests, order persistence/security/idempotency integration tests, Playwright COD/invalid/out-of-stock journeys and desktop/tablet/mobile visual parity → 09.
- Docker, standalone build, Nginx/Caddy and Cloudflare/VPS/Supabase deployment guidance, backup/recovery, README, `ARCHITECTURE.md`, secret scan, removal of active static runtime, final gates and master coverage review → 10.
- Optional future real bKash/Nagad, coupons, promotions, customer accounts, notifications, couriers, invoices and analytics → only clean boundaries in 04/07/10; no uncredentialed or speculative integration.

The coverage pass maps every major specification area to an owning goal. The detailed files preserve acceptance criteria and cross-goal boundaries.
