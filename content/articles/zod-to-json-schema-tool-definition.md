---
title: "zod のスキーマから JSON Schema を作ってツール定義に使う【zod v4 の z.toJSONSchema】"
slug: "zod-to-json-schema-tool-definition"
description: "zod 4.6.7 の z.toJSONSchema で、zod のスキーマを JSON Schema に変換します。変換した結果は、Claude API のツール定義の input_schema に入れます。io の指定で必須の項目が変わる点と、変換できない型の扱いを、API キーを使わずに動かした出力付きで書いています。"
tags: ["構造化出力", "zod", "TypeScript"]
main_keyword: "構造化出力"
target_query: null
course_step: 2
cost_estimate: "記事のコードは API を呼ばないので無料です。作ったツール定義を Claude API に送ると、ツールの名前、説明、スキーマが入力トークンとして料金に数えられます。"
run_environment: "Node.js 22.22.0、zod 4.6.7、Anthropic SDK 1.3.0、tsc 7.0.2"
verified_at: "2026-10-31"
prev: "zod-validate-llm-json-output"
next: "llm-json-parse-error-fix"
sources:
  - url: "https://zod.dev/json-schema"
    title: "JSON Schema | Zod"
    accessed: 2026-10-31
  - url: "https://zod.dev/metadata"
    title: "Metadata and registries | Zod"
    accessed: 2026-10-31
  - url: "https://www.npmjs.com/package/zod"
    title: "zod (npm)"
    accessed: 2026-10-31
  - url: "https://www.npmjs.com/package/zod-to-json-schema"
    title: "zod-to-json-schema (npm)"
    accessed: 2026-10-31
  - url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools"
    title: "Define tools | Claude API Docs"
    accessed: 2026-10-31
  - url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview"
    title: "Tool use with Claude | Claude API Docs"
    accessed: 2026-10-31
  - url: "https://platform.claude.com/docs/en/build-with-claude/structured-outputs"
    title: "Structured outputs | Claude API Docs"
    accessed: 2026-10-31
  - url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use"
    title: "Strict tool use | Claude API Docs"
    accessed: 2026-10-31
  - url: "https://github.com/anthropics/anthropic-sdk-typescript/blob/sdk-v1.3.0/src/helpers/beta/zod.ts"
    title: "anthropic-sdk-typescript sdk-v1.3.0 src/helpers/beta/zod.ts"
    accessed: 2026-10-31
  - url: "https://nodejs.org/docs/latest-v22.x/api/typescript.html"
    title: "Modules: TypeScript | Node.js v22 Documentation"
    accessed: 2026-10-31
  - url: "https://github.com/anthropics/anthropic-sdk-typescript/blob/sdk-v1.3.0/src/resources/messages/messages.ts"
    title: "anthropic-sdk-typescript sdk-v1.3.0 src/resources/messages/messages.ts"
    accessed: 2026-10-31
  - url: "https://www.npmjs.com/package/@anthropic-ai/sdk"
    title: "@anthropic-ai/sdk (npm)"
    accessed: 2026-10-31
ai_assisted: true
needs_api_key: false
status: draft
publish_at: null
updated: 2026-10-31
---

Claude API のツール定義に書く `input_schema` は、zod のスキーマから作れます。使うのは zod v4 の `z.toJSONSchema()` です。変換のときに `{ io: "input" }` を渡すと、`.default()` の項目は必須の一覧から外れます。モデルにとっては、省略してよい項目として伝わります。

この記事では、注文を検索するツールのスキーマを zod で1回だけ書きます。そこからツール定義を組み立て、SDK の型で確かめるまでを実際の出力付きで載せました。モデルが返した入力も、同じスキーマで検証します。

確かめたのは、変換と型のチェックと、手で作った見本の検証までです。作った定義を Claude API に送る操作は、API キーが無いので実行していません。API がこの定義をそのまま受け付けるかどうかは、この記事では確かめていません。

対象は、TypeScript で何か作ったことがあり、zod でオブジェクトのスキーマを書いたことがある人です。書き写すコードは7ファイルで、合わせて99行あります。いちばん時間のかかるコマンドは `npm install` で、2026-10-31 の実測では3秒でした。

講座の前の記事は、[zod での検証](/posts/zod-validate-llm-json-output)です。`safeParse` のエラーの読み方は、前の記事に書いています。

## z.toJSONSchema は zod 4.0 で入った JSON Schema への変換関数

