# sources: mcp-server-typescript-stdio

番号は記事の「出典」の表と同じ。アクセス日はすべて 2026-10-31。frontmatter の `sources` も同じ15件（並びも同じ）。2026-10-31 のレビューを受けて、本文に出典の表を置き、#2 のエラー処理、#9 の状態表示、#10、#13、#14、#15 を同日に読み足した。

| # | URL | 題名 | 確かめた事実 | 記事のどの文の根拠か |
|---|---|---|---|---|
| 1 | https://modelcontextprotocol.io/docs/getting-started/intro | What is the Model Context Protocol (MCP)? | 「MCP (Model Context Protocol) is an open-source standard for connecting AI applications to external systems.」、接続先の例として data sources、tools、workflows | 79行目の MCP の定義と、つなぐ先の例3つ |
| 2 | https://modelcontextprotocol.io/specification/2025-11-25/server/tools | MCP Specification 2025-11-25 Tools | 「allows servers to expose tools that can be invoked by language models」「Each tool is uniquely identified by a name and includes metadata describing its schema.」「the language model can discover and invoke tools automatically based on its contextual understanding and the user's prompts」。Error Handling 節: 「Tool Execution Errors: Reported in tool results with isError: true」の例に「Input validation errors」。Protocol Errors は「Unknown tools」「Malformed requests」「Server errors」 | 81行目の MCP サーバー、ツール、LLM がツールを選ぶ、の3文。316行目「入力の検証エラーは isError: true の結果で返す」 |
| 3 | https://modelcontextprotocol.io/specification/2025-11-25/basic/transports | MCP Specification 2025-11-25 Transports | stdio では「The client launches the MCP server as a subprocess」、メッセージは改行区切りの JSON-RPC、「The server MUST NOT write anything to its stdout that is not a valid MCP message」、「The server MAY write UTF-8 strings to its standard error (stderr) for any logging purposes」 | 85行目の stdio の説明、232行目の stdout と stderr の文。最初の版にあった「HTTP のポートを開ける必要はありません」は、出典に直接の文が無いので削った |
| 4 | https://github.com/modelcontextprotocol/typescript-sdk/tree/v1.x | typescript-sdk v1.x README | 「This is v1.x of the MCP TypeScript SDK, the maintenance line.」「It implements the MCP spec up to 2025-11-25.」「Support for the 2026-07-28 spec is not planned for v1.x: it is in v2, the current stable release」。v2 は `@modelcontextprotocol/server` と `@modelcontextprotocol/client` の別パッケージ。「at least six months after the v2 release (2026-07-27)」。zod は「required peer dependency」 | 100〜102行目の v1 系と v2 系の説明、104行目の 2027-01-27（2026-07-27 + 6か月）、226行目の peer dependency |
| 5 | https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/docs/server.md | typescript-sdk v1.x docs/server.md | `new McpServer({ name, version })`、`server.registerTool(name, config, handler)`（config に title、description、inputSchema）、`content: [{ type: 'text', text }]` | 193行目の `registerTool` に渡すもの、230行目「docs/server.md の例と同じ形」 |
| 6 | https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/src/client/stdio.ts | typescript-sdk v1.x src/client/stdio.ts | `stderr` オプションのコメント「The default is "inherit", meaning messages to stderr will be printed to the parent process's stderr.」 | 312行目 |
| 7 | https://www.npmjs.com/package/@modelcontextprotocol/sdk | @modelcontextprotocol/sdk (npm) | 2026-10-31 に `npm view @modelcontextprotocol/sdk dist-tags` で latest 1.32.2、`npm view @modelcontextprotocol/sdk@1.32.2 engines` で `{ node: '>=18' }` | 89行目「Node.js 18 以上を指定」、104行目「latest も 1.32.2」 |
| 8 | https://modelcontextprotocol.io/docs/develop/build-server | Build an MCP server | TypeScript の手順は `npm install @modelcontextprotocol/server zod`（v2 系）。「For STDIO-based servers: Never use console.log(), as it writes to standard output (stdout) by default. Writing to stdout will corrupt the JSON-RPC messages and break your server.」 | 102行目「TypeScript の例は v2 系」、362行目の警告とその理由 |
| 9 | https://code.claude.com/docs/en/mcp | Connect Claude Code to tools via MCP | 「the `--` (double dash) separates Claude's own options, such as `--transport`, `--env`, and `--scope`, from the command and arguments that run the server」。「Local scope is the default. A local-scoped server loads only in the project where you added it and stays private to you.」。「`claude mcp list` shows a health status next to each server it lists, such as `✔ Connected`, `! Needs authentication`, or `✘ Failed to connect`. A failure status means Claude Code couldn't connect to that server」。`/mcp` は「Check server status」 | 328行目、358行目 |
| 10 | https://code.claude.com/docs/en/setup | Claude Code Advanced setup | インストール手順。「Claude Code requires a Pro, Max, Ultra, Team, Enterprise, or Console account. The free claude.ai plan does not include Claude Code access.」 | 89行目のインストール手順、398行目の料金が要る操作 |
| 11 | https://www.jsonrpc.org/specification | JSON-RPC 2.0 Specification | -32602 は「Invalid params」「Invalid method parameter(s).」 | 316行目 |
| 12 | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter/Segmenter | Intl.Segmenter() constructor (MDN) | granularity `"grapheme"`（default）は「Split the input into segments at grapheme cluster (user-perceived character) boundaries」 | 258行目 |
| 13 | https://nodejs.org/api/esm.html | Node.js Modules: ECMAScript modules | Enabling 節「the package.json "type" field with a value "module"」で ES モジュールとして読む。Top-level await 節「The await keyword may be used in the top level body of an ECMAScript module.」 | 154行目 |
| 14 | https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/src/server/mcp.ts | typescript-sdk v1.x src/server/mcp.ts | tools/call のハンドラーで `validateToolInput` を呼んでから `executeToolHandler` を呼ぶ。失敗は catch で `createToolError` にして返す。メッセージは `Input validation error: Invalid arguments for tool ${toolName}: …`。インストールした 1.32.2 の `dist/esm/server/mcp.js` 178〜194行目も同じ流れ | 226行目「ハンドラーを呼ぶ前に入力を確かめ、合わなければハンドラーを呼ばずにエラーの結果を返す」 |
| 15 | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length | String: length (MDN) | 「The length data property of a String value contains the length of the string in UTF-16 code units.」、絵文字は2つのコードユニットになる場合がある | 258行目「length は UTF-16 の単位で数えるので、8になります」（最初の版では出典が無かった） |

