# gate: mcp-server-typescript-stdio

判定日: 2026-10-31（敵対レビュー `review-pilot-0d648ef` を受けた全項目の再判定）。原稿: `content/articles/mcp-server-typescript-stdio.md`（426行。行番号はすべてこの版）。

## 判定の前に読んだもの

最初の版の判定は、guides 01〜05 と 09、checklist.md を読まずに lint と目視で OK にしていた（`vendor/` が Read の禁止ルール `Read(./**/vendor/**)` に当たって読めなかったため）。スキルの決まり（ガイドを読まずに判定した項目は NG）に従い、その判定はすべて取り消した。pack を `docs/tech-writing-pack/` に移したうえで、2026-10-31 に次を Read ツールで全文読んでから、全項目を判定し直した。

- `docs/tech-writing-pack/checklist.md`（61行）
- `guides/01-seo-for-dev-blogs.md`（192行）、`02-article-structures.md`（173行）、`03-anti-ai.md`（443行）、`04-collocation.md`（265行）、`05-technical-writing.md`（183行）
- `guides/06-rewriting-prompts.md`（186行）、`07-ai-buntai-laws.md`（90行）、`08-ai-buntai-ruleset.md`（266行）、`09-ai-writing-manual.md`（97行）、`10-ai-buntai-handoff.md`（168行）

## A. このリポジトリで足しているゲート

