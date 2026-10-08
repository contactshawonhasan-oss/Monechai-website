# Goal 04 — Cart, shipping and real COD checkout

## Goal

Let guests place real, transactional Cash on Delivery orders with authoritative totals, safe inventory updates and a private success route.

## Why this exists

Current checkout trusts browser calculations, stores PII/order data in localStorage and can show success without database persistence.

## Requirements from the master prompt

- Guest cart may persist only product/variant IDs and quantities in browser storage. Re-query products/variants at preview and submit; explain deleted/unpublished items, changed price/stock and unavailable variants. Do not store customer PII permanently in localStorage.
- Implement `/checkout` and `/order/[publicToken]/success`, cart drawer/items/quantity/empty cart/form/summary. Success must read a real DB order by a non-enumerable public token and avoid leaking another customer's PII; failed database writes must never show success.
- Server validates IDs, quantities, Bangladesh phone normalization, name/address/area/note and payment method. Browser prices, shipping, discount, stock, payment status and order status are never authoritative.
- Server retrieves current published product/variant data, computes exact integer-money subtotal, configurable Inside/Outside Dhaka shipping and optional free-shipping threshold, valid discounts (if any) and total; checkout preview uses the same shipping domain but final server result wins. Test boundaries.
- Drizzle schema/migrations for `orders`, `order_items`, `shipping_zones` and needed idempotency fields. Persist immutable item snapshots: product/variant references, name, SKU, chosen attributes, quantity, unit price and line total. Use robust internal IDs plus safe customer-facing number/token.
- Use one PostgreSQL transaction to create complete orders/items and reserve/deduct stock; rollback all on failure, prevent overselling via atomic update/locking, and protect retries/double-click with a documented idempotency strategy.
- Start with real COD only. Keep payment method separate from status (`pending`, `paid`, `failed`, `refunded`); browser cannot mark paid. Define clean future payment provider boundary (`createPayment`, `verifyPayment`, `handleWebhook`, `refundPayment`) without fake bKash/Nagad; future gateway success requires server verification/signed webhooks and merchant credentials.
- Provide intentional validation, stock, empty cart, failed order and DB failure states; lightweight duplicate/abuse hook to be completed in 08.

## Scope

Guest cart, shipping domain, order schema/services, COD checkout, inventory, idempotency, success route and domain/integration tests.

## Out of scope

Real bKash/Nagad (future credentialed integration), admin order UI (07), full abuse/security audit (08), broad Playwright suite (09).

## Dependencies

02 catalog/stock/money and 03 storefront shell.

## External requirements

`DATABASE_URL` (SECRET; Supabase Dashboard → Connect → transaction pooler) for live checkout; `DIRECT_URL` (SECRET; Supabase Dashboard → Connect → direct/session connection) or `DATABASE_URL` for the owner-run shipping CLI. Owner must provide actual Inside Dhaka and Outside Dhaka delivery charges, and decide whether a free-shipping threshold applies; business figures are not secrets, but must not be invented. Configure them as integer poisha via `SHIPPING_INSIDE_DHAKA_MINOR`, `SHIPPING_OUTSIDE_DHAKA_MINOR`, optional `SHIPPING_FREE_ABOVE_MINOR` (all server CLI input, **not** `NEXT_PUBLIC_*`). No merchant credentials required for COD. If the owner later requests bKash/Nagad, obtain real merchant API credentials/webhook secret first; do not expose unfinished methods.

## Files expected to change

`src/db/schema/orders.ts`, migrations, `src/features/cart`, `checkout`, `orders`, `inventory`, `shipping`, `payments`, `src/app/(store)/checkout`, `src/app/(store)/order`.

## Implementation checklist

- [x] Build ID/quantity-only guest cart and refreshed summary (preview route re-queries catalog, unavailable lines disable order).
- [x] Add order/item/shipping schema and migration with constraints/indexes (0001 applied to local test DB).
- [x] Add validated checkout and Bangladesh phone normalization (service input; UI/API still pending).
- [x] Add one authoritative shipping service and exact totals (owner must configure zone fees before checkout can succeed).
- [x] Implement transactional order/items/stock updates with concurrency safety (local DB test passed).
- [x] Implement idempotency and safe public identifiers (DB-backed retry lock and random 256-bit token; local test passed).
- [x] Expose COD only and define payment boundary (interface only; no fake payment integration).
- [x] Build real success/error flow and remove browser-local order success (token DB lookup; legacy success URL redirects to checkout).
- [x] Test pricing tampering, invalid/unpublished products, stock, rollback, duplicate requests and persistence (domain, DB and browser tests).
- [x] Run quality gates; update docs/status.

## Shipping configuration (owner action)

After applying migrations, obtain approved courier/store charges from the owner. Convert taka to integer poisha (৳1 = 100 poisha). Set both `SHIPPING_INSIDE_DHAKA_MINOR` and `SHIPPING_OUTSIDE_DHAKA_MINOR` to the approved charges; set optional `SHIPPING_FREE_ABOVE_MINOR` to the owner's chosen subtotal threshold, or leave unset to disable free shipping. Run `npm run shipping:configure` to preview **without database changes**, then `npm run shipping:configure -- --apply` with the same environment values and a server-only `DIRECT_URL` (or `DATABASE_URL`). This upserts both zones atomically. Do not commit the DB URL or claim any test-only fee is the production rate. Until configured, checkout preview cannot produce a total and order creation returns a service-unavailable error. Goal 07 can replace this CLI workflow with authorized admin business settings.

