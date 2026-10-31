# gate: llm-json-parse-error-fix

判定日: 2026-10-31。原稿: `content/articles/llm-json-parse-error-fix.md`（333行。行番号はすべてこの版）。

## 判定の前に読んだもの

2026-10-31 に、次を Read ツールで全文読んでから全項目を判定した。

- `docs/tech-writing-pack/checklist.md`（61行。Bash の cat で全文を表示して読んだ）
- `guides/01-seo-for-dev-blogs.md`（192行）、`02-article-structures.md`（173行）、`03-anti-ai.md`（443行）、`04-collocation.md`（265行）、`05-technical-writing.md`（183行）
- `guides/06-rewriting-prompts.md`（186行）、`08-ai-buntai-ruleset.md`（266行）、`09-ai-writing-manual.md`（97行）
- `keywords/README.md`（35行。cat で全文を表示して読んだ）

`07-ai-buntai-laws.md` と `10-ai-buntai-handoff.md` は、スキルの表で判定の前に読むガイドに入っていないので読んでいない。

## A. このリポジトリで足しているゲート

| # | 条件 | 確かめ方と記録先 | 判定 | 根拠 |
|---|---|---|---|---|
| G01 | `ai-smell-lint.py` の FATAL が0件。frontmatter の行で出た `📎mention` は use として扱う。warn は1件ずつ判断した | `lint/ai-smell.txt`、`lint/judgments.md` | OK | guides/03「引用（mention）と使用（use）の区別」と「lint との関係」を読んで判定。`lint/ai-smell.txt` 2行目 `✅ クリーン`、4行目 use 0件 / 📎mention 0件、5行目 `✅ 致命なし`、10行目 `exit=0`。frontmatter（1〜38行目）の mention も0件。warn 0件。コードの中のバッククォート3つでコードブロックの除去がずれず、地の文がすべて検査されたことも確かめた（`lint/judgments.md`） |
| G02 | `writing-lint.py` の判定行で FATAL と DENSITY超過がどちらも 0。SHOULD、WATCH、INFO は1件ずつ判断した。個人名は G09 で確かめる | `lint/writing-lint.txt`、`lint/judgments.md` | OK | guides/09 §2 と guides/08 の密度基準総表を読んで判定。`lint/writing-lint.txt` 1行目 `333行/120文`、21行目 `### 判定: FATAL 0 / DENSITY超過 0 / SHOULD 0`、23行目 `exit=0`。上限は guides/08 の標準の列と一致。途中の版の B-2 三連反復3箇所は直した（`judgments.md`）。WATCH の節なし、INFO 0件 |
| G03 | 下の B の全項目を満たす | `gate.md` | OK | B は C01〜C38 がすべて OK、C39（任意）は「あり」 |
| G04 | 記事のコードを記事の形のまま実際に動かし、ログがある。API を呼ぶ記事で `ANTHROPIC_API_KEY` が無いときは不合格 | `code/`、`run/` | OK | `lint/check-code-and-outputs.txt`（ALL OK）: 記事のコード7つ（`package.json`、`samples.ts`、`reproduce.ts`、`extract-json.ts`、`fix.ts`、`stop-reason.ts`、`naive-repair.ts`）が `code/` と1文字も違わない。記事のコマンドは `run/01.log`〜`05.log`（`node -v`、`node reproduce.ts`、`node fix.ts`、`node stop-reason.ts`、`node naive-repair.ts`、記事の順、すべて exit=0）と `code/extra/run-all.sh` の手順（`mkdir llm-json-parse`、`cd llm-json-parse`）で実行し、記事の実行結果5つは `run/` の出力と1文字も違わない。実行は 2026-10-31、node v22.22.0 / npm 10.9.4。型は `run/07.log`（tsc 7.0.2、exit=0）、外へ出ないことは `run/08.log`。API は呼ばない（`needs_api_key: false`、34行目） |
| G05 | 断定した事実すべてに一次情報の出典があり、本文に出ている。料金の目安がある。`cost_estimate`、`run_environment`、`verified_at` が埋まり、ログと一致する | 原稿の出典の表、`sources.md`、frontmatter | OK | 本文 320〜331行目に出典の表（6件、題名、URL、確認日 2026-10-31）。断定した文は（出典n）で表を引く（40、48、61、80、139、204、206、285、287、303行目）。文ごとの対応と、実行ログを根拠にした文は `sources.md`。料金は 299〜303行目で、記事のコードは無料（API を呼ばず npm のパッケージも入れない）、取り直すとリクエストの分の料金がかかり、Claude Haiku 5.5 は 100万トークンあたり入力 $0.10、出力 $0.50（10万トークン以下のプロンプト、出典5）。取り直す処理は実行していないので「無料」とは書いていない。frontmatter 9〜11行目の `cost_estimate`、`run_environment: "Node.js 22.22.0、npm 10.9.4、依存パッケージなし（型の確認は TypeScript 7.0.2）"`（`run/*.log` の見出し `node: v22.22.0 / npm: 10.9.4`、`run/07.log` の `tsc: Version 7.0.2` と一致）、`verified_at: "2026-10-31"`（最後の実行 `run/09.log` の日付） |
| G06 | 既存記事と検索意図が重ならない | `selection.md` | OK | `content/articles/` の frontmatter を全件読んだ（この記事のほか5本）。最も近い `zod-validate-llm-json-output` は JSON として読めたあとの形の検証に答え、この記事は JSON として読めない原因に答える（`content/plan.md` の重なりの決めごとと同じ）。見本も使い回していない |
| G07 | 講座の前後リンクと、既存記事が3本以上なら関連記事への内部リンク。リンク先は公開済みか先に予約済み | `gate.md` | NG | リンクは本文にある。前: 44行目 `/posts/zod-to-json-schema-tool-definition`（frontmatter 12行目 `prev`）。次: 318行目 `/posts/structured-output-methods-compare`（13行目 `next`）。関連: 314行目 `/posts/zod-validate-llm-json-output`。前後は `content/plan.md` の course_step 2 の並び（#8、#10）による計画上の slug で、パスは既存の原稿と同じ `/posts/<slug>`。前の記事と関連の記事は `content/articles/` に原稿があるが `status: draft` で、公開も予約もされていない。次の記事は原稿が無い。今この記事を公開すると3本ともリンク切れになる。公開済みか予約済みの記事は0本（既存5本はどれも `status: draft`）なので、関連記事への内部リンク（3本以上のとき）の条件は満たす対象が無い。リンク先の slug: `zod-to-json-schema-tool-definition`、`structured-output-methods-compare`、`zod-validate-llm-json-output` |
| G08 | 本文の最後の段落が「AI 支援で執筆」の決まった表記 | 原稿の末尾 | OK | 333行目「AI 支援で執筆しました。コードは 2026-10-31 に実際に実行して確認しています。」。日付は最後の実行（`run/09.log`）と同じ |
| G09 | 原稿、ログ、frontmatter に秘密情報が無い。原稿に個人名が無い | `gate.md` | OK | 秘密情報: 原稿と `logs/llm-json-parse-error-fix/` 全体に `ANTHROPIC`、`sk-ant`、`token`、`password`、`secret`、`api_key`、`/root`、`/home/user`、`tmp/claude`、`scratchpad` を `grep -rniIE` でかけた。該当は、frontmatter の `needs_api_key`、本文とコードとログの `max_tokens` と `Unexpected token`、`selection.md` の環境変数の名前と `unset` の記録、`code/README.md` の作業場所の説明、この gate.md の検索語の列挙だけ。値としての API キーやトークンは0件（コードはキーを使わない）。ログのパスは `<work>`、`<code>`、`<scratch>` に置き換えて保存した。個人名: git のコミット作者名とメールアドレス（Claude 以外の全員分。名前の各語、メールのローカル部、数字の ID）、ユーザーのメールアドレスのローカル部、ユーザーの GitHub アカウント名、CLAUDE.md の人格設定の人名（漢字の姓・名、英字の姓・名）を1語ずつ `grep -rniI -F` で原稿と `logs/llm-json-parse-error-fix/` にかけ、0件 |
| G10 | `target_query` が `keywords/*.csv` の行のキーワードと一致する。CSV が無い、または null なら不合格 | `selection.md` | NG | `keywords/` に CSV が無い（README.md だけ）。`target_query` は null（7行目）。値は作っていない。CSV が届くまで下書きのまま止める（CSV 待ち） |

