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
