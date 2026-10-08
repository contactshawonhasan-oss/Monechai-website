# Monechai architecture (work in progress)

One Next.js 16 App Router / TypeScript **modular monolith**: `src/app` routes and layouts; `src/components` UI; `src/features/catalog`, `cart`, `checkout`, `admin` domain operations; `src/db/schema` and checked-in Drizzle SQL migrations; `src/i18n` translations; `src/lib` environment, shared utilities and Supabase clients; `src/proxy.ts` session refresh. PostgreSQL stores products, orders and settings; Supabase Auth provides identity; `admin_members` is the explicit authorization whitelist. Supabase Storage is intended for real product images (goal 06 incomplete). Managed PostgreSQL/Supabase is external to the VPS. See [deployment](docs/deployment.md) and [bootstrap](docs/admin-bootstrap.md).

## Data and request boundaries

- `catalog`: categories → products → variants (SKU, integer minor-unit price and stock) and images. Demo imports are drafts; only published products with real primary images should be publicly purchasable. Public queries page/filter on the server, not a client-side full-catalog download.
- `cart`: browser storage holds **variant IDs and quantities only**, never lasting customer PII or authoritative prices. The client preview is advisory.
- `checkout`: API validates customer input, stock, owner-configured shipping zone and server-side price. PostgreSQL transaction locks inventory and inserts order, item snapshots and idempotency record; duplicate keys return the existing order only for an identical request. Any failure rolls back and must not generate a success screen. Public success links use opaque tokens rather than sequential order IDs; they are sensitive and must not be logged.
- `orders`: immutable line snapshots preserve product name/SKU/attributes/unit and line amount after catalog edits; status and COD payment updates go through privileged admin functions with transition checks/history. Browser cannot choose status or mark orders paid. No bKash/Nagad gateway exists.
- `admin`: Supabase SSR cookies identify an Auth user; each privileged DB operation rechecks membership with server-only `requireAdmin()`, not just layout gating. The first member is bootstrapped through owner-only SQL; there is no public admin registration. DB migrations revoke direct API role access where applicable. Secrets belong only on the server.
- `media`: catalog storage keys reference the public `products` bucket; image CRUD/access policies and live upload verification remain unfinished (goal 06). Do not publish placeholder demo images as real products.
- `site`: `site_settings` hold verified business contact, support and SEO text; shipping fees live in `shipping_zones`, never in a client constant. EN/BN strings use `src/i18n` and localized catalog fields (goal 08 finishing audit).

## Deployment and observability

`Dockerfile` builds `.next/standalone` in Node 22; runtime uses a non-root user, with `.next/static` and `public` copied explicitly. Reverse proxy terminates TLS and keeps port 3000 private; `NEXT_PUBLIC_*` variables are build-time public values. Runtime `DATABASE_URL` is secret; migrations run separately with `DIRECT_URL`. `/api/health` checks DB connectivity and returns 200/503 without user data. Application logs should contain only event names, never PII or credentials. Single-instance deployment is the documented default; multiple instances need coordinated Next cache invalidation and server function keys. See [recovery](docs/backup-recovery.md) for DB **and** object backup obligations.

## Non-negotiable invariants

1. Client price, shipping and stock are not authoritative. Only the server computes totals and decrements stock.
2. Orders are transactional and idempotent; failed writes never yield success. Historical order item snapshots remain immutable.
3. Payment and order statuses cannot be arbitrarily set by a browser; COD is the only active payment method.
4. Admin authorization is enforced inside every server operation. A user session alone is insufficient.
5. Products are created/edited in admin without source edits. No secret is exposed in a client bundle, and customer PII is not stored permanently in localStorage.

This is an architecture record, not a sign-off: goals 05–09 still have open acceptance items; legacy static files are reference material only until parity work permits removal.
