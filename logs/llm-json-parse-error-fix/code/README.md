# code/

記事 `content/articles/llm-json-parse-error-fix.md` に載せたコードを、記事の形のまま置いています。

| ファイル | 記事の中の位置 |
|---|---|
| `package.json` | 「動かした環境と準備」 |
| `samples.ts`、`reproduce.ts` | 「4つの見本で出る SyntaxError」 |
| `extract-json.ts`、`fix.ts` | 「Unexpected token は JSON の前後を切り出して直す」 |
| `stop-reason.ts`、`naive-repair.ts` | 「Unterminated string は stop_reason を見て取り直す」 |

記事と1文字も違わないことは `../lint/check-code-and-outputs.py` で確かめています（結果は `../lint/check-code-and-outputs.txt`）。依存パッケージは無いので `npm install` はしません。

`extra/` は記事に載せない確認用です。

- `run-all.sh`: 作業場所に記事どおり `llm-json-parse` フォルダを作り、上のファイルを置いて、記事の順に `node` コマンドを実行し、`../run/01.log`〜`06.log` を書きます。作業場所には、セッションの一時フォルダを使い、終わったら消しました。
- `full-messages.ts`: `reproduce.ts` が表示の前に切ったエラーの文の全体と、`position` の指す位置を出します（`../run/06.log`）。
- `tsconfig.typecheck.json`: TypeScript 7.0.2 で型を確かめる設定です（`../run/07.log`）。
- `edge-brace.ts`: 説明の文の中に `{` があると切り出す範囲がずれる、という本文の1文を確かめます（`../run/09.log`）。

`../run/08.log` は、ネットワークの無い名前空間（`unshare -rn`）で記事の `node` コマンド4つを動かした記録です。外への `fetch` が失敗する環境でも4つとも終了コード 0 でした。
