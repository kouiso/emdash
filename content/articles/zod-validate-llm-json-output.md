---
title: "LLM の出力 JSON を zod で検証する【safeParse のエラーの読み方】"
slug: "zod-validate-llm-json-output"
description: "zod 4.6.7 の safeParse で、LLM が返した JSON を検証します。失敗したときの issues は、path、code、message の順に読みます。手作りの見本5つで実際に出た issues と、再依頼の文の作り方を載せています。"
tags: ["構造化出力", "zod", "TypeScript"]
main_keyword: "構造化出力"
target_query: null
course_step: 2
cost_estimate: "記事のコードは zod しか使わず API を呼ばないので無料です。再依頼の文をモデルに送ると、トークン数に応じた API の料金がかかります。"
run_environment: "Node.js 22.22.0、npm 10.9.4、zod 4.6.7"
verified_at: "2026-10-31"
prev: "claude-structured-outputs-json"
next: "zod-to-json-schema-tool-definition"
sources:
  - url: "https://zod.dev/basics"
    title: "Basic usage | Zod"
    accessed: 2026-10-31
  - url: "https://zod.dev/error-formatting"
    title: "Formatting errors | Zod"
    accessed: 2026-10-31
  - url: "https://zod.dev/api"
    title: "Defining schemas | Zod"
    accessed: 2026-10-31
  - url: "https://zod.dev/error-customization"
    title: "Customizing errors | Zod"
    accessed: 2026-10-31
  - url: "https://github.com/colinhacks/zod/blob/v4.6.7/packages/zod/src/v4/core/errors.ts"
    title: "colinhacks/zod v4.6.7 packages/zod/src/v4/core/errors.ts"
    accessed: 2026-10-31
  - url: "https://www.npmjs.com/package/zod"
    title: "zod (npm)"
    accessed: 2026-10-31
  - url: "https://platform.claude.com/docs/en/build-with-claude/structured-outputs"
    title: "Structured outputs"
    accessed: 2026-10-31
  - url: "https://nodejs.org/docs/latest-v22.x/api/typescript.html"
    title: "Node.js v22 Modules: TypeScript"
    accessed: 2026-10-31
  - url: "https://platform.claude.com/docs/en/about-claude/pricing"
    title: "Pricing"
    accessed: 2026-10-31
ai_assisted: true
needs_api_key: false
status: draft
publish_at: null
updated: 2026-10-31
---

LLM が返した JSON は、`JSON.parse` のあとに zod の `safeParse` で検証します。失敗したら、`error.issues` を `path`、`code`、`message` の順に読みます。手で作った5つの見本を検証し、実際に出た issues をそのまま載せて読み方を示します。

対象は、TypeScript で何か作ったことがあり、LLM の出力をアプリで使い始めた人です。手順は15分ほどで終わります。

講座の前の記事では、Claude に JSON を返させる方法を扱いました。[前の記事](/posts/claude-structured-outputs-json)から読むと流れがつながります。

## safeParse の失敗は path、code、message の順に読む

`safeParse` は例外を投げずに、結果のオブジェクトを返します（出典1）。結果の `success` は true か false です（出典1）。false のときは `error.issues` の配列に、合わなかった箇所が1件ずつ入ります（出典1）。

1件の issue は、次の順に読むと迷いません。

| 読む順 | フィールド | わかること |
|---|---|---|
| 1 | `path` | どのキーが合わないか。`[ 'tags', 1 ]` は `tags` の2つ目の要素 |
| 2 | `code` | 何が合わないか。型の違い、候補に無い値、余分なキー、上限の超過を区別する |
| 3 | `message` | 人が読むための英語の説明文 |

プログラムで処理を分けるときは `path` と `code` を使います。`message` は画面とログに出す文として使います。

zod 4.6.7 の issue の `code` は11種類あります（出典5）。この記事の見本で出たのは、そのうち次の4種類です。

| `code` | 見本の中身 | 意味 |
|---|---|---|
| `invalid_type` | `"priority":"2"` | 型が違う。キーが無いときもこの `code` になる |
| `invalid_value` | `"category":"Bug"` | `z.enum` の候補に無い値 |
| `unrecognized_keys` | `"confidence":0.9` | スキーマに無いキー（`z.strictObject` のとき） |
| `too_big` | `"priority":5` | `max` で決めた上限を超えた |

## Structured Outputs を使っても文字数と範囲は自分で確かめる

