# メモ検索 MCP サーバー (TypeScript / stdio)

ローカルフォルダの Markdown メモを **検索** して、**追加** できる、最小構成の MCP サーバーです。

## MCP とは (3 行で)

- MCP (Model Context Protocol) は、Claude などの AI アプリが外部のツールやデータにつながるための共通プロトコルです。
- サーバーは「ツール (AI が呼べる関数)」と「リソース (AI が読めるデータ)」を公開し、クライアント (Claude Code など) がそれを使います。
- このサンプルは stdio 方式なので、クライアントがサーバーを子プロセスとして起動し、標準入出力で JSON-RPC をやり取りします。

## このサーバーが公開するもの

| 種類 | 名前 | 内容 |
|------|------|------|
| ツール | `search_notes` | `query` (必須, 1〜200 文字) と `limit` (省略時 20, 1〜100) を受け取り、メモの中から一致する行を `ファイル名:行番号: 本文` で返す。大文字小文字は区別しない |
| ツール | `add_note` | `title` (1〜100 文字) と `body` (〜10,000 文字) を受け取り、`<タイトルから作ったファイル名>.md` として保存する。同名があれば `-2` などの連番にして、上書きしない |
| リソース | `notes://index` | メモ一覧を JSON で返す (ファイル名・タイトル・バイト数・更新日時) |

入力は zod スキーマで検証され、範囲外の値はツール呼び出しがエラー (`isError: true`) になります。

メモの置き場所は環境変数 `NOTES_DIR` で指定します (省略時は起動したカレントディレクトリの `notes/`)。フォルダは先に作っておかなくてもかまいません。無いあいだは `search_notes` と `notes://index` がメモ 0 件として答え、最初の `add_note` でフォルダが作られます。起動時には stderr に「NOTES_DIR はまだありません」と出るので、パスを打ち間違えたときはそこで気づけます。

## 使っているバージョン (exact 固定)

| パッケージ | バージョン |
|-----------|-----------|
| `@modelcontextprotocol/sdk` | 1.32.2 |
| `zod` | 4.6.7 |
| `typescript` (dev) | 7.0.2 |
| `tsx` (dev, テスト実行用) | 4.23.15 |
| `@types/node` (dev) | 22.20.5 |

動作確認は Node.js 22.22.0 / npm 10.9.4 で行いました。`package-lock.json` を同梱しています。

## セットアップ

リポジトリから取った場合は `samples/mcp-server`、zip で受け取った場合は展開してできた `mcp-server` フォルダに移動してから実行します。

```bash
cd samples/mcp-server   # zip の場合は cd mcp-server
npm ci            # package-lock.json どおりに入れる
npm run build     # dist/index.js を生成
npm run typecheck # tsc で型チェック (src / test / scripts)
npm test          # 単体テスト + インメモリ接続でのプロトコルテスト
npm run e2e       # SDK のクライアントで dist/index.js を stdio 起動して一通り呼ぶ
```

`npm run e2e` は `sample-notes/` を一時フォルダへコピーしてから使うので、リポジトリ内のファイルは書き換わりません。

## Claude Code に登録する

ビルド後、次のコマンドで登録します。`NOTES_DIR` とパスは自分の環境の **絶対パス** に置き換えてください。

```bash
claude mcp add notes --transport stdio --env NOTES_DIR=/absolute/path/to/my-notes \
  -- node /absolute/path/to/samples/mcp-server/dist/index.js
```

ポイント (公式ドキュメントの記述どおり):

- `--` より前が Claude Code 自身のオプション (`--transport` / `--env` / `--scope`)、`--` より後ろがサーバーを起動するコマンドです。
- `--env` は複数の `KEY=value` を受け取るので、サーバー名を `--env` の直後に置くと値と誤読されます。上のように名前を先に書くか、`--env` と名前の間に `--transport stdio` などを挟みます。
- スコープを付けないと local スコープ (このプロジェクトだけ・自分だけ) に保存されます。全プロジェクトで使うなら `--scope user` を付けます。

登録できたかの確認と削除:

```bash
claude mcp list          # 一覧と接続状態
claude mcp get notes     # 詳細
claude mcp remove notes  # 削除 (user スコープなら -s user を付ける)
```

Claude Code のセッション中は `/mcp` で状態を見られます。

