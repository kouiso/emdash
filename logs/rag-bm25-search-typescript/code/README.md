# code: rag-bm25-search-typescript

記事 `content/articles/rag-bm25-search-typescript.md` に載せたコードと1文字も違わないファイル。2026-10-31 に、記事のコードブロックとの一致を `../lint/check-code-and-outputs.py` で確かめた（結果は `../lint/check-code-and-outputs.txt`、ALL OK）。

| ファイル | 記事での位置 |
|---|---|
| `package.json` | 「使うバージョンと準備」 |
| `tokenize.ts`、`show-tokens.ts` | 「日本語の文を Intl.Segmenter で語に分ける」 |
| `bm25.ts` | 「BM25 のスコアを計算する関数」 |
| `docs.ts`、`search.ts` | 「FAQ 8件に質問を投げる」 |
| `context.ts` | 「検索結果を LLM に渡すプロンプトにする」 |
| `extra/run.sh` | 記事には載せない。記事のコマンドを実行して `../run/NN.log` を書くロガー（`logs/zod-to-json-schema-tool-definition/code/extra/run.sh` に ICU の版の行を足したもの） |
| `extra/explain.ts` | 記事には載せない確認用。検索結果ごとに、質問のどの語が一致したか、`tf`、`df`、文書の語の数を出す（`run/15.log`）。本文の「一致したのは『は』だけ」「8件の語の数の合計は219」の根拠 |
| `extra/tsconfig.typecheck.json` | 記事には載せない確認用。Node.js の型ストリップは型を調べないので、`tsc` 7.0.2 と `@types/node` 22.20.5 を `--no-save` で入れて型を調べた（`run/16.log`） |
| `extra/offline-all.sh` | 記事には載せない確認用。ネットワークの無い名前空間（`unshare -rn`）で記事の `node` コマンドを全部実行し直した（`run/17.log`） |

依存パッケージは無い（`package.json` に `dependencies` が無い）。`node_modules` はこのフォルダに置いていない。`docs.ts` の FAQ は架空のネットショップの文で、手で書いたもの。

## 実行ログ（`../run/`）

実行はすべて scratchpad の使い捨てフォルダで行い、終わったあと消した。作業フォルダの1つ上に、このフォルダへのシンボリックリンク `code` を置き、ファイルは `cp ../code/<file> .` で置いた（記事では読者がファイルを書いて保存する手順）。記事の手順と同じ順に実行した。

| ログ | コマンド |
|---|---|
| 01.log | `mkdir bm25-search`。記事の `cd bm25-search` は、ロガーの外のシェルで実行した |
| 02.log | `package.json` を置く |
| 03.log | `tokenize.ts`、`show-tokens.ts` を置く |
| 04.log、05.log | `node show-tokens.ts "支払いにＰａｙＰａｙが使えます。"`、`node show-tokens.ts "使える支払い方法"` |
| 06.log | `bm25.ts`、`docs.ts`、`search.ts` を置く |
| 07.log〜11.log | `node search.ts` に「返品できる期間は？」「使える支払い方法」「返金はいつ？」「返品」「返品」と `0` |
| 12.log | `context.ts` を置く |
| 13.log、14.log | `node context.ts` に「返品できる期間は？」「返金はいつ？」 |
| 15.log | `node extra/explain.ts …`（一致した語の確認） |
| 16.log | `npx tsc -p tsconfig.typecheck.json`（型チェック、`tsc_exit=0`） |
| 17.log | `unshare -rn ./offline-all.sh`（ネットワークの無い環境で記事の `node` コマンド9つ） |

ログのコマンド行は、シェルが引用符を外したあとの引数で記録される（例 `node search.ts 返品 0`）。記事のコマンドと引数が同じことは `check-code-and-outputs.py` で確かめた。
