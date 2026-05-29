#!/usr/bin/env bash
# create-coolify-server.sh — Create a new Hetzner server for Coolify
# Usage: ./create-coolify-server.sh [server_name] [server_type_id] [location]
# Example: ./create-coolify-server.sh blueforge-coolify cpx22 nbg1

set -e

SERVER_NAME="${1:-blueforge-coolify}"
SERVER_TYPE="${2:-cpx22}"
LOCATION="${3:-nbg1}"
HETZNER_TOKEN="${HETZNER_API_TOKEN}"

if [ -z "$HETZNER_TOKEN" ]; then
  echo "ERROR: HETZNER_API_TOKEN env var not set"
  echo "Get your token at: https://console.hetzner.cloud -> Project -> API Tokens"
  exit 1
fi

echo "Creating Hetzner server: $SERVER_NAME ($SERVER_TYPE in $LOCATION)"

# Get Ubuntu 24.04 image ID (remove sort=name which broke it)
UBUNTU_IMAGE=$(curl -s "https://api.hetzner.cloud/v1/images?type=system" \
  -H "Authorization: Bearer $HETZNER_TOKEN" \
  | python3 -c "import sys,json; imgs=[i for i in json.load(sys.stdin)['images'] if 'ubuntu-24.04' in i.get('name','')]; print(imgs[0]['id'] if imgs else '')")
echo "Using Ubuntu 24.04 image ID: $UBUNTU_IMAGE"

if [ -z "$UBUNTU_IMAGE" ]; then
  echo "ERROR: Could not find Ubuntu 24.04 image"
  exit 1
fi

# Get your SSH key IDs from Hetzner
SSH_KEYS=$(curl -s "https://api.hetzner.cloud/v1/ssh_keys" \
  -H "Authorization: Bearer $HETZNER_TOKEN" \
  | python3 -c "
import sys,json
keys = json.load(sys.stdin).get('ssh_keys',[])
if not keys:
    print('[]')
else:
    print(json.dumps([k['id'] for k in keys]))
")
echo "Found SSH keys: $SSH_KEYS"

# Create server
RESPONSE=$(curl -s -X POST "https://api.hetzner.cloud/v1/servers" \
  -H "Authorization: Bearer $HETZNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$SERVER_NAME\",
    \"server_type\": \"$SERVER_TYPE\",
    \"location\": \"$LOCATION\",
    \"image\": \"$UBUNTU_IMAGE\",
    \"ssh_keys\": $SSH_KEYS,
    \"automount\": false
  }")

echo "Response: $RESPONSE"

# Check for errors
ERROR_MSG=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error',{}).get('message',''))")
ERROR_CODE=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error',{}).get('code',''))")

if [ -n "$ERROR_CODE" ]; then
  echo ""
  echo "=========================================="
  echo "ERROR: Server creation failed"
  echo "=========================================="
  echo "Error code: $ERROR_CODE"
  echo "Error message: $ERROR_MSG"
  echo ""

  if [ "$ERROR_CODE" = "resource_limit_exceeded" ]; then
    echo "Your Hetzner account has reached its server limit."
    echo ""
    echo "To raise the limit:"
    echo "  1. Go to https://console.hetzner.cloud/project/overview"
    echo "  2. Click 'Raise Limit' or contact Hetzner support"
    echo "  3. Once approved, re-run this script"
    echo ""
    echo "Alternative: install Coolify on the existing server (178.104.233.155):"
    echo "  ssh root@178.104.233.155"
    echo "  # Stop Caddy first: systemctl stop caddy"
    echo "  curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash"
  elif [ "$ERROR_CODE" = "uniqueness_error" ]; then
    echo "A server with name '$SERVER_NAME' already exists."
    echo "Delete it first at https://console.hetzner.cloud or use a different name."
  fi
  exit 1
fi

SERVER_IP=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('result',{}).get('public_net',{}).get('ipv4',{}).get('ip','') or '')")
ACTION_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('actions',[{}])[0].get('id','') if 'result' in json.load(sys.stdin) else '')")
ROOT_PASSWORD=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('result',{}).get('root_password','') or '')")
SERVER_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('id','') if 'result' in json.load(sys.stdin) else '')")
STATUS=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('result',{}).get('status','') if 'result' in json.load(sys.stdin) else '')")

echo ""
echo "=========================================="
echo "Server created successfully!"
echo "=========================================="
echo "Name:    $SERVER_NAME"
echo "ID:      $SERVER_ID"
echo "IP:      $SERVER_IP"
echo "Status:  $STATUS"
echo "Action:  $ACTION_ID"
[ -n "$ROOT_PASSWORD" ] && echo "Root password: $ROOT_PASSWORD"
echo ""
echo "Wait for server to be ready (2-3 minutes), then:"
echo ""
echo "  ssh root@$SERVER_IP"
echo ""
echo "Then install Coolify:"
echo "  curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash"
echo ""
echo "Or run the installer non-interactively:"
echo "  curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash -s -- --email your@email.com --password your-password --fqdn coolify.$SERVER_IP.nip.io"
echo ""
echo "Track server status:"
echo "  curl -s -H 'Authorization: Bearer $HETZNER_TOKEN' https://api.hetzner.cloud/v1/servers/$SERVER_ID | python3 -c \"import sys,json; print(json.load(sys.stdin).get('result',{}).get('status',''))\""
