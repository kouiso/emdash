# code: mcp-server-typescript-stdio

記事 `content/articles/mcp-server-typescript-stdio.md` に載せたコードと1文字も違わないファイル。2026-10-31 に、記事のコードブロックとの一致を Python で確かめた（`gate.md` の G04）。

| ファイル | 記事での位置 |
|---|---|
| `package.json` | 「1. 準備は設定ファイル2つと npm install」 |
| `tsconfig.json` | 同上 |
| `src/server.ts` | 「2. サーバー本体は src/server.ts の28行」 |
| `src/check.ts` | 「3. SDK のクライアントから呼ぶと入力エラーも結果で返る」 |
| `compare.mjs` | 「文字数は Intl.Segmenter で数える」 |
| `console-log-experiment.diff` | 「stdout にログを書くと SDK のクライアントは行を捨てる」で試した1行の差分（記事には差分そのものは載せず、文章で説明） |
| `extra/server-down.mjs` | 記事には載せない確認用。サーバーのプロセスを止めてから `callTool` を呼ぶと例外になることを確かめた（`run/16.log`） |

依存は `^` なしの完全固定。`node_modules` と `dist` はこのフォルダに置いていない。

## 実行ログ（`../run/`）

`src/server.ts` のツールの説明（`description`）に改行の数え方を足したので、記事の出力はすべて 12〜21 から写している。01〜11 は説明を足す前のコードで取ったログで、経緯として残す。

| ログ | コマンド |
|---|---|
| 12.log | 記事の手順1の `mkdir -p char-count-mcp/src` と、ファイルを置いたあとの一覧（書き写す代わりにこのフォルダから cp） |
| 13.log | `npm install`（インストールから記事どおりに始めた回） |
| 14.log | `npm run build`、`npm run check` |
| 15.log | `node compare.mjs` |
| 16.log | `extra/server-down.mjs`（サーバー停止後の `callTool` が `Not connected` の例外になる） |
| 17.log | server.ts の最後の行を `console.log` にして（差分もログにある）`npm run build`、`npm run check` |
| 18.log | `console.log` 版のまま、使い捨ての HOME で `claude mcp add`、`claude mcp list`（`√ Connected` のまま）、`claude mcp remove` |
| 19.log | `console.error` に戻して `npm run build`、`npm run check`（出力が 14 と同じ） |
| 20.log | 使い捨ての HOME と CLAUDE_CONFIG_DIR で `claude mcp add/list/get/remove`（ログインなし） |
| 21.log | check.ts から `client.onerror` を除き、server.ts を `console.log` にして build と check（エラー表示が出ない） |
| 01〜11.log | 説明を足す前のコードでの実行（2026-10-31 04:47〜05:14）。中身は 01 install、02 build、03 check、04 compare、05・06 console.log と戻し、07 claude mcp、08 onerror なし、09〜11 再確認（09 はインストール済みの状態から build・check・compare） |

ログのパスは `/path/to` に置き換えてある。
