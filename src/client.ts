import { readFile } from "node:fs/promises";
import { join } from "node:path";

const BASE_URL = process.env.VEOCI_BASE_URL || "https://veoci.com/api/v2";
const FORM_ID = process.env.VEOCI_FORM_ID || "31809772";
const CONTAINER_ID = process.env.VEOCI_CONTAINER_ID || "67813";
const CHAT_ID = process.env.VEOCI_CHAT_ID || "67813";

export class VeociClient {
  private patCache: string | null = null;
  private patResolved = false;
  private entryIdCache = new Map<string, string>();

  private async resolvePat(): Promise<string> {
    if (this.patResolved) {
      if (!this.patCache) throw new Error("No VEOCI_PAT found in environment or .env file");
      return this.patCache;
    }

    this.patResolved = true;

    if (process.env.VEOCI_PAT) {
      this.patCache = process.env.VEOCI_PAT;
      return this.patCache;
    }

    const workspace = process.env.WORKSPACE;
    if (workspace) {
      try {
        const envPath = join(workspace, ".design-toolkit", ".env");
        const contents = await readFile(envPath, "utf-8");
        for (const line of contents.split("\n")) {
          const match = line.match(/^VEOCI_PAT=(.+)$/);
          if (match) {
            this.patCache = match[1].trim();
            return this.patCache;
          }
        }
      } catch {
        // File not found or unreadable - fall through
      }
    }

    throw new Error(
      "No VEOCI_PAT found. Set VEOCI_PAT env var or place it in $WORKSPACE/.design-toolkit/.env"
    );
  }

  private async request(path: string, options: RequestInit = {}): Promise<Response> {
    const pat = await this.resolvePat();
    const url = `${BASE_URL}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${pat}`,
      ...(options.headers as Record<string, string> | undefined),
    };
    const response = await fetch(url, { ...options, headers });
    return response;
  }

  async lookupTicket(ticketNumber: string): Promise<string> {
    const filters = JSON.stringify({
      advancedFilters: [
        {
          c: "custom_27",
          o: "is",
          v: ticketNumber,
        },
      ],
    });

    const params = new URLSearchParams({
      filters,
      alldata: "true",
      includeParents: "false",
      includeChildEntries: "false",
      includeChildren: "true",
      outputType: "rawgrid",
      sortCol: "lastModified",
      sortDir: "false",
      async: "true",
      includeTemplate: "false",
    });

    const response = await this.request(
      `/w/classic/${CONTAINER_ID}/forms/${FORM_ID}/entries`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      }
    );

    if (!response.ok) {
      throw new Error(`lookup_ticket HTTP ${response.status}: ${await response.text()}`);
    }

    const data = (await response.json()) as { entries?: Array<{ id: string }> };
    const entryId = data.entries?.[0]?.id;
    if (!entryId) {
      throw new Error(`No entry found for ticket number ${ticketNumber}`);
    }
    return entryId;
  }

  async resolveEntryId(input: string): Promise<string> {
    const stripped = input.startsWith("#") ? input.slice(1) : input;

    if (this.entryIdCache.has(stripped)) {
      return this.entryIdCache.get(stripped)!;
    }

    let entryId: string;
    if (stripped.length >= 8) {
      entryId = stripped;
    } else {
      entryId = await this.lookupTicket(stripped);
    }

    this.entryIdCache.set(stripped, entryId);
    return entryId;
  }

  async getTicket(entryId: string): Promise<unknown> {
    const response = await this.request(`/forms/${FORM_ID}/entries/${entryId}`);
    if (!response.ok) {
      throw new Error(`get_ticket HTTP ${response.status}: ${await response.text()}`);
    }
    return response.json();
  }

  async getThread(entryId: string): Promise<unknown> {
    const threadId = `sosobject-${entryId}`;
    const response = await this.request(
      `/chats/${CHAT_ID}/threads/${threadId}/messages?limit=30`
    );
    if (!response.ok) {
      throw new Error(`get_thread HTTP ${response.status}: ${await response.text()}`);
    }
    return response.json();
  }

  async postMessage(entryId: string, message: string): Promise<unknown> {
    const response = await this.request(`/chats/${CHAT_ID}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thread: `sosobject-${entryId}`,
        message,
        type: "CHAT",
      }),
    });
    if (!response.ok) {
      throw new Error(`post_message HTTP ${response.status}: ${await response.text()}`);
    }
    return response.json();
  }
}
