import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { eq, sql } from 'drizzle-orm'
import type { AuthAdapter } from '@blueforge-studio/auth-session'
import { forgeUsers, forgeOrgs, forgeMembers, forgeWorkflows, forgePreviews, errorGroups, errorEvents } from './schema'

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://forge:forge@localhost:5432/forge-git'

let pool: Pool | null = null
let dbInstance: ReturnType<typeof drizzle> | null = null

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: DATABASE_URL, max: 10 })
  }
  return pool
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle(getPool(), {
      schema: {
        forgeUsers,
        forgeOrgs,
        forgeMembers,
        forgeWorkflows,
        forgePreviews,
        errorGroups,
        errorEvents,
      },
    })
  }
  return dbInstance
}

// ---------------------------------------------------------------------------
// Auto-migration — pushes schema to database on first use
// ---------------------------------------------------------------------------

let migrated = false

export async function runMigrations(): Promise<void> {
  if (migrated) return
  const db = getDb()
  const p = getPool()

  // Create tables if they don't exist — uses IF NOT EXISTS for safety
  await p.query(`
    CREATE TABLE IF NOT EXISTS forge_users (
      id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      avatar_url    TEXT,
      gitea_token   TEXT,
      gitea_username TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS forge_orgs (
      id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      gitea_org     TEXT NOT NULL UNIQUE,
      display_name  TEXT,
      description   TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS forge_members (
      org_id   TEXT NOT NULL REFERENCES forge_orgs(id) ON DELETE CASCADE,
      user_id  TEXT NOT NULL REFERENCES forge_users(id) ON DELETE CASCADE,
      role     TEXT NOT NULL DEFAULT 'member',
      PRIMARY KEY (org_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS forge_workflows (
      id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      repo_id    TEXT NOT NULL,
      org_id     TEXT NOT NULL,
      name       TEXT NOT NULL DEFAULT 'CI',
      yaml       TEXT NOT NULL,
      enabled    BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS forge_previews (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      repo_id     TEXT NOT NULL,
      pr_number   INTEGER NOT NULL,
      url         TEXT,
      status      TEXT NOT NULL DEFAULT 'pending',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS error_groups (
      fingerprint TEXT PRIMARY KEY,
      message     TEXT NOT NULL,
      stack       TEXT,
      app_name    TEXT NOT NULL,
      environment TEXT NOT NULL,
      first_seen  TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_seen   TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_url    TEXT,
      count       INTEGER NOT NULL DEFAULT 1,
      status      TEXT NOT NULL DEFAULT 'open'
    );
    CREATE TABLE IF NOT EXISTS error_events (
      id              SERIAL PRIMARY KEY,
      fingerprint     TEXT NOT NULL,
      message         TEXT NOT NULL,
      stack           TEXT,
      component_stack TEXT,
      url             TEXT,
      user_agent      TEXT,
      user_id         TEXT,
      app_name        TEXT NOT NULL,
      environment     TEXT NOT NULL,
      timestamp       TIMESTAMPTZ NOT NULL DEFAULT now(),
      metadata        JSONB
    );
  `)
  migrated = true
}

// ---------------------------------------------------------------------------
// AuthAdapter — for @blueforge-studio/auth-session
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Forge-git specific queries
// ---------------------------------------------------------------------------

export async function findOrCreateUserByGiteaLogin(params: {
  username: string
  email: string
  token: string
}): Promise<{ id: string }> {
  await runMigrations()
  const db = getDb()
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

export async function getUserGiteaToken(userId: string): Promise<string | null> {
  const db = getDb()
  const rows = await db.select({ giteaToken: forgeUsers.giteaToken })
    .from(forgeUsers)
    .where(eq(forgeUsers.id, userId))
    .limit(1)
  if (rows.length === 0 || !rows[0].giteaToken) return null
  return rows[0].giteaToken
}

export { getPool }
