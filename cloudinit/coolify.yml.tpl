#cloud-init
# Coolify automatic installation via cloud-init
# This file is a template — fill in COOLIFY_EMAIL and COOLIFY_PASSWORD
# before passing to Hetzner as user_data.

# ── System setup ──────────────────────────────────────────────────────────────
ssh_pwauth: true
users:
  - default

package_update: true
packages:
  - curl
  - wget
  - git
  - jq
  - openssl
  - python3
  - python3-pip
  - python3-yaml

growpart:
  mode: auto
  horizon: /dev/sda1
  devices: ["*"]

resize_rootfs: true

# ── Set hostname ────────────────────────────────────────────────────────────
hostname: ${SERVER_NAME}
manage_etc_hosts: true

# ── Install Coolify ──────────────────────────────────────────────────────────
# Coolify's install script auto-detects Ubuntu, installs Docker,
# and runs the full setup. We pass credentials via environment vars.
runcmd:
  # Set credentials for non-interactive install
  - export EMAIL="${COOLIFY_EMAIL}"
  - export PASSWORD="${COOLIFY_PASSWORD}"
  - export FQDN="${COOLIFY_FQDN}"
  # Disable firewall (Hetzner handles this at network level)
  - ufw disable || true
  # Install Coolify — this handles Docker, Traefik, Postgres, Redis, etc.
  - curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
  # Wait for Coolify to start
  - sleep 30
  # Verify installation
  - systemctl status coolify.service --no-pager || docker ps | grep coolify || true
  # Print access info for reference
  - echo "Coolify installed — check /data/coolify/source/.env for APP_KEY"

# ── Power off for snapshotting (optional) ────────────────────────────────────
# power_state:
#   mode: poweroff
#   delay: now
#   condition: true

# ── Notes ────────────────────────────────────────────────────────────────────
# To provision via Hetzner API, base64-encode this file and pass as
# user_data in the server creation payload:
#
# USER_DATA=$(cat cloudinit/coolify.yml.tpl | \
#   envsubst | base64 -w 0)
#
# curl -X POST "https://api.hetzner.cloud/v1/servers" \
#   -H "Authorization: Bearer $HETZNER_API_TOKEN" \
#   -H "Content-Type: application/json" \
#   -d "{
#     \"name\": \"coolify\",
#     \"server_type\": \"cpx22\",
#     \"location\": \"nbg1\",
#     \"image\": \"161547269\",
#     \"ssh_keys\": [110562576],
#     \"user_data\": \"$USER_DATA\"
#   }"
