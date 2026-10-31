# sources: zod-validate-llm-json-output

番号は記事の「出典」の表（425〜435行目）と同じ。アクセス日はすべて 2026-10-31。frontmatter の `sources` も同じ9件（並びも同じ）。行番号は 437行の原稿。

取得の方法:

- 1〜4（zod.dev）は HTML のページが HTTP 200 で取れることを確かめたうえで、同じ内容の原稿をタグ `v4.6.7` の raw ファイル（`https://raw.githubusercontent.com/colinhacks/zod/v4.6.7/packages/docs/content/<page>.mdx`）で読んだ。zod.dev は main ブランチの原稿を出している。main と v4.6.7 の原稿を比べると、`error-formatting.mdx`、`error-customization.mdx` は同じで、`basics.mdx` は main に `.validate()` の段落が1つ足されているだけだった（記事はこの段落を使っていない）。
- 5 は GitHub の blob のページがこの環境から 403 だったので、同じタグの raw ファイル（`https://raw.githubusercontent.com/colinhacks/zod/v4.6.7/packages/zod/src/v4/core/errors.ts`、HTTP 200）を読んだ。タグ `v4.6.7` が存在することは `git ls-remote --tags` で確かめた（コミット b500a2ee）。
- 6 は npm のページが 403 だったので、`npm view zod version`（4.6.7）、`npm view zod dist-tags`（latest: 4.6.7）、`npm view zod@4.6.7 license`（MIT）で確かめた。タグ `v4.6.7` の `LICENSE` も MIT License だった。
- 7 と 9 は `https://platform.claude.com/docs/en/<path>.md`（同じページの Markdown 版）を curl で取得して読んだ。HTML のページも HTTP 200。
- 8 は HTML を取得して読んだ。

| # | URL | 題名 | 確かめた事実 | 記事のどの文の根拠か |
|---|---|---|---|---|
| 1 | https://zod.dev/basics | Basic usage \| Zod | Handling errors 節「use the `.safeParse()` method to get back a plain result object containing either the successfully parsed data or a `ZodError`. The result type is a discriminated union」、`if (!result.success) { result.error } else { result.data // { username: string; xp: number } }`。`.parse()` の失敗で `error.issues` に issue の配列が入る例。Inferring types 節の `z.infer<typeof Player>` | 57行目（例外を投げない、`success`、`error.issues`）、147行目3文目（`z.infer`）、198行目（`result.data` に値、型） |
| 2 | https://zod.dev/error-formatting | Formatting errors \| Zod | `z.strictObject` に余分なキーを渡した例で、issue `{ code: 'unrecognized_keys', keys: [ 'extraKey' ], path: [], … }`。`z.prettifyError()` は「a human-readable string representation of the error」で、`✖ … → at username` の形 | 259行目3文目、298行目 |
| 3 | https://zod.dev/api | Defining schemas \| Zod | Objects 節「By default, unrecognized keys are *stripped* from the parsed result」。`z.strictObject`「throws an error when unknown keys are found」。Enums 節の `z.enum` | 75行目、147行目2文目、371行目 |
| 4 | https://zod.dev/error-customization | Customizing errors \| Zod | Global error customization 節「To specify a global error map, use `z.config()`」。Internationalization 節で locales は `zod/locales` から import して `z.config(en())` のように渡す。使えるロケールの一覧に「`ja` — Japanese」 | 337行目、367行目1文目 |
| 5 | https://github.com/colinhacks/zod/blob/v4.6.7/packages/zod/src/v4/core/errors.ts | colinhacks/zod v4.6.7 packages/zod/src/v4/core/errors.ts | `export type $ZodIssue` は11の型の合併（`invalid_type`、`too_big`、`too_small`、`invalid_format`、`not_multiple_of`、`unrecognized_keys`、`invalid_union`、`invalid_key`、`invalid_element`、`invalid_value`、`custom`）。`$ZodIssueBase` に `path`、`message`。`$ZodIssueTooBig` に `origin`、`maximum`、`inclusive`。`$ZodIssueInvalidValue` に `values` | 69行目「11種類」、表の `code` の意味（71〜76行目） |
| 6 | https://www.npmjs.com/package/zod | zod (npm) | latest は 4.6.7（2026-10-12 公開）。license は MIT | 90行目2文目、404行目2文目 |
| 7 | https://platform.claude.com/docs/en/build-with-claude/structured-outputs | Structured outputs | Why use structured outputs 節「Without structured outputs, Claude can generate malformed JSON responses or invalid tool inputs…: Missing required fields, Inconsistent data types」。JSON Schema limitations の Not supported「Numerical constraints (such as `minimum`, `maximum`, `multipleOf`)」「String constraints (`minLength`, `maxLength`)」。How SDK transformation works「Most SDK helpers… Remove unsupported constraints… Update descriptions by adding each unsupported constraint to the field's description」。Invalid outputs 節の max_tokens「The output might be incomplete and not match your schema」と Enum value casing「don't guarantee the capitalization of string `enum` and `const` values」「Compare enum values case-insensitively」。TypeScript の `zodOutputFormat()`「`parse()` validates the response」 | 82〜86行目、221行目3文目、240行目3〜4文目 |
| 8 | https://nodejs.org/docs/latest-v22.x/api/typescript.html | Node.js v22 Modules: TypeScript | History「v22.18.0 Type stripping is enabled by default.」。Type stripping 節「Node.js will replace inline type annotations with whitespace, and no type checking is performed.」 | 92行目 |
| 9 | https://platform.claude.com/docs/en/about-claude/pricing | Pricing | Model pricing の表で「Claude Haiku 5.5 (for prompts up to 100,000 tokens)」は Base input $0.10 / MTok、Output $0.50 / MTok | 406行目 |

## 出典ではなく実行ログを根拠にした断定

| 文（行番号は原稿） | 根拠 |
|---|---|
| 90行目1文目 動かした環境 | `run/*.log` の見出し `node: v22.22.0 / npm: 10.9.4`、`code/package.json` の `"zod": "4.6.7"` |
| 92行目 型の確認は `tsc` 7.0.2 で行った | `run/13.log`（`Version 7.0.2`、`tsc_exit=0`） |
| 120〜128行目 `npm install` の出力 | `run/03.log` |
| 189〜196、210〜219、229〜238、248〜257、267〜290行目の出力 | `run/05.log`〜`09.log` |
| 202行目 4つの見本がそれぞれ別の `code` を返した | `run/06.log`〜`09.log` |
| 292行目 3つ入れて3件返った、最初の違反で止まらない | `run/09.log` |
| 294行目 `inclusive: true` と `<=3`、`received undefined`、`[ 'tags', 1 ]` | `run/09.log` と `code/samples.ts` の `many` |
| 322〜331、358〜365、394〜396行目の出力 | `run/10.log`〜`12.log` |
| 367行目2文目 再依頼の文まで日本語に変わる | `run/11.log`（`z.config(ja())` のあと `z.prettifyError` の文が日本語）と出典4（`z.config` は全体の設定） |
| 398行目 `confidence` が消え、issues にも残らない | `run/12.log`（`true` と `confidence` の無い `data`） |
| 404行目 通信は `npm install` だけ、ネットワークの無い環境でも `node` のコマンドがすべて成功 | `run/14.log`（`unshare -rn` の中で8つの `node` コマンドが exit=0、外への `fetch` は `EAI_AGAIN`） |
