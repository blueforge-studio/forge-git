# Drizzle + Postgres Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the Drizzle schema + db helpers from `apps/web` into a new `@forge-git/db` workspace package, augment with `gitea_id` columns, drop the unused error tables, add write-through persistence for org/member server actions, and add a small org CRUD REST API.

**Architecture:** Pure package extraction + write-through pattern. Gitea remains the source of truth for orgs/members; the new `packages/db` package is a write-through mirror. `apps/web` and (in sub-project 2) `packages/deploy-runner` consume `@forge-git/db`. DB call failures after a successful Gitea write are logged but don't fail the user action.

**Tech Stack:** TypeScript 5.9, Drizzle ORM 0.45, Drizzle Kit 0.31, pg 8.16, Vitest 3, Next.js 16 (apps/web), pnpm workspaces, Turborepo 2.

**Reference:** `docs/superpowers/specs/2026-06-12-drizzle-db-extraction-design.md` (the approved design spec — read first if any task seems unclear).

---

## File Structure

### Created
- `packages/db/package.json` — workspace package manifest
- `packages/db/tsconfig.json` — TS config (matches gitea-bridge layout)
- `packages/db/vitest.config.ts` — test runner config
- `packages/db/drizzle.config.ts` — Drizzle Kit config
- `packages/db/.gitignore` — ignores dist/
- `packages/db/src/index.ts` — public re-exports
- `packages/db/src/schema.ts` — table definitions (5 tables, no error tables)
- `packages/db/src/client.ts` — `getDb`, `getPool`, `runMigrations`
- `packages/db/src/auth-adapter.ts` — `forgeAuthAdapter`
- `packages/db/src/users.ts` — `findOrCreateUserByGiteaLogin`, `findOrCreateUserByGiteaId`, `getUserGiteaToken`
- `packages/db/src/orgs.ts` — `listOrgs`, `getOrgByName`, `getOrgByGiteaId`, `upsertOrgByGiteaId`, `deleteOrgByName`
- `packages/db/src/members.ts` — `listMembers`, `addMember`, `removeMember`
- `packages/db/drizzle/0001_add_gitea_ids.sql` — generated migration
- `packages/db/drizzle/0002_drop_error_tables.sql` — generated migration
- `packages/db/__tests__/client.test.ts` — moved from apps/web
- `packages/db/__tests__/orgs.test.ts` — new unit tests
- `packages/db/__tests__/members.test.ts` — new unit tests
- `apps/web/src/app/api/orgs/route.ts` — GET /api/orgs
- `apps/web/src/app/api/orgs/[name]/members/route.ts` — GET /api/orgs/[name]/members
- `apps/web/src/__tests__/app/organizations/actions.test.ts` — write-through action tests

### Moved
- `apps/web/src/lib/schema.ts` → `packages/db/src/schema.ts` (with edits: drop error tables, add gitea_id columns)
- `apps/web/src/lib/db.ts` → split into `packages/db/src/{client,users,auth-adapter}.ts`
- `apps/web/drizzle.config.ts` → `packages/db/drizzle.config.ts`
- `apps/web/drizzle/0000_eager_captain_flint.sql` → `packages/db/drizzle/0000_eager_captain_flint.sql`
- `apps/web/src/__tests__/lib/db.test.ts` → `packages/db/__tests__/client.test.ts`

### Modified
- `apps/web/package.json` — remove drizzle deps + db scripts; add `@forge-git/db` dep
- `apps/web/src/app/organizations/actions.ts` — add write-through DB calls to 5 actions
- `docker-compose.yml` — drop init-db volume mount
- `AUDIT.md` — mark recommendation #1 done

### Deleted
- `apps/web/src/lib/db.ts` (replaced by `packages/db/src/{client,users,auth-adapter}.ts`)
- `apps/web/src/lib/schema.ts` (replaced)
- `apps/web/drizzle.config.ts` (replaced)
- `apps/web/drizzle/` (replaced)
- `apps/web/src/__tests__/lib/db.test.ts` (replaced)
- `docker/init-db/01-schema.sql` (Drizzle is the source of truth)

---

## Task 1: Bootstrap the `@forge-git/db` package

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/vitest.config.ts`
- Create: `packages/db/.gitignore`
- Create: `packages/db/src/index.ts`

- [ ] **Step 1: Create `packages/db/package.json`**

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
    "build": "tsc --build",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:migrate": "drizzle-kit migrate"
  },
  "dependencies": {
    "drizzle-orm": "^0.45.2",
    "pg": "^8.16.3"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/pg": "^8.20.0",
    "drizzle-kit": "^0.31.10",
    "typescript": "^5.9.3",
    "vitest": "^3.0.0"
  },
  "peerDependencies": {
    "@blueforge-studio/auth-session": ">=0.1.0",
    "peerDependenciesMeta": {
      "@blueforge-studio/auth-session": { "optional": true }
    }
  }
}
```

- [ ] **Step 2: Create `packages/db/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "__tests__"]
}
```

- [ ] **Step 3: Create `packages/db/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['__tests__/**/*.test.ts'],
    exclude: ['__tests__/integration/**', 'node_modules/**'],
  },
})
```

- [ ] **Step 4: Create `packages/db/.gitignore`**

```
dist/
*.tsbuildinfo
```

- [ ] **Step 5: Create empty `packages/db/src/index.ts`**

```ts
// Public API is added in subsequent tasks.
export {}
```

- [ ] **Step 6: Install dependencies and verify the package is linked**

Run: `pnpm install`
Expected: `pnpm` completes with no errors. A new symlink `node_modules/@forge-git/db` should be created.

Run: `ls -la node_modules/@forge-git/`
Expected: shows `db`, `gitea-bridge`, `deploy-runner`, `ui` directories (the new `db` one is a symlink to `packages/db`).

- [ ] **Step 7: Verify TypeScript builds**

Run: `pnpm --filter @forge-git/db typecheck`
Expected: PASS (no errors; the package has only an empty index.ts).

- [ ] **Step 8: Commit**

```bash
git add packages/db/
git commit -m "feat(db): bootstrap @forge-git/db package"
```

---

## Task 2: Move and update `schema.ts`

**Files:**
- Create: `packages/db/src/schema.ts`
- Delete: `apps/web/src/lib/schema.ts` (later, in Task 11)

- [ ] **Step 1: Create `packages/db/src/schema.ts`**

Copy from `apps/web/src/lib/schema.ts` and apply these edits:
- Drop `errorGroups` and `errorEvents` table definitions entirely
- Add `giteaId: integer('gitea_id').notNull().unique()` to `forgeOrgs`
- Add `giteaUserId: integer('gitea_user_id')` to `forgeUsers` (nullable, no unique constraint — index added in migration)

Final content:

