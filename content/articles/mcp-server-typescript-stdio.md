---
title: "MCPサーバーを TypeScript で自作する手順【SDK v1.32.2、Claude Code に接続まで】"
slug: "mcp-server-typescript-stdio"
description: "公式 SDK v1.32.2 で、文字数を数えるツールを1つ持つ MCP サーバーを TypeScript で作ります。SDK のクライアントで結果を確かめ、Claude Code に登録して接続するまでを実際の出力付きで書いています。"
tags: ["MCPサーバー", "TypeScript", "Claude Code"]
main_keyword: "MCPサーバー"
target_query: null
course_step: 5
prev: null
next: null
sources:
  - url: "https://modelcontextprotocol.io/docs/getting-started/intro"
    title: "What is the Model Context Protocol (MCP)?"
    accessed: 2026-10-31
  - url: "https://modelcontextprotocol.io/specification/2025-11-25/server/tools"
    title: "MCP Specification 2025-11-25 Tools"
    accessed: 2026-10-31
  - url: "https://modelcontextprotocol.io/specification/2025-11-25/basic/transports"
    title: "MCP Specification 2025-11-25 Transports"
    accessed: 2026-10-31
  - url: "https://github.com/modelcontextprotocol/typescript-sdk/tree/v1.x"
    title: "modelcontextprotocol/typescript-sdk (v1.x branch) README"
    accessed: 2026-10-31
  - url: "https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/docs/server.md"
    title: "typescript-sdk v1.x docs/server.md"
    accessed: 2026-10-31
  - url: "https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/src/client/stdio.ts"
    title: "typescript-sdk v1.x src/client/stdio.ts"
    accessed: 2026-10-31
  - url: "https://www.npmjs.com/package/@modelcontextprotocol/sdk"
    title: "@modelcontextprotocol/sdk (npm)"
    accessed: 2026-10-31
  - url: "https://modelcontextprotocol.io/docs/develop/build-server"
    title: "Build an MCP server"
    accessed: 2026-10-31
  - url: "https://code.claude.com/docs/en/mcp"
    title: "Connect Claude Code to tools via MCP"
    accessed: 2026-10-31
  - url: "https://code.claude.com/docs/en/setup"
    title: "Claude Code Advanced setup"
    accessed: 2026-10-31
  - url: "https://www.jsonrpc.org/specification"
    title: "JSON-RPC 2.0 Specification"
    accessed: 2026-10-31
  - url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter/Segmenter"
    title: "Intl.Segmenter() constructor (MDN)"
    accessed: 2026-10-31
  - url: "https://nodejs.org/api/esm.html"
    title: "Node.js Modules: ECMAScript modules"
    accessed: 2026-10-31
  - url: "https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/src/server/mcp.ts"
    title: "typescript-sdk v1.x src/server/mcp.ts"
    accessed: 2026-10-31
cost_estimate: "記事の手順は LLM の API を呼ばないので無料です。Claude にツールを呼ばせるには、Claude Code を使える有料のアカウントが要ります。"
run_environment: "Node.js 22.22.0、SDK 1.32.2、Claude Code 2.1.314"
verified_at: "2026-10-31"
ai_assisted: true
needs_api_key: false
status: draft
publish_at: null
updated: 2026-10-31
---

自分のアプリの関数を Claude Code に使わせるには、関数を MCP サーバーのツールにします。この記事では、文章の文字数を数えるツールを1つ持つサーバーを TypeScript で作ります。完成したサーバーを公式 SDK のクライアントから呼ぶと、結果は次の1行で返ります。

```text
ok: {"content":[{"type":"text","text":"文字数: 15 / 行数: 2 / UTF-8: 50 バイト"}]}
```

確かめた範囲は、SDK のクライアントで呼ぶところと、Claude Code に登録して接続するところまでです。Claude Code の会話で Claude にツールを呼ばせる操作は、この記事では実行していません。

対象は、JS か TypeScript で何か作ったことがあり、ターミナルで npm を使える人です。書き写すコードは5ファイルで、合わせて88行あります。待ち時間がいちばん長いコマンドは `npm install` で、2026-10-31 の実測では5秒でした。

## MCP サーバーは LLM が呼べるツールを公開するプログラム

MCP は Model Context Protocol の略です。AI アプリを外部のシステムにつなぐ、オープンな規格です（出典1）。つなぐ先の例として、データソース、ツール、ワークフローの3つが挙がっています（出典1）。

MCP サーバーは、LLM（大規模言語モデル）が呼べるツールを公開するプログラムです（出典2）。ツールは、名前と入力の形を持つ機能の単位を指します（出典2）。LLM は会話とユーザーの指示からツールを選び、自分で呼び出せます（出典2）。

