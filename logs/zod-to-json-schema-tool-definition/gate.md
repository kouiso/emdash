# gate: zod-to-json-schema-tool-definition

判定日: 2026-10-31。原稿: `content/articles/zod-to-json-schema-tool-definition.md`（442行。行番号はすべてこの版）。

## 判定の前に読んだガイド

2026-10-31 に、次を Read ツールで全文読んでから判定した。

- `docs/tech-writing-pack/checklist.md`（61行）
- `guides/01-seo-for-dev-blogs.md`（192行）、`02-article-structures.md`（173行）、`03-anti-ai.md`（443行）、`04-collocation.md`（265行）、`05-technical-writing.md`（183行）
- `guides/06-rewriting-prompts.md`（186行）、`08-ai-buntai-ruleset.md`（266行）、`09-ai-writing-manual.md`（97行）
- `guides/07-ai-buntai-laws.md` と `10-ai-buntai-handoff.md` は読んでいない。スキルの表で、どのゲート項目もこの2つを判定の前提にしていない。

補助スクリプトは2つ。`lint/prose-check.py` は C16、C17、C25、C26、C28、C30〜C32 の目視の補助で、インラインコード、リンクの URL、（出典n）も1字ずつ数え、frontmatter の文字列、見出し、表のセルも数える。数えないのはコードブロックの中身（172行）と、URL だけの表のセル（12個、429〜440行目）。`lint/check-code-and-outputs.py` は、記事のコードブロックと `code/` のファイル、記事の出力と `run/` のログを1文字ずつ比べる。

## A. このリポジトリで足しているゲート