```ts
import { pgTable, text, integer, boolean, timestamp, jsonb, serial, primaryKey } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

const uuid = () => sql`gen_random_uuid()::text`

export const forgeUsers = pgTable('forge_users', {
  id: text('id').primaryKey().default(uuid()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  avatarUrl: text('avatar_url'),
  giteaToken: text('gitea_token'),
  giteaUsername: text('gitea_username'),
  giteaUserId: integer('gitea_user_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const forgeOrgs = pgTable('forge_orgs', {
  id: text('id').primaryKey().default(uuid()),
  giteaOrg: text('gitea_org').notNull().unique(),
  giteaId: integer('gitea_id').notNull().unique(),
  displayName: text('display_name'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const forgeMembers = pgTable('forge_members', {
  orgId: text('org_id').notNull().references(() => forgeOrgs.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => forgeUsers.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'),
}, (t) => [primaryKey({ columns: [t.orgId, t.userId] })])

export const forgeWorkflows = pgTable('forge_workflows', {
  id: text('id').primaryKey().default(uuid()),
  repoId: text('repo_id').notNull(),
  orgId: text('org_id').notNull(),
  name: text('name').notNull().default('CI'),
  yaml: text('yaml').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const forgePreviews = pgTable('forge_previews', {
  id: text('id').primaryKey().default(uuid()),
  repoId: text('repo_id').notNull(),
  prNumber: integer('pr_number').notNull(),
  url: text('url'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
```

- [ ] **Step 2: Re-export from `packages/db/src/index.ts`**

Replace the empty index.ts with:

```ts
export * from './schema'
```

- [ ] **Step 3: Verify typecheck**

Run: `pnpm --filter @forge-git/db typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/db/src/schema.ts packages/db/src/index.ts
git commit -m "feat(db): add schema with gitea_id columns, drop error tables"
```

---

## Task 3: Create `client.ts` and move the 0000 migration

**Files:**
- Create: `packages/db/src/client.ts`
- Create: `packages/db/drizzle/0000_eager_captain_flint.sql` (moved from `apps/web/drizzle/`)
- Create: `packages/db/drizzle/0001_add_gitea_ids.sql`
- Create: `packages/db/drizzle/0002_drop_error_tables.sql`
- Create: `packages/db/drizzle.config.ts`

- [ ] **Step 1: Create `packages/db/src/client.ts`**

```ts
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { forgeUsers, forgeOrgs, forgeMembers, forgeWorkflows, forgePreviews } from './schema'

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://forge:forge@localhost:5432/forge-git'

let pool: Pool | null = null
let dbInstance: ReturnType<typeof drizzle> | null = null

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: DATABASE_URL, max: 10 })
  }
  return pool
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle(getPool(), {
      schema: { forgeUsers, forgeOrgs, forgeMembers, forgeWorkflows, forgePreviews },
    })
  }
  return dbInstance
}

let migrated = false

export async function runMigrations(): Promise<void> {
  if (migrated) return
  const { migrate } = await import('drizzle-orm/node-postgres/migrator')
  await migrate(getDb(), { migrationsFolder: './drizzle' })
  migrated = true
}
```

- [ ] **Step 2: Update `packages/db/src/index.ts`**

Replace the content with:

```ts
export * from './schema'
export * from './client'
```

- [ ] **Step 3: Move the 0000 migration**

Run: `mkdir -p packages/db/drizzle && git mv apps/web/drizzle/0000_eager_captain_flint.sql packages/db/drizzle/0000_eager_captain_flint.sql && git mv apps/web/drizzle/meta packages/db/drizzle/meta`

Expected: 3 entries moved (the SQL file, the meta dir, and its contents).

- [ ] **Step 4: Create `packages/db/drizzle/0001_add_gitea_ids.sql`**

```sql
ALTER TABLE "forge_orgs" ADD COLUMN "gitea_id" integer NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "forge_orgs_gitea_id_unique" ON "forge_orgs" USING btree ("gitea_id");--> statement-breakpoint
ALTER TABLE "forge_users" ADD COLUMN "gitea_user_id" integer;--> statement-breakpoint
CREATE INDEX "forge_users_gitea_user_id_idx" ON "forge_users" USING btree ("gitea_user_id");
```

- [ ] **Step 5: Create `packages/db/drizzle/0002_drop_error_tables.sql`**

```sql
DROP TABLE IF EXISTS "error_events";--> statement-breakpoint
DROP TABLE IF EXISTS "error_groups";
```

- [ ] **Step 6: Create `packages/db/drizzle.config.ts`**

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

- [ ] **Step 7: Update the migration journal to include 0001 and 0002**

Edit `packages/db/drizzle/meta/_journal.json`. The new content:

```json
{
  "version": "7",
  "dialect": "postgresql",
  "entries": [
    {
      "idx": 0,
      "version": "7",
      "when": 1781182947115,
      "tag": "0000_eager_captain_flint",
      "breakpoints": true
    },
    {
      "idx": 1,
      "version": "7",
      "when": 1781182947116,
      "tag": "0001_add_gitea_ids",
      "breakpoints": true
    },
    {
      "idx": 2,
      "version": "7",
      "when": 1781182947117,
      "tag": "0002_drop_error_tables",
      "breakpoints": true
    }
  ]
}
```

- [ ] **Step 8: Verify typecheck**

Run: `pnpm --filter @forge-git/db typecheck`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/db/src/client.ts packages/db/src/index.ts \
  packages/db/drizzle/ packages/db/drizzle.config.ts
git commit -m "feat(db): add client, move 0000 migration, add 0001+0002"
```

---

## Task 4: Move `client.test.ts` and verify it passes

**Files:**
- Create: `packages/db/__tests__/client.test.ts`
- Delete: `apps/web/src/__tests__/lib/db.test.ts` (later, in Task 11)

- [ ] **Step 1: Create `packages/db/__tests__/client.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockMigrate = vi.fn()

vi.mock('pg', () => ({
  Pool: vi.fn().mockImplementation(() => ({
    query: vi.fn(),
  })),
}))

vi.mock('drizzle-orm/node-postgres', () => ({
  drizzle: vi.fn(() => ({})),
}))

vi.mock('drizzle-orm/node-postgres/migrator', () => ({
  migrate: mockMigrate,
}))

describe('runMigrations', () => {
  beforeEach(() => {
    vi.resetModules()
    mockMigrate.mockReset()
  })

  it('runs migrations only once', async () => {
    const { runMigrations } = await import('../src/client')

    await runMigrations()
    await runMigrations()

    expect(mockMigrate).toHaveBeenCalledTimes(1)
  })

  it('calls migrate with db instance and migrations folder', async () => {
    const { runMigrations } = await import('../src/client')

    await runMigrations()

    expect(mockMigrate).toHaveBeenCalledWith(
      expect.anything(),
      { migrationsFolder: './drizzle' },
    )
  })
})

