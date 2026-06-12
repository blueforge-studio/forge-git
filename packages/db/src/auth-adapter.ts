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
