# ローカルでの EmDash MCP 検証（2026-10-31）

結論: Claude は EmDash 1.3.1 内蔵の MCP（`/_emdash/api/mcp`）で、下書き作成、予約、公開、`/posts` への掲載、リビジョンでの差し戻しまでを JSON-RPC over HTTP で操作できた。予約公開も MCP で使える。予約時刻を過ぎた記事は、scheduled handler（Cron Trigger）が動いた時点で公開された。ただしローカルでは cron は自動では走らず、handler を手で起動して確かめた。

## 根拠にしたドキュメント（すべて 2026-10-31 に参照）

| URL | 確かめたこと |
|---|---|
| https://docs.emdashcms.com/reference/mcp-server | エンドポイント、Bearer 認証（OAuth 2.1 / PAT `ec_pat_` / Device Flow）、スコープ、ツール一覧、`_rev` の扱い、エラー形式 |
| https://docs.emdashcms.com/guides/ai-tools | MCP は既定で有効。Claude はリモートのカスタムコネクタ（OAuth）でつなぐ。管理画面のセッションでは MCP の認証にならない |
| https://docs.emdashcms.com/auth/tokens | 404（このページは存在しない）。PAT の作り方は reference/mcp-server の「created in the admin」と管理画面の Settings → API Tokens で確かめた |
| https://docs.emdashcms.com/guides/authentication/ | セットアップウィザードは「サイト → アカウント → パスキー（またはログインプロバイダ）」の3段階 |
| https://docs.emdashcms.com/reference/cli/ | dev bypass は `astro dev` 上だけの仕組み。`wrangler dev` では使えないので、今回は使っていない |
| https://docs.emdashcms.com/reference/content-lifecycle/ | draft / scheduled / published の遷移 |
| https://docs.emdashcms.com/deployment/cloudflare/ | Cloudflare で予約公開を実行するのは scheduled handler だけ。Cron Trigger と `createScheduledHandler()` の両方が要る |
| https://developers.cloudflare.com/workers/configuration/cron-triggers/ | ローカルの dev では cron は自動で走らない。`/cdn-cgi/local/scheduled` で handler を起動できる |

## 手順

1. `.wrangler/` をまるごと退避した（22 ファイルの sha256 を記録）。
2. `npm run build`（成功）→ `npx wrangler dev --local --port 8787 --ip 127.0.0.1` をバックグラウンドで起動した。
3. セットアップ: Playwright（Chromium）で `http://localhost:8787/_emdash/admin/setup` を開き、「Empty site」→ 架空のローカル専用管理者（`local-admin@example.test` / Local Admin）→「Create passkey」の順に進めた。パスキーは Chrome DevTools Protocol の WebAuthn 仮想認証器で登録した。ドキュメントどおりのパスキー経路で、dev bypass は使っていない。
4. トークン: 管理画面の Settings → API Tokens で PAT を発行した。スコープは `content:read` / `content:write` / `schema:read`、有効期限は 7 日。誤って最初に作った「No expiry」のトークンは、その場で Revoke した。値はスクラッチパッドの権限 600 のファイルにだけ置き、作業後に削除した。ローカル DB も退避した状態に戻したので、トークンはもう残っていない。
5. MCP: `POST /_emdash/api/mcp` に `Authorization: Bearer <REDACTED>`、`Accept: application/json, text/event-stream` を付けて JSON-RPC 2.0 で呼んだ。応答は `text/event-stream` で、`data:` 行に JSON-RPC の結果が1件入る（stateless Streamable HTTP）。
6. 終わったら wrangler を止め、プロセスが残っていないこと、8787 番に接続できないこと（curl exit 7）を確かめた。`.wrangler/` を退避した内容に戻し、sha256 が全ファイル一致することを確かめた。

## 呼び出しの記録（トークンは伏せてある）

