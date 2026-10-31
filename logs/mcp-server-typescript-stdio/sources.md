# sources: mcp-server-typescript-stdio

アクセス日はすべて 2026-10-31。frontmatter の `sources` と同じ11件（#10、#11 はレビュー指摘を受けて同日に追加）。

| # | URL | 題名 | 確かめた事実 | 記事のどの文の根拠か |
|---|---|---|---|---|
| 1 | https://github.com/modelcontextprotocol/typescript-sdk/tree/v1.x | typescript-sdk v1.x README | 「This is v1.x of the MCP TypeScript SDK, the maintenance line.」「It implements the MCP spec up to 2025-11-25.」「Support for the 2026-07-28 spec is not planned for v1.x: it is in v2, the current stable release」（raw の README.md 3行目を 2026-10-31 に取得して確認）v2 は `@modelcontextprotocol/server` と `@modelcontextprotocol/client` の別パッケージ。「at least six months after the v2 release (2026-07-27)」。zod は「required peer dependency」 | 「使うバージョンと SDK の選び方」の v1.x と v2 の説明（2026-07-28 版の仕様に v1.x は対応しない予定、対応は v2）、2027-01-27 の算出（2026-07-27 + 6か月）、「サーバー本体」節の peer dependency の文 |
| 2 | https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/docs/server.md | typescript-sdk v1.x docs/server.md | `new McpServer({ name, version })`、`server.registerTool(name, config, handler)`（config に title、description、inputSchema）、`content: [{ type: 'text', text }]`、`isError: true` で失敗を示す、`StdioServerTransport` の import パス `@modelcontextprotocol/sdk/server/stdio.js` | `src/server.ts` の書き方、「v1.x の docs/server.md の例と同じ形です」の文。docs/server.md の例は「This snippet is illustrative only」と注記されており、クライアントがどう受け取るかは書いていないので、「クライアントにはこの文字列がそのまま届きます」は `run/09.log` を根拠にした（下の表） |
| 3 | https://modelcontextprotocol.io/specification/2025-11-25/basic/transports | MCP Specification 2025-11-25 Transports | stdio では「The client launches the MCP server as a subprocess」、メッセージは改行区切りの JSON-RPC、「The server MUST NOT write anything to its stdout that is not a valid MCP message」、「The server MAY write UTF-8 strings to its standard error (stderr) for any logging purposes」 | 「作るのは文字数を数えるツール1つ」の stdio の説明、「サーバー本体」節の stdout と stderr の文 |
| 4 | https://modelcontextprotocol.io/docs/develop/build-server | Build an MCP server | TypeScript 版の手順は `npm install @modelcontextprotocol/server zod`（v2）。「For STDIO-based servers: Never use console.log(), as it writes to standard output (stdout) by default. Writing to stdout will corrupt the JSON-RPC messages and break your server.」 | 「公式チュートリアル…の TypeScript 版も、今は v2 です」、stdout 節の冒頭の文 |
| 5 | https://code.claude.com/docs/en/mcp | Connect Claude Code to tools via MCP | `claude mcp add [options] <name> -- <command> [args...]`、`--` が Claude 自身のオプション（`--transport`、`--env`、`--scope`）とサーバーのコマンドを分ける、scope は `local`（default）、`project`、`user`、`claude mcp list/get/remove`、`/mcp` | 「Claude Code に登録する」節 |
| 6 | https://www.jsonrpc.org/specification | JSON-RPC 2.0 Specification | -32602 は「Invalid params」「Invalid method parameter(s).」 | 「-32602 は、JSON-RPC 2.0 の仕様で Invalid params を表すコードです」 |
| 7 | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter/Segmenter | Intl.Segmenter() constructor (MDN) | granularity `"grapheme"`（default）は「Split the input into segments at grapheme cluster (user-perceived character) boundaries」 | 「Intl.Segmenter に grapheme を指定すると、人が1文字と感じる単位で区切ります（MDN）」 |
| 8 | https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/src/client/stdio.ts | typescript-sdk v1.x src/client/stdio.ts | `stderr` オプションのコメント「The default is "inherit", meaning messages to stderr will be printed to the parent process's stderr.」。インストールした 1.32.2 の `dist/esm/client/stdio.d.ts` 23行目にも同じ文がある | 「StdioClientTransport の stderr オプションは、既定値が inherit です」 |
| 10 | https://modelcontextprotocol.io/docs/getting-started/intro | What is the Model Context Protocol (MCP)? | 「MCP (Model Context Protocol) is an open-source standard for connecting AI applications to external systems.」、接続先の例として data sources、tools、workflows | 「作るのは文字数を数えるツール1つ」の「MCP は Model Context Protocol の略です。AI アプリを外部のデータやツールにつなぐ、オープンな規格として公開されています」 |
| 11 | https://modelcontextprotocol.io/specification/2025-11-25/server/tools | MCP Specification 2025-11-25 Tools | 「The Model Context Protocol (MCP) allows servers to expose tools that can be invoked by language models.」「Each tool is uniquely identified by a name and includes metadata describing its schema.」「Tools in MCP are designed to be model-controlled, meaning that the language model can discover and invoke tools automatically based on its contextual understanding and the user's prompts.」 | 同じ段落の MCP サーバー、ツール、モデルがツールを選んで呼ぶ、の3文 |
| 9 | https://www.npmjs.com/package/@modelcontextprotocol/sdk | @modelcontextprotocol/sdk (npm) | `npm view @modelcontextprotocol/sdk version dist-tags` の結果が version 1.32.2、latest 1.32.2（2026-10-31 実行）。zod の latest 4.6.7、typescript の latest 7.0.2、`@modelcontextprotocol/server` の latest 2.4.0 も同日に `npm view` で確認 | 「2026-10-31 に npm view で確かめた時点の latest も 1.32.2 でした」、バージョン表 |

## 出典ではなく実行ログを根拠にした断定

| 文 | 根拠 |
|---|---|
| 空文字で `isError: true` と `-32602` のメッセージが返る（1.32.2） | `run/03.log`、再実行 `run/09.log` |
| `type: "text"` の content がクライアントにそのまま文字列として届く | `run/03.log`、`run/09.log` の `ok:` の行 |
| 家族の絵文字の length 8、code points 5、graphemes 1 | `run/04.log` |
| `console.log` にすると `client error: Unexpected token 'c'...` が出て、呼び出しは成功する | `run/05.log`、記事に載せた出力は `run/10.log`（`npm run build` と `npm run check` を記事どおり別々に実行）。SDK 1.32.2 の `dist/esm/shared/stdio.js` の `deserializeMessage` が `JSON.parse` に失敗して `onerror` に渡すことも読んで確認 |
| `client.onerror` を付けないと何も表示されない | `run/08.log`（check.ts から onerror の行を除き、server.ts を console.log にした版。エラー表示なしで成功）。SDK の `Protocol._onerror` が `this.onerror?.(error)` を呼ぶだけであることも `dist/esm/shared/protocol.js` 274-275行で確認 |
| `claude mcp add/list/get/remove` の出力 | `run/07.log` |
| Node.js 22.22.0、npm 10.9.4、脆弱性0件 | `run/01.log` |

## 料金

記事のコードは LLM の API を呼ばない（`needs_api_key: false`）。「API の料金はかかりません」と本文の冒頭と末尾の節に書いた。Claude Code 自体の料金は扱わないと明記した。
