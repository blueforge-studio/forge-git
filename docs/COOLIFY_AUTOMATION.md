# Coolify Automation — Full Reference

## Overview

Provisioning a new Coolify server is fully automatable via API/scripts. No UI clicking required.

## Architecture

```
[You] → Hetzner API → new VM boots → cloud-init → Coolify auto-installed
                ↓
        Cloudflare DNS API → A record: coolify.blueforge.studio → VM IP
                ↓
        Coolify API → Gitea source → deploy apps
```

## Server Setup

### Option A: One-shot script (fastest)

```bash
# Prerequisites
export HETZNER_API_TOKEN=your_hetzner_token
export CF_API_TOKEN=your_cloudflare_token          # optional
export COOLIFY_EMAIL=kmandrup@gmail.com
export COOLIFY_PASSWORD=your_secure_password

# Provision and install
bash bin/provision-coolify.sh coolify nbg1 cpx22
```

This script:
1. Creates a Hetzner server (cpx22, Ubuntu 24.04)
2. Optionally adds Cloudflare DNS record
3. Waits for server to boot
4. Waits for Coolify to become healthy (~5 min)
5. Saves credentials to `.env.coolify`

### Option B: Cloud-init template (for Terraform/Pulumi)

```bash
# Fill in the template
sed -e "s/\${SERVER_NAME}/coolify/g" \
    -e "s/\${COOLIFY_EMAIL}/${COOLIFY_EMAIL}/g" \
    -e "s/\${COOLIFY_PASSWORD}/${COOLIFY_PASSWORD}/g" \
    -e "s/\${COOLIFY_FQDN}/coolify.blueforge.studio/g" \
    cloudinit/coolify.yml.tpl > /tmp/coolify.yml

# Base64-encode for Hetzner API
USER_DATA=$(cat /tmp/coolify.yml | base64 -w 0)

# Create server with user_data
curl -X POST "https://api.hetzner.cloud/v1/servers" \
  -H "Authorization: Bearer $HETZNER_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"coolify\",
    \"server_type\": \"cpx22\",
    \"location\": \"nbg1\",
    \"image\": \"161547269\",
    \"ssh_keys\": [YOUR_KEY_ID],
    \"user_data\": \"$USER_DATA\"
  }"
```

## DNS Setup

```bash
# Add coolify.blueforge.studio → <server-ip>
CF_API_TOKEN=xxx DOMAIN=blueforge.studio \
  bash bin/cloudflare-dns.sh coolify <server-ip>

# With Cloudflare proxy (HTTP proxy through CF)
CF_API_TOKEN=xxx DOMAIN=blueforge.studio \
  bash bin/cloudflare-dns.sh coolify <server-ip> true
```

## Cloudflare DNS Script

**`bin/cloudflare-dns.sh`** — Add/update A record in Cloudflare.

```bash
CF_API_TOKEN=xxx DOMAIN=blueforge.studio bash bin/cloudflare-dns.sh <subdomain> <ip> [proxied]
```

| Arg | Description |
|-----|-------------|
| subdomain | Subdomain prefix (e.g. `coolify` → `coolify.blueforge.studio`) |
| ip | IPv4 address |
| proxied | `true` = Cloudflare proxy active, `false` = direct (default) |

## Coolify API

Coolify exposes a REST API. Base URL: `http://<server-ip>:8000/api`

### Authentication

All requests require:
```
Authorization: Bearer <APP_KEY>
```

`APP_KEY` is in `/data/coolify/source/.env` on the Coolify server:
```bash
ssh root@<server-ip> "grep APP_KEY /data/coolify/source/.env"
```

### API Endpoints (Coolify v4)

