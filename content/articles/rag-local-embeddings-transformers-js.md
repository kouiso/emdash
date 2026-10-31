---
title: "埋め込みを手元で作ってベクトル検索する【Transformers.js、API キー不要】"
slug: "rag-local-embeddings-transformers-js"
description: "Transformers.js で、埋め込みモデル multilingual-e5-small を手元で動かします。FAQ 8件を384次元のベクトルにして検索します。API キーも有料のサービスも使いません。実際に出たスコアと、関係のない質問でもスコアが0.78前後になる例を載せています。"
tags: ["RAG", "埋め込み", "Transformers.js", "TypeScript"]
main_keyword: "RAG"
target_query: null
course_step: 3
cost_estimate: "記事の手順は API キーも有料のサービスも使わないので無料です。モデルは Hugging Face のアカウントなしでダウンロードできました。埋め込みを有料の API で作ると、トークン数に応じた料金がかかります。"
run_environment: "Node.js 22.22.0、@huggingface/transformers 4.3.2、Linux x64"
verified_at: "2026-10-31"
prev: "rag-chunking-japanese-text"
next: "rag-answer-with-citations-claude"
sources:
  - url: "https://platform.claude.com/docs/en/build-with-claude/embeddings"
    title: "Embeddings"
    accessed: 2026-10-31
  - url: "https://huggingface.co/intfloat/multilingual-e5-small"
    title: "intfloat/multilingual-e5-small"
    accessed: 2026-10-31
  - url: "https://huggingface.co/Xenova/multilingual-e5-small/tree/main/onnx"
    title: "Xenova/multilingual-e5-small (onnx)"
    accessed: 2026-10-31
  - url: "https://huggingface.co/docs/transformers.js/api/pipelines"
    title: "Transformers.js pipelines"
    accessed: 2026-10-31
  - url: "https://huggingface.co/docs/transformers.js/guides/dtypes"
    title: "Using quantized models (dtypes)"
    accessed: 2026-10-31
  - url: "https://github.com/huggingface/transformers.js/blob/4.3.2/packages/transformers/src/utils/dtypes.js"
    title: "transformers.js 4.3.2 src/utils/dtypes.js"
    accessed: 2026-10-31
  - url: "https://huggingface.co/docs/transformers.js/api/env"
    title: "Transformers.js env"
    accessed: 2026-10-31
  - url: "https://registry.npmjs.org/@huggingface/transformers"
    title: "@huggingface/transformers (npm registry)"
    accessed: 2026-10-31
  - url: "https://github.com/microsoft/onnxruntime/blob/v1.30.0/js/node/script/install-metadata.js"
    title: "onnxruntime v1.30.0 js/node/script/install-metadata.js"
    accessed: 2026-10-31
  - url: "https://github.com/microsoft/onnxruntime/blob/v1.30.0/js/node/script/install.js"
    title: "onnxruntime v1.30.0 js/node/script/install.js"
    accessed: 2026-10-31
  - url: "https://nodejs.org/docs/latest-v22.x/api/typescript.html"
    title: "Node.js v22 Modules: TypeScript"
    accessed: 2026-10-31
  - url: "https://huggingface.co/docs/hub/rate-limits"
    title: "Hub Rate limits"
    accessed: 2026-10-31
  - url: "https://docs.voyageai.com/docs/pricing"
    title: "Pricing (Voyage AI)"
    accessed: 2026-10-31
ai_assisted: true
needs_api_key: false
status: draft
publish_at: null
updated: 2026-10-31
---

RAG の検索に使う埋め込みは、Transformers.js を使えば手元の Node.js で作れます。モデルは多言語に対応した multilingual-e5-small で、API キーは要りません。この記事では、FAQ 8件と質問をベクトルにして、近い順に並べるところまで TypeScript で書きます。

できあがる検索は、FAQ のスコアと id を高い順に返します。質問は「返金はいつ？」です。2位の `cancel` の文書に、「返金」という語は出てきません。

```text
0.852 returns
0.832 cancel
0.823 points
```

対象は、TypeScript で何か作ったことがあり、RAG の検索部分を自分で組んでいる人です。書き写すファイルは6つで、`npm install` で入れる依存は1つです。