zod は、バージョン 4.0 から JSON Schema への変換を標準で持っています（出典1）。JSON Schema は、JSON の形を JSON で書くための規格です（出典1）。Claude API のツール定義では、`input_schema` に JSON Schema を書きます（出典5）。ツールが受け取る入力の形を表す項目です（出典5）。

zod v3 のスキーマには、`zod-to-json-schema` という別のパッケージがあります（出典4）。そのパッケージの README は、2025年11月で保守をやめたと書いています（出典4）。代わりに勧めているのが、zod v4 の標準の変換です（出典4）。

zod でスキーマを書く利点は、同じスキーマを2つの用途に使えることにあります。1つはモデルに渡すツール定義で、もう1つはモデルが返した入力の検証です。JSON Schema を手で書き、zod のスキーマも別に書くと、片方だけ直したときに2つが食い違います。この記事の書き方なら、直すのは zod のスキーマ1か所で済みます。

Anthropic の TypeScript SDK には、`betaZodTool` という関数もあります（出典9）。中では同じ `z.toJSONSchema()` を呼んでいます（出典9）。この記事では、変換の結果を自分の目で確かめるために、変換の部分を自分で書きます。

## 前提となる環境

Node.js は 22.18.0 以上を使ってください。22.18.0 から、Node.js は `.ts` のファイルの型の部分を取り除いて、そのまま実行します（出典10）。型のチェックはしないので、型は `tsc` で別に確かめます（出典10）。この記事のコードは、Node.js 22.22.0 と npm 10.9.4 で動かしました。

| パッケージ | バージョン |
|---|---|
| `zod` | 4.6.7 |
| `@anthropic-ai/sdk` | 1.3.0 |
| `typescript`（開発用） | 7.0.2 |
| `@types/node`（開発用） | 22.20.5 |

zod と SDK は、2026-10-31 に npm の latest でした（出典3、出典12）。SDK は、ツール定義の型を使うためだけに入れます。

### 作り終えたときのファイル構成

できあがる作業フォルダの中身は、次のとおりです。

```text
zod-tool-schema/
  package.json
  tsconfig.json
  src/
    schema.ts
    tool.ts
    check-input.ts
    compare-io.ts
    date-error.ts
```

`node_modules/` は `npm install` が作ります。

## 1. 準備は設定ファイル2つと npm install

作業フォルダ `zod-tool-schema` と、その中の `src/` を作ります。

```bash
mkdir -p zod-tool-schema/src
cd zod-tool-schema
```

作業フォルダに `package.json` を置きます。バージョンに `^` を付けていないのは、記事と同じバージョンを入れるためです。

```json
{
  "name": "zod-tool-schema",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "typecheck": "tsc"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "1.3.0",
    "zod": "4.6.7"
  },
  "devDependencies": {
    "@types/node": "22.20.5",
    "typescript": "7.0.2"
  }
}
```

`.ts` のファイルで `import` を書くには、`"type": "module"` が要ります（出典10）。

同じフォルダに `tsconfig.json` を置きます。`tsc` には型のチェックだけをさせ、JavaScript のファイルは書き出させません。

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"]
}
```

Node.js で動かすなら、`import` には `.ts` の拡張子まで書きます（出典10）。その書き方を `tsc` に認めさせるのが、`allowImportingTsExtensions` です（出典10）。`verbatimModuleSyntax` も、Node.js の動きに `tsc` を合わせる設定です（出典10）。型だけの `import` に `type` が無いと、`tsc` がエラーを出します（出典10）。

ファイルを置いたら、依存を入れます。

```bash
npm install
```

手元の出力では、脆弱性の警告は0件でした。

```text
added 13 packages, and audited 14 packages in 3s

1 package is looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

## 2. 入力の形は schema.ts に zod で1回だけ書く

例にするのは、ネットショップの注文を検索するツールです。受け取る入力は、メールアドレス、注文の状態、返す件数の3つにしました。`src/schema.ts` に、次のスキーマを書きます。

```ts
import * as z from "zod";

export const searchOrdersInput = z.object({
  email: z.email().meta({ description: "注文した人のメールアドレス" }),
  status: z.enum(["pending", "shipped", "cancelled"]).meta({
    description: "注文の状態。pending は発送前、shipped は発送済み、cancelled はキャンセル済み",
  }),
  limit: z.number().int().min(1).max(50).default(10).meta({
    description: "返す注文の最大件数。省略すると10件",
  }),
});
```

