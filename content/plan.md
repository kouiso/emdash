# 30本の記事計画（パイロット1本 + 29本）

作成日: 2026-10-31

## この表の前提

- 読者と講座の順番は `CLAUDE.md` と `.claude/skills/write-article/SKILL.md` の「読者」「入門ステップ講座の順番」に合わせています。各ステップ5本ずつで、ステップ5はパイロットを含めて5本です。
- ラッコキーワードの CSV はまだ届いていません（`keywords/` には README.md だけ）。そのため、どの記事も `target_query: null`、ゲート G10 は NG（CSV 待ち）、`status: draft` のままです。下の「検索意図」の列は記事の中身から決めた仮の分類で、検索データではありません。CSV が届いたら、各記事の `target_query` は CSV の行から選び直し、合う行が無い記事は差し替えます。
- `ANTHROPIC_API_KEY` は unset（2026-10-31 に `test -n` で確認）。「キー不要」が ○ の記事から先に書きます。× の記事は API を呼ぶコードを動かせないので、キーが入るまで公開しません。
- 重なりの判定は guides/01 §1（検索意図の4タイプ）と §5（内部リンク）に沿っています。同じ検索意図に答える記事は2本作らず、隣り合う記事は内部リンクでつなぎます。

## キー不要（○）の判定基準

記事の中のコードブロックを、LLM の API キーも有料サービスも使わずに、すべて実際に動かせる場合だけ ○ にしました。

- モデルの出力の形をしたデータを使う記事は、手で作った見本であることを本文に明記する前提で ○ にしています。実際のモデルの出力として載せることはしません。
- Claude のトークン数をオフラインで正確に数える方法はありません。`@anthropic-ai/tokenizer` の README は「Claude 3 以降では正確ではない」と書いています（https://github.com/anthropics/anthropic-tokenizer-typescript 、2026-10-31 確認）。そのため、トークン数の記事は OpenAI のトークナイザー（js-tiktoken、語彙ファイルを同梱）で数える内容にしています。
- ローカルの埋め込みモデルは、Hugging Face から無料でダウンロードできることを確かめました（2026-10-31、`Xenova/multilingual-e5-small` の config.json が HTTP 200）。
- 本来の書き方なら API を呼ぶ記事を、○ にするために無理に作り替えることはしていません。

## 計画表

