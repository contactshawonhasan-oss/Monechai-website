# Goal 10 — Deployment, documentation and final hardening

## Goal

Leave one production-capable application with current documentation and reproducible VPS/Docker deployment.

## Why this exists

The migration is not complete until the owner can deploy, back up and operate the real store without the static prototype.

## Requirements from the master prompt

- Verify production build and use standalone Next output if appropriate. Provide Dockerfile and deployment examples for ordinary Linux/Node VPS behind Nginx or Caddy and Cloudflare, using managed PostgreSQL/Supabase rather than requiring DB on the VPS; Vercel optional.
- Document Supabase Auth/Storage/DB production setup, environment variables, migration generation/application, safe rollback/recovery strategy, development seed, first-admin bootstrap, adding products, managing orders, genuine COD-only payments, tests, build, local/VPS/Docker commands and troubleshooting.
- Add `ARCHITECTURE.md` explaining boundaries, schema, request/checkout/payment/auth/storage flows, deployment, and explicit invariants: client price/shipping not authoritative, browser cannot set payment status, transactional/idempotent order creation, immutable snapshots, server admin checks, source-free products, no client secrets.
- Document real backup/recovery expectations and current official Supabase plan behavior without pretending backups are enabled; include hooks for future error tracking/uptime monitoring, health checks and PII-safe logs.
- Preserve old prototype only as reference during migration, then remove obsolete active runtime files and stale README paths; final repo has one storefront. Review original master prompt and coverage map, verify no requirements were dropped, no secrets committed and no fake payment UX.
- Run actual dependency install, lint, typecheck, unit/integration/E2E when environment permits and production build; fix failures and report genuine limitations/credentials. Avoid forced history changes or unnecessary file deletion.

## Scope

Deployment artifacts, README/architecture/backup docs, production verification, secret/legacy audit and final report.

## Out of scope

Actual Cloudflare/DNS/VPS changes without owner access; future payment gateways, coupon/review/customer/notifications/courier/invoice/analytics systems.

## Dependencies

Goals 01–09 and the master-prompt coverage audit.

## External requirements

For an actual deployment: VPS SSH access (owner-provided secret), domain/DNS or Cloudflare authorization/token (secret), production `DATABASE_URL`/Supabase Auth/Storage credentials and confirmed public site URL. These are not needed to prepare reviewable deployment artifacts. Official current Supabase backup and Next/Docker guidance must be verified online.

## Files expected to change

`Dockerfile`, `.dockerignore`, reverse-proxy examples, deployment/backup docs, `README.md`, `ARCHITECTURE.md`, `next.config.*`, old root HTML/JS/CSS cleanup, status/goal docs.

## Implementation checklist

- [x] Build/test Docker standalone artifact (non-root runtime, public/static copies; DB-backed health smoke with disposable PostgreSQL 17 passed).
- [x] Document Nginx, Cloudflare, managed DB and secret setup (template only; no live credentials/deploy).
- [x] Document migrations, rollback/recovery and honest backup expectations (restore drill not yet executed).
- [x] Rewrite README and add architecture/invariant document (revisit as unfinished goals land).
- [x] Publish current in-progress project to existing GitHub `Monechai-website/main` via fast-forward (historical action; owner later requested deletion). Not a production launch.
- [ ] Delete old public repo and publish current project to a newly created private same-name repo with fresh history. Public deletion verified 404; same-name replacement repo created and API verified private/empty; fresh-history push pending. Vercel separate.
- [ ] Remove obsolete active static runtime after visual/functional parity.
- [ ] Review original master specification and coverage, scan secrets/fake claims/payment paths.
- [ ] Run and record final gates/build/E2E and deployment smoke tests where possible.
- [ ] Mark all goals DONE only when their acceptance criteria actually hold; produce final report.

## Validation / tests

Dependency install, lint, typecheck, unit/integration, Playwright, production build, Docker build/run and health check where tools/access permit; manual docs/secret/legacy audit.

## Definition of done

One real storefront/admin app is buildable and deployable by documented commands, all required goals are DONE, and actual test/build/deployment limitations are disclosed.

## Work log

2026-10-08: Owner asked to start 10 early while 05–09 are incomplete. Following local Next 16.3.8 deploying/self-hosting docs, added multi-stage Node 22 bookworm-slim Dockerfile and `.dockerignore`. `docker build -t monechai-goal10:local .` succeeded; container served `/admin/login` 200 and `/icon.svg` 200, while `/api/health` correctly returned 503 without `DATABASE_URL`. Runtime user is `nextjs`; local image size ~425 MB. Docker `npm ci` reported 9 development-tooling advisories; do not assume security audit is clean. Real DB-backed health and production smoke still outstanding. Public Next variables are baked at build time; secret DB URL must only be supplied at runtime. Official docs consulted: https://nextjs.org/docs/app/getting-started/deploying and https://nextjs.org/docs/app/guides/self-hosting (local installed copy).