`.meta()` に書いた値は、変換した JSON Schema にそのまま写ります（出典1）。ツール定義の JSON Schema は、API がモデル向けに組み立てるシステムプロンプトに入ります（出典5）。項目の `description` も、モデルが読む文の一部です。

`.describe()` でも説明は付けられます。zod の公式ドキュメントは `.meta()` を勧めているので、こちらを使いました（出典2）。

`limit` には `.default(10)` を付けています。モデルが `limit` を省いても、zod で検証した結果には10が入ります。この性質が、手順3と手順4の両方に関わってきます。

## 3. 変換した結果を toInputSchema でツール定義に入れる

`src/tool.ts` で、スキーマを変換してツール定義を組み立てます。

```ts
import type Anthropic from "@anthropic-ai/sdk";
import * as z from "zod";
import { searchOrdersInput } from "./schema.ts";

function toInputSchema(schema: z.ZodType): Anthropic.Tool.InputSchema {
  const json = z.toJSONSchema(schema, { io: "input" });
  if (json.type !== "object") {
    throw new Error(`ツールの入力は object のスキーマにします（実際は ${String(json.type)}）`);
  }
  return { ...json, type: "object" };
}

const searchOrdersTool: Anthropic.Tool = {
  name: "search_orders",
  description:
    "ネットショップの注文を、注文した人のメールアドレスと注文の状態で検索する。新しい注文から順に、最大 limit 件の注文番号と注文日を返す。",
  input_schema: toInputSchema(searchOrdersInput),
};

console.log(JSON.stringify(searchOrdersTool, null, 2));
```

1行目は `import type` にしています。Node.js は型を取り除くときに `import type` の行も消します（出典10）。そのため、実行時に SDK は読み込まれません。SDK の型だけを借りて、定義の形が合っているかを `tsc` に確かめさせる使い方です。

`toInputSchema` の中の `if` は、変換した結果の `type` を調べています。SDK の型が、`type` に `'object'` しか認めないからです（出典11）。SDK の `betaZodTool` も、同じ確認をしてから定義を作ります（出典9）。

`if` を通っても、変数 `json` の型は変わりません。SDK のソースにも、同じ理由を書いたコメントがあります（出典9）。そのため最後の行で、`type: "object"` を書き直したオブジェクトを返しています。`return json;` と書いた版も試すと、`npm run typecheck` は次のエラーで止まりました。

```text
src/tool.ts(10,3): error TS2322: Type 'ZodStandardJSONSchemaPayload<ZodType<unknown, unknown, $ZodTypeInternals<unknown, unknown>>>' is not assignable to type 'InputSchema'.
  Types of property 'type' are incompatible.
    Type 'SchemaType[] | SchemaType | undefined' is not assignable to type '"object"'.
      Type 'undefined' is not assignable to type '"object"'.
```

`as` で型を言い張る書き方でもエラーは消えます。それでも、`if` で中身を確かめてから書き直すほうが、配列のスキーマを渡したときに実行時の例外で気づけます。

型をチェックしてから、実行します。

```bash
npm run typecheck
node src/tool.ts
```

`npm run typecheck` はエラーを出さずに終わりました。`node src/tool.ts` の出力が、Claude API に渡すツール定義です。

```text
{
  "name": "search_orders",
  "description": "ネットショップの注文を、注文した人のメールアドレスと注文の状態で検索する。新しい注文から順に、最大 limit 件の注文番号と注文日を返す。",
  "input_schema": {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
      "email": {
        "type": "string",
        "format": "email",
        "pattern": "^(?:[A-Za-z0-9_'+\\-]+\\.)*[A-Za-z0-9_'+\\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
        "description": "注文した人のメールアドレス"
      },
      "status": {
        "type": "string",
        "enum": [
          "pending",
          "shipped",
          "cancelled"
        ],
        "description": "注文の状態。pending は発送前、shipped は発送済み、cancelled はキャンセル済み"
      },
      "limit": {
        "default": 10,
        "description": "返す注文の最大件数。省略すると10件",
        "type": "integer",
        "minimum": 1,
        "maximum": 50
      }
    },
    "required": [
      "email",
      "status"
    ]
  }
}
```

### $schema、format、required、name の読み方

`$schema` は、JSON Schema の版を表すキーです。zod は、指定しなければ Draft 2020-12 で書き出します（出典1）。SDK の型の説明も、Draft 2020-12 の JSON Schema を指しています（出典11）。

