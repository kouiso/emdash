# sources: rag-chunking-japanese-text

アクセス日はすべて 2026-10-31。8件とも `curl -sSL` で HTTP 200 を確かめ、HTML をテキストに直して該当の文を読んだ。番号は本文の（出典n）と出典の表の番号に合わせてある。frontmatter の `sources` も同じ URL、題名、アクセス日。

| # | URL | 題名 | そのページで確かめた事実 | 記事のどの文の根拠か |
|---|---|---|---|---|
| 1 | https://www.anthropic.com/research/contextual-retrieval | Contextual retrieval in AI systems（Anthropic） | RAG は知識ベースを "smaller chunks of text, usually no more than a few hundred tokens" に分けてから埋め込みと BM25 の索引を作る。"The choice of chunk size, chunk boundary, and chunk overlap can affect retrieval performance"。チャンクが "lack sufficient context" だと正しい情報を取り出しにくい。例は "The company's revenue grew by 3% over the previous quarter." で、会社も時期も書かれていない。Contextual Retrieval はチャンクごとの説明文を Claude に書かせ、"usually 50-100 tokens" の説明文をチャンクの前に足す | 62行目（数百トークン以下のチャンクに分けて索引を作る、大きさ・境目・重なりが結果を左右する）、68行目（文脈が足りないと取り出しにくい、3% の例）、70行目（Contextual Retrieval の説明文、50〜100トークン） |
| 2 | https://docs.langchain.com/oss/javascript/integrations/splitters/recursive_text_splitter | Splitting recursively（LangChain JavaScript docs） | 既定の区切りの一覧は `["\n\n", "\n", " ", ""]`。"Some writing systems do not have word boundaries, for example Chinese, Japanese, and Thai" で、既定の一覧では "can cause words to be split between chunks"。対策として `。`（ideographic full stop）と `、`（ideographic comma）などを区切りに足す例がある | 86行目 |
| 3 | https://nodejs.org/docs/latest-v22.x/api/typescript.html | Node.js v22 Modules: TypeScript（ページの表示は v22.23.4 Documentation） | 変更履歴に "v22.18.0 Type stripping is enabled by default."。"no type checking is performed"。"file extensions are mandatory in import statements"。型の import には `type` キーワードが要る（記事の `chunk.ts` は `type Section` と書いている） | 92行目 |
| 4 | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter/Segmenter | Intl.Segmenter() constructor（MDN） | `granularity` の `"grapheme"` は "grapheme cluster (user-perceived character) boundaries"、`"sentence"` は "sentence boundaries" で分ける | 72行目（見た目の1文字を `"grapheme"` で数える）、161行目（`"sentence"` という文の単位がある） |
| 5 | https://www.unicode.org/reports/tr29/ | UAX #29 Unicode Text Segmentation（Unicode 18.0.0、Revision 49） | 5.1 Default Sentence Boundary Specification の表で、`Close` は "General_Category = Open_Punctuation, or General_Category = Close_Punctuation, or Line_Break = Quotation"。規則 SB9 `SATerm Close* × (Close | Sp | ParaSep)` と SB11 `SATerm Close* Sp* ParaSep? ÷` で、句点の後ろの `Close` は句点に付いたまま残り、その後ろで切れる | 235行目、474行目（版と節） |
| 6 | https://huggingface.co/intfloat/multilingual-e5-small | intfloat/multilingual-e5-small（Hugging Face） | "Long texts will be truncated to at most 512 tokens." | 447行目 |
| 7 | https://platform.claude.com/docs/en/build-with-claude/embeddings | Embeddings（Claude Docs） | "Anthropic does not offer its own embedding model. One embeddings provider with a wide variety of models and capabilities is Voyage AI by MongoDB." | 455行目 |
| 8 | https://docs.voyageai.com/docs/pricing | Pricing（Voyage AI） | テキスト埋め込みは "based on the number of tokens in the documents/queries" で課金。voyage-4-lite は $0.02 / 100万トークン。"The first 200 million tokens for voyage-4-large, voyage-4, voyage-4-lite, … are free for every account" | 449行目（トークン数で料金が決まる）、457行目（$0.02、最初の2億トークン無料） |

## 出典ではなく実行ログと計算を根拠にした文

| 記事の行 | 文の要点 | 根拠 |
|---|---|---|
| 84 | 100字ずつ切ると「お届」で終わり、2つの節が混ざる | `run/04.log` |
| 90 | Node.js 22.22.0、ICU 77.1 | 全ログの見出し `node: v22.22.0`、`icu: 77.1` |
| 92 | 型は `tsc` 7.0.2 で確かめた | `run/13.log`（`Version 7.0.2`、`tsc_exit=0`） |
| 161、233 | `Intl.Segmenter` の `"sentence"` は括弧の内側で切れ、2文を4つに分けた | `run/06.log` |
| 201 | 改行で `depth` を0に戻す、半角 `.` を区切りに入れていない | 記事の `sentences.ts`（`code/sentences.ts`） |
| 274 | セクションは5つ、コードブロックの中の `#` は見出しにしない | `run/12.log`（`sections: 5`、`fence:` の行） |
| 330 | `budget` が0以下なら例外で止める | `run/12.log`（`guard:` の行） |
| 387〜391 | 9チャンクとも句点で終わる、#2・#6・#9 は重なり、#3 の最後の文は47字、#3・#5・#7・#8 は節の最初 | `run/08.log`、`run/12.log`（`120/40 last chars`、`#n first=… overlap=…` の行） |
| 410 | 見出しの並びと改行で26字、本文は14字 | `run/09.log`、`run/12.log`（`header chars (with newline): 26 budget at 40: 14`） |
| 443 | 722字から793字、増えた71字は重ねた文の分、821字から931字 | `run/11.log`、`run/12.log`（`diff = 71`、重なりの文 23字＋20字＋28字） |
| 445 | 5つの節はどれも148字以下 | `run/12.log`（`total=` の最大 148） |
| 453 | ネットワークの無い環境で `node` のコマンド5つが成功 | `run/14.log` |
| 468 | 表とコードブロックは1行が1つの文になる | `run/12.log`（`table sentences:` の行）。コードブロックは `splitSentences` が改行で文を閉じる処理（記事 188行目、`code/sentences.ts` の `ch === "\n"` の条件）による |
