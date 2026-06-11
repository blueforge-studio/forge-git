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
// Migration — runs pending Drizzle Kit migrations on first use
// ---------------------------------------------------------------------------

let migrated = false

export async function runMigrations(): Promise<void> {
  if (migrated) return
  const { migrate } = await import('drizzle-orm/node-postgres/migrator')
  await migrate(getDb(), { migrationsFolder: './drizzle' })
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
