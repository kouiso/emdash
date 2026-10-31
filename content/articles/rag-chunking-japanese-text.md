---
title: "RAG 用に日本語の文書をチャンクに分ける【文字数、見出し、重なり】"
slug: "rag-chunking-japanese-text"
description: "RAG に入れる日本語の Markdown を、見出しでセクションに分け、文の境目で上限の文字数まで詰めます。詰めたチャンクの末尾の文は、次のチャンクに重ねます。依存パッケージなしの TypeScript で、架空のネットショップのご利用ガイドを分けた実際の出力を載せています。"
tags: ["RAG", "TypeScript", "チャンク分割"]
main_keyword: "RAG"
target_query: null
course_step: 3
cost_estimate: "記事のコードは Node.js の組み込み機能だけで動き、API を呼ばないので無料です。分けたチャンクを有料の埋め込み API でベクトルにすると、トークン数に応じた料金がかかります。"
run_environment: "Node.js 22.22.0（ICU 77.1）、依存パッケージなし、型の確認は TypeScript 7.0.2"
verified_at: "2026-10-31"
prev: "rag-bm25-search-typescript"
next: "rag-local-embeddings-transformers-js"
sources:
  - url: "https://www.anthropic.com/research/contextual-retrieval"
    title: "Contextual retrieval in AI systems"
    accessed: 2026-10-31
  - url: "https://docs.langchain.com/oss/javascript/integrations/splitters/recursive_text_splitter"
    title: "Splitting recursively (LangChain JavaScript docs)"
    accessed: 2026-10-31
  - url: "https://nodejs.org/docs/latest-v22.x/api/typescript.html"
    title: "Node.js v22 Modules: TypeScript"
    accessed: 2026-10-31
  - url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter/Segmenter"
    title: "Intl.Segmenter() constructor"
    accessed: 2026-10-31
  - url: "https://www.unicode.org/reports/tr29/"
    title: "UAX #29 Unicode Text Segmentation (Revision 49)"
    accessed: 2026-10-31
  - url: "https://huggingface.co/intfloat/multilingual-e5-small"
    title: "intfloat/multilingual-e5-small"
    accessed: 2026-10-31
  - url: "https://platform.claude.com/docs/en/build-with-claude/embeddings"
    title: "Embeddings"
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

日本語の文書を RAG 用に分けるときは、見出しでセクションに分け、文の境目で上限の文字数まで詰めます。詰めたチャンクの末尾の文は、次のチャンクの頭にも入れて重ねます。この3つを依存パッケージなしの TypeScript で書き、架空のネットショップのご利用ガイドを分けます。

できあがるチャンクは、次の形です。1行目が見出しの並びで、2行目からが本文です。頭の「お届けは発送の翌日から3日後が目安です。」は、1つ前のチャンクの最後の文を重ねたものです。

```text
--- #6 (74字)
ご利用ガイド > 配送について > お届けまでの日数
お届けは発送の翌日から3日後が目安です。北海道、沖縄県、離島は、さらに1日から2日かかります。
```

対象は、TypeScript で何か作ったことがあり、RAG を自分で組んでいる人です。書き写すコードは9ファイルで、`npm install` は要りません。

BM25 の検索は[前の記事](/posts/rag-bm25-search-typescript)で作りました。この記事で作るチャンクは、その検索に渡す文書の `text` にそのまま入れられます。

## 日本語の文書は見出し、文、文字数の順に分ける

RAG では、文書をふつう数百トークン以下のチャンクに分けてから、検索の索引を作ります（出典1）。チャンクの大きさ、境目、重なりの3つは、検索の結果を左右します（出典1）。この記事では、3つを次のように決めました。

1. 見出しでセクションに分け、見出しの並びをチャンクの1行目に入れる
2. セクションの本文を文に分け、上限の文字数を超えるまで文を足す
3. チャンクを閉じたら、末尾の文のうち重なりの文字数に収まる分を、次のチャンクの頭に入れる

見出しを1行目に入れるのは、チャンクだけを読んでも何の話かわかるようにするためです。Anthropic は、チャンクに文脈が足りないと正しい情報を取り出しにくいと書いています（出典1）。例に挙がっているのは、会社名も時期も書かれていない「売上が前の四半期から3%伸びた」という1文です（出典1）。

