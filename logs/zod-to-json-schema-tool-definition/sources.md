# sources: zod-to-json-schema-tool-definition

アクセス日はすべて 2026-10-31。番号は記事末尾の出典の表と同じ。行番号は `content/articles/zod-to-json-schema-tool-definition.md`（442行の版）。

| # | 題名 | URL | 確かめた事実 | 記事の根拠にした文（行） |
|---|---|---|---|---|
| 1 | JSON Schema（Zod） | https://zod.dev/json-schema | 冒頭の「Introduced in zod@4.0」（ページの表示はメール保護で隠れており、HTML の `data-cfemail` を復号して `zod@4.0` を確認）。「JSON Schema is a standard for describing the structure of JSON (with JSON)」。`z.toJSONSchema()` の引数。`target` の既定は Draft 2020-12。`io` の既定は出力側の型で、`"input"` で入力側の型になる。入力と出力で型が変わる例に ZodPipe、ZodDefault が挙がる。メタデータはすべて JSON Schema に写る。表せない型（`z.bigint()`、`z.date()`、`z.map()`、`z.transform()` など）は既定で例外。`z.email()` は `format: "email"`、`z.iso.date()` は `format: "date"`。`z.object()` は既定で `additionalProperties: false`、`"input"` のときは書かない。`z.strictObject()` は常に `false` | 70、199、297、299、347、376、382、407 |
| 2 | Metadata and registries（Zod） | https://zod.dev/metadata | 「The .describe() method remains available, but .meta() is the recommended approach」。`.describe()` は description だけを登録する短縮形 | 201 |
| 3 | zod（npm） | https://www.npmjs.com/package/zod | `npm view zod version` が 4.6.7（2026-10-31）。4.6.7 の公開日は 2026-10-12（`npm view zod time`） | 89 |
| 4 | zod-to-json-schema（npm） | https://www.npmjs.com/package/zod-to-json-schema | README（`npm view zod-to-json-schema readme`）の「Notice of deprecation」: 2025年11月から保守しない。zod v4 の標準の変換への移行を勧める。v3.25 からは zod v4 を peer に置けるが、スキーマは v3 のものを渡す | 72 |
| 5 | Define tools（Claude API Docs） | https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools | 中身は同じ URL に `.md` を付けて取得。`name` は `^[a-zA-Z0-9_-]{1,128}$` に合う必要がある。`input_schema` はツールの入力を定義する JSON Schema のオブジェクト。API はツール定義からシステムプロンプトを組み立て、そこに JSON Schema の定義が入る。説明は1ツールあたり3〜4文以上を目安にし、返さない情報や使う場面も書く。前提に「A Claude API key」 | 70、199、303、413 |
| 6 | Tool use with Claude（Claude API Docs） | https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview | `.md` で取得。`tool_use` ブロックに `input` のオブジェクトが入る例。`strict: true` で呼び出しがスキーマに合うことを確実にできる。料金: `tools` パラメーター（名前、説明、スキーマ）を含む入力トークンで課金。ツール用のシステムプロンプトのトークンが足され、Claude Opus 5.5 は auto、none で286トークン | 307、329、413 |
| 7 | Structured outputs（Claude API Docs） | https://platform.claude.com/docs/en/build-with-claude/structured-outputs | `.md` で取得。「JSON Schema limitations」: JSON outputs と strict tool use の両方に当てはまる。オブジェクトの `additionalProperties` は `false` が必須。`minimum`、`maximum`、`multipleOf`、`minLength`、`maxLength` は使えず、使うと 400 エラー。使える文字列の形式に `date`、`email` などが入る | 378、407 |
| 8 | Strict tool use（Claude API Docs） | https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use | `.md` で取得。`strict: true` を付けると、ツールの入力が JSON Schema に合うことが保証される。使えるスキーマの範囲は Structured outputs の「JSON Schema limitations」 | 329 |
| 9 | anthropic-sdk-typescript sdk-v1.3.0 src/helpers/beta/zod.ts | https://github.com/anthropics/anthropic-sdk-typescript/blob/sdk-v1.3.0/src/helpers/beta/zod.ts | 中身は raw.githubusercontent.com の同じタグ・同じパスから取得（github.com の blob ページは curl で 403 だった）。`betaZodTool` は `z.toJSONSchema(inputSchema, { reused: 'ref' })` で変換し（`io` の指定なし）、`jsonSchema.type !== 'object'` なら例外を投げる。直後のコメント「TypeScript doesn't narrow the type after the runtime check, so we need to assert it」と `as` での型の指定。タグ `sdk-v1.3.0` は `git ls-remote --tags` で存在を確認。npm で入れた 1.3.0 の `helpers/beta/zod.mjs` も同じ処理 | 76、234、236、374 |
| 10 | Modules: TypeScript（Node.js v22） | https://nodejs.org/docs/latest-v22.x/api/typescript.html | 中身は同じパスの `.md` を取得。v22.18.0 で型の取り除きが既定で有効になった。型のチェックはしない。`.ts` で `import` を使うには `"type": "module"`。`import` の拡張子は必須で、`allowImportingTsExtensions` で `tsc` が `.ts` の拡張子付きの指定をチェックできる。型だけの `import` には `type` が必要で、`verbatimModuleSyntax` でこの動きに合わせられる。推奨の tsconfig に `noEmit`、`erasableSyntaxOnly`、`verbatimModuleSyntax` | 80、140、162、232 |
| 11 | anthropic-sdk-typescript sdk-v1.3.0 messages.ts | https://github.com/anthropics/anthropic-sdk-typescript/blob/sdk-v1.3.0/src/resources/messages/messages.ts | raw.githubusercontent.com から取得。`Tool.InputSchema` は `type: 'object'` と `properties?`、`required?`、`[k: string]: unknown`。コメントは「JSON schema (https://json-schema.org/draft/2020-12) for this tool's input」。npm の 1.3.0 の `resources/messages/messages.d.ts` も同じ | 234、297 |
| 12 | @anthropic-ai/sdk（npm） | https://www.npmjs.com/package/@anthropic-ai/sdk | `npm view @anthropic-ai/sdk version` が 1.3.0（2026-10-31）。公開日 2026-10-23。peerDependencies に `zod: ^3.25.0 \|\| ^4.0.0` | 89 |

## 出典を付けていない数字と事実（実行ログが根拠）

| 記事の記述（行） | 根拠 |
|---|---|
| 書き写すコードは7ファイル、99行（64） | `code/` の `package.json` 17行、`tsconfig.json` 15行、`src/*.ts` 67行（`wc -l`） |
| `npm install` が3秒（64）、出力（172〜179） | `run/02.log` |
| 型エラーの出力（238〜243） | `run/08.log`（`return json;` に変えた版。差分は `code/extra/return-json.diff`） |
| `npm run typecheck` はエラーなし（254） | `run/03.log`、`run/09.log` |
| ツール定義の出力（256〜293）と、`required` が2つ、`limit` に `default: 10`（301） | `run/04.log` |
| `pattern` が `z.regexes.email` と同じ文字列（299） | `run/10.log`（`true`） |
| `check-input.ts` の出力と、その読み方（335〜343） | `run/06.log` |
| `compare-io.ts` の出力と、その読み方（366〜376） | `run/05.log` |
| `date-error.ts` の出力（402〜405） | `run/07.log` |
| `if` を外して `as` を使う書き方でもエラーが消える（245） | 出典9 の SDK のソースが同じ形（`as typeof jsonSchema & { type: 'object' }`）で型を通している |