| # | ステップ | メインキーワード | slug | 仮タイトル | 検索意図 | キー不要 | 判定の理由 | 主な内部リンク先 |
|---|---|---|---|---|---|---|---|---|
| 1 | 1 | LLM API | `claude-api-typescript-first-call` | Claude API を TypeScript から初めて呼ぶ【SDK の版と料金の目安つき】 | やり方 | × | 応答を受け取るところまで動かすには有効なキーが要る | 2, 5 |
| 2 | 1 | LLM API | `llm-api-streaming-typescript` | LLM API の応答をストリーミングで1文字ずつ表示する【TypeScript】 | やり方 | × | ストリームのイベントは本物の API からしか得られない | 1, 4 |
| 3 | 1 | LLM API | `llm-api-cost-estimate-js-tiktoken` | OpenAI API の料金をリクエスト前に見積もる【js-tiktoken でトークンを数える】 | やり方 | ○ | js-tiktoken は語彙を同梱しオフラインで動く。料金表は公式ページを読むだけ。Claude のトークン数は数えられないことを明記する | 1 |
| 4 | 1 | LLM API | `llm-api-429-retry-sdk-mock` | LLM API の 429・529 エラーとリトライ【SDK の自動リトライを手元のモックで確かめる】 | エラー | ○ | SDK の `baseURL` を手元の HTTP サーバーに向け、ダミーの文字列をキーに渡す。リクエストは外に出ない | 2, 5 |
| 5 | 1 | LLM API | `claude-api-authentication-error` | Claude API の認証エラー（401、Could not resolve authentication method）の原因と直し方 | エラー | × | エラーの再現はキーなしでできるが、直ったことを示す最後のコードは有効なキーで応答を受け取る必要がある | 1 |
| 6 | 2 | 構造化出力 | `claude-structured-outputs-json` | Claude API で JSON を確実に返させる【Structured Outputs と tool use】 | やり方 | × | API を呼んで返ってきた JSON を見せる記事なのでキーが要る | 7, 10 |
| 7 | 2 | 構造化出力 | `zod-validate-llm-json-output` | LLM の出力 JSON を zod で検証する【safeParse のエラーの読み方】 | やり方 | ○ | 検証するのはモデルの出力の形をした手作りの見本。zod だけで動く | 6, 8, 9 |
| 8 | 2 | 構造化出力 | `zod-to-json-schema-tool-definition` | zod のスキーマから JSON Schema を作ってツール定義に使う【zod v4 の z.toJSONSchema】 | やり方 | ○ | スキーマの変換と出力の確認だけで、API は呼ばない | 7, 16 |
| 9 | 2 | 構造化出力 | `llm-json-parse-error-fix` | LLM の返した JSON が JSON.parse で落ちる原因と直し方【コードフェンス、途中で切れる】 | エラー | ○ | 失敗する文字列は手作りの見本。直す関数はただの TypeScript | 7 |
| 10 | 2 | 構造化出力 | `structured-output-methods-compare` | 構造化出力のやり方を比べる【プロンプト指示、tool use、Structured Outputs】 | 比較 | × | 3つのやり方を実際に呼んで結果を比べる記事なのでキーが要る | 6, 7 |
| 11 | 3 | RAG | `rag-bm25-search-typescript` | RAG の検索部分を BM25 で作る【TypeScript、API キーなしで動く】 | やり方 | ○ | 検索は手元の計算だけ。生成は扱わない | 12, 15, 28 |
| 12 | 3 | RAG | `rag-chunking-japanese-text` | RAG 用に日本語の文書をチャンクに分ける【文字数、見出し、重なり】 | やり方 | ○ | 文字列を分ける処理だけで、外部サービスを使わない | 11, 13 |
| 13 | 3 | RAG | `rag-local-embeddings-transformers-js` | 埋め込みを手元で作ってベクトル検索する【Transformers.js、API キー不要】 | やり方 | ○ | 埋め込みモデルは Hugging Face から無料で落としてローカルで動かす。ダウンロードできることは確認済み | 11, 15 |
| 14 | 3 | RAG | `rag-answer-with-citations-claude` | RAG で検索結果を渡して出典つきで回答させる【Claude API】 | やり方 | × | 回答の生成に API を呼ぶ | 11, 6 |
| 15 | 3 | RAG | `rag-hybrid-search-rrf` | BM25 とベクトル検索を RRF で合わせるハイブリッド検索【TypeScript】 | やり方 | ○ | 11 と 13 の結果を順位で合わせる計算だけ | 11, 13, 28 |
| 16 | 4 | AIエージェント | `ai-agent-tool-use-loop-typescript` | AI エージェントの中身を作る【tool use のループを TypeScript で自作】 | やり方 | × | モデルがツールを選ぶ部分は API を呼ばないと動かない | 8, 17, 18 |
| 17 | 4 | AIエージェント | `claude-agent-sdk-first-agent` | Claude Agent SDK で最初のエージェントを動かす【TypeScript】 | やり方 | × | SDK がモデルを呼ぶのでキーが要る | 16 |
| 18 | 4 | AIエージェント | `ai-agent-max-turns-budget-limit` | AI エージェントが止まらないのを防ぐ【最大ターン数とトークン予算】 | やり方 | × | 制限が効いて止まることを示すには本物のループを回す必要がある | 16, 4 |
| 19 | 4 | AIエージェント | `ai-agent-safe-file-tool` | AI エージェントに渡すファイル操作ツールを安全に作る【パスの制限と許可リスト】 | やり方 | ○ | ツール関数に危ない入力を直接渡して確かめる。モデルにつなぐ部分は 16 へのリンクに任せ、この記事にはコードを置かない | 16, 21 |
| 20 | 4 | AIエージェント | `ai-agent-vs-workflow` | AI エージェントとワークフローの違い【決まった手順なら LLM を順に呼ぶだけでいい】 | 概念 | × | 両方の形を実際に呼んで見せるのでキーが要る | 16, 17 |
| 21 | 5 | MCPサーバー | `mcp-server-typescript-stdio`（パイロット、作成済み） | MCP サーバーを TypeScript で自作する手順【SDK v1.32.2、Claude Code に接続まで】 | やり方 | ○ | 作成済み。stdio、ツール1つ、SDK のクライアントでの確認、`claude mcp add`、stdout のログの落とし穴を扱う | 22, 23, 24, 25 |
| 22 | 5 | MCPサーバー | `mcp-server-streamable-http` | MCP サーバーを Streamable HTTP で動かす【TypeScript SDK、リモート接続の準備】 | やり方 | ○ | localhost のサーバーに SDK のクライアントからつなぐだけ。claude.ai からの接続は言及にとどめコードは置かない | 21, 23 |
| 23 | 5 | MCPサーバー | `mcp-inspector-debug` | MCP Inspector で MCP サーバーを調べる【ツール一覧と呼び出しを画面と CLI で】 | やり方 | ○ | Inspector は npx で手元で動く。CLI モードで結果を記録できる | 21, 25 |
| 24 | 5 | MCPサーバー | `mcp-server-resources-prompts` | MCP サーバーで Resources と Prompts を公開する【ツール以外の2つの機能】 | やり方 | ○ | SDK のクライアントで一覧と取得を確かめる。モデルは使わない | 21 |
| 25 | 5 | MCPサーバー | `mcp-connection-closed-fix` | MCP サーバーにつながらない（Connection closed）原因と直し方 | エラー | ○ | 失敗の再現も直したあとの確認も SDK のクライアントで行う。stdout にログを書く原因は 21 にあるのでリンクで済ませる | 21, 23 |
| 26 | 6 | LLM 評価 | `llm-eval-harness-fixtures` | LLM の回答を自動で採点する仕組みを作る【完全一致、部分一致、正規表現】 | やり方 | ○ | 採点するのは手作りの見本の回答で、採点の処理だけを動かす。実際のモデルの出力とは書かない | 27, 30 |
| 27 | 6 | LLM 評価 | `llm-as-a-judge-claude` | LLM-as-a-Judge で回答を採点する【Claude に採点基準を渡す】 | やり方 | × | 採点するのがモデルなので API を呼ぶ | 26, 29 |
| 28 | 6 | LLM 評価 | `rag-retrieval-eval-recall-mrr` | RAG の検索の良し悪しを数字で測る【Recall@k と MRR を TypeScript で】 | やり方 | ○ | 11・15 の検索器と、手で作った質問と正解の組で計算する | 11, 15, 26 |
| 29 | 6 | LLM 評価 | `promptfoo-llm-eval-intro` | promptfoo で LLM のプロンプトを評価する【設定ファイル1つから】 | やり方 | × | ふつうの使い方ではモデルのプロバイダーを呼ぶ。モデルを使わない形に作り替えると 26 と同じ記事になる | 26, 27 |
| 30 | 6 | LLM 評価 | `llm-eval-dataset-from-logs` | LLM 評価用のテストケースを作る【ログから選んで JSONL にする】 | やり方 | ○ | 手作りのログの見本から重複を除き、件数を揃えて書き出す処理だけ | 26, 28 |

