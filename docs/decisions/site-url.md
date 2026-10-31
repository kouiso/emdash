# EMDASH_SITE_URL の置き場所と、パスキーが最初のアドレスに縛られる理由（2026-10-31）

結論: 本番の公開 URL は `wrangler.jsonc` の最上位の `vars` に `EMDASH_SITE_URL` として書く。値は `https://ai-eng-blog.kouiso.workers.dev`（Worker 名 `ai-eng-blog` と、持ち主が Cloudflare のダッシュボードで確かめたアカウントのサブドメイン `kouiso` から決まる。2026-10-31 に持ち主の別セッションから受け取った値で、この作業環境からは Cloudflare に入れないので確かめていない）。以前は `REPLACE_WITH_WORKERS_DEV_URL` という仮の値を置いていた。

サイトのコードが canonical、og:url、OGP 画像の URL、`/sitemap.xml` と `/static-sitemap.xml` に書く絶対 URL も、同じ値から作る（`src/utils/site-origin.ts` の `getSiteOrigin()`）。値が無いか URL の形でないときだけ、開いたアドレスを使う。

Worker 名かアカウントのサブドメインを変えると、公開 URL も変わる。そのときは最初の管理者を作る「前」に、この値を新しい URL に書き換えて push する。作ったあとで変えるときは、README の「独自ドメインに移す」と同じ手順でパスキーを作り直す。

## EmDash がサイトの URL をどこから読むか

| 置き場所 | 扱い | 出典 |
|---|---|---|
| `astro.config.mjs` の `emdash({ siteUrl })` | `EMDASH_SITE_URL` より優先され、ビルドに焼き込まれる。プレビューにも同じ値が入るので、プレビューでのサインインが失敗する。このリポジトリでは使わない | https://docs.emdashcms.com/deployment/cloudflare/ |
| 環境変数 `EMDASH_SITE_URL`（または `SITE_URL`） | Cloudflare では最上位の `vars` に置くよう書かれている。EmDash は実行時に `process.env` から読む | 同上、`.agents/skills/building-emdash-site/references/configuration.md` |
| どれも無い | セットアップを実行したアドレスを、サイトのオリジンとして記録する | 同上 |

`siteUrl` が効く範囲は、パスキー、CSRF のオリジン照合、OAuth のリダイレクト、ログイン後のリダイレクト、MCP の discovery、sitemap、robots.txt、JSON-LD です（configuration.md）。

secret にしない理由: URL は秘密ではありません。Cloudflare の docs が secret にするよう書いているのは秘密の値だけです（deployment/cloudflare の「Worker secrets」）。

ダッシュボードの Variables and Secrets に置かない理由: Workers Builds は push のたびに `npx wrangler deploy` を実行し、そのたびにダッシュボードの変数が `vars` で上書きされます。詳しくは下の「ダッシュボードで変数を設定しない」にあります。

## パスキーが最初のアドレスに縛られる理由

パスキーは、作ったサイトのドメインに結び付けて保存されます。フィッシング対策のための仕組みで、別のドメインでは同じパスキーが使えません（https://docs.emdashcms.com/guides/authentication/ ）。EmDash は `EMDASH_SITE_URL` が無いと、セットアップを開いたアドレスをオリジンとして記録します。セットアップで作ったパスキーは、そのアドレスでしか使えません。セットアップの後で `EMDASH_SITE_URL` を別のドメインに変えると、サインインの場所もそのドメインに移ります（deployment/cloudflare の「Custom domains」）。

このため次の2点を守ります。

- 最初の管理者は、本番の URL でセットアップする。
- `EMDASH_SITE_URL` は、セットアップを開いた URL と完全に同じ値にする（`https://`、末尾のスラッシュなし）。

## 仮の値でローカルの開発とビルドが壊れないことの確認（2026-10-31、Node 22.22.0）

`npm run build` のあと、`--persist-to` でスクラッチパッドに分けた DB で `npx wrangler dev --local` を動かして確かめました。

