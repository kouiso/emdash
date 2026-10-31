# code: zod-validate-llm-json-output

記事 `content/articles/zod-validate-llm-json-output.md` に載せたコードと1文字も違わないファイル。2026-10-31 に、記事のコードブロックとの一致を `../lint/check-code-and-outputs.py` で確かめた（結果は `../lint/check-code-and-outputs.txt`、ALL OK）。

| ファイル | 記事での位置 |
|---|---|
| `package.json` | 「使うバージョンと準備」 |
| `schema.ts`、`samples.ts`、`check.ts` | 「スキーマと見本の JSON」 |
| `retry-message.ts` | 「prettifyError でモデルへの再依頼の文を作る」 |
| `pretty-ja.ts` | 「メッセージを日本語にする」 |
| `strip.ts` | 「z.object は余分なキーを黙って消す」 |
| `extra/tsconfig.typecheck.json` | 記事には載せない確認用。Node.js の型ストリップは型を調べないので、`tsc` 7.0.2 と `@types/node` 22.20.5 を `--no-save` で入れて型を調べた（`run/13.log`） |
| `extra/offline-all.sh` | 記事には載せない確認用。ネットワークの無い名前空間（`unshare -rn`）で記事の `node` コマンドを全部実行し直した（`run/14.log`） |

依存は `^` なしの完全固定（`zod` 4.6.7）。`node_modules` はこのフォルダに置いていない。`samples.ts` の JSON は、モデルの出力の形をまねて手で作った見本で、実際のモデルの出力ではない。

## 実行ログ（`../run/`）

実行はすべて scratchpad の使い捨てフォルダで行い、終わったあと消した。ログのコマンドに出る `(code)` は、このフォルダ（書き写す代わりに cp した元）を指す。記事の手順と同じ順に実行した。

| ログ | コマンド |
|---|---|
| 01.log | `mkdir zod-llm-check`。記事の `cd zod-llm-check` は、ロガーの外のシェルで実行した |
| 02.log | `package.json` を置く |
| 03.log | `npm install` |
| 04.log | `schema.ts`、`samples.ts`、`check.ts` を置く |
| 05.log〜09.log | `node check.ts ok`、`wrong-type`、`bad-enum`、`extra-key`、`many` |
| 10.log | `retry-message.ts` を置いて `node retry-message.ts` |
| 11.log | `pretty-ja.ts` を置いて `node pretty-ja.ts` |
| 12.log | `strip.ts` を置いて `node strip.ts` |
| 13.log | `npx tsc -p tsconfig.typecheck.json`（型チェック、`tsc_exit=0`） |
| 14.log | `unshare -rn ./offline-all.sh`（ネットワークの無い環境で全 `node` コマンド） |

最初の試行では、型チェックを `@types/node` なしで実行して `process` が見つからず失敗した（確認用の設定の不足で、記事のコードは変えていない）。その後、記事の順に全手順を新しいフォルダでやり直し、上の 01〜14 で上書きした。
