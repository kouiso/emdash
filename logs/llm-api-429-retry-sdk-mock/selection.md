# selection: llm-api-429-retry-sdk-mock

選んだ日: 2026-10-31

## 読んだ CSV

- `keywords/` にあるのは `README.md` だけで、ラッコキーワードの CSV は1つも届いていない（2026-10-31 に `ls keywords` で確認）。
- write-article スキルの手順1-1 は「CSV が1つも無ければ、その時点で止めて『CSV 待ち』と報告する」と定めている。今回は、`content/plan.md` の30本計画を進めるワークフローの指示（CSV が届いていないこと、`target_query` を null に保つこと、G10 を NG にすることを明示した指示）で、CSV なしで書き進めた。
- `target_query` は null。CSV に無いキーワードは作っていない。検索ボリュームによる絞り込み（手順1-2-4）も実施できていない。
- ゲート G10 は NG。CSV が届くまで `status: draft` のまま止める。

## 絞り込み

| 順 | 条件 | 結果 |
|---|---|---|
| 1 | 既存記事との重なり | `content/articles/` の frontmatter を全件読んだ（2026-10-31 時点で、この記事のほかに `mcp-server-typescript-stdio.md` と `llm-api-cost-estimate-js-tiktoken.md`）。前者は MCP サーバーの自作（やり方）、後者は料金の見積もりとトークンの数え方（やり方）。429・529 のエラーとリトライ（エラー）に答える記事は無い。表記ゆれの範囲でも重ならない |
| 2 | `ANTHROPIC_API_KEY` | `unset`（2026-10-31 に `test -n` で確認）。この記事は SDK の `baseURL` を手元のモックサーバーに向け、ダミーの文字列をキーに渡すので、API を呼ばない（`run/11.log` でループバックだけの環境でも同じ結果になることを確かめた）。`needs_api_key: false` |
| 3 | 講座の順番 | course_step 1（LLM API）。`content/plan.md` の計画表 #4 で、キー不要 ○ の記事 |
| 4 | 検索ボリューム | CSV が無いので未実施 |

外した候補と理由:

- course_step 1 の #1、#2、#5（`plan.md`）: 応答を受け取るところまで動かすには有効なキーが要る。`ANTHROPIC_API_KEY` が unset なので外した。
- テーマはワークフローの指示で決まっており、CSV が届いたら `target_query` を CSV の行から選び直し、合う行が無ければ差し替える（`plan.md` の前提）。
