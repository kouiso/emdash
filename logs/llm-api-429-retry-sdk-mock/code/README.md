# code: llm-api-429-retry-sdk-mock

記事 `content/articles/llm-api-429-retry-sdk-mock.md` に載せたコードと1文字も違わないファイル。2026-10-31 に、記事のコードブロックとの一致を `../lint/check-code-and-outputs.py` で確かめた（結果は `../lint/check-code-and-outputs.txt`、ALL OK）。

| ファイル | 記事での位置 |
|---|---|
| `package.json` | 「使うバージョンと準備」 |
| `server.ts` | 同上（モックサーバー） |
| `client.ts` | 「結論は自前のリトライを外して maxRetries に任せること」の変更後のコード |
| `my-loop.ts` | 同じ節の変更前のコード |
| `extra/err-name.ts` | 記事には載せない確認用。`err.name` が `Error` になることを確かめた（`run/10.log`） |
| `extra/netns-all.sh`、`extra/lo-up.py` | 記事には載せない確認用。ループバックだけのネットワーク名前空間（`unshare -rn`）で全シナリオを動かし、外への通信が `ENETUNREACH` になることを確かめた（`run/11.log`） |
| `extra/tsconfig.typecheck.json` | 記事には載せない確認用。Node.js の型ストリップは型を調べないので、別フォルダで `tsc` 7.0.2 にかけた（`run/12.log`） |

依存は `^` なしの完全固定（`@anthropic-ai/sdk` 1.3.0）。`node_modules` はこのフォルダに置いていない。

## 実行ログ（`../run/`）

実行はすべて scratchpad の使い捨てフォルダで行い、終わったあと消した。ログのパスはリポジトリのルートからの相対パスに置き換えてある。

| ログ | コマンド |
|---|---|
| 01.log | `mkdir retry-mock` と、このフォルダの4ファイルを置く（書き写す代わりに cp）。記事の `cd retry-mock` は、ロガーの外のシェルで実行した |
| 02.log | `npm install` |
| 03.log | ターミナル1の `node server.ts`。04〜09 の間ずっと動かし、最後に SIGINT（Ctrl+C と同じシグナル）で止めた。exit=130 はそのため |
| 04.log〜08.log | ターミナル2の `node client.ts rate-limit`、`overloaded`、`bad-request`、`spend-cap`、`long-wait` |
| 09.log | `node my-loop.ts`（変更前のコード） |
| 10.log | `extra/err-name.ts`（`err.name` の確認） |
| 11.log | `extra/netns-all.sh`（外へ出られない環境で全シナリオ） |
| 12.log | `npx tsc -p .`（型チェック、exit=0） |
