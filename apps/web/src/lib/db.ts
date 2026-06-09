import { Pool } from 'pg'
import type { AuthAdapter } from '@blueforge-studio/auth-session'

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://forge:forge@localhost:5432/forge-git'

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: DATABASE_URL, max: 10 })
  }
  return pool
}

// ---------------------------------------------------------------------------
// Schema — auto-migrated on first use
// ---------------------------------------------------------------------------

let migrated = false

export async function runMigrations(): Promise<void> {
  if (migrated) return
  const p = getPool()
  await p.query(`
    CREATE TABLE IF NOT EXISTS forge_users (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      avatar_url  TEXT,
      gitea_token TEXT,
      gitea_username TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS forge_orgs (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      gitea_org   TEXT NOT NULL UNIQUE,
      display_name TEXT,
      description TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
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
    const { rows } = await getPool().query(
      'SELECT id, name, email, password_hash FROM forge_users WHERE email = $1',
      [email],
    )
    if (rows.length === 0) return null
    const r = rows[0]
    return { id: r.id, name: r.name, email: r.email, passwordHash: r.password_hash }
  },

  async createUser(name: string, email: string, passwordHash: string) {
    await runMigrations()
    const { rows } = await getPool().query(
      `INSERT INTO forge_users (name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET name = $1, password_hash = $3
       RETURNING id, name, email`,
      [name, email, passwordHash],
    )
    return rows[0]
  },

  async getUserById(id: string) {
    await runMigrations()
    const { rows } = await getPool().query(
      'SELECT id, name, email FROM forge_users WHERE id = $1',
      [id],
    )
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
  const { rows } = await getPool().query(
    `INSERT INTO forge_users (name, email, gitea_token, gitea_username)
     VALUES ($1, $2, $3, $1)
     ON CONFLICT (email) DO UPDATE SET gitea_token = $3, gitea_username = $1
     RETURNING id`,
    [params.username, params.email, params.token],
  )
  return rows[0]
}

export async function getUserGiteaToken(userId: string): Promise<string | null> {
  const { rows } = await getPool().query(
    'SELECT gitea_token FROM forge_users WHERE id = $1',
    [userId],
  )
  if (rows.length === 0 || !rows[0].gitea_token) return null
  return rows[0].gitea_token
}

export { getPool }
