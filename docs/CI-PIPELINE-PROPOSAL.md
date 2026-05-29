# CI/CD Pipeline — forge-git

> **Status:** Proposal — not yet implemented

## Context

forge-git has a `deploy-runner` (BullMQ worker) that executes Docker-based CI jobs. The README shows `.forge-git.yml` syntax but the actual CI runner implementation is incomplete. This proposal fills the gap.

## What We Have

| Component | Status | Location |
|-----------|--------|----------|
| Gitea bridge | Working | `packages/gitea-bridge/` |
| Web UI | Basic | `apps/web/` |
| Deploy runner | Stub | `packages/deploy-runner/src/` |
| `.forge-git.yml` parser | None | — |
| Workflow execution engine | None | — |
| Artifact cache | None | — |
| Secrets management | None | — |
| GitHub Actions compat | None | — |

## What's Missing

### 1. Workflow Parser
Gitea Actions YAML is similar to GitHub Actions but with differences. Need to:
- Parse `.forge-git.yml` / `.github/workflows/*.yml`
- Normalize Gitea Action syntax to internal representation
- Support `on: push/pull_request/schedule` triggers

### 2. Job Executor
- Sequential/step execution within a job
- Parallel job execution (when `needs:` absent)
- Step logging (stdout/stderr streamed to UI in real-time)
- Job artifacts (test results, built images)

### 3. GitHub Actions Compatibility
Many users have `.github/workflows/*.yml` files. Adding a compatibility layer:
- Parse GitHub Actions YAML
- Map `actions/checkout@v4` → forge-git runner step
- Handle `secrets:` and `env:` contexts
- Support matrix builds

### 4. Caching
- `actions/cache` compatible cache
- Per-commit artifact storage in MinIO
- Build layer caching (Docker layer reuse via BuildKit)

### 5. Secrets
- Per-repo encrypted secrets (like GitHub Secrets)
- `secrets.FOO` injection in workflows
- No plaintext secrets in logs

### 6. Concurrency Control
- Per-repo parallelism limits
- Queue priority (PRs vs main branch)
- Cancel redundant runs when new push arrives

## Proposed Architecture

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│ Gitea webhook   │───▶│  @forge-git/api      │───▶│  BullMQ Queue   │
│ (push/PR/schedule)│    │  workflow parser      │    │  (workflow-jobs)│
└─────────────────┘    └──────────────────────┘    └────────┬────────┘
                                                             │
                        ┌──────────────────────┐    ┌────────▼────────┐
                        │  deploy-runner       │◀───│  Redis          │
                        │  - job executor       │    │  - job state    │
                        │  - step logger        │    │  - logs         │
                        │  - artifact store     │    └─────────────────┘
                        └──────────┬────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │        Docker worker          │
                    │  (isolated per job execution) │
                    └──────────────────────────────┘
```

## Workflow Format

### `.forge-git.yml` (forged-native)
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:

env:
  NODE_ENV: test

jobs:
  test:
    runs-on: forge-hosted
    steps:
      - name: Checkout
        uses: forge-git/checkout@v1
      - name: Setup Node
        uses: forge-git/setup-node@v1
        with:
          node-version: '20'
      - name: Install
        run: pnpm install
      - name: Test
        run: pnpm test

  build:
    runs-on: forge-hosted
    needs: test
    steps:
      - name: Checkout
        uses: forge-git/checkout@v1
      - name: Build
        run: pnpm build
      - name: Push artifact
        uses: forge-git/artifact@v1
        with:
          path: ./dist
          destination: s3://forge-artifacts/${{ github.sha }}
```

### `.github/workflows/ci.yml` (GitHub Actions compat)
```yaml
name: CI

on: [push, pull_request]

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
```

forge-git intercepts this format and normalizes it internally.

## Built-in Actions

| Action | Description |
|--------|-------------|
| `forge-git/checkout@v1` | Git clone + LFS fetch |
| `forge-git/setup-node@v1` | Node.js + pnpm |
| `forge-git/setup-python@v1` | Python + pip |
| `forge-git/cache@v1` | Cache dependencies |
| `forge-git/artifact@v1` | Upload/download artifacts |
| `forge-git/deploy@v1` | Trigger forge-hosting deployment |

## Implementation Tasks

### Phase 1: Core Runner
- [ ] Workflow parser (`packages/deploy-runner/src/parser.ts`)
- [ ] Job queue integration (`packages/deploy-runner/src/worker.ts`)
- [ ] Docker step executor (`packages/deploy-runner/src/executor.ts`)
- [ ] Real-time log streaming via SSE

### Phase 2: GitHub Actions Compatibility
- [ ] GitHub Actions YAML parser
- [ ] Built-in action replacements (`actions/checkout@v4` → `forge-git/checkout@v1`)
- [ ] Secrets context resolution

### Phase 3: Caching + Artifacts
- [ ] MinIO artifact storage
- [ ] Dependency cache (pnpm/npm pip)
- [ ] Docker layer cache via BuildKit

### Phase 4: Polish
- [ ] Workflow status badge (SVG)
- [ ] PR comment with status/results
- [ ] Concurrency control (cancel in-flight on new push)
- [ ] Matrix builds support

## Open Questions

1. **Execution environment:** Docker-in-Docker (dind) vs Kaniko for container builds?
2. **Gitea Actions vs fork:** Are we using Gitea Actions or a custom engine?
3. **Self-hosted runners:** Support `runs-on: self-hosted` label for user infra?

## Related

- forge-hosting: handles deployment after CI passes
- forge-git webhook → triggers workflow in forge-git API
- forge-git deploy-runner → creates deployment in forge-hosting