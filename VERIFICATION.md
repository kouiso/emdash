# Verification — 2026-10-25 UTC

Implementation: `8ba5abd61dbcf8c252e1bbee16303aa36b8cd6b0`.

## Passed locally

- Official EmDash 1.3.1 starter source retained with MIT notice.
- EmDash / Cloudflare adapter both pinned to 1.3.1; npm lock committed.
- `npm run build` / Worker minification completed.
- `wrangler types` and `npm run typecheck`: 0 errors, 0 warnings.
- `wrangler deploy --dry-run` validated the official build and dedicated bindings.
- Final minified Worker: `/` HTTP 200; `/_emdash/admin` redirects to setup,
  which returns HTTP 200.
- Chromium + Playwright: setup page rendered, title `EmDash Admin`, heading
  `Set up your site`, no JavaScript page errors. No setup form was submitted.
- Unauthenticated `/_emdash/api/content/posts`: HTTP 401 / NOT_AUTHENTICATED.
- Public source secret-pattern scan: no matching credentials or private keys.
- Local Git tree matched the GitHub tree; no task-app files were used or changed.

## Cloudflare resources created

- Worker candidate `emdash-trial-20261021`: **not deployed**. (Corrected 2026-10-31: the owner reports it exists in the dashboard as an empty shell; see below.)
- D1 `emdash-trial-20261021-db`: `a4b9eeef-6a0e-4fb5-9261-bb58a4286214`.
- R2 `emdash-trial-20261021-media`.
- SESSION KV `emdash-trial-20261021-session`: `12fbffdd4ec5416999785817007ee354`.

Existing resources were not changed. No paid subscription, Access, DNS, LOADER,
AI, mail service, new API token, or OAuth grant was added.

## Deployment blocker

The connected Cloudflare plugin can create the assets upload session, but the
asset upload request to
`POST /accounts/<account_id>/workers/assets/upload?base64=true`
with that short-lived upload JWT returned plain `Unauthorized`. Its HTTP status
was not captured because the response was not JSON. The session was still within
its validity period. The root cause is not established; it must not be treated as
a successful upload or deployment.

The plugin's documented `cloudflare.request` interface does not expose arbitrary
Authorization headers for this upload JWT. Local Wrangler is unauthenticated and
the environment's direct Cloudflare API network request is denied with HTTP 403.
No new authentication or alternate hosting route was attempted after the failure.

An attempted new upload-session creation for state reconciliation was denied by
automatic approval review as a prohibited retry. It was not repeated.

All 85 temporary `deploy-*` KV staging keys were deleted; listing this prefix
returned zero remaining keys. The dedicated empty resources above remain for a
later authorized deployment.

## Pending acceptance

- Successful Worker deployment and public HTTP / browser verification.
- Owner completes standard setup and passkey registration, then logs in again.
- Owner saves a synthetic draft and `fixtures/trial.png`, reloads, and verifies
  both persist. No administrator, proxy passkey, or permanent credential was made.

## 2026-10-31 の追記

### Cloudflare の状態（持ち主の別セッションでダッシュボードを見た結果。この作業環境からは確かめていない）

- Worker `emdash-trial-20261021` は中身の無い Worker として存在する。一度も deploy されておらず、バインディングは無く、workers.dev とプレビューの URL は無効で、外から届かない。上の「not created」は誤りだった。
- D1 `emdash-trial-20261021-db` はテーブル 0、R2 `emdash-trial-20261021-media` はオブジェクト 0、KV（SESSION）は空。
- アカウントの workers.dev のサブドメインは `kouiso`。`wrangler.jsonc` の Worker 名 `ai-eng-blog` と合わせて、公開 URL は `https://ai-eng-blog.kouiso.workers.dev`。
- 上の Deployment blocker の節にあった Cloudflare のアカウント ID は `<account_id>` に置き換えた。Git の履歴には残っている。

### ローカルで通したもの（Node 22.22.0、wrangler 4.152.0、emdash 1.4.0）

- `npm test`（vitest 5.0.5）: 8 ファイル、99 件が通った。メールアドレスの検証、本文の 16 KiB の上限（chunked を含む）、Turnstile のモード（localhost だけ素通し）と hostname の照合、D1 への保存（テーブルが無いときだけ作る）、問い合わせ先が無いときに受け付けないこと、サイトの URL、サイトマップの件数を見ている。
- `npm run typecheck`: 0 errors。`npm run build`: 成功。`npx wrangler deploy --dry-run`: `Total Upload: 16066.86 KiB / gzip: 4256.61 KiB`、`env.EMDASH_SITE_URL ("https://ai-eng-blog.kouiso.workers.dev")`。生成された `dist/server/wrangler.json` に `"preview_urls":false` が入っている。
- `npx wrangler dev --local`（`--persist-to` でスクラッチパッドに分けた DB。終わったら止めて消した）を `curl` と Playwright（Chromium）で確かめた。
  - `vars` のまま起動: `Host: evil.example` で開いても canonical、og:url、sitemap の `<loc>` は `https://ai-eng-blog.kouiso.workers.dev/...`。問い合わせ先が無いのでフォームは無効で理由が出て、POST は 503。`/privacy` に `[連絡先]` は無く、Turnstile と Web Analytics の項目は出ない。
  - `--var EMDASH_SITE_URL:http://localhost:8787 --var PUBLIC_CONTACT_EMAIL:owner@example.test`: 最初の登録でテーブルが作られて 200、2件目と同じアドレスの再登録も 200。1 MB の本文は `Content-Length` 付きでも chunked でも 413、15 KB は 200。`=HYPERLINK(...)@a.b`、`<img>@a.b`、`a@b..c`、U+202E、NUL はすべて `invalid_email`。`Host: ai-eng-blog.kouiso.workers.dev` でキーなしの POST は 503。JS を切ったフォーム送信は 303 で `/?subscribe=ok#gift`。
  - 同じ DB で管理画面のセットアップ（仮想認証器のパスキー）を済ませ、ローカル専用の PAT（30 日。DB ごと消した）で MCP から記事と固定ページを作った。空の h2 を含む記事で、目次の2つのリンクがそれぞれ同じ文字の見出しに飛ぶ。直す前の振り方では1つずつずれていた。「検索エンジンに表示しない」を付けた固定ページだけがある状態で、`/sitemap.xml` は `/sitemap-pages.xml`（404）を載せず、載せた子サイトマップはすべて 200。
  - Turnstile のテスト用キーを `--var` で渡したとき: ダミーのトークンの登録は 200、トークンなしは `captcha_failed`。
  - `/`、`/privacy`、`/posts`、`/posts/toc-test`、404 のページを幅 1280 と 375 で開き、横スクロールなし、ページのエラーなし（404 のページ自身の 404 応答を除く）、localhost 以外へのリクエストなし（Google Fonts を読み込んでいない）。
