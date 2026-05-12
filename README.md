# Listable MCP Server

Let Claude, Cursor, and other AI assistants manage your [Listable](https://app.get-listable.com) directory site through natural conversation.

[Listable](https://app.get-listable.com) is a platform for building directory websites — restaurant guides, business directories, travel listings, niche curated sites. Its MCP ([Model Context Protocol](https://modelcontextprotocol.io)) server exposes every site-management operation as a structured tool that AI assistants can call.

Ask the AI things like:

- *"Add 20 Italian restaurants in Brooklyn to my food directory."*
- *"Import these listings from the CSV I'm pasting."*
- *"Set the SEO meta title and description for the homepage."*
- *"Add a Categories dropdown to the header menu."*
- *"Create an About page with our mission and a list of featured listings."*

## What it can do

~47 tools across these groups:

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

The AI is told to call `get_schema` first so its edits use the right custom fields and block types. Destructive operations (deletes, full block replacements, URL structure changes, script overwrites) prompt for confirmation before running.

## Two ways to connect

| | OAuth (recommended) | Static API key (this package) |
|---|---|---|
| **How auth works** | Client opens a browser, you log in to Listable, pick which projects to grant, done | You create a key in the admin, paste it into the client config |
| **Works with** | Claude.ai web, Claude Code, Cursor, any client supporting HTTP MCP + OAuth discovery | Claude Desktop (no HTTP transport), or anywhere you want a static-token connection |
| **Setup** | Paste a URL | Install this package + create + paste a key |

If your client supports HTTP MCP transport, skip the shim entirely — see **OAuth setup** below. The npm package (`listable-mcp`) is only needed for stdio-only clients like Claude Desktop.

## OAuth setup (no install needed)

The MCP endpoint is:

```
https://app.get-listable.com/api/v1/external/mcp
```

When a client connects without a bearer token, the server returns a `401` plus a `WWW-Authenticate` discovery hint pointing at `/.well-known/oauth-protected-resource`. The client follows it, redirects you to log in, asks you to approve scopes (including which projects to grant), and gets a token automatically. Access tokens expire after 1 hour and refresh silently for 1 month.

### Claude.ai (web)

*Settings → Integrations → Add custom integration* → paste:

```
https://app.get-listable.com/api/v1/external/mcp
```

Claude.ai bounces you to Listable to log in and pick the projects the integration may access. Revoke any time from the API Keys page in your Listable admin.

### Claude Code

```bash
claude mcp add --transport http listable https://app.get-listable.com/api/v1/external/mcp
```

Claude Code does the OAuth dance in your browser on first use. Verify with `/mcp` inside a session.

### Cursor

In *Settings → MCP*, add an HTTP server:

- **Name**: `listable`
- **URL**: `https://app.get-listable.com/api/v1/external/mcp`

Cursor will trigger the OAuth flow on first connect.

## Stdio fallback (this npm package)

Use this path for **Claude Desktop** (which doesn't support HTTP MCP yet) or any stdio-only client. You'll need to create an API key first:

1. Open *API Keys* in your Listable admin: <https://app.get-listable.com/my-account/api-keys>
2. Click *Create a new API key*, name it (e.g. "Claude Desktop"), and optionally scope it to specific projects
3. Copy the key — it's only shown once

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

### Other stdio clients

Any MCP client that launches a subprocess can run `npx -y listable-mcp` and pass `LISTABLE_API_TOKEN` in the environment.

### Global install (optional)

If you'd rather not rely on `npx` resolution each launch:

```bash
npm install -g listable-mcp
```

Then point the client at the `listable-mcp` binary directly instead of `npx -y listable-mcp`.

## Configuration

| Env var | Required | Default | Purpose |
|---|---|---|---|
| `LISTABLE_API_TOKEN` | yes | — | API key from <https://app.get-listable.com/my-account/api-keys> |
| `LISTABLE_MCP_URL` | no | `https://app.get-listable.com/api/v1/external/mcp` | Override the upstream endpoint (self-hosted Listable or staging) |

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

- **OAuth grants**: appear on the API Keys page alongside manually-created keys. Revoke there.
- **Static API keys**: revoke from the same API Keys page. The AI client will receive `401` errors on its next call.

## Troubleshooting

**"Unauthenticated" errors (stdio shim)** — Confirm `LISTABLE_API_TOKEN` is set in the same shell or config block that launches the client. In Claude Desktop the `env` map in the JSON config must contain the key.

**OAuth loop / browser doesn't redirect back** — Make sure the client's redirect URL is reachable. Some clients use a localhost callback; cookies or popup blockers can interrupt the flow.

**"Tool not available"** — Restart the client (Claude Desktop requires a full quit and reopen). In Claude Code, run `/mcp` to confirm Listable is connected.

**`403` on specific projects** — Your token is scoped. OAuth: re-run the approval and select more projects. Static key: create a new one without project scoping.

## Links

- Listable: <https://app.get-listable.com>
- API + MCP docs: <https://app.get-listable.com/my-account/api-docs>
- Model Context Protocol: <https://modelcontextprotocol.io>

## License

MIT — see [LICENSE](./LICENSE).