`email` には、`format` と `pattern` の両方が付きました。`z.email()` は `"format": "email"` に変換されます（出典1）。`pattern` の値は、zod の正規表現 `z.regexes.email` と同じ文字列でした。手元で2つを比べて確かめています。

`required` には、`email` と `status` の2つだけが入っています。`limit` は `"default": 10` を持つ省略できる項目になりました。

ツールの名前は、正規表現 `^[a-zA-Z0-9_-]{1,128}$` に合う必要があります（出典5）。`search_orders` はこの決まりに合っています。`description` の文は、公式ドキュメントが3〜4文以上を勧めています（出典5）。記事の例は2文なので、実際のツールでは返さない情報と使う場面も書き足してください（出典5）。

## 4. モデルが返した入力は同じスキーマで確かめる

モデルがツールを呼ぶと、入力は応答の `tool_use` ブロックに入って届きます（出典6）。その入力を、手順2の `searchOrdersInput` で検証します。`src/check-input.ts` を作ります。

```ts
import { searchOrdersInput } from "./schema.ts";

const samples: unknown[] = [
  { email: "user@example.com", status: "shipped" },
  { email: "user@example.com", status: "delivered", limit: 100 },
];

for (const sample of samples) {
  const result = searchOrdersInput.safeParse(sample);
  if (result.success) {
    console.log("ok:", result.data);
  } else {
    console.log("ng:", result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`));
  }
}
```

`samples` の2つは、モデルの入力の形をまねて手で作った見本です。実際のモデルの出力は使っていません。

スキーマどおりの入力が保証されるのは、ツール定義に `strict: true` を付けたときです（出典6、出典8）。この記事の定義には `strict` を付けていないので、受け取った入力を必ず検証します。

```bash
node src/check-input.ts
```

```text
ok: { email: 'user@example.com', status: 'shipped', limit: 10 }
ng: [
  'status: Invalid option: expected one of "pending"|"shipped"|"cancelled"',
  'limit: Too big: expected number to be <=50'
]
```

1つ目の見本は `limit` を省いていますが、結果には `limit: 10` が入りました。手順3の定義で `limit` を省略できる項目にしたことと、ここでの動きが一致しています。2つ目は、`status` の値が候補に無く、`limit` が上限の50を超えたので、2件の問題が出ました。

## io の指定を省くと limit が必須の項目になる

`z.toJSONSchema()` は、指定しなければスキーマの出力側の型を書き出します（出典1）。`.default()` は入力と出力で型が変わる例の1つで、zod の公式ドキュメントにも挙がっています（出典1）。違いを `src/compare-io.ts` で並べました。

```ts
import * as z from "zod";
import { searchOrdersInput } from "./schema.ts";

const output = z.toJSONSchema(searchOrdersInput);
const input = z.toJSONSchema(searchOrdersInput, { io: "input" });
const strictInput = z.toJSONSchema(z.strictObject(searchOrdersInput.shape), { io: "input" });

console.log("output:      ", output.required, output.additionalProperties);
console.log("input:       ", input.required, input.additionalProperties);
console.log("strict input:", strictInput.required, strictInput.additionalProperties);
```

```bash
node src/compare-io.ts
```

```text
output:       [ 'email', 'status', 'limit' ] false
input:        [ 'email', 'status' ] undefined
strict input: [ 'email', 'status' ] false
```

1行目が、`io` を指定しないときの結果です。検証した後のデータには必ず `limit` があるので、`required` に `limit` が入りました。この定義をモデルに渡すと、`limit` は毎回送るべき項目として伝わります。

ツールの入力は、モデルが作って `safeParse` に渡す側の値です。そのため、この記事では `io: "input"` を選びました。前に触れた `betaZodTool` は、`io` を指定せずに変換しています（出典9）。このスキーマを渡すと、`limit` は必須の項目になります。

2つの行では、`additionalProperties` も違います。zod は、出力側では `false` を書き、入力側では何も書きません（出典1）。入力側でも `false` を書かせるには、`z.strictObject()` を使います（出典1）。結果は3行目のとおりです。

`strict: true` を付ける予定があるなら、もう1点確かめてください。strict のツールでは、`additionalProperties` は `false` が必須です（出典7）。`minimum` と `maximum` も使えず、使うと 400 エラーが返ります（出典7）。`limit` の `min(1)` と `max(50)` は、strict のツールでは使えない制約です。

## z.date() のような変換できない型は例外になる

`z.date()`、`z.bigint()` などは JSON Schema で表せない型です（出典1）。指定しなければ、`z.toJSONSchema()` はこれらの型で例外を投げます（出典1）。`src/date-error.ts` で、日付の項目を変換してみます。

```ts
import * as z from "zod";

