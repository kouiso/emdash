import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer, INDEX_URI } from "../src/server.js";

let dir = "";
let client: Client;

function firstText(result: Awaited<ReturnType<Client["callTool"]>>): string {
  const content = result.content;
  assert.ok(Array.isArray(content));
  const item = content[0];
  assert.ok(item && item.type === "text");
  return item.text;
}

before(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "notes-server-test-"));
  await writeFile(path.join(dir, "a.md"), "# Alpha\nMCP is a protocol\n");
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await createServer(dir).connect(serverSide);
  client = new Client({ name: "test-client", version: "0.0.0" });
  await client.connect(clientSide);
});
after(async () => {
  await client.close();
  await rm(dir, { recursive: true, force: true });
});

describe("MCP server (in-memory)", () => {
  it("2 つのツールを公開する", async () => {
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map((t) => t.name).sort(), ["add_note", "search_notes"]);
  });
  it("search_notes がヒット行を返す", async () => {
    const text = firstText(await client.callTool({ name: "search_notes", arguments: { query: "mcp" } }));
    assert.equal(text, "a.md:2: MCP is a protocol");
  });
  it("入力スキーマ違反はエラーになる", async () => {
    const result = await client.callTool({ name: "search_notes", arguments: { query: "" } });
    assert.equal(result.isError, true);
  });
  it("NOTES_DIR がまだ無くてもツールとリソースがエラーにならない", async () => {
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    await createServer(path.join(dir, "not-created-yet")).connect(serverSide);
    const fresh = new Client({ name: "test-client-missing-dir", version: "0.0.0" });
    await fresh.connect(clientSide);
    try {
      const result = await fresh.callTool({ name: "search_notes", arguments: { query: "mcp" } });
      assert.notEqual(result.isError, true);
      assert.equal(firstText(result), "「mcp」に一致する行はありませんでした。");
      const res = await fresh.readResource({ uri: INDEX_URI });
      const first = res.contents[0];
      assert.ok(first && "text" in first);
      assert.deepEqual(JSON.parse(String(first.text)), []);
    } finally {
      await fresh.close();
    }
  });
  it("add_note で保存したメモがリソースに現れる", async () => {
    assert.equal(firstText(await client.callTool({ name: "add_note", arguments: { title: "New", body: "x" } })), "保存しました: new.md");
    const res = await client.readResource({ uri: INDEX_URI });
    const first = res.contents[0];
    assert.ok(first && "text" in first);
    const files = (JSON.parse(String(first.text)) as Array<{ file: string }>).map((n) => n.file);
    assert.deepEqual(files, ["a.md", "new.md"]);
  });
});