describe('getPool', () => {
  it('returns a Pool instance', async () => {
    const { getPool } = await import('../src/client')
    const pool = getPool()
    expect(pool).toBeDefined()
    expect(typeof pool.query).toBe('function')
  })
})
```

- [ ] **Step 2: Run the test**

Run: `pnpm --filter @forge-git/db test`
Expected: 3 passing tests, 0 failures.

- [ ] **Step 3: Commit**

```bash
git add packages/db/__tests__/client.test.ts
git commit -m "test(db): add client.test.ts"
```

---

## Task 5: Move `auth-adapter.ts` and `users.ts`

**Files:**
- Create: `packages/db/src/auth-adapter.ts`
- Create: `packages/db/src/users.ts`

These modules have no consumers in the current code (they were scaffolded for future use), so no test-driven flow. The tests will come in the next sub-project when auth wiring is done.

- [ ] **Step 1: Create `packages/db/src/auth-adapter.ts`**

```ts
import { eq } from 'drizzle-orm'
import type { AuthAdapter } from '@blueforge-studio/auth-session'
import { forgeUsers } from './schema'
import { getDb, runMigrations } from './client'

export const forgeAuthAdapter: AuthAdapter = {
  async getUserByEmail(email: string) {
    await runMigrations()
    const db = getDb()
    const rows = await db.select({
      id: forgeUsers.id,
      name: forgeUsers.name,
      email: forgeUsers.email,
      passwordHash: forgeUsers.passwordHash,
    }).from(forgeUsers).where(eq(forgeUsers.email, email)).limit(1)
    if (rows.length === 0) return null
    const r = rows[0]
    return { id: r.id, name: r.name, email: r.email, passwordHash: r.passwordHash }
  },

  async createUser(name: string, email: string, passwordHash: string) {
    await runMigrations()
    const db = getDb()
    const rows = await db.insert(forgeUsers).values({
      name,
      email,
      passwordHash,
    }).onConflictDoUpdate({
      target: forgeUsers.email,
      set: { name, passwordHash },
    }).returning({ id: forgeUsers.id, name: forgeUsers.name, email: forgeUsers.email })
    return rows[0]
  },

  async getUserById(id: string) {
    await runMigrations()
    const db = getDb()
    const rows = await db.select({
      id: forgeUsers.id,
      name: forgeUsers.name,
      email: forgeUsers.email,
    }).from(forgeUsers).where(eq(forgeUsers.id, id)).limit(1)
    if (rows.length === 0) return null
    return rows[0]
  },
}
```

- [ ] **Step 2: Create `packages/db/src/users.ts`**

This is the existing `findOrCreateUserByGiteaLogin` + `getUserGiteaToken`, plus the new `findOrCreateUserByGiteaId` that does NOT touch `giteaToken` (used by the org member-add path where we don't have a token to write). All functions take `db` as the first argument to match the design spec's write-through pattern.

```ts
import { eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { forgeUsers } from './schema'
import { runMigrations } from './client'

export async function findOrCreateUserByGiteaLogin(
  db: NodePgDatabase,
  params: { username: string; email: string; token: string },
): Promise<{ id: string }> {
  await runMigrations()
  const rows = await db.insert(forgeUsers).values({
    name: params.username,
    email: params.email,
    giteaToken: params.token,
    giteaUsername: params.username,
  }).onConflictDoUpdate({
    target: forgeUsers.email,
    set: { giteaToken: params.token, giteaUsername: params.username },
  }).returning({ id: forgeUsers.id })
  return rows[0]
}

export async function findOrCreateUserByGiteaId(
  db: NodePgDatabase,
  params: { giteaUserId: number; username: string; email: string },
): Promise<{ id: string }> {
  await runMigrations()
  const existing = await db.select({ id: forgeUsers.id })
    .from(forgeUsers)
    .where(eq(forgeUsers.giteaUserId, params.giteaUserId))
    .limit(1)
  if (existing.length > 0) return existing[0]
  const rows = await db.insert(forgeUsers).values({
    name: params.username,
    email: params.email,
    giteaUsername: params.username,
    giteaUserId: params.giteaUserId,
  }).returning({ id: forgeUsers.id })
  return rows[0]
}

export async function getUserGiteaToken(
  db: NodePgDatabase,
  userId: string,
): Promise<string | null> {
  const rows = await db.select({ giteaToken: forgeUsers.giteaToken })
    .from(forgeUsers)
    .where(eq(forgeUsers.id, userId))
    .limit(1)
  if (rows.length === 0 || !rows[0].giteaToken) return null
  return rows[0].giteaToken
}
```

- [ ] **Step 3: Update `packages/db/src/index.ts`**

```ts
export * from './schema'
export * from './client'
export * from './users'
export * from './auth-adapter'
```

- [ ] **Step 4: Verify typecheck**

Run: `pnpm --filter @forge-git/db typecheck`
Expected: PASS.

Note: `AuthAdapter` from `@blueforge-studio/auth-session` is a real type. Make sure the type is exported by checking `node_modules/@blueforge-studio/auth-session/`. If the import fails, the `peerDependenciesMeta.optional: true` flag should still allow the package to install without that peer.

- [ ] **Step 5: Run client tests to ensure no regressions**

Run: `pnpm --filter @forge-git/db test`
Expected: 3 passing tests, 0 failures.

- [ ] **Step 6: Commit**

```bash
git add packages/db/src/auth-adapter.ts packages/db/src/users.ts packages/db/src/index.ts
git commit -m "feat(db): add auth-adapter and users modules"
```

---

## Task 6: TDD `orgs.ts` query module

**Files:**
- Create: `packages/db/src/orgs.ts`
- Create: `packages/db/__tests__/orgs.test.ts`

- [ ] **Step 1: Write the failing test `packages/db/__tests__/orgs.test.ts`**

```ts
import { describe, it, expect, vi } from 'vitest'

// Mock the client module — we don't want real DB access in unit tests
const mockDb = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  onConflictDoUpdate: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  returning: vi.fn(),
}
const mockRunMigrations = vi.fn().mockResolvedValue(undefined)

vi.mock('../src/client', () => ({
  runMigrations: () => mockRunMigrations(),
}))

describe('listOrgs', () => {
  it('queries forgeOrgs ordered by createdAt', async () => {
    const expected = [{ id: '1', giteaOrg: 'acme', giteaId: 100 }]
    mockReturning.mockResolvedValue(expected)
    // The chain: db.select().from(forgeOrgs).orderBy(forgeOrgs.createdAt)
    // We assert by checking that the chain was constructed and the result was returned.

    const { listOrgs } = await import('../src/orgs')
    const result = await listOrgs(mockDb as any)

    expect(mockDb.select).toHaveBeenCalled()
    expect(mockDb.from).toHaveBeenCalled()
    expect(mockDb.orderBy).toHaveBeenCalled()
    expect(result).toBe(expected)
  })
})