```bash
COOLIFY_URL=http://178.105.61.154:8000
APP_KEY=$(ssh root@178.105.61.154 "grep APP_KEY /data/coolify/source/.env | cut -d= -f2")

# Health check
curl -s "$COOLIFY_URL/api/v1/health" \
  -H "Authorization: Bearer $APP_KEY"

# List sources (Gitea/GitHub connections)
curl -s "$COOLIFY_URL/api/v1/sources" \
  -H "Authorization: Bearer $APP_KEY"

# Add Gitea source
curl -X POST "$COOLIFY_URL/api/v1/sources" \
  -H "Authorization: Bearer $APP_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "gitea",
    "name": "forge-git",
    "url": "http://178.104.233.155:3010",
    "token": "<gitea-token>"
  }'

# List projects
curl -s "$COOLIFY_URL/api/v1/projects" \
  -H "Authorization: Bearer $APP_KEY"

# Create project
curl -X POST "$COOLIFY_URL/api/v1/projects" \
  -H "Authorization: Bearer $APP_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "blueforge", "description": "BlueForge apps"}'

# List available apps/repos from a source
curl -s "$COOLIFY_URL/api/v1/sources/1/repositories" \
  -H "Authorization: Bearer $APP_KEY"

# Deploy an app (trigger build + deploy)
curl -X POST "$COOLIFY_URL/api/v1/deployments" \
  -H "Authorization: Bearer $APP_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "application_id": 1,
    "branch": "main",
    "commit_hash": null
  }'

# Deployment status
curl -s "$COOLIFY_URL/api/v1/deployments/1" \
  -H "Authorization: Bearer $APP_KEY"
```

### Auto-discovery

If API endpoints differ from above, discover them:

```bash
# Get API version/schema
curl -s "$COOLIFY_URL/api/v1/version"

# List all available endpoints (root)
curl -s "$COOLIFY_URL/api/v1/" \
  -H "Authorization: Bearer $APP_KEY"

# Webhooks for CI integration
# POST /api/v1/webhooks/deploy?project=&app=&branch=
```

## Gitea Token Setup

To connect Gitea as a Coolify source:

1. In Gitea → Settings → Applications → Create Token
2. Name: `coolify-source`
3. Scopes needed: `repo`, `read:user`
4. Use the token in the API call above

## Provisioning Scripts

| File | Purpose |
|------|---------|
| `bin/provision-coolify.sh` | Main entrypoint — create server + install Coolify |
| `bin/cloudflare-dns.sh` | Add Cloudflare DNS A record |
| `cloudinit/coolify.yml.tpl` | Cloud-init template for Terraform/Pulumi |

## Environment Files

After running `provision-coolify.sh`, credentials are saved to:

```
forge-git/.env.coolify
```

```env
COOLIFY_URL=http://178.105.61.154:8000
COOLIFY_EMAIL=kmandrup@gmail.com
COOLIFY_PASSWORD=your_password
COOLIFY_APP_KEY=base64_app_key_here
COOLIFY_SERVER_ID=128330117
COOLIFY_SERVER_IP=178.105.61.154
```

Source it with: `set -a && source .env.coolify && set +a`

## Troubleshooting

### Server won't boot
```bash
# Check serial console
curl -H "Authorization: Bearer $HETZNER_API_TOKEN" \
  "https://api.hetzner.cloud/v1/servers/{id}/serial_console"
```

### Coolify won't install
```bash
# SSH in and check logs
ssh root@<server-ip>
cat /data/coolify/source/installation-$(date +%Y%m%d)*.log
docker logs coolify
docker ps
```

### Cloud-init didn't run
```bash
# On the server
cloud-init status        # detailed status
cloud-init logs          # full logs
cat /var/log/cloud-init.log
```

### API returns 401/403
```bash
# Get fresh APP_KEY
ssh root@<server-ip> "grep APP_KEY /data/coolify/source/.env"
```

## Teardown

```bash
# Delete server (irreversible)
SERVER_ID=128330117
curl -X DELETE "https://api.hetzner.cloud/v1/servers/${SERVER_ID}" \
  -H "Authorization: Bearer $HETZNER_API_TOKEN"
```
