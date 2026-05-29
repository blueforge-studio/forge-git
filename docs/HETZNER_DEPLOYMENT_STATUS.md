# Hetzner Deployment Status — 2026-04-28

## Current Servers

| Name | IP | Status | Notes |
|------|-----|--------|-------|
| blueforge-platform | 178.104.233.155 | running | Gitea, forge-hosting, all apps |
| blueforge-coolify | 178.105.61.154 | **off** | Coolify 4.0.0-beta.474 (provisioned, not in use) |

## blueforge-platform (178.104.233.155) — Running Services

| Service | Port | URL | Notes |
|---------|------|-----|-------|
| Gitea | 2222, 3010 | forge-git.blueforge.studio | Docker |
| Caddy | 80, 443 | *.blueforge.studio | Auto-TLS |
| forge-hosting | 3000 | forge-hosting.blueforge.studio | systemd |
| forge-auth | 3580 | auth.blueforge.studio | systemd |
| PostgreSQL | 5432 | docker_postgres_1 | Docker |
| Redis | 6379 | docker_redis_1 | Docker |
| accounting-os | 3581 | accounting.blueforge.studio | systemd |
| restaurant-os | 3582 | restaurant.blueforge.studio | systemd |
| clinic-os | 3583 | clinic.blueforge.studio | systemd |
| garage-os | 3584 | garage.blueforge.studio | systemd |
| appflow-os | 3585 | appflow.blueforge.studio | systemd |

## blueforge-coolify (178.105.61.154) — SHUTDOWN

Coolify is installed but the server is off. To spin it back up:

```bash
# Start the server
curl -X POST "https://api.hetzner.cloud/v1/servers/128330117/actions/poweron" \
  -H "Authorization: Bearer $HETZNER_API_TOKEN"

# Wait for boot (~2 min), then get credentials
ssh root@178.105.61.154 "grep APP_KEY /data/coolify/source/.env"
```

Or re-provision fresh:

```bash
export HETZNER_API_TOKEN=xxx
export CF_API_TOKEN=xxx   # optional
bash bin/provision-coolify.sh blueforge-coolify nbg1 cpx22
```

Full automation docs: `docs/COOLIFY_AUTOMATION.md`

## NOT Yet Deployed (but Caddy routes exist)

| App | Port | Caddy Route | Status |
|-----|------|-------------|--------|
| leads-os | 3586 | leads.blueforge.studio | No service |
| waste-os | 3587 | waste.blueforge.studio | No service |
| maintenance-os | 3589 | maintenance.blueforge.studio | No service |
| construction-os | 3591 | construction.blueforge.studio | No service |
| invoice-os | 3592 | invoice.blueforge.studio | No service |
| contracts-os | 3593 | contracts.blueforge.studio | No service |
| proposal-os | 3594 | proposal.blueforge.studio | No service |
| forge-error-tracker | ? | ? | Not built |
| infra-os | ? | ? | Not built |
| mailstack-os | ? | mailstack.blueforge.studio | Not built |
| platform-api | 3042 | api.blueforge.studio | Not built |

### Missing Apps (not on Hetzner at all)

- forge-error-tracker
- infra-os
- mailstack-os
- forge-control packages (server-provisioner, platform-api)

---

## Deployment Pipeline Options

### Option A: Gitea Actions → SSH Deploy (FASTEST PATH)

```
Git push → Gitea Actions → SSH to Hetzner → rsync → systemd restart
```

**What's needed:**
1. SSH key pair for Gitea → Hetzner (generate once)
2. `HETZNER_SSH_KEY` secret + `APP_NAME`, `APP_PORT`, `NEXT_APP_DIR` vars in each Gitea repo
3. `.gitea/workflows/deploy.yml` in each app repo (already created for forge-auth, accounting-os)
4. `output: 'standalone'` in each app's `next.config.ts`

**Apps ready for this:**
- ✅ forge-auth (has Dockerfile + standalone output)
- ✅ accounting-os (has standalone, deploy.yml updated)
- ⏳ leads-os (has Dockerfile, deploy.yml exists but forge-hosting API)
- ⏳ invoice-os (needs standalone + Dockerfile + deploy.yml)
- ⏳ others need Dockerfile + standalone config

