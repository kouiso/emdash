# code: rag-chunking-japanese-text

記事 `content/articles/rag-chunking-japanese-text.md` に載せたコードと1文字も違わないファイル。2026-10-31 に、記事のコードブロックから機械的に書き出し、最後の原稿との一致を `../lint/check-code-and-outputs.py` で確かめた（結果は `../lint/check-code-and-outputs.txt`、ALL OK）。

| ファイル | 記事での位置 |
|---|---|
| `package.json` | 「使うバージョンと準備」 |
| `doc.md` | 「使うバージョンと準備」（分ける対象の架空のご利用ガイド。手で書いた文） |
| `naive.ts` | 「使うバージョンと準備」（100字ずつ切る比較用） |
| `sentences.ts`、`show-sentences.ts` | 「文の境目は句点と括弧の深さで決める」 |
| `sections.ts` | 「見出しで分けたセクションに見出しの並びを残す」 |
| `chunk.ts`、`main.ts` | 「上限まで文を詰め、末尾の文を次に重ねる」 |
| `stats.ts` | 「上限と重なりは個数と合計の文字数で決める」 |
| `extra/run.sh` | 記事には載せない。記事のコマンドを実行して `../run/NN.log` を書くロガー（`logs/rag-bm25-search-typescript/code/extra/run.sh` と同じ形） |
| `extra/verify.ts` | 記事には載せない確認用。本文の数字（節ごとの文字数、重なりの文、47字、26字と14字、71字）と挙動（例外で止まる、コードブロックの `#` を見出しにしない、表は1行が1つの文）を記事のコードで確かめる（`run/12.log`） |
| `extra/tsconfig.typecheck.json` | 記事には載せない確認用。Node.js の型ストリップは型を調べないので、`typescript` 7.0.2 と `@types/node` 22.20.5 を `--no-save` で入れて型を調べた（`run/13.log`）。`logs/rag-bm25-search-typescript/code/extra/` から写した |
| `extra/offline-all.sh` | 記事には載せない確認用。ネットワークの無い名前空間（`unshare -rn`）で記事の `node` コマンド5つを実行し直した（`run/14.log`） |

依存パッケージは無い（`package.json` に `dependencies` が無い）。`node_modules` はこのフォルダに置いていない（型チェックの依存は scratchpad の使い捨てフォルダにだけ入れ、消した）。

## 実行ログ（`../run/`）

実行はすべて scratchpad の使い捨てフォルダで行い、終わったあと消した。作業フォルダの1つ上に、このフォルダへのシンボリックリンク `code` を置き、ファイルは `cp ../code/<file> .` で置いた（記事では読者がファイルを書いて保存する手順）。記事の手順と同じ順に実行した。

| ログ | コマンド |
|---|---|
| 01.log | `mkdir jp-chunker`。記事の `cd jp-chunker` は、ロガーの外のシェルで実行した（ロガーは作業フォルダを引数で受け取る） |
| 02.log | `package.json`、`doc.md` を置く |
| 03.log | `naive.ts` を置く |
| 04.log | `node naive.ts` |
| 05.log | `sentences.ts`、`show-sentences.ts` を置く |
| 06.log | `node show-sentences.ts` |
| 07.log | `sections.ts`、`chunk.ts`、`main.ts` を置く |
| 08.log | `node main.ts doc.md 120 40` |
| 09.log | `node main.ts doc.md 40 0 \| head -n 6`（パイプを含むので `bash -c` で実行。ログのコマンド行は `bash -c` のあとに記事と同じ文字列） |
| 10.log | `stats.ts` を置く |
| 11.log | `node stats.ts` |
| 12.log | `node verify.ts`（確認用。`extra/verify.ts` と `extra/offline-all.sh` を作業フォルダに写して実行） |
| 13.log | 型チェック（`npm install --no-save typescript@7.0.2 @types/node@22.20.5`、`npx tsc -p tsconfig.typecheck.json`、`tsc_exit=0`） |
| 14.log | `unshare -rn ./offline-all.sh`（ネットワークの無い環境で記事の `node` コマンド5つ。外への fetch は `EAI_AGAIN`） |

原稿は、この実行の前に途中まで書かれた下書きがあった（同じワークフローの以前の試行のもの。`logs/` は無かった）。その下書きは確認済みとして扱わず、コードを記事から書き出し直して上の手順で実行し、出力を照らし合わせた。照らし合わせで見つけて直したのは3点: 上限40字の出力（下書きの #1 の本文が実際の出力と違っていた。`run/09.log` の出力に差し替えた）、#3 の最後の文の文字数（下書きは42字、実際は47字。`run/12.log`）、9チャンクの終わり方（下書きは「句点か閉じ括弧」、実際はすべて句点）。`chunk.ts` には、見出しの並びが上限以上のときに `splitLong` が終わらなくなるのを防ぐ例外の1行を足した。最後に `chunk.ts` の例外のメッセージを直したので、`run/01`〜`14.log` は新しい作業フォルダで全部取り直したもの（2026-10-31 13:51 UTC）。
