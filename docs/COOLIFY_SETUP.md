# Coolify Setup on New Hetzner Server

## Prerequisites

**You need a second Hetzner server** — your current account is limited to 1 server (`blueforge-platform`).

To proceed:
1. Go to https://console.hetzner.cloud/project/limit-settings
2. Request a server limit increase (or add a payment method to auto-raise)
3. Once approved, run the script below

## Step 1: Create the server

```bash
cd /Users/kmandrup/Projects/Repos/forge-git
HETZNER_API_TOKEN=<your-token> bash bin/create-coolify-server.sh blueforge-coolify cpx22 nbg1
```

**If you hit `resource_limit_exceeded`**: the server limit hasn't been raised yet — skip to Step 2 (install on existing server) or wait for the limit increase.

**Default server type is `cpx22`** (2 vCPU, 4GB RAM) — `cpx21` was unsupported in this zone.

## Step 2: Install Coolify

SSH in once the server is ready and run:

```bash
ssh root@<SERVER_IP>
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

The installer will:
- Install Docker (if not present)
- Set up Coolify in `/data/coolify/`
- Configure Traefik on ports 80/443
- Create an initial admin user

After install, you'll get:
- Coolify URL (the server's IP on port 3000)
- Initial admin password

## Step 3: Configure Coolify

1. Open Coolify at `http://<server-ip>:3000`
2. Login with the admin credentials
3. Add your Hetzner server as a "Gateway" (or it acts as its own gateway)

## Step 4: Connect Gitea as a Git Source

In Coolify UI:
1. Go to **Sources** → Add new Source
2. Select **Gitea**
3. Enter:
   - URL: `http://178.104.233.155:3010` (your existing Gitea)
   - Token: Your Gitea access token (generate at Gitea → Settings → Applications)

## Step 5: Deploy an app via Coolify

1. **New Project** → Connect Gitea source
2. **Add Repository** → Select `forge-auth`
3. **Configure Build**:
   - Build Pack: Nixpacks (auto-detects Next.js)
   - Port: 3580
4. **Configure Domains**:
   - `auth.blueforge.studio` → proxy to port 3580
5. **Deploy** — Coolify pulls, builds (Nixpacks/Dockerfile), and deploys

## Alternative: Install on Existing Server (No Extra Server Needed)

If you can't get a second server, install Coolify on the existing `178.104.233.155` alongside Caddy:

```bash
ssh root@178.104.233.155

# Stop Caddy (it uses ports 80/443 which Coolify/Traefik needs)
systemctl stop caddy

# Install Coolify
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

**Warning**: Coolify replaces Caddy as the reverse proxy. You'll need to either:
- Move Caddy routes to Coolify Traefik
- Or run Coolify on non-standard ports and proxy through existing Caddy

## Quick Test Server

```bash
HETZNER_API_TOKEN=<token> bash bin/create-coolify-server.sh coolify-test cpx22 nbg1
```

## Resource Requirements

- **Coolify control plane**: ~1GB RAM
- **Per app (Docker)**: ~100-500MB RAM
- **Recommended server**: cpx22 (2 cores, 4GB) minimum

## Coolify vs Current Hetzner Setup

| Aspect | Current (Caddy + systemd) | Coolify |
|--------|---------------------------|---------|
| Git deploy | Manual/Gitea Actions SSH | Automatic on push |
| TLS | Manual Caddy | Automatic Let's Encrypt |
| DB provisioning | Manual | One-click Postgres |
| Web UI | None (CLI/systemd) | Full dashboard |
| Containers | No | Yes (Docker) |
| Port conflicts | Caddy on :443 | Traefik on :80/:443 |
