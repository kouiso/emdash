# selection: mcp-server-typescript-stdio

選んだ日: 2026-10-31（2026-10-31 のレビューを受けて `target_query` の扱いを直した）

## 読んだ CSV

- `keywords/` にあるのは `README.md` だけで、ラッコキーワードの CSV は1つも届いていない（`ls -la keywords` で確認、2026-10-31）。持ち主の CSV の書き出しは、ラッコキーワードへのログイン時の CAPTCHA で止まっている。
- write-article スキルの手順1-1 は「CSV が1つも無ければ、その時点で止めて『CSV 待ち』と報告する」と定めている。今回はパイロットを進めるワークフローの指示で、CSV なしで書き進めた。スキルどおりではないので報告に含める。
- `target_query` は null にした。最初の版では CSV に無い `mcpサーバー 自作 typescript` を作って入れていたが、スキル（`target_query` は CSV の行のキーワードをそのまま。CSV に無い語を作らない）に反するので取り消した。CSV が届くまで値は入れない。
- 検索ボリュームによる絞り込み（手順1-2-4）も実施できていない。
- ゲート G10（`target_query` が CSV の行と一致する）は NG。CSV が届くまで、この記事は `status: draft` のまま止める。

## 絞り込み

| 順 | 条件 | 結果 |
|---|---|---|
| 1 | 既存記事との重なり | `content/articles/` には、この記事のほかに記事が無い。重なりなし |
| 2 | `ANTHROPIC_API_KEY` | `unset`（2026-10-31 に再確認）。API を呼ぶテーマ（course_step 1 LLM API、2 構造化出力の API 呼び出し、4 AIエージェント、6 LLM 評価）は外した |
| 3 | 講座の順番 | キー不要で書けるテーマのうち、CLAUDE.md の例示は MCP サーバー、zod での検証、RAG の検索部分。ワークフローの指示で course_step 5 MCPサーバーを選んだ。特典サンプル `samples/mcp-server` と SDK のバージョン（1.32.2）をそろえられ、コードを API キーなしで実行できるため |
| 4 | 検索ボリューム | CSV が無いので未実施 |

外した候補と理由:

- course_step 2「構造化出力」の zod 検証のみの記事、course_step 3「RAG」の検索部分の記事: キー不要で書けるが、今回はワークフローの指示に従い MCPサーバーを優先した。CSV が届けば講座順（小さい番号優先）で選び直す候補。
- course_step 1, 4, 6: API 呼び出しが必須で `ANTHROPIC_API_KEY` が unset のため外した。
