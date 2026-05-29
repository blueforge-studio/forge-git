# Gitea Actions → Hetzner Deploy Setup

This documents the SSH-based Git → Hetzner deployment pipeline using Gitea Actions.

## Architecture

```
Git push → Gitea Actions (ubuntu-latest) → SSH to Hetzner → rsync → systemd restart
                                                              → Caddy route update
```

## SSH Key Setup (one-time)

Run on your Mac to generate a deploy key:

```bash
# Generate Ed25519 key pair for Gitea → Hetzner deploy
ssh-keygen -t ed25519 -f ~/.ssh/gitea_hetzner_deploy -N "" -C "gitea-actions-deploy"

# Copy public key to Hetzner
ssh root@178.104.233.155 "mkdir -p ~/.ssh && echo '$(cat ~/.ssh/gitea_hetzner_deploy.pub)' >> ~/.ssh/authorized_keys"

# Verify it works
ssh -i ~/.ssh/gitea_hetzner_deploy root@178.104.233.155 "echo 'SSH access OK'"
```

**Save the private key content** — you'll add it as a Gitea secret:

```bash
cat ~/.ssh/gitea_hetzner_deploy
```

## Adding Secrets + Variables to Gitea Repos

For each repo on `forge-git.blueforge.studio`:

1. Go to: `https://forge-git.blueforge.studio/<org>/<repo>/settings/secrets/actions`
2. Add secret: `HETZNER_SSH_KEY` = contents of `~/.ssh/gitea_hetzner_deploy` (the private key)
3. Go to: `https://forge-git.blueforge.studio/<org>/<repo>/settings/variables/actions`
4. Add variables:
   - `APP_NAME` = e.g., `forge-auth`, `invoice-os`
   - `APP_PORT` = e.g., `3580`, `3592`
   - `NEXT_APP_DIR` = e.g., `.` (single app) or `apps/web` (monorepo)

## Gitea Actions Workflow

See `.gitea/workflows/deploy.yml` in each app.

## App Port Map (Hetzner 178.104.233.155)

| Port | App | Status |
|------|-----|--------|
| 3000 | forge-hosting-dashboard | running |
| 3580 | forge-auth | running |
| 3581 | accounting-os | running |
| 3582 | restaurant-os | running |
| 3583 | clinic-os | running |
| 3584 | garage-os | running |
| 3585 | appflow-os | running |
| 3586 | leads-os | NOT running |
| 3587 | waste-os | NOT running |
| 3589 | maintenance-os | running (from earlier) |
| 3590 | maintenance-os-site | NOT running |
| 3591 | construction-os | NOT running |
| 3592 | invoice-os | NOT running |
| 3593 | contracts-os | NOT running |
| 3594 | proposal-os | NOT running |

## Caddyfile Location

On Hetzner: `/etc/caddy/Caddyfile` (managed by Docker `forge-git_caddy_1`)

Caddy is configured via the Docker Compose `Caddyfile` at `/root/forge-git/Caddyfile`. Changes to that file are automatically reloaded by Caddy.

## Troubleshooting

```bash
# Check service status on Hetzner
ssh root@178.104.233.155 "systemctl status forge-auth"

# View logs
ssh root@178.104.233.155 "journalctl -u forge-auth -n 50 --no-pager"

# Restart manually
ssh root@178.104.233.155 "systemctl restart forge-auth"

# Check if port is listening
ssh root@178.104.233.155 "ss -tlnp | grep 3580"
```