## 出典ではなく実行ログを根拠にした断定

| 文（行番号は原稿） | 根拠 |
|---|---|
| 69〜71行目と 308行目の `ok:` の出力、314行目の15文字 | `run/14.log`、`run/19.log` |
| 75行目 `npm install` の実測5秒、180行目 脆弱性0件 | `run/13.log`（「audited 100 packages in 5s」「found 0 vulnerabilities」） |
| 253〜258行目 length 8、code points 5、graphemes 1 | `run/15.log` |
| 291行目 `client.onerror` が無いと何も出ない | `run/21.log`（onerror の行を除いた check.ts と console.log 版の server.ts で、エラー表示なしで成功）。SDK の `Protocol._onerror` が `this.onerror?.(error)` を呼ぶだけであることも確認済み（最初の版のとき、`dist/esm/shared/protocol.js`） |
| 316行目 空文字で `isError: true` と `-32602` のメッセージが返る | `run/14.log` の `ng:` の行 |
| 318行目 サーバーを止めてから `callTool` を呼ぶと `Not connected` の例外 | `run/16.log`（`code/extra/server-down.mjs`）。1.32.2 の `dist/esm/shared/protocol.js` 651行目 `earlyReject(new Error('Not connected'))` |
| 332〜356行目 `claude mcp add/list/get/remove` の出力、ログインなしで動く | `run/20.log` |
| 371〜381行目 `console.log` にすると `client error:` が出て、呼び出しは成功する | `run/17.log` |
| 383行目 `console.log` 版でも `claude mcp list` は `√ Connected` | `run/18.log` |
| 392行目 戻してビルドし直すと手順3と同じ出力 | `run/19.log`（`run/14.log` と同じ3行） |

## 料金

記事のコードは LLM の API を呼ばない（`needs_api_key: false`）。396〜398行目と frontmatter の `cost_estimate` に、無料なのは記事の手順（API を呼ばない、`claude mcp` はログインなしで動いた）までで、Claude にツールを呼ばせるには Claude Code を使える有料のプランか Console のアカウントが要る（#10）と書いた。Claude にツールを呼ばせる操作は実行していないので金額は書いていない。