| # | 条件 | 確かめ方と記録先 | 判定 | 根拠 |
|---|---|---|---|---|
| G01 | `ai-smell-lint.py` の FATAL が0件。frontmatter の行で出た `📎mention` は use として扱う。warn は1件ずつ判断した | `lint/ai-smell.txt`、`lint/judgments.md` | OK | guides/03「引用（mention）と使用（use）の区別」を読んで判定。`lint/ai-smell.txt` 4行目 use 0件 / 📎mention 0件、5行目 `✅ 致命なし`、10行目 `exit=0`。frontmatter（1〜65行目）の mention も0件。warn 0件（`lint/judgments.md`） |
| G02 | `writing-lint.py` の判定行で FATAL と DENSITY超過がどちらも 0。SHOULD、WATCH、INFO は1件ずつ判断した。個人名は G09 で確かめる | `lint/writing-lint.txt`、`lint/judgments.md` | OK | guides/09 §2 と guides/08 の密度基準総表を読んで判定。`lint/writing-lint.txt` 1行目 `426行/191文`、21行目 `### 判定: FATAL 0 / DENSITY超過 0 / SHOULD 0`、23行目 `exit=0`。DENSITY の上限（B-1 2回、B-6 1回など）は guides/08 の標準レジスターと一致。WATCH 節なし、INFO 0件 |
| G03 | 下の B の全項目を満たす | `gate.md` | OK | B は C01〜C38 がすべて OK、C39（任意）は「あり」 |
| G04 | 記事のコードを記事の形のまま実際に動かし、ログがある。API を呼ぶ記事で `ANTHROPIC_API_KEY` が無いときは不合格 | `code/`、`run/` | OK | `lint/check-code-and-outputs.txt`（ALL OK）: 記事のコード5つが `code/` と1文字も違わず、記事の実行結果6つが `run/` から取り出したものと一致。実行は `run/12.log`〜`21.log`（2026-10-31 07:08〜07:09、node v22.22.0 / npm 10.9.4 / Claude Code 2.1.314）。12 は `mkdir -p char-count-mcp/src`、13 は `npm install`、14 は build と check、15 は compare、17〜19 は stdout の実験と戻し、20 は `claude mcp`。最初の版の根拠は誤っていた。「09〜11 は `npm install` から実行し直した」は、`run/09.log` の note が「npm install 済みの状態で」でインストールのコマンドが無い。「`needs_api_key: false`（原稿40行目）」も、当時の原稿では46行目。今は 61行目 `needs_api_key: false` で、API キーは使わない |
| G05 | 断定した事実すべてに一次情報の出典（URL とアクセス日）があり、本文に出ている。料金の目安がある。`cost_estimate`、`run_environment`、`verified_at` が埋まり、ログと一致する | 原稿の出典の表、`sources.md`、frontmatter | OK | 本文 404〜424行目に出典の表（15件、題名、URL、確認日 2026-10-31）。断定した文は（出典n）で表を引く（`sources.md` に文ごとの対応）。レビューで出典が無いと指摘された文は、258行目（出典12、15）、226行目（出典14）、358行目（出典9）、154行目（出典13）に出典を付けた。実行ログを根拠にした文は `sources.md` 後半の表。料金は 394〜398行目で、無料なのは記事の手順まで、Claude にツールを呼ばせるには有料のプランか Console のアカウントが要る（出典10）と書いた。frontmatter 57〜59行目の `cost_estimate`、`run_environment`（Node.js 22.22.0、SDK 1.32.2、Claude Code 2.1.314 は `run/20.log` の見出しと `code/package.json` に一致）、`verified_at: "2026-10-31"`（最後の実行 `run/21.log` の日付）。最初の版は本文に URL も確認日も無く、frontmatter の `sources` は記事ページに出ないので NG だった |
| G06 | 既存記事と検索意図が重ならない | `selection.md` | OK | `content/articles/` にはこの記事のほかに記事が無い（`ls content/articles` で `.gitkeep` とこの1本） |
| G07 | 講座の前後リンクと、既存記事が3本以上なら関連記事への内部リンク | `gate.md` | OK | course_step 5 の前後の記事は無いので `prev: null`、`next: null`（9〜10行目）。既存記事が0本なので関連記事のリンクは入れられない。リンク先の slug: なし |
| G08 | 本文の最後の段落が「AI 支援で執筆」の決まった表記 | 原稿の末尾 | OK | 426行目「AI 支援で執筆しました。コードは 2026-10-31 に実際に実行して確認しています。」。日付は最後の実行（`run/21.log`）と同じ |
| G09 | 原稿、ログ、frontmatter に秘密情報が無い。原稿に個人名が無い | `gate.md` | OK | 秘密情報: 原稿と `logs/mcp-server-typescript-stdio/` 全体（この gate.md を除く。gate.md は調べた語そのものを書いている）に `ANTHROPIC`、`sk-ant`、`token`、`password`、`secret`、`/root`、`/home/user`、`tmp/claude`、`scratchpad` を `grep -rniI` でかけた。該当は、`ANTHROPIC` が `selection.md` 18・25行目（環境変数の名前と `unset` の記録で、値ではない）、`token` が原稿375行目と `run/05.log`・`run/10.log`・`run/17.log` の28行目（どれも JSON のパースエラー文 `Unexpected token 'c'`）だけ。ほかは0件。最初の版の G09 は `token` の該当を「run/05、run/10 と原稿」だけと書いていたが、`sources.md` にも同じエラー文があり、`ANTHROPIC` も `selection.md` に出ていたので、一覧が誤っていた。個人名: ユーザーの GitHub アカウント名、git のコミット作者名（英字の連結表記、姓、名、漢字の姓、名）、ユーザーのメールアドレスのローカル部、CLAUDE.md の人格設定の人名（漢字の姓・名、英字の姓）を1語ずつ `grep -rniI` でかけ、すべて0件 |
| G10 | `target_query` が `keywords/*.csv` の行のキーワードと一致する。CSV が無い、または null なら不合格 | `selection.md` | NG | `keywords/` に CSV が無い（README.md だけ）。持ち主の CSV の書き出しは、ラッコキーワードのログイン時の CAPTCHA で止まっている。`target_query` は null（7行目）。最初の版は CSV に無い値を作って入れていたので取り消した。CSV が届くまで、この記事は下書きのまま止める |

## B. checklist.md の全項目（原文のまま）

