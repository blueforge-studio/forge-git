# forge-git

Self-hosted Git platform — Gitea-powered Git hosting with CI/CD, pull requests, issues, and releases.

## Features

- **Repositories** — Browse, create, and manage Git repositories (public/private)
- **Pull Requests** — Create, review, merge, and close PRs
- **Issues** — Track bugs and feature requests with issue management
- **Releases** — Publish and manage software releases
- **Branches & Commits** — Browse branches and commit history
- **Webhooks** — Configure repository webhooks for automation
- **Deploy Keys** — Manage SSH deploy keys per repository
- **Branch Protection** — Set up branch protection rules
- **Organizations** — Create orgs, manage teams and members
- **CI/CD Pipeline** — Trigger builds, track queued/running/completed/failed jobs
- **Dark Mode** — Light/dark theme with system preference detection
- **Internationalization** — Multi-locale support (English, Spanish, Chinese) via next-intl

## Stack

- **Gitea** — Git hosting, web UI, user management
- **Next.js 16** — Web UI (React 19, Tailwind 4, Turbopack, next-intl)
- **BullMQ + Redis** — CI/CD job queue
- **Docker** — Isolated build workers
- **MinIO** — Build artifacts + cache storage
- **PostgreSQL** — forge-git metadata (orgs, teams, workflows)

## Architecture

```
┌─────────────────────────────────────────────┐
│                   Gitea                       │
│         (port 3001, SQLite/PG)              │
└──────────────┬──────────────────────────────┘
               │ REST API
┌──────────────▼──────────────────────────────┐
│          @forge-git/gitea-bridge            │
│      Typed client for Gitea REST API         │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│         @forge-git/web (Next.js)            │
│   Git platform UI + build dashboard         │
└──────────────┬──────────────────────────────┘
               │ BullMQ
┌──────────────▼──────────────────────────────┐
│         @forge-git/deploy-runner            │
│       Docker-based CI job executor          │
└─────────────────────────────────────────────┘
```

## Getting Started

```bash
# Start infrastructure
docker compose up -d

# Install dependencies
pnpm install

# Start web UI
pnpm --filter @forge-git/web dev

# Start deploy runner (separate terminal)
pnpm --filter @forge-git/deploy-runner dev
```

## Packages

| Package | Description |
|---------|-------------|
| `@forge-git/web` | Next.js web UI |
| `@forge-git/ui` | shadcn-style React components (Button, Input, Badge, etc.) |
| `@forge-git/gitea-bridge` | Typed Gitea API client (repos, orgs, PRs, issues, releases, webhooks, etc.) |
| `@forge-git/deploy-runner` | BullMQ CI/CD worker |
| `@forge-git/cli` | CLI tools for token generation and management |

## Environment Variables

```env
GITEA_URL=http://localhost:3001
GITEA_TOKEN=           # Gitea admin access token
REDIS_URL=redis://localhost:6379
MINIO_URL=http://localhost:9000
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
```

## .forge-git.yml Syntax

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t myapp .
      - push: myregistry/myapp
```

## Ports

| Service | Port |
|---------|------|
| Gitea | 3001 |
| forge-git web | 3000 |
| MinIO console | 9001 |
| PostgreSQL | 5432 |
| Redis | 6379 |
