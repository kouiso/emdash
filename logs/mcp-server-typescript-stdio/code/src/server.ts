import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "char-count", version: "0.1.0" });

server.registerTool(
  "count_chars",
  {
    title: "文字数を数える",
    description: "日本語の文章の文字数・行数・UTF-8 のバイト数を返す。文字数は見た目の1文字を1と数え、改行も1文字に含める。行数は改行（LF）で区切った数で、末尾が改行なら最後の空の行も1行と数える。",
    inputSchema: {
      text: z.string().min(1).max(10_000).describe("数えたい文章"),
    },
  },
  async ({ text }) => {
    const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });
    const chars = [...segmenter.segment(text)].length;
    const lines = text.split("\n").length;
    const bytes = Buffer.byteLength(text, "utf8");
    return {
      content: [{ type: "text", text: `文字数: ${chars} / 行数: ${lines} / UTF-8: ${bytes} バイト` }],
    };
  },
);

await server.connect(new StdioServerTransport());
console.error("char-count MCP server started (stdio)");