| # | 条件 | 確かめ方と記録先 | 判定 | 根拠 |
|---|---|---|---|---|
| G01 | `ai-smell-lint.py` の FATAL が0件。frontmatter の行で出た `📎mention` は use として扱う。warn は1件ずつ判断した | `lint/ai-smell.txt`、`lint/judgments.md` | OK | guides/03「引用（mention）と使用（use）の区別」を読んで判定。`lint/ai-smell.txt` 2行目「✅ クリーン」、3行目 `use 0件 / 📎mention 0件`、4行目 `判定: ✅ 致命なし`、末尾 `exit=0`。frontmatter（1〜56行目）の mention も0件。warn 0件（`lint/judgments.md`） |
| G02 | `writing-lint.py` の判定行で FATAL と DENSITY超過がどちらも 0。SHOULD、WATCH、INFO は1件ずつ判断した。個人名は G09 で確かめる | `lint/writing-lint.txt`、`lint/judgments.md` | OK | guides/09 §2 と guides/08「密度基準総表」を読んで判定。`lint/writing-lint.txt` 1行目 `442行/190文`、判定行 `### 判定: FATAL 0 / DENSITY超過 0 / SHOULD 0`、末尾 `exit=0`。途中の版の B-2 三連反復1箇所は文末を変えて0にした（`lint/judgments.md`）。WATCH 節なし、SHOULD 0件、INFO 0件 |
| G03 | 下の B の全項目を満たす | `gate.md` | OK | B は C01〜C38 がすべて OK、C39（任意）は「あり」 |
| G04 | 記事のコードを記事の形のまま実際に動かし、ログがある。API を呼ぶ記事で `ANTHROPIC_API_KEY` が無いときは不合格 | `code/`、`run/` | OK | `lint/check-code-and-outputs.txt`（ALL OK）: 記事のコード7つ（package.json、tsconfig.json、src の5ファイル）が `code/` と1文字も違わず、記事の出力6つが `run/02`、`04`〜`08` の出力部分と一致（`run/02` は先頭の空行、`run/08` は `npm run` の見出し2行を除いて照合。記事にはその部分を載せていない）。`run/01`〜`07` のコマンドは記事のコマンドと同じで、終了コードはすべて 0（2026-10-31 09:1x、node v22.22.0、npm 10.9.4）。`run/08` は `return json;` に変えた実験で終了コード 1（記事に載せた型エラー）、`run/09` は戻した版で 0。記事の `cd zod-tool-schema` は、実行用スクリプトが各コマンドをそのフォルダで動かす形で再現した（各ログの `cwd:` の行、`code/README.md`）。コードは LLM の API を呼ばない（`needs_api_key: false`、52行目。SDK は `import type` だけ） |
| G05 | 断定した事実すべてに一次情報の出典（URL とアクセス日）があり、本文に出ている。料金の目安がある。`cost_estimate`、`run_environment`、`verified_at` が埋まり、ログと一致する | 原稿の出典の表、`sources.md`、frontmatter | OK | 本文 423〜440行目に出典の表（12件、題名、URL、確認日 2026-10-31）。断定した文は（出典n）で表を引く（`sources.md` に出典ごとの行番号）。出典の無い数字は実行ログが根拠で、`sources.md` の後半に一覧にした。料金は 409〜413行目: 記事の手順は API を呼ばないので無料、料金が要るのはツール定義を付けて Claude API を呼ぶ操作で、名前、説明、スキーマが入力トークンに数えられ、Claude Opus 5.5 ではツール用に286トークンが足される（出典5、6）。金額は API を呼んでいないので載せていないと明記。frontmatter 9〜11行目: `cost_estimate`（本文と同じ内容）、`run_environment`「Node.js 22.22.0、zod 4.6.7、Anthropic SDK 1.3.0、tsc 7.0.2」（Node.js は `run/01`〜`12` の `node:` の行、パッケージは `run/11.log` の `npm ls`、tsc は `run/12.log` の `Version 7.0.2`）、`verified_at: "2026-10-31"`（最後の実行 `run/12.log` の日付） |
| G06 | 既存記事と検索意図が重ならない | `selection.md` | OK | `content/articles/` の既存4本（MCP サーバーの自作、料金の見積もり、429 とリトライ、zod の safeParse での検証）に、zod のスキーマからツール定義を作る記事は無い。いちばん近い `zod-validate-llm-json-output` は返ってきた JSON の検証と issues の読み方に答え、この記事は変換に答える。この記事では issues の読み方を前の記事へのリンクに任せた（66行目、`selection.md` の絞り込み1） |
| G07 | 講座の前後リンクと、既存記事が3本以上なら関連記事への内部リンク。リンク先は公開済みか先に予約済み | `gate.md` | NG | ワークフローの指示に従い、`content/plan.md` の計画の slug で前後リンクを置いた。前: 66行目 `/posts/zod-validate-llm-json-output`（計画 #7）、次: 421行目 `/posts/llm-json-parse-error-fix`（計画 #9）。frontmatter も `prev`、`next` に同じ slug（12〜13行目）。前の記事は `content/articles/` に `status: draft` の原稿があるだけで、次の記事は原稿も無い。どちらも公開も予約もされていないので、今公開するとリンク切れになる。スキルの「リンク先は公開済みか、この記事より前の日時で予約済みの記事に限る」を満たさないので NG。関連記事の内部リンク: 公開済みか予約済みの既存記事は0本（`content/articles/` の4本はすべて draft）で3本未満なので、入れていない。リンク先の slug: `zod-validate-llm-json-output`、`llm-json-parse-error-fix` |
| G08 | 本文の最後の段落が「AI 支援で執筆」の決まった表記 | 原稿の末尾 | OK | 442行目「AI 支援で執筆しました。コードは 2026-10-31 に実際に実行して確認しています。」。日付は最後の実行（`run/12.log`）と同じ |
| G09 | 原稿、ログ、frontmatter に秘密情報が無い。原稿に個人名が無い | `gate.md` | OK | 秘密情報: 原稿と `logs/zod-to-json-schema-tool-definition/` 全体（この gate.md を除く。gate.md は調べた語の種類を書いている）に、Anthropic と OpenAI の API キーの環境変数名、`sk-`、`password`、`secret`、`Bearer`、`x-api-key`、`/root`、`/home/user`、`tmp/claude`、`scratchpad` を `grep -rniI` でかけた。該当は `selection.md` の環境変数名と `unset` の記録（値ではない）だけで、ほかは0件。32文字以上の英数字の連続も `grep -E` で探し、該当は slug だけ。ログの実行パスは `/path/to` に置き換えた。API キーは環境に無く、どのログにも値は出ていない。個人名: ユーザーの GitHub アカウント名、ユーザーのメールアドレスのローカル部、CLAUDE.md の人格設定の人名（漢字の姓・名、英字の姓・名）、関係者の漢字の姓・名とローマ字の姓を1語ずつ `grep -rniI` でかけ、すべて0件。git のコミット作者名はこのリポジトリでは製品名で、個人名ではない |
| G10 | `target_query` が `keywords/*.csv` の行のキーワードと一致する。CSV が無い、または null なら不合格 | `selection.md` | NG | `keywords/` に CSV が無い（README.md だけ、2026-10-31 に `ls keywords` で確認）。`target_query` は null（7行目）。CSV に無い値は作っていない。CSV が届くまで、この記事は下書きのまま止める |

