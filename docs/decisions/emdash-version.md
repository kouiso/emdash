# EmDash の版を 1.4.0 に上げる（2026-10-31）

結論: `emdash` と `@emdash-cms/cloudflare` を 1.3.1 から 1.4.0 に上げた。changelog に破壊的変更（Major）は無く、ビルド、型チェック、`wrangler deploy --dry-run`、ローカルでの画面確認、MCP での作成から公開までがすべて 1.3.1 のときと同じように通った。1.3.1 に戻す理由は見つからなかった。

## 1.4.0 が最新かどうか

`npm view emdash dist-tags versions time --json`（2026-10-31 実行）の結果:

- `dist-tags`: `{'rc': '1.0.1-rc.1', 'latest': '1.4.0'}`
- 1.3.1 は 2026-10-18T19:19:29Z、1.4.0 は 2026-10-29T13:20:26Z の公開
- `@emdash-cms/cloudflare` も `latest` が 1.4.0

出典: https://www.npmjs.com/package/emdash 、https://www.npmjs.com/package/@emdash-cms/cloudflare （2026-10-31 確認）

## changelog で確かめたこと

読んだもの（すべて 2026-10-31 に参照）:

- https://github.com/emdash-cms/emdash/blob/main/packages/core/CHANGELOG.md の「1.4.0」
- https://github.com/emdash-cms/emdash/blob/main/packages/cloudflare/CHANGELOG.md の「1.4.0」
- 同じリポジトリの `packages/admin`、`packages/auth`、`packages/blocks` の CHANGELOG.md の「1.4.0」

npm の tarball には CHANGELOG が入っていないので、GitHub の main にあるファイルを読んだ。

1.4.0 は Minor が1件（`admin.hiddenNavItems` の追加）で、残りは Patch。5つのパッケージのどれにも「Major Changes」の節は無い。このサイトに関係しそうなものを1件ずつ見た。

| 変更 | このサイトへの影響 |
|---|---|
| #4243 キャッシュヒントが `Last-Modified` を自動で付けなくなった。`cacheHint.lastModified` も自動では入らない | このサイトは `cacheHint.lastModified` を読んでいない（`src/` を grep して0件）。`astro.config.mjs` に Astro のキャッシュの設定も無い。影響なし |
| #4286 同じ版をもとにした保存が同時に2件来たとき、2件目が `409 CONFLICT` になる（以前は1件目が黙って上書きされた） | MCP で記事を直す手順（`content_get` で読んだ `_rev` を渡す）は変わらない。CONFLICT のときは読み直してやり直す、という write-article スキルの手順のままでよい |
| #4287 期限切れの OAuth トークンとログインコードを scheduled handler が消すようになった | 本番の MCP は OAuth でつなぐ予定なので、たまり続けなくなる。設定の変更は要らない |
| #4459 `/_emdash/api/oauth/token` のエラーコードが RFC どおりの小文字 `invalid_grant` になった | OAuth クライアント（claude.ai のコネクタ）にとっては直る方向の変更 |
| #3129 空の画像フィールド `""` が `null` で保存されるようになった。必須の画像フィールドに `""` を送ると検証エラーになる | `featured_image` は必須ではない。MCP で記事を作るときに `featured_image` を送っていないので影響なし |
| #4157 外部の認証プロバイダ（Cloudflare Access など）を使うとき、毎リクエストの KV 書き込みをやめた | Access は使っていないので関係しない |
| cloudflare #4278 / #4281 / #4394 サンドボックスのプラグインまわり | `sandboxRunner` も `LOADER` も使っていない（CLAUDE.md）ので関係しない |

ほかに、DB のマイグレーションは増えていない。1.4.0 でビルドしたあとの `.emdash/migrations.json` の90件と、1.3.1 のときに作った既存のローカル DB（`.wrangler/`）の `_emdash_migrations` の90件は、名前が完全に一致した。フォーム機能も 1.4.0 では追加されていないので、`docs/decisions/subscribe.md` の判断（D1 の独自テーブルに保存する）はそのままでよい。

## 入れ方

```sh
npm install --save-exact emdash@1.4.0 @emdash-cms/cloudflare@1.4.0
```

`package.json` の2行が 1.4.0 に変わった。`package-lock.json` では66パッケージの版が変わった。内訳は `emdash` と `@emdash-cms/*` の6つが 1.4.0 に、`@tiptap/*` が 3.32.0 から 3.32.2 に、ほかは `jose` 6.2.13 → 6.2.14、`qs` 6.16.1 → 6.17.1 などのパッチ版で、どれも EmDash の依存の範囲の中で npm が選び直したもの。

## 確かめた結果（2026-10-31、Node.js 22.22.0、wrangler 4.152.0）

### ビルドと型

| コマンド | 結果 |
|---|---|
| `npm run build` | exit 0。`[emdash] Build complete`、`[build] Complete!` |
| `npm run cf:types && npm run typecheck` | exit 0。`Result (26 files): - 0 errors - 0 warnings - 0 hints` |
| `npx wrangler deploy --dry-run` | `Total Upload: 16062.39 KiB / gzip: 4255.25 KiB`、バインディングは SESSION（KV）、DB（D1）、MEDIA（R2）、ASSETS。`--dry-run: exiting now.` |

