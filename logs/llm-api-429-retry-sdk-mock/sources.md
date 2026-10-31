# sources: llm-api-429-retry-sdk-mock

番号は記事の「出典」の表と同じ。アクセス日はすべて 2026-10-31。frontmatter の `sources` も同じ8件（並びも同じ）。行番号は 398行の原稿。

取得の方法: 1〜3 と 8 は `https://platform.claude.com/docs/en/<path>.md`（同じページの Markdown 版）を curl で取得して読んだ。4 と 5 は GitHub の blob のページがこの環境から 403 になったので、同じタグ `sdk-v1.3.0` の raw ファイル（`https://raw.githubusercontent.com/anthropics/anthropic-sdk-typescript/sdk-v1.3.0/src/client.ts` など、HTTP 200）を読んだ。タグ `sdk-v1.3.0` が存在することは `git ls-remote --tags` で確かめた（コミット cb5fba41）。6 は npm のページが 403 だったので、`npm view @anthropic-ai/sdk` で確かめた。7 は HTML を取得して読んだ。

| # | URL | 題名 | 確かめた事実 | 記事のどの文の根拠か |
|---|---|---|---|---|
| 1 | https://platform.claude.com/docs/en/api/errors | Claude API errors | 「429 - `rate_limit_error`: Your organization has hit a rate limit, reached its usage tier's monthly spend cap…」。「529 - `overloaded_error`: The API is temporarily overloaded.」「A 529 error can occur when the API experiences high traffic across all users.」。「400 - `invalid_request_error`: There was an issue with the format or content of your request.」。Error shapes 節の `{"type":"error","error":{"type","message"},"request_id"}`。「Every API response includes a unique `request-id` header」と、サポートへの問い合わせに添える。ストリーミングで 200 のあとに出たエラーは「error handling doesn't follow these standard mechanisms」 | 46行目1文目、161行目「組織単位の上限」、163行目、251行目のエラーの形、335行目の 400 の説明、359行目の request-id、361行目のストリーミング |
| 2 | https://platform.claude.com/docs/en/api/rate-limits | Rate limits | RPM、ITPM、OTPM で測り、どれかを超えると 429。上限は利用ティアで決まり、Console の Rate limits のページで見られる。Reaching your spend cap 節: 上限に達すると翌月1日 00:00 UTC まで止まり、429 には `retry-after` が無く、SDK の自動リトライも失敗し続ける。`error.details.error_code` が `enforced_spend_limit_reached`。Response headers 節の `anthropic-ratelimit-requests-remaining` などの残数。acceleration limits の注意と、通信量を少しずつ増やす勧め | 161行目、345〜347行目、359行目3文目、361行目1〜2文目 |
| 3 | https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript | TypeScript SDK | Retries 節「Certain errors are automatically retried 2 times by default, with a short exponential backoff. Connection errors…, 408 Request Timeout, 409 Conflict, 429 Rate Limit, and >=500 Internal errors are all retried by default.」、`maxRetries: 0 // default is 2`、リクエストごとの `{ maxRetries: 5 }`。Handling errors 節の例 `console.log(err.name); // BadRequestError` | 46行目2文目、146行目、335行目「接続の失敗も」、337行目「公式の例は」 |
| 4 | https://github.com/anthropics/anthropic-sdk-typescript/blob/sdk-v1.3.0/src/client.ts | anthropic-sdk-typescript sdk-v1.3.0 src/client.ts | `shouldRetry`（1841〜1879行目）: `x-should-retry` ヘッダーに従い、無ければ 408、409、429、500 以上をリトライ。`retryRequest`（1881〜1920行目）: `retry-after-ms`、次に `retry-after`（秒か日付）を読み、`0 < 待ち時間 <= 2^31 - 1` ms ならそのまま待つ。外れたら `calculateDefaultRetryTimeoutMillis`。`sleep(timeoutMillis, options.signal)` で、待ちは `signal` で中断でき、`timeout` は渡していない。`calculateDefaultRetryTimeoutMillis`（1922〜1935行目）: 初期 0.5 秒、倍々、上限 8 秒、`jitter = 1 - Math.random() * 0.25` | 325行目、331行目、335行目の対象のステータスコード、353行目（2^31 - 1 ms ≒ 24.86日、`timeout` は待ちを区切らない） |
| 5 | https://github.com/anthropics/anthropic-sdk-typescript/blob/sdk-v1.3.0/src/core/error.ts | anthropic-sdk-typescript sdk-v1.3.0 src/core/error.ts | `APIError.generate`: 429 は `RateLimitError`、`status >= 500` は `InternalServerError`。`type` は本文の `error.type`。`requestID` は `request-id` ヘッダー | 165行目 |
| 6 | https://www.npmjs.com/package/@anthropic-ai/sdk | @anthropic-ai/sdk (npm) | `npm view @anthropic-ai/sdk dist-tags` で latest 1.3.0（2026-10-31） | 173行目「latest の 1.3.0」 |
| 7 | https://nodejs.org/docs/latest-v22.x/api/typescript.html | Node.js v22 Modules: TypeScript | History「v22.18.0 Type stripping is enabled by default.」。Type stripping 節「Node.js will replace inline type annotations with whitespace, and no type checking is performed.」 | 173行目2〜3文目 |
| 8 | https://platform.claude.com/docs/en/about-claude/pricing | Pricing | Model pricing の表で Claude Opus 5.5 は Base input $4 / MTok、Output $20 / MTok。失敗したリクエスト（429・529）の課金についての記載は見つからなかった（「error」で検索して出たのは web search と inference_geo の箇所だけ） | 367行目 |

## 出典ではなく実行ログを根拠にした断定

| 文（行番号は原稿） | 根拠 |
|---|---|
| 81〜103行目 my-loop の3回の失敗、サーバーへの9回、6秒 | `run/09.log`、`run/03.log`（my-loop #9 +5982ms） |
| 260〜262行目 `npm install` の出力 | `run/02.log` |
| 285〜317行目のクライアントとサーバーの出力 | `run/04.log`〜`08.log`、`run/03.log` |
| 323行目 間隔 1012ms と 1006ms | `run/03.log`（+1012ms、+2018ms） |
| 329行目 間隔 394ms と 857ms | `run/03.log`（+394ms、+1251ms） |
| 335行目 400 は1回だけ | `run/03.log`（bad-request #1 だけ） |
| 337行目 `err.name` は `Error` | `run/10.log` |
| 349行目 上限の 429 でも3回送った | `run/03.log`（spend-cap #1〜#3） |
| 355行目 10秒で `APIUserAbortError` | `run/08.log`（10003ms） |
| 48行目「リクエストは手元の外に出ません」、365行目「ループバックしか無いネットワークでも、すべてのシナリオが同じ結果」 | `run/11.log`（`unshare -rn` の中で全シナリオが同じクラスとステータスで終わり、外への `fetch` は `ENETUNREACH`） |