同じ記事の Contextual Retrieval は、チャンクの説明文を Claude に書かせます（出典1）。書かせた説明文は、チャンクの前に足します（出典1）。説明文はふつう50〜100トークンです（出典1）。見出しの並びを足す方法は、この説明文の代わりにはなりません。それでも API を呼ばずに、どの節のチャンクかを残せます。

上限は、文字数で数えます。数えるのは見た目の1文字で、`Intl.Segmenter` の `"grapheme"` を使います（出典4）。

## 文字数で機械的に切ると単語の途中で切れる

先頭から100字ずつ切るだけの分け方を、同じご利用ガイドで試しました。出力は、文字列の前後に `"` が付いた JSON の形です。

```text
"# ご利用ガイド\n\n## 返品について\n\n### 返品できる条件\n\n商品到着後8日以内に、マイページから返品を申し込めます。未開封で、届いたときの箱と付属品がそろっている商品に限ります。セール品、福袋"
"、名入れの商品は返品できません。お客様のご都合による返品では、送料をご負担いただきます。\n\n### 返金の時期\n\n返品した商品が倉庫に届いてから、3営業日以内に返金の手続きをします。クレジットカードで"
"支払った場合、カード会社の締め日によっては、返金が翌月以降の明細に載ります。コンビニ払いの場合は、銀行口座への振り込みで返金します。振込手数料は当店が負担します。\n\n## 配送について\n\n### お届"
```

3つ目のチャンクは「お届」で終わり、「お届けまでの日数」という見出しが2つに割れました。2つ目のチャンクには「返品できる条件」の後半と「返金の時期」の前半が混ざっています。「返金はいつ？」で検索すると、返品の条件の文まで一緒に返ってきます。

LangChain のドキュメントにも、同じ注意が書かれています（出典2）。日本語のように単語の間に空白が無い言語では、単語の途中で切れることがあります（出典2）。既定の区切りの一覧は `"\n\n"`、`"\n"`、`" "`、`""` の4つです（出典2）。対策として、句点の `。` と読点の `、` を区切りに足す例が載っています（出典2）。

## 使うバージョンと準備

動かした環境は Node.js 22.22.0 で、Node.js に入っている ICU は 77.1 です。依存パッケージは使わないので、`npm install` は要りません。

Node.js 22.18.0 以上は、`.ts` のファイルを型を外してそのまま実行します（出典3）。型は調べないので（出典3）、型は別に `tsc` 7.0.2 で確かめました。`import` にはファイルの拡張子まで書きます（出典3）。

作業フォルダを作って移動します。

```bash
mkdir jp-chunker
cd jp-chunker
```

`package.json` を置きます。`import` を使うので、`"type": "module"` を入れます。

```json
{
  "name": "jp-chunker",
  "private": true,
  "type": "module"
}
```

分ける対象の文書を、`doc.md` として保存します。架空のネットショップのご利用ガイドで、手で書いた文です。見出しは3段で、本文は全部で5つの節に分かれています。

```markdown
# ご利用ガイド

## 返品について

### 返品できる条件

商品到着後8日以内に、マイページから返品を申し込めます。未開封で、届いたときの箱と付属品がそろっている商品に限ります。セール品、福袋、名入れの商品は返品できません。お客様のご都合による返品では、送料をご負担いただきます。

### 返金の時期

返品した商品が倉庫に届いてから、3営業日以内に返金の手続きをします。クレジットカードで支払った場合、カード会社の締め日によっては、返金が翌月以降の明細に載ります。コンビニ払いの場合は、銀行口座への振り込みで返金します。振込手数料は当店が負担します。

## 配送について

### お届けまでの日数

平日の正午までのご注文は、その日のうちに発送します。正午を過ぎたご注文と、土日祝日のご注文は、翌営業日の発送です。お届けは発送の翌日から3日後が目安です。北海道、沖縄県、離島は、さらに1日から2日かかります。

### 配送料

1回のご注文の合計が5,000円以上なら、配送料は無料です。5,000円未満の場合は、全国一律で550円をいただきます。

## よくある質問

「注文を取り消せますか？」というお問い合わせをよくいただきます。発送の前であれば、マイページから取り消せます。「領収書は出ますか？」には「はい。」とお答えしています。マイページの注文履歴から、PDF の領収書をダウンロードできます。
```

上で試した100字ずつの分け方は、次の `naive.ts` です。比べるために置いておきます。