[前の記事](/posts/rag-chunking-japanese-text)では、文書をチャンクに分けました。講座のこの記事では、分けた文字列をベクトルにします。

## 埋め込みの検索は質問と文書をベクトルにして近い順に並べる

埋め込みは、文の意味の近さを測れるように、文を数の並びにしたものです（出典1）。この数の並びをベクトルと呼びます。質問と文書を同じモデルでベクトルにし、質問に近い文書から順に返すのが埋め込みの検索です。

近さには、2つのベクトルのコサイン類似度を使います（出典2）。長さを1にそろえたベクトルなら、コサイン類似度は内積と同じ値です（出典1）。内積は、同じ位置の数どうしを掛けて、全部を足した値です。

BM25 は、質問と同じ語を含む文書しか見つけられません。BM25 の検索は、[別の記事](/posts/rag-bm25-search-typescript)で作りました。そこでは、「返金はいつ？」の答えの文書が上位3件に入りませんでした。埋め込みの検索は語の一致を数えないので、言い換えた文書にもスコアが付きます。

使うモデルは intfloat/multilingual-e5-small です。100の言語に対応し、1つの文を384次元のベクトルにします（出典2）。ライセンスは MIT です（出典2）。Transformers.js では、ONNX の形式に変換したモデルを使います（出典3）。リポジトリの名前は Xenova/multilingual-e5-small です（出典3）。

## 使うバージョンと準備

動かした環境は、Linux x64 の Node.js 22.22.0 と npm 10.9.4 です。Transformers.js は、`@huggingface/transformers` の 4.3.2 を使います。2026-10-31 の時点で、npm の latest はこのバージョンでした（出典8）。

Node.js 22.18.0 以上は、`.ts` のファイルを型を外してそのまま実行します（出典11）。型は調べないので（出典11）、型の確認は別に `tsc` 7.0.2 で行いました。

作業フォルダを作って移動します。

```bash
mkdir local-embeddings
cd local-embeddings
```

`package.json` を置きます。バージョンには `^` を付けず、4.3.2 に固定しました。

```json
{
  "name": "local-embeddings",
  "private": true,
  "type": "module",
  "dependencies": {
    "@huggingface/transformers": "4.3.2"
  }
}
```

依存を入れて、`node_modules` の大きさを見ます。

```bash
npm install
du -sh node_modules
```

```text
745M	node_modules
```

46個のパッケージが入り、`node_modules` は 745M になりました。いちばん大きいのは、モデルを実行する `onnxruntime-node` です。

Linux x64 では、`onnxruntime-node` が追加のファイルを取ってきます（出典9）。取ってくるのは CUDA 12 用のライブラリで、取得元は NuGet です（出典9）。GPU で動かすためのファイルで、macOS と Windows では取ってきません（出典9）。CUDA のライブラリは、1ファイルで 272,054,000 バイトありました。

GPU を使わないなら、このダウンロードは止められます（出典10）。環境変数 `ONNXRUNTIME_NODE_INSTALL` に `skip` を入れて実行します。

```bash
ONNXRUNTIME_NODE_INSTALL=skip npm install
```

別のフォルダでこのコマンドを使うと、`node_modules` は 484M でした。CUDA のライブラリが無くても、CPU での検索の結果は同じ値になりました。

## モデルを読み込んで1文を384次元のベクトルにする

埋め込みを作る処理は、次の `embed.ts` に入れます。モデルの読み込みはファイルを読んだときに1回だけ行い、`embed` の呼び出しでは使い回します。

```ts
import { pipeline } from "@huggingface/transformers";

const extractor = await pipeline("feature-extraction", "Xenova/multilingual-e5-small", {
  dtype: "q8",
});

export async function embed(texts: string[]): Promise<number[][]> {
  const output = await extractor(texts, { pooling: "mean", normalize: true });
  return output.tolist();
}
```

`"feature-extraction"` は、モデルから文のベクトルを取り出すパイプラインの名前です（出典4）。`dtype: "q8"` で、8ビットに量子化したモデルのファイルを選びます（出典5、出典6）。

