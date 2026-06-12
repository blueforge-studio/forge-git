# Drizzle + Postgres for forge-git metadata — Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this spec. Steps use checkbox (`- [ ]`) syntax for tracking.

**Date:** 2026-06-12
**Status:** Approved (pending implementation)
**Sub-project:** 1 of ~11 in the AUDIT.md priority list
**Scope:** Orgs + members persistence (write-through). Workflows and previews are deferred to sub-project 2.

## Goal

Persist forge-git org and member metadata to Postgres via Drizzle ORM, mirroring it as a side-effect of Gitea writes. Gitea remains the source of truth for orgs/members; the DB is a write-through mirror that holds forge-git-specific metadata (and will power the deploy-runner in sub-project 2).

## Why now

The audit identifies that orgs created in forge-git don't persist beyond the Gitea org, and that Postgres (already in docker-compose) is unused. The Drizzle scaffolding is partially in place (`apps/web/src/lib/{db,schema}.ts`, `apps/web/drizzle/`, scripts in `package.json`) but the metadata side is empty and the package is in the wrong place for `deploy-runner` to consume.

## Architecture

### Package extraction

Move the existing Drizzle scaffolding from `apps/web` into a new workspace package `packages/db`. The package owns:

- **Schema** (Drizzle table definitions)
- **Client** (the `pg.Pool` + `drizzle()` wrapper, migration runner)
- **Domain query modules** (orgs, members, users)
- **Auth adapter** (the existing `forgeAuthAdapter` for `@blueforge-studio/auth-session`)

`apps/web` and `packages/deploy-runner` both depend on `@forge-git/db` (the latter in sub-project 2).

### Package layout

```
packages/db/
├── package.json
├── tsconfig.json
├── drizzle.config.ts
├── drizzle/
│   ├── 0000_eager_captain_flint.sql        # moved from apps/web
│   ├── 0001_add_gitea_ids.sql              # new
│   ├── 0002_drop_error_tables.sql          # new
│   └── meta/
│       ├── _journal.json
│       ├── 0000_snapshot.json
│       ├── 0001_snapshot.json
│       └── 0002_snapshot.json
├── src/
│   ├── index.ts             # re-exports public API
│   ├── schema.ts            # Drizzle table definitions
│   ├── client.ts            # getDb(), getPool(), runMigrations()
│   ├── orgs.ts              # listOrgs, getOrgByName, getOrgByGiteaId, upsertOrgByGiteaId, deleteOrgByName
│   ├── members.ts           # listMembers, addMember, removeMember
│   ├── users.ts             # findOrCreateUserByGiteaLogin, findOrCreateUserByGiteaId, getUserGiteaToken
│   └── auth-adapter.ts      # forgeAuthAdapter
└── __tests__/
    ├── client.test.ts       # mocks pg + drizzle; tests runMigrations
    ├── orgs.test.ts         # mocks NodePgDatabase; tests orgs.ts functions
    ├── members.test.ts      # same for members
    └── integration/
        ├── orgs.integration.test.ts      # real Postgres via Docker
        └── members.integration.test.ts   # real Postgres via Docker
```

### Public API (re-exported from `packages/db/src/index.ts`)

```ts
export * from './client'    // getDb, getPool, runMigrations
export * from './schema'    // forgeUsers, forgeOrgs, forgeMembers, forgeWorkflows, forgePreviews
export * from './orgs'      // listOrgs, getOrgByName, getOrgByGiteaId, upsertOrgByGiteaId, deleteOrgByName, Org
export * from './members'   // listMembers, addMember, removeMember, Member
export * from './users'     // findOrCreateUserByGiteaLogin, findOrCreateUserByGiteaId, getUserGiteaToken
export * from './auth-adapter'  // forgeAuthAdapter
```

## Schema

### Existing tables (unchanged in shape, moved to `packages/db/src/schema.ts`)

