# gate: zod-validate-llm-json-output

判定日: 2026-10-31。原稿: `content/articles/zod-validate-llm-json-output.md`（437行。行番号はすべてこの版）。

## 判定の前に読んだもの

2026-10-31 に、次を Read ツールで全文読んでから全項目を判定した。

- `docs/tech-writing-pack/checklist.md`（61行）
- `guides/01-seo-for-dev-blogs.md`（192行）、`02-article-structures.md`（173行）、`03-anti-ai.md`（443行）、`04-collocation.md`（265行）、`05-technical-writing.md`（183行）
- `guides/06-rewriting-prompts.md`（186行）、`08-ai-buntai-ruleset.md`（266行）、`09-ai-writing-manual.md`（97行）
- `keywords/README.md`（35行）

`07-ai-buntai-laws.md` と `10-ai-buntai-handoff.md` は、スキルの表で判定の前に読むガイドに入っていないので読んでいない。

## A. このリポジトリで足しているゲート

| # | 条件 | 確かめ方と記録先 | 判定 | 根拠 |
|---|---|---|---|---|
| G01 | `ai-smell-lint.py` の FATAL が0件。frontmatter の行で出た `📎mention` は use として扱う。warn は1件ずつ判断した | `lint/ai-smell.txt`、`lint/judgments.md` | OK | guides/03「引用（mention）と使用（use）の区別」と「lint との関係」を読んで判定。`lint/ai-smell.txt` 3行目 `✅ クリーン`、4行目 use 0件 / 📎mention 0件、5行目 `✅ 致命なし`、10行目 `exit=0`。frontmatter（1〜47行目）の mention も0件。warn 0件（`lint/judgments.md`） |
| G02 | `writing-lint.py` の判定行で FATAL と DENSITY超過がどちらも 0。SHOULD、WATCH、INFO は1件ずつ判断した。個人名は G09 で確かめる | `lint/writing-lint.txt`、`lint/judgments.md` | OK | guides/09 §2 と guides/08 の密度基準総表を読んで判定。`lint/writing-lint.txt` 1行目 `437行/136文`、21行目 `### 判定: FATAL 0 / DENSITY超過 0 / SHOULD 0`、23行目 `exit=0`。DENSITY は10カウンタすべて0回で、上限は guides/08 の標準レジスターと一致。WATCH 節なし、INFO 0件 |
| G03 | 下の B の全項目を満たす | `gate.md` | OK | B は C01〜C38 がすべて OK、C39（任意）は「あり」 |
| G04 | 記事のコードを記事の形のまま実際に動かし、ログがある。API を呼ぶ記事で `ANTHROPIC_API_KEY` が無いときは不合格 | `code/`、`run/` | OK | `lint/check-code-and-outputs.txt`（ALL OK）: 記事のコード7つ（`package.json`、`schema.ts`、`samples.ts`、`check.ts`、`retry-message.ts`、`pretty-ja.ts`、`strip.ts`）が `code/` と1文字も違わず、記事のコマンド10個が記事にあり、記事の実行結果9つが `run/` から機械的に取り出したものと一致。実行は `run/01.log`〜`12.log`（2026-10-31 09:12 UTC、node v22.22.0 / npm 10.9.4、記事の手順の順）。型は `run/13.log`（tsc 7.0.2、`tsc_exit=0`）。外へ出ないことは `run/14.log`（`unshare -rn` の中で8つの `node` コマンドが exit=0、外への fetch は `EAI_AGAIN`）。API は呼ばない（`needs_api_key: false`、43行目） |
| G05 | 断定した事実すべてに一次情報の出典があり、本文に出ている。料金の目安がある。`cost_estimate`、`run_environment`、`verified_at` が埋まり、ログと一致する | 原稿の出典の表、`sources.md`、frontmatter | OK | 本文 421〜435行目に出典の表（9件、題名、URL、確認日 2026-10-31）。断定した文は（出典n）で表を引く（19か所。`sources.md` に文ごとの対応、実行ログを根拠にした文は後半の表）。料金は 402〜406行目で、記事の手順は無料（zod は MIT、出典6）、再依頼の文をモデルに送ると料金がかかり、Claude Haiku 5.5 は 100万トークンあたり入力 $0.10、出力 $0.50（10万トークン以下のプロンプト、出典9）。送る処理は実行していないので「無料」とは書いていない。frontmatter 9〜11行目の `cost_estimate`、`run_environment: "Node.js 22.22.0、npm 10.9.4、zod 4.6.7"`（`run/*.log` の見出し `node: v22.22.0 / npm: 10.9.4` と `code/package.json` の `4.6.7` に一致）、`verified_at: "2026-10-31"`（最後の実行 `run/14.log` の日付） |
| G06 | 既存記事と検索意図が重ならない | `selection.md` | OK | `content/articles/` の frontmatter を全件読んだ（この記事のほか `mcp-server-typescript-stdio`、`llm-api-cost-estimate-js-tiktoken`、`llm-api-429-retry-sdk-mock`）。main_keyword「構造化出力」の記事は無く、LLM の出力 JSON を zod で検証する方法に答える記事は無い |
| G07 | 講座の前後リンクと、既存記事が3本以上なら関連記事への内部リンク。リンク先は公開済みか先に予約済み | `gate.md` | NG | リンクは本文にある。前: 53行目 `/posts/claude-structured-outputs-json`（frontmatter 12行目 `prev`）。次: 419行目 `/posts/zod-to-json-schema-tool-definition`（13行目 `next`）。どちらも `content/plan.md` の course_step 2 の並び（#6、#8）による計画上の slug で、パスは `src/pages/posts/[slug].astro` に合わせた。前の記事は `content/articles/` に原稿が無い。次の記事は、判定の途中で別の作業が書いた原稿（`content/articles/zod-to-json-schema-tool-definition.md`、`status: draft`）が現れたが、公開も予約もされていない。今この記事を公開すると2本ともリンク切れになる。公開済みか予約済みの記事は0本（既存3本はどれも `status: draft`）なので、関連記事への内部リンク（3本以上のとき）は対象外。リンク先の slug: `claude-structured-outputs-json`、`zod-to-json-schema-tool-definition` |
| G08 | 本文の最後の段落が「AI 支援で執筆」の決まった表記 | 原稿の末尾 | OK | 437行目「AI 支援で執筆しました。コードは 2026-10-31 に実際に実行して確認しています。」。日付は最後の実行（`run/14.log`）と同じ |
| G09 | 原稿、ログ、frontmatter に秘密情報が無い。原稿に個人名が無い | `gate.md` | OK | 秘密情報: 原稿と `logs/zod-validate-llm-json-output/` 全体（この gate.md を除く）に `ANTHROPIC`、`sk-ant`、`token`、`password`、`secret`、`api_key`、`/root`、`/home/user`、`tmp/claude`、`scratchpad` を `grep -rniI` でかけた。該当は、frontmatter の `needs_api_key`、本文の `max_tokens`、`selection.md` の環境変数の名前と `unset` の記録と slug `llm-api-cost-estimate-js-tiktoken`、`sources.md` の出典の引用（`max_tokens`、「100,000 tokens」）、`code/README.md` の作業場所の説明（scratchpad の語だけ、パスは無い）。`run/` のログは0件。値としての API キーやトークンは0件（コードはキーを使わない）。個人名: git のコミット作者名とメールアドレス（Claude 以外の全員分、名前の各語とメールのローカル部と数字の ID）、ユーザーのメールアドレスのローカル部、ユーザーの GitHub アカウント名、CLAUDE.md の人格設定の人名（漢字の姓・名、英字の姓・名）を1語ずつ `grep -rliI` でかけ、すべて0件 |
| G10 | `target_query` が `keywords/*.csv` の行のキーワードと一致する。CSV が無い、または null なら不合格 | `selection.md` | NG | `keywords/` に CSV が無い（README.md だけ）。`target_query` は null（7行目）。値は作っていない。CSV が届くまで下書きのまま止める |