## B. checklist.md の全項目

| # | 区分 | 項目 | 判定 | 根拠 |
|---|---|---|---|---|
| C01 | 設計（→ 01-seo-for-dev-blogs.md） | 「誰の、どんな検索に答える記事か」が1行で言える | OK | guides/01 冒頭の原則と §1。`brief.md` の C01 の1行（zod でスキーマを書いたことのある TypeScript の開発者が、そのスキーマから LLM のツール定義を作る方法を探したときに答える）。検索語そのものは G10 のとおり未確定 |
| C02 | 設計（→ 01-seo-for-dev-blogs.md） | タイトルにキーワードが含まれ、具体的（「徹底解説」「完全ガイド」を使っていない） | OK | guides/01 §3「タイトルの作り方」。2行目のタイトルは「zod のスキーマから JSON Schema を作ってツール定義に使う【zod v4 の z.toJSONSchema】」。メインキーワード「構造化出力」そのものは入っていないが、guides/01 §2 はメインキーワード単体を狙わずロングテールを狙うとしており、タイトルは関数名とバージョン（zod v4、z.toJSONSchema）を入れた具体的な形。テンプレ語は prose-check の `PAT` で0件。検索語は CSV 待ち（G10）なので、キーワードとの一致は CSV が届いてから見直す |
| C03 | 設計（→ 01-seo-for-dev-blogs.md） | リード文の3行で「何が解決するか」が伝わる | OK | guides/01 §3「リード文（導入）が最重要」。58行目の最初の3文で、`input_schema` を zod のスキーマから `z.toJSONSchema()` で作れること、`io: "input"` で `.default()` の項目が必須から外れることを言い切っている |
| C04 | 設計（→ 01-seo-for-dev-blogs.md） | 検索意図のタイプ（やり方/エラー/比較/概念）に構成が合っている | OK | guides/01 §1 の表（やり方 → チュートリアル）と guides/02 タイプ1 のテンプレート。リード（完成形、対象読者、所要時間 64行目）→ 前提・環境（78行目）→ ファイル構成（91行目）→ 番号付きの手順1〜4（109、181、205、305行目）でコードと実行結果を組にした → ハマりやすい所2節（345、380行目）→ まとめと次の記事（415行目）。`brief.md` に骨格を写した |
| C05 | 構成（→ 02-article-structures.md） | 結論先行になっている（答え → 理由 → 詳細） | OK | guides/02 共通の原則1。答え（58行目、`z.toJSONSchema()` に `io: "input"`）→ 理由（74行目、スキーマを1回だけ書けば食い違わない。372〜374行目、ツールの入力は入力側の値）→ 詳細（手順1〜4と2つの補足節） |
| C06 | 構成（→ 02-article-structures.md） | 1見出し1トピック。見出しを読むだけで流れがわかる | OK | guides/02 共通の原則2。見出し13個（68〜423行目）は、変換関数の説明、環境、ファイル構成、準備、スキーマ、変換と定義、出力の読み方、入力の検証、io の違い、変換できない型、料金、まとめ、出典の順で、1見出しに1つの話題 |
| C07 | 構成（→ 02-article-structures.md） | 見出しが「作業の実況」でなく「内容」で書かれている | OK | guides/02 共通の原則4、guides/03 症状②。手順の見出しも「準備は設定ファイル2つと npm install」「入力の形は schema.ts に zod で1回だけ書く」のように中身を言い切る形。「io の指定を省くと limit が必須の項目になる」「z.date() のような変換できない型は例外になる」は結論そのもの |
| C08 | 構成（→ 02-article-structures.md） | コードはコピペで動く形（import・前提を省略していない／実行結果を示した） | OK | guides/02 タイプ1の肝、guides/01 §4。7ファイルを import から全文掲載し、置き場所（作業フォルダと `src/`）と作り方（113〜116行目）を示した。前提の Node.js 22.18.0 以上（80行目）、`"type": "module"`（140行目）、tsconfig の各設定の理由（162行目）も書いた。実行結果は `run/` から写した（G04） |
| C09 | AI臭（→ 03-anti-ai.md） | 書き手の態度が感じられる（全部同じ温度になっていない） | OK | guides/03 不在1。「直すのは zod のスキーマ1か所で済みます」（74行目）、`as` より `if` で確かめるほうを選ぶ理由（245行目）、SDK の `betaZodTool` が `io` を指定しないことを指摘し、この記事は `io: "input"` を選ぶと書いた（374行目）。補足の節は短く、手順3は長くして温度差を付けた |
| C10 | AI臭（→ 03-anti-ai.md） | 各セクションに言い切りの文が最低1つある | OK | guides/03 不在2。68節「直すのは zod のスキーマ1か所で済みます」、78節「22.18.0 以上を使ってください」、109節「`"type": "module"` が要ります」、181節「zod で検証した結果には10が入ります」、205節「`if` で中身を確かめてから書き直すほうが…気づけます」、305節「受け取った入力を必ず検証します」、345節「この記事では `io: "input"` を選びました」、380節「日付は `z.iso.date()` で…受け取ります」、409節「料金はかかりません」、415節「両方ができました」 |
| C11 | AI臭（→ 03-anti-ai.md） | ヘッジ（〜でしょう/かもしれません）が過剰でない | OK | guides/03 症状①。`prose-check.txt` の `PAT 'でしょう'`、`'かもしれ'` は0件。ai-smell-lint の①も0件 |
| C12 | AI臭（→ 03-anti-ai.md） | メタ発言（〜を解説します/見ていきましょう）を削った | OK | guides/03 症状②。ai-smell-lint の②は0件。リードの「この記事では…書きます」（60行目）は guides/05 §3 が例外とする冒頭リード文の中だけ |
| C13 | AI臭（→ 03-anti-ai.md） | 章境界アナウンス（ここから〜/ここまで〜してきました/次は〜）が無い | OK | guides/03 症状⑫。ai-smell-lint の⑫は0件、`prose-check.txt` の `PAT 'ここから'`、`'ここまで'`、`'次は'` も0件。421行目「次に読む記事は…です」は講座の次の記事へのリンクで、スキルの「next があれば末尾近くに次の記事へのリンクを置く」に当たる |
| C14 | AI臭（→ 03-anti-ai.md） | テンプレ比喩（地図/土台/車の両輪/潤滑油/スパイス…）を使っていない | OK | guides/03 症状⑬。ai-smell-lint の⑬は0件。比喩は使っていない |
| C15 | AI臭（→ 03-anti-ai.md） | 「〜じゃない。〜だ。」の対比構文が1記事に2回以上出ていない | OK | guides/03 症状⑧。ai-smell-lint の⑧は0件、writing-lint の B-1 対比構文は0回。`prose-check.txt` の `PAT 'ではな'`、`'じゃな'`、`'ではありません'` も0件 |
| C16 | AI臭（→ 03-anti-ai.md） | 文長に緩急がある（短文と長文が混ざっている） | OK | guides/03 不在4、原因⑦。`prose-check.txt`: 本文と frontmatter の152文で最短13字、最長61字（タイトル）、20字以下が7文、41〜60字が80文。1文だけの段落（107、140、164、247行目）も挟んでいる |
| C17 | AI臭（→ 03-anti-ai.md） | 同じ語尾が3回以上連続していない | OK | guides/03「語尾の反復チェック」。`prose-check.txt` の `SAME3: 0`。writing-lint の B-2 三連反復も0箇所（途中の版の1箇所は直した） |
| C18 | AI臭（→ 03-anti-ai.md） | 一文を短くしすぎて主語・目的語を削っていない（ブツ切り回避） | OK | guides/03 症状⑮。20字以下の7文（例 247行目「型をチェックしてから、実行します。」、164行目「ファイルを置いたら、依存を入れます。」）は、どれも目的語か主語を残している。体言止めは本文に無い |
| C19 | AI臭（→ 03-anti-ai.md） | ですます/である調が統一されている（常体落ちが無い） | OK | guides/03 症状⑮。writing-lint の B-10 文体混在は超過の行が無い（0）。`prose-check.txt` の `PAT 'である。'`、`'だ。'`、`'する。'` は本文で0件。コードの中の文字列（ツールの description「…検索する。」など）はコードブロックの中で、読者向けの地の文ではない |
| C20 | コロケーション（→ 04-collocation.md） | 「課題・問題・エラー・目標・効果」に付く動詞が正しい | OK | guides/04「動詞と目的語のミスマッチ」。「エラーを出します」（162行目）、「エラーで止まりました」（236行目）、「400 エラーが返ります」（378行目）、「2件の問題が出ました」（343行目）、「例外を投げます」（382行目）。ai-smell-lint の CO 動詞ミスマッチは0件 |
| C21 | コロケーション（→ 04-collocation.md） | 漢語サ変動詞の助詞（が/を）が合っている（速度が向上する／速度を向上させる） | OK | guides/04「自動詞・他動詞の取り違え」。「入力を検証します」「スキーマを変換して」「結果が一致しています」など、他動詞は「を」、自動詞は「が」。ai-smell-lint の CO 自他動詞は0件 |
| C22 | コロケーション（→ 04-collocation.md） | 形容詞と名詞が合っている（理解は深い、精度は高い） | OK | guides/04「形容詞・連体修飾と名詞のミスマッチ」。程度の形容詞を名詞に付けた箇所は「いちばん時間のかかるコマンド」（64行目）だけで、表の組み合わせに当たらない。ai-smell-lint の CO 形容詞ミスは0件 |
| C23 | コロケーション（→ 04-collocation.md） | 重言が無い（まず最初に／throwを投げる／約〜程度） | OK | guides/04「重言」。ai-smell-lint の CO 重言は0件。`prose-check.txt` の `PAT '約'` 2件は「制約」の字で重言ではない。英単語とその和訳の重複（例「input を入力する」）も無い |
| C24 | コロケーション（→ 04-collocation.md） | 翻訳調が無い（影響を作る → 影響を与える） | OK | guides/04「翻訳調」。ai-smell-lint の CO 翻訳調は0件。「〜を持っています」は70行目「変換を標準で持っています」の1か所で、zod という製品が機能を持つ意味（have a question のような直訳ではない用法）として残した |
| C25 | 正確さ（→ 05-technical-writing.md） | 60字超の長文を分割した | OK | guides/05 §1「文の長さ」（50字が目安、60字超で分割を検討、80字が上限）。`prose-check.txt` の `LONG>60: 1`。最初の版の24文はすべて分けるか短くした（`lint/judgments.md`）。残る1件は frontmatter の `title`（2行目、61字）で、文ではなく記事の題名。ワークフローの指示で渡され、`content/plan.md` の仮タイトルと同じ文字列なので変えていない。80字の上限は超えていない。1字縮めるなら「作って」を「作り」にする形がある（メインエージェントの判断に残す） |
| C26 | 正確さ（→ 05-technical-writing.md） | 用語が記事全体で統一されている | OK | guides/05 §4「用語の統一」。JSON Schema のプロパティは「項目」、Claude API に渡す定義は「ツール定義」、`@anthropic-ai/sdk` は76行目で「Anthropic の TypeScript SDK」と書いた後は「SDK」、確かめる操作は「検証」と「型のチェック」で統一した（62行目の「型チェック」を「型のチェック」に直した） |
| C27 | 正確さ（→ 05-technical-writing.md） | 数量・期間が具体的な数値（早めに → 1週間以内に） | OK | guides/05 §4「曖昧表現の具体化」。所要時間3秒、7ファイル99行（64行目）、上限50と既定10（183〜203行目）、286トークン（413行目）、Node.js 22.18.0 以上（80行目）。「以上」は guides/05 §4「数量の境界」のとおり含む意味で使った |
| C28 | 正確さ（→ 05-technical-writing.md） | AND/ORが明確（「AやB」で曖昧にしていない） | OK | guides/05 §4「AND/ORの明確化」。`prose-check.txt` の `YA` は1件（72行目「やめた」の字）だけで、並列の「や」は0件。303行目は「返さない情報と使う場面」の AND に直した。411行目「手順1から4までと、io の比較、日付の例外の確認は、どれも」で、すべてを指すことを明記 |
| C29 | 正確さ（→ 05-technical-writing.md） | ですます/である調が混在していない | OK | guides/05 §7「文体の統一」。C19 と同じ根拠（writing-lint の B-10 は0、常体の文末0件）。表のセルと見出しは体言止めで、guides/05 §7 の例外に当たる |
| C30 | 記号（→ 03-anti-ai.md） | `**太字**` のアスタリスク残りが無い（コードブロック外） | OK | guides/03「記号NG」。`prose-check.txt` の `PAT '**'` は0件 |
| C31 | 記号（→ 03-anti-ai.md） | `—`（em-dash）`──`（罫線）を使っていない | OK | guides/03「記号NG」。`prose-check.txt` の `PAT '—'`、`'─'`、`'―'` は0件。ai-smell-lint の記号NG と writing-lint の B-5 ダッシュも0 |
| C32 | 記号（→ 03-anti-ai.md） | `：`+半角スペース、`／`での概念並列を使っていない | OK | guides/03「記号NG」。`prose-check.txt` の `PAT '： '`、`'／'` は0件 |
| C33 | 機械チェック | `python3 scripts/ai-smell-lint.py 記事.md` を実行し、FATALがゼロ | OK | guides/03「lint との関係」。手順7のコマンドで実行し、`lint/ai-smell.txt` は FATAL 0件、`exit=0`（G01） |
| C34 | 機械チェック | warnは目視で要否を判断した | OK | guides/03「lint との関係」。warn は0件で、判断する対象が無いことを `lint/judgments.md` に記録した |
| C35 | 機械チェック | FATAL/warnが「自分が使っている(use)」か「悪い例の引用(📎mention)」かを確認した（引用なら合格） | OK | guides/03「引用（mention）と使用（use）の区別」。use 0件、mention 0件（`lint/ai-smell.txt` 3行目）。frontmatter の行の mention も0件 |
| C36 | 機械チェック | 悪い例を引用したときは、引用符でくくり・悪い例と明示し・直後に直し方を置いた | OK | guides/03「悪い例を引用するときの書き方」。原稿に AI 臭の語の悪い例の引用は無い。コードの悪い例として「`return json;` と書いた版」（236行目）を載せたが、悪い版だと明示し、エラーの出力と、`if` で確かめて書き直す直し方（219、245行目）を続けている |
| C37 | 最後の一押し（人間にしかできない） | 自分の実体験・判断・動作確認した結果が入っている | OK | guides/03「5つの不在」、guides/06「使い方の流れ」4。動作確認: `run/04`〜`07` の出力を全文載せ、`run/08` の型エラー（`return json;` の実験）と `run/10` の `pattern` の照合を本文に入れた。判断: `as` より `if` を選ぶ理由（245行目）、`io: "input"` を選び `betaZodTool` との違いを指摘（374行目）、strict のツールではこのスキーマが使えないこと（378行目） |
| C38 | 最後の一押し（人間にしかできない） | コードを実際に動かして確認した | OK | G04 のとおり。記事の7ファイルを記事のコマンドで実行し、`run/01`〜`07` に記録した |
| C39 | 最後の一押し（人間にしかできない） | 「答えを書かずに問いで終わる」箇所が1〜2箇所ある（任意） | あり | guides/03 不在5。419行目「上限は zod の検証に任せて strict を付けるか、strict を付けずに上限もモデルに見せるか。あなたのツールなら、どちらにしますか。」で段落を閉じ、答えを書いていない |

## 結果

- 合格: G01〜G06、G08、G09。B は C01〜C38 すべて OK、C39 あり。
- 不合格: G07（前後リンクの先が未公開・未予約）、G10（CSV 待ち、`target_query: null`）。
- そのため `status: draft` のまま止める（53行目）。G07 は、前後の記事 `zod-validate-llm-json-output` と `llm-json-parse-error-fix` が公開されるか、この記事より前に予約されれば OK になる。予約より前に片方が無い場合は、その側のリンクを外して frontmatter を null に戻す。
- 確かめていないこと: 作ったツール定義を Claude API が受け付けるか（`$schema` と `pattern` を含む形のまま送ったときの応答）。API キーが無いので実行していない。記事の62行目にも書いた。