`pooling: "mean"` は、トークンごとのベクトルの平均を取る指定です（出典4）。平均を取ると、1つの文が1本のベクトルになります。`normalize: true` が、長さを1にそろえる指定です（出典4）。

どちらも、省くと何もしない設定が既定です（出典4）。`pooling` を省くと、トークンの数だけのベクトルが返ります（出典4）。`tolist()` は、結果を JavaScript の入れ子の配列に直します（出典4）。

モデルカードは、Hugging Face のモデルのページにある説明のことです。e5 のモデルカードの使い方も、平均を取ってから長さを1にそろえています（出典2）。

1つの文をベクトルにして中身を見るのが、次の `show-vector.ts` です。

```ts
import { embed } from "./embed.ts";

const text = process.argv[2] ?? "";
const [vector] = await embed([`query: ${text}`]);
const length = Math.sqrt(vector.reduce((sum, x) => sum + x * x, 0));

console.log("次元数", vector.length);
console.log("先頭の3つ", vector.slice(0, 3).map((x) => x.toFixed(4)));
console.log("長さ", length.toFixed(4));
```

e5 のモデルでは、質問の頭に `query: ` を付けます（出典2）。検索される文書の頭に付けるのは `passage: ` です（出典2）。モデルカードは、付けないと性能が下がると書いています（出典2）。

```bash
node show-vector.ts "返金はいつ？"
```

```text
次元数 384
先頭の3つ [ '0.0815', '-0.0418', '-0.0304' ]
長さ 1.0000
```

質問は384個の数の並びになり、長さは1にそろいました。

### モデルのファイルは node_modules の中に保存される

初回の実行で、モデルのファイルを Hugging Face からダウンロードします。保存先は、既定では Transformers.js のパッケージの中の `.cache` です（出典7）。

```bash
du -sh node_modules/@huggingface/transformers/.cache
```

```text
130M	node_modules/@huggingface/transformers/.cache
```

保存されたのは4ファイルです。モデル本体のほかの3つは、設定の `config.json` とトークナイザーのファイル2つでした。モデル本体の `onnx/model_quantized.onnx` は、118,308,185 バイトです（出典3）。

`dtype` を省いたときに読むのは、fp32 の `model.onnx` です（出典6）。こちらは 470,268,533 バイトで、q8 のおよそ4倍です（出典3）。既定が q8 になるのは、WebAssembly で動かすときだけです（出典6）。ダウンロードを小さくするために、この記事は q8 にしました。

記事を書いた環境では、ダウンロードを含む初回の実行が4.3秒、2回目が2.6秒でした。`node_modules` を消すとモデルも消え、次の実行でまたダウンロードします。保存先は `env.cacheDir` で変えられます（出典7）。

## FAQ 8件をベクトルにして検索する

検索する文書は、架空のネットショップの FAQ 8件です。[BM25 の記事](/posts/rag-bm25-search-typescript)と同じ文書です。同じ質問を投げれば、2つの検索の結果を比べられます。次のファイルを `docs.ts` として保存します。

```ts
export type Doc = { id: string; text: string };

// 架空のネットショップのよくある質問です。
export const docs: Doc[] = [
  { id: "returns", text: "返品は、商品の到着から30日以内に受け付けます。返品できるのは未開封の商品だけです。" },
  { id: "cancel", text: "注文をキャンセルした場合、代金の払い戻しは5営業日以内にクレジットカード会社を通じて行います。" },
  { id: "payment", text: "支払い方法は、クレジットカード、コンビニ払い、PayPayが使えます。" },
  { id: "shipping-fee", text: "送料は全国一律550円です。5,000円以上の注文は送料無料になります。" },
  { id: "delivery", text: "注文から発送までは2営業日です。離島への配送には、さらに3日かかります。" },
  { id: "password", text: "パスワードを忘れた場合は、ログイン画面の再設定のリンクから新しいパスワードを登録してください。" },
  { id: "login", text: "ログインできないときは、メールアドレスの入力ミスがないか、ブラウザのCookieが有効かを確かめてください。" },
  {
    id: "points",
    text: "ポイントは、購入金額の1%を発送の翌日に付与します。返品した注文のポイントは取り消します。ポイントの有効期限は最後の購入から1年です。返品の手続き中はポイントを使えません。期限が切れたポイントは戻せません。ポイントは1ポイント1円として、次の注文の支払いに使えます。返品の対象外の商品でも、ポイントは付与します。",
  },
];
```