モデル側の仕組みだけでは防げない違反があるので、検証のコードは省けません。

Claude の Structured Outputs は、出力をスキーマに合わせる機能です（出典7）。それでも、数値の `minimum` と `maximum` には対応していません（出典7）。文字数の `minLength` と `maxLength` も同じです（出典7）。多くの SDK のヘルパーは、これらを送る前に外してフィールドの説明文に移します（出典7）。

文字列の候補（JSON Schema の `enum`）は、大文字と小文字の違いまでは保証されません（出典7）。`max_tokens` で途中まで切れた出力も、スキーマに合わないことがあります（出典7）。Structured Outputs を使わないときは、必須のフィールドの抜けと型のずれも起こり得ます（出典7）。

公式の TypeScript SDK には `zodOutputFormat()` があります（出典7）。これを使うと、`parse()` が応答を検証します（出典7）。この記事は SDK を使わない形で、受け取った JSON を zod で検証します。モデルの出力をアプリに渡す前には、文字数と数値の範囲まで自分のコードで確かめるべきです。

## 使うバージョンと準備

動かした環境は Node.js 22.22.0、npm 10.9.4、zod 4.6.7 です。2026-10-31 時点で、npm の zod の latest は 4.6.7 です（出典6）。

Node.js 22.18.0 以上は、`.ts` のファイルを型を外してそのまま実行します（出典8）。型は調べないので（出典8）、型の確認は別に `tsc` 7.0.2 で行いました。

作業フォルダを作って移動します。

```bash
mkdir zod-llm-check
cd zod-llm-check
```

`package.json` を置きます。zod のバージョンは `^` を付けずに固定しています。

```json
{
  "name": "zod-llm-check",
  "private": true,
  "type": "module",
  "dependencies": {
    "zod": "4.6.7"
  }
}
```

依存を入れます。

```bash
npm install
```

```text

added 1 package, and audited 2 packages in 709ms

1 package is looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

## スキーマと見本の JSON

想定は、問い合わせの文をモデルに分類させる処理です。カテゴリ、1〜3の優先度、40字以内の要約、タグの配列を JSON で返させます。

```ts
import * as z from "zod";

export const Ticket = z.strictObject({
  category: z.enum(["bug", "billing", "other"]),
  priority: z.number().int().min(1).max(3),
  summary: z.string().min(1).max(40),
  tags: z.array(z.string()),
});

export type Ticket = z.infer<typeof Ticket>;
```

このファイルを `schema.ts` として保存します。`z.strictObject` は、スキーマに無いキーをエラーにします（出典3）。`z.infer` で、同じスキーマから TypeScript の型も作れます（出典1）。

見本は、モデルの出力の形をまねて手で作った文字列です。実際のモデルの出力ではありません。`ok` 以外の4つには、わざと違反を入れてあります。

```ts
// モデルの出力の形をまねて手で作った見本です。実際のモデルの出力ではありません。
export const samples: Record<string, string> = {
  ok: '{"category":"bug","priority":2,"summary":"ログインボタンを押しても反応しない","tags":["login","ui"]}',
  "wrong-type": '{"category":"bug","priority":"2","summary":"ログインボタンを押しても反応しない","tags":["login"]}',
  "bad-enum": '{"category":"Bug","priority":2,"summary":"ログインボタンを押しても反応しない","tags":["login"]}',
  "extra-key": '{"category":"billing","priority":1,"summary":"請求額が二重になっている","tags":[],"confidence":0.9}',
  many: '{"category":"other","priority":5,"tags":["login",3]}',
};
```

これを `samples.ts` として保存します。検証するコードは `check.ts` です。

```ts
import { Ticket } from "./schema.ts";
import { samples } from "./samples.ts";

const name = process.argv[2] ?? "ok";
const text = samples[name];
if (text === undefined) {
  console.error(`unknown sample: ${name}`);
  process.exit(1);
}

