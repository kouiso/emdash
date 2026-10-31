// SDK のクライアントで dist/index.js を子プロセスとして起動し、stdio 越しに一通り叩く。
// sample-notes/ は一時フォルダへコピーしてから使うので、リポジトリのファイルは書き換わらない。
import assert from "node:assert/strict";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const notesDir = await mkdtemp(path.join(tmpdir(), "notes-e2e-"));
await cp(path.join(root, "sample-notes"), notesDir, { recursive: true });

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [path.join(root, "dist", "index.js")],
  env: { PATH: process.env.PATH ?? "", NOTES_DIR: notesDir },
  stderr: "pipe",
});
const client = new Client({ name: "e2e-client", version: "0.0.0" });

function show(label: string, value: unknown): void {
  console.log(`\n=== ${label} ===`);
  console.log(typeof value === "string" ? value : JSON.stringify(value, null, 2));
}

try {
  await client.connect(transport);
  show("initialize", { serverInfo: client.getServerVersion(), capabilities: client.getServerCapabilities() });

  const { tools } = await client.listTools();
  show("tools/list", tools.map((t) => ({ name: t.name, inputSchema: t.inputSchema })));
  assert.deepEqual(tools.map((t) => t.name).sort(), ["add_note", "search_notes"]);

  const search = await client.callTool({ name: "search_notes", arguments: { query: "stdio" } });
  show("tools/call search_notes {query:'stdio'}", search);
  assert.notEqual(search.isError, true);

  const add = await client.callTool({ name: "add_note", arguments: { title: "E2E テスト", body: "stdio 経由で追加した。" } });
  show("tools/call add_note", add);
  assert.notEqual(add.isError, true);

  const again = await client.callTool({ name: "search_notes", arguments: { query: "stdio", limit: 5 } });
  show("tools/call search_notes (追加後)", again);

  const { resources } = await client.listResources();
  show("resources/list", resources);

  const index = await client.readResource({ uri: "notes://index" });
  show("resources/read notes://index", index);
  const first = index.contents[0];
  assert.ok(first && "text" in first);
  const files = (JSON.parse(String(first.text)) as Array<{ file: string }>).map((n) => n.file);
  assert.deepEqual(files, ["e2e-テスト.md", "mcp-memo.md", "shopping.md"]);

  console.log("\nE2E OK");
} finally {
  await client.close();
  await rm(notesDir, { recursive: true, force: true });
}
