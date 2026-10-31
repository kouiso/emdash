# ai-eng-blog

AI をアプリに組み込む開発を、LLM の API を初めて触る人が順番に学べるブログです。記事のテーマ選びから執筆、公開までを Claude Code に任せられるかどうかを確かめる PoC を兼ねています。人の手が要る作業は、下の「ユーザーにしかできないこと」にまとめています。

Claude 向けの運用ルールは [CLAUDE.md](./CLAUDE.md)、EmDash のコードを書くときのルールは [AGENTS.md](./AGENTS.md) にあります。

## 使っているもの

| 部分 | 中身 |
|---|---|
| CMS | [EmDash](https://github.com/emdash-cms/emdash) 1.4.0（Astro 製。MCP サーバーを内蔵。版を上げた経緯は [docs/decisions/emdash-version.md](./docs/decisions/emdash-version.md)） |
| フレームワーク | Astro 7.3.2、`@astrojs/cloudflare` 14.3.1 |
| 実行環境 | Cloudflare Workers |
| データ | D1（記事などの DB）、R2（画像）、KV（セッション） |
| 予約公開とメンテナンス | EmDash 公式の scheduled handler と毎分の Cron Trigger |
| 文章の規約 | [tech-writing-pack](./vendor/tech-writing-pack/)（`vendor/` に同梱） |

版は `package.json` と `package-lock.json` で固定しています。Node.js は 24 系を使います（`.nvmrc` に `24`、`package.json` の `engines` に `24.x`）。Cloudflare Workers Builds は `.nvmrc` を読んでビルドの Node.js の版を決めます（https://developers.cloudflare.com/workers/ci-cd/builds/build-image/ 、2026-10-31 確認）。

## ローカルで動かす

npm を使います。

```sh
npm ci
npm run cf:types
npm run typecheck
npm run build
npx wrangler deploy --dry-run
npx wrangler dev --local
```

公開ページは `http://localhost:8787/`、管理画面は `http://localhost:8787/_emdash/admin` で開きます。初回は管理画面がセットアップ画面に移ります。ローカルのデータは `.wrangler/` に保存され、Git には入りません。

ローカルでの動作確認は、下の「ユーザーにしかできないこと」が済んでいなくても Claude が自分で行います。

`wrangler.jsonc` の `EMDASH_SITE_URL` を本番の URL に書き換えたあとは、ローカルでも本番の URL が使われ、ローカルでのセットアップやパスキーの登録が本番のドメインに結び付いてしまいます。そのあとは `npx wrangler dev --local --var EMDASH_SITE_URL:http://localhost:8787` で起動します（[docs/decisions/site-url.md](./docs/decisions/site-url.md)）。

## 記事の任意フィールド

記事（`posts`）には、本文とは別に次の3つのフィールドがあります。どれも入力しなければ記事ページに出ません。

| フィールド | 管理画面の表示名 | 型 | 記事ページでの出方 |
|---|---|---|---|
| `cost_estimate` | 料金の目安 | `string` | タイトルの下の枠に「料金の目安」として出る |
| `run_environment` | 動かした環境 | `string` | 同じ枠に「動かした環境」として出る |
| `verified_at` | 動作確認日（YYYY-MM-DD） | `string`（`YYYY-MM-DD` の形か空欄だけ受け付ける） | 公開日の横に「動作確認日 2026年10月30日」の形で出る |

管理画面で動作確認日の欄を消して保存すると、空の文字列 `""` が送られます。検証の正規表現を `^(\d{4}-\d{2}-\d{2})?$` にして空の文字列も通しているのは、そのときに保存全体が 400 で失敗しないようにするためです。記事ページは空の値を未入力として扱います。

動作確認日を `datetime` にしていないのは、EmDash の `datetime` が時刻付きの瞬間を UTC で保存する型で、暦の日付には `string` を使うようドキュメントに書かれているためです（https://docs.emdashcms.com/reference/field-types/ 、2026-10-31 確認）。

フィールドの定義は `seed/seed.json` にあります。seed が使われるのは、空の DB でセットアップ画面を終える前の最初の1回だけです。すでにセットアップを済ませた DB（ローカルの `.wrangler/` を含む）には、seed を変えても追加されません。その場合は管理画面の Content Types から足すか、`npx emdash schema add-field posts cost_estimate --type string --label "料金の目安" --url <サイトの URL>` のように CLI で足します（https://docs.emdashcms.com/deployment/schema-evolution/ 、2026-10-31 確認）。`emdash-env.d.ts` は `npm run dev` を起動したときに、ローカルの DB のスキーマから作り直されます（https://docs.emdashcms.com/reference/cli/ の「Generated files」）。

## OGP 画像

記事の OGP 画像は、SEO パネルの OG Image があればそれを使い、無ければ `/og/posts/<slug>.svg` でタイトルから作る SVG を使います。X や Facebook は SVG を表示しないので、SNS に画像を出したい記事は OG Image に PNG か JPEG を設定します。Worker の中で PNG に変換しない理由は、測った値とあわせて [docs/decisions/ogp.md](./docs/decisions/ogp.md) にあります。

## 本番に deploy する（持ち主の作業）

Cloudflare のダッシュボードでの操作と、パスキーを登録する端末が要るので、持ち主が行います。手順 1〜7 は途中で止めずに続けて行います。公開されたサイトでは、セットアップを最初に終えた人が管理者になるためです。

1. 公開 URL を確かめて書き換える
   - ダッシュボードの Workers & Pages を開き、「Your subdomain」に出ているサブドメインを確かめます（https://developers.cloudflare.com/workers/configuration/routing/workers-dev/ 、2026-10-31 確認）。
   - 公開 URL は `https://ai-eng-blog.<そのサブドメイン>.workers.dev` です。
   - Claude にこの URL を伝えます。Claude が `wrangler.jsonc` の `EMDASH_SITE_URL` の `REPLACE_WITH_WORKERS_DEV_URL` をこの URL に書き換えて push します。
   - 書き換えずに deploy してもエラーは出ません。値は黙って無視されます。必ず先に書き換えます。理由は [docs/decisions/site-url.md](./docs/decisions/site-url.md) にあります。
2. Worker をつなぐ
   - Workers & Pages で Create application を選び、GitHub を選んでこのリポジトリを選びます（https://developers.cloudflare.com/workers/ci-cd/builds/ 、2026-10-31 確認）。
   - Worker 名は `ai-eng-blog` にします。`wrangler.jsonc` の `name` と違うと、ビルドが `The name in your Wrangler configuration file (<Worker name>) must match the name of your Worker.` で失敗します（https://developers.cloudflare.com/workers/ci-cd/builds/troubleshoot/ ）。
   - 設定は次のとおりです（https://developers.cloudflare.com/workers/ci-cd/builds/configuration/ ）。

     | 項目 | 値 |
     |---|---|
     | Git branch | `main` |
     | Build command | `npm run build` |
     | Deploy command | `npx wrangler deploy` |
     | Root directory | 空欄（リポジトリの直下） |

   - Node.js の版は `.nvmrc` の `24` が使われます。npm の版は `package.json` の `packageManager` で決まり、`engines` では決まりません。このリポジトリには `packageManager` が無いので、ビルドイメージに入っている npm が使われます（https://developers.cloudflare.com/workers/ci-cd/builds/build-image/ ）。
   - Save and Deploy を選びます。
3. deploy が済んだことを確かめる
   - ビルドのログが成功で終わり、`https://ai-eng-blog.<サブドメイン>.workers.dev/` が表示されることを確かめます。
4. すぐに管理画面を開く
   - `https://ai-eng-blog.<サブドメイン>.workers.dev/_emdash/admin` を開きます。手順 1 で書き換えた URL と完全に同じアドレスで開きます。パスキーは作ったアドレスでしか使えません（https://docs.emdashcms.com/guides/authentication/ ）。
   - 「Set up your site」のセットアップ画面が出たら、手順 5 に進みます。
   - **次のどちらかになったら、そこで止めます。** セットアップ画面が出ずにサインイン画面になった場合と、自分の知らない管理者がいる場合です。どちらも、自分より先に誰かがセットアップを終えたことを意味します。記事は公開せず、MCP もつながず、下の「D1 を作り直す」に進みます。
5. 最初の管理者を作る
   - サイトの名前を入れ、自分のメールアドレスと名前を入れます。
   - 「Create passkey」で、いま使っている端末にパスキーを登録します。
6. パスキーを2つにする
   - Settings → Security の Register Passkey で、別の端末（PC とスマートフォンなど）にもう1つ登録します。1人10個まで登録できます。パスキーが1つしかないと、その端末をなくしたときに入れなくなります。メールを設定していないこのサイトでは、復旧のマジックリンクも使えません（https://docs.emdashcms.com/guides/authentication/ 、2026-10-31 確認）。
   - 一度サインアウトし、2つのパスキーのそれぞれでサインインできることを確かめます。
7. 受け入れ条件を確かめる（VERIFICATION.md）
   - Posts でタイトル `試用確認・合成データ` の下書きを保存し、`fixtures/trial.png` をメディアにアップロードします。再読み込みして、どちらも残っていることを確かめます。

Git branch 以外のブランチに push すると、Workers Builds はプレビューを作ります（https://developers.cloudflare.com/workers/ci-cd/builds/ ）。プレビューはトップレベルのバインディングと `vars` を引き継がず、プレビューの URL は公開されます（https://docs.emdashcms.com/deployment/cloudflare/ ）。プレビューの URL でセットアップはしません。

### D1 を作り直す（手順 4 で止めたとき）

知らない人が管理者になった DB は使い続けません。記事を1本も入れていないうちに、空の DB に替えます。

1. ダッシュボードの D1 SQL database を開き、`emdash-trial-20261021-db` を選びます。
2. Settings で Delete を選び、確認の欄にデータベース名 `emdash-trial-20261021-db` を入れて削除します。
3. D1 SQL database で Create Database を選び、同じ名前 `emdash-trial-20261021-db` で作ります（手順の出典は https://developers.cloudflare.com/d1/get-started/ 、2026-10-31 確認）。
4. 新しいデータベースの ID（データベースの画面に出る UUID）を Claude に伝えます。Claude が `wrangler.jsonc` の `database_id` を書き換えて push します。名前とバインディング `DB` は変えません。
5. push で deploy されたら、すぐに上の手順 4 からやり直します。

R2 の `emdash-trial-20261021-media` と KV の SESSION はそのまま使います。知らない人がメディアを上げていた場合は、R2 の中身も消します。

### 独自ドメインに移す

最初は workers.dev で動かし、あとで独自ドメインに移すときの手順です。出典は https://docs.emdashcms.com/guides/change-domain/ と https://docs.emdashcms.com/deployment/cloudflare/ の「Custom domains」です（どちらも 2026-10-31 確認）。

先に知っておくことが2つあります。

- パスキーは作ったアドレスでしか使えません。workers.dev で作ったパスキーは、独自ドメインでは使えません。新しいドメインで作り直します。
- `EMDASH_SITE_URL` を別のドメインに変えると、サインインの場所もそのドメインに移ります。`EMDASH_SITE_URL` を設定しているあいだ、管理画面の Settings → General にある Site URL は、設定した値を表示します。メールやプラグインが使うアドレスを変えるには、設定を書き換えて deploy し直します。

手順です。

1. ドメインを用意する
   - ドメインは、Worker と同じ Cloudflare アカウントで有効になっている必要があります。
2. ドメインを Worker につなぐ
   - Claude が `wrangler.jsonc` に `"routes": [{ "pattern": "<新しいドメイン>", "custom_domain": true }]` を足して push します。`EMDASH_SITE_URL` はこの時点では workers.dev のままにします。
   - deploy のあと、workers.dev と新しいドメインの両方でサイトが出ることを確かめます。workers.dev を残しておくと、DNS の問題とアプリの問題を見分けられます。
   - `https://<新しいドメイン>/_emdash/admin` でサインイン画面が出れば、ドメインの準備はできています。
3. 古いアドレスでサインインしたまま、新しいアドレスでのサインインを用意する
   - workers.dev の管理画面でサインインしておきます。
4. `EMDASH_SITE_URL` を新しいドメインに変える
   - Claude が `EMDASH_SITE_URL` を `https://<新しいドメイン>` に書き換えて push します。
5. 新しいドメインでパスキーを登録し直す
   - Settings → General の Site URL の下にある「Continue on」を選びます。このボタンは、サインインしているアドレスが Site URL と違うときに出ます。
   - 新しいアドレスのサインイン画面で Continue を選びます。このリンクは1回だけ使えて、5分で切れます。
   - Settings → Security が開くので、Register Passkey で新しいアドレス用のパスキーを登録します。手順 6 と同じく、2つ目の端末でも登録します。
   - メールの設定は要りません。
6. 新しいドメインでサインインし直せることを確かめる
   - サインアウトし、新しいドメインの2つのパスキーのそれぞれでサインインできることを確かめます。
   - すべての管理者が新しいドメインでサインインできるようになるまで、古いアドレスを外しません。
7. MCP のコネクタを付け替える
   - claude.ai のカスタムコネクタの URL を `https://<新しいドメイン>/_emdash/api/mcp` に変えて、OAuth のログインをやり直します（MCP の discovery も `EMDASH_SITE_URL` に従うため）。

sitemap は最大1時間、robots.txt は最大1日、古い内容がキャッシュから返ることがあります。

## ユーザーにしかできないこと

どれもアカウントの持ち主の操作、ブラウザでのログイン、ユーザー自身の判断のどれかが要る作業です。Claude はこのリポジトリの中から代わりに実行できません。

1. Cloudflare の Workers と GitHub リポジトリをつなぐ
   - 手順は下の「本番に deploy する」の手順 1〜3 です。
2. 本番の EmDash 管理画面で最初の管理者を作る
   - 手順は下の「本番に deploy する」の手順 4〜7 です。Worker をつないだら、間を空けずに続けて行います。
3. claude.ai のカスタムコネクタに EmDash の MCP を追加する
   - claude.ai の設定からカスタムコネクタを追加し、URL に `https://<ドメイン>/_emdash/api/mcp` を入れます。
   - OAuth のログインを1回通します。PAT は作りません。
4. `ANTHROPIC_API_KEY` を Claude Code 環境の secrets に登録する
   - 記事のコードを実際に動かすためのキーです。かかる料金は数百円程度の見込みです。
   - 登録されるまでは、API を呼ぶコードの入った記事は下書きで止まります。キーの要らないテーマ（MCP サーバー、zod での検証、RAG の検索部分）から先に書きます。
5. Search Console、Web Analytics、Turnstile の登録
   - Google Search Console にサイトを追加し、所有権の確認を済ませます。
   - Search Console のデータを Claude が読めるように認証します。手でトークンを作って渡す方法は使わず、ユーザーがログインして許可する方法（コネクタの OAuth など）にします（CLAUDE.md の秘密情報のルール）。具体的な方法は「実装時にドキュメントで確認する」項目です。
   - Cloudflare のダッシュボードで Web Analytics を有効にします。ビーコンのトークンの発行が要るかどうかを含め、手順は「実装時にドキュメントで確認する」項目です。
   - Cloudflare のダッシュボードで Turnstile のサイトキーとシークレットキーを発行します。シークレットキーは、Worker の secret として登録します（ダッシュボードの Variables and Secrets）。リポジトリには入れません。具体的な登録手順は「実装時にドキュメントで確認する」項目です。
6. キーワードの CSV を渡す
   - メインキーワード6語のそれぞれをラッコキーワードにかけ、書き出した CSV を渡します。置き場所と名前は [keywords/README.md](./keywords/README.md) にあります。
   - CSV が1つも無いあいだ、Claude は記事を書き始めません。
7. パイロット記事の報告に返事をする
   - 最初の1本を予約公開まで通したら、Claude がゲートの結果と気になった点を報告します。
   - 返事があるまで、Claude は2本目に進みません。

## 個人情報と法律まわり

メルマガ登録でメールアドレスを集めるため、次の3点を決めています。前の2点はこれから作る部分で、3点目は今回は作りません。

- プライバシーポリシーのページを置き、集める情報（メールアドレス）と使い道（メルマガと特典の送付）を書きます。
- 登録フォームには Cloudflare Turnstile（無料）を入れ、ボットの登録を防ぎます。
- 特定商取引法に基づく表記は今回の範囲外です。教材を売り始めるときに用意します。

配信サービスにはまだつなぎません。フォームの保存先は、EmDash にフォーム機能があればそれを使い、なければ D1 に保存します。どちらにするかは実装時にドキュメントで確認します。

## 役に立ったかを測る

PoC の目的は、自動化した執筆と公開が役に立つかを判断することです。そのために次の3つを入れます。

- Cloudflare Web Analytics（無料）でページビューを取ります（上の作業5で有効にします）。
- Google Search Console にサイトを登録します（上の作業5）。
- 公開から30日後に、表示回数、クリック数、記事ごとの流入を Search Console API で取得して報告します。この取得は、最初の記事を予約公開した時点で Claude Code の scheduled task を1回分作って起動します。認証は上の作業5で済ませたものを使います。

## 現状

2026-10-30 時点では、サイトは Cloudflare にまだ deploy されていません。公開 URL はありません。経緯は [PBI #1](https://github.com/kouiso/emdash/issues/1) と [VERIFICATION.md](./VERIFICATION.md) に記録しています。

- 接続済みの Cloudflare プラグインでアセットのアップロードセッションは作れましたが、アセットのアップロード API が `Unauthorized` を返しました。原因はわかっていません。
- この作業環境では Wrangler の CLI が未認証で、Cloudflare API への直接のリクエストは HTTP 403 で拒否されます。失敗のあと、新しい認証や別の公開経路は試していません。
- 作成済みのリソースは次のとおりです。中身は空で、あとで正式に deploy するときに使います。
  - D1 `emdash-trial-20261021-db`（バインディング `DB`）
  - R2 `emdash-trial-20261021-media`（バインディング `MEDIA`）
  - KV `emdash-trial-20261021-session`（Astro 標準の `SESSION`）
- Worker はまだ作成も deploy もされていません。`wrangler.jsonc` の Worker 名は `ai-eng-blog` です（2026-10-31 に旧名 `emdash-trial-20261021` から変更。旧名の Worker は一度も作られていないので、消すものはありません）。D1、R2、KV は上の旧名のリソースをそのまま使い、名前、ID、バインディングは変えていません。静的アセットは Workers Assets（`ASSETS`）で配る設定です。
- Workers Builds では、ダッシュボードの Worker 名と `wrangler.jsonc` の `name` が一致しないとビルドが失敗します（https://developers.cloudflare.com/workers/ci-cd/builds/troubleshoot/ 、2026-10-31 確認）。Worker をつなぐときは `ai-eng-blog` という名前にします。
- リポジトリ名は旧名（`emdash`）のままです。`package.json` と `package-lock.json` の `name` は `ai-eng-blog` です。
- Access、LOADER、AI、メール、独自 DNS、有料 CI は追加していません。フォントは OS 標準、画像変換は無効です。
- ローカルでのビルド、型チェック、`wrangler deploy --dry-run` は 2026-10-25 に通っています（VERIFICATION.md）。

上の「ユーザーにしかできないこと」の1が済めば、deploy は GitHub への push から行われる見込みです。今回の `Unauthorized` がその経路でも起きるかは、まだ確かめていません。

## クレジット

- EmDash の公式 Cloudflare starter（[`emdash@1.3.1` の release commit](https://github.com/emdash-cms/emdash/tree/12a179389f07821beb819a684e62627e6017ba8d/templates/starter-cloudflare)）をもとにしています。Copyright 2026 Cloudflare Inc.、[MIT ライセンス](./LICENSE)です。変更点は [NOTICE.md](./NOTICE.md) にあります。
- 文章の規約は [hana652/tech-writing-pack](https://github.com/hana652/tech-writing-pack) を `vendor/tech-writing-pack/` に変更なしで同梱しています。ライセンスは [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) です。取り込んだ版と出典は [vendor/NOTICE.md](./vendor/NOTICE.md) にあります。
