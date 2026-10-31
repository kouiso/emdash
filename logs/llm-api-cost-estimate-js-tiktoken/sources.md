# sources: llm-api-cost-estimate-js-tiktoken

アクセス日は、どれも 2026-10-31。番号は記事末尾の出典の表と同じ。frontmatter の `sources` と同じ URL・題名・日付。

## 一次情報

| # | 題名 | URL | 取得のしかた | 確かめた事実 | 記事で使った文 |
|---|---|---|---|---|---|
| 1 | Pricing（OpenAI API） | https://developers.openai.com/api/docs/pricing | `curl`（platform.openai.com/docs/pricing からここへリダイレクト）。表は HTML の props に埋め込まれたデータを読んだ | 料金は「Prices per 1M tokens」。Flagship models の Standard の表に gpt-5.6-terra の行があり、入力 2、キャッシュされた入力 0.2、キャッシュ書き込み 2.5、出力 12（USD）。モデルのエンコーディングの記載は無い | 「料金表は、100万トークンあたりの金額」、単価の表、「料金のページには、エンコーディングの記載がありません」、料金がかからない範囲の金額、frontmatter の `cost_estimate` |
| 2 | GPT-5.6 Terra Model（OpenAI API） | https://developers.openai.com/api/docs/models/gpt-5.6-terra | `curl` | Text tokens per 1M: Input $2.00、Cached input $0.20、Output $12.00。「Prompts with >272K input tokens are priced at 2x input and 1.5x output for the full request.」。Reasoning token support。128,000 max output tokens。エンコーディングの記載は無い | 単価の表、272,000トークン超の割り増し（2文）、「推論トークンに対応したモデル」、「モデルのページ…エンコーディングの記載がありません」 |
| 3 | Reasoning models（OpenAI API） | https://developers.openai.com/api/docs/guides/reasoning | `curl` | 推論モデルは入力・出力に加えて reasoning tokens を使う。「While reasoning tokens are not visible via the API, they still … are billed as output tokens.」。`max_output_tokens` は推論トークン・見える出力・見えない書式のトークンを合わせた生成の上限。「OpenAI recommends reserving at least 25,000 tokens for reasoning and outputs when you start experimenting」。上限に達すると `status` が `incomplete`、見える出力の前でも入力と推論トークンの料金がかかる。推論トークン数は usage の `output_tokens_details` | 推論トークンの3文、`max_output_tokens` の説明、25,000の根拠（2文）、上限を小さくしすぎたときの2文、usage の文 |
| 4 | Counting tokens（OpenAI API） | https://developers.openai.com/api/docs/guides/token-counting | `curl` | 送る前に入力トークン数を返す endpoint がある。「The count includes formatting tokens used to represent request structure, such as message roles and boundaries. These tokens might not appear in the text or fields you tokenize locally.」。tiktoken は plain text には使えるが、画像とファイルは非対応、ツールとスキーマのトークンは手元で数えにくい。JavaScript は `client.responses.inputTokens.count`。この API の料金の記載は見つからなかった | 「手元で数えた数と請求の数はずれる」の節の5文と、メソッドの文 |
| 5 | Deprecations（OpenAI API） | https://developers.openai.com/api/docs/deprecations | `curl` | 2026-06-11 の告知。gpt-5-mini（gpt-5-mini-2025-08-07）の Shutdown date は Dec 11, 2026、Recommended replacement は gpt-5.6-terra | 「gpt-5-mini は、2026-12-11 に API から外れる予定」「移行先は gpt-5.6-terra」 |
| 6 | js-tiktoken（npm） | https://www.npmjs.com/package/js-tiktoken | `npm view js-tiktoken version time --json`（npmjs.com のページは curl で 403 のため、同じ registry のデータを CLI で読んだ） | version 1.0.21、`time["1.0.21"]` は 2025-08-09T01:00:31Z | 「latest は 1.0.21」「公開日は 2025-08-09」 |
| 7 | dqbd/tiktoken js/README.md | https://github.com/dqbd/tiktoken/blob/main/js/README.md | raw.githubusercontent.com から取得（github.com のページは curl で 403）。インストールした 1.0.21 の README.md と同じ内容 | 「tiktoken is a BPE tokeniser for use with OpenAI's models. This is a pure JS port of the original tiktoken library.」。Full usage は `getEncoding` と `encodingForModel` を import し、全エンコーディングを含む（バンドルが大きくなる注意つき） | 「tiktoken は、OpenAI のモデル用のトークナイザー」「JavaScript だけで書き直したもの」「エンコーディングは、パッケージの中に入っています」「モデル名からエンコーディングを選ぶ関数もあります」 |
| 8 | js-tiktoken 1.0.21 dist/chunk-VL2OQCWN.js | https://unpkg.com/js-tiktoken@1.0.21/dist/chunk-VL2OQCWN.js | `curl`（unpkg で HTTP 200、`"gpt-5-mini"` を含む）。インストールした同じファイルの `getEncodingNameForModel` を読んだ | `gpt-5`、`gpt-5-2025-08-07`、`gpt-5-nano`、`gpt-5-mini`、`gpt-5-chat-latest` などを `o200k_base` に割り当てる。gpt-5.1 以降と gpt-6 系の名前は無い。`default: throw new Error("Unknown model")` | 「gpt-5 系のモデル名にこれを割り当てています」「知っているモデル名は、gpt-5 系まで」「gpt-5、gpt-5-mini、gpt-5-nano など」「`Unknown model` の例外を投げます」 |
| 9 | openai/tiktoken tiktoken/model.py | https://github.com/openai/tiktoken/blob/main/tiktoken/model.py | raw.githubusercontent.com から main ブランチを取得（github.com のページは curl で 403）。PyPI の tiktoken の最新は 0.14.0 | `MODEL_PREFIX_TO_ENCODING` に `"gpt-5": "o200k_base"`。`MODEL_TO_ENCODING` も含め、モデルごとにエンコーディングを割り当てる表。gpt-6 で始まるキーは無い | 「モデルごとに使う表が決まっています」「名前の先頭で選ぶ表があります」「`gpt-5` で始まる名前を `o200k_base` にしています」「gpt-6 で始まる名前がありません」 |
| 10 | Node.js v22 Modules: TypeScript | https://nodejs.org/docs/latest-v22.x/api/typescript.html | `curl` | History: v22.18.0「Type stripping is enabled by default」「no longer emits an experimental warning」。型の注釈を空白に置き換え、「no type checking is performed」 | 「Node.js は 22.18.0 から、TypeScript のファイルをそのまま実行できます」「型の注釈を取り除いて動かす方式で、型のチェックはしません」 |
| 11 | anthropics/anthropic-tokenizer-typescript README | https://github.com/anthropics/anthropic-tokenizer-typescript | raw.githubusercontent.com から README.md を取得 | 「As of the Claude 3 models, this algorithm is no longer accurate, but can be used as a very rough approximation.」 | 「`@anthropic-ai/tokenizer` というパッケージがあります」「Claude 3 以降のモデルでは数が正確に出ません」「大まかな近似にしか使えない」 |
| 12 | Token counting（Claude API Docs） | https://platform.claude.com/docs/en/build-with-claude/token-counting | WebFetch（docs.claude.com からここへリダイレクト） | `/v1/messages/count_tokens`、`x-api-key` ヘッダーで呼ぶ。「Token counting is free to use but subject to requests per minute rate limits based on your usage tier」。「The token count is an estimate.… might differ by a small amount」 | Claude の節の2段落目の4文 |

