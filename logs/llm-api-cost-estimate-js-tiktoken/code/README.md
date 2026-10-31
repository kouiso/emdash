# code: llm-api-cost-estimate-js-tiktoken

記事に載せたコードと1文字も違わない形で置いている（`lint/check-code-and-outputs.py` で照合）。

| ファイル | 記事の場所 | 実行ログ |
|---|---|---|
| `package.json` | 手順1 | `run/02.log`（`npm install`） |
| `count.ts` | 手順2 | `run/03.log`（`node count.ts`） |
| `estimate.ts` | 手順3 | `run/04.log`（`node estimate.ts`） |
| `unknown-model.ts` | 「js-tiktoken 1.0.21 は gpt-5.6-terra の名前を知らない」 | `run/05.log`（`node unknown-model.ts`） |

記事の外で行った確認（記事の文の根拠に使ったもの）:

- `run/06.log`: `time node estimate.ts`。記事の「手元で8.5秒」の根拠（real 0m8.485s）。
- `run/07.log`: TypeScript 5.9.3 の `tsc --noEmit --strict` で3つの `.ts` を型チェック。Node.js の型の除去は型をチェックしないため、記事のコードが型として正しいことを別に確かめた。
- `run/08.log`: `"type": "module"` を消した `extra/package.notype.json` で `node count.ts`。`MODULE_TYPELESS_PACKAGE_JSON` の警告が出て、数えた結果は同じ。
- `run/09.log`: `unshare -rn` でネットワークの無い名前空間を作り、3つのスクリプトを実行。`fetch` は `EAI_AGAIN` で失敗し、3つの出力は 03〜05 と同じ。

実行は scratchpad の使い捨てフォルダで行い、ログの中のそのパスは `/path/to` に置き換えた。`node_modules` は残していない。
