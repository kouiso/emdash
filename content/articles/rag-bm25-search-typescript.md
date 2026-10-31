---
title: "RAG の検索部分を BM25 で作る【TypeScript、API キーなしで動く】"
slug: "rag-bm25-search-typescript"
description: "RAG の検索部分を、依存パッケージなしの TypeScript で BM25 として書きます。日本語は Intl.Segmenter で語に分けます。架空の FAQ 8件に質問を投げ、実際に出たスコアと、答えの文書が出てこない質問の例を載せています。"
tags: ["RAG", "BM25", "TypeScript"]
main_keyword: "RAG"
target_query: null
course_step: 3
cost_estimate: "記事のコードは Node.js の組み込み機能だけで動き、API を呼ばないので無料です。検索結果を Claude に渡して回答させると、トークン数に応じた API の料金がかかります。"
run_environment: "Node.js 22.22.0（ICU 77.1）、依存パッケージなし"
verified_at: "2026-10-31"
prev: "structured-output-methods-compare"
next: "rag-chunking-japanese-text"
sources:
  - url: "https://www.anthropic.com/news/contextual-retrieval"
    title: "Introducing Contextual Retrieval"
    accessed: 2026-10-31
  - url: "https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf"
    title: "The Probabilistic Relevance Framework: BM25 and Beyond"
    accessed: 2026-10-31
  - url: "https://lucene.apache.org/core/10_3_1/core/org/apache/lucene/search/similarities/BM25Similarity.html"
    title: "BM25Similarity (Lucene 10.3.1 core API)"
    accessed: 2026-10-31
  - url: "https://www.elastic.co/docs/reference/elasticsearch/index-settings/similarity"
    title: "Similarity settings"
    accessed: 2026-10-31
  - url: "https://nodejs.org/docs/latest-v22.x/api/typescript.html"
    title: "Node.js v22 Modules: TypeScript"
    accessed: 2026-10-31
  - url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter/Segmenter"
    title: "Intl.Segmenter() constructor"
    accessed: 2026-10-31
  - url: "https://tc39.es/ecma402/#sec-createsegmentdataobject"
    title: "ECMAScript Internationalization API Specification 19.7.1 CreateSegmentDataObject"
    accessed: 2026-10-31
  - url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize"
    title: "String.prototype.normalize()"
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

RAG の検索部分は、BM25 なら API キーも依存パッケージも使わずに TypeScript で書けます。日本語は Node.js に組み込みの `Intl.Segmenter` で語に分け、BM25 の式でスコアを付けます。架空のネットショップの FAQ 8件に質問を投げ、実際に出たスコアと、答えの文書が出てこない質問の例まで載せます。

対象は、TypeScript で何か作ったことがあり、RAG を自分で組んでみたい人です。手順は20分ほどで終わります。

講座はこの記事から RAG に入ります。[前の記事](/posts/structured-output-methods-compare)は構造化出力の比較です。

## RAG の検索部分は質問の語を含む文書にスコアを付けて並べる

RAG は、知識ベースから関連する情報を取り出し、ユーザーのプロンプトに足す方法です（出典1）。取り出す部分に使うのが BM25 です。BM25 はランキング関数の1つで、語の一致で文書を探します（出典1）。

文書のスコアは、質問の語ごとに求めた重みの合計です（出典2）。1語の重みは次の式で決まります（出典2、出典3）。

```text
重み = idf × tf / (tf + k1 × (1 - b + b × dl / avgdl))
idf  = log(1 + (N - n + 0.5) / (n + 0.5))
```

| 記号 | 意味 |
|---|---|
| `tf` | その語が文書に出た回数 |
| `dl` | 文書の語の数 |
| `avgdl` | 全文書の `dl` の平均 |
| `N` | 文書の数 |
| `n` | その語を含む文書の数 |
| `k1` | `tf` が増えたときに重みが頭打ちになる速さ |
| `b` | 文書の長さで `tf` を割り引く強さ |

`tf` がいくら増えても、1語の重みは `idf` を超えません（出典2）。含む文書が少ない語ほど `idf` が大きく、重みも大きくなります。`b` は0から1の値で、1 なら長さで全部割り引き、0 なら割り引きません（出典2）。

`k1` の既定値は、Lucene と Elasticsearch のどちらも 1.2 です（出典3、出典4）。`b` の既定値は、どちらも 0.75 です（出典3、出典4）。論文も、多くの実験で `b` が0.5〜0.8、`k1` が1.2〜2の範囲がよいと報告しています（出典2）。この記事も 1.2 と 0.75 を使います。

`idf` の式は Lucene の実装と同じ形にしました（出典3）。`log` の中が必ず1より大きいので、すべての文書に出る語でも `idf` は0より大きくなります。

## 使うバージョンと準備

