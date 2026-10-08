# Goal 09 — Automated and visual verification

## Goal

Make the owner/customer journeys and core invariants verifiable in automated tests and browsers.

## Why this exists

Passing a build alone cannot prove transactional checkout, stock safety or usable mobile behavior.

## Requirements from the master prompt

- Meaningful unit/domain tests for integer money, shipping boundaries, Bangladesh phone validation, checkout schema, order totals, stock validation and allowed order transitions.
- PostgreSQL integration tests for order creation/persistence, invalid product, client price tampering, unavailable/oversold stock, transaction rollback and idempotent duplicate request. Do not claim tests that did not run.
- Install current official Playwright tooling/browser binaries if permitted. Browser happy path: home→shop→product→cart→checkout→submit COD→DB persists→real success details; also invalid checkout and unavailable item.
- Verify desktop, tablet-ish and mobile visual parity against old design for header, hero, products, categories, cart, checkout, footer and language switching; keyboard/accessibility regressions.
- Ensure `test`, `test:e2e`, lint, typecheck and build scripts are meaningful; fix failures rather than disabling checks.

## Scope

Consolidated coverage, fixtures/test DB setup, Playwright flows, manual visual/accessibility regression and gate report.

## Out of scope

Unrelated speculative load-testing or a giant monitoring stack.

## Dependencies

03, 04, 06, 07 and 08 application flows.

## External requirements

Isolated test PostgreSQL (`TEST_DATABASE_URL`, secret, if separate DB is used), test Supabase admin user/storage as needed, current Playwright package and browser downloads. Never run destructive tests against production data.

## Files expected to change

`tests`, `e2e`, `playwright.config.*`, test fixtures/scripts, CI configuration if useful, docs/status.

## Implementation checklist

- [x] Cover domain invariants with meaningful unit tests (money, phone, cart/schema/shipping, status graph).
- [x] Cover order persistence/security/idempotency with isolated DB integration tests (including rollback/concurrency).
- [x] Configure existing Playwright/Chromium with guarded dedicated test DB.
- [x] Implement COD happy, invalid, tampered and unavailable E2E cases.
- [ ] Compare desktop/tablet/mobile and both locales against visual baseline; assertions for widths/language work, screenshot/manual parity and admin/photo views remain.
- [x] Run current gates, fix failures and record actual results (goal still open for visual and owner/admin flows).

## Validation / tests

`npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build` and documented manual viewport checks.

## Definition of done

Required invariants have meaningful passing tests and the core owner/customer browser journeys work at relevant widths.

## Work log

- 2026-10-08: Owner requested starting 09 early despite dependencies 06/07/08 not complete. Existing Node domain/DB tests and a Chromium COD+keyboard Playwright test already cover several requirements; retain these, expand missing cases and do not treat skipped DB/browser checks or live admin checks as passes.
- Added checkout boundary/invalid-field domain tests; migrated isolated local PostgreSQL 17 (0000–0005). Updated `npm test` runner to ignore inherited application `DATABASE_URL`, using only explicit local `/monechai_test` `TEST_DATABASE_URL`; Playwright enforces the same constraint and starts its own server. Setup in `docs/testing.md`.
- Local results: 28/28 Node tests (0 skips) with test URL; 21 pass/7 skip when no test URL even if an invalid app DB URL is inherited. Chromium E2E 1/1 after fixing stale existing test labels/plural; home/shop/product at 390/800/1280, English→Bangla→English, keyboard cart/COD flow, rejected forged price/payment and unavailable variant/stock, persisted success. Lint, typecheck, build and `git diff --check` passed. Invalid remote test URL was rejected by Playwright config (intentional negative check). No screenshot parity or authenticated admin journey verified; warning from Next dev about smooth scroll/LCP appeared during browser run. Never use production DB for destructive test fixtures.

## Result

Pending.
