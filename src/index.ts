#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { VeociClient } from "./client.js";
import { registerTools } from "./tools.js";

const server = new McpServer({
  name: "veoci-ticket-mcp",
  version: "0.1.3",
});

const client = new VeociClient();

registerTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