```ts
import { readFileSync } from "node:fs";

const text = readFileSync("doc.md", "utf8");
const size = 100;
for (let start = 0; start < 300; start += size) {
  console.log(JSON.stringify(text.slice(start, start + size)));
}
```

```bash
node naive.ts
```

出力は、前の節に載せた3行です。

## 文の境目は句点と括弧の深さで決める

文に分ける処理は、自分で書きました。`Intl.Segmenter` にも `"sentence"` という文の単位があります（出典4）。ただ、かぎ括弧のある文では、括弧の内側で切れました。

次のファイルを `sentences.ts` として保存します。文字数を数える関数と、文に分ける関数が入っています。

```ts
const graphemes = new Intl.Segmenter("ja", { granularity: "grapheme" });

export function toChars(text: string): string[] {
  return [...graphemes.segment(text)].map((s) => s.segment);
}

export function countChars(text: string): number {
  return toChars(text).length;
}

const OPEN = "「『（";
const CLOSE = "」』）";
const END = "。！？";

export function splitSentences(text: string): string[] {
  const sentences: string[] = [];
  let current = "";
  let depth = 0;
  for (const ch of text) {
    current += ch;
    if (OPEN.includes(ch)) depth++;
    else if (CLOSE.includes(ch) && depth > 0) depth--;
    else if ((END.includes(ch) && depth === 0) || ch === "\n") {
      if (current.trim() !== "") sentences.push(current);
      current = "";
      depth = 0;
    }
  }
  if (current.trim() !== "") sentences.push(current);
  return sentences;
}
```

`splitSentences` は、括弧の外にある `。`、`！`、`？` と、改行で文を閉じます。開き括弧で `depth` を1つ増やし、閉じ括弧で1つ減らします。括弧の内側の `。` は文の終わりとみなさないので、「はい。」の句点では切れません。

改行では、`depth` を0に戻します。閉じ括弧の書き忘れが1つあっても、次の行から元どおり分けられます。半角の `.` は、`5.0` のような数字と URL を切らないよう区切りに入れていません。

比べるための `show-sentences.ts` も置きます。同じ1行を、`Intl.Segmenter` と `splitSentences` の両方で分けます。

```ts
import { splitSentences } from "./sentences.ts";

const text = "発送の前であれば、マイページから取り消せます。「領収書は出ますか？」には「はい。」とお答えしています。";

const segmenter = new Intl.Segmenter("ja", { granularity: "sentence" });
console.log("Intl.Segmenter:");
for (const { segment } of segmenter.segment(text)) console.log(" ", JSON.stringify(segment));

console.log("splitSentences:");
for (const sentence of splitSentences(text)) console.log(" ", JSON.stringify(sentence));
```

```bash
node show-sentences.ts
```

```text
Intl.Segmenter:
  "発送の前であれば、マイページから取り消せます。「"
  "領収書は出ますか？」"
  "には「はい。」"
  "とお答えしています。"
splitSentences:
  "発送の前であれば、マイページから取り消せます。"
  "「領収書は出ますか？」には「はい。」とお答えしています。"
```

`Intl.Segmenter` は、2文を4つに分けました。1つ目は開き括弧の `「` で終わり、3つ目は「には」から始まります。

この切れ方は、Unicode の文の境目の規則どおりです。規則では、開き括弧も閉じ括弧も `Close` という分類に入ります（出典5）。`Close` は句点の直後に付いたまま残り、その後ろで文が切れます（出典5）。そのため `。「` と `？」` の後ろで切れました。

チャンクの境目が「領収書は出ますか？」の直後に来ると、問いと答えが別のチャンクに分かれます。FAQ のように問いと答えが1文に入る文書では、括弧の深さを数える `splitSentences` を使います。

## 見出しで分けたセクションに見出しの並びを残す

Markdown の見出しの行で、文書をセクションに分けます。次のファイルを `sections.ts` として保存します。

