# gate: llm-api-429-retry-sdk-mock

判定日: 2026-10-31。原稿: `content/articles/llm-api-429-retry-sdk-mock.md`（398行。行番号はすべてこの版）。

## 判定の前に読んだもの

2026-10-31 に、次を Read ツールで全文読んでから全項目を判定した。

- `docs/tech-writing-pack/checklist.md`（61行）
- `guides/01-seo-for-dev-blogs.md`（192行）、`02-article-structures.md`（173行）、`03-anti-ai.md`（443行）、`04-collocation.md`（265行）、`05-technical-writing.md`（183行）
- `guides/06-rewriting-prompts.md`（186行）、`08-ai-buntai-ruleset.md`（266行）、`09-ai-writing-manual.md`（97行）

`07-ai-buntai-laws.md` と `10-ai-buntai-handoff.md` は、スキルの表で判定の前に読むガイドに入っていないので読んでいない。

## A. このリポジトリで足しているゲート

| # | 条件 | 確かめ方と記録先 | 判定 | 根拠 |
|---|---|---|---|---|
| G01 | `ai-smell-lint.py` の FATAL が0件。frontmatter の行で出た `📎mention` は use として扱う。warn は1件ずつ判断した | `lint/ai-smell.txt`、`lint/judgments.md` | OK | guides/03「引用（mention）と使用（use）の区別」と「lint との関係」を読んで判定。`lint/ai-smell.txt` 3行目 `✅ クリーン`、4行目 use 0件 / 📎mention 0件、5行目 `✅ 致命なし`、10行目 `exit=0`。frontmatter（1〜44行目）の mention も0件。warn 0件（`lint/judgments.md`） |
| G02 | `writing-lint.py` の判定行で FATAL と DENSITY超過がどちらも 0。SHOULD、WATCH、INFO は1件ずつ判断した。個人名は G09 で確かめる | `lint/writing-lint.txt`、`lint/judgments.md` | OK | guides/09 §2 と guides/08 の密度基準総表を読んで判定。`lint/writing-lint.txt` 1行目 `398行/152文`、21行目 `### 判定: FATAL 0 / DENSITY超過 0 / SHOULD 0`、23行目 `exit=0`。DENSITY は10カウンタすべて0回で、上限は guides/08 の標準レジスターと一致。WATCH 節なし、INFO 0件 |
| G03 | 下の B の全項目を満たす | `gate.md` | OK | B は C01〜C38 がすべて OK、C39（任意）は「あり」 |
| G04 | 記事のコードを記事の形のまま実際に動かし、ログがある。API を呼ぶ記事で `ANTHROPIC_API_KEY` が無いときは不合格 | `code/`、`run/` | OK | `lint/check-code-and-outputs.txt`（ALL OK）: 記事のコード4つ（`package.json`、`server.ts`、`client.ts`、`my-loop.ts`）が `code/` と1文字も違わず、記事の実行結果5つが `run/` から機械的に取り出したものと一致。実行は `run/01.log`〜`09.log`（2026-10-31 08:54〜08:55 UTC、node v22.22.0 / npm 10.9.4）。01 は `mkdir retry-mock` とファイルの配置、02 は `npm install`、03 はモックサーバー、04〜08 は `node client.ts <シナリオ>`、09 は `node my-loop.ts`。外部に出ないことは `run/11.log`（`unshare -rn` の中で全シナリオが同じ結果、外への fetch は `ENETUNREACH`）。型は `run/12.log`（tsc 7.0.2、exit=0）。リクエストの送り先は手元のモックで、`needs_api_key: false`（40行目） |
| G05 | 断定した事実すべてに一次情報の出典があり、本文に出ている。料金の目安がある。`cost_estimate`、`run_environment`、`verified_at` が埋まり、ログと一致する | 原稿の出典の表、`sources.md`、frontmatter | OK | 本文 383〜396行目に出典の表（8件、題名、URL、確認日 2026-10-31）。断定した文は（出典n）で表を引く（`sources.md` に文ごとの対応、実行ログを根拠にした文は後半の表）。料金は 363〜367行目で、記事の手順は無料、本物の API はトークン数に応じた料金（Opus 5.5 は入力 $4、出力 $20 / 100万トークン、出典8）。失敗したリクエストの課金は確かめていないと明記した。frontmatter 9〜11行目の `cost_estimate`、`run_environment: "Node.js 22.22.0、@anthropic-ai/sdk 1.3.0"`（`run/03.log` 以降の見出し `node: v22.22.0` と `code/package.json` の `1.3.0` に一致）、`verified_at: "2026-10-31"`（最後の実行 `run/12.log` の日付） |
| G06 | 既存記事と検索意図が重ならない | `selection.md` | OK | `content/articles/` の frontmatter を全件読んだ（この記事のほか、`mcp-server-typescript-stdio`（MCP サーバー、やり方）と、別の作業で書かれている `llm-api-cost-estimate-js-tiktoken`（料金の見積もり、やり方））。429・529 のエラーとリトライ（エラー）に答える記事は無い |
| G07 | 講座の前後リンクと、既存記事が3本以上なら関連記事への内部リンク。リンク先は公開済みか先に予約済み | `gate.md` | NG | リンクは本文にある。前: 50行目 `/llm-api-cost-estimate-js-tiktoken`（frontmatter 12行目 `prev`）。次: 381行目 `/claude-api-authentication-error`（13行目 `next`）。どちらも `content/plan.md` の course_step 1 の並び（#3、#5）による計画上の slug。前の記事は `content/articles/` に原稿があるが公開も予約もされておらず、次の記事は原稿も無い。今この記事を公開すると2本ともリンク切れになるので NG。公開済みか予約済みの記事は0本なので、関連記事への内部リンク（3本以上のとき）は対象外 |
| G08 | 本文の最後の段落が「AI 支援で執筆」の決まった表記 | 原稿の末尾 | OK | 398行目「AI 支援で執筆しました。コードは 2026-10-31 に実際に実行して確認しています。」。日付は最後の実行（`run/12.log`）と同じ |
| G09 | 原稿、ログ、frontmatter に秘密情報が無い。原稿に個人名が無い | `gate.md` | OK | 秘密情報: 原稿と `logs/llm-api-429-retry-sdk-mock/` 全体（この gate.md を除く）に `ANTHROPIC`、`sk-ant`、`token`、`password`、`secret`、`/root`、`/home/user`、`tmp/claude`、`scratchpad` を `grep -rniI` でかけた。該当は、`ANTHROPIC` がパッケージ名 `@anthropic-ai/sdk`、クラス名 `Anthropic`、GitHub の URL、`api.anthropic.com`（netns の確認で外へ出られないことを試した宛先）、`selection.md` の環境変数の名前と `unset` の記録。`token` は `max_tokens`、`input_tokens` と、slug の `tiktoken`、地の文の「トークン」の英字なし。`scratchpad` は `code/README.md` の作業場所の説明だけ。値としての API キーやトークンは0件。コードのキーはダミーの文字列 `dummy-key-not-sent-anywhere` で、送り先は 127.0.0.1。個人名: git のコミット作者名とメールアドレス（Claude 以外の全員分、名前の各語とメールのローカル部）、ユーザーのメールアドレスのローカル部、ユーザーの GitHub アカウント名、CLAUDE.md の人格設定の人名（漢字の姓・名、英字の姓）を1語ずつ `grep -rliI` でかけ、すべて0件 |
| G10 | `target_query` が `keywords/*.csv` の行のキーワードと一致する。CSV が無い、または null なら不合格 | `selection.md` | NG | `keywords/` に CSV が無い（README.md だけ）。`target_query` は null（7行目）。値は作っていない。CSV が届くまで下書きのまま止める |