1.3.1 のときの dry-run は `15,816.08 KiB / gzip 4,236.46 KiB`（`docs/decisions/ogp.md`）で、約 246 KiB 増えた。Workers の上限は Free・Paid とも非圧縮で 64 MiB、圧縮後の上限は無い（https://developers.cloudflare.com/workers/platform/limits/ の「Worker size」、2026-10-31 確認）ので、収まっている。

### 画面（Playwright、Chromium）

`npm run build` のあと、ローカル DB をリポジトリの `.wrangler/` とは別のスクラッチパッドのディレクトリにして `npx wrangler dev --local --port 8787 --ip 127.0.0.1 --persist-to <scratchpad>/wr-v140` で動かした。空の DB から、セットアップ画面（Empty site → ローカル専用の架空の管理者 → 仮想認証器でパスキー）を通した。

| 確かめたこと | 結果 |
|---|---|
| `/` | 200。見出しが表示された |
| 診断の切り替え | 初期は「入門ステップ講座の 1「LLM API」から順に読む」。「pro」を押すと「6「LLM 評価」と応用記事、特典のサンプルアプリ」に切り替わり `aria-pressed=true`。「new」に戻すと元に戻った |
| フォームの送信 | `/api/subscribe` が 200 `{"ok":true,"message":"登録を受け付けました。…"}`。画面に同じ文言が出た。D1 の `newsletter_subscribers` に1行入った（Turnstile は未設定なので無効のまま） |
| `/posts` | 200。MCP で公開した記事が載った |
| 記事ページ `/posts/v140-verify-rag` | 200。料金の目安の枠（`[data-cost-box]`）に「料金の目安 / 約 10 円（検証用の合成データ） / 動かした環境 / Node.js 22 / wrangler dev --local」、公開日の横に「動作確認日 2026年10月31日」。本文の h2 とコードブロックも出た |
| `/tag/rag` | 200。タイトルは「RAG（入門ステップ講座 03）」で、記事が載った |
| `/privacy` | 200 |
| 幅 390px の `/` | `scrollWidth` 390、はみ出す要素なし |
| コンソールのエラー | `/nope-404` を開いたときの 404 だけ（わざと開いた存在しないページ）。ほかのページでは0件 |

### MCP（`docs/verification/local-mcp.md` と同じ手順）

管理画面の Settings → API Tokens で、ローカル DB の中だけで使う PAT を発行した（スコープ `content:read` / `content:write` / `schema:read`、有効期限7日）。値はスクラッチパッドの権限 600 のファイルにだけ置き、終わったあとにファイルもローカル DB のディレクトリごと消した。

| # | 呼び出し | 結果 |
|---|---|---|
| 0 | トークンなしで `tools/list` | HTTP 401、`WWW-Authenticate: Bearer resource_metadata="http://127.0.0.1:8787/.well-known/oauth-protected-resource"` |
| 1 | `initialize` | serverInfo `emdash` 0.1.0、capabilities `tools.listChanged` |
| 2 | `tools/list` | 72 ツール。1.3.1 のときに保存した一覧と比べて、増えたものも減ったものも無い |
| 3 | `taxonomy_create_term` `{taxonomy:"tag", slug:"rag"}` | 作成できた（Empty site のセットアップでは seed の分類の定義だけが入り、語は入らない） |
| 4 | `content_create`（`cost_estimate`、`run_environment`、`verified_at`、`taxonomies:{tag:["rag"]}`） | 下の「気づいたこと」を参照。`content_update` でタグを付け直した |
| 5 | `content_schedule`（30 分後） | `status:"scheduled"`。`/posts` に出ず、詳細ページは 404 |
| 6 | `content_publish` | `status:"published"`、`scheduledAt:null`、`liveRevisionId` が付いた。`/posts` と `/tag/rag` に載り、詳細ページは 200 |
| 7 | 別の記事を 45 秒後に予約し、時刻を過ぎてから `/cdn-cgi/local/scheduled` を呼ぶ | `{"outcome":"ok","noRetry":false}`、ログに `[scheduled] Published 1 scheduled item(s)`。`publishedAt` は予約時刻と同じ 05:27:20Z、詳細ページは 404 から 200 に変わった |

### 気づいたこと（1.4.0 の退行ではない）

まだ無いタグ（`rag`）を `taxonomies` に入れて `content_create` を呼ぶと、`isError:true`、`[VALIDATION_ERROR] Unknown taxonomy term: tag='rag' (locale 'en')` が返る。ところが記事そのものは下書きとして作られて残り、同じ slug でやり直すと `[SLUG_CONFLICT]` になる。

原因は D1 がトランザクションを使えないこと。EmDash の `src/database/transaction.ts` は、D1 ではトランザクションを使わずに1文ずつ実行すると書いている（「multi-statement atomicity is lost, but that's a known D1 limitation」）。このファイルは 1.3.1 と 1.4.0 の npm パッケージで中身が同じで、`handleContentCreate` の違いも slug の作り方の1行だけだった。つまり 1.3.1 でも同じことが起きる。

write-article スキルで記事を作るときは、先に `taxonomy_list_terms` で語があることを確かめる。エラーが返ったら、作り直す前に `content_get` で記事が残っていないかを見る。

## 片付け

- wrangler を止め、プロセスが残っていないこと、8787 番に接続できないこと（curl exit 7）を確かめた。
- リポジトリの `.wrangler/` は作業の前後で22ファイルの sha256 が全部一致した（このたびの確認では使っていない）。

## 戻すとき

`package.json` の2行を 1.3.1 に戻して `npm install` する。DB のマイグレーションは増えていないので、ローカルの DB はそのまま使える。
