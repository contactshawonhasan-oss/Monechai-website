# Goal 06 — Admin catalog and image storage

## Goal

Let an authorized owner create, edit, publish and image products without editing source code.

## Why this exists

The core owner journey ends only when new products appear in the storefront from database/admin actions.

## Requirements from the master prompt

- Implement `/admin/products`, `/admin/products/new`, `/admin/products/[id]` and `/admin/categories` with create/edit, publish/unpublish, safe delete/archive, category/SKU/price/compare-at/stock/variant/featured/localized English/Bangla fields and usable validation/errors.
- Support product #25/#100/#1000 without code edits. Every mutation verifies server-side membership and invalidates relevant Next.js catalog/home cache using current supported APIs.
- Use Supabase Storage by default behind an image-storage interface that could later target S3/R2. Admin can upload/delete/reorder/set-primary. Validate MIME, supported format, file size and storage object ownership; never expose privileged storage credentials to the browser. Configure Next image handling for storage URLs and do not use random third-party imagery as permanent production product photos.
- Preserve safe integer money and stock constraints; avoid unintended edits to historical order-item snapshots.

## Scope

Admin product/category forms, mutations, storage adapter, image management and cache invalidation.

## Out of scope

Order management (07), customer accounts, speculative media-processing pipeline.

## Dependencies

02 catalog, 03 storefront queries, 05 admin authorization.

## External requirements

Supabase project URL/publishable key and Storage bucket access. A server-only `SUPABASE_SERVICE_ROLE_KEY` may be necessary for privileged storage operations; if used, obtain it from Supabase Dashboard → Project Settings → API and keep it secret. Real product photos require owner-provided assets/content.

## Files expected to change

`src/app/admin/products`, `src/app/admin/categories`, `src/features/admin/catalog`, `src/features/catalog/storage`, `src/lib/supabase`, schema/migrations if needed, image config.

## Implementation checklist

- [x] Build validated category CRUD (create/edit/delete-empty with server guard and local DB test; live Supabase verification pending).
- [x] Build product create/edit/archive/publish/featured/variant/stock flows (local DB tests; live publish awaits photo upload and Auth verification).
- [x] Add localized fields and exact price inputs.
- [ ] Add storage abstraction and secure upload/delete/reorder/primary flows.
- [x] Revalidate affected storefront data after category/product/variant mutations; revisit for image flows.
- [ ] Verify owner add→publish→storefront path and unauthorized denial.
- [ ] Run gates; update docs/status.

## Validation / tests

Admin mutation authorization and validation tests; upload MIME/size/ordering tests; manual creation of a new product that appears in storefront; lint/typecheck/build.

## Definition of done

An authorized admin can complete the primary owner product journey without changing code, including image upload and immediate storefront visibility.

## Work log

- Started goal 06 while goal 05 remains owner-blocked for live Supabase login/revocation checks. The local authorization helper is implemented; all new reads/actions must call it themselves. First slice: category management; product and storage flows follow.
- Reviewed bundled Next 16.3.8 forms/auth/revalidatePath guides: authorization belongs in each Server Action and data access; `revalidatePath` is supported in Server Functions.
- Category slice: guarded read and Server Actions; Zod validation, duplicate-slug and FK-safe empty-only deletion, localized names and sort order. Local PostgreSQL 17 with 0000–0002 migrations: 14/14 tests passed (including transaction-rollback category lifecycle). Lint/typecheck/build passed after final validation tweak. No live session or browser category CRUD check; temporary DB container removed.
- Paused at owner's request to implement goal 07 locally. Goal 07 live verification now owner-blocked; resume goal 06 secure image storage/upload, full publish journey and live verification.
- Product slice: guarded, paginated admin list/new/edit routes; transactionally create draft + first variant, edit localized names/descriptions/BDT integer-poisha price, featured, archive and variant stock/price/attributes. Publishing requires a stored primary photo and rejects demos, so **cannot yet publish from the UI** until image storage is implemented. Validation reports field errors; no order snapshot mutations. Local PostgreSQL 17 migrations + 16/16 tests passed incl. draft→primary-photo fixture→publish→stock edit→archive; lint/typecheck/build and Drizzle no-drift passed after final route/revalidation edits. No live browser/admin session test. Next: secure owner image storage/upload/reorder/deletion and full browser journey.

## Result

Pending.
