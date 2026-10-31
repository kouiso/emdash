# sources: llm-json-parse-error-fix

アクセス日はすべて 2026-10-31。取得は WebFetch で行った。本文の（出典n）は原稿末尾の出典の表の番号で、frontmatter の `sources` と同じ順・同じ URL・同じアクセス日にしてある。

## 一次情報

| # | 題名 | URL | 確かめた事実（ページの記述） | 根拠にした本文の文（行番号は原稿 333 行の版） |
|---|---|---|---|---|
| 1 | JSON.parse() - JavaScript \| MDN | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse | Exceptions 節「SyntaxError: Thrown if the string to parse is not valid JSON.」。同ページの例のエラーの文は `Unexpected token ] in JSON at position 13` の形で、Node.js 22.22.0 で出た文（`run/02.log`）と形が違う | 48行目「文字列が正しい JSON でないとき、`JSON.parse` は `SyntaxError` を投げます」 |
| 2 | Node.js v22 Modules: TypeScript | https://nodejs.org/docs/latest-v22.x/api/typescript.html | 履歴の表で v22.18.0 に「Type stripping is enabled by default.」。本文「no type checking is performed」。`.ts` は `.js` と同じモジュールの規則に従い、近くの `package.json` に `"type": "module"` を足すと `import`/`export` が使える | 61行目（22.18.0 以上は型を取り除いて実行、型の検査はしない）、80行目（`"type": "module"` は `import` を使うための指定） |
| 3 | Stop reasons and fallback | https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons | 「The `stop_reason` field is part of every successful Messages API response.」。表で `max_tokens` は「The response reached your `max_tokens` limit.」、対処は「Raise `max_tokens` or continue the response」。応答の JSON の例に `content` の `{"type": "text", "text": ...}` と `stop_reason` がある | 40行目（切れた出力は `max_tokens` を上げて取り直す）、204行目（成功した応答には必ず `stop_reason`、`max_tokens` は上限で止まった、公式の案内は上げるか続きを生成）、206行目（見本の応答は公式の例の形を真似た） |
| 4 | Structured outputs | https://platform.claude.com/docs/en/build-with-claude/structured-outputs | 「Structured outputs guarantee schema-compliant responses through constrained decoding」「Always valid: No more `JSON.parse()` errors」。Token limit の項「`stop_reason: "max_tokens"` … The output might be incomplete and not match your schema.」「Retry with a higher `max_tokens` value」 | 285行目（JSON の外に文字を付けさせない Structured Outputs がある、`JSON.parse()` のエラーが無くなると説明）、287行目（`max_tokens` のときは保証の外、出力は不完全でスキーマに合わないことがある） |
| 5 | Pricing | https://platform.claude.com/docs/en/about-claude/pricing | モデル料金の表に「Claude Haiku 5.5 (for prompts up to 100,000 tokens)」Base input $0.10 / MTok、Output $0.50 / MTok。料金は入力と出力のトークンごと | 303行目（取り直すと新しいリクエストの入力と出力のトークンに料金、Haiku 5.5 の単価、10万トークン以下の条件） |
| 6 | RFC 8259 The JavaScript Object Notation (JSON) Data Interchange Format | https://www.rfc-editor.org/rfc/rfc8259 | §2「A JSON text is a serialized value.」、文法「JSON-text = ws value ws」。ws は空白、タブ、改行、復帰 | 139行目「JSON のテキストは、前後の空白を除けば1つの値だけです」 |

## 実行ログを根拠にした文（出典の番号を付けていない文）

| 本文の文 | 根拠 |
|---|---|
| 50〜55行目の表のエラーの文、130〜135行目の実行結果 | `run/02.log`（Node.js v22.22.0） |
| 137行目「Node.js はその後ろに、入力の先頭10文字と `is not valid JSON` を続けます」 | `run/06.log`（`"```json\n{""...`、`"分類結果は次のとおり"...` はどちらも10文字） |
| 139行目「`trailing` の position 39 は、「以上です」の「以」の位置です」 | `run/06.log`「trailing の「以」の位置: 39」 |
| 189〜194行目の実行結果、196行目 | `run/03.log` |
| 198行目「説明の文の中に `{` が入っていると、切り出す範囲がずれます」 | `run/09.log`（`code/extra/edge-brace.ts`。切り出した範囲が説明の文の `{` から始まり、`Unexpected token '文'`） |
| 254〜257行目の実行結果、258行目 | `run/04.log` |
| 264行目、277〜279行目、281行目（閉じ括弧を足すと成功し、`summary` が途中で止まる） | `run/05.log` |
| 297行目（`position` は 0 から数えた位置、position 43 は文字列の長さと同じ） | `run/06.log`「trailing の「以」の位置: 39」（`indexOf` は 0 始まり）と「truncated の長さ: 43」 |
| 61行目「型は別に TypeScript 7.0.2 の `tsc` で確かめました」 | `run/07.log`（tsc 7.0.2、exit=0） |
| 301行目「API を呼ばないので無料」「npm からパッケージを入れる手順もありません」 | 記事のコードに import は自作のファイルだけ（`code/`）。`run/08.log`（ネットワークの無い環境で4つの `node` コマンドが exit=0、外への fetch は `EAI_AGAIN`） |

## 参考にしたが出典にしていないもの

- WebSearch（2026-10-31、「LLM JSON.parse エラー コードフェンス 途中で切れる」）の結果7件。英語のライブラリの説明、用語集、GitHub の issue で、一次情報に数えない。検索意図の参考としてだけ `brief.md` に書いた。