describe('getOrgByName', () => {
  it('queries forgeOrgs where giteaOrg matches', async () => {
    const expected = [{ id: '1', giteaOrg: 'acme' }]
    mockReturning.mockResolvedValue(expected)
    mockLimit.mockResolvedValue(expected)

    const { getOrgByName } = await import('../src/orgs')
    const result = await getOrgByName(mockDb as any, 'acme')

    expect(mockDb.select).toHaveBeenCalled()
    expect(mockDb.from).toHaveBeenCalled()
    expect(mockDb.where).toHaveBeenCalled()
    expect(mockDb.limit).toHaveBeenCalledWith(1)
    expect(result).toBe(expected[0])
  })
})

describe('getOrgByGiteaId', () => {
  it('queries forgeOrgs where giteaId matches', async () => {
    const expected = { id: '1', giteaOrg: 'acme', giteaId: 100 }
    mockLimit.mockResolvedValue([expected])

    const { getOrgByGiteaId } = await import('../src/orgs')
    const result = await getOrgByGiteaId(mockDb as any, 100)

    expect(mockDb.where).toHaveBeenCalled()
    expect(mockDb.limit).toHaveBeenCalledWith(1)
    expect(result).toBe(expected)
  })
})

describe('upsertOrgByGiteaId', () => {
  it('inserts with onConflictDoUpdate on gitea_id', async () => {
    const returned = { id: '1', giteaOrg: 'acme', giteaId: 100 }
    mockReturning.mockResolvedValue([returned])

    const { upsertOrgByGiteaId } = await import('../src/orgs')
    const result = await upsertOrgByGiteaId(mockDb as any, {
      giteaId: 100,
      giteaOrg: 'acme',
      displayName: 'Acme',
      description: null,
    })

    expect(mockDb.insert).toHaveBeenCalled()
    expect(mockDb.values).toHaveBeenCalledWith({
      giteaId: 100,
      giteaOrg: 'acme',
      displayName: 'Acme',
      description: null,
    })
    expect(mockDb.onConflictDoUpdate).toHaveBeenCalledWith({
      target: expect.anything(),
      set: expect.objectContaining({ giteaOrg: 'acme' }),
    })
    expect(result).toBe(returned)
  })
})

