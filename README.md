# ai-eng-blog

AI をアプリに組み込む開発を、LLM の API を初めて触る人が順番に学べるブログです。記事のテーマ選びから執筆、公開までを Claude Code に任せられるかどうかを確かめる PoC を兼ねています。人の手が要る作業は、下の「ユーザーにしかできないこと」にまとめています。

Claude 向けの運用ルールは [CLAUDE.md](./CLAUDE.md)、EmDash のコードを書くときのルールは [AGENTS.md](./AGENTS.md) にあります。

## 使っているもの

| 部分 | 中身 |
|---|---|
| CMS | [EmDash](https://github.com/emdash-cms/emdash) 1.3.1（Astro 製。MCP サーバーを内蔵） |
| フレームワーク | Astro 7.3.2、`@astrojs/cloudflare` 14.3.1 |
| 実行環境 | Cloudflare Workers |
| データ | D1（記事などの DB）、R2（画像）、KV（セッション） |
| 予約公開とメンテナンス | EmDash 公式の scheduled handler と毎分の Cron Trigger |
| 文章の規約 | [tech-writing-pack](./vendor/tech-writing-pack/)（`vendor/` に同梱） |

版は `package.json` と `package-lock.json` で固定しています。Node.js は 24 以上が必要です。

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

## ユーザーにしかできないこと

どれもアカウントの持ち主の操作、ブラウザでのログイン、ユーザー自身の判断のどれかが要る作業です。Claude はこのリポジトリの中から代わりに実行できません。

1. Cloudflare の Workers と GitHub リポジトリをつなぐ
   - Cloudflare のダッシュボードで Workers & Pages を開き、このリポジトリを接続します。
   - つないだあとは、push するたびに自動で deploy されます。
   - 画面の項目名が変わっていたら、Cloudflare のドキュメント「Workers Builds」の手順に従ってください。
2. 本番の EmDash 管理画面で最初のユーザーを作る
   - `https://<ドメイン>/_emdash/admin` を開き、標準のセットアップで管理者情報を入力して、自分の端末でパスキーを登録します。
   - 一度ログアウトし、パスキーで再ログインできることを確かめます。
   - Posts でタイトル `試用確認・合成データ` の下書きを保存し、`fixtures/trial.png` をメディアへアップロードします。再読み込みして、どちらも残っていることを確かめます（VERIFICATION.md の受け入れ条件）。
   - 公開サイトなので、先にセットアップを終えた人が管理者になります。deploy が済んだらすぐに行ってください。
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
- Worker `emdash-trial-20261021` は作成も deploy もされていません。静的アセットは Workers Assets（`ASSETS`）で配る設定です。
- リポジトリ名と Worker 名は、まだ旧名（`emdash`、`emdash-trial-20261021`）のままです。`package.json` と `package-lock.json` の `name` は `ai-eng-blog` に揃えました。
- Access、LOADER、AI、メール、独自 DNS、有料 CI は追加していません。フォントは OS 標準、画像変換は無効です。
- ローカルでのビルド、型チェック、`wrangler deploy --dry-run` は 2026-10-25 に通っています（VERIFICATION.md）。

上の「ユーザーにしかできないこと」の1が済めば、deploy は GitHub への push から行われる見込みです。今回の `Unauthorized` がその経路でも起きるかは、まだ確かめていません。

## クレジット

- EmDash の公式 Cloudflare starter（[`emdash@1.3.1` の release commit](https://github.com/emdash-cms/emdash/tree/12a179389f07821beb819a684e62627e6017ba8d/templates/starter-cloudflare)）をもとにしています。Copyright 2026 Cloudflare Inc.、[MIT ライセンス](./LICENSE)です。変更点は [NOTICE.md](./NOTICE.md) にあります。
- 文章の規約は [hana652/tech-writing-pack](https://github.com/hana652/tech-writing-pack) を `vendor/tech-writing-pack/` に変更なしで同梱しています。ライセンスは [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) です。取り込んだ版と出典は [vendor/NOTICE.md](./vendor/NOTICE.md) にあります。