```ts
forgeUsers       (id, name, email, passwordHash, avatarUrl, giteaToken, giteaUsername, createdAt, updatedAt)
forgeOrgs        (id, giteaOrg, displayName, description, createdAt, updatedAt)
forgeMembers     (orgId, userId, role)        // composite PK
forgeWorkflows   (id, repoId, orgId, name, yaml, enabled, createdAt, updatedAt)  // unused in sub-project 1
forgePreviews    (id, repoId, prNumber, url, status, createdAt, updatedAt)      // unused in sub-project 1
```

### Schema changes

**Add `gitea_id` columns** to align with gitea-bridge types and support both lookup paths:

- `forge_orgs.gitea_id: integer NOT NULL UNIQUE` — Gitea's numeric org id. The `gitea_org` text column stays as the natural key (most Gitea API endpoints use the org name).
- `forge_users.gitea_user_id: integer` (nullable, no unique constraint — we may not have it on insert during early user creation). We DO add an index for the `findOrCreateUserByGiteaId` lookup path.

**Drop the two error tables** (no consumers, no UI, no API):

- Remove `errorGroups` and `errorEvents` from `schema.ts`
- Add a migration that drops the tables

**`forge_workflows.yaml`** column stays as-is. In sub-project 1 we don't use it (the audit decision: repo YAML wins, DB is metadata-only). It's left in place for sub-project 2 to either use or drop.

### Migrations

**`0000_eager_captain_flint.sql`** — moved verbatim from `apps/web/drizzle/`. The `meta/_journal.json` and `meta/0000_snapshot.json` are regenerated by `drizzle-kit generate` on first run in the new location.

**`0001_add_gitea_ids.sql`** (generated by `drizzle-kit generate`):
```sql
ALTER TABLE "forge_orgs" ADD COLUMN "gitea_id" integer NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "forge_orgs_gitea_id_unique" ON "forge_orgs" USING btree ("gitea_id");
--> statement-breakpoint
ALTER TABLE "forge_users" ADD COLUMN "gitea_user_id" integer;
--> statement-breakpoint
CREATE INDEX "forge_users_gitea_user_id_idx" ON "forge_users" USING btree ("gitea_user_id");
```

**`0002_drop_error_tables.sql`** (generated by `drizzle-kit generate`):
```sql
DROP TABLE IF EXISTS "error_events";
--> statement-breakpoint
DROP TABLE IF EXISTS "error_groups";
```

**Migration runner:** `runMigrations()` in `client.ts` calls Drizzle's `migrate()` against `./drizzle` (resolved relative to the package). The function is idempotent (module-level `migrated` flag). All first-time DB access through `getDb()` ensures the schema is current.

## Data flow

### Write-through (the new pattern)

When a server action writes to Gitea, it also writes to the DB. The Gitea call is first because it's the source of truth; the DB write happens only on Gitea success.

**`createOrgAction`** in `apps/web/src/app/organizations/actions.ts`:
1. Validate input (existing)
2. `createOrg(data, session)` via gitea-bridge → Gitea returns the new org with `id` (numeric) and `username` (name)
3. `await upsertOrgByGiteaId(db, { giteaId: result.id, giteaOrg: result.username, displayName: result.full_name ?? null, description: result.description ?? null })`
4. `revalidatePath('/organizations')` + `redirect('/organizations')` (existing)

