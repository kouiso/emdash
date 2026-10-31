#!/usr/bin/env node
import { existsSync } from "node:fs";
import path from "node:path";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

// stdout は JSON-RPC 専用。ログを console.log で出すとプロトコルが壊れるので stderr に書く。
const notesDir = path.resolve(process.env.NOTES_DIR ?? "notes");
const server = createServer(notesDir);
await server.connect(new StdioServerTransport());
console.error(`[notes] MCP server started (stdio). NOTES_DIR=${notesDir}`);
if (!existsSync(notesDir)) {
  // パスの打ち間違いに気づけるよう、フォルダが無いことだけは stderr に残す。検索は 0 件として動く。
  console.error(`[notes] NOTES_DIR はまだありません。最初の add_note で作成します: ${notesDir}`);
}