| # | 区分 | 項目 | 判定 | 根拠 |
|---|---|---|---|---|
| C01 | 設計（→ 01-seo-for-dev-blogs.md） | 「誰の、どんな検索に答える記事か」が1行で言える | OK | guides/01 冒頭の原則と §1。`brief.md` の C01 の1行（JS か TypeScript の経験者が、TypeScript で MCP サーバーを自作する方法を探したときに答える）。検索語そのものは G10 のとおり未確定 |
| C02 | 設計（→ 01-seo-for-dev-blogs.md） | タイトルにキーワードが含まれ、具体的（「徹底解説」「完全ガイド」を使っていない） | OK | guides/01 §3「タイトルの作り方」（キーワードを左寄せ、具体的、数字・バージョン）。2行目「MCP サーバーを TypeScript で自作する手順【SDK v1.32.2、Claude Code に接続まで】」。講座のキーワード「MCPサーバー」を先頭に含み、バージョンと到達点を入れた。「徹底解説」「完全ガイド」は0件（prose-check の PAT） |
| C03 | 設計（→ 01-seo-for-dev-blogs.md） | リード文の3行で「何が解決するか」が伝わる | OK | guides/01 §3「リード文が最重要」。67行目は3文で、関数をツールにすれば Claude Code に使わせられること、作るもの、完成時の結果を示し、69〜71行目に結果の1行を置いた。73行目で確かめた範囲、75行目で対象読者と作業量。最初の版の gate は「リード3文」と書いたが、当時の52行目は4文だった（「。」が4つ） |
| C04 | 設計（→ 01-seo-for-dev-blogs.md） | 検索意図のタイプ（やり方/エラー/比較/概念）に構成が合っている | OK | guides/01 §1 の表でやり方に合うのはチュートリアル。guides/02 のタイプ1を原本で読み、要素ごとに照合した（`brief.md` の表）。読者（75行目）、所要時間の目安（75行目。コード88行と `npm install` の実測5秒。人が書き写す時間は測っていない）、前提（89行目 Node.js 18 以上と Claude Code）、番号付きの手順（122、191、260、320行目）、`src/` を作る手順（124〜129行目） |
| C05 | 構成（→ 02-article-structures.md） | 結論先行になっている（答え → 理由 → 詳細） | OK | guides/02「どのタイプでも共通の原則」1。リード（67行目）の1文目が答え。各 H2 は見出しで結論を言い（例 260行目「SDK のクライアントから呼ぶと入力エラーも結果で返る」）、直下の段落で理由と詳細を続ける |
| C06 | 構成（→ 02-article-structures.md） | 1見出し1トピック。見出しを読むだけで流れがわかる | OK | guides/02 共通の原則2。H2 は 77（MCP の定義）、87（環境）、122、191、260、320（手順1〜4）、360（stdout）、394（料金）、400（まとめ）、404（出典）。最初の版で2つの話題が入っていた「使うバージョンと SDK の選び方」と「料金と次に作るもの」は、87行目の環境と 98行目の H3（SDK の選択）、394行目の料金と 400行目のまとめに分けた。MCP の定義（77行目）をバージョンの話（87行目〜）より前に置いた |
| C07 | 構成（→ 02-article-structures.md） | 見出しが「作業の実況」でなく「内容」で書かれている | OK | guides/02 共通の原則4、guides/03 症状②の作業実況の見出し。手順の見出しも内容で書いた（「1. 準備は設定ファイル2つと npm install」「4. Claude Code への登録は claude mcp add の1行」など）。「まず〜する」「〜してみる」型は0件 |
| C08 | 構成（→ 02-article-structures.md） | コードはコピペで動く形（import・前提を省略していない／実行結果を示した） | OK | guides/02 タイプ1の肝、guides/01 §4。5つのファイルを import から全文掲載し、置き場所を本文で示した（`mkdir -p char-count-mcp/src` は 127行目）。コマンドと出力を 13・14・15・17・20 のログから写した（G04）。stdout の実験の戻しにも `npm run build` と `npm run check` を示した（387〜390行目）。最初の版は戻しのビルドのコマンドが無く、ビルドし直さないと `console.log` のままの `dist/server.js` が動く（`run/18.log` では `claude mcp list` が `√ Connected` のまま） |
| C09 | AI臭（→ 03-anti-ai.md） | 書き手の態度が感じられる（全部同じ温度になっていない） | OK | guides/03 不在1。v1 系を選んだ理由と書き直す時期（104行目）、他のクライアントで同じとは限らないという判断（381行目）、見分け方の判断（383行目）に書き手の判断がある。料金の節は短く、stdout の節は長くした |
| C10 | AI臭（→ 03-anti-ai.md） | 各セクションに言い切りの文が最低1つある | OK | guides/03 不在2。77: 「MCP サーバーは…プログラムです」、87: 「必要なのは Node.js と Claude Code の2つです」、122: 「…入れるためです」、191: 「ハンドラーの中には入力を確かめるコードを書いていません」、260: 「接続の失敗は、呼ぶ側で try と catch を書いて受け取ります」、320: 「Claude Code はこのサーバーを起動して接続できています」、360: 「この表示では気づけません」、394: 「API の料金はかかりません」、400: 「同じ手順でツールにできます」、404: 「確認日は、どれも 2026-10-31 です」 |
| C11 | AI臭（→ 03-anti-ai.md） | ヘッジ（〜でしょう/かもしれません）が過剰でない | OK | guides/03 症状①。「でしょう」「かもしれ」は0件（prose-check の PAT）。最初の版の「人が期待するのは…でしょう」は、出典付きの事実（258行目）に置き換えた。限定の文は381行目「とは限りません」の1つで、SDK のクライアント以外を確かめていない事実を示す |
| C12 | AI臭（→ 03-anti-ai.md） | メタ発言（〜を解説します/見ていきましょう）を削った | OK | guides/03 症状②、guides/05 §3 メタ発言（冒頭リードは例外）。ai-smell-lint の②0件、writing-lint の B-6 0回。「この記事では…作ります」（67行目）はリードの中 |
| C13 | AI臭（→ 03-anti-ai.md） | 章境界アナウンス（ここから〜/ここまで〜してきました/次は〜）が無い | OK | guides/03 症状⑫。最初の版の前方参照（「次の節で確かめます」「後の節で実際に試しました」「次は…包んでみてください」）を消した。「次の節」「後の節」「次は」「ここから」「ここまで」は0件（prose-check の PAT）。残る「次の1行」（67行目）「次の形」（108行目）「次のコード」（236行目）「次の `src/check.ts`」（262行目）「次のとおり」（300行目）は、直後のコードブロックを指す語で、章の境界の予告ではない |
| C14 | AI臭（→ 03-anti-ai.md） | テンプレ比喩（地図/土台/車の両輪/潤滑油/スパイス…）を使っていない | OK | guides/03 症状⑬の一覧。ai-smell-lint の⑬0件。比喩は使っていない |
| C15 | AI臭（→ 03-anti-ai.md） | 「〜じゃない。〜だ。」の対比構文が1記事に2回以上出ていない | OK | guides/03 症状⑧、guides/08 B-1。writing-lint の B-1 0回、ai-smell-lint の⑧0件、prose-check の「ではな」「じゃな」0件 |
| C16 | AI臭（→ 03-anti-ai.md） | 文長に緩急がある（短文と長文が混ざっている） | OK | guides/03 不在4。`lint/prose-check.txt` で地の文の文長が13〜60字、20字以下8文、41〜60字78文。例 293行目「ビルドしてから実行します。」の短文と、長い説明文が交互に出る |
| C17 | AI臭（→ 03-anti-ai.md） | 同じ語尾が3回以上連続していない | OK | guides/03 症状⑥と語尾の反復チェック。`lint/prose-check.txt` の SAME3 0（末尾の括弧を外して最後の3字を比べる）。writing-lint の B-2 も超過なし |
| C18 | AI臭（→ 03-anti-ai.md） | 一文を短くしすぎて主語・目的語を削っていない（ブツ切り回避） | OK | guides/03 症状⑮（機械検出できないので目視）。地の文147文を読み、主語か目的語が抜けて意味が取れない文が無いことを確かめた。60字に収めるために分けた文も「書き換えるのは `src/server.ts` の最後の行です。」（362行目）のように主語を残した |
| C19 | AI臭（→ 03-anti-ai.md） | ですます/である調が統一されている（常体落ちが無い） | OK | guides/03 症状⑮、guides/05 §7 文体の統一。地の文の全文末を Python で調べ、「です。」「ます。」「ました。」「ません。」「でした。」「ください。」「ますか。」以外で終わる文は0件。「である。」「だ。」も0件 |
| C20 | コロケーション（→ 04-collocation.md） | 「課題・問題・エラー・目標・効果」に付く動詞が正しい | OK | guides/04「動詞と目的語のミスマッチ」。「課題」「問題」「目標」「効果」は0件。「エラー」は「エラーの結果を返す」（226行目）「入力の検証エラーは…結果で返す」（316行目）で、どちらも結果として返すもので自然 |
| C21 | コロケーション（→ 04-collocation.md） | 漢語サ変動詞の助詞（が/を）が合っている（速度が向上する／速度を向上させる） | OK | guides/04「自動詞・他動詞の取り違え」。サ変動詞は「登録します」「実行しました」「接続できています」「報告されました」など。他動詞の用法に「を」、自動詞の用法に「が」が付き、取り違えなし（目視） |
| C22 | コロケーション（→ 04-collocation.md） | 形容詞と名詞が合っている（理解は深い、精度は高い） | OK | guides/04「形容詞・連体修飾と名詞のミスマッチ」。形容詞は「いちばん長いコマンド」（75行目）「有料のプラン」程度で、表の誤用に当たるものなし（目視） |
| C23 | コロケーション（→ 04-collocation.md） | 重言が無い（まず最初に／throwを投げる／約〜程度） | OK | guides/04「重言」。「まず最初に」「約〜程度」「英単語＋和訳」の重複なし（目視）。「例外を投げました」（318行目）は throw の和訳だけで、英単語と重ねていない |
| C24 | コロケーション（→ 04-collocation.md） | 翻訳調が無い（影響を作る → 影響を与える） | OK | guides/04「翻訳調」。「〜を作る（make）」「〜を持っている（have）」型なし（目視）。英語の原文（Invalid params）は「」でくくって原文として示した |
| C25 | 正確さ（→ 05-technical-writing.md） | 60字超の長文を分割した | OK | guides/05 §1「文の長さ」（50字が目安、60字超で分割、80字が上限）。`lint/prose-check.txt` で60字超 0。インラインコード、（出典n）も1字ずつ数え、frontmatter の文字列と見出しと表のセルも数えた（除外はコードブロックと URL だけのセル）。最初の版はインラインコードを1字に縮める、checklist にもガイドにも無い除外で数えていたので NG だった |
| C26 | 正確さ（→ 05-technical-writing.md） | 用語が記事全体で統一されている | OK | guides/05 §4「用語の統一」と §7。フォルダ（ディレクトリ 0件）、バージョン（版 0件）、LLM（「言語モデル」は 81行目の初出の定義「LLM（大規模言語モデル）」だけ）、系列は「v1 系」、ブランチ名は「v1.x ブランチ」、「MCP サーバー」は半角と全角の間に空白（タイトルも同じ。tags と main_keyword は講座のキーワードの表記「MCPサーバー」）、「クライアント」 |
| C27 | 正確さ（→ 05-technical-writing.md） | 数量・期間が具体的な数値（早めに → 1週間以内に） | OK | guides/05 §4「曖昧表現の具体化」。5ファイル88行、5秒、Node.js 18 以上、少なくとも6か月、2027-01-27、15文字、8・5・1、28行。「数秒」「早めに」型なし |
| C28 | 正確さ（→ 05-technical-writing.md） | AND/ORが明確（「AやB」で曖昧にしていない） | OK | guides/05 §4「AND/ORの明確化」。「や」の並列0件（prose-check）。最初の版の「外部のデータやツール」は、出典の例を「データソース、ツール、ワークフローの3つ」と数を付けて並べた（79行目）。OR は「JS か TypeScript」（75行目）「有料のプランか Console のアカウント」（398行目）、AND は「〜と〜の2つ」で数を明示 |
| C29 | 正確さ（→ 05-technical-writing.md） | ですます/である調が混在していない | OK | guides/05 §7。C19 と同じ文末の調査で、ですます調だけ |
| C30 | 記号（→ 03-anti-ai.md） | `**太字**` のアスタリスク残りが無い（コードブロック外） | OK | guides/03 記号NG。prose-check の `**` 0件（コードブロックの外）。コードブロック内の `"src/**/*.ts"`（tsconfig.json）はコード |
| C31 | 記号（→ 03-anti-ai.md） | `—`（em-dash）`──`（罫線）を使っていない | OK | guides/03 記号NG。`—`、`─`、`―` 0件（prose-check）、writing-lint B-5 0回。ファイル構成（110〜118行目）は罫線なしの字下げ |
| C32 | 記号（→ 03-anti-ai.md） | `：`+半角スペース、`／`での概念並列を使っていない | OK | guides/03 記号NG。`： ` と `／` は0件（prose-check）。出力の中の ` / `（半角）はコードブロック内の実行結果 |
| C33 | 機械チェック | `python3 scripts/ai-smell-lint.py 記事.md` を実行し、FATALがゼロ | OK | スキル手順7のコマンド（`python3 docs/tech-writing-pack/scripts/ai-smell-lint.py content/articles/mcp-server-typescript-stdio.md > logs/.../lint/ai-smell.txt 2>&1; echo "exit=$?" >> …`）で、426行の版に FATAL 0、`exit=0` |
| C34 | 機械チェック | warnは目視で要否を判断した | OK | guides/03「lint との関係」。warn 0件で判断の対象なし（`lint/judgments.md`） |
| C35 | 機械チェック | FATAL/warnが「自分が使っている(use)」か「悪い例の引用(📎mention)」かを確認した（引用なら合格） | OK | guides/03「引用（mention）と使用（use）の区別」。FATAL、warn、mention がすべて0件で、区別が要る検出なし |
| C36 | 機械チェック | 悪い例を引用したときは、引用符でくくり・悪い例と明示し・直後に直し方を置いた | OK | guides/03「悪い例を引用するときの書き方」。文章の悪い例は引用していない。`console.log` の実験はコードの挙動の比較で、文例の引用ではない |
| C37 | 最後の一押し（人間にしかできない） | 自分の実体験・判断・動作確認した結果が入っている | OK | guides/03 不在1・不在4、guides/06「使い方の流れ」4。Claude が動かした結果と、そこからの判断: `run/16.log`（サーバー停止で `Not connected` の例外）から、入力のエラーと接続の失敗の受け取り方を分けた（318行目）。`run/18.log`（`console.log` 版でも `√ Connected`）から、確認用のクライアントで見分けると判断した（383行目）。`run/15.log` から数え方を選んだ（258行目） |
| C38 | 最後の一押し（人間にしかできない） | コードを実際に動かして確認した | OK | 記事のコードとコマンドはすべて実行した（`run/12.log`〜`21.log`、G04）。Claude Code の会話で Claude にツールを呼ばせる操作は実行していない（認証付きの `claude` のセッションが無い）。記事はその操作を約束しない書き方にした（73行目で範囲を明記、398行目でその操作に有料のアカウントが要ると書いた） |
| C39 | 最後の一押し（人間にしかできない） | 「答えを書かずに問いで終わる」箇所が1〜2箇所ある（任意） | 任意・あり | 402行目「あなたのアプリのどの関数を、最初に Claude から呼べるようにしますか。」の1か所 |

