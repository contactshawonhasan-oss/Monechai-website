# Monechai storefront

Next.js App Router + TypeScript storefront and admin, PostgreSQL/Drizzle catalog and inventory-safe COD checkout, Supabase Auth for explicit admin membership. The active application is **Next.js**; root `*.html` and `assets/js/*` are legacy design references, **not** an alternative checkout. Migration is **not complete**: see [goal index](docs/goals/GOAL_INDEX.md), [live task tracker](STATS.MD) and [architecture](ARCHITECTURE.md). Do not take production orders until blocked goals and owner setup are resolved.

## Local start

Requires Node 22, npm and PostgreSQL. Copy `.env.example` to `.env.local` and configure a **local** `DATABASE_URL`; set `DATABASE_SSL=disable` only on local DB. `.env.local` is ignored by git. Do not use a production database for local testing.

```sh
npm ci
# Export DATABASE_URL/DATABASE_SSL in your shell (Drizzle CLI reads process env)
npm run db:migrate
# Optional demo drafts for a disposable development DB only (never production)
npm run db:seed
npm run dev
```

Open http://localhost:3000; `/api/health` is 200 only when PostgreSQL connects and 503 otherwise. Demo products are deliberately unpublished and their external placeholder images cannot be published. To create real products, use `/admin` after the owner completes [Supabase first-admin bootstrap](docs/admin-bootstrap.md); real upload/publish flow is still in progress. Shipping fees must be configured with **owner-approved** values before checkout. No card/mobile-money integration exists: checkout is COD only.

Quality gates: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build`. See [testing](docs/testing.md) for isolated DB/browser setup and skip behavior; don't interpret skipped DB tests as passed integration coverage. `npm run db:generate` is for reviewed schema changes; `npm run db:migrate` applies checked-in migrations. `npm run shipping:configure` dry-runs when `SHIPPING_INSIDE_DHAKA_MINOR` and `SHIPPING_OUTSIDE_DHAKA_MINOR` are set to approved integer poisha amounts (optional `SHIPPING_FREE_ABOVE_MINOR`); `npm run shipping:configure -- --apply` writes both zones. Inspect values before applying.

## Deployment and operations

Read [VPS/Docker/Cloudflare runbook](docs/deployment.md), [backup and recovery](docs/backup-recovery.md), [admin setup](docs/admin-bootstrap.md) and [architecture/invariants](ARCHITECTURE.md). Docker builds a standalone Node image and uses managed DB; sample Nginx TLS proxy is at [`ops/nginx-monechai.conf`](ops/nginx-monechai.conf). Actual owner credentials, verified images/contact information, shipping rates and live Auth checks are still missing. No production deployment or restore has been verified.
