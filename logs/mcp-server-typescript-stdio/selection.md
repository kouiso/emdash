# selection: mcp-server-typescript-stdio

選んだ日: 2026-10-31

## 読んだ CSV

- `keywords/` にあるのは `README.md` だけで、ラッコキーワードの CSV は1つも届いていない（`ls -la keywords` で確認、2026-10-31）。
- write-article スキルの手順1-1 は「CSV が1つも無ければ、その時点で止めて『CSV 待ち』と報告する」と定めている。今回はパイロットを進めるワークフローの指示により、CSV なしで講座の順番とキー不要の条件だけで選んだ。この逸脱はスキルの手順どおりではないので、報告に含める。
- そのため「選んだ行（キーワードと CSV のボリューム値）」は書けない。`target_query` の `mcpサーバー 自作 typescript` は CSV の行ではなく仮の値で、CSV が届いたら差し替える必要がある。検索ボリュームによる絞り込み（手順1-2-4）も実施できていない。

## 絞り込み

| 順 | 条件 | 結果 |
|---|---|---|
| 1 | 既存記事との重なり | `content/articles/` は `.gitkeep` のみで既存記事0本。重なりなし |
| 2 | `ANTHROPIC_API_KEY` | `unset`。API を呼ぶテーマ（course_step 1 LLM API、2 構造化出力の API 呼び出し、4 AIエージェント、6 LLM 評価）は外した |
| 3 | 講座の順番 | キー不要で書けるテーマのうち、CLAUDE.md の例示は MCP サーバー、zod での検証、RAG の検索部分。ワークフローの指示で course_step 5 MCPサーバーを選んだ。特典サンプル `samples/mcp-server` と SDK の版を揃えられ、コードを API キーなしで実行できるため |
| 4 | 検索ボリューム | CSV が無いので未実施 |

外した候補と理由:

- course_step 2「構造化出力」の zod 検証のみの記事、course_step 3「RAG」の検索部分の記事: キー不要で書けるが、今回はワークフローの指示に従い MCPサーバーを優先した。CSV が届けば講座順（小さい番号優先）で再評価すべき候補。
- course_step 1, 4, 6: API 呼び出しが必須で `ANTHROPIC_API_KEY` が unset のため外した。
