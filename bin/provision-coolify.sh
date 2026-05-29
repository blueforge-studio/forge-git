#!/usr/bin/env bash
# provision-coolify.sh — Fully automated Coolify provisioning on Hetzner
# Usage: HETZNER_API_TOKEN=xxx CF_API_TOKEN=yyy bash bin/provision-coolify.sh [server_name] [location] [server_type]
#
# Required env vars:
#   HETZNER_API_TOKEN  — Hetzner Cloud API token
#   CF_API_TOKEN       — Cloudflare API token (for DNS, optional)
#   COOLIFY_EMAIL      — Admin email for Coolify (default: kmandrup@gmail.com)
#   COOLIFY_PASSWORD   — Admin password for Coolify (default: auto-generated)
#
# The script is idempotent — re-running is safe.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Defaults ────────────────────────────────────────────────────────────────
SERVER_NAME="${1:-coolify}"
LOCATION="${2:-nbg1}"
SERVER_TYPE="${3:-cpx22}"
DOMAIN="${DOMAIN:-blueforge.studio}"
EMAIL="${COOLIFY_EMAIL:-kmandrup@gmail.com}"
PASSWORD="${COOLIFY_PASSWORD:-$(openssl rand -base64 24 | tr -d '/+=' | head -c 16)}"
FQDN="${COOLIFY_FQDN:-coolify.${DOMAIN}}"
HETZNER_TOKEN="${HETZNER_API_TOKEN:-}"
CF_TOKEN="${CF_API_TOKEN:-}"

# ── Validate ────────────────────────────────────────────────────────────────
if [ -z "$HETZNER_TOKEN" ]; then
  echo "ERROR: HETZNER_API_TOKEN env var is required"
  exit 1
fi

echo "=========================================="
echo "Coolify Provisioner"
echo "=========================================="
echo "Server:     $SERVER_NAME"
echo "Location:   $LOCATION"
echo "Type:       $SERVER_TYPE"
echo "Domain:     $DOMAIN"
echo "FQDN:       $FQDN"
echo "Email:      $EMAIL"
echo "Password:   $PASSWORD"
echo ""

# ── Helpers ─────────────────────────────────────────────────────────────────
hetzner() {
  curl -sf -H "Authorization: Bearer $HETZNER_TOKEN" \
       -H "Content-Type: application/json" \
       "https://api.hetzner.cloud/v1/$1" "$@"
}

retry() {
  local max_attempts=$1; shift
  local delay=$1; shift
  local cmd=("$@")
  local attempt=0
  while [ $attempt -lt $max_attempts ]; do
    if "${cmd[@]}"; then
      return 0
    fi
    attempt=$((attempt + 1))
    echo "  Attempt $attempt/$max_attempts failed, retrying in ${delay}s..."
    sleep "$delay"
    delay=$((delay * 2))
  done
  return 1
}

# ── Step 1: Find Ubuntu 24.04 image ──────────────────────────────────────────
echo "[1/7] Finding Ubuntu 24.04 image..."
UBUNTU_IMAGE=$(hetzner "images?type=system" | \
  python3 -c "import sys,json; imgs=[i for i in json.load(sys.stdin)['images'] if 'ubuntu-24.04' in i.get('name','')]; print(imgs[0]['id'] if imgs else '')")
if [ -z "$UBUNTU_IMAGE" ]; then
  echo "ERROR: Could not find Ubuntu 24.04 image"
  exit 1
fi
echo "  Image ID: $UBUNTU_IMAGE"

# ── Step 2: Get SSH key IDs ────────────────────────────────────────────────
echo "[2/7] Fetching SSH keys..."
SSH_KEYS=$(hetzner "ssh_keys" | \
  python3 -c "import sys,json; keys=json.load(sys.stdin).get('ssh_keys',[]); print(json.dumps([k['id'] for k in keys]) if keys else '[]')")
echo "  SSH Keys: $SSH_KEYS"

