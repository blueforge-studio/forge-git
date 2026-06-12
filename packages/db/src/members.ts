import { and, asc, eq } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { forgeMembers, forgeOrgs, forgeUsers } from './schema'
import { runMigrations } from './client'

export type Member = {
  orgId: string
  userId: string
  role: string
  giteaOrg?: string | null
  giteaUsername?: string | null
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