const result = Ticket.safeParse(JSON.parse(text));
if (result.success) {
  console.log("success:", result.data);
} else {
  console.log(result.error.issues);
}
```

JSON として読めない文字列では、`JSON.parse` が例外を投げて `safeParse` まで届きません。見本はどれも JSON として読める形にしてあります。

```bash
node check.ts ok
```

```text
success: {
  category: 'bug',
  priority: 2,
  summary: 'ログインボタンを押しても反応しない',
  tags: [ 'login', 'ui' ]
}
```

成功すると、`result.data` に検証を通った値が入ります（出典1）。`if` の中では `result.data` の型が `Ticket` になるので、以降のコードで型の補完が使えます。

## 見本ごとの issues の読み方

違反を入れた4つの見本は、それぞれ別の `code` を返しました。

### invalid_type は型の違いとキーの抜け

```bash
node check.ts wrong-type
```

```text
[
  {
    expected: 'number',
    code: 'invalid_type',
    path: [ 'priority' ],
    message: 'Invalid input: expected number, received string'
  }
]
```

`path` が `[ 'priority' ]` なので、優先度のキーが合わないとわかります。`expected` は期待した型で、受け取った型は `message` の後半に書かれています。数字を文字列で返す型のずれは、Structured Outputs を使わないときに起こり得る違反の1つです（出典7）。

### invalid_value は z.enum の候補に無い値

```bash
node check.ts bad-enum
```

```text
[
  {
    code: 'invalid_value',
    values: [ 'bug', 'billing', 'other' ],
    path: [ 'category' ],
    message: 'Invalid option: expected one of "bug"|"billing"|"other"'
  }
]
```

`values` に候補の一覧が入ります。見本の `"Bug"` は、候補の `"bug"` と頭文字の大小しか違いません。この違いは Structured Outputs でも起こり得ます（出典7）。公式は、大文字と小文字を区別せずに比べるよう勧めています（出典7）。

### unrecognized_keys は path が空の配列

```bash
node check.ts extra-key
```

```text
[
  {
    code: 'unrecognized_keys',
    keys: [ 'confidence' ],
    path: [],
    message: 'Unrecognized key: "confidence"'
  }
]
```

`path` が `[]` なのは、オブジェクト全体についての違反だからです。余分なキーの名前は `keys` に入ります。公式の例でも、余分なキーの issue は `path` が空です（出典2）。

### 違反が3つある見本は issues も3件

```bash
node check.ts many
```

```text
[
  {
    origin: 'number',
    code: 'too_big',
    maximum: 3,
    inclusive: true,
    path: [ 'priority' ],
    message: 'Too big: expected number to be <=3'
  },
  {
    expected: 'string',
    code: 'invalid_type',
    path: [ 'summary' ],
    message: 'Invalid input: expected string, received undefined'
  },
  {
    expected: 'string',
    code: 'invalid_type',
    path: [ 'tags', 1 ],
    message: 'Invalid input: expected string, received number'
  }
]
```

見本 `many` には違反を3つ入れ、issues も3件返りました。最初の違反で止まらないので、この見本では1回の検証で3か所すべてがわかりました。

`too_big` の `maximum` は上限の3です。`inclusive: true` と `message` の `<=3` から、3 は許されるとわかります。`summary` のキーが無いときは、`invalid_type` になります。`message` には `received undefined` と出ます。`[ 'tags', 1 ]` の 1 は配列の添字で、2つ目の要素の `3` を指しています。

## prettifyError でモデルへの再依頼の文を作る

issues の配列は人が読むには長いので、`z.prettifyError` で読みやすい文字列に直します（出典2）。

```ts
import * as z from "zod";
import { Ticket } from "./schema.ts";
import { samples } from "./samples.ts";

const result = Ticket.safeParse(JSON.parse(samples.many));
if (!result.success) {
  const message = [
    "前回の JSON は、次の点がスキーマに合いませんでした。",
    z.prettifyError(result.error),
    "直した JSON だけを返してください。",
  ].join("\n");
  console.log(message);
}
```

このファイルを `retry-message.ts` として保存し、実行します。

```bash
node retry-message.ts
```

```text
前回の JSON は、次の点がスキーマに合いませんでした。
✖ Too big: expected number to be <=3
  → at priority
✖ Invalid input: expected string, received undefined
  → at summary
✖ Invalid input: expected string, received number
  → at tags[1]
直した JSON だけを返してください。
```

この文字列を次のリクエストに添えると、どのキーをどう直すかをモデルに伝えられます。送る処理には API キーが要るので、この記事では文字列を作るところで止めています。

## メッセージを日本語にする

`z.config` に zod の日本語のロケール `ja` を渡すと、メッセージが日本語になります（出典4）。

```ts
import * as z from "zod";
import { ja } from "zod/locales";
import { Ticket } from "./schema.ts";
import { samples } from "./samples.ts";