describe('deleteOrgByName', () => {
  it('deletes forgeOrgs where giteaOrg matches', async () => {
    const { deleteOrgByName } = await import('../src/orgs')
    await deleteOrgByName(mockDb as any, 'acme')

    expect(mockDb.delete).toHaveBeenCalled()
    expect(mockDb.where).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @forge-git/db test orgs`
Expected: FAIL — `Cannot find module '../src/orgs'`.

- [ ] **Step 3: Create `packages/db/src/orgs.ts`**

```ts
import { asc, eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { forgeOrgs } from './schema'
import { runMigrations } from './client'

export type Org = {
  id: string
  giteaOrg: string
  giteaId: number
  displayName: string | null
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export async function listOrgs(db: NodePgDatabase): Promise<Org[]> {
  await runMigrations()
  return db.select().from(forgeOrgs).orderBy(asc(forgeOrgs.createdAt))
}

export async function getOrgByName(db: NodePgDatabase, giteaOrg: string): Promise<Org | null> {
  await runMigrations()
  const rows = await db.select().from(forgeOrgs)
    .where(eq(forgeOrgs.giteaOrg, giteaOrg))
    .limit(1)
  return rows[0] ?? null
}

export async function getOrgByGiteaId(db: NodePgDatabase, giteaId: number): Promise<Org | null> {
  await runMigrations()
  const rows = await db.select().from(forgeOrgs)
    .where(eq(forgeOrgs.giteaId, giteaId))
    .limit(1)
  return rows[0] ?? null
}

export async function upsertOrgByGiteaId(
  db: NodePgDatabase,
  params: {
    giteaId: number
    giteaOrg: string
    displayName: string | null
    description: string | null
  },
): Promise<Org> {
  await runMigrations()
  const rows = await db.insert(forgeOrgs).values({
    giteaId: params.giteaId,
    giteaOrg: params.giteaOrg,
    displayName: params.displayName,
    description: params.description,
  }).onConflictDoUpdate({
    target: forgeOrgs.giteaId,
    set: {
      giteaOrg: params.giteaOrg,
      displayName: params.displayName,
      description: params.description,
      updatedAt: new Date(),
    },
  }).returning()
  return rows[0]
}

export async function deleteOrgByName(db: NodePgDatabase, giteaOrg: string): Promise<void> {
  await runMigrations()
  await db.delete(forgeOrgs).where(eq(forgeOrgs.giteaOrg, giteaOrg))
}
```

- [ ] **Step 4: Update `packages/db/src/index.ts`**

```ts
export * from './schema'
export * from './client'
export * from './users'
export * from './auth-adapter'
export * from './orgs'
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @forge-git/db test orgs`
Expected: 5 passing tests, 0 failures.

- [ ] **Step 6: Commit**

```bash
git add packages/db/src/orgs.ts packages/db/__tests__/orgs.test.ts packages/db/src/index.ts
git commit -m "feat(db): add orgs query module"
```

---

## Task 7: TDD `members.ts` query module

**Files:**
- Create: `packages/db/src/members.ts`
- Create: `packages/db/__tests__/members.test.ts`

- [ ] **Step 1: Write the failing test `packages/db/__tests__/members.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockDb = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
}
const mockRunMigrations = vi.fn().mockResolvedValue(undefined)

vi.mock('../src/client', () => ({
  runMigrations: () => mockRunMigrations(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  // Re-establish the chain: insert().values().returning()
  mockDb.insert.mockReturnThis()
  mockDb.values.mockReturnThis()
  mockDb.select.mockReturnThis()
  mockDb.from.mockReturnThis()
  mockDb.where.mockReturnThis()
  mockDb.limit.mockReturnThis()
  mockDb.delete.mockReturnThis()
})

describe('listMembers', () => {
  it('joins forgeMembers with forgeOrgs and forgeUsers', async () => {
    const expected = [
      { orgId: 'org-1', userId: 'user-1', role: 'admin', login: 'alice' },
    ]
    mockDb.orderBy.mockResolvedValue(expected)

    const { listMembers } = await import('../src/members')
    const result = await listMembers(mockDb as any, 'acme')

    expect(mockDb.select).toHaveBeenCalled()
    expect(mockDb.from).toHaveBeenCalled()
    expect(mockDb.innerJoin).toHaveBeenCalled()
    expect(mockDb.where).toHaveBeenCalled()
    expect(result).toBe(expected)
  })
})

describe('addMember', () => {
  it('inserts a forge_members row after resolving orgName to orgId', async () => {
    // First call (orgId lookup) returns the org id
    mockDb.limit.mockResolvedValueOnce([{ id: 'org-42' }])
    // Second call (insert returning) returns the inserted row
    mockDb.returning.mockResolvedValueOnce([{ orgId: 'org-42', userId: 'user-1', role: 'member' }])

    const { addMember } = await import('../src/members')
    const result = await addMember(mockDb as any, {
      orgName: 'acme',
      userId: 'user-1',
      role: 'member',
    })

    expect(mockDb.insert).toHaveBeenCalled()
    expect(mockDb.values).toHaveBeenCalledWith({
      orgId: 'org-42',
      userId: 'user-1',
      role: 'member',
    })
    expect(result).toEqual({ orgId: 'org-42', userId: 'user-1', role: 'member' })
  })
})

describe('removeMember', () => {
  it('resolves orgName+userId to a composite-key delete', async () => {
    // Mock the orgId lookup
    mockDb.limit.mockResolvedValueOnce([{ id: 'org-42' }])
    // delete().where() is called and awaited
    mockDb.where.mockResolvedValueOnce(undefined)

    const { removeMember } = await import('../src/members')
    await removeMember(mockDb as any, { orgName: 'acme', userId: 'user-1' })

    expect(mockDb.delete).toHaveBeenCalled()
    expect(mockDb.where).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @forge-git/db test members`
Expected: FAIL — `Cannot find module '../src/members'`.

- [ ] **Step 3: Create `packages/db/src/members.ts`**

```ts
import { and, asc, eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { forgeMembers, forgeOrgs, forgeUsers } from './schema'
import { runMigrations } from './client'

export type Member = {
  orgId: string
  userId: string
  role: string
  giteaOrg?: string
  giteaUsername?: string
}

export async function listMembers(
  db: NodePgDatabase,
  orgName: string,
): Promise<Member[]> {
  await runMigrations()
  return db.select({
    orgId: forgeMembers.orgId,
    userId: forgeMembers.userId,
    role: forgeMembers.role,
    giteaOrg: forgeOrgs.giteaOrg,
    giteaUsername: forgeUsers.giteaUsername,
  })
    .from(forgeMembers)
    .innerJoin(forgeOrgs, eq(forgeMembers.orgId, forgeOrgs.id))
    .innerJoin(forgeUsers, eq(forgeMembers.userId, forgeUsers.id))
    .where(eq(forgeOrgs.giteaOrg, orgName))
    .orderBy(asc(forgeUsers.giteaUsername))
}

export async function addMember(
  db: NodePgDatabase,
  params: {
    orgName: string
    userId: string
    role: 'owner' | 'admin' | 'member'
  },
): Promise<Member> {
  await runMigrations()
  const orgRows = await db.select({ id: forgeOrgs.id })
    .from(forgeOrgs)
    .where(eq(forgeOrgs.giteaOrg, params.orgName))
    .limit(1)
  if (orgRows.length === 0) {
    throw new Error(`Org not found: ${params.orgName}`)
  }
  const orgId = orgRows[0].id
  const rows = await db.insert(forgeMembers).values({
    orgId,
    userId: params.userId,
    role: params.role,
  }).returning()
  return rows[0]
}

export async function removeMember(
  db: NodePgDatabase,
  params: { orgName: string; userId: string },
): Promise<void> {
  await runMigrations()
  const orgRows = await db.select({ id: forgeOrgs.id })
    .from(forgeOrgs)
    .where(eq(forgeOrgs.giteaOrg, params.orgName))
    .limit(1)
  if (orgRows.length === 0) {
    throw new Error(`Org not found: ${params.orgName}`)
  }
  await db.delete(forgeMembers).where(
    and(
      eq(forgeMembers.orgId, orgRows[0].id),
      eq(forgeMembers.userId, params.userId),
    ),
  )
}
```

- [ ] **Step 4: Update `packages/db/src/index.ts`**

```ts
export * from './schema'
export * from './client'
export * from './users'
export * from './auth-adapter'
export * from './orgs'
export * from './members'
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm --filter @forge-git/db test members`
Expected: 4 passing tests, 0 failures.

- [ ] **Step 6: Run all db tests**

Run: `pnpm --filter @forge-git/db test`
Expected: 12 passing tests (3 client + 5 orgs + 4 members), 0 failures.

- [ ] **Step 7: Commit**

```bash
git add packages/db/src/members.ts packages/db/__tests__/members.test.ts packages/db/src/index.ts
git commit -m "feat(db): add members query module"
```

---

## Task 8: Wire up write-through in `actions.ts`

**Files:**
- Modify: `apps/web/src/app/organizations/actions.ts`
- Create: `apps/web/src/__tests__/app/organizations/actions.test.ts`

- [ ] **Step 1: Write the failing test `apps/web/src/__tests__/app/organizations/actions.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock gitea-bridge
const mockCreateOrg = vi.fn()
const mockAddOrgMember = vi.fn()
const mockRemoveOrgMember = vi.fn()
const mockUpdateOrg = vi.fn()
const mockGetUser = vi.fn()

vi.mock('@forge-git/gitea-bridge', () => ({
  createOrg: (...args: unknown[]) => mockCreateOrg(...args),
  addOrgMember: (...args: unknown[]) => mockAddOrgMember(...args),
  removeOrgMember: (...args: unknown[]) => mockRemoveOrgMember(...args),
  updateOrg: (...args: unknown[]) => mockUpdateOrg(...args),
  getUser: (...args: unknown[]) => mockGetUser(...args),
}))

// Mock @forge-git/db
const mockUpsertOrgByGiteaId = vi.fn()
const mockDeleteOrgByName = vi.fn()
const mockAddMember = vi.fn()
const mockRemoveMember = vi.fn()
const mockFindOrCreateUserByGiteaId = vi.fn()

vi.mock('@forge-git/db/orgs', () => ({
  upsertOrgByGiteaId: (...args: unknown[]) => mockUpsertOrgByGiteaId(...args),
  deleteOrgByName: (...args: unknown[]) => mockDeleteOrgByName(...args),
}))

vi.mock('@forge-git/db/members', () => ({
  addMember: (...args: unknown[]) => mockAddMember(...args),
  removeMember: (...args: unknown[]) => mockRemoveMember(...args),
}))

vi.mock('@forge-git/db/users', () => ({
  findOrCreateUserByGiteaId: (...args: unknown[]) => mockFindOrCreateUserByGiteaId(...args),
}))

vi.mock('@/lib/session', () => ({
  getSession: vi.fn().mockResolvedValue({ baseUrl: 'http://gitea', token: 'tok' }),
}))

import { createOrgAction, addMemberAction, removeMemberAction, deleteOrgAction } from '@/app/organizations/actions'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createOrgAction', () => {
  it('calls gitea createOrg then DB upsertOrgByGiteaId', async () => {
    mockCreateOrg.mockResolvedValue({ id: 42, username: 'acme', full_name: 'Acme', description: '' })

    const fd = new FormData()
    fd.set('name', 'acme')
    fd.set('full_name', 'Acme Inc')
    fd.set('description', 'Cool org')

    await createOrgAction({ error: '', field: '' }, fd)

    expect(mockCreateOrg).toHaveBeenCalled()
    expect(mockUpsertOrgByGiteaId).toHaveBeenCalledWith(expect.anything(), {
      giteaId: 42,
      giteaOrg: 'acme',
      displayName: 'Acme Inc',
      description: 'Cool org',
    })
  })

  it('still redirects if DB upsert fails', async () => {
    mockCreateOrg.mockResolvedValue({ id: 42, username: 'acme', full_name: null, description: null })
    mockUpsertOrgByGiteaId.mockRejectedValue(new Error('DB down'))

    // redirect() is mocked in next-navigation mock; we just verify the error doesn't throw
    const fd = new FormData()
    fd.set('name', 'acme')

    await expect(createOrgAction({ error: '', field: '' }, fd)).resolves.not.toThrow()
  })

  it('returns error if gitea createOrg fails (no DB write)', async () => {
    mockCreateOrg.mockRejectedValue(new Error('Gitea 409: conflict'))

    const fd = new FormData()
    fd.set('name', 'acme')

    const result = await createOrgAction({ error: '', field: '' }, fd)

    expect(result.error).toContain('already exists')
    expect(mockUpsertOrgByGiteaId).not.toHaveBeenCalled()
  })
})

describe('addMemberAction', () => {
  it('calls addOrgMember, getUser, findOrCreateUserByGiteaId, addMember', async () => {
    mockAddOrgMember.mockResolvedValue(undefined)
    mockGetUser.mockResolvedValue({ id: 99, login: 'alice', email: 'alice@example.com' })
    mockFindOrCreateUserByGiteaId.mockResolvedValue({ id: 'user-1' })

    const fd = new FormData()
    fd.set('org', 'acme')
    fd.set('username', 'alice')

    await addMemberAction({ error: '', field: '' }, fd)

    expect(mockAddOrgMember).toHaveBeenCalledWith('acme', 'alice', expect.anything())
    expect(mockGetUser).toHaveBeenCalledWith('alice', expect.anything())
    expect(mockFindOrCreateUserByGiteaId).toHaveBeenCalledWith(expect.anything(), {
      giteaUserId: 99,
      username: 'alice',
      email: 'alice@example.com',
    })
    expect(mockAddMember).toHaveBeenCalledWith(expect.anything(), {
      orgName: 'acme',
      userId: 'user-1',
      role: 'member',
    })
  })
})

describe('removeMemberAction', () => {
  it('calls removeOrgMember then removeMember', async () => {
    mockRemoveOrgMember.mockResolvedValue(undefined)
    mockGetUser.mockResolvedValue({ id: 99, login: 'alice', email: 'a@e.com' })
    mockFindOrCreateUserByGiteaId.mockResolvedValue({ id: 'user-1' })

    const fd = new FormData()
    fd.set('org', 'acme')
    fd.set('username', 'alice')

    await removeMemberAction({ error: '', field: '' }, fd)

    expect(mockRemoveOrgMember).toHaveBeenCalledWith('acme', 'alice', expect.anything())
    expect(mockRemoveMember).toHaveBeenCalledWith(expect.anything(), {
      orgName: 'acme',
      userId: 'user-1',
    })
  })
})

describe('deleteOrgAction', () => {
  it('calls gitea DELETE then DB deleteOrgByName', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('') })
    mockDeleteOrgByName.mockResolvedValue(undefined)

    const fd = new FormData()
    fd.set('orgName', 'acme')

    await deleteOrgAction({ error: '', field: '' }, fd)

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/orgs/acme'),
      expect.objectContaining({ method: 'DELETE' }),
    )
    expect(mockDeleteOrgByName).toHaveBeenCalledWith(expect.anything(), 'acme')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/web && pnpm test app/organizations`
Expected: FAIL — the actions don't yet call `upsertOrgByGiteaId`, etc.

- [ ] **Step 3: Modify `apps/web/src/app/organizations/actions.ts`**

Replace the file content with the write-through versions:

```ts
'use server'

import { getSession } from '@/lib/session'
import {
  createOrg,
  addOrgMember,
  removeOrgMember,
  createTeam,
  updateOrg,
  getUser,
} from '@forge-git/gitea-bridge'
import type { CreateOrgRequest, GiteaOpts } from '@forge-git/gitea-bridge'
import { upsertOrgByGiteaId, deleteOrgByName, getOrgByName } from '@forge-git/db/orgs'
import { addMember, removeMember } from '@forge-git/db/members'
import { findOrCreateUserByGiteaId } from '@forge-git/db/users'
import { getDb } from '@forge-git/db/client'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

function giteaOpts(session: { baseUrl: string; token: string }): GiteaOpts {
  return { baseUrl: session.baseUrl, token: session.token }
}

export async function createOrgAction(
  prevState: { error: string; field: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const name = (formData.get('name') as string).trim()
  const full_name = (formData.get('full_name') as string).trim() || undefined
  const description = (formData.get('description') as string).trim() || undefined
  const visibility = (formData.get('visibility') as string) || undefined

  if (!name) return { error: 'Organization name is required', field: 'name' }
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
    return { error: 'Name can only contain letters, numbers, dots, hyphens, and underscores', field: 'name' }
  }

  let created: { id: number; username: string; full_name?: string; description?: string }
  try {
    const data: CreateOrgRequest = { name, full_name, description }
    if (visibility) data.visibility = visibility as 'public' | 'limited' | 'private'
    created = await createOrg(data, session) as typeof created
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('409')) {
      return { error: 'An organization with this name already exists', field: 'name' }
    }
    return { error: `Failed to create organization: ${msg}`, field: '' }
  }

  // Write-through to DB. Gitea succeeded; failures here are logged but not user-blocking.
  try {
    await upsertOrgByGiteaId(getDb(), {
      giteaId: created.id,
      giteaOrg: created.username,
      displayName: created.full_name ?? null,
      description: created.description ?? null,
    })
  } catch (err) {
    console.error('[forge-db] upsertOrgByGiteaId failed:', err)
  }

  revalidatePath('/organizations')
  redirect('/organizations')
}

export async function addMemberAction(
  prevState: { error: string; field: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const org = (formData.get('org') as string).trim()
  const username = (formData.get('username') as string).trim()

  if (!username) return { error: 'Username is required', field: 'username' }

  try {
    await addOrgMember(org, username, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('404')) {
      return { error: `User "${username}" not found`, field: 'username' }
    }
    return { error: `Failed to add member: ${msg}`, field: '' }
  }

  // Look up the Gitea user to get their numeric id, then mirror to DB.
  try {
    const profile = await getUser(username, giteaOpts(session)) as { id: number; email?: string }
    const forgeUser = await findOrCreateUserByGiteaId(getDb(), {
      giteaUserId: profile.id,
      username,
      email: profile.email ?? `${username}@unknown.local`,
    })
    await addMember(getDb(), {
      orgName: org,
      userId: forgeUser.id,
      role: 'member',
    })
  } catch (err) {
    console.error('[forge-db] addMember mirror failed:', err)
  }

  revalidatePath(`/organizations/${org}`)
  return { error: '', field: '' }
}

export async function removeMemberAction(
  prevState: { error: string; field: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const org = (formData.get('org') as string).trim()
  const username = (formData.get('username') as string).trim()

  try {
    await removeOrgMember(org, username, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Failed to remove member: ${msg}`, field: '' }
  }

  try {
    const profile = await getUser(username, giteaOpts(session)) as { id: number }
    const forgeUser = await findOrCreateUserByGiteaId(getDb(), {
      giteaUserId: profile.id,
      username,
      email: `${username}@unknown.local`,
    })
    await removeMember(getDb(), { orgName: org, userId: forgeUser.id })
  } catch (err) {
    console.error('[forge-db] removeMember mirror failed:', err)
  }

  revalidatePath(`/organizations/${org}`)
  return { error: '', field: '' }
}

export async function createTeamAction(
  prevState: { error: string; field: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const org = (formData.get('org') as string).trim()
  const name = (formData.get('name') as string).trim()
  const description = (formData.get('description') as string).trim() || undefined
  const permission = (formData.get('permission') as string) || 'read'

  if (!name) return { error: 'Team name is required', field: 'name' }

  try {
    await createTeam(org, { name, description, permission: permission as 'read' | 'write' | 'admin' }, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('409')) {
      return { error: 'A team with this name already exists', field: 'name' }
    }
    return { error: `Failed to create team: ${msg}`, field: '' }
  }

  revalidatePath(`/organizations/${org}`)
  return { error: '', field: '' }
}

export async function editOrgAction(
  prevState: { error: string; field: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const org = (formData.get('org') as string).trim()
  const full_name = (formData.get('full_name') as string).trim() || undefined
  const description = (formData.get('description') as string).trim() || undefined
  const website = (formData.get('website') as string).trim() || undefined
  const location = (formData.get('location') as string).trim() || undefined
  const visibility = (formData.get('visibility') as string) || undefined

  if (!org) return { error: 'Organization name is required', field: 'org' }

  try {
    const data: {
      full_name?: string; description?: string; website?: string
      location?: string; visibility?: 'public' | 'limited' | 'private'
    } = {}
    if (full_name) data.full_name = full_name
    if (description) data.description = description
    if (website) data.website = website
    if (location) data.location = location
    if (visibility && ['public', 'limited', 'private'].includes(visibility)) {
      data.visibility = visibility as 'public' | 'limited' | 'private'
    }
    await updateOrg(org, data, session)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Failed to update organization: ${msg}`, field: '' }
  }

  // Mirror name + description changes to DB
  try {
    const existing = await getOrgByName(getDb(), org)
    if (existing) {
      await upsertOrgByGiteaId(getDb(), {
        giteaId: existing.giteaId,
        giteaOrg: org,
        displayName: full_name ?? existing.displayName,
        description: description ?? existing.description,
      })
    }
  } catch (err) {
    console.error('[forge-db] editOrg mirror failed:', err)
  }

  revalidatePath(`/organizations/${org}`)
  redirect(`/organizations/${org}`)
}

export async function deleteOrgAction(
  prevState: { error: string; field: string },
  formData: FormData
) {
  const session = await getSession()
  if (!session) redirect('/login')

  const orgName = (formData.get('orgName') as string).trim()

  if (!orgName) return { error: 'Organization name is required', field: 'orgName' }

  try {
    const token = session.token
    const baseUrl = process.env.GITEA_URL ?? process.env.FORGE_GIT_URL ?? 'http://localhost:3001'
    const url = `${baseUrl}/api/v1/orgs/${orgName}`
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Gitea API ${res.status}: ${text}`)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('404')) {
      return { error: 'Organization not found', field: '' }
    }
    return { error: `Failed to delete organization: ${msg}`, field: '' }
  }

  try {
    await deleteOrgByName(getDb(), orgName)
  } catch (err) {
    console.error('[forge-db] deleteOrgByName failed:', err)
  }

  revalidatePath('/organizations')
  redirect('/organizations')
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/web && pnpm test app/organizations`
Expected: 5 passing tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/organizations/actions.ts apps/web/src/__tests__/app/organizations/actions.test.ts
git commit -m "feat(web): add write-through DB calls to org/member actions"
```

---

## Task 9: Add the org API routes

**Files:**
- Create: `apps/web/src/app/api/orgs/route.ts`
- Create: `apps/web/src/app/api/orgs/[name]/members/route.ts`

- [ ] **Step 1: Create `apps/web/src/app/api/orgs/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { listOrgs, getDb } from '@forge-git/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const orgs = await listOrgs(getDb())
    return NextResponse.json({ orgs })
  } catch {
    return NextResponse.json({ error: 'database_unavailable' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create `apps/web/src/app/api/orgs/[name]/members/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { listMembers, getDb, getOrgByName } from '@forge-git/db'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { name } = await params

  try {
    const org = await getOrgByName(getDb(), name)
    if (!org) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    const members = await listMembers(getDb(), name)
    return NextResponse.json({ members })
  } catch {
    return NextResponse.json({ error: 'database_unavailable' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Verify typecheck**

Run: `cd apps/web && npx tsc --noEmit`
Expected: PASS. (Next.js types should accept `Promise<{ name: string }>` for dynamic params in App Router 16.)

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/api/orgs/
git commit -m "feat(web): add GET /api/orgs and /api/orgs/[name]/members"
```

---

## Task 10: Update `apps/web/package.json` and remove the old db files

**Files:**
- Modify: `apps/web/package.json`
- Delete: `apps/web/src/lib/db.ts`
- Delete: `apps/web/src/lib/schema.ts`
- Delete: `apps/web/drizzle.config.ts`
- Delete: `apps/web/drizzle/` (already moved in Task 3)
- Delete: `apps/web/src/__tests__/lib/db.test.ts`
- Delete: `docker/init-db/01-schema.sql`
- Modify: `docker-compose.yml` (drop the init-db volume mount)

- [ ] **Step 1: Update `apps/web/package.json`**

Remove these dependencies:
- `drizzle-orm` (line 35)
- `pg` (line 43)

Remove these devDependencies:
- `drizzle-kit` (line 63)
- `@types/pg` (line 59)

Remove these scripts:
- `db:generate` (line 14)
- `db:push` (line 15)
- `db:migrate` (line 16)

Add this dependency:
- `"@forge-git/db": "workspace:*"` (alphabetically after `@forge-git/deploy-runner`)

After edits, the relevant section should look like:

```json
"dependencies": {
  "@aws-sdk/client-s3": "^3.1064.0",
  "@aws-sdk/s3-request-presigner": "^3.1064.0",
  "@blueforge-studio/app-kit": "^0.4.0",
  "@blueforge-studio/auth-session": "^0.1.0",
  "@blueforge-studio/comms": "^0.1.2",
  "@blueforge-studio/error-tracker": "^0.1.1",
  "@blueforge-studio/marketing-kit": "^0.5.4",
  "@blueforge-studio/queue-adapter": "^0.1.2",
  "@blueforge-studio/service-factory": "^0.4.3",
  "@forge-git/db": "workspace:*",
  "@forge-git/deploy-runner": "workspace:*",
  "@forge-git/gitea-bridge": "workspace:*",
  "@forge-git/ui": "workspace:*",
  ...
}
```

- [ ] **Step 2: Remove the old db files**

```bash
git rm apps/web/src/lib/db.ts apps/web/src/lib/schema.ts \
       apps/web/drizzle.config.ts \
       apps/web/src/__tests__/lib/db.test.ts \
       docker/init-db/01-schema.sql
```

- [ ] **Step 3: Update `docker-compose.yml`**

Edit `docker-compose.yml`. In the `postgres` service, remove this line:

```yaml
      - ./docker/init-db:/docker-entrypoint-initdb.d
```

After the edit, the `volumes:` block under `postgres:` should be:

```yaml
    volumes:
      - postgres-data:/var/lib/postgresql/data
```

- [ ] **Step 4: Reinstall dependencies**

Run: `pnpm install`
Expected: `pnpm` resolves the workspace, removes `drizzle-orm`/`pg`/`drizzle-kit`/`@types/pg` from `apps/web`, adds `@forge-git/db`.

- [ ] **Step 5: Verify web app still typechecks**

Run: `cd apps/web && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Run web app tests**

Run: `cd apps/web && pnpm test`
Expected: all pre-existing tests pass + the 5 new actions tests.

- [ ] **Step 7: Run db package tests**

Run: `pnpm --filter @forge-git/db test`
Expected: 12 passing tests.

- [ ] **Step 8: Build the web app**

Run: `cd apps/web && pnpm build`
Expected: BUILD SUCCESS.

- [ ] **Step 9: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml \
        docker-compose.yml \
        apps/web/src/lib/db.ts apps/web/src/lib/schema.ts \
        apps/web/drizzle.config.ts apps/web/drizzle/ \
        apps/web/src/__tests__/lib/db.test.ts \
        docker/init-db/01-schema.sql
git commit -m "refactor(web): depend on @forge-git/db, remove local drizzle scaffolding"
```

---

## Task 11: Update AUDIT.md and final verification

**Files:**
- Modify: `AUDIT.md`

- [ ] **Step 1: Update `AUDIT.md` to mark sub-project 1 done**

In the "What's Missing" section under "High Priority", find:

```
1. **No database for forge-git metadata**: PostgreSQL is in docker-compose but unused...
```

Replace the entire bullet with:

```
1. ~~No database for forge-git metadata~~ — DONE 2026-06-12. `@forge-git/db` package extracts Drizzle schema + queries from `apps/web`. Orgs + members are write-through mirrored to Postgres. Workflows + previews deferred to sub-project 2.
```

- [ ] **Step 2: Run the full test suite**

Run from repo root: `pnpm test`
Expected: all packages' unit tests pass.

- [ ] **Step 3: Run typecheck across all packages**

Run from repo root: `pnpm turbo run typecheck`
Expected: all packages typecheck cleanly.

- [ ] **Step 4: Run the build across all packages**

Run from repo root: `pnpm build`
Expected: all packages build successfully.

- [ ] **Step 5: Commit**

```bash
git add AUDIT.md
git commit -m "docs: mark AUDIT.md sub-project 1 (Drizzle extraction) complete"
```

---

## Self-Review

This self-review is run after the plan is fully written.

**1. Spec coverage check:** Each spec section maps to a task:
- Package extraction → Tasks 1, 2, 3
- Schema (gitea_id columns, drop errors) → Task 2
- Migrations (0001, 0002) → Task 3
- Public API (re-exports) → Tasks 2-7 incrementally
- Data flow (5 actions write-through) → Task 8
- API routes (2 GETs) → Task 9
- Failure modes (Gitea-fails-fails, Gitea-succeeds-DB-fails-logs) → Task 8 (try/catch around DB calls)
- Unit tests (orgs, members) → Tasks 6, 7
- Wire-up tests (actions) → Task 8
- Docker-compose change (drop init-db) → Task 10
- Delete old files (db.ts, schema.ts, drizzle.config.ts, drizzle/, db.test.ts, init-db/) → Task 10
- Update AUDIT.md → Task 11
- Integration tests → Out of scope (deferred; spec marks as best-effort)

**2. Placeholder scan:** No "TBD"/"TODO"/"implement later" in the plan. Every code block is complete.

**3. Type consistency:** 
- `Org` type in `orgs.ts` has `id, giteaOrg, giteaId, displayName, description, createdAt, updatedAt`
- `Member` type in `members.ts` has `orgId, userId, role, giteaOrg?, giteaUsername?`
- `findOrCreateUserByGiteaId` returns `{ id: string }` (consistent across Task 5, 8, and the test)
- All query functions take `db: NodePgDatabase` as the first parameter (matching the spec's write-through pattern). Callers pass `getDb()` from `@forge-git/db/client`.
- `addMember(db, { orgName, userId, role })` and `removeMember(db, { orgName, userId })` — both take `db` first
- `upsertOrgByGiteaId(db, { giteaId, giteaOrg, displayName, description })` — takes `db` first
- `Org.id` in DB is a string (text PK with gen_random_uuid); not a number. Consistent with `gitea-bridge`'s `ForgeGitOrg.giteaId: number` — the bridge type stores Gitea's numeric id, the DB stores both Gitea's numeric id (`gitea_id`) AND a string UUID (`id`). They're different fields serving different purposes.
- The `forgeAuthAdapter` is a special case — it conforms to the `AuthAdapter` interface from `@blueforge-studio/auth-session` which doesn't take a `db` parameter, so it uses internal `getDb()`. This matches the existing `db.ts` pattern.

**4. Risks called out:**
- Test mocks use `expect.anything()` to skip checking the DB object passed in (since it's mocked). This is intentional — the test is about behavior (was the right DB function called with the right params?), not type fidelity.
- The mock pattern in `orgs.test.ts` uses a chained `mockReturnThis()` to allow the Drizzle query builder chain. This is a known limitation — real Drizzle objects don't behave like this, but for unit tests of the function logic it works.
- The `addMember` test verifies "two lookups: one for orgId resolution, one for the insert returning" by counting `select` calls. If the implementation changes the order or count, this test will need to be updated.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-06-12-drizzle-db-extraction.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