この記事のサーバーが公開するツールは、`count_chars` の1つです。文章を受け取り、文字数、行数、UTF-8 のバイト数の3つを1行の文字列で返します。

stdio 方式では、クライアントがサーバーを子プロセスとして起動します（出典3）。この記事でのクライアントは、SDK で書く確認用のプログラムと Claude Code の2つです。やり取りは標準入出力を通る JSON-RPC です（出典3）。サーバー側で HTTP のポートを開ける必要はありません。

## 前提となる環境

必要なのは Node.js と Claude Code の2つです。SDK 1.32.2 の `package.json` は、Node.js 18 以上を指定しています（出典7）。この記事のコードは、Node.js 22.22.0 と npm 10.9.4 で動かしました。Claude Code は 2.1.314 を使っています。インストールの手順は Claude Code の公式ページにあります（出典10）。

| パッケージ | バージョン |
|---|---|
| `@modelcontextprotocol/sdk` | 1.32.2 |
| `zod` | 4.6.7 |
| `typescript`（開発用） | 7.0.2 |
| `@types/node`（開発用） | 22.20.5 |

### SDK は v1 系の 1.32.2 を使う

公式の TypeScript SDK には、v1 系と v2 系があります。v1.x ブランチの README によれば、v1 系はメンテナンスを続ける系列です（出典4）。v1 系が対応する MCP の仕様は、2025-11-25 のものまでです（出典4）。2026-07-28 の仕様には対応しない予定だと、同じ README にあります（出典4）。

2026-07-28 の仕様に対応した v2 系は、2026-07-27 に出ました（出典4）。v2 系は `@modelcontextprotocol/server` などの別のパッケージです（出典4）。v1 系の修正は、その日から少なくとも6か月続くと書かれています（出典4）。公式チュートリアル「Build an MCP server」も、TypeScript の例は v2 系です（出典8）。

v1 系を選んだのは、このブログの特典サンプルとバージョンをそろえるためです。特典サンプルの `samples/mcp-server` も 1.32.2 を使っています。2026-10-31 に `npm view` で確かめた latest も 1.32.2 でした（出典7）。2027-01-27 を過ぎて v1 系の修正が止まったら、この記事を v2 系で書き直します。

### 作り終えたときのファイル構成

できあがる作業フォルダは、次の形になります。

```text
char-count-mcp/
  package.json
  tsconfig.json
  compare.mjs
  src/
    server.ts
    check.ts
```

`dist/` と `node_modules/` は、ビルドと `npm install` が作るフォルダです。手で作る必要はありません。

## 1. 準備は設定ファイル2つと npm install

最初に、作業フォルダ `char-count-mcp` と、その中の `src/` を作ります。

```bash
mkdir -p char-count-mcp/src
cd char-count-mcp
```

作業フォルダに `package.json` を置きます。依存のバージョンに `^` を付けていないのは、記事と同じバージョンを入れるためです。

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

`"type": "module"` は、`.js` のファイルを ES モジュールとして読ませる指定です（出典13）。Node.js は、最上位の `await` を ES モジュールで使えるものとしています（出典13）。サーバーのコードは最上位で `await` を使うので、この指定を入れました。

同じフォルダに `tsconfig.json` を置きます。`src/` の `.ts` を、`dist/` に `.js` として書き出す設定です。

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

ファイルを置いたら、依存を入れます。

```bash
npm install
```

手元の出力では、脆弱性の警告は0件でした。

