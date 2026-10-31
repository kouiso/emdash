---
title: "MCPサーバーを TypeScript で自作する手順【API キー不要、stdio で動く最小構成】"
slug: "mcp-server-typescript-stdio"
description: "公式 SDK 1.32.2 で、文字数を数えるツールを1つだけ持つ MCP サーバーを TypeScript で作ります。API キーなしで動作を確かめ、Claude Code に登録するところまで、実際に動かした出力付きで書いています。"
tags: ["MCPサーバー", "TypeScript", "Claude Code"]
main_keyword: "MCPサーバー"
target_query: "mcpサーバー 自作 typescript"
course_step: 5
prev: null
next: null
sources:
  - url: "https://github.com/modelcontextprotocol/typescript-sdk/tree/v1.x"
    title: "modelcontextprotocol/typescript-sdk (v1.x branch) README"
    accessed: 2026-10-31
  - url: "https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/docs/server.md"
    title: "typescript-sdk v1.x docs/server.md"
    accessed: 2026-10-31
  - url: "https://modelcontextprotocol.io/specification/2025-11-25/basic/transports"
    title: "MCP Specification 2025-11-25 Transports"
    accessed: 2026-10-31
  - url: "https://modelcontextprotocol.io/docs/develop/build-server"
    title: "Build an MCP server"
    accessed: 2026-10-31
  - url: "https://code.claude.com/docs/en/mcp"
    title: "Connect Claude Code to tools via MCP"
    accessed: 2026-10-31
  - url: "https://www.jsonrpc.org/specification"
    title: "JSON-RPC 2.0 Specification"
    accessed: 2026-10-31
  - url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter/Segmenter"
    title: "Intl.Segmenter() constructor (MDN)"
    accessed: 2026-10-31
  - url: "https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/src/client/stdio.ts"
    title: "typescript-sdk v1.x src/client/stdio.ts"
    accessed: 2026-10-31
  - url: "https://www.npmjs.com/package/@modelcontextprotocol/sdk"
    title: "@modelcontextprotocol/sdk (npm)"
    accessed: 2026-10-31
  - url: "https://modelcontextprotocol.io/docs/getting-started/intro"
    title: "What is the Model Context Protocol (MCP)?"
    accessed: 2026-10-31
  - url: "https://modelcontextprotocol.io/specification/2025-11-25/server/tools"
    title: "MCP Specification 2025-11-25 Tools"
    accessed: 2026-10-31
ai_assisted: true
needs_api_key: false
status: draft
publish_at: null
updated: 2026-10-31
---

自分のアプリの処理を Claude Code から呼ぶには、処理をツールにした MCP サーバーを書いて登録します。題材は、文章の文字数を数えるツールを1つだけ持つサーバーです。TypeScript で書いて API キーなしで動かし、Claude Code への登録と接続まで確かめました。コードはすべて 2026-10-31 に Node.js 22.22.0 で実行し、出力をそのまま載せました。

読み終えた人は、自分で決めた処理を MCP のツールとして公開できます。SDK のクライアントで呼び、結果を確かめるところまで手元で完結します。LLM の API は一度も呼ばないので、API の料金はかかりません。

## 使うバージョンと SDK の選び方

公式の TypeScript SDK `@modelcontextprotocol/sdk` の 1.32.2 を使います。2026-10-31 に `npm view` で確かめた時点の latest も 1.32.2 でした。

| パッケージ | バージョン |
|---|---|
| `@modelcontextprotocol/sdk` | 1.32.2 |
| `zod` | 4.6.7 |
| `typescript`（開発用） | 7.0.2 |
| `@types/node`（開発用） | 22.20.5 |

SDK には v2 という新しい系列もあります。SDK の v1.x ブランチの README によれば、v1.x はメンテナンス系列です。対応する MCP 仕様は 2025-11-25 版までです。新しい 2026-07-28 版の仕様に v1.x は対応しない予定だと、同じ README にあります。2026-07-28 版に対応しているのは v2 です。v2 は `@modelcontextprotocol/server` などの別パッケージで、2026-07-27 に出ました。v1.x の修正は、その日から少なくとも6か月続くとされています。公式チュートリアル「Build an MCP server」の TypeScript 版も、今は v2 です。

それでも 1.32.2 を選んだ理由は、このブログの特典サンプル（`samples/mcp-server`）と版を揃えたかったからです。2027-01-27 を過ぎて v1.x の修正が止まったら、この記事は v2 で書き直します。

## 作るのは文字数を数えるツール1つ

MCP は Model Context Protocol の略です。AI アプリを外部のデータやツールにつなぐ、オープンな規格として公開されています（MCP 公式サイト）。MCP サーバーは、言語モデルが呼べるツールを公開する側のプログラムです。ツールは、名前と入力の形を持つ機能の単位を指します。モデルは会話とユーザーの指示からツールを選び、自分で呼び出せます（MCP 仕様 2025-11-25 の Tools）。

