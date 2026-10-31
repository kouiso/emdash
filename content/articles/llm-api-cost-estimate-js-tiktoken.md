---
title: "OpenAI API の料金をリクエスト前に見積もる【js-tiktoken でトークンを数える】"
slug: "llm-api-cost-estimate-js-tiktoken"
description: "js-tiktoken 1.0.21 で入力のトークン数を手元で数えます。gpt-5.6-terra の単価と出力の上限から、1回あたりの料金の上限を出します。API キーを使わずに動かした出力付きです。"
tags: ["LLM API", "OpenAI", "TypeScript"]
main_keyword: "LLM API"
target_query: null
course_step: 1
cost_estimate: "記事のコードは API を呼ばないので無料です。gpt-5.6-terra の単価は、100万トークンあたり入力 2.00 ドル、出力 12.00 ドルです。"
run_environment: "Node.js 22.22.0、npm 10.9.4、js-tiktoken 1.0.21"
verified_at: "2026-10-31"
prev: "llm-api-streaming-typescript"
next: "llm-api-429-retry-sdk-mock"
sources:
  - url: "https://developers.openai.com/api/docs/pricing"
    title: "Pricing | OpenAI API"
    accessed: 2026-10-31
  - url: "https://developers.openai.com/api/docs/models/gpt-5.6-terra"
    title: "GPT-5.6 Terra Model | OpenAI API"
    accessed: 2026-10-31
  - url: "https://developers.openai.com/api/docs/guides/reasoning"
    title: "Reasoning models | OpenAI API"
    accessed: 2026-10-31
  - url: "https://developers.openai.com/api/docs/guides/token-counting"
    title: "Counting tokens | OpenAI API"
    accessed: 2026-10-31
  - url: "https://developers.openai.com/api/docs/deprecations"
    title: "Deprecations | OpenAI API"
    accessed: 2026-10-31
  - url: "https://www.npmjs.com/package/js-tiktoken"
    title: "js-tiktoken (npm)"
    accessed: 2026-10-31
  - url: "https://github.com/dqbd/tiktoken/blob/main/js/README.md"
    title: "dqbd/tiktoken js/README.md"
    accessed: 2026-10-31
  - url: "https://unpkg.com/js-tiktoken@1.0.21/dist/chunk-VL2OQCWN.js"
    title: "js-tiktoken 1.0.21 dist/chunk-VL2OQCWN.js"
    accessed: 2026-10-31
  - url: "https://github.com/openai/tiktoken/blob/main/tiktoken/model.py"
    title: "openai/tiktoken tiktoken/model.py"
    accessed: 2026-10-31
  - url: "https://nodejs.org/docs/latest-v22.x/api/typescript.html"
    title: "Node.js v22 Modules: TypeScript"
    accessed: 2026-10-31
  - url: "https://github.com/anthropics/anthropic-tokenizer-typescript"
    title: "anthropics/anthropic-tokenizer-typescript README"
    accessed: 2026-10-31
  - url: "https://platform.claude.com/docs/en/build-with-claude/token-counting"
    title: "Token counting (Claude API Docs)"
    accessed: 2026-10-31
ai_assisted: true
needs_api_key: false
status: draft
publish_at: null
updated: 2026-10-31
---

OpenAI API の1回の料金は、入力と出力のトークン数に、それぞれの単価を掛けた合計です。入力のトークン数は、js-tiktoken を使うと API キーなしで手元で数えられます。出力の数は送る前にはわからないので、自分で決めた上限で見積もります。この記事のコードで gpt-5.6-terra の上限を出すと、1行目は次のとおりでした。

```text
入力 93 / 出力上限 1000 トークン: 1回 $0.012186、1日1,000回で30日 $365.58
```

手元で数えた数は、請求に使われる数と完全には一致しません。ずれる理由と、正確な数を得る方法も後半に書きました。Claude のトークン数は、この記事の方法では数えられません。

対象は、JS か TypeScript で何か作ったことがあり、LLM の API を呼ぶ前に料金を知りたい人です。書き写すコードは4ファイルで、合わせて73行です。

