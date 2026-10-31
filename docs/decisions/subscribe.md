# メルマガ登録フォームの保存先と Turnstile の扱い

決めた日: 2026-10-31

## 結論

EmDash 1.3.1 には使えるフォーム機能が無いので、登録は Astro の API ルート `src/pages/api/subscribe.ts` で受け、EmDash と同じ D1（バインディング `DB`）の独自テーブル `newsletter_subscribers` に保存する。

## 確かめたこと

| 確かめたこと | 結果 | 出典（2026-10-31 確認） |
|---|---|---|
| ドキュメントにフォーム機能があるか | 一覧（llms.txt）に forms / form submissions のページは無い。メールに関する機能は、プラグインの email capability（トランザクションメールの送信）だけ | https://docs.emdashcms.com/llms.txt 、https://docs.emdashcms.com/plugins/overview/ |
| プラグインレジストリにフォームのプラグインがあるか | 無い。しかもレジストリのプラグインはサンドボックスで動き、sandbox runner が要る | https://docs.emdashcms.com/plugins/registry/ |
| `node_modules/emdash` の中身 | このセッションでは読み取りが権限ルールで拒否されたため、読んでいない。判断はドキュメントだけに基づく | — |

レジストリのプラグインは sandbox runner が前提で、このリポジトリでは `sandboxRunner` と `LOADER` を入れない（CLAUDE.md）ので、仮にあっても使えない。

## 保存先の候補と選んだ理由

| 候補 | 判断 |
|---|---|
| seed に `subscribers` コレクションを足す | 採らない。コレクションは記事と同じ扱いで、公開 API・MCP・管理画面のコンテンツ一覧に混ざる。ドキュメントの公開 API（https://docs.emdashcms.com/reference/api/ ）は読み取りだけで、サイトのコードからエントリを作る方法は書かれていない |
| ネイティブプラグインの storage | 採らない。ドキュメントにある仕組みだが、1テーブルに書くだけのためにプラグインを1つ作ることになり、変更が大きい |
| D1 に独自テーブル（採用） | EmDash のテーブルは `ec_*` などの名前で、`newsletter_subscribers` とはぶつからない。Astro の Cloudflare アダプターでは `import { env } from "cloudflare:workers"` で `DB` に届く（https://docs.astro.build/en/guides/integrations-guide/cloudflare/ ） |

このリポジトリにはサイト用のマイグレーションの仕組みが無い（EmDash のマイグレーションは EmDash 自身のテーブルだけを扱う）。wrangler の D1 マイグレーションを足すと、deploy のたびに `wrangler d1 migrations apply` を別に流す手順が増え、忘れると本番で登録が落ちる。そこで、先に `INSERT` を流し、`no such table: newsletter_subscribers` で失敗したとき（最初の1件）だけ `CREATE TABLE IF NOT EXISTS` を流して入れ直す。ふだんの登録は D1 への問い合わせが1回で済み、手順も増えない（2026-10-31 のレビューで、毎回 `CREATE TABLE` を流していた実装を直した）。スキーマは `src/utils/subscribers.ts` の1か所にある。

## テーブル

```sql
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
	email TEXT PRIMARY KEY NOT NULL,      -- 前後の空白を取り、小文字にしたもの
	created_at TEXT NOT NULL,             -- ISO 8601（UTC）
	consent_at TEXT NOT NULL,             -- 同意した日時。今は created_at と同じ値
	consent_policy_version TEXT NOT NULL  -- 同意したプライバシーポリシーの版（PRIVACY_POLICY_VERSION）
)
```

IP アドレスは保存しない。プライバシーポリシー（`/privacy`）にもそう書いている。

## API の動き

- `POST /api/subscribe`、本文はフォーム（`email`、`consent=yes`、Turnstile が出ているときは `cf-turnstile-response`）。処理の本体は `src/utils/subscribe-handler.ts`（D1 を引数で受け取り、`npm test` から同じ処理を呼ぶ）。
- 本文は 16 KiB まで。`Content-Length` が超えていれば読まずに、`Content-Length` の無い chunked の本文は読んだ量が超えた時点で、`too_large`（413）を返す（`src/utils/request-body.ts`）。
- メールアドレスは ASCII の英数字と `. _ % + -` だけを受け付け、先頭は英数字に限る（`=`、`+`、`-` で始まる値は、一覧を CSV で開いたときに数式として動くため）。ドメインは英数字とハイフンのラベルで、トップレベルは英字2文字以上か `xn--`。制御文字、bidi 制御文字、全角文字は通らない（`src/utils/email.ts`）。
- 問い合わせ先 `PUBLIC_CONTACT_EMAIL` が無いあいだは、削除の依頼を受ける先が無いので登録を受け付けない（`unavailable`）。トップのフォームも入力欄を無効にし、理由を表示する。
- 同じアドレスの2回目は `INSERT … ON CONFLICT(email) DO NOTHING` で何も変えず、1回目と同じ成功応答を返す。登録の有無を外から調べられないようにするため。
- `Accept: application/json` のとき（トップの JS からの送信）は JSON を返す: `{ "ok": true, "message": "…" }` または `{ "ok": false, "error": "<コード>", "message": "…" }`。
- それ以外（JS が動かない通常のフォーム送信）は `303` で `/?subscribe=<コード>#gift` に戻し、トップがフォームの下に結果を出す。
- エラーのコード: `invalid_request` / `invalid_email` / `consent_required` / `captcha_failed`（400）、`too_large`（413）、`captcha_unavailable` / `unavailable`（503）。
- 成功の文言は「登録を受け付けました。メールの配信はまだ始めていません。…」。特典やメルマガを送る仕組みはまだ無いので、送るとは約束しない。
- 別サイトからのフォーム送信は、ルート自身が `Origin` ヘッダーを見て 403 で止める。Astro の `security.checkOrigin` に任せる予定だったが、2026-10-31 に `npx wrangler dev --local` で `Origin: https://evil.example` の POST を送ったところ保存まで通ったので、ルートで確かめるようにした。`Origin` を付けないクライアント（curl など）は通る。そこから守るのは本番の Turnstile。

