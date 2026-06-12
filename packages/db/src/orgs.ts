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
