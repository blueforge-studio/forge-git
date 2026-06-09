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
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const forgeOrgs = pgTable('forge_orgs', {
  id: text('id').primaryKey().default(uuid()),
  giteaOrg: text('gitea_org').notNull().unique(),
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

export const errorGroups = pgTable('error_groups', {
  fingerprint: text('fingerprint').primaryKey(),
  message: text('message').notNull(),
  stack: text('stack'),
  appName: text('app_name').notNull(),
  environment: text('environment').notNull(),
  firstSeen: timestamp('first_seen', { withTimezone: true }).notNull().defaultNow(),
  lastSeen: timestamp('last_seen', { withTimezone: true }).notNull().defaultNow(),
  lastUrl: text('last_url'),
  count: integer('count').notNull().default(1),
  status: text('status').notNull().default('open'),
})

export const errorEvents = pgTable('error_events', {
  id: serial('id').primaryKey(),
  fingerprint: text('fingerprint').notNull(),
  message: text('message').notNull(),
  stack: text('stack'),
  componentStack: text('component_stack'),
  url: text('url'),
  userAgent: text('user_agent'),
  userId: text('user_id'),
  appName: text('app_name').notNull(),
  environment: text('environment').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  metadata: jsonb('metadata'),
})