検索の本体は `vector-search.ts` です。文書の配列を受け取り、質問を渡すと上位の文書を返す関数を作ります。

```ts
import type { Doc } from "./docs.ts";
import { embed } from "./embed.ts";

export type Hit = { doc: Doc; score: number };

function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

export async function createVectorSearch(docs: Doc[]) {
  const vectors = await embed(docs.map((doc) => `passage: ${doc.text}`));

  return async (query: string, topK = 3): Promise<Hit[]> => {
    const [q] = await embed([`query: ${query}`]);
    return docs
      .map((doc, i) => ({ doc, score: dot(q, vectors[i]) }))
      .sort((x, y) => y.score - x.score)
      .slice(0, topK);
  };
}
```

`createVectorSearch` を呼んだ時点で、8件の文書をまとめてベクトルにします。文書のベクトルは、質問のたびに作り直しません。質問のベクトルとの内積を文書ごとに求め、大きい順に `topK` 件を返します。長さが1のベクトルどうしなので、この内積がコサイン類似度です。

型だけを読み込む `Doc` には、`import type` と書きます。Node.js の型を外す実行では、`type` が無いと値として読み込もうとして失敗します（出典11）。

検索して結果を出すのは `search.ts` です。2つ目の引数で、返す件数を変えられます。

```ts
import { docs } from "./docs.ts";
import { createVectorSearch } from "./vector-search.ts";

const query = process.argv[2] ?? "";
const topK = Number(process.argv[3] ?? "3");
const search = await createVectorSearch(docs);

for (const hit of await search(query, topK)) {
  console.log(hit.score.toFixed(3), hit.doc.id);
}
```

```bash
node search.ts "返金はいつ？"
```

```text
0.852 returns
0.832 cancel
0.823 points
```

答えの書かれた `cancel` が2位に入りました。`cancel` の文書にあるのは「払い戻し」で、「返金」の語はありません。BM25 では「は」だけが一致し、上位3件に入らなかった文書です。1位の `returns` は返品の条件を書いた文書で、返金の時期は書いていません。

```bash
node search.ts "家に届くまで何日？"
```

```text
0.859 delivery
0.836 shipping-fee
0.835 returns
```

「届く」という語は、FAQ の8件のどこにも出てきません。それでも、発送までの日数を書いた `delivery` が1位でした。

## 関係のない質問でも8件すべてに0.78前後のスコアが付く

FAQ と関係のない質問を投げ、8件すべてのスコアを出します。

```bash
node search.ts "宿題を手伝って" 8
```

```text
0.797 shipping-fee
0.793 points
0.792 login
0.790 payment
0.785 returns
0.785 delivery
0.780 password
0.779 cancel
```

FAQ に宿題の話は1件もないのに、1位のスコアは 0.797 です。1位と8位の差も、0.018 しかありません。

e5 のコサイン類似度は、0.7から1.0のあたりに集まります（出典2）。学習のときの温度のパラメーターを、0.01 と低くしたためです（出典2）。モデルカードは、検索で意味があるのはスコアの値より順位だと書いています（出典2）。

このデータでも、値の差は小さく出ました。答えの文書のスコアは、`cancel` が 0.832、`delivery` が 0.859 です。関係のない質問の1位は 0.797 で、差は 0.04 から 0.06 しかありません。

0.5 のような固定の下限で切ると、宿題の質問でも8件すべてが残ります。この記事では下限を置かず、上位3件をそのまま返すことにしました。答えが無いと判断する役は、検索結果を受け取って回答を作る側に任せます。

## 2回目からはネットワークが無くても動く

モデルを一度ダウンロードしたあとは、検索にネットワークを使いません。ネットワークの無い環境で、記事の `node` のコマンド4つを実行し直しました。4つとも成功し、スコアも同じ値でした。

