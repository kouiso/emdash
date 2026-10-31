# selection: llm-json-parse-error-fix

選んだ日: 2026-10-31

## 読んだ CSV

`keywords/` には `README.md` しか無く、CSV は1つも無い（2026-10-31 に `ls keywords/` で確認）。ラッコキーワードの CSV はまだ届いていない。

そのため、キーワードは CSV から選んでいない。`target_query` は null のままにし、検索語を作って書いていない。ゲート G10 は NG（CSV 待ち）で、記事は `status: draft` で止める。この記事を書いたのは、ワークフローの指示（CSV なしで書き進め、G10 を NG にして下書きで止める）によるもので、テーマは `content/plan.md` の #9 に従った。

## ANTHROPIC_API_KEY

`test -n "$ANTHROPIC_API_KEY" && echo set || echo unset` の結果は `unset`（2026-10-31）。値は表示もしていないし、どこにも残していない。

この記事のコードは API を呼ばない（失敗する文字列も応答の形も手で作った見本、直す関数は標準の機能だけの TypeScript）。`needs_api_key: false`。

## 既存記事との重なり（G06）

`content/articles/*.md` の frontmatter（title、main_keyword、target_query）を全件読んだ（2026-10-31）。

| slug | main_keyword | 答える検索意図 | 重なり |
|---|---|---|---|
| `mcp-server-typescript-stdio` | MCPサーバー | MCP サーバーの作り方 | なし |
| `llm-api-cost-estimate-js-tiktoken` | LLM API | リクエスト前の料金の見積もり | なし |
| `llm-api-429-retry-sdk-mock` | LLM API | 429・529 のエラーとリトライ | なし（HTTP のエラーで、JSON の読み取りは扱わない） |
| `zod-validate-llm-json-output` | 構造化出力 | JSON として読めたあとの形の検証（safeParse の issues の読み方） | なし。`content/plan.md`「重なりを避けるために決めたこと」の1つ目のとおり、あちらは「形が合っているか」、この記事は「JSON として読めるか」に答える。あちらの記事は `JSON.parse` が例外を投げる場合を1文で触れるだけで（同記事183行目）、原因と直し方は書いていない。見本の JSON も使い回していない（あちらは5つのチケットの見本、こちらは前後の文字と切れた文字列の4つ） |
| `zod-to-json-schema-tool-definition` | 構造化出力 | zod のスキーマから JSON Schema を作ってツール定義に使う | なし |

`target_query` はどの記事も null なので、検索語での突き合わせはできない。上の判断は記事の中身で行った。

## 外した候補

CSV が無いので、候補の一覧そのものが無い。講座の順番（course_step 2）とキー不要（○）は `content/plan.md` の #9 の判定をそのまま使った。
