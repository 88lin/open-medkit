English | [中文](./MCP.md)

# MCP Server Guide

OpenMedKit includes a built-in [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that exposes medicine cabinet CRUD operations via stdio transport. Any MCP-compatible AI client (Claude Code, Cursor, Claude Desktop, OpenClaw, etc.) can call these tools directly to manage your home medicine cabinet — no browser needed.

If you never open the Web UI and only use OpenMedKit through MCP, make sure to initialize the "business timezone" first. Without initialization, the system falls back to `UTC` rather than using the server's local timezone.

---

## Prerequisites

- Node.js >= 20
- Project cloned and `npm install` completed

```bash
git clone https://github.com/MonoYan/open-medkit.git
cd open-medkit
npm install
```

> The MCP Server reads/writes the SQLite database directly, sharing the same data as the Web UI (WAL mode supports concurrent access). No HTTP server is needed.
>
> **Note**: `DB_PATH` must point to the same database file as the Web UI. In dev mode, `npm run dev` runs the backend from the `backend/` directory with the default database at `backend/data/medicine.db`. The MCP process typically runs from the project root, so you need to use `./backend/data/medicine.db`.

---

## First Use: Initialize Timezone

OpenMedKit uses a single "business timezone" for all date-related logic — "what is today", "which medicines are expiring soon", and "when to send daily reminders".

- If you've opened the Web UI before: the app auto-detects the browser timezone and saves it to the server
- If you only use MCP: initialize it manually after first connection

Recommended flow:

```text
1. Run get_settings
2. If you see configured: false
3. Run set_timezone(timezone="Asia/Shanghai")
```

Without initialization, MCP explicitly warns that it is falling back to `UTC`.

---

## Using with Claude Code

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) natively supports MCP.

### Option 1: Project-level config (recommended)

Create or edit `.mcp.json` in the project root:

```json
{
  "mcpServers": {
    "open-medkit": {
      "command": "npx",
      "args": ["tsx", "backend/src/mcp-server.ts"],
      "env": {
        "DB_PATH": "./backend/data/medicine.db"
      }
    }
  }
}
```

Then start Claude Code in the project directory — MedKit MCP loads automatically:

```bash
claude
```

### Option 2: Global config

Edit `~/.claude/mcp.json` (applies to all projects):

```json
{
  "mcpServers": {
    "open-medkit": {
      "command": "node",
      "args": ["/absolute/path/to/open-medkit/backend/dist/mcp-server.js"],
      "env": {
        "DB_PATH": "/absolute/path/to/open-medkit/backend/data/medicine.db"
      }
    }
  }
}
```

> Global config requires building first: `npm run build`. After building, use `node` + `dist/mcp-server.js` — no tsx needed.

### Verification

After starting Claude Code, type `/mcp` to see the list of connected MCP servers. Confirm `medkit` appears and is healthy.

Then use natural language to manage your cabinet:

```
> Show me which medicines are expiring soon

> Add a medicine: Ibuprofen SR Capsules 300mg, expires June 2027, 20 capsules left, stored in shelf A

> Change the quantity of medicine id 3 to 10 capsules

> Show me cabinet stats
```

---

## Using with OpenClaw / Codex

OpenClaw and Codex CLI extend agent capabilities through `SKILL.md` + MCP tools.

### Option 1: Configure MCP in a Codex project

Edit `codex.json` or `~/.codex/config.json` in the project root:

```json
{
  "mcpServers": {
    "open-medkit": {
      "command": "npx",
      "args": ["tsx", "/path/to/open-medkit/backend/src/mcp-server.ts"],
      "env": {
        "DB_PATH": "/path/to/open-medkit/backend/data/medicine.db"
      }
    }
  }
}
```

### Option 2: Create a Skill

Create `SKILL.md` in your Codex skills directory (e.g. `~/.codex/skills/medkit/`):

```markdown
# MedKit Cabinet Management

Manage home medicine cabinet data. Use when the user mentions medicine management, cabinet queries, adding medicines, checking expired medicines, etc.

## Available MCP Tools

After connecting to the `medkit` MCP server, you can use these tools:

- `get_settings` — Check if the business timezone is initialized
- `set_timezone` — Initialize or update the business timezone
- `list_medicines` — List medicines with optional filters by category, expiry status, or name
- `get_medicine` — View a single medicine by ID
- `add_medicine` — Add a medicine (only name is required, other fields are optional)
- `update_medicine` — Update a medicine by ID (only pass fields that need changing)
- `delete_medicine` — Delete a medicine by ID
- `get_stats` — View cabinet statistics (total, expired, expiring, healthy, category breakdown)
- `search_medicines` — Search medicines by keyword (searches name, usage, notes)

## Operation Guide

- User says "set timezone to Shanghai" → call `set_timezone`
- User says "check if timezone is configured" → call `get_settings`
- User says "add a medicine" → extract fields from description, call `add_medicine`
- User asks "do I have fever medicine?" → call `search_medicines` with query "fever"
- User says "show expiring ones" → call `list_medicines` with status "expiring"
- User says "cabinet overview" → call `get_stats`

## Medicine Fields

| Field | Description | Example |
|-------|-------------|---------|
| name | Medicine name (required) | Ibuprofen SR Capsules |
| name_en | English name | Ibuprofen SR Capsules |
| spec | Specification | 300mg/capsule |
| quantity | Remaining quantity | 20 capsules |
| expires_at | Expiry date (YYYY-MM-DD) | 2027-06-30 |
| category | Category | Cold & Fever |
| usage_desc | Usage / Indications | Fever, pain, anti-inflammatory |
| location | Storage location | Shelf A |
| notes | Notes | Take after meals |
```

