# sources: rag-bm25-search-typescript

アクセス日はすべて 2026-10-31。frontmatter の `sources` と本文の出典の表（番号も同じ）に同じ URL を入れた。

| # | 題名 | URL | 確かめた事実 | 記事のどの文の根拠か |
|---|---|---|---|---|
| 1 | Introducing Contextual Retrieval（Anthropic、2024-09-19 公開） | https://www.anthropic.com/news/contextual-retrieval | RAG は "a method that retrieves relevant information from a knowledge base and appends it to the user's prompt"。BM25 は "a ranking function that uses lexical matching to find precise word or phrase matches"。"Error code TS-999" の例で、BM25 はその文字列そのものを探す。"By leveraging both BM25 and embedding models, traditional RAG systems can provide more comprehensive and accurate results"、厳密な語の一致と広い意味の理解のバランスを取る | 「RAG の検索部分は…」節の RAG と BM25 の定義。「語が一致しない質問では…」節のエラーコードの例、BM25 と埋め込みの組み合わせ、言い換えは埋め込みの検索で拾う。「検索結果を LLM に渡す…」節の冒頭（取り出した文書をプロンプトに足す） |
| 2 | The Probabilistic Relevance Framework: BM25 and Beyond（Robertson、Zaragoza、Foundations and Trends in Information Retrieval 3(4)、2009年） | https://www.staff.city.ac.uk/~sbrp622/papers/foundations_bm25_review.pdf | 3.4.2節: どの語の寄与も飽和点（漸近値）を超えない（saturation）。3.4.5節: 式(3.12) `B = (1-b) + b·dl/avdl`、`0 ≤ b ≤ 1`、b=1 で長さの正規化を完全に行い、b=0 で切る。式(3.15) BM25 の語の重み `tf / (k1((1-b)+b·dl/avdl) + tf) · w_RSJ`、文書のスコアは質問の語の重みの合計。3.5節: 関連情報が無いとき RSJ の重みは idf の形になる。多くの実験で 0.5<b<0.8、1.2<k1<2 がよい | 「RAG の検索部分は…」節の、スコアは語ごとの重みの合計、重みの式、`tf` が増えても重みは `idf` を超えない、`b` の範囲と 0/1 の意味、論文の推奨範囲 |
| 3 | BM25Similarity（Lucene 10.3.1 core API） | https://lucene.apache.org/core/10_3_1/core/org/apache/lucene/search/similarities/BM25Similarity.html | 既定値 k1 = 1.2、b = 0.75。idf は `log(1 + (docCount - docFreq + 0.5)/(docFreq + 0.5))`。k1 は "Controls non-linear term frequency normalization (saturation)"、b は "Controls to what degree document length normalizes tf values" | 重みの式の `idf`、`k1` と `b` の既定値、`idf` の式を Lucene と同じ形にしたこと |
| 4 | Similarity settings（Elasticsearch） | https://www.elastic.co/docs/reference/elasticsearch/index-settings/similarity | BM25 の k1 の既定値 1.2、b の既定値 0.75 | `k1` と `b` の既定値（Elasticsearch） |
| 5 | Node.js v22 Modules: TypeScript（ページの表示は v22.23.4 のドキュメント） | https://nodejs.org/docs/latest-v22.x/api/typescript.html | v22.18.0 で型ストリップが既定で有効。型注釈を空白に置き換え、型チェックはしない。`import` にファイルの拡張子が必須。型だけの import には `type` が要る。`.ts` のモジュールの種類は `.js` と同じ決まりで、`import` と `export` を使うには近くの `package.json` に `"type": "module"` を足す | 「使うバージョンと準備」節の、22.18.0 以上で `.ts` をそのまま実行、型は調べない、拡張子と `import type`、`"type": "module"` |
| 6 | Intl.Segmenter() constructor（MDN） | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter/Segmenter | `granularity` の `"word"` は "Split the input into segments at word boundaries, as determined by the locale" | 「日本語の文を…」節の `granularity: "word"` で単語の境目に分ける、境目はロケールの規則で決まる |
| 7 | ECMAScript Internationalization API Specification 19.7.1 CreateSegmentDataObject | https://tc39.es/ecma402/#sec-createsegmentdataobject | granularity が "word" のとき、区切りが "word-like" かどうかを表す Boolean を `isWordLike` に入れる。Note: "word-like" かどうかは implementation-dependent。空白や句読点だけの区切りは一般に word-like でない | `isWordLike` は単語らしい区切りかどうかを表す、判定は実装に任されている |
| 8 | String.prototype.normalize()（MDN） | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize | NFKC は "Compatibility Decomposition, followed by Canonical Composition"。互換正規化は検索の用途に向き、表示には向かないことがある | `normalize("NFKC")` は互換文字をそろえる正規化、MDN は検索の用途に向くと書いている |
| 9 | Pricing（Claude Platform Docs） | https://platform.claude.com/docs/en/about-claude/pricing | Claude Haiku 5.5（プロンプトが 100,000 トークン以下）: Base input $0.10 / MTok、Output $0.50 / MTok。100,000 トークン超は入力 $0.50、出力 $2.50 | 「料金がかからない範囲」節の Claude Haiku 5.5 の単価と、10万トークン以下という条件 |

## 実行ログや計算を根拠にした文（出典の番号は付けていない）

| 文 | 根拠 |
|---|---|
| 動かした環境は Node.js 22.22.0、ICU 77.1 | `run/*.log` の見出し `node: v22.22.0`、`icu: 77.1` |
| 型の確認は `tsc` 7.0.2 | `run/16.log`（`Version 7.0.2`、`tsc_exit=0`） |
| 全角の `ＰａｙＰａｙ` が `paypay` になり、`。` が外れ、「使えます」が3つに分かれる | `run/04.log` |
| 「使える」は1語のまま | `run/05.log` |
| 各 `node search.ts` のスコアと順位 | `run/07.log`〜`11.log` |
| `returns` に一致したのは「返品」「できる」「は」、`shipping-fee` と「返金はいつ？」の上位3件は「は」だけ、`payment` は「支払い」と「方法」、「は」は8件すべてに出る、8件の語の数（22、19、11、18、20、22、24、83、合計219）、「返品」は2件に出る | `run/15.log`（`extra/explain.ts`） |
| 「は」の `idf` 約 0.057、「返品」の `idf` 約 1.281、`avgdl` 27.375、手計算の 0.847 と 0.915 | 上の値を Python で計算（0.05716、1.28093、27.375、0.84738、0.91495）。`run/10.log` と `11.log` の出力と一致 |
| 内容の語が一致した文書は 0.318 以上、助詞だけの文書は 0.040 以下 | `run/07.log`、`08.log`、`10.log`（内容の語: 1.771、0.677、1.849、0.318、0.847、0.637）、`run/07.log` と `09.log`（助詞だけ: 0.040、0.040、0.040、0.039）と `run/15.log` |
| プロンプトの文字列と、「返金はいつ？」で資料が1件も入らない | `run/13.log`、`14.log` |
| ネットワークの無い環境で `node` のコマンドが9つとも成功 | `run/17.log`（9つとも exit=0、外への fetch は `EAI_AGAIN`） |
| `idf` は0より大きい | 式の `log` の中が `1 + 正の数` なので1より大きい（`n ≤ N` のとき `N - n + 0.5 > 0`） |
