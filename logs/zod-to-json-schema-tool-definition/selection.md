# selection: zod-to-json-schema-tool-definition

選んだ日: 2026-10-31

## 読んだ CSV

- `keywords/` にあるのは `README.md` だけで、ラッコキーワードの CSV は1つも届いていない（2026-10-31 に `ls keywords` で確認）。
- write-article スキルの手順1-1 は、CSV が無ければ「CSV 待ち」で止めると定めている。今回はワークフローの指示（CSV は届いていない、`target_query` は null のまま、G10 は NG、記事は draft のまま、検索データは作らない）に従って書き進めた。スキルの例外「ユーザーが CSV なしで書き進めるよう明示したとき」に当たるかどうかは、指示がワークフローのスクリプト経由のため、報告に含めて判断を返す。
- `target_query` は null。CSV に無いキーワードは作っていない。`brief.md` の検索意図も、検索データではなく `content/plan.md` の計画と記事の中身から決めた仮の分類。
- 検索ボリュームによる絞り込み（手順1-2-4）は、CSV が無いので実施していない。
- ゲート G10 は NG（CSV 待ち）。CSV が届くまで、この記事は `status: draft` のまま止める。

## 絞り込み

| 順 | 条件 | 結果 |
|---|---|---|
| 1 | 既存記事との重なり | `content/articles/*.md` の frontmatter を全件読んだ（2026-10-31 時点で4本）。`mcp-server-typescript-stdio`（MCP サーバーの自作、main_keyword「MCPサーバー」）、`llm-api-cost-estimate-js-tiktoken`（料金の見積もり、「LLM API」）、`llm-api-429-retry-sdk-mock`（429 とリトライ、「LLM API」）、`zod-validate-llm-json-output`（LLM の出力 JSON を zod の safeParse で検証する、「構造化出力」）。どれも target_query は null。zod のスキーマを JSON Schema に変換してツール定義に使う記事は無い。いちばん近いのは `zod-validate-llm-json-output` だが、あちらは「返ってきた JSON の検証と issues の読み方」、この記事は「スキーマからツール定義を作る変換」に答える。`content/plan.md` の「重なりを避けるために決めたこと」と内部リンクの列（#8 → 7, 16）にも合わせ、この記事では safeParse の issues の読み方を前の記事へのリンクに任せた |
| 2 | `ANTHROPIC_API_KEY` | `unset`（2026-10-31 に `test -n "$ANTHROPIC_API_KEY" && echo set \|\| echo unset` で確認。値は表示していない）。この記事のコードは API を呼ばない。SDK は `import type` で型だけを使うので、実行時に読み込まれない |
| 3 | 講座の順番 | course_step 2（構造化出力）。計画表の #8。step 2 のうち #6 と #10 は API キーが要る（計画表の「キー不要 ×」）。キー不要の #7、#8、#9 のうち、#7 は別の執筆で原稿ができている。ワークフローの指示で #8 を選んだ |
| 4 | 検索ボリューム | CSV が無いので未実施 |

外した候補と理由:

- course_step 2 の `claude-structured-outputs-json`、`structured-output-methods-compare`: `ANTHROPIC_API_KEY` が unset で、API を呼ぶコードを動かせない（C38 を満たせない）。
- course_step 2 の `zod-validate-llm-json-output`: 原稿がすでにある（重なり）。
- course_step 2 の `llm-json-parse-error-fix`: キー不要で書けるが、今回はワークフローの指示で #8 を選んだ。CSV が届けば検索ボリュームで順を見直す候補。