動かした環境は Node.js 22.22.0 で、Node.js に入っている ICU は 77.1 です。依存パッケージは1つも使わないので、`npm install` は要りません。

Node.js 22.18.0 以上は、`.ts` のファイルを型を外してそのまま実行します（出典5）。型は調べないので（出典5）、型の確認は別に `tsc` 7.0.2 で行いました。`import` にはファイルの拡張子を書き、型だけを読み込むときは `import type` と書きます（出典5）。

作業フォルダを作って移動します。

```bash
mkdir bm25-search
cd bm25-search
```

`package.json` を置きます。`import` と `export` を使うので、`"type": "module"` を入れます（出典5）。

```json
{
  "name": "bm25-search",
  "private": true,
  "type": "module"
}
```

## 日本語の文を Intl.Segmenter で語に分ける

日本語は単語の間に空白が無いので、BM25 で数える前に文を語へ分けます。

`Intl.Segmenter` は `granularity: "word"` で単語の境目に分けます（出典6）。境目はロケールの規則で決まります（出典6）。区切りの1つ1つを、この記事では語と呼びます。区切りごとの `isWordLike` は、単語らしい区切りかどうかを表します（出典7）。句読点と空白だけの区切りを外すために使います。

```ts
const segmenter = new Intl.Segmenter("ja", { granularity: "word" });

export function tokenize(text: string): string[] {
  const normalized = text.normalize("NFKC").toLowerCase();
  const tokens: string[] = [];
  for (const { segment, isWordLike } of segmenter.segment(normalized)) {
    if (isWordLike) tokens.push(segment);
  }
  return tokens;
}
```

このファイルを `tokenize.ts` として保存します。`normalize("NFKC")` は互換文字をそろえる正規化です（出典8）。MDN は、この正規化が検索の用途に向くと書いています（出典8）。`toLowerCase()` で英字を小文字にそろえ、質問と文書で表記の違う語を同じ語として数えます。

分けた結果を見るために、`show-tokens.ts` も置きます。

```ts
import { tokenize } from "./tokenize.ts";

console.log(tokenize(process.argv[2] ?? ""));
```

```bash
node show-tokens.ts "支払いにＰａｙＰａｙが使えます。"
```

```text
[
  '支払い', 'に',
  'paypay', 'が',
  '使',     'え',
  'ます'
]
```

全角の `ＰａｙＰａｙ` は `paypay` になり、句点の `。` は外れました。「使えます」のほうは `使`、`え`、`ます` の3つに分かれています。

```bash
node show-tokens.ts "使える支払い方法"
```

```text
[ '使える', '支払い', '方法' ]
```

質問に「使える」と書くと、こちらは1語のままです。文書の「使えます」とは共通の語が無いので、BM25 では一致しません。

区切りが単語らしいかどうかの判定は、実装に任されています（出典7）。この出力は Node.js 22.22.0（ICU 77.1）で得たものです。別のランタイムでは、結果が変わることがあります。活用形のずれは、依存を増やさないためにこの記事では残します。

## BM25 のスコアを計算する関数

式をそのままコードにしたのが `bm25.ts` です。文書の配列を受け取り、質問を渡すと上位の文書を返す関数を作ります。

```ts
import { tokenize } from "./tokenize.ts";

export type Doc = { id: string; text: string };
export type Hit = { doc: Doc; score: number };

export function createSearch(docs: Doc[], k1 = 1.2, b = 0.75) {
  const tfs = docs.map((doc) => {
    const tf = new Map<string, number>();
    for (const term of tokenize(doc.text)) {
      tf.set(term, (tf.get(term) ?? 0) + 1);
    }
    return tf;
  });
  const lengths = docs.map((doc) => tokenize(doc.text).length);
  const avgdl = lengths.reduce((sum, n) => sum + n, 0) / docs.length;

  const df = new Map<string, number>();
  for (const tf of tfs) {
    for (const term of tf.keys()) df.set(term, (df.get(term) ?? 0) + 1);
  }
  const idf = (term: string) => {
    const n = df.get(term) ?? 0;
    return Math.log(1 + (docs.length - n + 0.5) / (n + 0.5));
  };

  return (query: string, topK = 3): Hit[] => {
    const terms = new Set(tokenize(query));
    const hits = docs.map((doc, i) => {
      let score = 0;
      for (const term of terms) {
        const f = tfs[i].get(term) ?? 0;
        if (f === 0) continue;
        const norm = k1 * (1 - b + (b * lengths[i]) / avgdl);
        score += (idf(term) * f) / (f + norm);
      }
      return { doc, score };
    });
    return hits
      .filter((hit) => hit.score > 0)
      .sort((x, y) => y.score - x.score)
      .slice(0, topK);
  };
}
```

