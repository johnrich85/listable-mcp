# Listable MCP Server

Let Claude, Cursor, and other AI assistants manage your [Listable](https://listable.directory) directory site through natural conversation.

[Listable](https://listable.directory) is a platform for building directory websites — restaurant guides, business directories, travel listings, niche curated sites. This package is a thin [Model Context Protocol](https://modelcontextprotocol.io) server that connects your AI client to Listable's hosted API, exposing every site-management operation as a structured tool the assistant can call.

Ask the AI things like:

- *"Add 20 Italian restaurants in Brooklyn to my food directory."*
- *"Import these listings from the CSV I'm pasting."*
- *"Set the SEO meta title and description for the homepage."*
- *"Add a Categories dropdown to the header menu."*
- *"Create an About page with our mission and a list of featured listings."*

## What it can do

The server exposes ~47 tools across these groups:

| Group | Tools |
|---|---|
| **Projects** | list, get, schema discovery |
| **Items (listings)** | list (paginated, filtered), get, create, update, delete, **bulk_create** (up to 100/call) |
| **Categories** | full CRUD, category trees, conflict inspection |
| **Custom fields** | list, create, update, delete (text, number, date, url, checkbox, select, phone, address, image) |
| **Pages + blocks** | list pages, get/update page blocks, manage global block areas (homepage hero, homepage main, detail page, category pages) |
| **Forms** | list, get, create, update, delete; manage form fields |
| **Settings** | menu, scripts, SEO, URL structure, theme |
| **Redirects** | full CRUD |
| **Uploads** | upload images / files for use in listings and pages |

The AI is told to call `get_schema` first to discover your project's custom fields and block types so its edits fit your site's shape. Destructive operations (deletes, full block replacements, URL structure changes, script overwrites) prompt for confirmation before running.

## Prerequisites

1. A [Listable](https://listable.directory) account on the **Growth** or **Pro** plan
2. An API key — create one at `https://listable.directory/my-account/api-keys`
   - Click *Create a new API key*, name it (e.g. "Claude MCP"), and optionally scope it to specific projects
   - Copy the key — it's only shown once

You'll paste the key into the client config below.

## Install

### Claude Code

```bash
claude mcp add listable -- npx -y listable-mcp
```

Then set your API key in the environment:

```bash
export LISTABLE_API_TOKEN="lst_..."
```

Or add it inline:

```bash
claude mcp add listable --env LISTABLE_API_TOKEN=lst_... -- npx -y listable-mcp
```

Verify the connection with `/mcp` inside a Claude Code session.

### Claude Desktop

Open *Settings → Developer → Edit Config* (`claude_desktop_config.json`) and add:

```json
{
  "mcpServers": {
    "listable": {
      "command": "npx",
      "args": ["-y", "listable-mcp"],
      "env": {
        "LISTABLE_API_TOKEN": "lst_..."
      }
    }
  }
}
```

Fully quit and restart Claude Desktop. Listable's tools appear in the *Search and tools* menu.

### Cursor

Create or edit `.cursor/mcp.json` in your workspace (or `~/.cursor/mcp.json` globally):

```json
{
  "mcpServers": {
    "listable": {
      "command": "npx",
      "args": ["-y", "listable-mcp"],
      "env": {
        "LISTABLE_API_TOKEN": "lst_..."
      }
    }
  }
}
```

### Global install (optional)

If you'd rather not rely on `npx` resolution each launch:

```bash
npm install -g listable-mcp
```

Then point your client at the `listable-mcp` binary directly instead of `npx -y listable-mcp`.

### Remote HTTP transport (no install)

Clients that support HTTP MCP transport can skip this package entirely and connect to Listable's hosted endpoint directly:

```bash
claude mcp add --transport http listable \
  https://listable.directory/api/v1/external/mcp \
  --header "Authorization: Bearer lst_..."
```

Claude.ai's web app supports the same endpoint via OAuth — *Settings → Integrations → Add custom integration* → paste `https://listable.directory/api/v1/external/mcp`. No key needed; Claude.ai will bounce you to Listable to log in and pick which projects the integration can access.

## Configuration

| Env var | Required | Default | Purpose |
|---|---|---|---|
| `LISTABLE_API_TOKEN` | yes | — | Your API key from the API Keys page |
| `LISTABLE_MCP_URL` | no | `https://listable.directory/api/v1/external/mcp` | Override the upstream endpoint (e.g. for self-hosted Listable or staging) |

## Rate limits

- **Growth plan**: 60 requests/minute, 750 tool calls/month
- **Pro plan**: 300 requests/minute, unlimited monthly calls

Hitting either limit returns a `429` with `retry_after` (per-minute) or `quota_reset_at` (monthly). For bulk work the AI prefers `bulk_create_items` (up to 100 listings/call) over many single creates.

## Safety

Tool descriptions tell the AI to:

- **Discover first** — call `get_schema` before editing so changes use the right custom fields and block types
- **Confirm destructive ops** — deletes, full-page block replacements, URL structure changes, and script overwrites prompt for explicit confirmation
- **Back up before editing** — keep prior state in context to restore if something goes wrong
- **Append, don't replace** — scripts (analytics, tracking) are appended to existing content

Every tool call is logged against the project it touched. View the timeline at *Project → API* in your Listable admin — filterable by source (MCP vs REST) and retained for 30 days.

## Revoking access

Go to *API → Keys* in your Listable admin and revoke the key. The AI client will receive `401` errors on its next tool call.

## Troubleshooting

**"Unauthenticated" errors** — Confirm the env var is set in the same shell that launched the client. In Claude Desktop / Cursor, the env block in the config must contain the key.

**"Tool not available"** — Restart the client (Claude Desktop requires a full quit and reopen). In Claude Code, run `/mcp` to confirm Listable is connected.

**`403` on specific projects** — Your key is scoped. Create a new key without project scoping (or with the right projects added).

## Links

- Listable: <https://listable.directory>
- MCP server docs: <https://listable.directory/docs/mcp-server>
- REST API docs: <https://listable.directory/docs/external-api>
- Model Context Protocol: <https://modelcontextprotocol.io>

## License

MIT — see [LICENSE](./LICENSE).