この記事のサーバーが公開するのは `count_chars` というツール1つだけです。文章を受け取り、文字数、行数、UTF-8 のバイト数を1行の文字列で返します。下書きを見せて「この段落は何文字？」と聞いたとき、Claude Code がこのツールを使える状態を目指しました。

stdio 方式では、クライアント（Claude Code など）がサーバーを子プロセスとして起動します。やり取りは標準入出力を通る JSON-RPC です（MCP 仕様 2025-11-25 の Transports）。サーバー側で HTTP のポートを開ける必要はありません。

## 設定ファイル2つで準備する

作業フォルダ `char-count-mcp` を作り、`package.json` と `tsconfig.json` を置きます。依存の版に `^` を付けていないのは、記事と同じ版を入れるためです。

```json
{
  "name": "char-count-mcp",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc",
    "check": "node dist/check.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "1.32.2",
    "zod": "4.6.7"
  },
  "devDependencies": {
    "@types/node": "22.20.5",
    "typescript": "7.0.2"
  }
}
```

`"type": "module"` は、サーバーのコードで最上位の `await` を使うために入れました。`tsconfig.json` は次の内容です。

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "types": ["node"],
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"]
}
```

用意できたら依存を入れます。

```bash
npm install
```

手元の出力では、脆弱性の警告は0件でした。

```text
added 99 packages, and audited 100 packages in 4s

36 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

## サーバー本体は28行に収まる

`src/server.ts` の中身は、ツールの登録と stdio への接続の2つだけです。ツールの名前、説明、入力の形を `registerTool` に渡します。

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "char-count", version: "0.1.0" });

server.registerTool(
  "count_chars",
  {
    title: "文字数を数える",
    description: "日本語の文章の文字数・行数・UTF-8 のバイト数を返す。絵文字や結合文字は見た目の1文字を1と数える。",
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
```

`inputSchema` には zod のスキーマを書きます。SDK は zod を必須の peer dependency にしています（v1.x の README）。スキーマに合わない入力はハンドラーに届く前に弾かれるので、ハンドラーで入力を確かめるコードは要りません。空文字を渡したときの結果は、次の節で確かめます。

返り値の `content` には `type: "text"` の要素を入れました。v1.x の docs/server.md の例と同じ形です。次の節の実行結果のとおり、クライアントにはこの文字列がそのまま届きます。

最後の行のログは、わざと `console.error` で書いています。MCP の仕様は、有効な MCP メッセージ以外を stdout に書くことを禁じているからです。stderr ならログに使ってよいと、同じ仕様に書かれています。

## API キーなしで動作を確かめる

Claude Code につなぐ前に、SDK のクライアントでサーバーを起動してツールを直接呼びます。LLM を通さないため、API キーも料金も要りません。`package.json` の `check` スクリプトが、次の `src/check.ts` を実行します。

```ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["dist/server.js"],
});
const client = new Client({ name: "check-client", version: "0.0.0" });
client.onerror = (error) => console.error("client error:", error.message);
await client.connect(transport);

const { tools } = await client.listTools();
console.log("tools:", tools.map((t) => t.name));

const ok = await client.callTool({
  name: "count_chars",
  arguments: { text: "MCPサーバーを作る👨‍👩‍👧\n2行目" },
});
console.log("ok:", JSON.stringify(ok));

const ng = await client.callTool({ name: "count_chars", arguments: { text: "" } });
console.log("ng:", JSON.stringify(ng));

await client.close();
```

`client.onerror` を付けた理由は、サーバーから読めない行が届いたときに知るためです。付けないと、壊れた行は何も表示されずに捨てられます（後の節で実際に試しました）。

ビルドして実行します。

```bash
npm run build
npm run check
```

実行結果は次のとおりです。

```text
> char-count-mcp@0.1.0 check
> node dist/check.js

