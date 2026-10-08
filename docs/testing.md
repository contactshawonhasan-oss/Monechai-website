# Local verification (goal 09)

Tests must **never** point at production or a shared database. `npm test` ignores inherited `DATABASE_URL` and runs its DB cases only when `TEST_DATABASE_URL` is set; `npm run test:e2e` requires it. Both runners require a PostgreSQL URL on localhost with database path `/monechai_test`. The E2E suite inserts/deletes its own category, products, shipping zone and order; keep this database disposable and do not run tests concurrently against it. The runner does not provision migrations.

Example with Docker and an unused local port (test-only credentials; not for production):

```bash
docker run -d --name monechai-goal09-db -e POSTGRES_PASSWORD=test-only -e POSTGRES_DB=monechai_test -p 127.0.0.1:55439:5432 postgres:17
export TEST_DATABASE_URL='postgresql://postgres:test-only@127.0.0.1:55439/monechai_test'
export DATABASE_SSL=disable
DATABASE_URL="$TEST_DATABASE_URL" npm run db:migrate
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
docker stop monechai-goal09-db && docker rm monechai-goal09-db
```

Use a **separate** disposable database for migrations; `db:migrate` still uses `DATABASE_URL` and does not have the test runner's safety guard. Do not commit credentials, export a production URL into the test shell, or run browser tests against a production server. If no database is available, `npm test` runs domain tests and explicitly skips DB cases; this is **not** a full passing integration run. Chromium full browser is required (`npx playwright install chromium` if missing); Playwright starts Next dev on 127.0.0.1:3104 itself and refuses to reuse an existing server. Browser tests include home/shop/product across 390/800/1280 px, locale switch, keyboard shop/cart/checkout, invalid and tampered checkout, out-of-stock and DB-backed COD success. They do not yet constitute a screenshot pixel baseline or a live owner/admin flow.

Outstanding before goal 09 is DONE: compare actual screenshots against the legacy reference at desktop/tablet/mobile in both locales (header, hero, categories, products, cart, checkout, footer), keyboard/accessibility audit for those views, plus owner/admin browser journey after goals 05–08 dependencies (Auth and image/publish) are completed. The current test DB has no real Supabase Auth user or uploaded product photos.