## Validation / tests

Domain tests for money/shipping/phone/checkout/totals/stock; PostgreSQL integration tests for persistence, rollback, concurrency and idempotency; browser COD journey when test environment is ready; lint/typecheck/build.

## Definition of done

Real COD orders persist once with correct server prices/shipping, snapshots and stock; invalid or failed orders cannot reach success; customer token is non-enumerable and private.

## Work log

2026-10-06: Started on user request while goal 03 keyboard interaction check remains outstanding (documented exception in index). First slice: order/shipping schema, input validation and server-side order service. No shipping rates will be invented for production; checkout stays unavailable until rates are configured.

2026-10-06: Generated/applied 0001 on the dedicated local PostgreSQL container. Server validates COD-only, Bangladesh mobile and bounded cart/contact fields; locks product/variant rows and shipping configuration, derives integer totals and stores immutable snapshots in one transaction, with conditional stock deduction. Transaction-scoped advisory lock serializes same UUID retry keys, a stored request hash rejects modified replays, and a 256-bit random public token identifies the order. `node --conditions=react-server --import tsx` is needed for integration tests because server-only intentionally throws under plain Node. Local DB test passed for persisted totals/phone/snapshot, replay, changed replay, unavailable product, rollback on stock failure and competing buyers for last unit. Next: preview, API and cart/checkout UI, then real success route and browser journey.

2026-10-06: Added live preview API, ID/quantity-only local cart, variant selector, checkout form, COD-only submit route and DB-backed noindex success page (no customer PII in response). Legacy static checkout/success URLs redirect away from fake success. Next 16.3.8 bundled route-handler and Server/Client Component guides used. Lint/typecheck/build and 10/10 tests with local DB passed; Drizzle no-drift. Standalone smoke returned checkout 200, nonexistent success 404, legacy checkout 308, invalid-origin 403. Smoke exposed that Next standalone normalizes `request.url` host to localhost; changed origin guard to compare with Host and forwarded protocol instead. After the guard change, lint/typecheck/build passed again; standalone matching Origin reaches normal validation (400 on empty body) and foreign Origin receives 403. Chromium E2E now passed with fixture fee: keyboard navigation, invalid phone, stock change between preview and submit, successful COD persistence and real success route. The first run exposed invalid phone surfacing as 503 because Zod's transform threw a plain Error; changed transform to add a validation issue, and second run passed. Installed official `@playwright/test` per Next's bundled guide; Chromium and FFmpeg downloaded but headless shell download timed out after 240s. The full Chromium channel launched without the separate headless shell and passed the test. npm install reported 9 development-tooling advisories.

2026-10-06: Added native `<dialog>` cart drawer with browser-managed focus/escape, refreshed product prices/availability, quantity/remove and checkout link; Chromium E2E passed again. Added owner-run `npm run shipping:configure` dry-run/`--apply` CLI requiring explicit integer-poisha rates for both zones; no demo/production rates seeded. CLI dry run and invalid input rejection passed. Test-only `--apply` inserted two zones with expected fees/threshold in local PostgreSQL; rows were then deleted (0 zones left). Production rates remain an owner decision and DB credential boundary.

2026-10-06: Strengthened DB integration test with a temporary PostgreSQL trigger that forces stock UPDATE to fail after order and snapshots are inserted; confirms full rollback (no order, unchanged stock). Test passed after asserting Drizzle's wrapped `cause`; temporary trigger/function are removed. Full goal 04 gates were rerun afterward: lint/typecheck, 10/10 local DB-backed tests, 1/1 Chromium Playwright E2E, Drizzle no-drift and production build all passed. Full browser COD journey and configured owner delivery charges remain outstanding.

## Result

Goal 04 local implementation complete. Guests can add only variant IDs/quantities to browser storage, inspect a focus-managed cart drawer and server-refreshed checkout, and place COD orders with validated Bangladesh contact/address details. Migration 0001 adds configurable shipping, orders and immutable item snapshots; the transaction locks current product/variant/zone data, calculates exact server totals, writes order/items, conditionally decrements stock, and enforces retry idempotency and safe random public tokens. Success renders only for persisted orders, without customer PII. No real bKash/Nagad integration is exposed.

Validated on dedicated local PostgreSQL: migration and shipping CLI apply/cleanup, 10/10 unit/integration tests (including forced post-insert DB error rollback, concurrent last-unit orders, unchanged/changed key retries, unpublished products, tampering/phone/shipping), 1/1 Chromium Playwright E2E (drawer, keyboard, invalid phone, changed stock, COD success), lint/typecheck, Drizzle no-drift and production build. Standalone smoke verified checkout 200, nonexistent token 404, legacy redirect, valid vs foreign Origin behavior.

**Production rollout still requires owner action:** real Inside/Outside Dhaka fees and optional free-shipping threshold, plus a live database URL to apply migration/configuration. No rates were invented or left in the local test DB. Full abuse controls/PII/security review move to 08, expanded Playwright coverage to 09, admin business settings to 07 and deployment to 10. The separately downloaded Playwright headless shell timed out, but full Chromium worked and E2E passed.