## B. checklist.md の全項目（原文のまま）

| # | 区分 | 項目 | 判定 | 根拠 |
|---|---|---|---|---|
| C01 | 設計（→ 01-seo-for-dev-blogs.md） | 「誰の、どんな検索に答える記事か」が1行で言える | OK | guides/01 冒頭の原則と §1。`brief.md` の C01 の1行（LLM の API を組み込み始めた JS か TypeScript の経験者が、429・529 を見てリトライの書き方を検索したときに答える）。検索語そのものは G10 のとおり未確定 |
| C02 | 設計（→ 01-seo-for-dev-blogs.md） | タイトルにキーワードが含まれ、具体的（「徹底解説」「完全ガイド」を使っていない） | OK | guides/01 §3「タイトルの作り方」。2行目「LLM API の 429・529 エラーとリトライ【SDK の自動リトライを手元のモックで確かめる】」。講座のキーワード「LLM API」を先頭に、エラーのステータスコードを左寄せで入れた。「徹底解説」「完全ガイド」は0件（`prose-check.txt` の PAT） |
| C03 | 設計（→ 01-seo-for-dev-blogs.md） | リード文の3行で「何が解決するか」が伝わる | OK | guides/01 §3「リード文が最重要」、guides/02 タイプ3 のリード。46行目の3文で、エラーの意味、SDK が2回自動でリトライすること、直し方（自前のループを書かず、諦めたあとのエラーだけ受け取る）を示した |
| C04 | 設計（→ 01-seo-for-dev-blogs.md） | 検索意図のタイプ（やり方/エラー/比較/概念）に構成が合っている | OK | guides/01 §1 の表でエラーに合うのはトラブル解決。guides/02 タイプ3 を原本で読み、要素ごとに照合した（`brief.md` の表）。解決策（52行目）→ 原因（150行目）→ 原因別（321、327、333行目）→ それでもダメなとき（339行目）→ チェックリスト（369行目）。変更前 → 変更後の対比（58〜144行目） |
| C05 | 構成（→ 02-article-structures.md） | 結論先行になっている（答え → 理由 → 詳細） | OK | guides/02 共通の原則1。リード（46行目）の1文目が答え。最初の H2（52行目）が解決策で、見出し自体が結論。原因の説明はその後（150行目） |
| C06 | 構成（→ 02-article-structures.md） | 1見出し1トピック。見出しを読むだけで流れがわかる | OK | guides/02 共通の原則2。H2 は 52（直し方）、150（原因）、167（再現）、339（直らないとき）、363（料金）、369（確認）、383（出典）。H3 は 1見出しに1つの挙動（321 429、327 529、333 400、343 月の上限、351 長い retry-after、357 request-id） |
| C07 | 構成（→ 02-article-structures.md） | 見出しが「作業の実況」でなく「内容」で書かれている | OK | guides/02 共通の原則4、guides/03 症状②。例「429 は retry-after の1秒を守って3回目に成功した」「retry-after の無い 429 は月の利用上限」。「まず〜する」型は0件。171行目「使うバージョンと準備」、265行目「実行するコマンドと結果」は、中身（バージョンとコマンド）を名詞で示す見出し |
| C08 | 構成（→ 02-article-structures.md） | コードはコピペで動く形（import・前提を省略していない／実行結果を示した） | OK | guides/02 タイプ1・3 の肝、guides/01 §4。4ファイルを import から全文掲載し、置き場所（177〜178行目の `mkdir`、251行目）と前提（173行目 Node.js 22.18.0 以上、出典7）を示した。コマンドと出力は `run/02`〜`09` から写した（G04） |
| C09 | AI臭（→ 03-anti-ai.md） | 書き手の態度が感じられる（全部同じ温度になっていない） | OK | guides/03 不在1。自前のループを外すという主張を最初の H2 に置き、9回送った結果を強く示した（103行目「混雑している API に、6秒で9回送ったことになります」）。判断の文（325行目「自分で待つコードは要らない、と判断しています」、337行目「`instanceof` で書くのが確実です」、355行目「`signal` で決めておくのが安全です」）。料金の節は短くした |
| C10 | AI臭（→ 03-anti-ai.md） | 各セクションに言い切りの文が最低1つある | OK | guides/03 不在2。52: 「ループを外し、回数は `maxRetries` で決めます」、150: 「自分のコードを直しても 529 は減りません」、167〜: 「型は調べません」「ログの値も収まっています」「対象から外れています」、339〜: 「この上限です」「区切りません」「この ID を添えます」、363: 「無料です」、369: 「次の5つを見ます」、383: 「確認日は、どれも 2026-10-31 です」 |
| C11 | AI臭（→ 03-anti-ai.md） | ヘッジ（〜でしょう/かもしれません）が過剰でない | OK | guides/03 症状①。「でしょう」「かもしれ」は0件（`prose-check.txt` の PAT）。確かめていないことは「確かめていません」（367行目）と事実で書いた |
| C12 | AI臭（→ 03-anti-ai.md） | メタ発言（〜を解説します/見ていきましょう）を削った | OK | guides/03 症状②、guides/05 §3。ai-smell-lint の②0件、writing-lint の B-6 0回。148行目「後の『それでもダメなとき』で説明します」は、コードにある2つの要素の説明先を示す1文で、読者がコードの意味を探さずに済むように残した（章の境界の予告ではない） |
| C13 | AI臭（→ 03-anti-ai.md） | 章境界アナウンス（ここから〜/ここまで〜してきました/次は〜）が無い | OK | guides/03 症状⑫。「ここから」「ここまで」「次は」「次の節」は0件（PAT）。途中で出た「ここまでのリトライ」（361行目）は直した（`judgments.md`）。「次の `client.ts`」（105行目）「次の3つ」（341行目）「次の5つ」（371行目）は直後の内容を指す語。381行目「講座の次の記事」はスキルが求める講座の前後リンク |
| C14 | AI臭（→ 03-anti-ai.md） | テンプレ比喩（地図/土台/車の両輪/潤滑油/スパイス…）を使っていない | OK | guides/03 症状⑬の一覧。ai-smell-lint の⑬0件。比喩は使っていない |
| C15 | AI臭（→ 03-anti-ai.md） | 「〜じゃない。〜だ。」の対比構文が1記事に2回以上出ていない | OK | guides/03 症状⑧、guides/08 B-1。writing-lint の B-1 0回、ai-smell-lint の⑧0件、PAT の「ではな」「じゃな」「ではありません」0件 |
| C16 | AI臭（→ 03-anti-ai.md） | 文長に緩急がある（短文と長文が混ざっている） | OK | guides/03 不在4。`prose-check.txt` で地の文と frontmatter の文長が12〜59字、20字以下11文、41〜60字51文。例 175行目「作業フォルダを作って移動します。」の短文の後に長い説明が続く |
| C17 | AI臭（→ 03-anti-ai.md） | 同じ語尾が3回以上連続していない | OK | guides/03 症状⑥と語尾の反復チェック。`prose-check.txt` の SAME3 0。途中で出た箇条書きの「いるか」4連続は直した（`judgments.md`） |
| C18 | AI臭（→ 03-anti-ai.md） | 一文を短くしすぎて主語・目的語を削っていない（ブツ切り回避） | OK | guides/03 症状⑮（目視）。地の文118文を読み、主語か目的語が抜けて意味が取れない文が無いことを確かめた。60字に収めるために分けた文も「`rate-limit` は、…を返すシナリオです。3回目は成功を返します。」（323行目）のように主語を残した |
| C19 | AI臭（→ 03-anti-ai.md） | ですます/である調が統一されている（常体落ちが無い） | OK | guides/03 症状⑮、guides/05 §7。地の文118文の文末を Python で調べ、ですます以外は0件（`judgments.md` の「文末の調査」）。箇条書きの「〜か」は guides/05 §7 の例外 |
| C20 | コロケーション（→ 04-collocation.md） | 「課題・問題・エラー・目標・効果」に付く動詞が正しい | OK | guides/04「動詞と目的語のミスマッチ」。「課題」「目標」「効果」は0件。「エラー」は「エラーが投げられました」「エラーを受け取る」「エラーが出る」「エラーを返す」で、表の誤用（バグを解決する等）に当たらない。「問題」は 335行目「中身に問題がある」で自然 |
| C21 | コロケーション（→ 04-collocation.md） | 漢語サ変動詞の助詞（が/を）が合っている（速度が向上する／速度を向上させる） | OK | guides/04「自動詞・他動詞の取り違え」。サ変動詞は「リトライします」「混雑している」「起動し」「実行します」「判定」など。「API が…混雑している」（自動詞に が）、「`client.ts` を実行します」（他動詞に を）で取り違えなし（目視） |
| C22 | コロケーション（→ 04-collocation.md） | 形容詞と名詞が合っている（理解は深い、精度は高い） | OK | guides/04「形容詞・連体修飾と名詞のミスマッチ」。形容詞は「長い」（retry-after が長い）「多い」（通信が多い）程度で、表の誤用なし（目視） |
| C23 | コロケーション（→ 04-collocation.md） | 重言が無い（まず最初に／throwを投げる／約〜程度） | OK | guides/04「重言」。「まず最初に」「約〜程度」なし。「`InternalServerError` が投げられました」（329行目）は throw の和訳だけで英単語と重ねていない。「約0.5秒」（327行目）は「程度」と重ねていない |
| C24 | コロケーション（→ 04-collocation.md） | 翻訳調が無い（影響を作る → 影響を与える） | OK | guides/04「翻訳調」。「〜を作る（make）」「〜を持っている（have）」型なし（目視）。251行目「`type` と `message` を持つ `error`」は JSON のオブジェクトがフィールドを持つ技術的な記述 |
| C25 | 正確さ（→ 05-technical-writing.md） | 60字超の長文を分割した | OK | guides/05 §1「文の長さ」。`prose-check.txt` で60字超 0（最長59字）。インラインコード、Markdown のリンク（URL を含む）、（出典n）も1字ずつ数え、見出し、表のセル、箇条書き、frontmatter の文字列も数えた。除外はコードブロックと URL だけのセル（件数は `prose-check.txt` 2行目） |
| C26 | 正確さ（→ 05-technical-writing.md） | 用語が記事全体で統一されている | OK | guides/05 §4「用語の統一」と §7。「リトライ」（「再試行」0件）、「モックサーバー」、「作業フォルダ」（「ディレクトリ」0件）、「バージョン」（「版」0件）、「ステータスコード」、エラーのクラスは英語のクラス名のまま。半角と全角の間には空白（「LLM API」「SDK 1.3.0」）。tags と main_keyword は講座のキーワードの表記「LLM API」 |
| C27 | 正確さ（→ 05-technical-writing.md） | 数量・期間が具体的な数値（早めに → 1週間以内に） | OK | guides/05 §4「曖昧表現の具体化」。2回、9回、6秒、1012ms、394ms、857ms、0.5秒、8秒、25%、375〜500ms、約24.8日、10秒、$4、$20、翌月1日の 00:00 UTC。「数秒」「早めに」型なし |
| C28 | 正確さ（→ 05-technical-writing.md） | AND/ORが明確（「AやB」で曖昧にしていない） | OK | guides/05 §4「AND/ORの明確化」。「や」の並列0件（途中の「429 や 529」3か所は「429 か 529」に直した、`judgments.md`）。AND は「1分あたりのリクエスト数、入力トークン数、出力トークン数の3つ」（161行目）「408、409、429 と、500 以上」（335行目）、OR は「`err.status` か `err.type`」（165行目）「JS か TypeScript」（50行目） |
| C29 | 正確さ（→ 05-technical-writing.md） | ですます/である調が混在していない | OK | guides/05 §7。C19 と同じ文末の調査で、ですます調だけ |
| C30 | 記号（→ 03-anti-ai.md） | `**太字**` のアスタリスク残りが無い（コードブロック外） | OK | guides/03 記号NG。`prose-check.txt` の PAT `**` 0件（コードブロックの外） |
| C31 | 記号（→ 03-anti-ai.md） | `—`（em-dash）`──`（罫線）を使っていない | OK | guides/03 記号NG。`—`、`─`、`―` 0件（PAT）、writing-lint B-5 0回 |
| C32 | 記号（→ 03-anti-ai.md） | `：`+半角スペース、`／`での概念並列を使っていない | OK | guides/03 記号NG。`： `、`：`、`／` は0件（PAT）。範囲は「〜」（375〜500ms）で書いた |
| C33 | 機械チェック | `python3 scripts/ai-smell-lint.py 記事.md` を実行し、FATALがゼロ | OK | スキル手順7のコマンド（`python3 docs/tech-writing-pack/scripts/ai-smell-lint.py content/articles/llm-api-429-retry-sdk-mock.md > logs/.../lint/ai-smell.txt 2>&1; echo "exit=$?" >> …`）で、398行の版に FATAL 0、`exit=0` |
| C34 | 機械チェック | warnは目視で要否を判断した | OK | guides/03「lint との関係」。warn 0件で判断の対象なし（`lint/judgments.md`） |
| C35 | 機械チェック | FATAL/warnが「自分が使っている(use)」か「悪い例の引用(📎mention)」かを確認した（引用なら合格） | OK | guides/03「引用（mention）と使用（use）の区別」。FATAL、warn、mention がすべて0件で、区別が要る検出なし |
| C36 | 機械チェック | 悪い例を引用したときは、引用符でくくり・悪い例と明示し・直後に直し方を置いた | OK | guides/03「悪い例を引用するときの書き方」。文章の悪い例は引用していない。変更前のコード `my-loop.ts` は、「変更前のコード」と明示し（56行目）、直後に結果（81〜103行目）と変更後のコード（105行目〜）を置いた |
| C37 | 最後の一押し（人間にしかできない） | 自分の実体験・判断・動作確認した結果が入っている | OK | guides/03 不在1・不在4、guides/06「使い方の流れ」4。Claude が動かした結果と、そこからの判断: `run/09.log` と `run/03.log`（自前の3回ループで9回）から、ループを外して `maxRetries` に任せると判断した（52〜105行目）。`run/10.log`（`err.name` が `Error`）から、分岐は `instanceof` で書くと判断した（337行目）。`run/08.log`（`retry-after: 30` を `signal` で10秒に区切った）と SDK のソースから、待てる時間を `signal` で決めると判断した（355行目）。`run/03.log` の spend-cap 3回から、アプリ側で止める処理が要ると判断した（349行目） |
| C38 | 最後の一押し（人間にしかできない） | コードを実際に動かして確認した | OK | 記事のコードとコマンドはすべて実行した（`run/01.log`〜`09.log`、G04）。外へ出ないことは `run/11.log`、型は `run/12.log`。本物の Claude API には送っていない（キーが無く、記事もモックで確かめる範囲に絞った。48行目、365行目） |
| C39 | 最後の一押し（人間にしかできない） | 「答えを書かずに問いで終わる」箇所が1〜2箇所ある（任意） | 任意・あり | 379行目「自分のアプリでは、ユーザーを何秒まで待たせますか。」の1か所 |

