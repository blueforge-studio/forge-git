# @forge-git/cli

CLI for managing repositories on [forge-git.blueforge.studio](https://forge-git.blueforge.studio) (self-hosted Gitea on Hetzner).

## Setup

```bash
# Get token from Hetzner (or generate a new one)
ssh root@178.104.233.155 "docker exec forge-git_forge-git_1 su-exec git /usr/local/bin/gitea admin user generate-access-token --config /data/gitea/conf/app.ini --username forge-admin --token-name <name> --scopes all"

# Add to ~/.zshrc (or .env)
export FORGE_GIT_TOKEN=<token>
export FORGE_GIT_URL=https://forge-git.blueforge.studio   # HTTPS — requires Caddy TLS working
# OR use the HTTP endpoint directly (if HTTPS is broken):
export FORGE_GIT_URL=http://178.104.233.155:3010
```

## Quick Start

```bash
# From forge-git repo (uses .env file via --env-file flag):
node --env-file=.env packages/cli/dist/index.js <command>

# Or install globally (after pnpm build):
pnpm add -g @forge-git/cli
fgit <command>
```

> **Note:** The `--env-file` flag requires Node 22+. If using an older version, export the env vars manually: `export FORGE_GIT_TOKEN=... FORGE_GIT_URL=...`

## Commands

### `fgit init <name> [options]`

Create a new repository on forge-git.

```bash
fgit init accounting-os --org blueforge-studio --private
fgit init my-repo --org blueforge-studio --public --description "My repo"
fgit init api-client --org blueforge-studio --gitignore node --license mit
```

**Options:**
- `--org <org>` — Organization name (default: `blueforge-studio`)
- `--private` — Make repo private (default: true)
- `--public` — Make repo public
- `--description <text>` — Repository description
- `--gitignore <template>` — Gitignore template (e.g. `node`, `python`, `rust`)
- `--license <license>` — License template (e.g. `mit`, `apache-2.0`, `gpl-3.0`)
- `--no-auto-init` — Skip README initialization

### `fgit list [options]`

List repositories.

```bash
fgit list --org blueforge-studio     # List org repos
fgit list --user                     # List your personal repos
```

### `fgit delete <name> [options]`

Delete a repository.

```bash
fgit delete accounting-os --org blueforge-studio --yes
```

**Options:**
- `--org <org>` — Organization name (default: `blueforge-studio`)
- `--yes` — Skip confirmation prompt

### `fgit webhook <name> <url> [options]`

Add a webhook to a repository.

```bash
fgit webhook accounting-os https://forge.blueforge.studio/api/webhooks/gitea
fgit webhook my-repo https://example.com/webhook --events push,pull_request
```

**Options:**
- `--org <org>` — Organization name (default: `blueforge-studio`)
- `--events <events>` — Comma-separated events (default: `push`)

### `fgit remote <name> [options]`

Print the git remote URL for a repository.

```bash
# HTTPS URL
fgit remote accounting-os

# SSH URL
fgit remote accounting-os --ssh
```

**Options:**
- `--org <org>` — Organization name (default: `blueforge-studio`)
- `--ssh` — Print SSH URL instead of HTTPS

### `fgit migrate <path> <name> [options]`

Full migration: create repo on forge-git + switch git remote + push.

```bash
fgit migrate /Users/kmandrup/Projects/Repos/accounting-os accounting-os --org blueforge-studio
```

**Options:**
- `--org <org>` — Organization name (default: `blueforge-studio`)
- `--private` — Make repo private (default: true)
- `--description <text>` — Repository description
- `--keep-remote` — Don't switch origin remote (add as secondary remote)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FORGE_GIT_TOKEN` | — | **Required.** Gitea access token |
| `FORGE_GIT_URL` | `https://forge-git.blueforge.studio` | Gitea API base URL |

### HTTPS vs HTTP

If HTTPS is not working (TLS handshake failures from Mac), use the direct HTTP endpoint:

```bash
export FORGE_GIT_URL=http://178.104.233.155:3010
```

Gitea itself runs on port 3010 internally. The HTTPS issue is in Caddy (the reverse proxy), not Gitea.

## Common Workflows

### Migrate a repo from GitHub to forge-git

```bash
# 1. Create repo on forge-git
fgit init accounting-os --org blueforge-studio --private

# 2. Push to forge-git (from local repo)
git remote set-url origin http://<token>@forge-git.blueforge.studio/blueforge-studio/accounting-os.git
git push -u origin --all
git push -u origin --tags
```

### Add CI to a repo

```bash
# 1. Create .gitea/workflows/ci.yml in your repo
# 2. Push to trigger Gitea Actions
git add .gitea/workflows/ci.yml
git commit -m "ci: add Gitea Actions workflow"
git push
```

Gitea Actions uses `.gitea/workflows/` (not `.github/workflows/`). For GitHub compatibility, add both:
- `.gitea/workflows/ci.yml` — Gitea Actions
- `.github/workflows/ci.yml` — GitHub Actions (can be identical)

## Troubleshooting

### "Only signed in user is allowed to call APIs"

Token is missing or invalid. Ensure `FORGE_GIT_TOKEN` is set and the token hasn't been revoked.

### "fetch failed" / ECONNREFUSED

Cannot reach the Gitea API. Try:
- Using HTTP endpoint: `export FORGE_GIT_URL=http://178.104.233.155:3010`
- Check Gitea is running: `ssh root@178.104.233.155 "docker ps | grep forge-git"`

### "LibreSSL/3.3.6: error:1404B42E:SSL routines:ST_CONNECT:tlsv1 alert protocol version"

Mac's LibreSSL can't connect to the Caddy TLS endpoint. Use HTTP directly (see above).

### Generate a new token

```bash
ssh root@178.104.233.155 "docker exec forge-git_forge-git_1 su-exec git /usr/local/bin/gitea admin user generate-access-token --config /data/gitea/conf/app.ini --username forge-admin --token-name cli-automation-$(date +%s) --scopes all"
```