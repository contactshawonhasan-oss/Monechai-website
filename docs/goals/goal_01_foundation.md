# Goal 01 — Foundation

## Goal

Create a buildable Next.js App Router, TypeScript and Drizzle foundation for one portable Monechai application.

## Why this exists

The repository is a browser-only prototype with no server, database connection, build or quality gates. Later goals need stable module boundaries without replacing all behavior at once.

## Requirements from the master prompt

- Inspect every existing HTML/JS/CSS/README/assets and useful git history; understand cart, checkout, search, language, WhatsApp and responsive design before architecture changes. The current checkout has no commits, so there is no history to inspect.
- Use one Next.js App Router modular monolith with React, TypeScript, Server Components by default, server-side logic and clean `features`, `components`, `db`, `lib`, `i18n`, `styles` boundaries. Avoid separate API/admin apps, microservices, monorepo orchestration and other speculative infrastructure.
- Use current stable, documented versions; npm is acceptable. PostgreSQL through conventional `DATABASE_URL`, Drizzle ORM and versioned migrations; Supabase provides managed DB/Auth/Storage later without binding commerce logic to hosting APIs.
- Keep the app portable to an ordinary Linux/Node VPS and suitable for Cloudflare plus Nginx/Caddy; Vercel must not be mandatory.
- Preserve base black/gold tokens and logo while establishing maintainable CSS; retain old prototype as migration reference until parity is achieved.
- Add server-only environment validation, `.env.example`, no committed secrets or service-role key in client variables, DB client, migration commands, `/api/health`, useful PII-safe logging base and scripts for dev/build/lint/typecheck/test/test:e2e/db tasks.
- Keep TypeScript/ESLint enabled, avoid broad `any`, validate with install, lint, typecheck and production build; do not claim DB checks without actual DB access.
- Verify current official Next.js, React, Node, Drizzle and relevant Supabase guidance before significant API decisions; record them.

## Scope

Repository audit, package/config scaffold, route shell, base styling/logo, server env and database connection modules, Drizzle configuration, initial foundation migration strategy, health endpoint, quality commands and local validation.

## Out of scope

Catalog tables/import (02), storefront parity (03), checkout/order schema (04), Supabase admin Auth (05), storage (06), final deployment and docs (10).

## Dependencies

`AGENTS.md`, current prototype and Node/npm.

## External requirements

- `DATABASE_URL` — secret PostgreSQL connection string from Supabase Dashboard → Connect (or another PostgreSQL provider); required for live migration/query verification, not for local scaffold/build.
- A direct DB connection string may be needed later for migrations if a pooled URL is used; name `DIRECT_URL` if adopted. No credentials are present now.
- npm registry access to install official packages. No account login is required.

## Files expected to change

`package.json`, lockfile, `next.config.*`, `tsconfig.json`, ESLint config, `drizzle.config.ts`, `.env.example`, `.gitignore`, `src/app`, `src/db`, `src/lib`, `src/styles`, `public`, `MIGRATION_STATUS.md`.

## Implementation checklist

- [x] Audit prototype and document migration risks in goal index.
- [x] Verify current official stack guidance and select package versions.
- [x] Scaffold Next.js App Router and TypeScript with server/client boundaries.
- [x] Move logo and establish black/gold base styles and common shell.
- [x] Add server-only env validation and safe example environment.
- [x] Add Drizzle/PostgreSQL client, migration config and DB scripts.
- [x] Verify `/api/health` against local PostgreSQL; structured PII-safe logging base exists. Dev endpoint returned HTTP 200 after fixing URL validation.
- [x] Add quality scripts and verify install/lint/typecheck/build.
- [x] Verify a local DB connection through the app (password-authenticated TCP query, health HTTP 200). No catalog migration exists until goal 02; production Supabase connection is still unavailable.
- [x] Update work log/result, status and index after gates.

## Validation / tests

`npm install`, `npm run lint`, `npm run typecheck`, `npm run build`; inspect health route with app running. For local PostgreSQL set a real `DATABASE_URL` and `DATABASE_SSL=disable` (never commit credentials); production needs TLS. `npm run db:generate` produces versioned migrations after schema tables are defined in goal 02; `npm run db:migrate` applies them using `DIRECT_URL` if present, otherwise `DATABASE_URL`. Do not run migrations against production without checking the generated SQL. Verify health with and without a database; use a test DB for migration checks. Supabase live connectivity remains untested without project access.

## Definition of done

The new app builds and serves a base branded page/health endpoint, the DB/config boundary exists, secrets are excluded, migration commands are documented, and any unrun live DB verification is explicitly recorded as credential-blocked.

## Work log

- 2026-10-06: Initial audit found 24 hardcoded products, 9 categories, browser-only order success, localStorage cart/wishlist, fake bKash/Nagad selectors, Unsplash image placeholders and unsupported business claims. This checkout has no commits; existing files are staged/modified and must be preserved as reference.
- 2026-10-06: Verified current official Next.js App Router/ESLint/Node deployment, Drizzle migration and Supabase connection guidance. Selected Next.js 16.3.8, React 19.3.0 and Drizzle ORM 0.45.3. Built the foundation; `npm install`, lint, typecheck, production build and `db:generate` passed (0 schema tables by design). Homepage returned HTTP 200. No-DB health returned HTTP 503 as expected. A direct query to temporary local PostgreSQL 17 passed, but the same endpoint still returned 503 with its URL; diagnose before completing this goal. Production dependency audit found no advisories; full audit reported dev-tool advisories.
- 2026-10-06: Reproduced the 503 with a password-authenticated local PostgreSQL 17 URL and traced it to Zod `z.url({ protocol })`: the regex receives the scheme without `:`. Fixed the pattern in `src/lib/env.ts`; dev `/api/health` returned HTTP 200. Final checks passed: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run db:generate` (no schema tables), and `npm test` (0 tests discovered). Standalone server returned HTTP 503 with no DB URL and HTTP 200 with password-authenticated local PostgreSQL via TCP. Live Supabase connectivity and actual schema migration await goal 02 and project access.

## Result

Foundation complete: branded App Router shell, TypeScript and CSS tokens, server-only PostgreSQL/Drizzle and environment boundary, versioned migration tooling, health route and quality scripts. After correcting Zod URL protocol validation, lint, typecheck, production build and Drizzle generate passed; standalone health returned HTTP 200 against local PostgreSQL and HTTP 503 with no DB URL. `npm test` exited 0 but discovered 0 tests; real coverage belongs to goal 09. No tables or migrations exist yet (goal 02). No Supabase credentials were provided, so live connectivity remains unverified; local TCP DB integration was verified. Legacy runtime remains as reference until goal 10.