`createSearch` を呼んだ時点で、文書ごとの数を先に数え終えます。数えるのは語の回数（`tfs`）、語の数（`lengths`）、語を含む文書の数（`df`）です。先に数えておけば、質問のたびに文書を分け直さずに済みます。

返す関数の中では、質問の語を `Set` に入れて重複を除きます。質問に同じ語が2回あっても、その語の重みは1回分だけ足します。スコアが0の文書は返さず、高い順に `topK` 件を返します。

## FAQ 8件に質問を投げる

検索する文書は、架空のネットショップのよくある質問8件です。長さをそろえず、最後の `points` だけを、語の数で他の3倍以上にしました。

```ts
import type { Doc } from "./bm25.ts";

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

このファイルを `docs.ts` として保存します。検索して結果を出すのは `search.ts` です。2つ目の引数で `b` を変えられるようにしてあります。

```ts
import { createSearch } from "./bm25.ts";
import { docs } from "./docs.ts";

const query = process.argv[2] ?? "";
const b = Number(process.argv[3] ?? "0.75");
const search = createSearch(docs, 1.2, b);

for (const hit of search(query)) {
  console.log(hit.score.toFixed(3), hit.doc.id);
}
```

```bash
node search.ts "返品できる期間は？"
```

```text
1.771 returns
0.677 points
0.040 shipping-fee
```

返品の条件を書いた `returns` が1位です。質問の語のうち、`returns` には「返品」「できる」「は」の3つがありました。2位の `points` は「返品」を3回含みます。3位の `shipping-fee` は「は」だけが一致した文書で、スコアは 0.040 です。

一致した語は、記事に載せない確認用のスクリプトで1文書ずつ数えました。

```bash
node search.ts "使える支払い方法"
```

```text
1.849 payment
0.318 points
```

`payment` は「支払い」と「方法」で1位になりました。文書の「使えます」は質問の「使える」と一致しないので、このスコアに入っていません。語の分かれ方の違いが、そのままスコアの差になります。

## 語が一致しない質問では答えの文書が出てこない

BM25 は、質問と同じ語を含む文書しか見つけられません。

```bash
node search.ts "返金はいつ？"
```

```text
0.040 points
0.040 shipping-fee
0.039 delivery
```

答えは `cancel` の「払い戻しは5営業日以内」にありますが、上位3件に入りませんでした。質問は「返金」「は」「いつ」に分かれ、`cancel` に一致したのは「は」だけです。上位の3件も「は」だけで一致しています。

「は」は8件すべての文書に出るので、`idf` は `log(1 + 0.5 / 8.5)` で約 0.057 です。助詞だけで一致した文書は、このデータでは 0.040 前後のスコアに並びました。

逆に、エラーコードのような文字列そのものを探すのは BM25 の得意な場面です（出典1）。BM25 と埋め込みのモデルを組み合わせると、RAG の検索結果はより広く正確になります（出典1）。「返金」と「払い戻し」のような言い換えは、埋め込みを使った検索を足して拾います（出典1）。

## b を 0 にすると長い文書が上に来る

`b` を変えると、長い文書の順位が入れ替わります。

```bash
node search.ts "返品"
```

```text
0.847 returns
0.637 points
```

```bash
node search.ts "返品" 0
```

```text
0.915 points
0.801 returns
```

`b` が 0.75 なら、「返品」を2回含む短い `returns` が1位です。`b` を0にすると、3回含む長い `points` が上に来ました。

手で計算しても同じ値になります。8件の語の数の合計は219なので、`avgdl` は 27.375 です。「返品」は2件に出るので、`idf` は `log(1 + 6.5 / 2.5)` で約 1.281 です。`returns` は22語で `tf` が2なので、`b` が 0.75 のときのスコアは次のとおりです。

```text
1.281 × 2 / (2 + 1.2 × (0.25 + 0.75 × 22 / 27.375)) ≈ 0.847
```

`points` は83語で `tf` が3です。`b` が0なら分母の括弧が1になるので、`1.281 × 3 / (3 + 1.2)` で約 0.915 になります。

FAQ のように1件に1つの話題を書く文書では、`b` は 0.75 のままにします。長い `points` の主題はポイントです。返品の条件を書いた `returns` が上に来るほうが、質問に合うからです。

## 検索結果を LLM に渡すプロンプトにする

RAG では、取り出した文書をプロンプトに足してモデルに渡します（出典1）。`context.ts` は、そのプロンプトの文字列を作るところまでを受け持ちます。

```ts
import { createSearch } from "./bm25.ts";
import { docs } from "./docs.ts";

const question = process.argv[2] ?? "";
const search = createSearch(docs);
const hits = search(question).filter((hit) => hit.score >= 0.1);

const context = hits
  .map((hit) => `<doc id="${hit.doc.id}">\n${hit.doc.text}\n</doc>`)
  .join("\n");