Transformers.js は、Node.js ではファイルシステムのキャッシュを既定で使います（出典7）。外からの読み込みを禁止するなら、`env.allowRemoteModels` を `false` にします（出典7）。

## 料金がかからない範囲

記事の手順は、API キーも有料のサービスも使わないので無料です。モデルのダウンロードには、Hugging Face のアカウントもトークンも使いませんでした。初回の実行で取得したファイルは4つです。

Hugging Face は、ログインしていない利用者にもダウンロードを許しています（出典12）。回数の上限は IP アドレスごとに5分で3,000回で、2025年9月時点の値です（出典12）。

埋め込みを API で作ると、トークン数に応じて料金がかかります。Anthropic は、自社の埋め込みモデルを出していません（出典1）。同じページは、埋め込みの提供元の1つとして Voyage AI を挙げています（出典1）。

Voyage AI の voyage-4-lite は、100万トークンあたり $0.02 です（出典13）。最初の2億トークンは、どのアカウントも無料です（出典13）。この記事では Voyage AI の API を呼んでいないので、実際の金額は確かめていません。

手元で動かす分、ディスクと CPU の時間は使います。この記事の環境では、`node_modules` が 745M、モデルが 130M でした。

## 確認すること

自分の文書で埋め込みの検索を組むときは、次の4つをすべて確かめます。

- 質問の頭に `query: `、文書の頭に `passage: ` を付けたか
- `pooling: "mean"` と `normalize: true` を指定しているか
- スコアの値で切らずに、順位で使うようにしたか
- 文書が、モデルの上限の512トークンに収まっているか（出典2）

関係のない質問を見分けるには、自分のデータでスコアの下限を測りますか。それとも、回答を作るモデルに「わかりません」と答えさせますか。

講座の次の記事では、検索した文書を Claude に渡し、出典つきで回答させます。[次の記事](/posts/rag-answer-with-citations-claude)に進んでください。

## 出典

確認日は、どれも 2026-10-31 です。本文の（出典1）〜（出典13）は、この表の番号を指します。

| # | 題名 | URL | 確認日 |
|---|---|---|---|
| 1 | Embeddings（Anthropic） | https://platform.claude.com/docs/en/build-with-claude/embeddings | 2026-10-31 |
| 2 | intfloat/multilingual-e5-small（モデルカード） | https://huggingface.co/intfloat/multilingual-e5-small | 2026-10-31 |
| 3 | Xenova/multilingual-e5-small のファイル一覧（onnx） | https://huggingface.co/Xenova/multilingual-e5-small/tree/main/onnx | 2026-10-31 |
| 4 | Transformers.js pipelines | https://huggingface.co/docs/transformers.js/api/pipelines | 2026-10-31 |
| 5 | Using quantized models (dtypes)（Transformers.js） | https://huggingface.co/docs/transformers.js/guides/dtypes | 2026-10-31 |
| 6 | transformers.js 4.3.2 の src/utils/dtypes.js | https://github.com/huggingface/transformers.js/blob/4.3.2/packages/transformers/src/utils/dtypes.js | 2026-10-31 |
| 7 | Transformers.js env | https://huggingface.co/docs/transformers.js/api/env | 2026-10-31 |
| 8 | @huggingface/transformers（npm registry） | https://registry.npmjs.org/@huggingface/transformers | 2026-10-31 |
| 9 | onnxruntime v1.30.0 の install-metadata.js | https://github.com/microsoft/onnxruntime/blob/v1.30.0/js/node/script/install-metadata.js | 2026-10-31 |
| 10 | onnxruntime v1.30.0 の install.js | https://github.com/microsoft/onnxruntime/blob/v1.30.0/js/node/script/install.js | 2026-10-31 |
| 11 | Node.js v22 Modules: TypeScript | https://nodejs.org/docs/latest-v22.x/api/typescript.html | 2026-10-31 |
| 12 | Hub Rate limits（Hugging Face） | https://huggingface.co/docs/hub/rate-limits | 2026-10-31 |
| 13 | Pricing（Voyage AI） | https://docs.voyageai.com/docs/pricing | 2026-10-31 |

AI 支援で執筆しました。コードは 2026-10-31 に実際に実行して確認しています。
