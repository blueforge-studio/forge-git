import { asc, eq } from 'drizzle-orm'
import { forgeOrgs } from './schema'
import { runMigrations, type DB } from './client'

export type Org = typeof forgeOrgs.$inferSelect

export async function listOrgs(db: DB): Promise<Org[]> {
  await runMigrations()
  return db.select().from(forgeOrgs).orderBy(asc(forgeOrgs.createdAt))
}

export async function getOrgByName(db: DB, giteaOrg: string): Promise<Org | null> {
  await runMigrations()
  const rows = await db.select().from(forgeOrgs)
    .where(eq(forgeOrgs.giteaOrg, giteaOrg))
    .limit(1)
  return rows[0] ?? null
}

export async function getOrgByGiteaId(db: DB, giteaId: number): Promise<Org | null> {
  await runMigrations()
  const rows = await db.select().from(forgeOrgs)
    .where(eq(forgeOrgs.giteaId, giteaId))
    .limit(1)
  return rows[0] ?? null
}

export async function upsertOrgByGiteaId(
  db: DB,
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

export async function deleteOrgByName(db: DB, giteaOrg: string): Promise<void> {
  await runMigrations()
  await db.delete(forgeOrgs).where(eq(forgeOrgs.giteaOrg, giteaOrg))
}