**`addMemberAction`**:
1. Validate
2. `addOrgMember(org, username, session)` via gitea-bridge
3. Look up the user's Gitea profile via gitea-bridge's `getUser(username)` (returns `{ id, login, email, ... }`)
4. `findOrCreateUserByGiteaId({ giteaUserId: profile.id, username, email: profile.email })` to ensure a `forge_users` row exists (uses a separate function from the OAuth-login `findOrCreateUserByGiteaLogin` because that one overwrites `giteaToken`; the member-add path doesn't have a token)
5. `addMember(db, { orgName, userId: forgeUsers.id, role })`
6. `revalidatePath('/organizations/[name]')`

**`removeMemberAction`**:
1. Validate
2. `removeOrgMember(org, username, session)` via gitea-bridge
3. Look up the user's Gitea id via gitea-bridge's `getUser(username)`, then `findOrCreateUserByGiteaId` to get the `forge_users.id`
4. `removeMember(db, { orgName, userId })`
5. `revalidatePath('/organizations/[name]')`

**`editOrgAction`**:
1. Validate
2. `updateOrg(org, data, session)` via gitea-bridge
3. `getOrgByName(db, org)` to find the row, then patch displayName/description fields
4. `revalidatePath('/organizations/[name]')` + `redirect('/organizations/[name]')`

**`deleteOrgAction`**:
1. Validate
2. Direct Gitea API call (existing inline fetch — `DELETE /api/v1/orgs/[name]`)
3. `deleteOrgByName(db, orgName)` → cascade-deletes `forge_members` via FK
4. `revalidatePath('/organizations')` + `redirect('/organizations')`

### Failure modes

- **Gitea succeeds, DB fails:** Log via `console.error`, surface a non-blocking warning. Don't fail the user action. Architecture supports a future resync (out of scope for sub-project 1).
- **Gitea fails:** Action fails as today. No DB write.
- **DB read fails on listOrgs:** Not applicable in sub-project 1 — the web app's `/organizations` page still uses gitea-bridge for reads, not the DB.

### Reads (unchanged in sub-project 1)

The web app's `/organizations` page continues to call `listOrgs()` from gitea-bridge. The DB is populated by writes only; reads from the DB happen only via the new API routes.

## API routes

### `GET /api/orgs`

Returns `{ orgs: Org[] }` from `listOrgs(db)`. Requires session. No Gitea lookup.

```
apps/web/src/app/api/orgs/route.ts
```

### `GET /api/orgs/[name]/members`

Returns `{ members: Member[] }` from `listMembers(db, name)`. Requires session. Returns 404 if org not in DB.

```
apps/web/src/app/api/orgs/[name]/members/route.ts
```

These routes are not consumed by the web app in sub-project 1. They exist for the deploy-runner (sub-project 2) and to keep the API surface symmetric with gitea-bridge's read functions.

## Configuration

### `packages/db/package.json`

```json
{
  "name": "@forge-git/db",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./client": "./src/client.ts",
    "./schema": "./src/schema.ts",
    "./orgs": "./src/orgs.ts",
    "./members": "./src/members.ts",
    "./users": "./src/users.ts",
    "./auth-adapter": "./src/auth-adapter.ts"
  },
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:migrate": "drizzle-kit migrate"
  },
  "dependencies": {
    "drizzle-orm": "^0.45.2",
    "pg": "^8.x"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.10",
    "@types/pg": "^8.x",
    "typescript": "^5.5.0",
    "vitest": "^4.1.0"
  },
  "peerDependencies": {
    "@blueforge-studio/auth-session": ">=0.1.0"
  }
}
```

### `packages/db/drizzle.config.ts`

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://forge:forge@localhost:5432/forge-git',
  },
})
```

### `apps/web/package.json` changes

- Remove: `drizzle-orm`, `drizzle-kit`, `db:generate`, `db:push`, `db:migrate`
- Add: `"@forge-git/db": "workspace:*"`

### Docker-compose change

Drop the init-db volume mount in `docker-compose.yml`:

```yaml
# REMOVE these lines from the postgres service:
volumes:
  - postgres-data:/var/lib/postgresql/data
  - ./docker/init-db:/docker-entrypoint-initdb.d   # <-- remove this line