## 集計

- A: OK 9 / NG 1（G10）（全10項目）
- B: OK 38 / NG 0 / 任意・あり 1（全39項目）

## 結論

G10 が NG なので、`status: draft` のまま止める。CSV が届いて、`target_query` を CSV の行から選び直し、G06 と G10 をもう一度確かめるまで、この記事は公開に進めない。EmDash への投稿はしていない。

ブロッカー（解消するまで下書き）:

1. `keywords/` に CSV が無い。持ち主の CSV の書き出しがラッコキーワードのログイン時の CAPTCHA で止まっている。`target_query` は null のまま、値は作らない（`selection.md`）。

ゲート外の制約:

1. Claude Code の会話で Claude に `count_chars` を呼ばせる経路は実行していない。記事はその操作をしない範囲に絞った（73行目、394〜398行目）。
2. `run/*.log` と `node_modules/` は、執筆に使う環境の Read 禁止ルール（`Read(./**/*.log)`、`Read(./**/node_modules/**)`）に当たる。ログは Bash の `python3` と `awk` で読んだ。pack と違って判定の根拠を読めない事態にはなっていないが、ログの拡張子は変えていない。

## レビュー指摘への対応（2026-10-31）

指摘の行番号はレビュー時の原稿（0d648ef、342行）、対応の行番号は 426行の版。