講座の前の記事は[ストリーミング表示](/posts/llm-api-streaming-typescript)です。

## 料金は入力と出力のトークン数で決まる

OpenAI API の料金表は、100万トークンあたりの金額で書かれています（出典1）。トークンは、モデルが文章を細かく区切って扱う単位です。区切り方を決める表をエンコーディングと呼び、モデルごとに使う表が決まっています（出典9）。

この記事では gpt-5.6-terra の単価を使います。公式の料金ページとモデルのページでは、Standard の単価は次の表のとおりです（出典1、2）。確認したのは 2026-10-31 です。

| 区分 | 100万トークンあたり |
|---|---|
| 入力 | 2.00 ドル |
| キャッシュされた入力 | 0.20 ドル |
| 出力 | 12.00 ドル |

入力が272,000トークンを超えるリクエストは、単価が上がります（出典2）。そのリクエスト全体で、入力が2倍、出力が1.5倍の単価です（出典2）。

出力の数え方には、推論モデルならではの決まりがあります。推論モデルは、答えを書く前に推論トークンを生成します（出典3）。推論トークンは API の応答に出てきませんが、出力トークンとして課金されます（出典3）。gpt-5.6-terra も推論トークンに対応したモデルです（出典2）。見えている答えの長さから出力の料金を見積もると、推論の分だけ少なく出ます。

1回の料金は、次の式で出せます。キャッシュの割引は、この記事では使いません。

```text
料金（ドル）= (入力トークン数 × 入力単価 + 出力トークン数 × 出力単価) ÷ 1,000,000
```

## 前提となる環境

使うのは Node.js と npm で、API キーは要りません。この記事のコードは、Node.js 22.22.0 と npm 10.9.4 で動かしました。Node.js は 22.18.0 から、TypeScript のファイルをそのまま実行できます（出典10）。型の注釈を取り除いて動かす方式で、型のチェックはしません（出典10）。そのため、この記事にはビルドの手順がありません。

| パッケージ | バージョン |
|---|---|
| `js-tiktoken` | 1.0.21 |

tiktoken は、OpenAI のモデル用のトークナイザーです（出典7）。js-tiktoken は、それを JavaScript だけで書き直したものです（出典7）。2026-10-31 に `npm view` で確かめた latest は 1.0.21 です（出典6）。公開日は 2025-08-09 でした（出典6）。`getEncoding` で読み込むエンコーディングは、パッケージの中に入っています（出典7）。ネットワークを切った状態でも、この記事の3つのスクリプトは同じ結果を出しました。

## 1. 準備は package.json と npm install

最初に、作業フォルダ `token-cost-estimate` を作って移動します。

```bash
mkdir token-cost-estimate
cd token-cost-estimate
```

作業フォルダに `package.json` を置きます。記事と同じバージョンを入れるため、`^` を付けずに書いています。

```json
{
  "name": "token-cost-estimate",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "js-tiktoken": "1.0.21"
  }
}
```

`"type": "module"` を入れたのは、警告を出さないためです。この行を消して `count.ts` を動かすと、警告が出ました。Node.js 22.22.0 の警告の名前は `MODULE_TYPELESS_PACKAGE_JSON` です。数えた結果は同じでした。

依存を入れます。

```bash
npm install
```

手元の出力では、入ったパッケージは2つでした。js-tiktoken と、それが使う base64-js です。

```text
added 2 packages, and audited 3 packages in 692ms

1 package is looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

## 2. 日本語は同じ内容の英語よりトークンが多い

同じ依頼を英語と日本語で書き、トークン数を比べました。作業フォルダに `count.ts` を保存します。

```ts
import { getEncoding } from "js-tiktoken";

const enc = getEncoding("o200k_base");

const samples = [
  "Summarize this support ticket in three lines.",
  "このお問い合わせの内容を3行で要約してください。",
];

