# EMDASH_SITE_URL の置き場所と、パスキーが最初のアドレスに縛られる理由（2026-10-31）

結論: 本番の公開 URL は `wrangler.jsonc` の最上位の `vars` に `EMDASH_SITE_URL` として書く。今は `REPLACE_WITH_WORKERS_DEV_URL` という仮の値が入っている。持ち主は本番で最初の管理者を作る前に、これを実際の `https://ai-eng-blog.<アカウントのサブドメイン>.workers.dev` に書き換えてコミットする。workers.dev の URL は推測で書かない。

## EmDash がサイトの URL をどこから読むか

| 置き場所 | 扱い | 出典 |
|---|---|---|
| `astro.config.mjs` の `emdash({ siteUrl })` | `EMDASH_SITE_URL` より優先され、ビルドに焼き込まれる。プレビューにも同じ値が入るので、プレビューでのサインインが失敗する。このリポジトリでは使わない | https://docs.emdashcms.com/deployment/cloudflare/ |
| 環境変数 `EMDASH_SITE_URL`（または `SITE_URL`） | Cloudflare では最上位の `vars` に置くよう書かれている。EmDash は実行時に `process.env` から読む | 同上、`.agents/skills/building-emdash-site/references/configuration.md` |
| どれも無い | セットアップを実行したアドレスを、サイトのオリジンとして記録する | 同上 |

`siteUrl` が効く範囲は、パスキー、CSRF のオリジン照合、OAuth のリダイレクト、ログイン後のリダイレクト、MCP の discovery、sitemap、robots.txt、JSON-LD です（configuration.md）。

secret にしない理由: URL は秘密ではありません。Cloudflare の docs が secret にするよう書いているのは秘密の値だけです（deployment/cloudflare の「Worker secrets」）。

ダッシュボードの Variables and Secrets に置かない理由: Workers Builds は push のたびに `npx wrangler deploy` を実行します。Wrangler はダッシュボードで変えた変数を deploy のときに上書きし、残すには `keep_vars = true` が要ります（https://developers.cloudflare.com/workers/wrangler/configuration/ ）。設定をリポジトリにまとめておけば、上書きで消える心配がありません。

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

- 仮の値のまま本番に deploy しても、エラーは出ません。値は黙って無視され、セットアップを開いたアドレスが記録されます。書き換え忘れに気づける仕組みはないので、README の deploy 手順に書き換えの手順を入れています。
- 実際の URL に書き換えたあとは、ローカルの `wrangler dev` でも本番の URL が使われます。ローカルでセットアップやパスキーの登録をするときは、`npx wrangler dev --local --var EMDASH_SITE_URL:http://localhost:8787` のように上書きします。`.dev.vars` に書いても同じです。`.dev.vars` は `.gitignore` 済みです。

## 独自ドメインに移すとき

手順は README の「独自ドメインに移す」にあります。出典は https://docs.emdashcms.com/guides/change-domain/ と https://docs.emdashcms.com/deployment/cloudflare/ です（どちらも 2026-10-31 確認）。