```text
added 99 packages, and audited 100 packages in 5s

36 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

## 2. サーバー本体は src/server.ts の28行

`src/server.ts` は28行で、中身はツールの登録と stdio への接続の2つです。ツールの名前、説明、入力の形を `registerTool` に渡します（出典5）。

```ts
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
```

`inputSchema` には zod のスキーマを書きます。SDK は、zod を必須の peer dependency にしています（出典4）。SDK はハンドラーを呼ぶ前に、入力をこのスキーマで確かめます（出典14）。合わない入力ではハンドラーを呼ばず、エラーの結果を返す作りです（出典14）。そのため、ハンドラーの中には入力を確かめるコードを書いていません。

ツールの説明には、改行の数え方を書きました。文字数は、改行も1文字と数えます。行数は改行（LF）で区切った数なので、末尾が改行の文章は最後の空の行も1行です。呼ぶ側が数字を読み違えないよう、この決まりを説明に入れています。

返り値の `content` には、`type: "text"` の要素を1つ入れました。v1.x ブランチの docs/server.md の例と同じ形です（出典5）。

最後の行のログは、わざと `console.error` で書いています。MCP の仕様は、有効なメッセージ以外をサーバーが stdout に書くことを禁じています（出典3）。stderr にはログを書いてよいと、同じ仕様にあります（出典3）。

### 文字数は Intl.Segmenter で数える

日本語の文章の文字数に `text.length` を使うと、絵文字で数がずれます。家族の絵文字1つを3通りの方法で数えて比べました。作業フォルダに `compare.mjs` という名前で、次のコードを保存します。

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

`length` は UTF-16 の単位で数えるので、8になります。コードポイント単位で数えても5です。`Intl.Segmenter` に `"grapheme"` を渡すと、見た目の1文字ごとに区切ります（出典12）。`count_chars` はこの数え方なので、家族の絵文字を1文字と返します。

## 3. SDK のクライアントから呼ぶと入力エラーも結果で返る

Claude Code につなぐ前に、SDK のクライアントでサーバーを起動し、ツールを直接呼びます。LLM を通さないので、API キーは要りません。`package.json` の `check` スクリプトが、次の `src/check.ts` を実行します。

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

`client.onerror` を付けたのは、サーバーから読めない行が届いたときに気づくためです。付けないと、読めない行は画面に何も出ないまま捨てられます。

ビルドしてから実行します。

```bash
npm run build
npm run check
```

`npm run check` の出力は次のとおりです。

```text
> char-count-mcp@0.1.0 check
> node dist/check.js

char-count MCP server started (stdio)
tools: [ 'count_chars' ]
ok: {"content":[{"type":"text","text":"文字数: 15 / 行数: 2 / UTF-8: 50 バイト"}]}
ng: {"content":[{"type":"text","text":"MCP error -32602: Input validation error: Invalid arguments for tool count_chars: Too small: expected string to have >=1 characters at text"}],"isError":true}
```

空行の直後の行は、サーバーが stderr に書いた起動ログです。`StdioClientTransport` の `stderr` の既定値は `"inherit"` です（出典6）。そのため、サーバーの stderr が親プロセスの画面にそのまま出ます。

`ok:` の行が正常な呼び出しの結果で、15文字と出ました。内訳は `MCPサーバーを作る` の10文字、家族の絵文字1文字、改行1文字、`2行目` の3文字です。

`ng:` の行は、空文字を渡して zod の `min(1)` に引っかかった結果です。1.32.2 は例外を投げず、`isError: true` の付いた結果を返しました。MCP の仕様も、入力の検証エラーは `isError: true` の結果で返すと定めています（出典2）。`-32602` は、JSON-RPC 2.0 で「Invalid params」を表すコードです（出典11）。

結果で返るのは、サーバーが動いているときの入力のエラーに限られます。サーバーのプロセスを止めてから、`callTool` を呼んでみました。すると 1.32.2 は、`Not connected` の例外を投げました。接続の失敗は、呼ぶ側で try と catch を書いて受け取ります。

## 4. Claude Code への登録は claude mcp add の1行

ビルドした `dist/server.js` を、Claude Code に登録します。登録には `claude mcp add` を使います。パスは、自分の作業フォルダの絶対パスに置き換えてください。

```bash
claude mcp add char-count --scope user --transport stdio -- node /path/to/char-count-mcp/dist/server.js
```

`--` より前は Claude Code 自身のオプションで、後ろはサーバーを起動するコマンドです（出典9）。`--scope` を省くと local スコープになり、登録したプロジェクトでだけ使えます（出典9）。全プロジェクトで使うため、`--scope user` を付けました。

Claude Code 2.1.314 で、登録から削除までを実行した出力を載せます。設定は使い捨てのフォルダに書き、ログインはしていません。出力の中のパスは置き換えました。

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

`claude mcp list` は、登録したサーバーごとに接続の状態を表示します（出典9）。`✘ Failed to connect` のような失敗の表示は、接続できなかったことを表します（出典9）。手元では `√ Connected` と出たので、Claude Code はこのサーバーを起動して接続できています。登録したあとの Claude Code のセッションでは、`/mcp` で同じ状態を確かめられます（出典9）。

## stdout にログを書くと SDK のクライアントは行を捨てる

公式チュートリアルは、stdio のサーバーで `console.log()` を使わないよう警告しています（出典8）。stdout への出力が、JSON-RPC のメッセージを壊すからです（出典8）。1.32.2 の SDK のクライアントで何が起きるかを確かめました。書き換えるのは `src/server.ts` の最後の行です。`console.error` を `console.log` にして、ビルドし直してから実行しました。

```bash
npm run build
npm run check
```

`npm run check` の出力です。

```text
> char-count-mcp@0.1.0 check
> node dist/check.js

