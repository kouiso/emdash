---
title: "LLM の返した JSON が JSON.parse で落ちる原因と直し方【コードフェンス、途中で切れる】"
slug: "llm-json-parse-error-fix"
description: "LLM の出力を JSON.parse に渡したときの SyntaxError は、原因が2つに分かれます。JSON の前後に付いた文字は切り出して直し、途中で切れた出力は stop_reason を確かめて取り直します。Node.js 22.22.0 で実際に出たエラーの文を載せています。"
tags: ["構造化出力", "JSON", "TypeScript"]
main_keyword: "構造化出力"
target_query: null
course_step: 2
cost_estimate: "記事のコードは Node.js の標準の機能だけを使い、API を呼ばないので無料です。切れた応答を取り直すと、そのリクエストの分の API の料金がかかります。"
run_environment: "Node.js 22.22.0、npm 10.9.4、依存パッケージなし（型の確認は TypeScript 7.0.2）"
verified_at: "2026-10-31"
prev: "zod-to-json-schema-tool-definition"
next: "structured-output-methods-compare"
sources:
  - url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse"
    title: "JSON.parse() - JavaScript | MDN"
    accessed: 2026-10-31
  - url: "https://nodejs.org/docs/latest-v22.x/api/typescript.html"
    title: "Node.js v22 Modules: TypeScript"
    accessed: 2026-10-31
  - url: "https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons"
    title: "Stop reasons and fallback"
    accessed: 2026-10-31
  - url: "https://platform.claude.com/docs/en/build-with-claude/structured-outputs"
    title: "Structured outputs"
    accessed: 2026-10-31
  - url: "https://platform.claude.com/docs/en/about-claude/pricing"
    title: "Pricing"
    accessed: 2026-10-31
  - url: "https://www.rfc-editor.org/rfc/rfc8259"
    title: "RFC 8259 The JavaScript Object Notation (JSON) Data Interchange Format"
    accessed: 2026-10-31
ai_assisted: true
needs_api_key: false
status: draft
publish_at: null
updated: 2026-10-31
---

LLM の返した文字列で `JSON.parse` が `SyntaxError` を投げる原因は、2つです。JSON の前後にコードフェンスか説明の文が付いているなら、`{` から `}` までを切り出せば読めます。切れた出力は、`max_tokens` を上げて取り直してください（出典3）。

対象は、TypeScript で LLM の出力を受け取る処理を書き始めた人です。コードフェンスは、Markdown でコードを囲む3つのバッククォートの行です。エラーの文は、Node.js 22.22.0 で実際に出たものを載せました。見本の文字列は LLM の出力の形を手で作ったもので、記事のコードは API を呼びません。

講座の前の記事では、zod のスキーマから JSON Schema を作り、ツール定義に使いました。この記事は[前の記事](/posts/zod-to-json-schema-tool-definition)の続きです。

## エラーの文の頭で原因と直し方が決まる

文字列が正しい JSON でないとき、`JSON.parse` は `SyntaxError` を投げます（出典1）。原因を見分ける手がかりは、エラーの文の頭です。

| エラーの文の頭（Node.js 22.22.0） | 原因 | 直し方 |
|---|---|---|
| `Unexpected token` の後ろにバッククォート | JSON がコードフェンスで囲まれている | フェンスの中の JSON を切り出す |
| `Unexpected token` の後ろに説明の文の1文字目 | JSON の前に説明の文がある | 最初の `{` から最後の `}` までを切り出す |
| `Unexpected non-whitespace character after JSON` | JSON の後ろに文が続いている | 同じ関数で切り出す |
| `Unterminated string in JSON` | 出力が文字列の途中で切れている | `stop_reason` を確かめて取り直す |

上の3つは、この記事の関数 `extractJson` 1つで直せます。4つ目を文字列の操作で直すと、欠けたデータを正しいものとして扱うことになります。切れた出力は捨てて、取り直してください。

## 動かした環境と準備

動かした環境は Node.js 22.22.0 と npm 10.9.4 で、依存パッケージは使いません。Node.js 22.18.0 以上は、`.ts` のファイルの型を取り除いてそのまま実行します（出典2）。型の検査はしないので（出典2）、型は別に TypeScript 7.0.2 の `tsc` で確かめました。

まず Node.js のバージョンを確かめてください。

```bash
node -v
```

```text
v22.22.0
```

作業フォルダを作って移動します。

```bash
mkdir llm-json-parse
cd llm-json-parse
```

`package.json` を次の内容で置きます。`"type": "module"` は、`.ts` で `import` を使うための指定です（出典2）。

```json
{
  "name": "llm-json-parse",
  "private": true,
  "type": "module"
}
```

## 4つの見本で出る SyntaxError

見本として、JSON の前後に余計な文字が付いたもの3つと、途中で切れたもの1つを用意しました。どれも LLM の出力の形を手で作った文字列です。

次のファイルを `samples.ts` として保存します。

