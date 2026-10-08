# Goal 05 — Admin authentication and authorization

## Goal

Protect a single in-app admin area with Supabase Auth plus explicit admin membership.

## Why this exists

Authentication alone must not grant access to product, order or settings mutations.

## Requirements from the master prompt

- Use Supabase Auth for admin login; no public customer accounts. Add `admin_members` whitelist table with appropriate FK/identity, and require both valid session and membership for all privileged server reads/mutations.
- Implement `/admin` protected layout/login and unauthorized states. Use current supported SSR/session/cookie flow, secure cookies and CSRF-aware mutation architecture; service secrets never enter browser bundles.
- Document and verify first-admin bootstrap without fabricated account/password. Admin URL/auth credentials need owner setup at the correct point.
- Keep admin in the same Next.js application; avoid separate admin app or client-only authorization.

## Scope

Supabase Auth clients/session handling, whitelist schema/migration, admin login/protected shell, server-side authorization helpers and bootstrap procedure.

## Out of scope

Product CRUD (06), order CRUD (07), customer accounts, permission hierarchy beyond a simple admin whitelist.

## Dependencies

01 foundation/database setup; 02 may share migration conventions.

## External requirements

- `NEXT_PUBLIC_SUPABASE_URL` — public project URL from Supabase Dashboard → Project Settings → API.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — public publishable key from the same API settings.
- Owner-created, confirmed Supabase Auth user/email and project SQL Editor access to insert that user's ID into `admin_members` after migration. `DATABASE_URL` (SECRET; Dashboard → Connect) needed for runtime membership reads; `DIRECT_URL` (SECRET) if migrations use a pooler. No service-role key required.
- A server-only key is requested only if the implementation genuinely needs privileged Supabase operations; name `SUPABASE_SERVICE_ROLE_KEY`, secret, from Project Settings → API. Never put it under `NEXT_PUBLIC_*`.

## Files expected to change

`src/db/schema/admin.ts`, migrations, `src/features/admin/auth`, `src/app/admin`, `src/lib/supabase`, `.env.example`, bootstrap docs.

## Implementation checklist

- [x] Add `admin_members`, generated migration, local apply and RLS/revokes.
- [x] Implement Supabase SSR session flow with Next 16 Proxy refresh; live Auth verification pending.
- [x] Enforce verified Auth user + DB whitelist in reusable server helper and current admin data page; goal 06/07 must call guard per operation.
- [x] Build login, protected page/layout and unauthorized states.
- [x] Document first-admin bootstrap (`docs/admin-bootstrap.md`) and test offline allow/deny + local DB lookup; **blocked:** real Supabase login, nonmember and revocation browser verification require owner project/user.
- [x] Run local gates and document credential blockers; **blocked:** live login test.

## Validation / tests

Auth/membership tests for unauthenticated, authenticated non-admin and admin requests; manual login against actual Supabase project; lint/typecheck/build.

## Definition of done

Only a real signed-in whitelisted user can reach admin data or invoke privileged mutations; bootstrap is repeatable and documented.

## Work log

- Proxy matcher also includes future `/api/admin/*` handlers for cookie refresh; each API must still call `requireAdmin` before privileged operations. Lint/typecheck/build rerun after this change passed.
- First-admin setup documented in `docs/admin-bootstrap.md`: exact email-only owner SQL Editor operation checking `auth.users`, idempotent membership grant, revocation and login/deny verification steps; no privileged API key needed. Standalone no-Auth-config smoke: `/admin` 307 to `/admin/login`, login 200; with local DB homepage also 200. Live Supabase login remains blocked by owner access.
- Temporary PostgreSQL 17 accepted migration 0002 (including RLS/revoke); DB membership allowed/denied tests and offline policy passed alongside existing tests (12/12), lint/typecheck/build and Drizzle no-drift. Initial test import of Next navigation failed under react-server condition; moved membership lookup to a separate Next-independent module and reran successfully. Live Supabase Auth session has not been tested.
- Added 0002 whitelist UUID primary key without a PostgreSQL FK to `auth.users`: local portable PostgreSQL lacks the Supabase-managed `auth` schema; bootstrap must verify the identity in `auth.users` and insert only an existing ID. No client grants/privileged Supabase API. Added SSR proxy and per-request server auth; initial typecheck exposed SSR `headers` as record rather than `Headers`, fixed. Generate/lint/typecheck/build passed; live Auth not tested.
- Started goal 05 after locally closing 04. Next 16.3.8 auth guide warns layouts are not sufficient authorization boundaries; use a server data-access guard on every privileged read/mutation. Supabase SSR guide recommends per-request clients, `getClaims()`/`getUser()` (never unverified `getSession()` identity), and Proxy for cookie refresh with no-cache headers. Live login is owner-dependent.

## Result

Local auth boundary and bootstrap procedure implemented; offline tests, local migration and build pass. **Goal remains IN_PROGRESS** pending live Supabase session/member/nonmember/logout verification with owner credentials. Future admin CRUD must call `requireAdmin()` at each privileged operation (goals 06/07).