**One-time SSH setup:**
```bash
# Generate deploy key
ssh-keygen -t ed25519 -f ~/.ssh/gitea_hetzner_deploy -N "" -C "gitea-actions-deploy"

# Add to Hetzner
ssh root@178.104.233.155 "echo '$(cat ~/.ssh/gitea_hetzner_deploy.pub)' >> ~/.ssh/authorized_keys"

# Add private key as Gitea secret in each repo:
# Settings → Secrets → Add secret: HETZNER_SSH_KEY = contents of ~/.ssh/gitea_hetzner_deploy
```

### Option B: forge-hosting → Hetzner (BUILT, NEEDS WIRING)

```
GitHub/Gitea → webhook → BullMQ → build-worker → SSH deploy to Hetzner
```

**Status:** ~70% built. Missing:
- Gitea webhook handler ✅ (just added)
- Cloudflare routing ✅ (just implemented)
- Live build log streaming ✅ (just added)
- Docker build isolation (NOT implemented)
- PR preview routing (NOT implemented)

**forge-hosting lives at:** `http://178.104.233.155:3000` (forge-hosting-dashboard.service)

### Option C: Coolify (SEPARATE SERVER)

**Coolify server:** `blueforge-coolify` (178.105.61.154) — currently **off**. See `docs/COOLIFY_AUTOMATION.md` for full API reference.

**To bring up:**
```bash
# Start server
curl -X POST "https://api.hetzner.cloud/v1/servers/128330117/actions/poweron" \
  -H "Authorization: Bearer $HETZNER_API_TOKEN"

# Get credentials
ssh root@178.105.61.154 "grep APP_KEY /data/coolify/source/.env"
```

**Or re-provision fresh (idempotent):**
```bash
export HETZNER_API_TOKEN=xxx
export CF_API_TOKEN=xxx
bash bin/provision-coolify.sh blueforge-coolify nbg1 cpx22
```

**Pros:** Full Git→Docker→TLS→DB provisioning, web UI, one-click services
**Cons:** Separate server ($6-30/mo), learning curve

---

## forge-control Platform Services

### platform-api (NOT deployed)
- **Purpose:** Project/DB provisioning API (create project → provisions Postgres DB)
- **Port:** 3042 (would be)
- **Location:** `/root/forge-control/` (not on server yet)
- **Docker image:** `ghcr.io/blueforge/api-server:latest` (NOT built yet)

**To deploy:**
```bash
# 1. Build and push Docker image (on Mac)
docker build -f docker/api-server.dockerfile -t ghcr.io/blueforge/api-server:latest .
docker push ghcr.io/blueforge/api-server:latest

# 2. Copy forge-control to Hetzner
scp -r /Users/kmandrup/Projects/Repos/forge-control root@178.104.233.155:/root/

# 3. Run on Hetzner
ssh root@178.104.233.155
cd /root/forge-control
docker compose -f docker/compose.api-server.yml --env-file .env up -d

# 4. Add Caddy route
# Edit /root/forge-git/Caddyfile, add:
# api.blueforge.studio { reverse_proxy localhost:3042 }
# docker compose -f /root/forge-git/docker-compose.yml exec caddy caddy reload
```

### server-provisioner (NOT a service)
- **Purpose:** Library that provisions Hetzner VMs
- **Not deployed** — it's a library (`@blueforge-studio/server-provisioner`)

### api-server (NOT deployed)
- **Purpose:** Per-project REST API (PostgREST-like)
- **Docker compose + systemd service prepared** but not deployed
- Port: would be dynamic per-project

---

## DNS (Cloudflare)

Zone: `blueforge.studio` (zone ID: `b2a7319881e0600969600b0572793515`)

Key records pointing to 178.104.233.155:
```
A  forge-git.blueforge.studio     → 178.104.233.155
A  forge-hosting.blueforge.studio → 178.104.233.155
A  auth.blueforge.studio        → 178.104.233.155
A  accounting.blueforge.studio  → 178.104.233.155
... (many more)
```

All proxied through Caddy on the Hetzner server.

---

## Priority Actions

### P0 — Get apps running on Hetzner
1. Set up SSH deploy key
2. Deploy leads-os (simple, has Dockerfile) as test
3. Deploy invoice-os
4. Deploy mailstack-os

### P1 — Wire forge-hosting
1. Deploy platform-api to Hetzner (port 3042)
2. Add Caddy route for api.blueforge.studio
3. Test Gitea webhook → forge-hosting → Hetzner deploy

### P2 — Coolify
1. Create new Hetzner server for Coolify
2. Install Coolify
3. Migrate one app as test

### P3 — forge-control platform
1. Build + push api-server Docker image
2. Deploy to Hetzner
3. Wire apps to use platform-api for DB provisioning
