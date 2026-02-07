# Deploying Lineremain to Google Cloud

## Prerequisites

Before deploying, ensure you have:

- **Google Cloud account** with billing enabled
- **gcloud CLI** installed — [Install Guide](https://cloud.google.com/sdk/docs/install)
- **Authenticated**: run `gcloud auth login`
- **Project created**: run `gcloud projects create lineremain-game`
- **Project selected**: run `gcloud config set project lineremain-game`
- **Compute Engine API enabled**: run `gcloud services enable compute.googleapis.com`

---

## Option A: Quick Deploy (Single VM with Docker Compose)

This deploys everything (database, server, client) on a single VM using Docker Compose.

### Step 1: Create the VM

```bash
gcloud compute instances create lineremain-server \
  --project=lineremain-game \
  --zone=us-central1-a \
  --machine-type=e2-standard-4 \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=50GB \
  --tags=lineremain-server
```

**Flag explanation:**
| Flag | Purpose |
|------|---------|
| `--machine-type=e2-standard-4` | 4 vCPU, 16GB RAM — enough for 50+ concurrent players |
| `--image-family=ubuntu-2204-lts` | Ubuntu 22.04 LTS, stable and well-supported |
| `--boot-disk-size=50GB` | Room for Docker images, database, and world data |
| `--tags=lineremain-server` | Used to target firewall rules |

Then create firewall rules to allow traffic:

```bash
gcloud compute firewall-rules create lineremain-allow-web \
  --project=lineremain-game \
  --allow=tcp:80,tcp:443,tcp:3001 \
  --target-tags=lineremain-server \
  --description="Allow HTTP, HTTPS, and game server traffic"
```

### Step 2: SSH into the VM

```bash
gcloud compute ssh lineremain-server --zone=us-central1-a
```

### Step 3: Install Docker (if not auto-installed)

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
newgrp docker
```

### Step 4: Clone and Configure

```bash
git clone https://github.com/YOUR_USERNAME/lineremain.git
cd lineremain
cp .env.example .env
```

Edit `.env` with your settings:

```bash
NODE_ENV=production
JWT_SECRET=$(openssl rand -hex 32)
VITE_API_URL=http://YOUR_EXTERNAL_IP:3001
VITE_WS_URL=ws://YOUR_EXTERNAL_IP:3001
```

> **Tip:** Get your VM's external IP with:
> ```bash
> gcloud compute instances describe lineremain-server \
>   --zone=us-central1-a \
>   --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
> ```

### Step 5: Build and Launch

```bash
docker compose up --build -d
```

This will:
1. Build the server Docker image (Node.js + shared library)
2. Build the client Docker image (Vite build + nginx)
3. Start PostgreSQL, Redis, server, and client containers

First build takes ~3-5 minutes. Subsequent builds are cached and much faster.

### Step 6: Verify

```bash
# Check all services are running
docker compose ps

# Check server logs for errors
docker compose logs server

# Test the API endpoint
curl http://localhost:3001/api/server/status
```

All services should show status "running". The API should return a JSON response.

### Step 7: Play!

Open `http://YOUR_EXTERNAL_IP` in your browser.

---

## Monitoring

```bash
# Live server logs
docker compose logs -f server

# Database logs
docker compose logs -f postgres

# All services
docker compose logs -f

# Resource usage
docker stats
```

---

## Updating

```bash
cd lineremain
git pull
docker compose up --build -d
```

Docker will only rebuild layers that changed, making updates fast.

---

## Backup

```bash
# Backup database
docker compose exec postgres pg_dump -U lineremain lineremain > backup_$(date +%Y%m%d).sql

# Restore from backup
docker compose exec -i postgres psql -U lineremain lineremain < backup.sql
```

---

## Cost Estimate

| Resource | Monthly Cost |
|----------|-------------|
| e2-standard-4 VM (4 vCPU, 16GB) | ~$97 |
| 50GB boot disk | ~$5 |
| Network egress | ~$10-20 (depends on players) |
| **Total** | **~$112-122/month** |

> **Cost savings:** Use `e2-medium` (2 vCPU, 4GB) for ~$34/month if you expect fewer than 20 players. You can always resize later with `gcloud compute instances set-machine-type`.

---

## Optional: Add HTTPS with Let's Encrypt

### 1. Point a domain to your VM IP

Add an **A record** in your DNS provider pointing to the VM's external IP.

### 2. Install Certbot on the VM

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 3. Update nginx config

Edit `client/nginx.conf` to add your `server_name`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    # ... rest of config
}
```

### 4. Obtain certificate

```bash
# Stop the client container temporarily
docker compose stop client

# Get certificate (standalone mode)
sudo certbot certonly --standalone -d yourdomain.com

# Or if you want to run nginx outside Docker for SSL termination:
sudo certbot --nginx -d yourdomain.com
```

### 5. Mount certificates into the container

Update `docker-compose.yml` to mount Let's Encrypt certs:

```yaml
client:
  # ...
  volumes:
    - /etc/letsencrypt/live/yourdomain.com/fullchain.pem:/etc/nginx/ssl/fullchain.pem:ro
    - /etc/letsencrypt/live/yourdomain.com/privkey.pem:/etc/nginx/ssl/privkey.pem:ro
```

And update your nginx config to listen on 443 with SSL:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    # ... rest of config
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### 6. Auto-renew

```bash
# Add a cron job for auto-renewal
sudo crontab -e
# Add this line:
0 3 * * * certbot renew --quiet && docker compose restart client
```

---

## Optional: Custom Domain

1. **Register a domain** (Google Domains, Namecheap, Cloudflare, etc.)
2. **Add an A record** pointing to your VM's external IP:
   - **Type:** A
   - **Name:** `@` (or `game` for a subdomain)
   - **Value:** Your VM's external IP
   - **TTL:** 300 (5 minutes)
3. **Update your `.env`:**
   ```
   VITE_API_URL=http://yourdomain.com:3001
   VITE_WS_URL=ws://yourdomain.com:3001
   ```
4. **Rebuild:**
   ```bash
   docker compose up --build -d
   ```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Cannot connect to game | Check firewall rules: `gcloud compute firewall-rules list` |
| Server crashes on start | Check logs: `docker compose logs server` |
| Database connection error | Ensure postgres is healthy: `docker compose ps` |
| Out of disk space | Check usage: `df -h`, prune Docker: `docker system prune -a` |
| High memory usage | Consider upgrading VM or reducing `MAX_PLAYERS` in `.env` |