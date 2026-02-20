import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { VeociClient } from "./client.js";

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

function ok(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

function err(message: string): ToolResult {
  return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
}

export function registerTools(server: McpServer, client: VeociClient): void {
  server.tool(
    "lookup_ticket",
    "Look up a Veoci ticket by number and return its entry ID",
    { ticket_number: z.string().describe("Veoci ticket number (e.g. '12345')") },
    async ({ ticket_number }) => {
      try {
        const entryId = await client.lookupTicket(ticket_number);
        return ok(JSON.stringify({ entry_id: entryId }));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[veoci-ticket-mcp] lookup_ticket error:", msg);
        return err(msg);
      }
    }
  );

  server.tool(
    "get_ticket",
    "Get full ticket details by ticket number or entry ID",
    { id: z.string().describe("Ticket number or entry ID") },
    async ({ id }) => {
      try {
        const entryId = await client.resolveEntryId(id);
        const data = await client.getTicket(entryId);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[veoci-ticket-mcp] get_ticket error:", msg);
        return err(msg);
      }
    }
  );

  server.tool(
    "get_thread",
    "Get the chat thread messages for a ticket",
    { id: z.string().describe("Ticket number or entry ID") },
    async ({ id }) => {
      try {
        const entryId = await client.resolveEntryId(id);
        const data = await client.getThread(entryId);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[veoci-ticket-mcp] get_thread error:", msg);
        return err(msg);
      }
    }
  );

  server.tool(
    "post_message",
    "Post a message to a ticket's chat thread",
    {
      id: z.string().describe("Ticket number or entry ID"),
      message: z.string().describe("Message to post (HTML)"),
    },
    async ({ id, message }) => {
      try {
        const entryId = await client.resolveEntryId(id);
        const data = await client.postMessage(entryId, message);
        return ok(JSON.stringify(data, null, 2));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[veoci-ticket-mcp] post_message error:", msg);
        return err(msg);
      }
    }
  );
}