z.config(ja());
const result = Ticket.safeParse(JSON.parse(samples.many));
if (!result.success) {
  console.log(z.prettifyError(result.error));
}
```

このファイルを `pretty-ja.ts` として保存し、実行します。

```bash
node pretty-ja.ts
```

```text
✖ 大きすぎる値: numberは3以下である必要があります
  → at priority
✖ 無効な入力: stringが期待されましたが、undefinedが入力されました
  → at summary
✖ 無効な入力: stringが期待されましたが、数値が入力されました
  → at tags[1]
```

`z.config` は zod 全体の設定です（出典4）。設定すると、モデルに返す再依頼の文まで日本語に変わります。英語の文はそのまま検索しやすいので、この講座では英語のまま使います。

## z.object は余分なキーを黙って消す

`z.strictObject` を `z.object` に変えると、スキーマに無いキーは結果から消えます（出典3）。

```ts
import * as z from "zod";
import { samples } from "./samples.ts";

const LooseTicket = z.object({
  category: z.enum(["bug", "billing", "other"]),
  priority: z.number().int().min(1).max(3),
  summary: z.string().min(1).max(40),
  tags: z.array(z.string()),
});

const result = LooseTicket.safeParse(JSON.parse(samples["extra-key"]));
console.log(result.success, result.data);
```

このファイルを `strip.ts` として保存し、実行します。

```bash
node strip.ts
```

```text
true { category: 'billing', priority: 1, summary: '請求額が二重になっている', tags: [] }
```

検証は成功し、`confidence` は何の知らせもなく消えました。消えたキーは issues にも残りません。

開発とテストでは `z.strictObject` を使います。モデルがプロンプトに無いキーを返し始めたら、すぐに気づけるからです。本番で余分なキーのたびに再依頼したくない場合は、`z.object` で消す選び方もあります。

## 料金がかからない範囲

記事の手順は zod しか使わず、API を呼ばないので無料です。zod は MIT ライセンスで配布されています（出典6）。通信したのは `npm install` の1回でした。ネットワークの無い環境で実行し直しても、`node` のコマンドはすべて成功しました。

再依頼の文を実際にモデルへ送ると、トークン数に応じた料金がかかります（出典9）。Claude Haiku 5.5 なら、100万トークンあたり入力 $0.10、出力 $0.50 です（出典9）。この単価は、プロンプトが10万トークン以下のときのものです（出典9）。

## 確認すること

LLM の出力を受け取る処理では、次の4つをすべて確かめます。

- `JSON.parse` のあとに `safeParse` を呼んでいるか
- 処理の分岐に `path` と `code` を使い、`message` を表示に使い分けたか
- 文字数と数値の範囲を zod のスキーマに書いたか
- 余分なキーを `z.strictObject` で見つけるか、`z.object` で消すか決めたか

再依頼を何回まで続け、それでも合わない出力はどう扱いますか。

講座の次の記事では、zod のスキーマから JSON Schema を作り、ツール定義に使います。[次の記事](/posts/zod-to-json-schema-tool-definition)に進んでください。

## 出典

確認日は、どれも 2026-10-31 です。本文の（出典1）〜（出典9）は、この表の番号を指します。

| # | 題名 | URL | 確認日 |
|---|---|---|---|
| 1 | Basic usage（Zod） | https://zod.dev/basics | 2026-10-31 |
| 2 | Formatting errors（Zod） | https://zod.dev/error-formatting | 2026-10-31 |
| 3 | Defining schemas（Zod） | https://zod.dev/api | 2026-10-31 |
| 4 | Customizing errors（Zod） | https://zod.dev/error-customization | 2026-10-31 |
| 5 | colinhacks/zod v4.6.7 core/errors.ts | https://github.com/colinhacks/zod/blob/v4.6.7/packages/zod/src/v4/core/errors.ts | 2026-10-31 |
| 6 | zod（npm） | https://www.npmjs.com/package/zod | 2026-10-31 |
| 7 | Structured outputs | https://platform.claude.com/docs/en/build-with-claude/structured-outputs | 2026-10-31 |
| 8 | Node.js v22 Modules: TypeScript | https://nodejs.org/docs/latest-v22.x/api/typescript.html | 2026-10-31 |
| 9 | Pricing | https://platform.claude.com/docs/en/about-claude/pricing | 2026-10-31 |

AI 支援で執筆しました。コードは 2026-10-31 に実際に実行して確認しています。
