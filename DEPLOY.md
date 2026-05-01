[English](./DEPLOY.en.md) | 中文

# 部署指南

## Docker Compose（推荐）

最简部署方式，适用于任何安装了 Docker 的机器（VPS、NAS、本地服务器等）。

### 1. 拉取代码 & 配置

```bash
git clone https://github.com/MonoYan/open-medkit.git
cd open-medkit
cp .env.example .env
```

编辑 `.env`：

```env
# 访问密码（可选；两个变量都留空则不启用）
# 推荐：使用 `npm run hash-password -w backend` 生成哈希
AUTH_PASSWORD_HASH=
# 或使用明文进行局域网快速部署（不建议用于公网访问）
# AUTH_PASSWORD=my-secret

AI_API_KEY=sk-your-key-here
AI_BASE_URL=https://api.openai.com   # 或任意兼容 OpenAI 格式的接口
AI_MODEL=gpt-4o-mini
MEDKIT_PORT=3000
# HTTPS_PROXY 可以使用 http://proxy-host:port，这里的 http 是代理协议，而非目标网站协议
# HTTP_PROXY：用于 HTTP 目标
# HTTP_PROXY=http://192.168.31.1:7890
# HTTPS_PROXY：用于 HTTPS 目标
# HTTPS_PROXY=http://192.168.31.1:7890
# NO_PROXY：跳过代理的本地 / 内网主机
# NO_PROXY=localhost,127.0.0.1,.local
```

> **说明**：AI 配置在部署时是可选的，用户可以之后在浏览器的设置面板中配置。
> `MEDKIT_PORT` 仅改变 Docker Compose 暴露的宿主机端口，容器内部始终监听 `3000`。

### 2. 启动

```bash
docker compose up -d --build
```

默认访问 `http://your-server-ip:3000`。如果修改了 `MEDKIT_PORT`，请使用对应端口。

### 3. 更新

```bash
git pull
docker compose up -d --build
```

### 4. 数据管理

数据库存储在 Docker 卷 (`medkit-data`) 中。

**备份：**

```bash
# 从容器中拷贝数据库
docker cp medkit:/data/medicine.db ./medicine-backup-$(date +%Y%m%d).db
```

**恢复：**

```bash
docker cp ./medicine-backup.db medkit:/data/medicine.db
docker compose restart
```

**也可以使用内置的导出/导入功能** — 在 Web UI 的设置面板中点击"导出数据"下载 JSON 文件，然后在另一个实例中导入。

---

## 反向代理（HTTPS）

生产环境部署建议使用反向代理来启用 HTTPS。

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

### Caddy（更简单）

```
medkit.example.com {
    reverse_proxy localhost:3000
}
```

Caddy 会自动管理 HTTPS 证书。

---

## 群晖 NAS

1. 打开 **Container Manager**（Docker）
2. 在 **项目** 中，使用克隆的仓库文件夹创建新项目
3. 在 compose UI 中设置环境变量
4. 映射卷：`/data` → NAS 上的本地文件夹，用于数据持久化
5. 启动项目

---

## 自定义端口

Docker Compose 方式，在 `.env` 中设置 `MEDKIT_PORT`：

```env
MEDKIT_PORT=8080
```

这只改变宿主机端口，容器内部仍然监听 `3000`。

非 Docker 方式运行时，设置 `PORT` 环境变量：

```bash
PORT=8080 npm run start
```

---

## 源码构建（不使用 Docker）

适用于没有 Docker 的环境。

### 前置条件

- Node.js >= 20
- npm >= 9

### 步骤

```bash
git clone https://github.com/MonoYan/open-medkit.git
cd open-medkit
npm install

# 构建前端和后端
npm run build

# 设置环境变量
export AI_API_KEY=sk-your-key
export DB_PATH=/path/to/medicine.db
export NODE_ENV=production
# 可选：启用访问密码保护
# export AUTH_PASSWORD_HASH='$argon2id$...'

# 启动
npm run start
```

服务器默认在 3000 端口运行，同时提供 API 和前端静态文件。

### 进程管理（systemd）

将应用作为系统服务持续运行：

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

### 进程管理（pm2）

```bash
npm install -g pm2
cd backend
DB_PATH=/path/to/medicine.db AI_API_KEY=sk-your-key pm2 start dist/index.js --name medkit
pm2 save
pm2 startup
```

---

## 密码保护

MedKit 支持使用一个共享密码来保护访问。启用后，所有 API 路由和 Web UI 都需要先登录。

### 生成密码哈希

```bash
# 在项目根目录执行
npm run hash-password -w backend

# 或直接传入密码（安全性较低，会出现在 shell 历史中）
npm run hash-password -w backend -- "my-secret-password"
```

将输出结果（以 `$argon2id$...` 开头）填入 `.env`：

```env
AUTH_PASSWORD_HASH=$argon2id$v=19$m=65536,t=3,p=4$...
```

### 明文密码方案（仅限局域网）

如果只是为了快速在局域网中使用，也可以直接使用明文密码：

```env
AUTH_PASSWORD=my-secret
```

服务端启动时会打印警告，建议你改用哈希形式。

### 优先级

- `AUTH_PASSWORD_HASH` 的优先级高于 `AUTH_PASSWORD`
- 两者都为空时，不启用认证（保持向后兼容）

### 登录限流

登录接口带有限流：连续失败 5 次后会锁定 15 分钟。限流键使用 TCP socket 地址。若部署在反向代理后，应用看到的通常是代理的 IP，因此限流会按代理生效，而不是按真实客户端生效。这样做更保守，能阻止暴力破解，但也意味着单个攻击者可能让所有用户一起被锁。公网部署时，请同时在反向代理层增加限流。

---

## 公网安全

**不建议只靠内置密码就将 MedKit 直接暴露到公网。** 公开登录入口配合单个共享密码，对暴力破解的抵抗能力有限。

如果需要公网访问，建议按以下分层方式部署：

1. **必须**：容器只绑定到本机回环地址，例如在 `docker-compose.yml` 中使用 `127.0.0.1:3000:3000`
2. **必须**：通过反向代理（Nginx/Caddy）提供 HTTPS
3. **必须**：使用 `AUTH_PASSWORD_HASH`，不要使用明文密码
4. **强烈建议**：在代理层再加一层认证，例如 Basic Auth、IP 白名单或 Zero Trust（Cloudflare Access、Tailscale Funnel 等）
5. **强烈建议**：在代理层增加限流（例如 Nginx 的 `limit_req`）

内置密码主要面向可信局域网场景；如果开放公网访问，务必再增加第二层防护。

---

## 健康检查

容器内置了 `/api/health` 健康检查接口（无需认证）。你也可以把它用于外部监控：

```bash
curl -f http://localhost:3000/api/health
```

服务正常时会返回 `200 {"status":"ok"}`。

---

## 通知提醒

Open MedKit 支持通过 Telegram 机器人发送过期药品提醒。

1. 在 Telegram 中找 [@BotFather](https://t.me/BotFather) 创建一个 Bot，获取 Bot Token
2. 在 Web UI 中打开 设置 → 通知提醒 → 添加 Telegram
3. 粘贴 Bot Token，然后点击链接与你的 Bot 开始对话
4. 应用会自动检测你的 Chat ID

机器人会每日发送关于已过期和即将过期药品的提醒。