for (const text of samples) {
  const tokens = enc.encode(text);
  console.log(`${tokens.length} tokens / ${[...text].length} chars: ${text}`);
}
```

`o200k_base` はエンコーディングの名前です。js-tiktoken 1.0.21 は、gpt-5 系のモデル名にこれを割り当てています（出典8）。`encode` はトークンの番号の配列を返すので、その長さがトークン数になります。

```bash
node count.ts
```

```text
10 tokens / 45 chars: Summarize this support ticket in three lines.
12 tokens / 24 chars: このお問い合わせの内容を3行で要約してください。
```

英語は45文字で10トークンなので、1トークンあたり4.5文字です。日本語は24文字で12トークンなので、1トークンあたり2文字でした。比べたのは2文で、文章が変われば比率も変わります。文字数を割って見積もる方法は、言語ごとに割る数を変えないと外れます。数えられるなら、`encode` で直接数えるほうが確実です。

## 3. 料金の上限は出力の上限で決まる

入力を数え、出力は上限で置いて、1回の料金の上限を出すコードを書きました。作業フォルダに `estimate.ts` を保存します。

```ts
import { getEncoding } from "js-tiktoken";

// gpt-5.6-terra の Standard の単価（USD / 100万トークン、2026-10-31 確認）
const PRICE = { input: 2.0, output: 12.0 };
// 入力が 272,000 トークンを超えると、入力は2倍、出力は1.5倍の単価になる
const LONG_PROMPT_TOKENS = 272_000;

const enc = getEncoding("o200k_base");

function estimateMaxCost(prompt: string, maxOutputTokens: number) {
  const inputTokens = enc.encode(prompt).length;
  const isLong = inputTokens > LONG_PROMPT_TOKENS;
  const inputPrice = PRICE.input * (isLong ? 2 : 1);
  const outputPrice = PRICE.output * (isLong ? 1.5 : 1);
  const usd = (inputTokens * inputPrice + maxOutputTokens * outputPrice) / 1_000_000;
  return { inputTokens, maxOutputTokens, usd };
}

const prompt = [
  "あなたはサポート窓口の担当者です。",
  "次のお問い合わせを読み、要点を3行で要約してください。",
  "",
  "先週から、請求書のPDFをダウンロードしようとすると画面が真っ白になります。",
  "ブラウザはChromeとEdgeの両方で試しました。",
  "経理の締めが金曜日なので、それまでに3か月分の請求書が必要です。",
].join("\n");

const cases = [
  { prompt, maxOutputTokens: 1_000 },
  { prompt, maxOutputTokens: 25_000 },
  { prompt: prompt.repeat(3_000), maxOutputTokens: 1_000 },
];

for (const c of cases) {
  const r = estimateMaxCost(c.prompt, c.maxOutputTokens);
  const monthly = r.usd * 1_000 * 30;
  console.log(
    `入力 ${r.inputTokens} / 出力上限 ${r.maxOutputTokens} トークン: ` +
      `1回 $${r.usd.toFixed(6)}、1日1,000回で30日 $${monthly.toFixed(2)}`,
  );
}
```

`maxOutputTokens` は、リクエストの `max_output_tokens` に渡す値と同じ数にします。`max_output_tokens` は、推論トークンと見える答えを合わせた、生成するトークン数の上限です（出典3）。そのため、この値に出力の単価を掛けると、出力の料金の上限になります。

試した上限は2通りです。1,000は短い要約を想定した値です。25,000は、OpenAI が勧めている数です（出典3）。推論モデルを使い始めるとき、推論と出力のためにこの数を空けておくよう書かれています（出典3）。3つ目の例は、同じ依頼文を3,000回つなげて、272,000トークンを超える入力を作りました。

```bash
node estimate.ts
```

```text
入力 93 / 出力上限 1000 トークン: 1回 $0.012186、1日1,000回で30日 $365.58
入力 93 / 出力上限 25000 トークン: 1回 $0.300186、1日1,000回で30日 $9005.58
入力 279000 / 出力上限 1000 トークン: 1回 $1.134000、1日1,000回で30日 $34020.00
```

1行目の内訳を計算すると、入力は 0.000186 ドル、出力の上限は 0.012 ドルです。短い依頼文では、料金の上限の98%以上を出力が占めます。上限を25,000にした2行目は1回 0.30 ドルで、1日1,000回なら30日で9,005.58 ドルです。

短い依頼文なら、入力を1トークン単位で数えても見積もりはほとんど動きません。見積もりを左右するのは `max_output_tokens` の値です。入力を数える意味が大きくなるのは、長い文書を渡すときです。3行目の279,000トークンは272,000を超えたので、1回 1.134 ドルになりました。割り増しが無い単価で計算すると 0.570 ドルなので、およそ2倍です。

上限を小さくしすぎると、別の損が出ます。生成が上限に達すると、応答の `status` は `incomplete` になります（出典3）。見える答えが出る前に止まることもあり、その場合も入力と推論トークンの料金はかかります（出典3）。送ったあとは、応答の `usage` で実際の数を確かめられます。推論トークンの数は `output_tokens_details` に入っています（出典3）。

3行目の長い入力を含めた `node estimate.ts` は、手元で8.5秒かかりました。長い文書を毎回数えるなら、数える時間も見込んでおきます。

## js-tiktoken 1.0.21 は gpt-5.6-terra の名前を知らない

js-tiktoken には、モデル名からエンコーディングを選ぶ関数もあります（出典7）。関数の名前は `encodingForModel` です。`estimate.ts` では、これを使わずに `getEncoding` を使いました。1.0.21 は、gpt-5.6-terra という名前を知らないからです。作業フォルダに `unknown-model.ts` を保存して確かめます。

```ts
import { encodingForModel, type TiktokenModel } from "js-tiktoken";

