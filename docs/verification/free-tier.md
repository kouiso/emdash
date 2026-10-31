# Cloudflare Workers の無料枠に収まるかの確認（2026-10-31）

結論: Worker のサイズは 15.69 MiB で、無料枠の上限 64 MiB の約 25% です。サイズは問題ありません。CPU 時間（1回の呼び出しで 10 ms）は、ローカルでは測れません。本番に deploy したあと、下の「本番で確かめること」で確かめます。まだ deploy していないので、本番での確認は済んでいません。

## 根拠にした上限（https://developers.cloudflare.com/workers/platform/limits/ 、2026-10-31 確認）

| 項目 | 無料枠の上限 | 表の文言 |
|---|---|---|
| Worker のサイズ | 64 MiB（圧縮前） | 「There is no compressed size limit. Only the uncompressed bundle size counts.」 |
| HTTP リクエスト1回の CPU 時間 | 10 ms | 「CPU time per HTTP request \| 10 ms」 |
| Cron Trigger 1回の CPU 時間 | 10 ms | 「CPU time per Cron Trigger \| 10 ms」 |
| アカウントあたりの Cron Trigger の数 | 5 | このリポジトリは `* * * * *` の1つだけ |
| 1日のリクエスト数 | 100,000（UTC の0時にリセット） | 超えると Error 1027 |
| 静的アセット | 1版あたり 20,000 ファイル、1ファイル 25 MiB | Worker のサイズとは別に数える |

CPU 時間を超えると、Cloudflare はクライアントに Error 1102（「Worker exceeded resource limits」）を返します。ダッシュボードでは「Exceeded CPU Time Limits」と出ます（同じページ）。10 ms の上限は Cron Trigger にもかかります。このリポジトリでは毎分の Cron Trigger が予約公開とメンテナンスを担っているので、cron が上限を超えると予約した記事が公開されません。

## サイズの測定

`.gitignore` に `bundled/` を足してから、次を実行しました（emdash 1.4.0、wrangler 4.152.0、Node 22.22.0）。

```sh
npm run build
npx wrangler deploy --outdir bundled/ --dry-run
```

出力（抜粋）:

```
Total Upload: 16062.39 KiB / gzip: 4255.24 KiB
--dry-run: exiting now.
```

| 値 | 計算 |
|---|---|
| 圧縮前 16062.39 KiB = 15.69 MiB | 64 MiB に対して 24.5% |
| gzip 4255.24 KiB = 4.16 MiB | 無料枠に圧縮後の上限は無い。参考値 |

`bundled/` には 652 ファイル、合計 16,448,004 バイトが出力されました。`.map` ファイルは0件です。大きいのは `chunks/entrypoints_*.mjs`（698,327 バイト）と、管理画面の各言語の `messages-*.mjs`（約 540〜630 KB）でした。`bundled/` は確認用の出力なので、コミットしません。

## 本番で確かめること（deploy のあと、Claude が行う）

ローカルの `wrangler dev` は CPU 時間の上限で止めないので、ここは本番でしか確かめられません。

1. 全ページを巡回して Error 1102 が出ないことを確かめる
   - `https://<公開 URL>/sitemap.xml` から全 URL を集め、`/`、`/posts`、各記事、`/tag/*`、`/category/*`、`/privacy`、`/og/posts/<slug>.svg` を1回ずつ取得します。
   - 503 や本文に `1102`、`Worker exceeded resource limits` を含む応答が1件も無いことを確かめます。
   - 記事が増えたら、同じ巡回をやり直します（一覧ページは記事の数に比例して重くなるため）。
2. ダッシュボードで呼び出しの状態を見る
   - Workers & Pages で `ai-eng-blog` を選び、Metrics の Summary で Errors を選びます。呼び出しの状態（Invocation Statuses）は Success、Client disconnected、Worker threw exception、Exceeded resources、Internal error に分かれます。CPU 時間の超過は「Exceeded resources」に入ります（https://developers.cloudflare.com/workers/observability/metrics-and-analytics/ 、2026-10-31 確認）。
   - 同じページの CPU Time per execution も見ます。ただし docs によると、上位の分位は上限を超えて見えても、エラーにならないことがあります。判断は Exceeded resources の件数で行います。
3. cron の実行結果を見る
   - Worker の Settings → Trigger Events → View events で、毎分の Cron Trigger の直近 100 回の結果を見ます（https://developers.cloudflare.com/workers/configuration/cron-triggers/ 、2026-10-31 確認）。それより前の結果は Workers Logs（`wrangler.jsonc` で `observability` を有効にしてある）で見ます。
   - 新しい Cron Trigger が動き出すまで最大 15 分かかります（https://docs.emdashcms.com/deployment/cloudflare/ ）。deploy から 15 分以上たってから見ます。
   - 予約公開の時刻を過ぎた記事が公開されたかも、あわせて確かめます。

docs で確かめられなかったこと: Cron Trigger の呼び出しが1日 100,000 リクエストの上限に数えられるかどうかは、limits のページに書かれていませんでした。毎分の cron は1日 1,440 回です。
