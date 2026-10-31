import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { addNote, listNotes, searchNotes } from "./notes.js";

export const SERVER_NAME = "notes";
export const SERVER_VERSION = "0.1.0";
export const INDEX_URI = "notes://index";

export function createServer(notesDir: string): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });

  server.registerTool(
    "search_notes",
    {
      title: "メモを検索",
      description: "メモフォルダ直下の .md ファイルを、大文字小文字を区別せずに部分一致検索する。ヒットした行をファイル名・行番号つきで返す。",
      inputSchema: {
        query: z.string().min(1).max(200).describe("探す文字列"),
        limit: z.number().int().min(1).max(100).default(20).describe("返す最大件数"),
      },
    },
    async ({ query, limit }) => {
      const hits = await searchNotes(notesDir, query, limit);
      const text =
        hits.length === 0
          ? `「${query}」に一致する行はありませんでした。`
          : hits.map((h) => `${h.file}:${h.line}: ${h.text}`).join("\n");
      return { content: [{ type: "text", text }] };
    },
  );

  server.registerTool(
    "add_note",
    {
      title: "メモを追加",
      description: "新しいメモを .md ファイルとして保存する。ファイル名はタイトルから自動で作り、既存ファイルは上書きしない。",
      inputSchema: {
        title: z.string().trim().min(1).max(100).describe("メモのタイトル (1 行目の見出しになる)"),
        body: z.string().max(10_000).describe("メモ本文 (Markdown)"),
      },
    },
    async ({ title, body }) => {
      const file = await addNote(notesDir, title, body);
      return { content: [{ type: "text", text: `保存しました: ${file}` }] };
    },
  );

  server.registerResource(
    "notes-index",
    INDEX_URI,
    {
      title: "メモ一覧",
      description: "メモフォルダ直下の .md ファイルの一覧 (ファイル名・タイトル・サイズ・更新日時)",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(await listNotes(notesDir), null, 2) }],
    }),
  );

  return server;
}
