# selection: rag-chunking-japanese-text

選んだ日: 2026-10-31

## 読んだ CSV

- `keywords/` にあるのは `README.md` だけで、ラッコキーワードの CSV は1つも届いていない（2026-10-31 に `ls keywords` で確認）。
- write-article スキルの手順1-1 は「CSV が1つも無ければ、その時点で止めて『CSV 待ち』と報告する」と定めている。今回は、`content/plan.md` の30本計画を進めるワークフローの指示（CSV が届いていないこと、`target_query` を null に保つこと、G10 を NG にすること、記事を下書きに止めることを明示した指示）で、CSV なしで書き進めた。
- `target_query` は null。CSV に無いキーワードは作っていない。検索ボリュームによる絞り込み（手順1-2-4）は実施できていない。
- ゲート G10 は NG。CSV が届くまで `status: draft` のまま止める。

## 絞り込み

| 順 | 条件 | 結果 |
|---|---|---|
| 1 | 既存記事との重なり | `content/articles/` の frontmatter（`title`、`main_keyword`、`target_query`）を全件読んだ（2026-10-31 時点で、この記事のほかに7本: `llm-api-429-retry-sdk-mock`、`llm-api-cost-estimate-js-tiktoken`、`llm-json-parse-error-fix`、`mcp-server-typescript-stdio`、`rag-bm25-search-typescript`、`zod-to-json-schema-tool-definition`、`zod-validate-llm-json-output`）。main_keyword「RAG」の記事は `rag-bm25-search-typescript` の1本で、BM25 の検索器を作る記事。7本とも本文に「チャンク」の語が0件（`grep -c チャンク`）で、日本語の文書をチャンクに分ける方法（やり方）に答える記事は無い。表記ゆれの範囲でも重ならない。7本の `target_query` はすべて null |
| 2 | `ANTHROPIC_API_KEY` | `unset`（2026-10-31 に `test -n "$ANTHROPIC_API_KEY" && echo set \|\| echo unset` で確認）。この記事のコードは Node.js の組み込み機能（`Intl.Segmenter`、`node:fs`）だけで動き、依存パッケージも API も使わない（`run/14.log` でネットワークの無い名前空間でも記事の `node` コマンド5つが exit=0）。`needs_api_key: false` |
| 3 | 講座の順番 | course_step 3（RAG）。`content/plan.md` の計画表 #12 で、キー不要 ○ の記事。course_step 3 の中では #11（`rag-bm25-search-typescript`、原稿あり）の次 |
| 4 | 検索ボリューム | CSV が無いので未実施 |

外した候補と理由:

- テーマ（slug、タイトル、検索意図「やり方」、キー不要）はワークフローの指示で決まっている。
- course_step 1 と 2 の残り（#1、#2、#5、#6、#10）と course_step 3 の #14（`rag-answer-with-citations-claude`）は、API を呼んで応答を見せる記事で有効なキーが要る。`ANTHROPIC_API_KEY` が unset なので外れる。
- 計画上の重なりの決め事（`plan.md`「重なりを避けるために決めたこと」と計画表の内部リンク先 11、13）: この記事（#12）は文書をチャンクに分ける処理だけを扱う。BM25 の検索（#11）は作り直さず、前の記事へのリンクにとどめる。埋め込みでのベクトル化と検索（#13 `rag-local-embeddings-transformers-js`）には踏み込まず、次の記事へのリンクにする。
- CSV が届いたら `target_query` を CSV の行から選び直し、合う行が無ければ差し替える（`plan.md` の前提）。
