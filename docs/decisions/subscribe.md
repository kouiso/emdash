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

このリポジトリにはサイト用のマイグレーションの仕組みが無い（EmDash のマイグレーションは EmDash 自身のテーブルだけを扱う）。wrangler の D1 マイグレーションを足すと、deploy のたびに `wrangler d1 migrations apply` を別に流す手順が増え、忘れると本番で登録が落ちる。そこで、書き込みの直前に `CREATE TABLE IF NOT EXISTS` を流す。D1 への問い合わせが1回増えるだけで、手順は増えない。スキーマは `src/utils/subscribers.ts` の1か所にある。

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

- `POST /api/subscribe`、本文はフォーム（`email`、`consent=yes`、Turnstile が出ているときは `cf-turnstile-response`）。
- 同じアドレスの2回目は `INSERT … ON CONFLICT(email) DO NOTHING` で何も変えず、1回目と同じ成功応答を返す。登録の有無を外から調べられないようにするため。
- `Accept: application/json` のとき（トップの JS からの送信）は JSON を返す: `{ "ok": true, "message": "…" }` または `{ "ok": false, "error": "<コード>", "message": "…" }`。
- それ以外（JS が動かない通常のフォーム送信）は `303` で `/?subscribe=<コード>#gift` に戻し、トップがフォームの下に結果を出す。
- エラーのコード: `invalid_request` / `invalid_email` / `consent_required` / `captcha_failed`（400）、`captcha_unavailable` / `unavailable`（503）。
- 別サイトからのフォーム送信は、Astro の `security.checkOrigin`（server 出力では既定で有効）が 403 で止める。

## Turnstile の扱い

キーは環境変数から読み、リポジトリには入れない。

| `PUBLIC_TURNSTILE_SITE_KEY` | `TURNSTILE_SECRET_KEY` | フォーム | サーバー |
|---|---|---|---|
| あり | あり | ウィジェットを出す | siteverify で必ず検証。トークンが無い・拒否は `captcha_failed`、siteverify に届かないときは `captcha_unavailable` |
| なし | なし | ウィジェットを出さない | 検証を飛ばして保存する（ローカル開発向け） |
| あり | なし | ウィジェットを出さない | 登録を受け付けない（`unavailable`）。ログに足りない名前を出す |
| なし | あり | ウィジェットを出さない | 同上 |

片方だけのときに検証を黙って飛ばすと、本番でシークレットの登録を忘れたままボットの登録を通してしまうので、受け付けない側に倒した。

- 本番: サイトキーは Worker の変数、シークレットは Worker の secret として、ユーザーが Cloudflare のダッシュボードで登録する（CLAUDE.md の秘密情報のルール）。どちらも実行時に `cloudflare:workers` の `env` から読むので、ビルドし直さなくても変更が効く。
- ローカルで Turnstile 込みで試すとき: `.dev.vars`（`.gitignore` 済み）に Cloudflare が公開しているテスト用のキーを書く。
  ```
  PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
  TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
  ```
  この組み合わせは常に通る。常に落とすときはシークレットを `2x0000000000000000000000000000000AA` にする。出典: https://developers.cloudflare.com/turnstile/troubleshooting/testing/
- siteverify の仕様（URL、`secret` と `response`、トークンは最大 2048 文字で5分有効・1回だけ）: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- 1回送信するたびに、トップの JS が `turnstile.reset()` でトークンを取り直す。

## 計測（Cloudflare Web Analytics）

`PUBLIC_CF_ANALYTICS_TOKEN` があるときだけ、`Base.astro` が公式のビーコン `https://static.cloudflareinsights.com/beacon.min.js` を `data-cf-beacon='{"token": "…"}'` 付きで読み込む（https://developers.cloudflare.com/web-analytics/faq/ ）。無ければ何も出さない。これも実行時に `env` から読む。

## まだやっていないこと

- 配信サービスにはつないでいない（計画の手順5どおり）。特典の送付と配信停止は、配信サービスを決めるときに作る。登録者の一覧は今のところ D1 に直接問い合わせて見る（`npx wrangler d1 execute DB --remote --command "SELECT * FROM newsletter_subscribers"`）。
- 削除の依頼は、プライバシーポリシーの [連絡先] 宛ての連絡を受けて、運営者が D1 から手で消す。連絡先はまだ決まっていない。