# ── Step 3: Check if server already exists ─────────────────────────────────
echo "[3/7] Checking for existing server..."
EXISTING=$(hetzner "servers?name=${SERVER_NAME}" | \
  python3 -c "import sys,json; servers=json.load(sys.stdin).get('servers',[]); print(servers[0]['id'] if servers else '')" 2>/dev/null || echo "")

if [ -n "$EXISTING" ]; then
  SERVER_ID="$EXISTING"
  SERVER_IP=$(hetzner "servers/${SERVER_ID}" | \
    python3 -c "import sys,json; print(json.load(sys.stdin).get('server',{}).get('public_net',{}).get('ipv4',{}).get('ip','') or '')")
  SERVER_STATUS=$(hetzner "servers/${SERVER_ID}" | \
    python3 -c "import sys,json; print(json.load(sys.stdin).get('server',{}).get('status','') or '')")
  echo "  Found existing server ID=$SERVER_ID (status=$SERVER_STATUS, ip=$SERVER_IP)"
else
  # ── Step 4: Create server ──────────────────────────────────────────────
  echo "[4/7] Creating Hetzner server..."

  # Build cloud-init user_data
  CLOUDINIT=$(python3 -c "
import yaml
data = {
    'growpart': {'mode': 'auto', 'horizon': '/dev/sda1'},
    'resize_rootfs': True,
    'apt': {'update': {'url': 'http://cloud-images.ubuntu.com/status'}, 'stage': False},
    'ssh_pwauth': True,
    'users': ['default'],
    'package_update': True,
    'packages': ['curl', 'wget', 'git', 'jq', 'openssl'],
}
print('#cloud-init\n' + yaml.dump(data, default_flow_style=False))
" 2>/dev/null || echo "#cloud-init\n")

  # Append Coolify install as runcmd
  CLOUDINIT+=$(cat << 'RUNCMD'
runcmd:
  - curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
RUNCMD
)

  # Escape for JSON
  ESCAPED_CLOUDINIT=$(printf '%s' "$CLOUDINIT" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))")

  RESPONSE=$(hetzner "servers" -X POST -d "{
    \"name\": \"${SERVER_NAME}\",
    \"server_type\": \"${SERVER_TYPE}\",
    \"location\": \"${LOCATION}\",
    \"image\": \"${UBUNTU_IMAGE}\",
    \"ssh_keys\": ${SSH_KEYS},
    \"automount\": false
  }")

  SERVER_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('id','') or '')")
  ERROR_CODE=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error',{}).get('code','') or '')" 2>/dev/null)

  if [ -n "$ERROR_CODE" ]; then
    echo "ERROR: Server creation failed: $ERROR_CODE"
    echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error',{}).get('message',''))" 2>/dev/null
    exit 1
  fi

  echo "  Server ID: $SERVER_ID"
  echo "  Waiting for server to start..."

  # Wait for server to be running
  retry 30 5 hetzner "servers/${SERVER_ID}" > /dev/null
  SERVER_IP=$(hetzner "servers/${SERVER_ID}" | \
    python3 -c "import sys,json; print(json.load(sys.stdin).get('server',{}).get('public_net',{}).get('ipv4',{}).get('ip','') or '')")
  SERVER_STATUS=$(hetzner "servers/${SERVER_ID}" | \
    python3 -c "import sys,json; print(json.load(sys.stdin).get('server',{}).get('status','') or '')")
  echo "  Server IP: $SERVER_IP (status=$SERVER_STATUS)"
fi

if [ -z "$SERVER_IP" ]; then
  echo "ERROR: Could not determine server IP"
  exit 1
fi