---

## Using with Cursor

Edit `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` in the project:

```json
{
  "mcpServers": {
    "open-medkit": {
      "command": "npx",
      "args": ["tsx", "backend/src/mcp-server.ts"],
      "cwd": "/path/to/open-medkit",
      "env": {
        "DB_PATH": "./backend/data/medicine.db"
      }
    }
  }
}
```

After configuration, restart Cursor and you can manage cabinet data directly in the chat.

---

## Using with Claude Desktop

Edit the Claude Desktop config file:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "open-medkit": {
      "command": "node",
      "args": ["/absolute/path/to/open-medkit/backend/dist/mcp-server.js"],
      "env": {
        "DB_PATH": "/absolute/path/to/open-medkit/backend/data/medicine.db"
      }
    }
  }
}
```

> Claude Desktop requires built files. Run `npm run build` first.

Restart Claude Desktop and confirm `medkit` is connected via the tools icon in the bottom-left of the dialog.

---

## Available Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_settings` | View current MCP-related settings, especially whether the business timezone is initialized | None |
| `set_timezone` | Initialize or update the business timezone | `timezone` — IANA timezone, e.g. `Asia/Shanghai`, `America/New_York` |
| `list_medicines` | List medicines with filters | `category?` category name, `status?` "expired"/"expiring"/"ok", `search?` name fuzzy search, `expiring_days?` expiring threshold in days (default 30) |
| `get_medicine` | Get a single medicine by ID | `id` medicine ID |
| `add_medicine` | Add a medicine (name required) | `name` (required), `name_en?`, `spec?`, `quantity?`, `expires_at?`, `category?`, `usage_desc?`, `location?`, `notes?` |
| `update_medicine` | Update a medicine (only update provided fields, name cannot be blank) | `id` (required) + same optional fields as add_medicine |
| `delete_medicine` | Delete a medicine | `id` medicine ID |
| `get_stats` | Cabinet statistics overview | `expiring_days?` expiring threshold in days (default 30) |
| `search_medicines` | Keyword search | `query` search keyword |

## Available Resources

| URI | Description |
|-----|-------------|
| `medkit://settings` | Current business timezone status (initialized or not, which timezone is in use) |
| `medkit://medicines` | Full medicine data (JSON) |
| `medkit://stats` | Statistics summary (JSON), supports `?expiring_days=N` for custom expiring threshold (default 30 days) |

---

## Conversation Examples

The following examples work with any MCP-compatible client:

### Initialize Timezone

```text
User: Set the cabinet timezone to Shanghai

Agent calls: set_timezone({
  timezone: "Asia/Shanghai"
})
```

```text
User: Check if the timezone is configured

Agent calls: get_settings()
```

### Add Medicine

```
User: Add a medicine — Paracetamol 500mg, expires May 2027, 24 tablets left, stored in shelf A, for cold and fever

Agent calls: add_medicine({
  name: "Paracetamol Tablets",
  spec: "500mg/tablet",
  quantity: "24 tablets",
  expires_at: "2027-05-31",
  location: "Shelf A",
  category: "Cold & Fever",
  usage_desc: "Fever, pain relief, suitable for common cold, headache, toothache"
})
```

### Query Expiring Medicines

```
User: Are any medicines expiring soon?

Agent calls: list_medicines({ status: "expiring" })
```

### Search Medicines

```
User: Do I have anything for headaches?

Agent calls: search_medicines({ query: "headache" })
// If no results, try:
Agent calls: search_medicines({ query: "pain relief" })
```

### Update Quantity

```
User: I used some band-aids, about 15 left

Agent calls: search_medicines({ query: "band-aid" })
// After finding the ID:
Agent calls: update_medicine({ id: 3, quantity: "about 15" })
```

### View Statistics

```
User: How many medicines do I have?

Agent calls: get_stats()
```

---

## Production Build

Development uses `tsx` to run TypeScript source directly. For production, build first:

```bash
npm run build
```

After building, replace `npx tsx` with `node` + `backend/dist/mcp-server.js` in your configuration.

---

## Troubleshooting

### MCP Server Not Showing / Connection Failed

1. Confirm `npm install` completed without errors
2. Confirm `DB_PATH` points to a valid path (directory must exist; the database file is created automatically)
3. Test the MCP server manually:
   ```bash
   echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | npx tsx backend/src/mcp-server.ts 2>/dev/null
   ```
   A successful response contains `"serverInfo":{"name":"medkit"}`.

### Data Out of Sync

The MCP server and Web UI share the same SQLite file. If data appears inconsistent:

1. Confirm both `DB_PATH` values point to the same file
2. SQLite WAL mode rarely causes conflicts. If you encounter locking issues, wait a few seconds and retry
