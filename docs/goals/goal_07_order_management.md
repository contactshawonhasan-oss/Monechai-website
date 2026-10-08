# Goal 07 — Orders and business settings

## Goal

Give authorized admins a useful order queue, safe status controls and central store settings.

## Why this exists

Persisted orders must be actionable for the owner, and delivery/contact/payment settings must not live in scattered UI constants.

## Requirements from the master prompt

- Implement `/admin/orders`, `/admin/orders/[id]`, `/admin/settings` and an overview `/admin`. Order list shows number, timestamp, customer, phone, area, total, payment method/status and order status; detail shows item snapshots, quantities, customer/address, shipping, totals, note and status.
- Define explicit statuses (`pending_confirmation`, `confirmed`, `packed`, `shipped`, `delivered`, `cancelled`) and valid transitions; prevent impossible changes and record timestamps/history when reasonably simple. Payment status and method remain separate; browser cannot set paid.
- Add `site_settings` (and `order_status_history` if used), server-only authorized mutations, settings for store name, WhatsApp number, hotline, support email, Inside/Outside Dhaka fees, free threshold, enabled implemented payment methods, address/contact info. Cache and invalidate safely. Only enable real COD now.
- Keep future provider/coupons/notifications/courier/invoice/analytics boundaries simple and documented without implementing speculative features.

## Scope

Admin order list/detail/status updates, status history, settings schema/forms and cache invalidation.

## Out of scope

Online payment gateway, customer accounts, notifications, courier API, invoice/analytics systems.

## Dependencies

04 order persistence and 05 admin auth; 06 may establish admin form conventions.

## External requirements

Real PostgreSQL and authorized admin login for end-to-end verification. Owner-confirmed contact values improve production settings; never invent verified hotline/support claims.

## Files expected to change

`src/db/schema/orders.ts`, `src/db/schema/settings.ts`, migrations, `src/features/orders`, `src/features/admin/settings`, `src/app/admin/orders`, `src/app/admin/settings`.

## Implementation checklist

- [x] Define and test allowed order transitions/history (local DB; live Auth verification pending).
- [x] Build paginated/filterable order list and detail (local DB; live UI pending).
- [x] Add server-authorized status updates and payment-status protections (COD payment remains pending; no browser mutation; live Auth pending).
- [x] Add central site/shipping/contact/payment settings and safe invalidation (local tests; live UI/auth pending).
- [ ] Verify a checkout order appears and can be managed by admin (local DB service tests passed; live authenticated browser journey pending).
- [x] Run local gates; update docs/status (live Auth/UI validation remains open).

## Validation / tests

Status transition tests, admin authorization tests, order list/detail/settings integration tests, real customer→admin flow, lint/typecheck/build.

## Definition of done

Every real order is visible to authorized staff with complete snapshots/customer details and only valid status changes; central settings drive commerce/UI values.

## Work log

- Started at owner's request while goal 06 is paused before image upload; goal 05 live verification still needs owner Supabase access. Reviewed Next 16 bundled forms guide: every Server Action must authorize independently.
- Implemented 0003 migration mapping historical `placed` rows to `pending_confirmation`, adding `packed` and backfilling initial history; new checkout writes history in its transaction. Row-locked transitions, guarded queue/detail/action, exact order-number/status filters, snapshot display. Test runner now serializes integration files sharing fixed shipping-zone keys (initial parallel run raced). Initial test asserted packed→cancelled invalid; corrected to shipped→cancelled.
- Added singleton `site_settings` (0004), guarded settings forms for verified contacts/COD enablement and owner-entered two-zone fees/thresholds (no invented rates). Preview/transactional checkout check COD enablement, existing idempotent retry still returns original order; footer reads only configured contacts when DB available. Added explicit delivered-COD cash-received action with row lock and payment audit table (0005); no browser-supplied payment status or speculative refund/online payment flow. Local PostgreSQL 17 migrations 0000–0005, 20/20 tests, 1/1 checkout Playwright E2E (before final payment change), lint/typecheck/build, Drizzle no-drift and diff check passed. Tests cover queue/history, settings validation/rollback, payment gating and checkout disable/retry. No live Auth/admin browser tests; legacy `NEXT_PUBLIC_WHATSAPP_NUMBER` superseded in active Next shell. Next: authenticated end-to-end order→admin flow when owner provides Supabase access; review deployment/config later.
- Follow-up: read live contact settings in active Next shell only at request time via Next 16 `connection()`; production build with local DB URL, lint/typecheck/diff check passed after that change. Test container removed. Legacy prototype is unchanged and remains non-authoritative.
- Limitation: old data status backfill has not been tested with actual pre-0003 orders; no real rates/contact values entered. Completed status/setting service tests use local DB without a real authenticated admin browser. No admin-access credentials invented. Marked BLOCKED for live verification, resume goal 06 meanwhile.

## Result

Local implementation complete but goal **BLOCKED**, not DONE: guarded orders list/detail, status graph/audit, explicit COD cash-received control/audit and central contact/shipping/COD settings are implemented. PostgreSQL migrations 0003–0005, 20/20 local DB tests, 1/1 checkout E2E (prior to final payment action), lint/typecheck/build and Drizzle no-drift passed. No authenticated admin browser run or live owner settings test is possible without Supabase project and owner-created admin. No rates/contact details were invented. Follow-up: verify owner login, unauthorized access, checkout order→admin status→receipt, and migrations on live data before marking DONE.