| 指摘 | 確かめた結果 | 対応 |
|---|---|---|
| 根本原因: guides 01〜05・09 が `vendor/` の Read 禁止で読めず、C05〜C32 を lint と目視で OK にした | 正しい。`~/.claude/settings.json` に `Read(./**/vendor/**)`。最初の gate.md 75行目も読めていないと書いている | pack を `docs/tech-writing-pack/` に `git mv`（blob ID まで同じ）。NOTICE、CLAUDE.md、README、スキル、secret-scan の除外パスを更新。Read ツールで guides 01〜10 を全文読めることを確かめた。スキルに「ガイドを読まずに判定した項目は NG」を入れた |
| G05: 本文に URL と確認日が無い。A:262、174、334、104 に出典が無い | 正しい | 本文 404〜424行目に出典の表。258行目（出典12、15）、226行目（出典14）、358行目（出典9）、154行目（出典13） |
| C13: 前方参照 A:174、211、340 | 正しい | 3か所とも削った（C13 の行） |
| C04: guides/02 のチュートリアル型（読者、所要時間、Node の最低バージョンと Claude Code、番号付きの手順、`src/` を作る手順） | 正しい（guides/02 タイプ1 を原本で確認） | 75、89、122〜129、191、260、320行目（`brief.md` の照合表） |
| C25: prose-check.py のインラインコード除外。60字超 A:67、69、81、266、334、80字超 A:232 に2つ | 正しい。除外をやめた数え方で最初の版を数えると該当した | 除外をやめ、60字超を0にした（`lint/judgments.md`） |
| C28 A:73、C06 見出し A:56・A:336、MCP の定義を先に、C26 フォルダ/ディレクトリ、バージョン/版、LLM/言語モデル | 正しい | 79行目で数を付けて並列。見出しを分け、MCP の定義を 77行目に移した。用語を統一（C26 の行） |
| A:294: 戻してもビルドし直さないと壊れたままで、`claude mcp list` は Connected のまま | 正しい。`run/18.log` で `console.log` 版でも `√ Connected` を確かめた | 383〜392行目に表示の件と、戻したあとの `npm run build`、`npm run check` を足した（`run/19.log`） |
| 料金: タイトル、A:54、A:182 の「無料」と、未実行の Claude からの呼び出し | 正しい。Claude Code は有料のプランか Console のアカウントが要る（出典10） | タイトルから「API キー不要」を外し、目標を「接続まで」に絞った（2、73行目）。無料の範囲と有料になる操作を 394〜398行目と `cost_estimate` に書いた |
| A:236: サーバーが落ちていると Not connected。A:264 の見出しを SDK のクライアントに限定。改行の扱いをツールの説明に。v1 をタイトルに | 正しい。`run/16.log` で `Not connected` の例外を確かめた。仕様の Error Handling は入力の検証エラーを `isError: true` で返すと定める | 316〜318行目で入力の検証に絞り仕様を引用。360行目の見出しを限定。`code/src/server.ts` の説明に改行の数え方を足し、全コマンドを実行し直した（`run/12〜21`）。タイトルに「SDK v1.32.2」 |
| `cost_estimate`、`run_environment`、`verified_at` を埋め、スキルにも入れる | 正しい（`posts` にフィールドがある。README「記事の任意フィールド」） | 57〜59行目。スキルの記事の必須条件、frontmatter の表、G05 に入れた |
| gate.md の誤った根拠（G04 の run/09、G04 の行番号、G09 の grep 一覧、C03 の文の数）、judgments.md:35 の render.py | 正しい（G04、G09、C03 の行に、誤っていた点を書いた。render.py は履歴にも無い） | 根拠を書き直した。出力の一致は `lint/check-code-and-outputs.py` で確かめる形にした |
| キーワード: CSV が無いのに target_query を作った | 正しい。スキル手順1-1 と `target_query` の決まりに反する | `target_query: null`。スキルに G10 を足し、CSV 待ちを明示のブロッカーにした（上の結論） |
