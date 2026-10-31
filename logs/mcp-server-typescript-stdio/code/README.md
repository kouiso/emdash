# code: mcp-server-typescript-stdio

記事 `content/articles/mcp-server-typescript-stdio.md` に載せたコードと1文字も違わないファイル。

| ファイル | 記事での位置 |
|---|---|
| `package.json` | 「設定ファイル2つで準備する」 |
| `tsconfig.json` | 同上 |
| `src/server.ts` | 「サーバー本体は28行に収まる」 |
| `src/check.ts` | 「API キーなしで動作を確かめる」 |
| `compare.mjs` | 「文字数は Intl.Segmenter で数える」 |
| `console-log-experiment.diff` | 「stdout にログを書くと…」で試した1行の差分（記事には差分そのものは載せず、文章で説明） |

実行は、このフォルダの中身を作業フォルダ（セッションの一時フォルダ。記事では `char-count-mcp`）にコピーして行った。依存は `^` なしの完全固定。node_modules と dist はこのフォルダに置いていない。

実行ログ: `../run/`

| ログ | コマンド |
|---|---|
| 01.log | `npm install` |
| 02.log | `npm run build` |
| 03.log | `npm run check` |
| 04.log | `node compare.mjs` |
| 05.log | server.ts の最後の行を `console.log` に変えて build と check |
| 06.log | `console.error` に戻して build と check |
| 07.log | 使い捨ての HOME と CLAUDE_CONFIG_DIR で `claude mcp add/list/get/remove` |
| 08.log | check.ts から `client.onerror` を除き、server.ts を `console.log` にして build と check |
| 09.log | 再確認（2026-10-31）。このフォルダを作業フォルダにコピーし `npm install` のあと `npm run build`、`npm run check`、`node compare.mjs` |
| 10.log | 再確認。server.ts の最後の行を `console.log` に変え（差分もログに記録）、`npm run build` と `npm run check`。記事の stdout の節の出力はこのログから写した |
| 11.log | 再確認。`console.error` に戻して `npm run build` と `npm run check` |
