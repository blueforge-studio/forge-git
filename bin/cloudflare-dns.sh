#!/usr/bin/env bash
# cloudflare-dns.sh — Add/update Cloudflare DNS A record
# Usage: CF_API_TOKEN=xxx DOMAIN=blueforge.studio bash bin/cloudflare-dns.sh <subdomain> <ip> [proxied]
#
# Examples:
#   CF_API_TOKEN=xxx DOMAIN=blueforge.studio bash bin/cloudflare-dns.sh coolify 178.105.61.154
#   CF_API_TOKEN=xxx DOMAIN=blueforge.studio bash bin/cloudflare-dns.sh coolify 178.105.61.154 true
#
# To get CF_API_TOKEN:
#   Cloudflare Dashboard → Profile → API Tokens → Create Token
#   or: https://dash.cloudflare.com → API Token → Overview

set -euo pipefail

CF_TOKEN="${CF_API_TOKEN:-${CF_TOKEN:-}}"
DOMAIN="${DOMAIN:-}"
SUBDOMAIN="${1:-}"
IP="${2:-}"
PROXIED="${3:-false}"

if [ -z "$CF_TOKEN" ] || [ -z "$DOMAIN" ] || [ -z "$SUBDOMAIN" ] || [ -z "$IP" ]; then
  echo "Usage: CF_API_TOKEN=xxx DOMAIN=example.com bash cloudflare-dns.sh <subdomain> <ip> [proxied]"
  echo ""
  echo "Required env vars:"
  echo "  CF_API_TOKEN  — Cloudflare API token"
  echo "  DOMAIN        — Base domain (e.g. blueforge.studio)"
  echo ""
  echo "Args:"
  echo "  \$1 subdomain  — e.g. coolify (creates coolify.blueforge.studio)"
  echo "  \$2 ip        — IPv4 address"
  echo "  \$3 proxied   — 'true' for Cloudflare proxy (default: false)"
  echo ""
  echo "Exit codes:"
  echo "  0 — record created/updated"
  echo "  1 — error"
  echo "  2 — skipped (no zone found)"
  exit 1
fi

FQRDN="${SUBDOMAIN}.${DOMAIN}"

echo "Cloudflare DNS: ${FQRDN} → ${IP} (proxied=${PROXIED})"

# ── Find zone ID ────────────────────────────────────────────────────────────
ZONE_ID=$(curl -sf "https://api.cloudflare.com/client/v4/zones?name=${DOMAIN}" \
  -H "Authorization: Bearer ${CF_TOKEN}" \
  -H "Content-Type: application/json" | \
  python3 -c "
import sys,json
data = json.load(sys.stdin)
results = data.get('result', [])
if not results:
    print('')
else:
    print(results[0]['id'])
" 2>/dev/null)

if [ -z "$ZONE_ID" ]; then
  echo "ERROR: No Cloudflare zone found for ${DOMAIN}"
  exit 2
fi

# ── Check for existing record ───────────────────────────────────────────────
RECORD_ID=$(curl -sf "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?name=${FQRDN}&type=A" \
  -H "Authorization: Bearer ${CF_TOKEN}" \
  -H "Content-Type: application/json" | \
  python3 -c "
import sys,json
data = json.load(sys.stdin)
results = data.get('result', [])
if not results:
    print('')
else:
    print(results[0]['id'])
" 2>/dev/null)

# ── Create or update ───────────────────────────────────────────────────────
if [ -n "$RECORD_ID" ]; then
  RESULT=$(curl -sf -X PUT "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${RECORD_ID}" \
    -H "Authorization: Bearer ${CF_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"type\": \"A\",
      \"name\": \"${FQRDN}\",
      \"content\": \"${IP}\",
      \"proxied\": ${PROXIED}
    }")
  SUCCESS=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success', False))")
  if [ "$SUCCESS" = "True" ]; then
    echo "Updated: ${FQRDN} → ${IP} (proxied=${PROXIED})"
  else
    echo "ERROR: Failed to update record"
    echo "$RESULT" | python3 -c "import sys,json; [print(e['message']) for e in json.load(sys.stdin).get('errors',[])]"
    exit 1
  fi
else
  RESULT=$(curl -sf -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
    -H "Authorization: Bearer ${CF_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"type\": \"A\",
      \"name\": \"${FQRDN}\",
      \"content\": \"${IP}\",
      \"proxied\": ${PROXIED}
    }")
  SUCCESS=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success', False))")
  if [ "$SUCCESS" = "True" ]; then
    echo "Created: ${FQRDN} → ${IP} (proxied=${PROXIED})"
  else
    echo "ERROR: Failed to create record"
    echo "$RESULT" | python3 -c "import sys,json; [print(e['message']) for e in json.load(sys.stdin).get('errors',[])]"
    exit 1
  fi
fi
