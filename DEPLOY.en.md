English | [中文](./DEPLOY.md)

# Deployment Guide

## Docker Compose (recommended)

The simplest deployment method, suitable for any machine with Docker installed (VPS, NAS, local server, etc.).

### 1. Clone & Configure

```bash
git clone https://github.com/MonoYan/open-medkit.git
cd open-medkit
cp .env.example .env
```

Edit `.env`:

```env
# Access password (optional; leave both empty to disable authentication)
# Recommended: generate a hash with `npm run hash-password -w backend`
AUTH_PASSWORD_HASH=
# Or use plaintext for quick LAN deployment (not recommended for public access)
# AUTH_PASSWORD=my-secret

AI_API_KEY=sk-your-key-here
AI_BASE_URL=https://api.openai.com   # or any OpenAI-compatible endpoint
AI_MODEL=gpt-4o-mini
MEDKIT_PORT=3000
# HTTPS_PROXY can still use http://proxy-host:port here; that is the proxy protocol, not the target site's protocol.
# HTTP_PROXY: use for HTTP targets
# HTTP_PROXY=http://192.168.31.1:7890
# HTTPS_PROXY: use for HTTPS targets
# HTTPS_PROXY=http://192.168.31.1:7890
# NO_PROXY: bypass proxy for local / internal hosts
# NO_PROXY=localhost,127.0.0.1,.local
```

> **Note**: AI config is optional at deploy time. Users can configure it later in the browser Settings panel.
> `MEDKIT_PORT` only changes the host port exposed by Docker Compose. The container still listens on `3000`.

### 2. Start

```bash
docker compose up -d --build
```

App is now running at `http://your-server-ip:3000` by default. If you changed `MEDKIT_PORT`, use that host port instead.

### 3. Update

```bash
git pull
docker compose up -d --build
```

### 4. Data Management

Database is stored in a Docker volume (`medkit-data`).

**Backup:**

```bash
# Copy database out of container
docker cp medkit:/data/medicine.db ./medicine-backup-$(date +%Y%m%d).db
```

**Restore:**

```bash
docker cp ./medicine-backup.db medkit:/data/medicine.db
docker compose restart
```

**Or use the built-in export/import** — open Settings in the web UI, click "Export Data" to download a JSON file. Import it on another instance.

---

## Reverse Proxy (HTTPS)

Production deployments should sit behind a reverse proxy for HTTPS.

### Nginx

```nginx
server {
    listen 80;
    server_name medkit.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name medkit.example.com;

    ssl_certificate     /etc/letsencrypt/live/medkit.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/medkit.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Caddy (simpler)

```
medkit.example.com {
    reverse_proxy localhost:3000
}
```

Caddy handles HTTPS certificates automatically.

---

## Synology NAS

1. Open **Container Manager** (Docker)
2. In **Project**, create a new project from the cloned repo folder
3. Set environment variables in the compose UI
4. Map volume: `/data` → a local folder on your NAS for persistence
5. Start the project

---

## Custom Port

For Docker Compose, set `MEDKIT_PORT` in `.env`:

```env
MEDKIT_PORT=8080
```

This changes the host port only; the container still listens on `3000`.

Or set `PORT` env var if running without Docker:

```bash
PORT=8080 npm run start
```

---

## Build from Source (no Docker)

For environments where Docker is not available.

### Prerequisites

- Node.js >= 20
- npm >= 9

### Steps

```bash
git clone https://github.com/MonoYan/open-medkit.git
cd open-medkit
npm install

# Build frontend and backend
npm run build

# Set env vars
export AI_API_KEY=sk-your-key
export DB_PATH=/path/to/medicine.db
export NODE_ENV=production
# Optional: enable password protection
# export AUTH_PASSWORD_HASH='$argon2id$...'

# Start
npm run start
```

The server runs on port 3000 by default and serves both the API and frontend static files.

### Process Manager (systemd)

To keep the app running as a service:

```ini
# /etc/systemd/system/medkit.service
[Unit]
Description=Open MedKit
After=network.target

[Service]
Type=simple
User=medkit
WorkingDir=/opt/open-medkit/backend
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=DB_PATH=/opt/open-medkit/data/medicine.db
Environment=AI_API_KEY=sk-your-key

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now medkit
```

### Process Manager (pm2)

```bash
npm install -g pm2
cd backend
DB_PATH=/path/to/medicine.db AI_API_KEY=sk-your-key pm2 start dist/index.js --name medkit
pm2 save
pm2 startup
```

---

## Password Protection

MedKit supports a shared password to protect access. When enabled, all API routes and the Web UI require login.

### Generate Password Hash

```bash
# Run from the project root
npm run hash-password -w backend

# Or pass the password directly (less secure — appears in shell history)
npm run hash-password -w backend -- "my-secret-password"
```

Copy the output (starting with `$argon2id$...`) into `.env`:

```env
AUTH_PASSWORD_HASH=$argon2id$v=19$m=65536,t=3,p=4$...
```

### Plaintext Password (LAN only)

For quick local-network use, you can set a plaintext password:

```env
AUTH_PASSWORD=my-secret
```

The server prints a warning on startup recommending the hash approach.

### Priority

- `AUTH_PASSWORD_HASH` takes priority over `AUTH_PASSWORD`
- When both are empty, authentication is disabled (backward compatible)

### Login Rate Limiting

The login endpoint is rate-limited: 5 consecutive failures trigger a 15-minute lockout. The rate-limit key is the TCP socket address. Behind a reverse proxy, the app typically sees the proxy's IP, so the limit applies per proxy rather than per real client. This is more conservative — it blocks brute-force attacks, but a single attacker could lock out all users. For public deployments, add rate limiting at the reverse proxy layer as well.

---

## Public Internet Security

**Exposing MedKit directly to the internet with only the built-in password is not recommended.** A public login page with a single shared password has limited resistance to brute-force attacks.

For public access, deploy in layers:

1. **Required**: Bind the container to loopback only, e.g. `127.0.0.1:3000:3000` in `docker-compose.yml`
2. **Required**: Use a reverse proxy (Nginx/Caddy) for HTTPS
3. **Required**: Use `AUTH_PASSWORD_HASH`, not plaintext
4. **Strongly recommended**: Add a second auth layer at the proxy — Basic Auth, IP allowlist, or Zero Trust (Cloudflare Access, Tailscale Funnel, etc.)
5. **Strongly recommended**: Add rate limiting at the proxy layer (e.g. Nginx `limit_req`)

The built-in password is designed for trusted LAN scenarios. Always add a second layer of protection for public access.

---

## Health Check

The container includes a `/api/health` health-check endpoint (no authentication required). You can also use it for external monitoring:

```bash
curl -f http://localhost:3000/api/health
```

Returns `200 {"status":"ok"}` when the service is healthy.

---

## Notifications

Open MedKit supports Telegram bot notifications for expiring medicines.

1. Create a bot via [@BotFather](https://t.me/BotFather), get the bot token
2. Open Settings in the web UI → Notification Channels → Add Telegram
3. Paste the bot token, then click the link to start a chat with your bot
4. The app will auto-detect your chat ID

The bot sends daily reminders about medicines that are expired or expiring soon.
