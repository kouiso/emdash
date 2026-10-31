# selection: rag-bm25-search-typescript

選んだ日: 2026-10-31

## 読んだ CSV

- `keywords/` にあるのは `README.md` だけで、ラッコキーワードの CSV は1つも届いていない（2026-10-31 に `ls keywords` で確認）。
- write-article スキルの手順1-1 は「CSV が1つも無ければ、その時点で止めて『CSV 待ち』と報告する」と定めている。今回は、`content/plan.md` の30本計画を進めるワークフローの指示（CSV が届いていないこと、`target_query` を null に保つこと、G10 を NG にすることを明示した指示）で、CSV なしで書き進めた。
- `target_query` は null。CSV に無いキーワードは作っていない。検索ボリュームによる絞り込み（手順1-2-4）も実施できていない。
- ゲート G10 は NG。CSV が届くまで `status: draft` のまま止める。

## 絞り込み

| 順 | 条件 | 結果 |
|---|---|---|
| 1 | 既存記事との重なり | `content/articles/` の frontmatter（`title`、`main_keyword`、`target_query`）を全件読んだ（2026-10-31 時点で6本: `llm-api-429-retry-sdk-mock`、`llm-api-cost-estimate-js-tiktoken`、`llm-json-parse-error-fix`、`mcp-server-typescript-stdio`、`zod-to-json-schema-tool-definition`、`zod-validate-llm-json-output`）。main_keyword は「LLM API」2本、「構造化出力」3本、「MCPサーバー」1本で、「RAG」の記事は無い。RAG の検索部分を BM25 で作る方法（やり方）に答える記事は無く、表記ゆれの範囲でも重ならない。6本の `target_query` はすべて null |
| 2 | `ANTHROPIC_API_KEY` | `unset`（2026-10-31 に `test -n "$ANTHROPIC_API_KEY" && echo set \|\| echo unset` で確認）。この記事のコードは Node.js の組み込み機能（`Intl.Segmenter`、`Math.log`）だけで動き、依存パッケージも API も使わない（`run/17.log` でネットワークの無い名前空間でも記事の `node` コマンド9つが exit=0）。`needs_api_key: false` |
| 3 | 講座の順番 | course_step 3（RAG）。`content/plan.md` の計画表 #11 で、キー不要 ○ の記事。course_step 3 の最初の記事 |
| 4 | 検索ボリューム | CSV が無いので未実施 |

外した候補と理由:

- course_step 1 と 2 でキーが要らない記事（#3、#4、#7、#8、#9）は、すでに原稿がある。残りの #1、#2、#5、#6、#10 は API を呼んで応答を見せる記事で、有効なキーが要る。`ANTHROPIC_API_KEY` が unset なので外した。
- course_step 3 の #14（`rag-answer-with-citations-claude`）は回答の生成に API を呼ぶので外した。
- テーマはワークフローの指示で決まっている。CSV が届いたら `target_query` を CSV の行から選び直し、合う行が無ければ差し替える（`plan.md` の前提）。
- 計画上の重なりの決め事（`plan.md`「重なりを避けるために決めたこと」）: この記事（#11）は BM25 の検索器を作る記事で、検索の良し悪しを数字で測る話（#28 `rag-retrieval-eval-recall-mrr`）は扱わない。日本語の文書をチャンクに分ける話（#12）、埋め込みでのベクトル検索（#13）、ハイブリッド検索（#15）にも踏み込まず、語が一致しないと見つからないという BM25 の限界を示すところで止める。
