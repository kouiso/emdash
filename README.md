# EmDash Cloudflare trial

[PBI #1](https://github.com/kouiso/emdash/issues/1) の公開試用環境です。
配備 URL・配備版・実検証結果・本人操作待ちは Issue に記録します。

現在は **未配備** です。接続済みプラグインでアップロードセッションを作成できましたが、
アセット公開 API が `Unauthorized` を返しました。新規認証や回避経路は実施せず、
作業を停止しています。利用可能な公開 URL はまだありません。

## 再現手順

Node.js 24 以上と npm を使用します。

```sh
npm ci
npm run cf:types
npm run typecheck
npm run build
npx wrangler deploy --dry-run
npx wrangler dev --local
```

公開ページは `http://localhost:8787/`、管理画面は
`http://localhost:8787/_emdash/admin`。初回はセットアップ画面へ移動します。
ローカルデータは `.wrangler/` 配下に保存され、Git の対象外です。

対象 Cloudflare アカウントに認証済みの環境で `npm run deploy` を実行します。
この作業環境では CLI が未認証のため、初回配備は接続済み Cloudflare
プラグインの公式 API 操作で実施します。トークンや OAuth grant は新規発行しません。
ビルド済みモジュールと静的アセットを転送し、同じ `wrangler.jsonc` の設定を適用します。

## 構成と出典

- `emdash` / `@emdash-cms/cloudflare`: **1.3.1** 固定。
- `create-emdash@1.3.1` の `cloudflare:starter` に対応する
  [公式 starter](https://github.com/emdash-cms/emdash/tree/12a179389f07821beb819a684e62627e6017ba8d/templates/starter-cloudflare)
  を使用。生成 CLI の tarball 取得が環境接続制限で失敗したため、接続済み GitHub
  プラグインでこの release commit のファイルを取得しています。
- その他の版は `package.json` と `package-lock.json` で固定。
- Worker: `emdash-trial-20261021`
- D1: `emdash-trial-20261021-db`（`DB`）
- R2: `emdash-trial-20261021-media`（`MEDIA`）
- KV: `emdash-trial-20261021-session`（Astro 標準 `SESSION`）
- 静的アセット: Workers Assets（`ASSETS`）
- 公式 scheduled handler と毎分 cron によるメンテナンス・予約公開。
- 初回 HTTP リクエストで標準の core migration と starter schema を適用。
- Worker モジュール配置を保ったまま esbuild で縮小する処理を build に含みます。
- フォントは OS 標準、画像変換は無効。画像の保存・取得には専用 R2 を使います。
- Access、LOADER、AI、メール、独自 DNS、有料 CI は追加しません。
- [MIT ライセンス](./LICENSE) と upstream 著作権表示を保持しています。

## 本人による初回操作

1. Issue に記録された HTTPS の管理画面 URL を開きます。
2. 標準セットアップで管理者情報を入力し、自分の端末でパスキーを登録します。
3. セットアップ完了後、一度ログアウトし、パスキーで再ログインします。
4. Posts でタイトル `試用確認・合成データ` の下書きを保存します。
5. `fixtures/trial.png` をメディアへアップロードし、下書きに設定します。
6. ページを再読み込みし、下書きと画像が取得できることを確認します。

公開サイトなので、先に初期設定を完了した人が管理者になります。
初回パスキー登録と再ログイン、認証後の下書き・画像確認は本人操作待ちです。
試用には架空の情報を使い、実データや秘密を入力しないでください。
代理のパスキーや恒久的な認証情報は作成しません。