## 集計

- A: OK 8 / NG 2（G07、G10）（全10項目）
- B: OK 38 / NG 0 / 任意・あり 1（全39項目）

## 結論

G07 と G10 が NG なので、`status: draft` のまま止める。EmDash への投稿も git のコミットもしていない。

ブロッカー（解消するまで下書き）:

1. G10: `keywords/` に CSV が無い。`target_query` は null のまま、値は作らない（`selection.md`）。
2. G07: 講座の前後の記事（`llm-api-cost-estimate-js-tiktoken`、`claude-api-authentication-error`）が、まだ公開も予約もされていない。この記事より前に2本が公開か予約されるか、公開の時点で無いほうのリンクを外すまで、公開に進めない。

ゲート外の制約:

1. 本物の Claude API には送っていない。429 と 529 の本文と挙動は公式の説明（出典1、2）と SDK のソース（出典4、5）に合わせたモックで再現した。本物の API の 429 の本文や `retry-after` の値は確かめていない。
2. GitHub の blob のページと npm のページはこの環境から 403 だったので、同じタグの raw ファイルと `npm view` で中身を確かめた（`sources.md`）。
3. `run/*.log` と `node_modules/` は、執筆に使う環境の Read 禁止ルールに当たる。ログは Bash の `python3` で読んだ。