## 本数のまとめ

| ステップ | 本数 | キー不要 ○ | キーが要る × |
|---|---|---|---|
| 1 LLM API | 5 | 2 | 3 |
| 2 構造化出力 | 5 | 3 | 2 |
| 3 RAG | 5 | 4 | 1 |
| 4 AIエージェント | 5 | 1 | 4 |
| 5 MCPサーバー | 5（パイロット含む） | 5 | 0 |
| 6 LLM 評価 | 5 | 3 | 2 |
| 合計 | 30 | 18（新規17 + パイロット） | 12 |

## 重なりを避けるために決めたこと

- 7（zod での検証）と 9（JSON.parse の失敗）は、前者が「形が合っているか」、後者が「JSON として読めるか」に答えます。お互いにリンクし、同じ例を使い回しません。
- 11（BM25 を作る）と 28（検索を測る）は、作る記事と測る記事に分けます。28 は 11 の検索器をそのまま使います。
- 19（エージェントのファイル操作ツール）は MCP の話をせず、ツール関数の安全性だけを扱います。MCP のツールは 21 以降に任せます。
- 25（つながらない）は、パイロット 21 の「stdout にログを書くと SDK のクライアントは行を捨てる」の節を繰り返しません。
- 26（自作の採点）と 29（promptfoo）は、自分で書くか既製のツールを使うかで分けます。