| 条件 | 観察した結果 |
|---|---|
| `vars` が `REPLACE_WITH_WORKERS_DEV_URL` | wrangler の表示は `env.EMDASH_SITE_URL ("REPLACE_WITH_WORKERS_DEV_URL")`。`/robots.txt` は `Sitemap: http://127.0.0.1:8791/sitemap.xml`、`/.well-known/oauth-protected-resource` は `"resource":"http://127.0.0.1:8791/_emdash/api/mcp"`。URL の形でない値は使われず、開いたアドレスがそのまま使われた |
| 同じ仮の値で、仮想認証器を使って空の DB からセットアップ | セットアップ後に `needsSetup:false`。cookie を消して `/_emdash/admin/login` に移り、パスキーで再ログインして `/_emdash/admin` に入れた。ページのエラーは 0 件 |
| `--var EMDASH_SITE_URL:https://example.invalid` | `Sitemap: https://example.invalid/sitemap.xml`。URL の形の値は使われる |
| `vars` を `https://example.invalid` にしてビルド | `Sitemap: https://example.invalid/sitemap.xml` |
| 上に `--var EMDASH_SITE_URL:http://localhost:8795` を付ける | `Sitemap: http://localhost:8795/sitemap.xml` |
| 上の代わりに `.dev.vars` に `EMDASH_SITE_URL=http://localhost:8796` | `Sitemap: http://localhost:8796/sitemap.xml` |

`npm run build`、`npm run cf:types`、`npm run typecheck`、`npx wrangler deploy --dry-run` も仮の値のまま通りました。

注意が2つあります。

- URL の形でない値のまま本番に deploy しても、エラーは出ません。値は黙って無視され、セットアップを開いたアドレスが記録されます。2026-10-31 に実際の URL へ書き換えたので、今はこの状態ではありません。
- 実際の URL を書いたので、ローカルの `wrangler dev` でも本番の URL が使われます。ローカルでセットアップやパスキーの登録をするときと、canonical や sitemap をローカルのアドレスで確かめたいときは、`npx wrangler dev --local --var EMDASH_SITE_URL:http://localhost:8787` で上書きします。`.dev.vars` に書いても同じです。`.dev.vars` は `.gitignore` 済みです。

## ダッシュボードで変数を設定しない

`wrangler deploy` は、`wrangler.jsonc` の `vars` でダッシュボードの変数を上書きします。ダッシュボードで足した変数を残すには `keep_vars = true` が要ります（https://developers.cloudflare.com/workers/wrangler/configuration/ 、2026-10-31 確認）。このリポジトリは `keep_vars` を使いません。設定の正本をリポジトリの1か所にしておくためです。

- 公開してよい値（`EMDASH_SITE_URL`、Turnstile のサイトキー `PUBLIC_TURNSTILE_SITE_KEY`、Web Analytics のトークン `PUBLIC_CF_ANALYTICS_TOKEN`、問い合わせ先 `PUBLIC_CONTACT_EMAIL`）は、持ち主が Claude に伝え、Claude が `wrangler.jsonc` の `vars` に書いて push します。
- 秘密の値（`TURNSTILE_SECRET_KEY`）だけを、持ち主がダッシュボードの Variables and Secrets で secret として登録します。secret は `wrangler secret delete` を実行しない限り deploy で消えません（同じページ）。

## Version URL を切る

`wrangler.jsonc` に `"preview_urls": false` を入れています。Version URL（旧称 Preview URL）は、有効なら新しい版ごとに公開の URL ができ、その版の設定と同じリソース（本番の D1）を使います。省略すると wrangler は今の設定を変えず、設定が無ければ `workers_dev` に従って有効になります（https://developers.cloudflare.com/workers/configuration/previews/ 、2026-10-31 確認）。有効のままだと、本番の URL で最初の管理者を作る前に、別の公開 URL から同じ D1 のセットアップ画面に届いてしまいます。

## 独自ドメインに移すとき

手順は README の「独自ドメインに移す」にあります。出典は https://docs.emdashcms.com/guides/change-domain/ と https://docs.emdashcms.com/deployment/cloudflare/ です（どちらも 2026-10-31 確認）。