```ts
// モデルの出力の形を手で作った見本です。実際のモデルの出力ではありません。
export const samples = {
  fenced: '```json\n{"category": "billing", "priority": 1}\n```',
  preamble: '分類結果は次のとおりです。\n{"category": "billing", "priority": 1}',
  trailing: '{"category": "billing", "priority": 1}\n以上です。',
  truncated: '{"category": "billing", "summary": "請求額が二重に',
};
```

`fenced` は、JSON を行頭の3つのバッククォートで囲み、1行目に `json` と書いた形です。`preamble` は前に説明の文が、`trailing` は後ろに文が付いています。`truncated` は、`summary` の値の途中で切れた形です。

4つをそのまま `JSON.parse` に渡すファイルを、`reproduce.ts` として保存します。

```ts
import { samples } from "./samples.ts";

for (const [name, text] of Object.entries(samples)) {
  try {
    JSON.parse(text);
    console.log(`${name}: OK`);
  } catch (error) {
    // 入力の先頭を引用する部分（, "...）より前だけを表示します。
    console.log(`${name}: ${String(error).split(', "')[0]}`);
  }
}
```

実行します。

```bash
node reproduce.ts
```

```text
fenced: SyntaxError: Unexpected token '`'
preamble: SyntaxError: Unexpected token '分'
trailing: SyntaxError: Unexpected non-whitespace character after JSON at position 39 (line 2 column 1)
truncated: SyntaxError: Unterminated string in JSON at position 43 (line 1 column 44)
```

4つとも読めませんでした。`fenced` と `preamble` の文は、表示の前にコードで切ったものです。Node.js はその後ろに、入力の先頭10文字と `is not valid JSON` を続けます。

JSON のテキストは、前後の空白を除けば1つの値だけです（出典6）。そのため、1文字目がバッククォートか「分」の文字列は、最初の1文字で読めなくなります。`trailing` の position 39 は、「以上です」の「以」の位置です。

## Unexpected token は JSON の前後を切り出して直す

前後に付いた文字は、JSON の部分だけを切り出せば消えます。次の関数を `extract-json.ts` として保存してください。

```ts
const FENCE = /```(?:json)?[ \t]*\r?\n([\s\S]*?)\r?\n[ \t]*```/;

