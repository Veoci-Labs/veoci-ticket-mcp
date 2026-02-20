# @veoci-labs/veoci-ticket-mcp

MCP server for Veoci dev ticket operations.

## Install

```
npx -y @veoci-labs/veoci-ticket-mcp
```

## Configuration

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "veoci-tickets": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@veoci-labs/veoci-ticket-mcp"]
    }
  }
}
```

## Authentication

Set `VEOCI_PAT` environment variable, or place it in `$WORKSPACE/.design-toolkit/.env`:

```
VEOCI_PAT=your-personal-access-token
```

The server checks env var first, then falls back to the `.env` file.

## Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `lookup_ticket` | Look up a ticket by number, returns entry ID | `ticket_number` (string) |
| `get_ticket` | Get full ticket details | `id` (ticket number or entry ID) |
| `get_thread` | Get chat thread messages | `id` (ticket number or entry ID) |
| `post_message` | Post message to ticket thread | `id` (ticket number or entry ID), `message` (HTML string) |

All tools accept either a ticket number (e.g. `12345`) or an entry ID (8+ digits). Ticket numbers are automatically resolved to entry IDs.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VEOCI_PAT` | (required) | Personal Access Token |
| `VEOCI_BASE_URL` | `https://veoci.com/api/v2` | API base URL |
| `VEOCI_FORM_ID` | `31809772` | Dev ticket form ID |
| `VEOCI_CONTAINER_ID` | `67813` | Container/chat room ID |
| `VEOCI_CHAT_ID` | `67813` | Chat room ID |

## License

MIT