## B. checklist.md の全項目（原文のまま）

| # | 区分 | 項目 | 判定 | 根拠 |
|---|---|---|---|---|
| C01 | 設計（→ 01-seo-for-dev-blogs.md） | 「誰の、どんな検索に答える記事か」が1行で言える | OK | guides/01 冒頭の原則と §1。`brief.md` の C01 の1行（TypeScript の経験があり LLM の出力を使い始めた人が、zod での検証と `safeParse` のエラーの読み方を検索したときに答える）。検索語そのものは G10 のとおり未確定 |
| C02 | 設計（→ 01-seo-for-dev-blogs.md） | タイトルにキーワードが含まれ、具体的（「徹底解説」「完全ガイド」を使っていない） | OK | guides/01 §3「タイトルの作り方」。2行目「LLM の出力 JSON を zod で検証する【safeParse のエラーの読み方】」。「LLM」「JSON」「zod」「safeParse」を左寄せで入れた。講座のキーワード「構造化出力」そのものはタイトルに無く、tags と main_keyword（5〜6行目）に入れた。タイトルはワークフローの指示で与えられたもの。「徹底解説」「完全ガイド」は0件（`prose-check.txt` の PAT） |
| C03 | 設計（→ 01-seo-for-dev-blogs.md） | リード文の3行で「何が解決するか」が伝わる | OK | guides/01 §3「リード文が最重要」。49行目の3文で、検証の書き方（`JSON.parse` のあとに `safeParse`）、失敗時の読み方（`path`、`code`、`message` の順）、記事で示すもの（5つの見本の実際の issues）を示した |
| C04 | 設計（→ 01-seo-for-dev-blogs.md） | 検索意図のタイプ（やり方/エラー/比較/概念）に構成が合っている | OK | guides/01 §1 の表でやり方に合うのはチュートリアルか解説。guides/02 タイプ1 を原本で読み、要素ごとに照合した（`brief.md` の表）。リード（49〜51行目）→ 前提（88行目）→ 手順（130、200、296、335、369行目、各コードと結果）→ 確認（408行目）と次の記事（419行目） |
| C05 | 構成（→ 02-article-structures.md） | 結論先行になっている（答え → 理由 → 詳細） | OK | guides/02 共通の原則1。リード（49行目）の1文目が答え。最初の H2（55行目）は見出し自体が結論で、読む順と出た `code` の表。理由（78行目、Structured Outputs でも検証が要る）が2つ目、手順の詳細はその後 |
| C06 | 構成（→ 02-article-structures.md） | 1見出し1トピック。見出しを読むだけで流れがわかる | OK | guides/02 共通の原則2。H2 は 55（読む順）、78（検証が要る理由）、88（準備）、130（スキーマと見本）、200（issues の読み方）、296（再依頼の文）、335（日本語）、369（z.object）、402（料金）、408（確認）、421（出典）。H3 は1つの `code` に1つ（204、223、242、261） |
| C07 | 構成（→ 02-article-structures.md） | 見出しが「作業の実況」でなく「内容」で書かれている | OK | guides/02 共通の原則4、guides/03 症状②。例「safeParse の失敗は path、code、message の順に読む」「unrecognized_keys は path が空の配列」「z.object は余分なキーを黙って消す」。「まず〜する」型は0件。88行目「使うバージョンと準備」、130行目「スキーマと見本の JSON」は中身を名詞で示す見出し |
| C08 | 構成（→ 02-article-structures.md） | コードはコピペで動く形（import・前提を省略していない／実行結果を示した） | OK | guides/02 タイプ1 の肝、guides/01 §4。7ファイルを import から全文掲載し、ファイル名（147、162、316、352、388行目）、作業フォルダ（96〜99行目）、前提（92行目 Node.js 22.18.0 以上、出典8）を示した。各コマンドの出力は `run/03`、`05`〜`12` から写した（G04） |
| C09 | AI臭（→ 03-anti-ai.md） | 書き手の態度が感じられる（全部同じ温度になっていない） | OK | guides/03 不在1。Structured Outputs を使っても検証は省けないという主張を2つ目の H2 に置いた（80、86行目「確かめるべきです」）。判断の文（367行目「この講座では英語のまま使います」、400行目「開発とテストでは `z.strictObject` を使います」）。料金と準備の節は短くし、issues の読み方の節を最も長くした |
| C10 | AI臭（→ 03-anti-ai.md） | 各セクションに言い切りの文が最低1つある | OK | guides/03 不在2。55: 「次の順に読むと迷いません」、78: 「検証のコードは省けません」、88: 「固定しています」、130: 「エラーにします」、204: 「優先度のキーが合わないとわかります」、223: 「`values` に候補の一覧が入ります」、242: 「オブジェクト全体についての違反だからです」、261: 「3 は許されるとわかります」、296: 「モデルに伝えられます」、335: 「英語のまま使います」、369: 「`z.strictObject` を使います」、402: 「無料です」、408: 「すべて確かめます」、421: 「どれも 2026-10-31 です」 |
| C11 | AI臭（→ 03-anti-ai.md） | ヘッジ（〜でしょう/かもしれません）が過剰でない | OK | guides/03 症状①。「でしょう」「かもしれ」は0件（`prose-check.txt` の PAT）。「起こり得ます」（84、221、240行目）は出典7の「might」に合わせた言い方で、出典を付けた3か所だけ |
| C12 | AI臭（→ 03-anti-ai.md） | メタ発言（〜を解説します/見ていきましょう）を削った | OK | guides/03 症状②、guides/05 §3。ai-smell-lint の②0件、writing-lint の B-6 0回。「解説します」「見ていきましょう」「紹介します」は0件（目視） |
| C13 | AI臭（→ 03-anti-ai.md） | 章境界アナウンス（ここから〜/ここまで〜してきました/次は〜）が無い | OK | guides/03 症状⑫。「ここから」「ここまで」「次は」「次の節」は0件（PAT）。「次の順に」（59行目）「次の4種類」（69行目）「次の4つ」（410行目）は直後の内容を指す語。419行目「講座の次の記事」はスキルが求める講座の前後リンク |
| C14 | AI臭（→ 03-anti-ai.md） | テンプレ比喩（地図/土台/車の両輪/潤滑油/スパイス…）を使っていない | OK | guides/03 症状⑬の一覧。ai-smell-lint の⑬0件。比喩は使っていない |
| C15 | AI臭（→ 03-anti-ai.md） | 「〜じゃない。〜だ。」の対比構文が1記事に2回以上出ていない | OK | guides/03 症状⑧、guides/08 B-1。writing-lint の B-1 0回、ai-smell-lint の⑧0件。PAT の「ではありません」は149行目の1件で、見本が手作りであることの明記（後ろに肯定側を続ける対比になっていない、`judgments.md`）。数えても1回で「2回以上」に当たらない |
| C16 | AI臭（→ 03-anti-ai.md） | 文長に緩急がある（短文と長文が混ざっている） | OK | guides/03 不在4。`prose-check.txt` で地の文と frontmatter の文長が8〜60字、20字以下5文、41〜60字50文。例 114行目「依存を入れます。」の短文、94行目「作業フォルダを作って移動します。」の後に長い説明が続く |
| C17 | AI臭（→ 03-anti-ai.md） | 同じ語尾が3回以上連続していない | OK | guides/03 症状⑥と語尾の反復チェック。`prose-check.txt` の SAME3 0 |
| C18 | AI臭（→ 03-anti-ai.md） | 一文を短くしすぎて主語・目的語を削っていない（ブツ切り回避） | OK | guides/03 症状⑮（目視）。地の文を読み、主語か目的語が抜けて意味が取れない文が無いことを確かめた。60字に収めるために分けた文も「それでも、数値の `minimum` と `maximum` には対応していません（出典7）。文字数の `minLength` と `maxLength` も同じです（出典7）。」（82行目）のように主語を残した |
| C19 | AI臭（→ 03-anti-ai.md） | ですます/である調が統一されている（常体落ちが無い） | OK | guides/03 症状⑮、guides/05 §7。地の文の文末を Python で調べ、ですます以外は0件（`judgments.md` の「文末の調査」）。表のセル（「型が違う」など）と箇条書きの「〜か」は guides/05 §7 の例外 |
| C20 | コロケーション（→ 04-collocation.md） | 「課題・問題・エラー・目標・効果」に付く動詞が正しい | OK | guides/04「動詞と目的語のミスマッチ」。「課題」「問題」「目標」「効果」は0件。「エラー」は「エラーにします」（147行目）だけで、表の誤用に当たらない |
| C21 | コロケーション（→ 04-collocation.md） | 漢語サ変動詞の助詞（が/を）が合っている（速度が向上する／速度を向上させる） | OK | guides/04「自動詞・他動詞の取り違え」。サ変動詞は「検証します」「固定しています」「分類させる」「設定です」など。「JSON は…`safeParse` で検証します」「バージョンは…固定しています」は他動詞に を／は、「出力をスキーマに合わせる」で取り違えなし（目視） |
| C22 | コロケーション（→ 04-collocation.md） | 形容詞と名詞が合っている（理解は深い、精度は高い） | OK | guides/04「形容詞・連体修飾と名詞のミスマッチ」。形容詞は「長い」（配列が長い）、「読みやすい」（文字列）、「余分な」（キー）程度で、表の誤用なし（目視） |
| C23 | コロケーション（→ 04-collocation.md） | 重言が無い（まず最初に／throwを投げる／約〜程度） | OK | guides/04「重言」。「まず最初に」「約〜程度」なし。「例外を投げず」（57行目）「例外を投げて」（183行目）は throw の和訳だけで英単語と重ねていない |
| C24 | コロケーション（→ 04-collocation.md） | 翻訳調が無い（影響を作る → 影響を与える） | OK | guides/04「翻訳調」。「〜を作る（make）」「〜を持っている（have）」型なし（目視）。「型も作れます」（147行目）「再依頼の文を作る」（296行目）は実際に値を作る技術的な記述 |
| C25 | 正確さ（→ 05-technical-writing.md） | 60字超の長文を分割した | OK | guides/05 §1「文の長さ」。`prose-check.txt` で60字超 0（最長60字）。途中の版の10文を分けた（`judgments.md`）。インラインコード、Markdown のリンク（URL を含む）、（出典n）も1字ずつ数え、見出し、表のセル、箇条書き、frontmatter の文字列も数えた。除外はコードブロックと URL だけのセル（件数は `prose-check.txt` 2行目） |
| C26 | 正確さ（→ 05-technical-writing.md） | 用語が記事全体で統一されている | OK | guides/05 §4「用語の統一」と §7。「見本」（「サンプル」は地の文で0件、コードの識別子 `samples` だけ）、「違反」、「再依頼の文」、「作業フォルダ」（「ディレクトリ」0件）、「バージョン」（「版」0件）、「issues」「issue」は zod のフィールド名のまま。JSON のキーは「キー」、認証の鍵は必ず「API キー」と書き分けた。半角と全角の間には空白 |
| C27 | 正確さ（→ 05-technical-writing.md） | 数量・期間が具体的な数値（早めに → 1週間以内に） | OK | guides/05 §4「曖昧表現の具体化」。5つの見本、4種類、11種類、1〜3、40字、15分ほど、3件、2つ目、`$0.10`、`$0.50`、10万トークン、100万トークン。「数個」「早めに」型なし |
| C28 | 正確さ（→ 05-technical-writing.md） | AND/ORが明確（「AやB」で曖昧にしていない） | OK | guides/05 §4「AND/ORの明確化」。並列の「や」は0件（`prose-check.txt` の YA 2件は「読みやすい」「しやすい」の一部）。AND は「`path` と `code` を使います」（67行目）「カテゴリ、1〜3の優先度、40字以内の要約、タグの配列」（132行目）、箇条書きは「次の4つをすべて」（410行目）。OR は「true か false」（57行目） |
| C29 | 正確さ（→ 05-technical-writing.md） | ですます/である調が混在していない | OK | guides/05 §7。C19 と同じ文末の調査で、ですます調だけ |
| C30 | 記号（→ 03-anti-ai.md） | `**太字**` のアスタリスク残りが無い（コードブロック外） | OK | guides/03 記号NG。`prose-check.txt` の PAT `**` 0件（コードブロックの外） |
| C31 | 記号（→ 03-anti-ai.md） | `—`（em-dash）`──`（罫線）を使っていない | OK | guides/03 記号NG。`—`、`─`、`―` 0件（PAT）、writing-lint B-5 0回 |
| C32 | 記号（→ 03-anti-ai.md） | `：`+半角スペース、`／`での概念並列を使っていない | OK | guides/03 記号NG。`： `、`：`、`／` は0件（PAT）。コードブロック内の出力（`大きすぎる値: …`）は対象外 |
| C33 | 機械チェック | `python3 scripts/ai-smell-lint.py 記事.md` を実行し、FATALがゼロ | OK | スキル手順7のコマンド（`python3 docs/tech-writing-pack/scripts/ai-smell-lint.py content/articles/zod-validate-llm-json-output.md > logs/zod-validate-llm-json-output/lint/ai-smell.txt 2>&1; echo "exit=$?" >> …`）で、437行の版に FATAL 0、`exit=0` |
| C34 | 機械チェック | warnは目視で要否を判断した | OK | guides/03「lint との関係」。warn 0件で判断の対象なし（`lint/judgments.md`） |
| C35 | 機械チェック | FATAL/warnが「自分が使っている(use)」か「悪い例の引用(📎mention)」かを確認した（引用なら合格） | OK | guides/03「引用（mention）と使用（use）の区別」。FATAL、warn、mention がすべて0件で、区別が要る検出なし |
| C36 | 機械チェック | 悪い例を引用したときは、引用符でくくり・悪い例と明示し・直後に直し方を置いた | OK | guides/03「悪い例を引用するときの書き方」。文章の悪い例は引用していない。違反を入れた JSON の見本は、手作りで違反を入れたと明示し（149行目）、直後に各見本の issues と読み方を置いた（200〜294行目） |
| C37 | 最後の一押し（人間にしかできない） | 自分の実体験・判断・動作確認した結果が入っている | OK | guides/03 不在1・不在4、guides/06「使い方の流れ」4。Claude が動かした結果と、そこからの判断: `run/06`〜`09.log` の issues から、読む順を `path`、`code`、`message` に決めた（55〜67行目）。`run/09.log`（違反3つで3件）から、再依頼の文を1回の検証で作れると判断した（292、333行目）。`run/11.log`（日本語の文がやや不自然で、`z.config` は全体に効く）から、講座では英語のまま使うと判断した（367行目）。`run/12.log`（`confidence` が黙って消える）から、開発とテストでは `z.strictObject` を使うと判断した（398〜400行目） |
| C38 | 最後の一押し（人間にしかできない） | コードを実際に動かして確認した | OK | 記事のコードとコマンドはすべて実行した（`run/01.log`〜`12.log`、G04）。型は `run/13.log`、外へ出ないことは `run/14.log`。モデルには送っていない（キーが無く、記事も文字列を作るところまでにした。333行目） |
| C39 | 最後の一押し（人間にしかできない） | 「答えを書かずに問いで終わる」箇所が1〜2箇所ある（任意） | 任意・あり | 417行目「再依頼を何回まで続け、それでも合わない出力はどう扱いますか。」の1か所 |