```ts
export type Section = { headings: string[]; body: string };

export function splitSections(markdown: string): Section[] {
  const sections: Section[] = [];
  const headings: string[] = [];
  let body: string[] = [];
  let inFence = false;
  const flush = () => {
    const text = body.join("\n").trim();
    if (text !== "") sections.push({ headings: [...headings], body: text });
    body = [];
  };
  for (const line of markdown.split("\n")) {
    if (line.startsWith("```")) inFence = !inFence;
    const match = inFence ? null : /^(#{1,6})\s+(.+)$/.exec(line);
    if (match) {
      flush();
      headings.splice(match[1].length - 1);
      headings.push(match[2].trim());
    } else {
      body.push(line);
    }
  }
  flush();
  return sections;
}
```

`headings` には、今いる場所までの見出しを上の段から順に入れます。`#` が2つの見出しが来たら、`splice` で2段目から後ろを消してから足します。そのため「返品について」の次に「配送について」が来ると、「返品できる条件」も一緒に消えます。

本文の無い見出しは、セクションを作りません。`ご利用ガイド` と `返品について` の直後には本文が無いので、セクションは5つになります。コードブロックの中の `#` で始まる行は、見出しとして扱いません。

## 上限まで文を詰め、末尾の文を次に重ねる

セクションを、上限の文字数に収まるチャンクに分けます。次のファイルを `chunk.ts` として保存します。

```ts
import { countChars, splitSentences, toChars } from "./sentences.ts";
import { splitSections, type Section } from "./sections.ts";

function splitLong(sentence: string, limit: number): string[] {
  const chars = toChars(sentence);
  const pieces: string[] = [];
  for (let i = 0; i < chars.length; i += limit) {
    pieces.push(chars.slice(i, i + limit).join(""));
  }
  return pieces;
}

function takeTail(sentences: string[], limit: number): string[] {
  const tail: string[] = [];
  for (let i = sentences.length - 1; i >= 0; i--) {
    if (countChars([sentences[i], ...tail].join("")) > limit) break;
    tail.unshift(sentences[i]);
  }
  return tail;
}

export function chunkSection(section: Section, maxChars: number, overlapChars: number): string[] {
  const header = section.headings.join(" > ") + "\n";
  const budget = maxChars - countChars(header);
  if (budget <= 0) throw new Error(`上限 ${maxChars} 字が見出しの行より短い: ${header.trim()}`);
  const pieces = splitSentences(section.body).flatMap((s) => splitLong(s, budget));
  const chunks: string[] = [];
  let current: string[] = [];
  for (const piece of pieces) {
    if (current.length > 0 && countChars(current.join("") + piece) > budget) {
      chunks.push(header + current.join("").trim());
      current = takeTail(current, overlapChars);
      while (current.length > 0 && countChars(current.join("") + piece) > budget) {
        current.shift();
      }
    }
    current.push(piece);
  }
  if (current.length > 0) chunks.push(header + current.join("").trim());
  return chunks;
}

export function chunkMarkdown(markdown: string, maxChars: number, overlapChars: number): string[] {
  return splitSections(markdown).flatMap((s) => chunkSection(s, maxChars, overlapChars));
}
```

上限の `maxChars` には、1行目の見出しの並びも含めます。本文に使える文字数は、上限から見出しの文字数を引いた `budget` です。埋め込みモデルに渡すのは見出しを含めた全体なので、見出しの分も上限に入れました。

`budget` が0以下になるのは、見出しの行だけで上限に届く場合です。そのまま進むと `splitLong` の `for` が終わらないので、先に例外を投げて止めます。

`chunkSection` は、文を1つずつ足し、`budget` を超える手前でチャンクを閉じます。閉じたら `takeTail` で、末尾から `overlapChars` 字に収まる文を取り出します。取り出した文は、次のチャンクの頭に入ります。重なりを文の単位で取るので、重なりの部分にも文の切れ端は入りません。

重なりの文と次の文を足すと `budget` を超えることがあります。その場合は、`while` の中で重なりの文を前から捨てます。これで、どのチャンクも上限を超えません。

実行のための `main.ts` を置きます。引数は、ファイル名、上限の文字数、重なりの文字数の3つです。

