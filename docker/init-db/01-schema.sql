-- forge-git schema init
-- Runs on first Postgres container start via docker-entrypoint-initdb.d

CREATE TABLE IF NOT EXISTS forge_users (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT,
  avatar_url      TEXT,
  gitea_token     TEXT,
  gitea_username  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forge_orgs (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  gitea_org     TEXT NOT NULL UNIQUE,
  display_name  TEXT,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
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