## B. checklist.md の全項目（原文のまま）

| # | 区分 | 項目 | 判定 | 根拠 |
|---|---|---|---|---|
| C01 | 設計（→ 01-seo-for-dev-blogs.md） | 「誰の、どんな検索に答える記事か」が1行で言える | OK | guides/01 冒頭の原則と §1。`brief.md` の C01 の1行（TypeScript で LLM の出力を受け取る処理を書き始めた人が、`JSON.parse` の `SyntaxError` の文で検索したときに、原因の見分け方と直し方を答える）。検索語そのものは G10 のとおり未確定 |
| C02 | 設計（→ 01-seo-for-dev-blogs.md） | タイトルにキーワードが含まれ、具体的（「徹底解説」「完全ガイド」を使っていない） | OK | guides/01 §3「タイトルの作り方」。2行目「LLM の返した JSON が JSON.parse で落ちる原因と直し方【コードフェンス、途中で切れる】」。「LLM」「JSON」「JSON.parse」を左寄せで入れ、原因の2種類を【】に具体的に書いた。講座のキーワード「構造化出力」はタイトルに無く、tags と main_keyword（5〜6行目）に入れた。タイトルはワークフローの指示で与えられたもの。「徹底解説」「完全ガイド」は0件（`prose-check.txt` の PAT） |
| C03 | 設計（→ 01-seo-for-dev-blogs.md） | リード文の3行で「何が解決するか」が伝わる | OK | guides/01 §3「リード文が最重要」、guides/02 タイプ3 のリード（3行以内）。40行目の3文で、原因は2つ、前後の文字は `{` から `}` を切り出せば読める、切れた出力は `max_tokens` を上げて取り直す、を示した |
| C04 | 設計（→ 01-seo-for-dev-blogs.md） | 検索意図のタイプ（やり方/エラー/比較/概念）に構成が合っている | OK | guides/01 §1 の表でエラーに合うのはトラブル解決。guides/02 タイプ3 を原本で読み、要素ごとに照合した（`brief.md` の表）。リード（40行目）→ 結論の表（46〜57行目）→ 原因の説明（90〜139行目）→ 原因別の解決策（141、200行目）→ それでもダメなとき（289行目）→ チェックリスト（305行目）。エラーの文は見出し（141、200行目）と表（50〜55行目）に入れ、変更前 `reproduce.ts` → 変更後 `fix.ts` で対比し、環境（Node.js 22.22.0）を書いた |
| C05 | 構成（→ 02-article-structures.md） | 結論先行になっている（答え → 理由 → 詳細） | OK | guides/02 共通の原則1、タイプ3「解決策を先、原因の説明は後」。リード（40行目）の1文目が答え。最初の H2（46行目）は見出しが結論で、エラーの文 → 原因 → 直し方の表。理由（139行目、JSON のテキストは値1つ）と詳細のコードは後 |
| C06 | 構成（→ 02-article-structures.md） | 1見出し1トピック。見出しを読むだけで流れがわかる | OK | guides/02 共通の原則2。H2 は 46（見分け方）、59（環境）、90（再現）、141（前後の文字の直し方）、200（切れた出力の扱い）、283（Structured Outputs）、289（それでも失敗するとき）、299（料金）、305（確認）、320（出典）。H3 は 262（閉じ括弧を足す直し方の問題）の1つ |
| C07 | 構成（→ 02-article-structures.md） | 見出しが「作業の実況」でなく「内容」で書かれている | OK | guides/02 共通の原則4、guides/03 症状②。例「エラーの文の頭で原因と直し方が決まる」「Unexpected token は JSON の前後を切り出して直す」「閉じ括弧を足すと、欠けたデータがそのまま通る」。「まず〜する」型は0件。59行目「動かした環境と準備」、299行目「料金がかからない範囲」は中身を名詞で示す見出し |
| C08 | 構成（→ 02-article-structures.md） | コードはコピペで動く形（import・前提を省略していない／実行結果を示した） | OK | guides/02 タイプ1・3、guides/01 §4。7ファイルを import から全文掲載し、ファイル名（80、94、108、143、168、206、264行目）、作業フォルダ（73〜78行目）、前提（61行目 Node.js 22.18.0 以上、出典2）を示した。各コマンドの出力は `run/01`〜`05.log` から写した（G04 の `check-code-and-outputs.txt`） |
| C09 | AI臭（→ 03-anti-ai.md） | 書き手の態度が感じられる（全部同じ温度になっていない） | OK | guides/03 不在1。切れた出力は直さず取り直す、という主張を最初の H2 に置いた（57行目「切れた出力は捨てて、取り直してください」）。H3（262〜281行目）で、閉じ括弧を足すと欠けたデータが通る実行結果を見せ、281行目で「この講座では…使わず…取り直すことにしました」と決めた。料金と環境の節は短く、切れた出力の節を最も長くした |
| C10 | AI臭（→ 03-anti-ai.md） | 各セクションに言い切りの文が最低1つある | OK | guides/03 不在2。46: 57行目「1つで直せます」「取り直してください」、59: 61行目「依存パッケージは使いません」、90: 137行目「4つとも読めませんでした」、141: 143行目「切り出せば消えます」、200: 202行目「元に戻せません」、262: 281行目「取り直すことにしました」、283: 287行目「分岐は残してください」、289: 297行目「示します」、299: 301行目「無料です」、305: 307行目「すべて確かめます」、320: 322行目「どれも 2026-10-31 です」 |
| C11 | AI臭（→ 03-anti-ai.md） | ヘッジ（〜でしょう/かもしれません）が過剰でない | OK | guides/03 症状①。「でしょう」「かもしれ」は0件（`prose-check.txt` の PAT）。「合わないことがあります」（287行目）は出典4の「might be incomplete and not match」に合わせた言い方で、出典を付けた1か所だけ |
| C12 | AI臭（→ 03-anti-ai.md） | メタ発言（〜を解説します/見ていきましょう）を削った | OK | guides/03 症状②、guides/05 §3。ai-smell-lint の②0件、writing-lint の B-6 0回。「解説します」「見ていき」「紹介します」は0件（PAT） |
| C13 | AI臭（→ 03-anti-ai.md） | 章境界アナウンス（ここから〜/ここまで〜してきました/次は〜）が無い | OK | guides/03 症状⑫。「ここから」「ここまで」「次は」「まとめ」「整理」は0件（PAT）。「次の関数」「次のファイル」「次の3つ」「次の4つ」は直後の内容を指す語。318行目「講座の次の記事」はスキルが求める講座の前後リンク |
| C14 | AI臭（→ 03-anti-ai.md） | テンプレ比喩（地図/土台/車の両輪/潤滑油/スパイス…）を使っていない | OK | guides/03 症状⑬の一覧。ai-smell-lint の⑬0件、PAT の「地図」「仕様書」0件。比喩は使っていない |
| C15 | AI臭（→ 03-anti-ai.md） | 「〜じゃない。〜だ。」の対比構文が1記事に2回以上出ていない | OK | guides/03 症状⑧、guides/08 B-1。writing-lint の B-1 0回、ai-smell-lint の⑧0件、PAT の「ではなく」「ではありません」「じゃない」0件。281行目の「使わず、…取り直す」を数えても1回（`judgments.md`） |
| C16 | AI臭（→ 03-anti-ai.md） | 文長に緩急がある（短文と長文が混ざっている） | OK | guides/03 不在4。`prose-check.txt` で地の文の文長が6〜60字、20字以下7文、41〜60字50文。例 124行目「実行します。」、137行目「4つとも読めませんでした。」の短文の後に長い説明が続く |
| C17 | AI臭（→ 03-anti-ai.md） | 同じ語尾が3回以上連続していない | OK | guides/03 症状⑥と語尾の反復チェック。`prose-check.txt` の SAME3（末尾3字）0、2字の語尾（「ます」「です」）の3連続も0 |
| C18 | AI臭（→ 03-anti-ai.md） | 一文を短くしすぎて主語・目的語を削っていない（ブツ切り回避） | OK | guides/03 症状⑮（目視）。地の文を読み、主語か目的語が抜けて意味が取れない文が無いことを確かめた。60字に収めるために分けた文も「`truncated` の position 43 は、文字列の長さと同じ値です。最後まで読んでも、文字列が閉じなかったことを表します。」（297行目）のように、2文目の主語は1文目と同じで、読み取れる |
| C19 | AI臭（→ 03-anti-ai.md） | ですます/である調が統一されている（常体落ちが無い） | OK | guides/03 症状⑮、guides/05 §7。地の文と description の文末を `prose-check.py` で調べ、ですます以外は0件（`prose-check.txt` の C19）。表のセルと箇条書きは guides/05 §7 の例外 |
| C20 | コロケーション（→ 04-collocation.md） | 「課題・問題・エラー・目標・効果」に付く動詞が正しい | OK | guides/04「動詞と目的語のミスマッチ」。「課題」「問題」「目標」「効果」は0件。「エラー」は「`SyntaxError` を投げる」「元のエラーを投げる」（40、48、166行目）、「エラーは消えました」（281行目）、「エラーが無くなる」（285行目）で、表の誤用に当たらない |
| C21 | コロケーション（→ 04-collocation.md） | 漢語サ変動詞の助詞（が/を）が合っている（速度が向上する／速度を向上させる） | OK | guides/04「自動詞・他動詞の取り違え」。サ変動詞は「実行します」「保存します」「表示します」「成功します」「生成させる」など。「`JSON.parse` は成功します」（264行目）は自動詞に が／は、「続きを生成させる」（204行目）は他動詞の使役で、取り違えなし（目視） |
| C22 | コロケーション（→ 04-collocation.md） | 形容詞と名詞が合っている（理解は深い、精度は高い） | OK | guides/04「形容詞・連体修飾と名詞のミスマッチ」。形容詞は「正しい JSON」「余計な文字」「不完全」程度で、表の誤用なし（目視） |
| C23 | コロケーション（→ 04-collocation.md） | 重言が無い（まず最初に／throwを投げる／約〜程度） | OK | guides/04「重言」。「まず最初に」「約〜程度」なし。「例外を投げる」「`SyntaxError` を投げます」は throw の和訳だけで英単語と重ねていない。63行目は「まず」だけ |
| C24 | コロケーション（→ 04-collocation.md） | 翻訳調が無い（影響を作る → 影響を与える） | OK | guides/04「翻訳調」。「〜を作る（make）」「〜を持っている（have）」型なし（目視）。「手で作った」（42、92、206行目）は実際に文字列を作る記述 |
| C25 | 正確さ（→ 05-technical-writing.md） | 60字超の長文を分割した | OK | guides/05 §1「文の長さ」。`prose-check.txt` で60字超 0（最長60字）。途中の版の15文を分けた（`judgments.md`）。インラインコード、リンク（URL を含む）、（出典n）も書かれたとおりに数え、見出し、表のセル、箇条書き、frontmatter の title と description も数えた。除外はコードブロックと URL だけのセル6つ |
| C26 | 正確さ（→ 05-technical-writing.md） | 用語が記事全体で統一されている | OK | guides/05 §4「用語の統一」と §7。「見本」、「コードフェンス」（42行目で定義、略して「フェンス」）、「エラーの文」、「取り直す」、「作業フォルダ」、「切り出す」で通した。出力の主は地の文ではすべて「LLM」（途中の版の「モデルの出力」を直した。コードのコメントは除く）。「例外」は投げられるエラーの意味だけで使い、途中の版の「例外です」（保証の外の意味）を直した。製品名は Node.js、TypeScript、npm の公式表記。半角と全角の間には空白 |
| C27 | 正確さ（→ 05-technical-writing.md） | 数量・期間が具体的な数値（早めに → 1週間以内に） | OK | guides/05 §4「曖昧表現の具体化」。2つ、4つの見本、3つ、10文字、position 39、position 43、Node.js 22.18.0 以上、$0.10、$0.50、10万トークン、100万トークン。「数個」「早めに」型なし |
| C28 | 正確さ（→ 05-technical-writing.md） | AND/ORが明確（「AやB」で曖昧にしていない） | OK | guides/05 §4「AND/ORの明確化」。並列の「や」は0件（PAT）。OR は「コードフェンスか説明の文」（40行目）、「`{` か `[` から、最後の `}` か `]` まで」（164行目）、「上げるか、続きを生成させる」（204行目）。AND は「入力と出力のトークン」（303行目）。箇条書きは「次の4つをすべて」（307行目）、「次の3つを同じ行に」（291行目） |
| C29 | 正確さ（→ 05-technical-writing.md） | ですます/である調が混在していない | OK | guides/05 §7。C19 と同じ文末の調査で、ですます調だけ |
| C30 | 記号（→ 03-anti-ai.md） | `**太字**` のアスタリスク残りが無い（コードブロック外） | OK | guides/03 記号NG。PAT `**` 0件（コードブロックの外） |
| C31 | 記号（→ 03-anti-ai.md） | `—`（em-dash）`──`（罫線）を使っていない | OK | guides/03 記号NG。`—`、`─`、`―` 0件（PAT）、writing-lint B-5 0回 |
| C32 | 記号（→ 03-anti-ai.md） | `：`+半角スペース、`／`での概念並列を使っていない | OK | guides/03 記号NG。`：`、`／` は0件（PAT）。コードブロック内の出力（`SyntaxError: …`）は対象外 |
| C33 | 機械チェック | `python3 scripts/ai-smell-lint.py 記事.md` を実行し、FATALがゼロ | OK | スキル手順7のコマンド（`python3 docs/tech-writing-pack/scripts/ai-smell-lint.py content/articles/llm-json-parse-error-fix.md > logs/llm-json-parse-error-fix/lint/ai-smell.txt 2>&1; echo "exit=$?" >> …`）で、333行の版に FATAL 0、`exit=0` |
| C34 | 機械チェック | warnは目視で要否を判断した | OK | guides/03「lint との関係」。warn 0件で判断の対象なし（`lint/judgments.md`）。writing-lint の SHOULD、WATCH、INFO も0件。lint が拾わない title の「落ちる」は、guides/04「技術ブログでの線引き」に照らして判断した（`judgments.md`） |
| C35 | 機械チェック | FATAL/warnが「自分が使っている(use)」か「悪い例の引用(📎mention)」かを確認した（引用なら合格） | OK | guides/03「引用（mention）と使用（use）の区別」。FATAL、warn、mention がすべて0件で、区別が要る検出なし |
| C36 | 機械チェック | 悪い例を引用したときは、引用符でくくり・悪い例と明示し・直後に直し方を置いた | OK | guides/03「悪い例を引用するときの書き方」。文章の悪い例は引用していない。失敗する文字列の見本は、手で作った見本だと明示し（42、92行目とコードのコメント）、直後にそれぞれのエラーの文（130〜135行目）と直し方（141行目以降）を置いた。閉じ括弧を足す直し方は、使わない理由を実行結果の直後に書いた（281行目） |
| C37 | 最後の一押し（人間にしかできない） | 自分の実体験・判断・動作確認した結果が入っている | OK | guides/03 不在1・不在4、guides/06「使い方の流れ」4。Claude が動かした結果と、そこからの判断: `run/02.log` で出た4つのエラーの文から、文の頭で原因を見分ける表を作った（50〜55行目）。`run/03.log`（前後の文字の3つは読め、切れた1つは同じエラーのまま）から、切り出しで直るのは前の3つだけと判断した（57、196行目）。`run/05.log`（閉じ括弧を足すと成功し、`summary` が途中で止まったまま通る）から、この講座では足さずに取り直すと決めた（281行目）。`run/09.log`（説明の文の `{` で範囲がずれる）から、その場合はプロンプトか Structured Outputs で防ぐと書いた（198行目）。MDN の例のエラーの文が Node.js 22.22.0 の文と違うことを確かめ、記事にはログの文を載せた（`brief.md`） |
| C38 | 最後の一押し（人間にしかできない） | コードを実際に動かして確認した | OK | 記事のコードとコマンドはすべて実行した（`run/01.log`〜`05.log`、G04）。補助の確認は `run/06.log`（エラーの文の全体と position）、`run/07.log`（型）、`run/08.log`（ネットワークなし）、`run/09.log`（括弧で範囲がずれる場合）。API は呼んでいない（キーが無く、記事も応答の形の見本までにした） |
| C39 | 最後の一押し（人間にしかできない） | 「答えを書かずに問いで終わる」箇所が1〜2箇所ある（任意） | 任意・あり | 316行目「取り直しても `max_tokens` で切れ続けるとき、上限をさらに上げますか。それとも、出力を短くするようプロンプトを変えますか。」の1か所 |

## 集計

- A: OK 8 / NG 2（G07、G10）（全10項目）
- B: OK 38 / NG 0 / 任意・あり 1（全39項目）

## 結論

G07 と G10 が NG なので、`status: draft` のまま止める。

- G10: `keywords/` に CSV が届いていない（CSV 待ち）。`target_query` は null で、値は作っていない。
- G07: 前後と関連のリンク先（`zod-to-json-schema-tool-definition`、`structured-output-methods-compare`、`zod-validate-llm-json-output`）が、どれも公開も予約もされていない。前の2本が先に予約され、次の記事の原稿ができるまで、この記事は公開できない。

EmDash への投稿と git のコミットはしていない（執筆するエージェントの担当外）。
