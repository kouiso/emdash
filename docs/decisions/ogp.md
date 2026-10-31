# OGP 画像を PNG にするか（記事タイトルから作る画像）

決めた日: 2026-10-31

## 結論

`/og/posts/<slug>.svg` は SVG のまま残す。PNG に変換する処理は入れない。

PNG に変換するとバンドルの大きさは無料プランの上限に収まるが、1回の変換にかかる CPU 時間が、無料プランの「1リクエスト 10 ms」をローカルの workerd で測った値で4倍以上超える。毎回の変換でも、R2 に保存して1記事1回だけ変換する形でも、初回のリクエストで上限を超える。

X や Facebook は og:image の SVG を表示しないので、SNS に画像を出したい記事は、今と同じく SEO パネルの OG Image に PNG か JPEG を設定する。記事ページはそちらがあればそれを優先する（`src/pages/posts/[slug].astro` の `seo.ogImage ?? ...`）。

## Cloudflare の上限（2026-10-31 確認）

出典: https://developers.cloudflare.com/workers/platform/limits/

| 項目 | Workers Free | Workers Paid |
|---|---|---|
| Worker size（展開後） | 64 MiB | 64 MiB |
| CPU time / HTTP リクエスト | 10 ms | 5 min（既定 30 秒） |
| Worker startup time | 1 秒 | 1 秒 |
| Memory | 128 MB | 128 MB |

圧縮後の大きさの上限は無い（「There is no compressed size limit. Only the uncompressed bundle size counts.」）。CPU 時間については「上限をたまに超える程度なら許す余地がある」とだけ書かれていて、どこまで許されるかの数字は無い。上限を超え続けると Error 1102 で打ち切られる。

## 試した方法

新しい依存を最小にするため、satori（JSX から SVG を作るライブラリ）は使わず、今の SVG をそのまま `@resvg/resvg-wasm` 2.6.2（SVG を PNG に変換する WebAssembly 版のライブラリ）に渡した。`workers-og` 0.0.27 と `@cf-wasm/og` 0.5.0 も中で resvg の WebAssembly を使っていて、satori の分だけ重くなる。

日本語のフォントは Worker に同梱せず、Google Fonts の CSS API に `text=` で使う文字だけを指定して取る（https://developers.google.com/fonts/docs/getting_started の「text=」、2026-10-31 確認）。User-Agent を付けずに取ると `format('truetype')` の TTF が返り、resvg に渡せた。4行のタイトルで 700 と 800 の2つの太さを取って、それぞれ約 26 KB だった。フォントの取得はネットワーク待ちなので CPU 時間には数えられない。

変換した PNG は 1200×630、55,290 バイトで、今の SVG と同じ見た目で日本語も崩れずに描けた。

## 測った値

測定は scratchpad の使い捨てのディレクトリで行い、リポジトリの依存は変えていない。

### バンドルの大きさ（`wrangler deploy --dry-run`）

| 対象 | Total Upload | gzip |
|---|---|---|
| 今のサイト（`npm run build` のあと） | 15,816.08 KiB | 4,236.46 KiB |
| resvg-wasm だけを読み込む最小の Worker | 2,438.91 KiB | 940.76 KiB |

足しても約 18.3 MiB で、64 MiB の上限に収まる。大きさは問題にならない。

### CPU 時間

Cloudflare 上では `performance.now()` が I/O のあとにしか進まないが、ローカルの workerd（`wrangler dev`）では I/O が無くても進むので、CPU だけを使う処理はローカルで測れる（https://developers.cloudflare.com/workers/runtime-apis/performance/ 、2026-10-31 確認）。上の最小の Worker を `wrangler dev --local` で動かし、同じ4行のタイトルの SVG を1リクエストの中で5回続けて変換した。

| 測った場所 | WebAssembly の初期化 | 1回目の変換 | 2〜5回目の変換 |
|---|---|---|---|
| workerd（wrangler 4.152.0）1リクエスト目 | 1 ms | 124 ms | 40〜44 ms |
| workerd 2・3リクエスト目 | — | 42 ms、51 ms | 41〜68 ms |
| 参考: Node.js 22.22.0 | 35.3 ms | 99.6 ms | 32.3〜34.1 ms |

温まった状態でも1回の変換に約 40 ms かかり、10 ms の4倍になる。isolate を立ち上げた直後の1回目は 124 ms で、12倍を超える。これは手元のマシンでの値で、Cloudflare のマシンで同じ値になるとは限らない。Cloudflare 上で測るには deploy が要り、今は deploy できていない（README の「現状」）。

## 採らなかった案

| 案 | 判断 |
|---|---|
| リクエストのたびに PNG に変換する | 採らない。毎回 40 ms 前後かかり、10 ms を超え続けるので 1102 で打ち切られる |
| 1記事1回だけ変換して R2（`MEDIA`）に保存し、2回目からはそれを返す | 今は採らない。変換は記事の公開やタイトルの変更ごとに1回で済むが、その1回は上限の4〜12倍になる。Cloudflare が許す「たまの超過」の幅は文書に数字が無く、最初に画像を取りに来た X や Facebook のクローラーが 1102 を受けると、そのリンクのカードは画像なしになる。deploy できたら、本番で実際の CPU 時間を測ってから判断し直す |
| Workers Paid に上げる | 採らない。CLAUDE.md の「Cloudflare の無料枠に収める」に反する |

## 今後の選択肢

- 記事を公開するときに、Claude がローカルで同じ SVG を PNG に変換し、メディアにアップロードして SEO パネルの OG Image に設定する。Worker の CPU 時間を使わない。EmDash の MCP でメディアのアップロードと SEO の設定ができるかは、まだ確かめていない。
- deploy できたら、R2 に保存する案を本番で試し、1回の変換の CPU 時間を Workers Logs（invocation log に CPU 時間が出る）で確かめる。