| # | 呼び出し | 要点 | 結果 |
|---|---|---|---|
| 0 | トークンなしで `tools/list` | — | HTTP 401、`WWW-Authenticate: Bearer resource_metadata=".../.well-known/oauth-protected-resource"` |
| 1 | `initialize` | protocolVersion 2025-06-18 | serverInfo `emdash` 0.1.0、capabilities `tools.listChanged` |
| 2 | `tools/list` | — | 72 ツール。ドキュメントの静的一覧（content 16 / byline 6 / schema 13 / media 7 / search 1 / taxonomy 10 / menu 7 / revision 2 / settings 2 / transfer 8）と一致 |
| 3 | `schema_get_collection` `{slug:"posts"}` | — | fields: title / featured_image / content(portableText) / excerpt。supports: drafts, revisions, preview, scheduling, search, seo。`urlPattern` は `/posts/{slug}` |
| 4 | `content_create` | `collection:"posts"`、`slug:"mcp-local-verify-a"`、`data.content` に Markdown 文字列 | `status:"draft"`。Markdown は Portable Text に変換された（h2、code・strong の mark、bullet リスト、`_type:"code"` に `language:"ts"`）。`_rev` が返る |
| 5 | `content_schedule` | `_rev`、`scheduledAt`（30 分後、UTC） | `status:"scheduled"`。この時点の `/posts` には出ず、詳細ページは 404 |
| 6 | `content_publish` | `_rev` | `status:"published"`、`scheduledAt:null`、`liveRevisionId` が付いた。`/posts` に掲載され、詳細ページは 200 で本文と見出しとコードが表示された |
| 7 | `content_create` B → `content_schedule` | 60 秒後（04:47:01Z） | `status:"scheduled"` |
| 8 | 時刻から 20 秒過ぎてから `content_get` | — | まだ `scheduled`。`/posts` に B は出ない（読み出し時に公開される仕組みは無い） |
| 9 | `GET /cdn-cgi/local/scheduled?cron=*+*+*+*+*&format=json` | scheduled handler を起動 | `{"outcome":"ok"}`。wrangler のログに `[scheduled] Published 1 scheduled item(s)`。B は `published`、`publishedAt` は予約時刻と同じ 04:47:01Z。`/posts` に掲載され、詳細ページは 200 |
| 10 | 公開済みの A に `content_update`（title と本文） | `_rev` | `status` は published のまま、`draftRevisionId` が付く。公開ページは旧版のまま |
| 11 | `content_compare` | — | `hasChanges:true`、live と draft の両方が返る |
| 12 | `content_publish` | — | 公開ページが v2 に切り替わった |
| 13 | `revision_list` `{id:"mcp-local-verify-a"}`（slug） | — | **`items:[]`、`total:0` が返り、エラーにもならない** |
| 14 | `revision_list` `{id:"01M684DY…"}`（ULID） | — | 2 件（v2 と v1）。新しい順に、各版の `data` 全体が返る |
| 15 | `revision_restore` `{revisionId:<v1>}` | — | 下書きが v1 の内容に戻るだけで、公開ページは v2 のまま |
| 16 | `content_publish` | — | 公開ページが v1 に戻った（差し戻し完了） |
| 17 | `content_unpublish`（B） | `_rev` | `status:"draft"`。`/posts` から消え、詳細ページは 404 |
| 18 | `content_schedule` に過去の日時 | — | `isError:true`、`[VALIDATION_ERROR] Scheduled date must be in the future` |
| 19 | `content_schedule` に古い `_rev` | — | `isError:true`、`[CONFLICT] Revision precondition did not match` |
| 20 | `content_schedule` に `2026-11-30T09:00:00+09:00` | — | `scheduledAt:"2026-11-30T00:00:00.000Z"`。JST のオフセット付きでも受け付けて UTC で保存する |
| 21 | `content_unschedule` | `_rev` は要らない | `status:"draft"`、`scheduledAt:null` |

ほかに、`emdash doctor` は「scheduler wiring: Cron Trigger and scheduled() handler found (./src/worker.ts)」で合格した（database のチェックは D1 なので `data.db` が無いと出る。ドキュメントに書かれているとおりの既知の挙動）。

## うまくいったこと

- PAT（Bearer）での MCP 接続、`tools/list`、作成、予約、公開、`/posts` への掲載。
- Markdown 文字列を `content` に渡すだけで Portable Text に変換される。コードブロックの言語指定も残る。
- 予約公開: 時刻を過ぎたあとに scheduled handler が動くと公開され、`publishedAt` は予約時刻になる。
- 差し戻し（`revision_list` → `revision_restore` → `content_publish`）と、下書きに戻す操作（`content_unpublish`）。

## うまくいかなかったこと、注意点

- `revision_list` に slug を渡すと、エラーにならずに空の一覧が返る。ULID を渡すと正しく返る。差し戻しでは必ず ULID を使う。
- ローカルの `wrangler dev` では cron が自動で走らない。予約公開が実際に動くことは、本番の Cron Trigger（`wrangler.jsonc` の `* * * * *`）でしか確かめられない。Cloudflare では新しい Cron Trigger が動き出すまで最大 15 分かかる（deployment/cloudflare）。
- `content_publish` は scheduled 状態の記事をその場で公開し、予約を消す。予約した記事を誤って公開しないこと。
- 本番の接続は claude.ai のコネクタ（OAuth）経由になる。今回の PAT はローカル検証のためだけのもので、本番では使わない（CLAUDE.md の秘密情報のルール）。OAuth の経路は今回試していない。docs の権限表（reference/mcp-server）では、スキーマや設定の読み取りに Editor ロールが要る。OAuth で許可するスコープとロールは、本番でコネクタをつないだときに確かめる。
- ドキュメントの `auth/tokens` は 404 だった。

## write-article スキルへの結論

| 操作 | 使うツール | 要点 |
|---|---|---|
| 作成 | `content_create` | `collection:"posts"`、`slug`、`data:{title, excerpt, content:<Markdownの文字列>}`。既定で draft になる。返る `id`（ULID）と `_rev` を `publish.md` に記録する |
| 予約 | `content_get` → `content_schedule` | 直前に読んだ `_rev` と、未来の `scheduledAt`（ISO 8601。`+09:00` 付きでよい）を渡す。CONFLICT のときは読み直してやり直す |
| 公開（すぐ出す場合） | `content_get` → `content_publish` | 予約は消える |
| 予約の取り消し | `content_unschedule` | `_rev` は要らない |
| 公開済みの記事を直す | `content_get` → `content_update` → `content_compare` → `content_publish` | update だけでは公開ページは変わらない |
| リビジョンで戻す | `revision_list`（ULID で呼ぶ）→ `revision_restore` → `content_get` → `content_publish` | restore は下書きを置き換えるだけ。公開ページを戻すには publish まで要る |
| 下書きに戻す | `content_get` → `content_unpublish` | 公開済みの記事で確認。予約中の記事に使ったときの挙動は未確認 |

予約公開は MCP の `content_schedule` で行える。Claude Code の scheduled task で代わりに公開する方法は、本番で Cron Trigger が動かないとわかった場合の予備にとどめる。