client error: Unexpected token 'c', "char-count"... is not valid JSON
tools: [ 'count_chars' ]
ok: {"content":[{"type":"text","text":"文字数: 15 / 行数: 2 / UTF-8: 50 バイト"}]}
ng: {"content":[{"type":"text","text":"MCP error -32602: Input validation error: Invalid arguments for tool count_chars: Too small: expected string to have >=1 characters at text"}],"isError":true}
```

起動ログの行は JSON として読めず、`client error:` として報告されました。1.32.2 の SDK のクライアントはその行を捨てて先を読むので、ツールの呼び出しは成功しています。ほかのクライアントが同じように動くとは限りません。仕様に反した出力をどう扱うかは、クライアントの実装しだいです。

Claude Code の表示も確かめました。`console.log` のままの `dist/server.js` を登録しました。それでも、`claude mcp list` の表示は `√ Connected` です。stdout の出力が混ざっていても、この表示では気づけません。見分けるなら、`onerror` を付けた確認用のクライアントで呼ぶのが早道です。

元に戻すときは、`console.error` に戻したあとで、もう一度ビルドします。Claude Code に登録したのは `dist/server.js` です。ビルドし直すまでは、`console.log` のままのファイルが起動されます。

```bash
npm run build
npm run check
```

戻してビルドし直すと、`npm run check` の出力は手順3と同じになりました。

## 料金がかからない範囲

手順1から4までと stdout の確認は、LLM の API を一度も呼ばないので、API の料金はかかりません。`claude mcp` の4つのコマンドも、ログインしない状態で動きました。4つは `add`、`list`、`get`、`remove` です。

料金が要るのは、Claude Code の会話で Claude にツールを呼ばせる操作です。Claude Code を使うには、有料のプランか Console のアカウントが要ります（出典10）。有料のプランは、Pro、Max、Ultra、Team、Enterprise の5つです（出典10）。無料の claude.ai のプランには、Claude Code が含まれていません（出典10）。この記事はその操作をしていないので、金額も載せていません。

## まとめ

手元には、`count_chars` を公開するサーバーと、それを呼ぶ確認用のクライアントがそろいました。Claude Code への登録と、接続の確認も済んでいます。自分のアプリにある関数も、`registerTool` で包めば同じ手順でツールにできます。あなたのアプリのどの関数を、最初に Claude から呼べるようにしますか。

## 出典

確認日は、どれも 2026-10-31 です。本文の（出典1）などの番号は、この表の番号を指します。

| # | 題名 | URL | 確認日 |
|---|---|---|---|
| 1 | What is the Model Context Protocol (MCP)? | https://modelcontextprotocol.io/docs/getting-started/intro | 2026-10-31 |
| 2 | MCP Specification 2025-11-25 Tools | https://modelcontextprotocol.io/specification/2025-11-25/server/tools | 2026-10-31 |
| 3 | MCP Specification 2025-11-25 Transports | https://modelcontextprotocol.io/specification/2025-11-25/basic/transports | 2026-10-31 |
| 4 | typescript-sdk v1.x README | https://github.com/modelcontextprotocol/typescript-sdk/tree/v1.x | 2026-10-31 |
| 5 | typescript-sdk v1.x docs/server.md | https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/docs/server.md | 2026-10-31 |
| 6 | typescript-sdk v1.x src/client/stdio.ts | https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/src/client/stdio.ts | 2026-10-31 |
| 7 | @modelcontextprotocol/sdk（npm） | https://www.npmjs.com/package/@modelcontextprotocol/sdk | 2026-10-31 |
| 8 | Build an MCP server | https://modelcontextprotocol.io/docs/develop/build-server | 2026-10-31 |
| 9 | Connect Claude Code to tools via MCP | https://code.claude.com/docs/en/mcp | 2026-10-31 |
| 10 | Claude Code Advanced setup | https://code.claude.com/docs/en/setup | 2026-10-31 |
| 11 | JSON-RPC 2.0 Specification | https://www.jsonrpc.org/specification | 2026-10-31 |
| 12 | Intl.Segmenter() constructor（MDN） | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter/Segmenter | 2026-10-31 |
| 13 | Node.js Modules: ECMAScript modules | https://nodejs.org/api/esm.html | 2026-10-31 |
| 14 | typescript-sdk v1.x src/server/mcp.ts | https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/src/server/mcp.ts | 2026-10-31 |

AI 支援で執筆しました。コードは 2026-10-31 に実際に実行して確認しています。
