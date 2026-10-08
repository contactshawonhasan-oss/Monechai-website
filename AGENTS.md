# AGENTS.md — Monechi E-commerce Rebuild Operating Rules

## Purpose

This repository is being migrated from a static HTML/CSS/vanilla-JavaScript storefront into a modular, database-backed, production-capable e-commerce application.

A large master prompt may be provided containing architecture, security, database, admin, checkout, payment, testing, deployment, and migration requirements.

DO NOT attempt to execute that entire prompt as one giant task.

Your first responsibility is to convert the master prompt into a clear set of ordered, persistent goal files and then work through them one goal at a time.

---

# 1. MASTER PROMPT DECOMPOSITION — REQUIRED FIRST STEP

When a large project prompt is provided:

1. Read it completely.
2. Read this `AGENTS.md`.
3. Inspect the repository and current project state.
4. Extract all requirements from the master prompt.
5. Group related requirements into implementation goals.
6. Create persistent goal files before starting major implementation.
7. Build a dependency order between the goals.
8. Start with the first unblocked goal only after the decomposition exists.

Do not rely on chat context alone to remember the project.

The repository files are the durable project memory.

---

# 2. REQUIRED PLANNING FILES

Create and maintain:

```text
docs/
└── goals/
    ├── GOAL_INDEX.md
    ├── goal_01_foundation.md
    ├── goal_02_catalog.md
    ├── goal_03_storefront.md
    ├── goal_04_cart_checkout.md
    ├── goal_05_admin_auth.md
    ├── goal_06_admin_catalog.md
    ├── goal_07_order_management.md
    ├── goal_08_i18n_seo_security.md
    ├── goal_09_testing.md
    └── goal_10_deployment_hardening.md
```

The exact number and names may change if the master prompt logically requires a different breakdown.

Use two-digit numbering so ordering remains stable:

```text
goal_01_...
goal_02_...
goal_03_...
```

Do not create arbitrary tiny goals just to increase file count.

A goal should represent a coherent implementation milestone.

---

# 3. GOAL_INDEX.md

`docs/goals/GOAL_INDEX.md` is the high-level execution map.

It must contain:

- project objective
- ordered list of all goals
- one-sentence description of each goal
- dependencies between goals
- status for each goal
- blocked/unblocked state
- credentials or external access required
- current active goal
- next goal

Use status markers such as:

```text
NOT_STARTED
IN_PROGRESS
BLOCKED
DONE
```

Example:

```markdown
| Goal | Status | Depends on | Description |
|---|---|---|---|
| goal_01_foundation | IN_PROGRESS | — | Scaffold Next.js, DB, environment validation |
| goal_02_catalog | NOT_STARTED | goal_01 | Product/category schema and migration |
| goal_03_storefront | NOT_STARTED | goal_02 | Rebuild current storefront as reusable blocks |
```

Update this file whenever a goal changes state.

---

# 4. REQUIRED FORMAT FOR EVERY GOAL FILE

Every `goal_XX_*.md` file must contain these sections.

## Goal

A short description of the milestone.

## Why this exists

Explain what problem this goal solves.

## Requirements from the master prompt

Copy/summarize every relevant requirement from the master prompt so nothing is lost.

## Scope

Explicitly state what is included.

## Out of scope

Explicitly state what belongs to later goals.

## Dependencies

List earlier goals/files/services that must already exist.

## External requirements

List anything that might require:

- API keys
- tokens
- Supabase access
- Cloudflare access
- VPS access
- GitHub authorization
- payment credentials
- DNS access
- external tools
- MCP servers

If nothing is needed, state:

```text
None.
```

## Files expected to change

List the likely project areas/files.

This is allowed to evolve while working.

## Implementation checklist

Use checkboxes.

Example:

```markdown
- [ ] Add PostgreSQL connection
- [ ] Add Drizzle
- [ ] Add schema
- [ ] Add migration scripts
- [ ] Add environment validation
- [ ] Verify production build
```

## Validation / tests

Specify the commands or behaviors that prove the goal works.

## Definition of done