try {
  z.toJSONSchema(z.object({ dueDate: z.date() }), { io: "input" });
} catch (error) {
  console.log("error:", error instanceof Error ? error.message : error);
}

const dueDate = z.iso.date().meta({ description: "期限日（YYYY-MM-DD）" });
const json = z.toJSONSchema(dueDate, { io: "input" });
console.log("fixed:", json.type, json.format);
```

```bash
node src/date-error.ts
```

```text
error: Date cannot be represented in JSON Schema
fixed: string date
```

モデルが返すのは JSON なので、JavaScript の `Date` のオブジェクトはそもそも届きません。日付は `z.iso.date()` で、`"YYYY-MM-DD"` の文字列として受け取ります。変換すると `"format": "date"` が付きます（出典1）。この `date` は、strict のツールでも使える形式の一覧に入っています（出典7）。

## 料金がかからない範囲

手順1から4までと、`io` の比較、日付の例外の確認は、どれも API を呼びません。npm のパッケージも無料なので、記事のとおりに動かすだけなら料金はかかりません。

料金が要るのは、作ったツール定義を付けて Claude API を呼ぶ操作です。呼ぶには API キーが要ります（出典5）。ツール定義の名前、説明、スキーマは、入力トークンとして料金に数えられます（出典6）。ツールを1つ以上渡すと、ツール用のシステムプロンプトのトークンも足されます（出典6）。Claude Opus 5.5 なら、その分は286トークンです（出典6）。`tool_choice` が `auto` のときの値です（出典6）。この記事は API を呼んでいないので、1回あたりの金額は載せていません。

## まとめ

zod のスキーマ1つから、ツール定義の `input_schema` と、返ってきた入力の検証の両方ができました。`io: "input"` を付けると、`.default()` の項目は省略できる項目としてモデルに伝わります。

迷うのは、strict を使うかどうかです。strict を付けると入力の形は保証されますが、`limit` の上限のような数の制約はスキーマに書けません。上限は zod の検証に任せて strict を付けるか、strict を付けずに上限もモデルに見せるか。あなたのツールなら、どちらにしますか。

次に読む記事は[JSON.parse のエラー](/posts/llm-json-parse-error-fix)です。

## 出典

確認日は、どれも 2026-10-31 です。本文の（出典1）などの番号は、この表の番号を指します。

| # | 題名 | URL | 確認日 |
|---|---|---|---|
| 1 | JSON Schema（Zod） | https://zod.dev/json-schema | 2026-10-31 |
| 2 | Metadata and registries（Zod） | https://zod.dev/metadata | 2026-10-31 |
| 3 | zod（npm） | https://www.npmjs.com/package/zod | 2026-10-31 |
| 4 | zod-to-json-schema（npm） | https://www.npmjs.com/package/zod-to-json-schema | 2026-10-31 |
| 5 | Define tools（Claude API Docs） | https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools | 2026-10-31 |
| 6 | Tool use with Claude（Claude API Docs） | https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview | 2026-10-31 |
| 7 | Structured outputs（Claude API Docs） | https://platform.claude.com/docs/en/build-with-claude/structured-outputs | 2026-10-31 |
| 8 | Strict tool use（Claude API Docs） | https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use | 2026-10-31 |
| 9 | anthropic-sdk-typescript sdk-v1.3.0 src/helpers/beta/zod.ts | https://github.com/anthropics/anthropic-sdk-typescript/blob/sdk-v1.3.0/src/helpers/beta/zod.ts | 2026-10-31 |
| 10 | Modules: TypeScript（Node.js v22） | https://nodejs.org/docs/latest-v22.x/api/typescript.html | 2026-10-31 |
| 11 | anthropic-sdk-typescript sdk-v1.3.0 messages.ts | https://github.com/anthropics/anthropic-sdk-typescript/blob/sdk-v1.3.0/src/resources/messages/messages.ts | 2026-10-31 |
| 12 | @anthropic-ai/sdk（npm） | https://www.npmjs.com/package/@anthropic-ai/sdk | 2026-10-31 |

AI 支援で執筆しました。コードは 2026-10-31 に実際に実行して確認しています。