## 実行ログを根拠にした文

| 記事の文 | 根拠 |
|---|---|
| 冒頭の出力1行、手順3の出力3行 | `run/04.log` |
| `npm install` の出力、「入ったパッケージは2つ」、所要の 692ms | `run/02.log`（「入ったのは js-tiktoken と base64-js」は `package-lock.json` と js-tiktoken の `dependencies` の `base64-js`） |
| 手順2の出力、4.5文字・2文字の比率 | `run/03.log`（45÷10、24÷12） |
| `unknown-model.ts` の出力 | `run/05.log` |
| 「手元で8.5秒」 | `run/06.log`（real 0m8.485s） |
| `"type": "module"` を消すと `MODULE_TYPELESS_PACKAGE_JSON` の警告、結果は同じ | `run/08.log` |
| 「ネットワークを切った状態でも…同じ結果」「トークンを数える処理はネットワークを使いません」 | `run/09.log`（`unshare -rn`、`fetch` は EAI_AGAIN） |
| Node.js 22.22.0、npm 10.9.4 | 各ログの `node:`、`npm:` の行 |
| 1行目の内訳 0.000186 / 0.012、98%以上、2%未満、0.570 ドル、およそ2倍 | `run/04.log` の数と単価からの計算（93×2÷1,000,000、1,000×12÷1,000,000、0.012÷0.012186=98.5%、0.000186÷0.012186=1.5%、279,000×2÷1,000,000＋1,000×12÷1,000,000=0.570、1.134÷0.570=1.99） |
| 「コードは4ファイルで、合わせて73行」 | `wc -l` で package.json 9、count.ts 13、estimate.ts 41、unknown-model.ts 10 |

## 見たが一次情報に数えなかったもの

- WebSearch の結果に出た解説記事（OpenReplay、Zenn、Medium、個人ブログ）。上位記事の傾向を見るためだけに使い（`brief.md`）、記事の断定の根拠にはしていない。