State the exact completion conditions.

## Work log

Record important implementation decisions and discoveries.

Do not fill this section with every trivial shell command.

## Result

When complete, summarize:

- what changed
- tests executed
- results
- remaining limitations
- any follow-up moved to another goal

---

# 5. DECOMPOSITION QUALITY RULES

When converting the master prompt into goals:

Do not lose requirements.

Do not silently simplify requirements.

Do not put the same requirement into five different goals unless there is a real cross-cutting dependency.

Place each requirement primarily under one owning goal.

Reference another goal where necessary rather than duplicating entire instructions.

The goal set together must cover the entire master prompt.

Before implementation begins, perform a coverage pass:

> Can every meaningful requirement in the master prompt be mapped to at least one goal file?

If not, fix the goal structure first.

---

# 6. DEFAULT GOAL BREAKDOWN FOR THIS PROJECT

Unless repository inspection reveals a better ordering, use approximately this structure.

## goal_01_foundation

Owns:

- Next.js App Router scaffold
- TypeScript
- package manager
- project structure
- base styling migration
- environment validation
- PostgreSQL connection
- Drizzle setup
- migration tooling
- Supabase base configuration boundaries
- health endpoint
- quality-gate scripts

## goal_02_catalog

Owns:

- categories
- products
- variants
- product images
- inventory model
- money representation
- schema constraints/indexes
- migration of current `products.js`
- development seed
- catalog query layer

## goal_03_storefront

Owns:

- homepage blocks
- shop
- product details
- reusable commerce components
- search
- filters
- sorting
- pagination
- responsive migration
- preservation of black/gold design

## goal_04_cart_checkout

Owns:

- guest cart
- authoritative server pricing
- shipping service
- checkout validation
- order schema/details
- order-item snapshots
- transactional order creation
- inventory updates
- idempotency
- COD
- order success flow
- safe public order token

## goal_05_admin_auth

Owns:

- Supabase Auth
- admin login
- `admin_members`
- authorization middleware/helpers
- first-admin bootstrap
- protected admin layout

## goal_06_admin_catalog

Owns:

- product CRUD
- category CRUD
- variants
- prices
- inventory
- product image upload/storage
- publish/unpublish
- featured products
- localized product fields

## goal_07_order_management

Owns:

- admin order list
- order detail
- order statuses
- payment statuses
- valid status transitions
- order status history if implemented
- business settings needed for order operations

## goal_08_i18n_seo_security

Owns:

- English/Bangla structure
- structured dictionaries/localized fields
- metadata
- sitemap
- robots
- Product JSON-LD
- security headers
- public checkout abuse protection
- PII/logging review
- fake business claim cleanup
- WhatsApp configuration cleanup

## goal_09_testing

Owns:

- unit tests
- integration tests
- Playwright
- checkout happy path
- invalid checkout
- out-of-stock behavior
- idempotency test
- regression checks
- mobile/desktop verification

## goal_10_deployment_hardening

Owns:

- production build
- standalone output if appropriate
- Dockerfile
- reverse-proxy example
- Cloudflare/VPS deployment docs
- Supabase production notes
- backup/recovery documentation
- README
- ARCHITECTURE.md
- final cleanup of legacy runtime
- final quality-gate run

This is the default, not a prison.

Change it if repository reality makes another structure clearly better.

---

# 7. ONE ACTIVE GOAL AT A TIME

Avoid working on unrelated goals simultaneously.

At any moment there should normally be one `IN_PROGRESS` goal.

Finish it, validate it, update the documentation, then move forward.

Exceptions are allowed only when:

- a small dependency must be fixed,
- a test exposes a cross-cutting bug,
- a goal is blocked on credentials but another independent goal can proceed.

If that happens, document the reason in `GOAL_INDEX.md`.

---

# 8. DO NOT DO A GIANT ONE-SHOT REWRITE

Do not attempt to generate the entire new project in one uncontrolled change.

Prefer working milestones that leave the repository in a coherent state.

For each goal:

1. inspect relevant existing code,
2. implement,
3. run tests/quality gates,
4. fix failures,
5. update the goal file,
6. update `GOAL_INDEX.md`,
7. proceed to the next goal.

---

# 9. CREDENTIAL / TOKEN / LOGIN RULE

If a goal requires credentials or user-owned access, do not invent values.

Examples:

- database URL
- Supabase URL/key
- Supabase service-role key
- Cloudflare API token
- VPS SSH access
- DNS credentials
- payment merchant credentials
- GitHub authorization
- storage secrets
- webhook secrets

If required, tell the user exactly:

1. what is needed,
2. why it is needed,
3. where to obtain it,
4. the exact environment-variable name,
5. whether the value is public or secret.

Example:

```text
Needed: SUPABASE_SERVICE_ROLE_KEY
Purpose: server-side privileged storage/admin operation
Where: Supabase Dashboard → Project Settings → API
Visibility: SECRET — never expose through NEXT_PUBLIC_*
```

Mark the affected checklist item as blocked.

Do not stop the entire migration if independent work can continue.

---

# 10. TOOL / MCP INSTALLATION RULE

You may install tools necessary to complete the migration.

When a useful tool, CLI, package, browser dependency, or MCP integration is missing:

1. search current official documentation,
2. prefer the official vendor tool/integration,
3. verify maintenance/relevance,
4. install it if allowed,
5. document meaningful setup in the relevant goal file.

Do not install unknown MCP servers just because they appear in a search result.

Prefer official or strongly reputable sources.

If a tool requires account authorization, login, token, or API key, ask the user according to the credential rule.

Examples of tools that may be appropriate:

- Supabase CLI
- Drizzle Kit
- Playwright
- Docker
- GitHub tooling
- Cloudflare tooling
- official MCP servers/integrations

Do not add tools that provide no meaningful benefit.

---

# 11. INTERNET RESEARCH RULE

For rapidly changing APIs and tooling, verify current official documentation.

Especially verify current behavior for:

- Next.js
- React
- Supabase
- Drizzle
- Playwright
- Node.js
- Docker
- Cloudflare
- payment APIs
- MCP integrations

Prefer official docs and official repositories.

Do not blindly implement an old tutorial.

Record significant version/API decisions in the relevant goal work log.

---

# 12. PROJECT MEMORY

Maintain both root-level files:

```text
MIGRATION_STATUS.md
STATS.MD
```

`MIGRATION_STATUS.md` is the concise session resume point. `STATS.MD` is the live task tracker: what was finished, what is being worked on, checks actually run, blockers, credentials and the exact next actions. The detailed milestone history belongs in `docs/goals/`.

**Update `STATS.MD` immediately after every finished task**, even when a larger goal remains in progress or the task only changed documentation. Do not wait until the end of the session. Record partial or failed validation honestly and set the next concrete action. Keep it synchronized with `MIGRATION_STATUS.md` and the active goal file; when a goal changes state, update `GOAL_INDEX.md` too.

Keep `MIGRATION_STATUS.md` concise.

It should contain:

```text
Current goal:
Last completed goal:
Current branch/important state:
Credentials currently needed:
Known blockers:
Last quality gates run:
Next action:
```

These files are durable project memory for future agents, alongside `docs/goals/`.

---

# 13. SESSION START PROTOCOL

At the beginning of every new agent/Codex session:

Read, in this order:

1. `AGENTS.md`
2. `STATS.MD`
3. `MIGRATION_STATUS.md`
4. `docs/goals/GOAL_INDEX.md`
5. current active goal file
6. relevant code

Then inspect git status.

Do not restart the architecture from scratch.

Continue the existing goal unless there is a documented reason not to.

---

# 14. SESSION END PROTOCOL

Before ending a substantial work session:

Update:

- `STATS.MD` after each finished task, not only at session end
- active goal checklist
- active goal work log/result if relevant
- `GOAL_INDEX.md`
- `MIGRATION_STATUS.md`

Record:

- what was completed
- tests actually run
- current failures/blockers
- credentials needed
- exact next action