console.log(`次の資料だけを使って質問に答えてください。
資料に答えが無いときは「わかりません」と答えてください。

${context}

質問: ${question}`);
```

`hit.score >= 0.1` で、助詞だけが一致した結果を外しています。0.1 は、この記事の実行結果から決めた値です。内容の語が一致した文書は 0.318 以上、助詞だけの文書は 0.040 以下でした。文書の数と長さで `idf` と `avgdl` が変わるので、自分のデータでは数え直してください。

```bash
node context.ts "返品できる期間は？"
```

```text
次の資料だけを使って質問に答えてください。
資料に答えが無いときは「わかりません」と答えてください。

<doc id="returns">
返品は、商品の到着から30日以内に受け付けます。返品できるのは未開封の商品だけです。
</doc>
<doc id="points">
ポイントは、購入金額の1%を発送の翌日に付与します。返品した注文のポイントは取り消します。ポイントの有効期限は最後の購入から1年です。返品の手続き中はポイントを使えません。期限が切れたポイントは戻せません。ポイントは1ポイント1円として、次の注文の支払いに使えます。返品の対象外の商品でも、ポイントは付与します。
</doc>

質問: 返品できる期間は？
```

```bash
node context.ts "返金はいつ？"
```

```text
次の資料だけを使って質問に答えてください。
資料に答えが無いときは「わかりません」と答えてください。



質問: 返金はいつ？
```

「返金はいつ？」では、資料が1件も入りませんでした。モデルに届くのは、資料に答えが無いときの指示と質問だけです。答えは `cancel` にあるのに、BM25 の段階で見つけられなかった結果です。

下限を置かずに助詞だけの文書を渡すと、ポイントと送料と配送日数の文が資料になります。どれも返金の時期は書いていません。答えが無いと伝わるほうを選び、この記事では下限を置きました。

## 料金がかからない範囲

記事の手順は Node.js の組み込み機能だけを使い、API を呼ばないので無料です。依存パッケージが無いので、ネットワークも使いません。ネットワークの無い環境で実行し直しても、記事の `node` のコマンドは9つとも成功しました。

作ったプロンプトを Claude に送ると、トークン数に応じた料金がかかります（出典9）。Claude Haiku 5.5 なら、100万トークンあたり入力 $0.10、出力 $0.50 です（出典9）。この単価は、プロンプトが10万トークン以下のときのものです（出典9）。

## 確認すること

自分の文書で BM25 の検索を組むときは、次の4つをすべて確かめます。

- `tokenize` の出力を見て、質問と文書で同じ語に分かれているか
- 全角と半角、大文字と小文字をそろえてから語に分けているか
- `b` を、文書の長さがそろっているかどうかで決めたか
- 助詞だけが一致した結果をプロンプトに入れない下限を、自分のデータで決めたか

「返金」と「払い戻し」のずれを、同義語の表を作って埋めますか。それとも埋め込みの検索を足しますか。

講座の次の記事では、長い日本語の文書を検索しやすい大きさに分けます。[次の記事](/posts/rag-chunking-japanese-text)に進んでください。

## 出典

確認日は、どれも 2026-10-31 です。本文の（出典1）〜（出典9）は、この表の番号を指します。出典2は Robertson と Zaragoza の2009年の論文で、3.4節と3.5節を根拠にしました。

| # | 題名 | URL | 確認日 |
|---|---|---|---|
| 1 | Introducing Contextual Retrieval（Anthropic） | https://www.anthropic.com/news/contextual-retrieval | 2026-10-31 |
| 2 | The Probabilistic Relevance Framework: BM25 and Beyond | https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf | 2026-10-31 |
| 3 | BM25Similarity（Lucene 10.3.1 core API） | https://lucene.apache.org/core/10_3_1/core/org/apache/lucene/search/similarities/BM25Similarity.html | 2026-10-31 |
| 4 | Similarity settings（Elasticsearch） | https://www.elastic.co/docs/reference/elasticsearch/index-settings/similarity | 2026-10-31 |
| 5 | Node.js v22 Modules: TypeScript | https://nodejs.org/docs/latest-v22.x/api/typescript.html | 2026-10-31 |
| 6 | Intl.Segmenter() constructor（MDN） | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter/Segmenter | 2026-10-31 |
| 7 | ECMAScript Internationalization API Specification 19.7.1 | https://tc39.es/ecma402/#sec-createsegmentdataobject | 2026-10-31 |
| 8 | String.prototype.normalize()（MDN） | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize | 2026-10-31 |
| 9 | Pricing | https://platform.claude.com/docs/en/about-claude/pricing | 2026-10-31 |

AI 支援で執筆しました。コードは 2026-10-31 に実際に実行して確認しています。