出典: Claude Code 公式ドキュメント「Connect Claude Code to tools via MCP」 <https://code.claude.com/docs/en/mcp> (2026-10-31 参照)。手元の Claude Code 2.1.314 の `claude mcp add --help` でも同じ書式 (`claude mcp add [options] <name> <commandOrUrl> [args...]`、`-e, --env`、`-s, --scope`) を確認しています。

### 登録時に期待される出力

一時的な設定ディレクトリで `--scope user` を付けて実際に登録したときの出力です (パスは置き換えています)。

```text
$ claude mcp add notes --scope user --transport stdio --env NOTES_DIR=/path/to/notes -- node /path/to/dist/index.js
Added stdio MCP server notes with command: node /path/to/dist/index.js to user config

$ claude mcp list
notes: node /path/to/dist/index.js - √ Connected

$ claude mcp get notes
notes:
  Scope: User config (available in all your projects)
  Status: √ Connected
  Type: stdio
  Command: node
  Args: /path/to/dist/index.js
  Environment:
    NOTES_DIR=/path/to/notes
```

登録後は Claude Code に「メモから stdio を検索して」「『会議メモ』というタイトルでメモを追加して」のように頼むと、`search_notes` / `add_note` が呼ばれます (ツール実行時には Claude Code の許可確認が出ます)。

## `npm run e2e` で期待される出力 (抜粋)

```text
=== initialize ===
{ "serverInfo": { "name": "notes", "version": "0.1.0" },
  "capabilities": { "resources": { "listChanged": true }, "tools": { "listChanged": true } } }

=== tools/list ===
search_notes (query: string 1-200, limit: integer 1-100 default 20) / add_note (title, body)

=== tools/call search_notes {query:'stdio'} ===
mcp-memo.md:4: stdio で動くサーバーは、クライアントが子プロセスとして起動する。

=== tools/call add_note ===
保存しました: e2e-テスト.md

=== tools/call search_notes (追加後) ===
e2e-テスト.md:3: stdio 経由で追加した。
mcp-memo.md:4: stdio で動くサーバーは、クライアントが子プロセスとして起動する。

=== resources/read notes://index ===
[ { "file": "e2e-テスト.md", "title": "E2E テスト", ... },
  { "file": "mcp-memo.md", "title": "MCP メモ", ... },
  { "file": "shopping.md", "title": "買い物リスト", ... } ]

E2E OK
```

実際の出力は JSON をそのまま表示するので、上より長くなります。

## ファイル構成

```text
src/notes.ts       メモの検索・追加・一覧 (MCP に依存しない純粋なファイル操作)
src/server.ts      McpServer にツール 2 つとリソース 1 つを登録
src/index.ts       エントリポイント。StdioServerTransport で待ち受ける
test/              node:test によるテスト (tsx で TypeScript のまま実行)
scripts/e2e.ts     SDK の Client + StdioClientTransport による通し確認
sample-notes/      e2e 用のサンプルメモ
```

## 制限事項

- **SDK は v1.x 系です。** `@modelcontextprotocol/sdk` の README によると v1.x はメンテナンス系列で、MCP 仕様 2025-11-25 までに対応します。2026-07-28 版の仕様は、別パッケージ (`@modelcontextprotocol/server` / `@modelcontextprotocol/client`) の v2 が担当します。v1.x は v2 リリース (2026-07-27) から少なくとも 6 か月はバグ修正とセキュリティ修正が続く、とされています。
- 対象は `NOTES_DIR` **直下の `.md` ファイルだけ** です。サブフォルダは見ません。256 KiB を超えるファイルは検索対象から外します。
- 検索は単純な部分一致です。全文インデックスやあいまい検索、正規表現はありません。メモの数が多いと毎回全ファイルを読むぶん遅くなります。
- メモの編集・削除ツールはありません (誤操作でメモを消さないよう、あえて追加だけにしています)。
- ファイル名はタイトルから作ります。英数字と日本語などの文字以外はハイフンに置き換えるので、`../` のようなパスを書いても `NOTES_DIR` の外には保存されません。
- `NOTES_DIR` を省略すると「起動したときのカレントディレクトリ」の `notes/` になります。クライアントによって起動ディレクトリが変わるので、登録時は絶対パスで指定してください。
- stdio 専用です。リモート (HTTP) で公開する作りにはしていません。認証もありません。
- サーバーの stdout は JSON-RPC 専用です。ログを足すときは `console.error` (stderr) に書いてください。`console.log` を使うとプロトコルが壊れます。