Never leave the next agent guessing what happened.

---

# 15. TESTING RULE

A checklist item is not done merely because code was written.

Run the appropriate validation.

Depending on the goal this may include:

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

or the equivalent package-manager commands.

Only mark a test as passed if it actually ran successfully.

If the environment prevents a test, record that explicitly.

---

# 16. BUILD RULE

Keep the project buildable at goal boundaries whenever reasonably possible.

The final project must pass the production build.

Do not solve failures by broadly disabling:

- TypeScript checks
- ESLint rules
- security validation

Fix the underlying issue.

---

# 17. ARCHITECTURE RULES

The target system is a modular monolith.

Do NOT introduce without a proven current need:

- microservices
- Kubernetes
- Kafka
- RabbitMQ
- Redis
- Elasticsearch
- event sourcing
- CQRS
- separate API application
- separate admin application
- complicated monorepo orchestration

Use simple, boring architecture.

The intended stack is broadly:

```text
Next.js
TypeScript
PostgreSQL
Drizzle
Supabase Auth
Supabase Storage
```

The application must remain deployable to an ordinary Linux/Node.js VPS.

---

# 18. COMMERCE INVARIANTS

Never violate these:

1. Client prices are not authoritative.
2. Client shipping totals are not authoritative.
3. Client stock state is not authoritative.
4. Payment status cannot be set by the browser.
5. Order status cannot be arbitrarily set by the browser.
6. Order creation must be transactional.
7. Order creation must be protected against duplicate submissions.
8. Order-item snapshots are immutable historical purchase data.
9. Admin authorization is checked server-side.
10. Product creation must not require editing application source.
11. Customer PII must not be stored permanently in browser localStorage.
12. A failed database order must never produce a fake success page.
13. Secrets must never enter client bundles.
14. Fake bKash/Nagad integrations must not be shipped as real payment functionality.

---

# 19. CURRENT UI AS REFERENCE

The existing static site is a design/UX reference.

Preserve useful pieces such as:

- black/gold identity
- logo
- responsive design
- categories
- product cards
- cart drawer
- simple checkout
- English/Bangla concept
- WhatsApp access

Do not preserve bad architecture merely to preserve appearance.

---

# 20. REQUIREMENT COVERAGE AUDIT

After creating all goal files, create a section at the bottom of `GOAL_INDEX.md` called:

```markdown
## Master Prompt Coverage
```

Map major master-prompt areas to their owner goal.

Example:

```markdown
- Database schema → goal_02_catalog
- Existing product migration → goal_02_catalog
- Server-authoritative checkout → goal_04_cart_checkout
- Supabase admin authentication → goal_05_admin_auth
- Product CRUD → goal_06_admin_catalog
- Order management → goal_07_order_management
- SEO → goal_08_i18n_seo_security
- Playwright → goal_09_testing
- Docker/VPS → goal_10_deployment_hardening
```

If any major requirement cannot be mapped, decomposition is incomplete.

Fix it before substantial implementation.

---

# 21. FIRST RESPONSE TO A NEW MASTER PROMPT

When the user provides the large master project prompt, do not immediately start changing random files.

Your first work should be:

1. acknowledge the master objective briefly,
2. inspect the repository,
3. generate/update the goal decomposition,
4. create `GOAL_INDEX.md`,
5. create all required `goal_XX_*.md` files,
6. create/update `MIGRATION_STATUS.md` and `STATS.MD`,
7. report the resulting goal structure,
8. begin `goal_01` if it is not blocked.

Do not ask for confirmation merely to proceed.

Only ask when a credential, external authorization, or true irreversible business decision is required.

---

# 22. COMPLETION

The master project is complete only when every required goal is `DONE`.

Before final completion:

- review the master prompt again,
- review `Master Prompt Coverage`,
- verify nothing was dropped,
- run final quality gates,
- verify the production build,
- verify documentation,
- verify no secrets are committed,
- verify no obsolete static implementation remains active.

Then provide the user with a concise final report.

Do not declare the entire project complete while any required goal remains unfinished or blocked.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
