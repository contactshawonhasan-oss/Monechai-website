# Goal 02 — Catalog and product data

## Goal

Create a database-backed catalog and repeatable import of the prototype's products.

## Why this exists

Products currently live in source code, so adding a product requires deployment and the browser must load the full catalog.

## Requirements from the master prompt

- Drizzle migrations for `categories`, `products`, `product_variants`, `product_images` and inventory representation, with useful constraints, foreign keys, unique slug/SKU, nonnegative prices/stock, positive quantities and indexes for category, publication, featured and lookup paths.
- Product fields: UUID/internal ID, slug, SKU, English/Bangla name and description where available, current/compare-at prices, category, publication, featured, optional inventory tracking, stock, image ordering/primary, legitimate badge and timestamps.
- Model variants for size/color/model/pack size without assuming all products have them; existing products can use a default variant. Derive safe types from schema.
- Store BDT money in integer minor units (or another explicit safe representation), centralize format/arithmetic helpers and test them.
- Read all 24 records and nine categories in `assets/js/products.js`; implement repeatable development seed/import without duplicate maintained catalogs. Treat Unsplash URLs, ratings/sold counts and marketing claims as placeholders, not verified production content. Development/demo records must be distinguished from production orders/data.
- Create a server catalog query layer for published products, categories, details and filters; no browser dependence on `products.js`. Ensure product #25/#100/#1000 requires no source edit.
- Keep images as storage metadata with a later provider boundary; production catalog must not permanently hotlink arbitrary third parties.

## Scope

Catalog schema/migrations, money helpers, import/seed, query layer, development data policy and domain tests.

## Out of scope

Storefront visual routes (03), checkout/order tables (04), admin CRUD and actual Supabase image uploads (06).

## Dependencies

01 foundation DB client and migration tooling; legacy `assets/js/products.js`.

## External requirements

`DATABASE_URL` secret from Supabase Dashboard → Connect (or PostgreSQL provider) to apply migrations and seed a real DB. `DIRECT_URL` secret if pooled connection cannot run migrations. No Storage key required yet.

## Files expected to change

`src/db/schema/catalog.ts`, `src/db/migrations`, `src/features/catalog`, `src/lib/money.ts`, `scripts/seed*`, package scripts, goal/status docs.

## Implementation checklist

- [x] Model categories, products, variants, images and stock with constraints/indexes.
- [x] Generate and review version-controlled migration.
- [x] Implement money helpers and meaningful tests.
- [x] Build repeatable seed/import of 24 legacy records and nine categories.
- [x] Mark placeholder imagery/content and omit unverified ratings/sold metrics from production representation.
- [x] Implement server-side catalog queries and pagination inputs.
- [x] Apply migration and seed to a test DB; verify counts/constraints.
- [x] Run lint/typecheck/tests/build; update docs and status.

## Validation / tests

Money tests; migration and seed repeatability; SQL/query tests for published visibility, unique keys, pagination and constraints against a test PostgreSQL database; quality gates.

## Definition of done

Catalog data is DB-backed, import is repeatable and safe, money is exact, schema enforces core invariants, and legacy `products.js` is no longer an application data source.

## Work log

- Started locally against the temporary PostgreSQL 17 container. Legacy file has 24 demo records and nine categories; prices are whole BDT and all images are Unsplash placeholders. Live production import is intentionally deferred; demo data must not publish automatically.
- Used BDT poisha as int4; 24 default variants hold inventory (zero for demo), with optional JSONB attributes and variant price override. Product publish and demo flags have a mutual-exclusion DB check. A real product image uses a storage key; demo source URLs are retained for audit but never returned by public catalog queries. Rating/sold/badges from prototype were not seeded. Demo descriptions and compare-at prices remain unverified and unpublished.
- `npm run db:migrate` uses `DIRECT_URL` or `DATABASE_URL`; `npm run db:seed` requires explicit `--demo` internally and refuses remote hosts and production `NODE_ENV`. Seed is idempotent for the known 24 SKUs and never overwrites non-demo products; no production data import is authorized. No live Supabase connection was supplied. To run locally, set `DATABASE_URL` to a loopback PostgreSQL URL and `DATABASE_SSL=disable`, migrate, seed, then run `npm test`. For production, migrate with a direct authenticated DB URL and create verified records through admin (goal 06); do not use the demo seed.
- Reviewed generated `0000_greedy_alex_wilder.sql`: constraints, partial unique image index, foreign keys and catalog indexes. Drizzle regenerate reported no drift. Next.js 16.3.8 local guide for ORM reads confirmed server-side query approach; queries are exposed via `server-only` wrapper. Seed repeat ran three times with unchanged counts. SQL tests cover publication, detail, pagination, escaped search, unique and check violations; all fixtures roll back.

## Result

Four-table Drizzle catalog with migration, safe local-only prototype seed, money helpers and published-only server query layer. Local PostgreSQL migration passed; 9 categories, 24 demo products, 24 variants and 24 image metadata rows, zero published. Four tests passed with local DB (three money tests, one DB integration); lint, typecheck, production build and schema-drift generation passed. Without `DATABASE_URL`, the DB integration test explicitly skips. Live Supabase migration/import and verified product assets need owner access and review; admin content management/storage belongs to goal 06, storefront routes to goal 03, and legacy prototype removal to goal 10.