## 集計

- A: OK 8 / NG 2（G07、G10）（全10項目）
- B: OK 38 / NG 0 / 任意・あり 1（全39項目）

## 結論

G07 と G10 が NG なので、`status: draft` のまま止める。EmDash への投稿も git のコミットもしていない。

ブロッカー（解消するまで下書き）:

1. G10: `keywords/` に CSV が無い。`target_query` は null のまま、値は作らない（`selection.md`）。
2. G07: 講座の前後の記事（`claude-structured-outputs-json`、`zod-to-json-schema-tool-definition`）が、公開も予約もされていない（前は原稿も無く、次は下書きの原稿だけがある）。前の記事 #6 は API キーが要る記事なので、`ANTHROPIC_API_KEY` が入るまで書けない。この記事より前に2本が公開か予約されるか、公開の時点で無いほうのリンクを外して frontmatter を null に戻すまで、公開に進めない。

ゲート外の制約:

1. 検証した JSON は手で作った見本で、本物のモデルの出力ではない（本文149行目に明記）。モデルが実際にどの違反をどれくらい返すかは確かめていない。
2. 再依頼の文をモデルへ送る処理は書いておらず、実行もしていない（キーが無い）。
3. GitHub の blob のページと npm のページはこの環境から 403 だったので、同じタグの raw ファイルと `npm view` で中身を確かめた（`sources.md`）。zod.dev は main の原稿を出しているので、v4.6.7 の原稿と比べて差が記事に関係しないことを確かめた（`sources.md`）。
4. `run/*.log` は Bash の `python3` と `cat` で読んだ。
