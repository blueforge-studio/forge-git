import { eq } from 'drizzle-orm'
import { forgeUsers } from './schema'
import { runMigrations, type DB } from './client'

export async function findOrCreateUserByGiteaLogin(
  db: DB,
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
  db: DB,
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
  db: DB,
  userId: string,
): Promise<string | null> {
  const rows = await db.select({ giteaToken: forgeUsers.giteaToken })
    .from(forgeUsers)
    .where(eq(forgeUsers.id, userId))
    .limit(1)
  if (rows.length === 0 || !rows[0].giteaToken) return null
  return rows[0].giteaToken
}