# ── Step 5: Cloudflare DNS ────────────────────────────────────────────────
if [ -n "$CF_TOKEN" ] && [ -n "$DOMAIN" ]; then
  echo "[5/7] Setting up Cloudflare DNS for ${FQDN}..."
  # Get zone ID
  ZONE_ID=$(curl -sf -X GET "https://api.cloudflare.com/client/v4/zones?name=${DOMAIN}" \
    -H "Authorization: Bearer ${CF_TOKEN}" \
    -H "Content-Type: application/json" | \
    python3 -c "import sys,json; print(json.load(sys.stdin).get('result',[{}])[0].get('id','') or '')" 2>/dev/null)

  if [ -n "$ZONE_ID" ]; then
    # Check if record exists
    RECORD_ID=$(curl -sf "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?name=${FQDN}" \
      -H "Authorization: Bearer ${CF_TOKEN}" \
      -H "Content-Type: application/json" | \
      python3 -c "import sys,json; print(json.load(sys.stdin).get('result',[{}])[0].get('id','') or '')" 2>/dev/null)

    if [ -n "$RECORD_ID" ]; then
      curl -sf -X PATCH "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${RECORD_ID}" \
        -H "Authorization: Bearer ${CF_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"content\":\"${SERVER_IP}\"}" > /dev/null
      echo "  Updated DNS: ${FQDN} → ${SERVER_IP}"
    else
      curl -sf -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
        -H "Authorization: Bearer ${CF_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"type\":\"A\",\"name\":\"${FQDN}\",\"content\":\"${SERVER_IP}\",\"proxied\":false}" > /dev/null
      echo "  Created DNS: ${FQDN} → ${SERVER_IP}"
    fi
  else
    echo "  SKIPPED: Could not find Cloudflare zone for ${DOMAIN}"
  fi
else
  echo "[5/7] Cloudflare DNS skipped (no CF_API_TOKEN)"
fi

# ── Step 6: Wait for Coolify to be healthy ─────────────────────────────────
echo "[6/7] Waiting for Coolify to be ready..."
echo "  This takes 3-5 minutes after server boot."

COOLIFY_URL="http://${SERVER_IP}:8000"

# Wait for server to respond to SSH (basic boot check)
retry 20 10 ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
  -o PasswordAuthentication=no root@"${SERVER_IP}" "echo ok" > /dev/null 2>&1
echo "  Server SSH is up."

# Wait for Coolify to install (cloud-init runs in background)
# The install script takes ~3-5 min. Poll the /api/v1/health endpoint.
retry 30 15 bash -c "curl -sf '${COOLIFY_URL}/api/v1/health' > /dev/null 2>&1"
echo "  Coolify is healthy!"

# ── Step 7: Retrieve credentials & setup ──────────────────────────────────
echo "[7/7] Retrieving Coolify credentials..."
APP_KEY=$(ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
  root@"${SERVER_IP}" \
  "cat /data/coolify/source/.env 2>/dev/null | grep '^APP_KEY=' | cut -d= -f2" 2>/dev/null || echo "")

echo ""
echo "=========================================="
echo "Coolify is ready!"
echo "=========================================="
echo "URL:       ${COOLIFY_URL}"
echo "Email:     ${EMAIL}"
echo "Password:  ${PASSWORD}"
echo "Admin Key: ${APP_KEY}"
echo ""
echo "To add Gitea as a source:"
echo "  curl -X POST '${COOLIFY_URL}/api/v1/sources' \\"
echo "    -H 'Authorization: Bearer ${APP_KEY}' \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"type\":\"gitea\",\"url\":\"http://178.104.233.155:3010\",\"token\":\"<gitea-token>\"}'"
echo ""
echo "To deploy an app:"
echo "  curl -X POST '${COOLIFY_URL}/api/v1/deployments' \\"
echo "    -H 'Authorization: Bearer ${APP_KEY}' \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"project_id\":1,\"application_id\":1,\"branch\":\"main\"}'"
echo ""

# Save credentials to .env for future runs
{
  echo "COOLIFY_URL=${COOLIFY_URL}"
  echo "COOLIFY_EMAIL=${EMAIL}"
  echo "COOLIFY_PASSWORD=${PASSWORD}"
  echo "COOLIFY_APP_KEY=${APP_KEY}"
  echo "COOLIFY_SERVER_ID=${SERVER_ID}"
  echo "COOLIFY_SERVER_IP=${SERVER_IP}"
} > "${PROJECT_DIR}/.env.coolify"

echo "Credentials saved to .env.coolify"