export function extractJson(text: string): string {
  const fenced = FENCE.exec(text);
  const body = fenced ? fenced[1] : text;
  const start = body.search(/[{[]/);
  const end = Math.max(body.lastIndexOf("}"), body.lastIndexOf("]"));
  if (start === -1 || end < start) {
    return body.trim();
  }
  return body.slice(start, end + 1);
}

export function parseLlmJson(text: string): unknown {
  return JSON.parse(extractJson(text));
}
```

`extractJson` は、コードフェンスがあればその中身だけを残します。そのうえで、最初の `{` か `[` から、最後の `}` か `]` までを切り出します。フェンスを先に外すのは、フェンスの外の文に括弧があっても、フェンスの中身を優先するためです。

切り出す範囲が見つからないときは、元の文字列をそのまま返します。すると `JSON.parse` が元のエラーを投げるので、原因の手がかりが消えずに残ります。

次の `fix.ts` では、`JSON.parse` を `parseLlmJson` に替えました。

```ts
import { parseLlmJson } from "./extract-json.ts";
import { samples } from "./samples.ts";

for (const [name, text] of Object.entries(samples)) {
  try {
    console.log(`${name}:`, parseLlmJson(text));
  } catch (error) {
    console.log(`${name}: ${String(error)}`);
  }
}
```

実行します。

```bash
node fix.ts
```

```text
fenced: { category: 'billing', priority: 1 }
preamble: { category: 'billing', priority: 1 }
trailing: { category: 'billing', priority: 1 }
truncated: SyntaxError: Unterminated string in JSON at position 43 (line 1 column 44)
```

前後に文字が付いていた3つは、同じオブジェクトとして読めました。`truncated` は、切り出したあとも同じエラーのままです。

説明の文の中に `{` が入っていると、切り出す範囲がずれます。その場合は、説明の文を書かせないようにプロンプトを変えるか、Structured Outputs を使います。

## Unterminated string は stop_reason を見て取り直す

途中で切れた JSON は、足りない部分が手元に無いので、文字列の操作では元に戻せません。

Claude の Messages API の成功した応答には、必ず `stop_reason` が入ります（出典3）。値が `max_tokens` なら、リクエストで指定した上限で出力が止まっています（出典3）。公式の案内は、`max_tokens` を上げるか、続きを生成させる方法です（出典3）。

次のファイルを `stop-reason.ts` として保存します。見本の応答は、公式の例（出典3）の `stop_reason` と `content` を真似て手で作りました。

```ts
import { parseLlmJson } from "./extract-json.ts";

// Messages API の応答のうち、ここで使う2つのフィールドだけを型にしています。
type MessageLike = {
  stop_reason: string;
  content: { type: string; text?: string }[];
};

function readJson(message: MessageLike): unknown {
  if (message.stop_reason === "max_tokens") {
    throw new Error("max_tokens で出力が切れています。上限を上げて取り直してください。");
  }
  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");
  return parseLlmJson(text);
}

// 応答の形を手で作った見本です。
const cut: MessageLike = {
  stop_reason: "max_tokens",
  content: [{ type: "text", text: '{"category": "billing", "summary": "請求額が二重に' }],
};
const done: MessageLike = {
  stop_reason: "end_turn",
  content: [{ type: "text", text: '```json\n{"category": "billing", "priority": 1}\n```' }],
};

for (const message of [cut, done]) {
  try {
    console.log(message.stop_reason, readJson(message));
  } catch (error) {
    console.log(message.stop_reason, String(error));
  }
}
```

実行します。

```bash
node stop-reason.ts
```

```text
max_tokens Error: max_tokens で出力が切れています。上限を上げて取り直してください。
end_turn { category: 'billing', priority: 1 }
```

`max_tokens` の応答は、`JSON.parse` に渡す前に例外にしました。`end_turn` の応答は、フェンスを外して読めています。

例外の文には、取り直すときに何を変えるかを書いておきます。ログを読んだ人が、`max_tokens` を上げればよいとすぐにわかるからです。

### 閉じ括弧を足すと、欠けたデータがそのまま通る

切れた文字列の末尾に `"}` を足せば、`JSON.parse` は成功します。次のファイルを `naive-repair.ts` として保存し、実行してください。

```ts
import { samples } from "./samples.ts";

const repaired = samples.truncated + '"}';
console.log(JSON.parse(repaired));
```

```bash
node naive-repair.ts
```

```text
{ category: 'billing', summary: '請求額が二重に' }
```

エラーは消えましたが、`summary` は文の途中で止まっています。この後に続くはずだったキーがあっても、`JSON.parse` は何も知らせません。この講座では閉じ括弧を足す直し方は使わず、切れた出力を取り直すことにしました。

## Structured Outputs でも max_tokens の確認は外せない

Claude には、JSON の外に文字を付けさせない Structured Outputs があります（出典4）。公式のドキュメントは、これを使えば `JSON.parse()` のエラーが無くなると説明しています（出典4）。

ただし、`stop_reason` が `max_tokens` のときは保証の外です（出典4）。そのときの出力は不完全で、スキーマに合わないことがあります（出典4）。Structured Outputs に切り替えても、`readJson` の分岐は残してください。

## それでも JSON.parse が失敗するとき

上の4つに当たらないときは、LLM が返した文字列を加工せずにログへ出して読みます。そのとき、次の3つを同じ行に出してください。

- `JSON.parse` に渡す直前の文字列
- 応答の `stop_reason`
- エラーの文にある `position` の数字

`position` は、0 から数えて何文字目で読めなくなったかを示します。`truncated` の position 43 は、文字列の長さと同じ値です。最後まで読んでも、文字列が閉じなかったことを表します。

## 料金がかからない範囲

記事のコードは Node.js の標準の機能だけを使い、API を呼ばないので無料です。npm からパッケージを入れる手順もありません。

切れた応答を取り直すと、新しいリクエストの入力と出力のトークンに料金がかかります（出典5）。Claude Haiku 5.5 なら、100万トークンあたり入力 $0.10、出力 $0.50 です（出典5）。この単価は、プロンプトが10万トークン以下のときのものです（出典5）。

## 確認すること

LLM の出力を `JSON.parse` に渡す処理では、次の4つをすべて確かめます。

- `stop_reason` が `max_tokens` の応答を、読まずに取り直しているか
- `JSON.parse` の前に、コードフェンスと前後の文を外しているか
- 切れた文字列に閉じ括弧を足して読ませていないか
- 読めたあとに、中身の形をスキーマで検証しているか

形の検証は[zod の記事](/posts/zod-validate-llm-json-output)で扱いました。

取り直しても `max_tokens` で切れ続けるとき、上限をさらに上げますか。それとも、出力を短くするようプロンプトを変えますか。

講座の次の記事では、構造化出力の3つのやり方を比べます。比べるのは、プロンプトでの指示、tool use、Structured Outputs です。[次の記事](/posts/structured-output-methods-compare)に進んでください。

## 出典

確認日は、どれも 2026-10-31 です。本文の（出典1）〜（出典6）は、この表の番号を指します。

| # | 題名 | URL | 確認日 |
|---|---|---|---|
| 1 | JSON.parse()（MDN） | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse | 2026-10-31 |
| 2 | Node.js v22 Modules: TypeScript | https://nodejs.org/docs/latest-v22.x/api/typescript.html | 2026-10-31 |
| 3 | Stop reasons and fallback | https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons | 2026-10-31 |
| 4 | Structured outputs | https://platform.claude.com/docs/en/build-with-claude/structured-outputs | 2026-10-31 |
| 5 | Pricing | https://platform.claude.com/docs/en/about-claude/pricing | 2026-10-31 |
| 6 | RFC 8259 The JSON Data Interchange Format | https://www.rfc-editor.org/rfc/rfc8259 | 2026-10-31 |

AI 支援で執筆しました。コードは 2026-10-31 に実際に実行して確認しています。
