import { pgTable, text, integer, boolean, timestamp, primaryKey } from 'drizzle-orm/pg-core'
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