## Turnstile の扱い

キーは環境変数から読み、リポジトリには入れない。

| `PUBLIC_TURNSTILE_SITE_KEY` | `TURNSTILE_SECRET_KEY` | 開いたホスト | フォーム | サーバー |
|---|---|---|---|---|
| あり | あり | どこでも | ウィジェットを出す | siteverify で必ず検証。応答の `hostname` がリクエストのホスト名と違えば拒否。トークンが無い・拒否は `captcha_failed`、siteverify に届かないときは `captcha_unavailable` |
| なし | なし | `localhost`、`127.0.0.1`、`[::1]` | ウィジェットを出さない | 検証を飛ばして保存する（ローカル開発だけ） |
| なし | なし | それ以外（本番など） | 入力欄を無効にし、理由を出す | 登録を受け付けない（`unavailable`） |
| あり | なし | どこでも | 入力欄を無効にし、理由を出す | 登録を受け付けない（`unavailable`）。ログに足りない名前を出す |
| なし | あり | どこでも | 同上 | 同上 |

片方だけのとき、または本番でキーが2つとも無いときに検証を黙って飛ばすと、Turnstile の手順より先に deploy したときやシークレットの登録を忘れたときに、ボットの登録を通してしまう。だから受け付けない側に倒した（2026-10-31 のレビューで、本番でもキーが無ければ素通しになっていたのを直した）。ホスト名は Cloudflare が Host で Worker を選ぶので、本番のリクエストが `localhost` になることはない。

- 本番: サイトキーは公開してよい値なので、持ち主が Claude に伝え、Claude が `wrangler.jsonc` の `vars` に `PUBLIC_TURNSTILE_SITE_KEY` として書いて push する。ダッシュボードの変数に置くと、次の `wrangler deploy` で消える（docs/decisions/site-url.md の「ダッシュボードで変数を設定しない」）。シークレットだけを、持ち主がダッシュボードで Worker の secret として登録する（CLAUDE.md の秘密情報のルール）。secret は deploy では消えない。どちらも実行時に `cloudflare:workers` の `env` から読む。
- Turnstile を有効にするとプライバシーポリシーに Turnstile の項目が出るので、そのときは `PRIVACY_POLICY_VERSION` を上げる。Web Analytics も同じ。
- ローカルで Turnstile 込みで試すとき: `.dev.vars`（`.gitignore` 済み）に Cloudflare が公開しているテスト用のキーを書く。
  ```
  PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
  TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
  ```
  この組み合わせは常に通る。常に落とすときはシークレットを `2x0000000000000000000000000000000AA` にする。出典: https://developers.cloudflare.com/turnstile/troubleshooting/testing/
  テスト用のシークレットの siteverify は `hostname` に常に `"example.com"` を返し、`metadata.result_with_testing_key: true` を付ける（2026-10-31 に siteverify を直接呼んで確認）。この印があるときだけ hostname の照合を飛ばす。テスト用のキーはどのトークンでも通すので、照合しても守れるものは無い。2026-10-31 にこのキーを `--var` で渡した `wrangler dev --local` で、ダミーのトークン `XXXX.DUMMY.TOKEN.XXXX` の登録が 200、トークンなしが `captcha_failed` になることを確かめた。
- siteverify の仕様（URL、`secret` と `response`、トークンは最大 2048 文字で5分有効・1回だけ）: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- 1回送信するたびに、トップの JS が `turnstile.reset()` でトークンを取り直す。

## 計測（Cloudflare Web Analytics）

`PUBLIC_CF_ANALYTICS_TOKEN`（公開してよい値なので `wrangler.jsonc` の `vars` に書く）があるときだけ、`Base.astro` が公式のビーコン `https://static.cloudflareinsights.com/beacon.min.js` を `data-cf-beacon='{"token": "…"}'` 付きで読み込む（https://developers.cloudflare.com/web-analytics/faq/ ）。無ければ何も出さない。これも実行時に `env` から読む。

## まだやっていないこと

- 配信サービスにはつないでいない（計画の手順5どおり）。特典の送付と配信停止は、配信サービスを決めるときに作る。登録者の一覧は今のところ D1 に直接問い合わせて見る（`npx wrangler d1 execute DB --remote --command "SELECT * FROM newsletter_subscribers"`）。
- 削除の依頼は、プライバシーポリシーの問い合わせ先（`PUBLIC_CONTACT_EMAIL`）宛ての連絡を受けて、運営者が D1 から手で消す。問い合わせ先はまだ決まっていない。決まるまで登録は受け付けない。消したアドレスも D1 の Time Travel（無料プランは7日）には残るので、プライバシーポリシーにそう書いている（https://developers.cloudflare.com/d1/reference/time-travel/ 、2026-10-31 確認）。
- 配信を始める前に、登録済みのアドレスへ確認のメールを1通送り、返事（リンクのクリック）があった人にだけ送るダブルオプトインにする。本番でしか確かめられないので docs/verification/post-deploy.md に入れている。