```ts
import { readFileSync } from "node:fs";
import { chunkMarkdown } from "./chunk.ts";
import { countChars } from "./sentences.ts";

const [file = "doc.md", max = "120", overlap = "40"] = process.argv.slice(2);
const chunks = chunkMarkdown(readFileSync(file, "utf8"), Number(max), Number(overlap));
chunks.forEach((chunk, i) => {
  console.log(`--- #${i + 1} (${countChars(chunk)}字)`);
  console.log(chunk);
});
```

上限120字、重なり40字で分けます。

```bash
node main.ts doc.md 120 40
```

```text
--- #1 (108字)
ご利用ガイド > 返品について > 返品できる条件
商品到着後8日以内に、マイページから返品を申し込めます。未開封で、届いたときの箱と付属品がそろっている商品に限ります。セール品、福袋、名入れの商品は返品できません。
--- #2 (77字)
ご利用ガイド > 返品について > 返品できる条件
セール品、福袋、名入れの商品は返品できません。お客様のご都合による返品では、送料をご負担いただきます。
--- #3 (105字)
ご利用ガイド > 返品について > 返金の時期
返品した商品が倉庫に届いてから、3営業日以内に返金の手続きをします。クレジットカードで支払った場合、カード会社の締め日によっては、返金が翌月以降の明細に載ります。
--- #4 (67字)
ご利用ガイド > 返品について > 返金の時期
コンビニ払いの場合は、銀行口座への振り込みで返金します。振込手数料は当店が負担します。
--- #5 (104字)
ご利用ガイド > 配送について > お届けまでの日数
平日の正午までのご注文は、その日のうちに発送します。正午を過ぎたご注文と、土日祝日のご注文は、翌営業日の発送です。お届けは発送の翌日から3日後が目安です。
--- #6 (74字)
ご利用ガイド > 配送について > お届けまでの日数
お届けは発送の翌日から3日後が目安です。北海道、沖縄県、離島は、さらに1日から2日かかります。
--- #7 (82字)
ご利用ガイド > 配送について > 配送料
1回のご注文の合計が5,000円以上なら、配送料は無料です。5,000円未満の場合は、全国一律で550円をいただきます。
--- #8 (99字)
ご利用ガイド > よくある質問
「注文を取り消せますか？」というお問い合わせをよくいただきます。発送の前であれば、マイページから取り消せます。「領収書は出ますか？」には「はい。」とお答えしています。
--- #9 (77字)
ご利用ガイド > よくある質問
「領収書は出ますか？」には「はい。」とお答えしています。マイページの注文履歴から、PDF の領収書をダウンロードできます。
```

9つのチャンクは、どれも句点で終わっています。100字ずつ切ったときと違い、2つの節が1つのチャンクに混ざることもありません。

チャンク #2、#6、#9 の頭の文は、1つ前のチャンクの最後の文と同じです。#4 の頭には重ねた文がありません。#3 の最後の文は47字あり、重なりの40字に収まらなかったからです。#3、#5、#7、#8 は節の最初のチャンクで、重なりは節をまたぎません。

チャンク #6 から見出しの行を消すと、何が1日から2日かかるのかわからなくなります。1行目の「お届けまでの日数」があるので、届くまでの日数の話だと読めます。

### 1文が上限より長いと文字の単位で切る

1文が `budget` より長いときは、`splitLong` が見た目の1文字の単位で切ります。上限を40字まで下げると、この切り方が出ます。

```bash
node main.ts doc.md 40 0 | head -n 6
```

```text
--- #1 (40字)
ご利用ガイド > 返品について > 返品できる条件
商品到着後8日以内に、マイペ
--- #2 (40字)
ご利用ガイド > 返品について > 返品できる条件
ージから返品を申し込めます。
```

「マイページ」が「マイペ」と「ージ」に割れました。見出しの並びと改行で26字を使うので、本文に使えるのは14字です。`splitLong` は、上限を守るための最後の手段です。この切り方が多く出るなら、上限を上げます。

## 上限と重なりは個数と合計の文字数で決める

上限と重なりを変えると、チャンクの個数と合計の文字数が変わります。5通りを比べる `stats.ts` を置きます。

```ts
import { readFileSync } from "node:fs";
import { chunkMarkdown } from "./chunk.ts";
import { countChars } from "./sentences.ts";

