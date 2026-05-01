<div align="center">

English | [中文](./README.md)

# Open MedKit

**Talk to your medicine cabinet — AI handles the rest.**

Home medicine cabinet manager — Natural language input · AI-powered structuring · Expiry alerts · MCP Agent integration

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white)](./DEPLOY.en.md)
[![MCP](https://img.shields.io/badge/MCP-server-8B5CF6?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiPjxwYXRoIGQ9Ik0xMiAyYTMgMyAwIDAgMC0zIDN2NGEzIDMgMCAwIDAgNiAwVjVhMyAzIDAgMCAwLTMtMyIvPjxwYXRoIGQ9Ik0xMiAxNHY4Ii8+PHBhdGggZD0iTTYgMTJhNiA2IDAgMCAwIDEyIDAiLz48L3N2Zz4=)](./MCP.en.md)
[![Node](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)]()

</div>

---

<div align="center">

![AI Chat Page](.docs/screenshot/chat-page.png)

</div>

### Why Open MedKit

Medicines at home are always hard to find, silently expire, or get forgotten entirely.

Open MedKit lets you add medicines with **a single sentence** and find them with **a single question**. No complicated forms, no manual categorization — AI takes care of everything; you just talk.

Don't want to open a browser? Open MedKit also ships an [MCP Server](./MCP.en.md), letting you manage your cabinet directly from **Claude Code**, **Cursor**, **Claude Desktop**, **OpenClaw**, and other AI clients — type "add some ibuprofen" in your terminal and it's in.

### Highlights

| | |
|:---|:---|
| **One sentence to add** | Describe a medicine in natural language → AI extracts name, dosage, expiry, etc. — confirm and it's stored |
| **Batch input** | Paste multiple medicines separated by newlines, one-click batch parse — perfect for a first-time inventory |
| **One question to find** | "Do I have any fever reducers?" "What's expiring soon?" — search your cabinet like a chat |
| **Automatic expiry alerts** | Expired / expiring-soon items are highlighted automatically, with daily push via [Telegram / Discord / Lark / Email](./NOTIFICATIONS.en.md) |
| **Native Agent integration** | Built-in [MCP Server](./MCP.en.md) — Claude Code / Cursor / Claude Desktop / OpenClaw call tools directly to manage your cabinet |
| **One-command self-hosting** | `docker compose up -d --build` — data stored in local SQLite by default; AI and notification services are only contacted when enabled |
| **Any AI provider** | OpenAI, Deepseek, Ollama… any API compatible with `/v1/chat/completions` works |

### See It in Action

<details>
<summary><b>AI-powered input demo</b> — One sentence, auto-parsed and stored</summary>
<br>
<div align="center">

![AI Parse Demo](.docs/screenshot/add-demo.gif)

</div>
</details>

<details open>
<summary><b>Medicine list</b> — Category filters · Expiry status at a glance</summary>
<br>
<div align="center">

![Medicine List Page](.docs/screenshot/list-page.png)

</div>
</details>

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 · TypeScript · Vite · TailwindCSS v3 |
| Backend | Hono (Node adapter) · TypeScript |
| Database | SQLite via better-sqlite3 |
| AI | Any OpenAI-compatible API (`/v1/chat/completions`) |
| Deploy | Single Docker container |

## Quick Start

### Docker (recommended)

```bash
git clone https://github.com/MonoYan/open-medkit.git
cd open-medkit
cp .env.example .env
# Optional: edit .env to set AI defaults, MEDKIT_PORT, or proxy vars
docker compose up -d --build
```

Open `http://localhost:3000` by default. If you change `MEDKIT_PORT` in `.env`, use that host port instead.

AI config is optional at deploy time. You can leave it blank and configure the provider later in the browser Settings panel.

On first visit, the Web UI automatically detects your browser's timezone and saves it to the server. All subsequent expiry checks, AI conversations referencing "today", and daily reminder schedules use this business timezone.

### Local Development

Prerequisites: Node.js >= 20

```bash
git clone https://github.com/MonoYan/open-medkit.git
cd open-medkit
npm install
cp .env.example .env
npm run dev
```

Frontend runs on http://localhost:5173, backend on http://localhost:3000.

If you only use Open MedKit via MCP / CLI / OpenClaw and never open the Web UI, initialize the timezone first. Without initialization the system falls back to `UTC` rather than using the server's local timezone.

## Configuration

All AI config can also be set in the browser Settings panel. Values entered there are stored in the current browser's `localStorage` and take priority over env vars.

`MEDKIT_PORT` only affects Docker Compose host port mapping. `PORT` and `DB_PATH` are for source / non-Docker runs.

| Env Variable | Default | Description |
|---|---|---|
| `AI_API_KEY` | — | OpenAI-compatible API key |
| `AI_BASE_URL` | `https://api.openai.com` | API base URL |
| `AI_MODEL` | `gpt-4o-mini` | Model name |
| `MEDKIT_PORT` | `3000` | Host port exposed by `docker compose` |
| `PORT` | `3000` | Server port when running from source without Docker |
| `DB_PATH` | `./data/medicine.db` | SQLite database path when running from source without Docker |
| `HTTP_PROXY` | — | Optional HTTP proxy for outbound requests |
| `HTTPS_PROXY` | — | Optional HTTPS proxy for outbound requests |
| `NO_PROXY` | — | Comma-separated hosts that should bypass the proxy |

## Notifications

Supports four channels: Telegram / Discord / Lark (Feishu) / Email (SMTP and Resend). All are configured in the Web UI under **Settings → Notifications**.

For detailed setup steps, common SMTP parameters, and troubleshooting, see **[Notification Configuration](./NOTIFICATIONS.en.md)**.

## Privacy & Safety

- Medicine records are stored in the SQLite database inside your deployment by default.
- AI parse, image recognition, and chat features send the submitted text or image to the OpenAI-compatible endpoint you configure.
- AI chat also sends the current medicine inventory needed to answer your question, so avoid entering data you do not want to share with that model provider.
- Browser-level AI settings such as `AI_API_KEY`, base URL, and model name are stored in the current browser's `localStorage`.
- Notification reminders (Telegram / Discord / Lark / Email) send medicine names, expiry dates, and reminder text to the corresponding platform once that channel is enabled.
- Open MedKit is for household inventory organization only and does not provide diagnosis, prescribing, or individualized medication advice.

## Deployment

See **[Deployment Guide](./DEPLOY.en.md)** for the detailed deployment guide.

**TL;DR** — any machine that runs Docker:

```bash
docker compose up -d --build
```

Data is persisted in a Docker volume (`medkit-data`). To back up:

```bash
docker cp medkit:/data/medicine.db ./medicine-backup.db
```

## MCP Server (Agent Integration)

Open MedKit ships a built-in [MCP](https://modelcontextprotocol.io/) server, allowing AI agents to manage cabinet data directly via tool calls — no browser needed.

**Verified clients**:

| Client | Configuration |
|---|---|
| **Claude Code** | `.mcp.json` in project root, auto-connected on start |
| **OpenClaw / Codex** | `codex.json` or `~/.codex/config.json`, supports Skill calls |
| **Cursor** | `~/.cursor/mcp.json` or project `.cursor/mcp.json` |
| **Claude Desktop** | `claude_desktop_config.json` |

Quick setup — create `.mcp.json` in the project root (auto-detected by Claude Code):

```json
{
  "mcpServers": {
    "open-medkit": {
      "command": "npx",
      "args": ["tsx", "backend/src/mcp-server.ts"],
      "env": { "DB_PATH": "./backend/data/medicine.db" }
    }
  }
}
```

If you use the browser, the timezone is auto-detected and saved on first visit.

If you only use MCP, initialize the timezone after your first connection:

```text
get_settings
set_timezone(timezone="Asia/Shanghai")
```

Without an initialized timezone, MCP explicitly warns that it is falling back to `UTC` rather than the server's local timezone.

**Full documentation**: Complete setup instructions for each client, OpenClaw Skill templates, conversation examples, and troubleshooting — see **[MCP Guide](./MCP.en.md)**.

## Project Structure

```
open-medkit/
├── backend/           # Hono API server + MCP server
│   └── src/
│       ├── ai/        # AI client, prompts, parsing logic
│       ├── db/        # SQLite schema & client
│       ├── routes/    # REST API routes
│       ├── services/  # Telegram, Discord, Lark, Email & notification scheduler
│       ├── middleware/ # API key injection
│       └── mcp-server.ts  # MCP server (stdio transport)
├── frontend/          # React SPA
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── lib/       # API client & utils
│       └── types/
├── Dockerfile         # Multi-stage build
├── docker-compose.yml
└── .env.example
```

## License

MIT

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=MonoYan/open-medkit&type=Date)](https://star-history.com/#MonoYan/open-medkit&Date)

Powered by [Star History](https://github.com/star-history)