```

Delete `docker/init-db/01-schema.sql` (the older hand-rolled init script).

## Error handling

- **DB write failures** in the action handlers are logged but not surfaced as user-blocking errors. The Gitea operation succeeded; the DB is a mirror.
- **DB read failures** in the new API routes return 500 with a JSON `{ error: 'database_unavailable' }` body.
- **Missing DB connection** (e.g., the user runs `pnpm dev` without `docker compose up`): `getDb()` will throw when first called. The web app's existing try/catch around the Gitea calls doesn't catch DB errors (since they happen after the Gitea call returns), so the user will see a 500. Acceptable for sub-project 1 — the dev workflow is "start docker first."

## Testing

### Unit tests (no DB, fast)

- `client.test.ts` — moved from `apps/web/src/__tests__/lib/db.test.ts`. Mocks `pg.Pool` and `drizzle-orm/node-postgres`. Verifies `runMigrations()` runs once, `getPool()` returns a Pool.
- `orgs.test.ts` — mocks `NodePgDatabase`. Verifies:
  - `listOrgs` calls `db.select().from(forgeOrgs).orderBy(forgeOrgs.createdAt)`
  - `getOrgByName('foo')` calls `db.select().from(forgeOrgs).where(eq(forgeOrgs.giteaOrg, 'foo')).limit(1)`
  - `upsertOrgByGiteaId({...})` calls `db.insert(forgeOrgs).values({...}).onConflictDoUpdate({ target: forgeOrgs.giteaId, set: {...} }).returning()`
  - `deleteOrgByName('foo')` calls `db.delete(forgeOrgs).where(eq(forgeOrgs.giteaOrg, 'foo'))`
- `members.test.ts` — same pattern. Verifies the join with `forgeOrgs` to resolve `orgName → orgId`.

### Integration tests (require Docker Postgres, gated)

- `integration/orgs.integration.test.ts` — uses a real `pg` connection to `process.env.INTEGRATION_DB_URL`. Runs migrations on test setup. Tests the full upsert / list / get / delete cycle.
- `integration/members.integration.test.ts` — same. Tests the FK cascade on `forge_members` when an org is deleted.

Both files start with:
```ts
const INTEGRATION_DB_URL = process.env.INTEGRATION_DB_URL
const itIf = INTEGRATION_DB_URL ? it : it.skip
```

The integration tests are run via:
```bash
INTEGRATION_DB_URL=postgresql://forge:forge@localhost:5432/forge-git_test pnpm --filter @forge-git/db test
```

A docker-compose override (`.docker-compose.test.yml` or a `Makefile` target) starts the test DB on a separate port, runs migrations, runs the tests, tears down.

### Wire-up tests (apps/web)

- `apps/web/src/__tests__/app/organizations/actions.test.ts` — mocks gitea-bridge and `@forge-git/db/{orgs,members,users}`. Verifies:
  - `createOrgAction` calls both `createOrg` (gitea) AND `upsertOrgByGiteaId` (db)
  - If `upsertOrgByGiteaId` throws, the action still returns the success redirect
  - `addMemberAction` calls `getUser` (gitea), `findOrCreateUserByGiteaLogin`, and `addMember`
  - `deleteOrgAction` calls both the Gitea DELETE and `deleteOrgByName`

## Out of scope (deferred)

The following are explicitly **not** in sub-project 1. They become sub-projects 2-11 in the audit priority order.

- **Sub-project 2:** Workflows + Previews persistence (DB-backed YAML overrides, PR-driven previews, deploy-runner integration)
- **Sub-project 3:** Read caching (DB-backed reads in `/organizations` and `/repositories` with TTL)
- **Sub-project 4:** Auth backend (replace proxy-only auth with `forge_users` + JWT + expiry)
- **Sub-projects 5-11:** deploy-runner expansion, Redis caching, loading/error boundaries, UI primitives, CLI/API tests, fork/star/watch, compare/diff, admin panel, preview envs, API docs

Specific items deferred:
- No changes to the session shape (no `forgeUserId` on the session)
- No changes to `forge_workflows` schema or consumers
- No changes to `forge_previews` schema or consumers
- No changes to `packages/deploy-runner` (it doesn't import `@forge-git/db` yet)
- The web app's `/organizations` page still calls gitea-bridge for reads (no read caching in sub-project 1)
- Error tables are dropped, not migrated to a new package
- The 2 API routes added in sub-project 1 are unused by the web app (they're for the deploy-runner in sub-project 2)

## File manifest

**Created (15 files):**

| File | Purpose |
|---|---|
| `packages/db/package.json` | Workspace package manifest |
| `packages/db/tsconfig.json` | TS config |
| `packages/db/drizzle.config.ts` | Drizzle Kit config |
| `packages/db/drizzle/0001_add_gitea_ids.sql` | Add gitea_id columns |
| `packages/db/drizzle/0002_drop_error_tables.sql` | Drop error tables |
| `packages/db/src/index.ts` | Public re-exports |
| `packages/db/src/orgs.ts` | Org query functions |
| `packages/db/src/members.ts` | Member query functions |
| `packages/db/__tests__/orgs.test.ts` | Org unit tests |
| `packages/db/__tests__/members.test.ts` | Member unit tests |
| `packages/db/__tests__/integration/orgs.integration.test.ts` | Real-Postgres org tests |
| `packages/db/__tests__/integration/members.integration.test.ts` | Real-Postgres member tests |
| `apps/web/src/app/api/orgs/route.ts` | GET /api/orgs |
| `apps/web/src/app/api/orgs/[name]/members/route.ts` | GET /api/orgs/[name]/members |
| `apps/web/src/__tests__/app/organizations/actions.test.ts` | Write-through action tests |

**Moved (4 files):**

| From | To |
|---|---|
| `apps/web/src/lib/schema.ts` | `packages/db/src/schema.ts` |
| `apps/web/src/lib/db.ts` | `packages/db/src/{client,users,auth-adapter}.ts` |
| `apps/web/drizzle.config.ts` | `packages/db/drizzle.config.ts` |
| `apps/web/drizzle/0000_eager_captain_flint.sql` | `packages/db/drizzle/0000_eager_captain_flint.sql` |
| `apps/web/src/__tests__/lib/db.test.ts` | `packages/db/__tests__/client.test.ts` |

**Modified (3 files):**

| File | Change |
|---|---|
| `apps/web/package.json` | Remove drizzle deps/scripts; add `@forge-git/db` |
| `apps/web/src/app/organizations/actions.ts` | Add write-through calls to all 5 actions |
| `docker-compose.yml` | Drop init-db volume mount |
| `AUDIT.md` | Update "What's Missing" section to reflect sub-project 1 done |

**Deleted (5 files):**

| File | Reason |
|---|---|
| `apps/web/src/lib/db.ts` | Replaced by `packages/db/src/{client,users,auth-adapter}.ts` |
| `apps/web/src/lib/schema.ts` | Replaced by `packages/db/src/schema.ts` |
| `apps/web/drizzle.config.ts` | Replaced by `packages/db/drizzle.config.ts` |
| `apps/web/drizzle/` | Replaced by `packages/db/drizzle/` |
| `apps/web/src/__tests__/lib/db.test.ts` | Replaced by `packages/db/__tests__/client.test.ts` |
| `docker/init-db/01-schema.sql` | Drizzle is the source of truth |

## Risks & mitigations

- **Docker not running during dev:** The web app's org actions will fail at the DB call. Mitigation: a `dev:full` script that starts Docker before `pnpm dev` (already exists at the root).
- **Schema drift between `schema.ts` and the migration files:** Drizzle Kit's `db:generate` enforces this. The workflow is: edit `schema.ts`, run `pnpm db:generate`, commit the generated migration.
- **Type drift between `gitea-bridge` and `@forge-git/db`:** The `ForgeGitOrg` type in gitea-bridge has `giteaId: number`. The DB's `Org` type now has `gitea_id: number` AND `gitea_org: text`. A future sub-project may add a converter (`bridgeToDb()` / `dbToBridge()`). Out of scope for sub-project 1.
- **Test isolation in integration tests:** Each test should wrap in a transaction that gets rolled back, OR use a separate schema per test run. The simplest is a transaction wrapper.

## Open questions for implementation

- None at design time. All design questions resolved during brainstorming (write-through, store both name + numeric id, extract to packages/db, repo YAML wins, strip error tables, drop init SQL, orgs + members only).