const markdown = readFileSync("doc.md", "utf8");
console.log("上限\t重なり\t個数\t最長\t合計");
for (const [max, overlap] of [[80, 0], [80, 30], [120, 0], [120, 40], [200, 0]]) {
  const lengths = chunkMarkdown(markdown, max, overlap).map(countChars);
  const total = lengths.reduce((a, b) => a + b, 0);
  console.log(`${max}\t${overlap}\t${lengths.length}\t${Math.max(...lengths)}\t${total}`);
}
```

```bash
node stats.ts
```

```text
上限	重なり	個数	最長	合計
80	0	13	80	821
80	30	14	80	931
120	0	9	108	722
120	40	9	108	793
200	0	5	148	629
```

上限120字で重なりを40字にすると、合計は722字から793字に増えました。増えた71字は、重ねた文の分です。上限80字に重なり30字を足した組では、合計が821字から931字になり、チャンクも1つ増えました。

上限200字では、チャンクが5つになりました。見出しの行を足しても、5つの節はどれも148字以下に収まるからです。上限を節の長さより大きくすると、チャンクは見出しの節と1対1になり、重なりも入りません。

自分の文書では、まず上限を埋め込みモデルの入力の上限より小さくします。たとえば multilingual-e5-small は、512トークンを超える部分を切り捨てます（出典6）。この記事の上限は文字数です。できたチャンクを使うモデルのトークナイザーで数え、512トークンに収まるかを確かめてから上限を決めます。

重なりは、上限の3分の1前後にしました。重ねた文字数は、そのまま埋め込みに渡す文字数に足されます。Voyage AI の埋め込み API は、トークン数で料金が決まります（出典8）。重なりの分も料金に入ります。

## 料金がかからない範囲

記事の手順は Node.js の組み込み機能だけを使い、API を呼ばないので無料です。依存パッケージが無いので、ネットワークも使いません。ネットワークの無い環境で実行し直しても、記事の `node` のコマンドは5つとも成功しました。

料金がかかるのは、分けたチャンクを埋め込み API でベクトルにする段階です。Anthropic は自社の埋め込みモデルを出していません（出典7）。同じページは、埋め込みの提供元の1つとして Voyage AI を挙げています（出典7）。

Voyage AI の voyage-4-lite は、100万トークンあたり $0.02 です（出典8）。voyage-4-lite は最初の2億トークンまで、どのアカウントも無料です（出典8）。この記事では埋め込み API を呼んでいないので、実際の金額は確かめていません。

## 分けたチャンクで確かめること

自分の文書をチャンクに分けるときは、次の4つをすべて確かめます。

- 見出しの行が、本文の文と同じチャンクに混ざっていないか
- 問いと答えが1文に入る箇所で、チャンクの境目が括弧の内側に来ていないか
- `splitLong` で切ったチャンクが、全体のうち何個あるか
- 重なりを入れたあとの合計の文字数が、埋め込みの料金の見積もりに入っているか

表とコードブロックは、この記事の `splitSentences` だと1行が1つの文になります。表の行が別々のチャンクに入ると、列の名前の行が無いチャンクは、何の値かわからなくなります。表の1行ごとに見出しの行を足しますか。それとも表はまるごと1つのチャンクにしますか。

講座の次の記事では、分けたチャンクを手元で動く埋め込みモデルでベクトルにして検索します。[次の記事](/posts/rag-local-embeddings-transformers-js)に進んでください。

## 出典

確認日は、どれも 2026-10-31 です。本文の（出典1）〜（出典8）は、この表の番号を指します。出典5は Unicode 18.0.0 の Revision 49 です。5.1 節の文の境目の規則を根拠にしました。

| # | 題名 | URL | 確認日 |
|---|---|---|---|
| 1 | Contextual retrieval in AI systems（Anthropic） | https://www.anthropic.com/research/contextual-retrieval | 2026-10-31 |
| 2 | Splitting recursively（LangChain JavaScript docs） | https://docs.langchain.com/oss/javascript/integrations/splitters/recursive_text_splitter | 2026-10-31 |
| 3 | Node.js v22 Modules: TypeScript | https://nodejs.org/docs/latest-v22.x/api/typescript.html | 2026-10-31 |
| 4 | Intl.Segmenter() constructor（MDN） | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter/Segmenter | 2026-10-31 |
| 5 | UAX #29 Unicode Text Segmentation（Revision 49） | https://www.unicode.org/reports/tr29/ | 2026-10-31 |
| 6 | intfloat/multilingual-e5-small（Hugging Face） | https://huggingface.co/intfloat/multilingual-e5-small | 2026-10-31 |
| 7 | Embeddings（Claude Docs） | https://platform.claude.com/docs/en/build-with-claude/embeddings | 2026-10-31 |
| 8 | Pricing（Voyage AI） | https://docs.voyageai.com/docs/pricing | 2026-10-31 |

AI 支援で執筆しました。コードは 2026-10-31 に実際に実行して確認しています。