char-count MCP server started (stdio)
tools: [ 'count_chars' ]
ok: {"content":[{"type":"text","text":"文字数: 15 / 行数: 2 / UTF-8: 50 バイト"}]}
ng: {"content":[{"type":"text","text":"MCP error -32602: Input validation error: Invalid arguments for tool count_chars: Too small: expected string to have >=1 characters at text"}],"isError":true}
```

npm が出す2行と空行のあとにある `char-count MCP server started (stdio)` は、サーバーが stderr に書いたログです。`StdioClientTransport` の `stderr` オプションは、既定値が `"inherit"` です（SDK の `src/client/stdio.ts`）。そのため、サーバーの stderr が親プロセスの画面にそのまま出ています。

`ok:` の行が正常な呼び出しの結果で、15文字と出ました。内訳は `MCPサーバーを作る` の10文字、家族の絵文字1文字、改行1文字、`2行目` の3文字です。

`ng:` の行は、空文字を渡して zod の `min(1)` に引っかかった結果です。1.32.2 では例外にならず、`isError: true` 付きの結果が返ってきました。`-32602` は、JSON-RPC 2.0 の仕様で「Invalid params」を表すコードです。呼ぶ側は try と catch を書かなくても、失敗を結果の1つとして受け取れます。

## 文字数は Intl.Segmenter で数える

日本語の文章の文字数に `text.length` を使うと、絵文字で数がずれます。家族の絵文字1つを3通りの方法で数えて比べました。次のコードを、作業フォルダ `char-count-mcp` に `compare.mjs` という名前で保存します。

```js
const text = "👨‍👩‍👧";
console.log("length:", text.length);
console.log("code points:", [...text].length);
const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });
console.log("graphemes:", [...segmenter.segment(text)].length);
```

Node.js でそのまま実行します。

```bash
node compare.mjs
```

```text
length: 8
code points: 5
graphemes: 1
```

`length` は UTF-16 の単位で数えるので8、コードポイント単位でも5です。`Intl.Segmenter` に `"grapheme"` を指定すると、人が1文字と感じる単位で区切ります（MDN）。ブログの文字数として人が期待するのは、3つ目の1のほうでしょう。

## stdout に書いた起動ログはクライアントに捨てられる

公式チュートリアルは、stdio のサーバーで `console.log()` を使うとメッセージが壊れると警告しています。実際に試すため、`src/server.ts` の最後の行の `console.error` を `console.log` に変えました。ビルドし直してから、「API キーなしで動作を確かめる」の節と同じ `npm run check` を実行します。

```bash
npm run build
npm run check
```

2つのコマンドの出力は次のとおりです。

```text

> char-count-mcp@0.1.0 build
> tsc


> char-count-mcp@0.1.0 check
> node dist/check.js

client error: Unexpected token 'c', "char-count"... is not valid JSON
tools: [ 'count_chars' ]
ok: {"content":[{"type":"text","text":"文字数: 15 / 行数: 2 / UTF-8: 50 バイト"}]}
ng: {"content":[{"type":"text","text":"MCP error -32602: Input validation error: Invalid arguments for tool count_chars: Too small: expected string to have >=1 characters at text"}],"isError":true}
```

起動ログの行は JSON として読めず、`client error:` として報告されました。1.32.2 のクライアントはその行を捨てて先を読むので、ツールの呼び出しは成功しています。

この結果を見て、stdout に書いても平気だと考えるのは危険です。仕様に反した出力をクライアントがどう扱うかは、クライアントの実装しだいです。しかも `client.onerror` が無いと、このエラーは画面に何も出ません。行が捨てられていても気づけないので、確認用のクライアントには `onerror` を付けておきます。

`console.error` に戻して実行し直したところ、出力は最初の結果と同じになりました。

## Claude Code に登録する

ビルドした `dist/server.js` を、`claude mcp add` で Claude Code に登録します。パスは、自分の作業フォルダの絶対パスに置き換えてください。

```bash
claude mcp add char-count --scope user --transport stdio -- node /path/to/char-count-mcp/dist/server.js
```

`--` より前は Claude Code 自身のオプションで、後ろはサーバーを起動するコマンドです。Claude Code のドキュメントの MCP のページに、この区切りの説明があります。`--scope` を省くと local スコープになり、今のプロジェクトで自分だけが使えます。全プロジェクトで使いたかったので、`--scope user` を付けました。

次の出力は、Claude Code 2.1.314 で登録から削除までを実行したものです。設定は使い捨てのディレクトリに書き、パスは置き換えています。

```text
$ claude mcp add char-count --scope user --transport stdio -- node /path/to/char-count-mcp/dist/server.js
Added stdio MCP server char-count with command: node /path/to/char-count-mcp/dist/server.js to user config
File modified: /path/to/tmp-home/.claude/.claude.json

$ claude mcp list
Checking MCP server health…

char-count: node /path/to/char-count-mcp/dist/server.js - √ Connected

$ claude mcp get char-count
char-count:
  Scope: User config (available in all your projects)
  Status: √ Connected
  Type: stdio
  Command: node
  Args: /path/to/char-count-mcp/dist/server.js
  Environment:

To remove this server, run: claude mcp remove char-count -s user

$ claude mcp remove char-count -s user
Removed MCP server char-count from user config
File modified: /path/to/tmp-home/.claude/.claude.json
```

`claude mcp list` の `√ Connected` は、Claude Code がサーバーを起動して接続できた印です。登録後のセッションでは、`/mcp` で接続の状態を見られます。なお、Claude にツールを選ばせて呼ぶところは、この記事では実行していません。

## 料金と次に作るもの

この記事のコードは LLM の API を一度も呼ばないので、API の料金はかかりません。SDK のクライアントで確かめる方法なら、API キーが無くても開発を進められます。Claude Code 自体の料金は、この記事では扱いません。

ツールが1つ動いたら、次は自分のアプリにある処理を `registerTool` で包んでみてください。あなたのアプリのどの関数を、最初に Claude から呼べるようにしますか。

AI 支援で執筆しました。コードは 2026-10-31 に実際に実行して確認しています。