for (const model of ["gpt-5-mini", "gpt-5.6-terra"]) {
  try {
    const enc = encodingForModel(model as TiktokenModel);
    console.log(`${model}: ${enc.encode("hello").length} token`);
  } catch (error) {
    console.log(`${model}: ${(error as Error).message}`);
  }
}
```

```bash
node unknown-model.ts
```

```text
gpt-5-mini: 1 token
gpt-5.6-terra: Unknown model
```

js-tiktoken 1.0.21 が知っているモデル名は、gpt-5 系までです（出典8）。gpt-5 系の名前は、gpt-5、gpt-5-mini、gpt-5-nano などです（出典8）。知らない名前を渡すと、`Unknown model` の例外を投げます（出典8）。gpt-5-mini は、2026-12-11 に API から外れる予定です（出典5）。移行先は gpt-5.6-terra です（出典5）。gpt-5-mini の名前で選ぶ書き方は、2026-12-11 を過ぎると役に立ちません。

gpt-5.6-terra に `o200k_base` を使う根拠は、tiktoken にあります。tiktoken の `model.py` には、名前の先頭で選ぶ表があります（出典9）。その表は、`gpt-5` で始まる名前を `o200k_base` にしています（出典9）。gpt-5.6-terra もこの決まりに当てはまります。ただし、モデルのページと料金のページには、エンコーディングの記載がありません（出典1、2）。そのため、`o200k_base` で数えた値は見積もりとして扱います。

同じ `model.py` には、gpt-6 で始まる名前がありません（出典9）。gpt-6 系のエンコーディングは、tiktoken からはわかりません。gpt-6 系のトークン数は、OpenAI のトークン数の API で数えます。

エンコーディング名を直接書く書き方なら、ライブラリが新しいモデル名を知らなくても止まりません。その代わり、なぜその名前なのかをコードの近くに書き残しておきます。

## 手元で数えた数と請求の数はずれる

OpenAI には、送る前に入力のトークン数を返す API があります（出典4）。返る数には、メッセージの役割と区切りを表す書式のトークンも入ります（出典4）。この書式のトークンは、手元で数える文字列には出てきません（出典4）。tiktoken のような手元のトークナイザーは平文には使えますが、画像とファイルは数えられません（出典4）。ツールとスキーマが足すトークンも、手元では数えにくいと書かれています（出典4）。

js-tiktoken で数えた93トークンは、依頼文の文字列の分です。実際の入力は、書式のトークンの分だけ増えます。この記事の例では入力の料金は上限全体の2%未満なので、入力が多少増えても上限の見積もりはほとんど変わりません。長い文書か画像を渡すなら、API で数えたほうが正確です。

JavaScript の公式 SDK にも、この API を呼ぶメソッドがあります（出典4）。メソッドの名前は `client.responses.inputTokens.count` です。この API を呼ぶには OpenAI の API キーが要ります。この記事を書いた環境にはキーが無く、実行は見送りました。

## Claude のトークン数はこの方法では数えられない

js-tiktoken のエンコーディングは OpenAI のモデル用で、Claude には使えません。Anthropic には `@anthropic-ai/tokenizer` というパッケージがあります（出典11）。README によれば、Claude 3 以降のモデルでは数が正確に出ません（出典11）。大まかな近似にしか使えない、という扱いです（出典11）。

Claude のトークン数を事前に知るには、Anthropic のトークン数の API を使います（出典12）。この API は無料で、使用量の段階に応じた毎分のリクエスト数の制限があります（出典12）。返る数は見積もりで、実際の入力と少し違うことがあると書かれています（出典12）。呼ぶには Anthropic の API キーが要るので、この記事では実行していません。

## 料金がかからない範囲

手順1から3までと `unknown-model.ts` は、API を一度も呼ばないので無料です。通信するのは `npm install` のときで、トークンを数える処理はネットワークを使いません。

料金が要るのは、OpenAI API を実際に呼ぶ操作です。gpt-5.6-terra なら、100万トークンあたり入力 2.00 ドル、出力 12.00 ドルです（出典1、2）。トークン数の API も OpenAI の API キーが要りますが、この記事ではその料金を確かめていません。

## まとめ

手元に、入力のトークン数を数えて料金の上限を出す `estimate.ts` ができました。単価の2つの数字を書き換えれば、ほかのモデルの見積もりにも使えます。あなたのアプリでは、1回のリクエストの出力に何トークンまで払えますか。

講座の次の記事は[429 エラーとリトライ](/posts/llm-api-429-retry-sdk-mock)です。

## 出典

確認日は、どれも 2026-10-31 です。本文の（出典1）などの番号は、この表の番号を指します。

| # | 題名 | URL | 確認日 |
|---|---|---|---|
| 1 | Pricing（OpenAI API） | https://developers.openai.com/api/docs/pricing | 2026-10-31 |
| 2 | GPT-5.6 Terra Model（OpenAI API） | https://developers.openai.com/api/docs/models/gpt-5.6-terra | 2026-10-31 |
| 3 | Reasoning models（OpenAI API） | https://developers.openai.com/api/docs/guides/reasoning | 2026-10-31 |
| 4 | Counting tokens（OpenAI API） | https://developers.openai.com/api/docs/guides/token-counting | 2026-10-31 |
| 5 | Deprecations（OpenAI API） | https://developers.openai.com/api/docs/deprecations | 2026-10-31 |
| 6 | js-tiktoken（npm） | https://www.npmjs.com/package/js-tiktoken | 2026-10-31 |
| 7 | dqbd/tiktoken js/README.md | https://github.com/dqbd/tiktoken/blob/main/js/README.md | 2026-10-31 |
| 8 | js-tiktoken 1.0.21 dist/chunk-VL2OQCWN.js | https://unpkg.com/js-tiktoken@1.0.21/dist/chunk-VL2OQCWN.js | 2026-10-31 |
| 9 | openai/tiktoken tiktoken/model.py | https://github.com/openai/tiktoken/blob/main/tiktoken/model.py | 2026-10-31 |
| 10 | Node.js v22 Modules: TypeScript | https://nodejs.org/docs/latest-v22.x/api/typescript.html | 2026-10-31 |
| 11 | anthropics/anthropic-tokenizer-typescript README | https://github.com/anthropics/anthropic-tokenizer-typescript | 2026-10-31 |
| 12 | Token counting（Claude API Docs） | https://platform.claude.com/docs/en/build-with-claude/token-counting | 2026-10-31 |

AI 支援で執筆しました。コードは 2026-10-31 に実際に実行して確認しています。