2026-10-08: Added `docs/deployment.md`, `docs/backup-recovery.md`, `ops/nginx-monechai.conf`, replaced stale static README and added `ARCHITECTURE.md`. Verified official Supabase backups, Docker/Next and Cloudflare Full (strict) guide URLs respond 200. Provider docs note DB backups exclude Storage object bytes and Free projects require deliberate off-site exports; no backups are configured here. Local Markdown relative-link check, unstaged `git diff --check`, `npm run lint`, `npm run typecheck` passed. `git diff --cached --check` flags pre-existing staged whitespace in `assets/js/app.js:16`; Nginx config not tested with `nginx -t` (binary absent), no live restore or origin smoke. 2026-10-08: Started disposable `postgres:17-alpine` on a private Docker network, applied migrations 0000–0005 via `npm run db:migrate` with local-only credentials, and ran the built Docker image against it. `/api/health` returned 200 with DB ok and `/` returned 200. App/DB containers and network removed after smoke. No owner Supabase, Storage or production network test was performed. Next: defer legacy removal/final gates until 05–09 are resolved.

2026-10-08: Read-only `gh` account audit found published `Monechai-website` still hosts the static prototype; four HTML pages reference missing `assets/` paths, and checkout fabricates browser-only orders. This migration checkout has no remote or commits, so nothing has been published from it. The other account repo `fun-site` is unrelated: temporary shallow clone passes lint/build but fails `npm start` due to CJS bundle of `import.meta.url`, and unauthenticated AI endpoints lack request limits. Both repos have no CI. No GitHub repo changed in that audit. Owner subsequently authorized replacing the existing Monechai repo contents without deleting the repo or history; WIP README already warns against production orders. Preflight lint/typecheck/build passed, 21/28 tests pass with seven DB skips (no DB), ignored env/build files excluded from a prepared shallow-clone tree. A shallow clone fast-forward commit `601fe49` was created over the old repo tip `59c034a`; push to existing `Monechai-website/main` failed HTTP 403 (`Permission ... denied`). The remote was unchanged; current authenticated credential needs repository Contents write permission (owner action). Connected this working checkout to `origin/main` at `59c034a` and committed the same replacement locally on `main` without force/resetting working files. No force push or deletion attempted; live deployment verification still outstanding.

2026-10-08: After owner reported running `gh auth login --web`, `gh auth status` still reported a keyring `github_pat_…`; neither `GH_TOKEN` nor `GITHUB_TOKEN` overrides it. `git fetch origin main` confirmed `59c034a` with the local branch two commits ahead; `git push -u origin main` again failed HTTP 403, no remote changes. Owner subsequently changed direction to delete the old GitHub repo rather than push the WIP. Verified exact target and ran `gh repo delete contactshawonhasan-oss/Monechai-website --yes`; API denied with HTTP 403 Resource not accessible by personal access token. Subsequent read confirmed it still exists. No Vercel project deletion was attempted (separate service). Local migration preserved; owner can delete via GitHub Settings/Danger Zone or grant suitable authorization before retry.

2026-10-08: At owner's request to check all GitHub repos, did a read-only `gh` inventory: owned and accessible lists agree on two public repos, `Monechai-website` and `fun-site`, both still present with unchanged latest commits (`59c034a`, `2a0cc94`). The current CLI credential now advertises `delete_repo` scope, unlike the earlier PAT, but no effective write/delete test or modification was made. Local `main` is `ff9cbf8` and remote Monechai remains `59c034a`. Owner subsequently explicitly chose replacing the existing repo with the current in-progress project, not deletion. Re-fetched remote `main` at `59c034a`; local `ff9cbf8` was 4 ahead/0 behind. Lint/typecheck/build passed; `npm test` 21 pass/7 DB skips without test DB. Tracked-file names/credential-pattern preflight found no likely secrets; `.env.example` holds placeholders. Next: normal fast-forward push, verify remote; no deployment readiness claim.

2026-10-08: Git push first failed locally because Git's global credential helper referenced removed `/home/shawon/.local/bin/gh`. `gh auth setup-git` repointed it to the installed Linuxbrew CLI; normal `git push -u origin main` fast-forwarded existing repo `59c034a`→`76475bc`. Verified identical Git remote and GitHub API SHA and inspected remote root containing `src/`, `public/`, Docker/docs and package files. No force push or deletion; `fun-site` untouched. This is a source publication, not a live Vercel/Supabase deployment; legacy HTML/assets stay tracked pending visual parity and goal 10 cleanup.

2026-10-08: Owner subsequently requested removal of the public GitHub repo entirely and creation of a new private same-name repo. Verified public target, clean local project and no tracked private env/obvious key signatures; `gh repo delete contactshawonhasan-oss/Monechai-website --yes` succeeded, GitHub API returned 404. Local checkout and old Git history remain intact temporarily. Created same-name repo with `gh repo create --private`, and GitHub API verified `private:true`, `visibility:private`, empty `size:0` before push. Reinitialized local `main` after moving old `.git` to a mode-700 temporary backup, staged 158 current project files. Initial new-root staged diff check found one trailing space in legacy `assets/js/app.js:24`; removed it and `git diff --cached --check` passed. Only placeholder `.env.example` is staged among environment-like paths, no credential-signature hits. Next commit/push fresh root, verify private/SHA/single-root history, then remove old `.git` backup. Vercel and public caches/clones are separate.

## Result

Pending final hardening and live deployment checks.
