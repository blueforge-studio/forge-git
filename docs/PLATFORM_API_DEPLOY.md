# Deploying platform-api on Hetzner

## Prerequisite: Build and push Docker image

```bash
# On Mac (with gh CLI authenticated):
cd /Users/kmandrup/Projects/Repos/forge-control
docker build -f docker/api-server.dockerfile -t ghcr.io/blueforge/api-server:latest .
docker push ghcr.io/blueforge/api-server:latest
```

## Option A: Docker Compose (recommended)

```bash
# On Hetzner:
cd /root/forge-control

# Create .env with your secrets
cat > /root/forge-control/.env << 'EOF'
DATABASE_URL=postgres://postgres:blueforge123@178.104.233.155:5432/platform
DB_SCHEMA=public
CORS_ORIGIN=*
JWT_SECRET=change-this-in-production-$(openssl rand -hex 32)
MINIO_ENDPOINT=178.104.233.155
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=blueforge-storage
FORGE_AUTH_URL=http://178.104.233.155:3580
FORGE_AUTH_SHARED_SECRET=your-shared-secret-with-forge-auth
EOF

# Run
docker compose -f docker/compose.api-server.yml --env-file .env up -d

# Verify
curl http://localhost:3042/health
```

## Option B: Systemd (if Docker not available)

```bash
# On Hetzner:
scp -r /Users/kmandrup/Projects/Repos/forge-control root@178.104.233.155:/root/

# Install systemd unit
scp /Users/kmandrup/Projects/Repos/forge-control/docker/blueforge-api-server.service root@178.104.233.155:/etc/systemd/system/

# Create env file
ssh root@178.104.233.155 "cat > /opt/blueforge/api-server/.env << 'EOF'
DATABASE_URL=postgres://postgres:blueforge123@178.104.233.155:5432/platform
PORT=3042
NODE_ENV=production
EOF

systemctl enable --now blueforge-api-server
```

## Add Caddy route

```bash
# On Hetzner, edit /root/forge-git/Caddyfile and add:
api.blueforge.studio {
  reverse_proxy localhost:3042
}

# Reload Caddy
ssh root@178.104.233.155 "cd /root/forge-git && docker compose exec caddy caddy reload"
```

## Add Cloudflare DNS

```bash
# Add CNAME record for api.blueforge.studio
curl -X POST "https://api.cloudflare.com/client/v4/zones/b2a7319881e0600969600b0572793515/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_DNS_ZONE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "A",
    "name": "api",
    "content": "178.104.233.155",
    "proxied": false
  }'
```

## Verify

```bash
curl https://api.blueforge.studio/health
```
