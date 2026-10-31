// 記事には載せない確認用。サーバーのプロセスが止まったあとに callTool すると、
// isError 付きの結果ではなく例外になることを確かめる（作業フォルダで npm run build のあとに実行）。
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({ command: process.execPath, args: ["dist/server.js"] });
const client = new Client({ name: "server-down-check", version: "0.0.0" });
await client.connect(transport);
process.kill(transport.pid, "SIGKILL");
await new Promise((resolve) => setTimeout(resolve, 500));
try {
  const result = await client.callTool({ name: "count_chars", arguments: { text: "a" } });
  console.log("result:", JSON.stringify(result));
} catch (error) {
  console.log("thrown:", error.message);
}
