# gate: mcp-server-typescript-stdio

判定日: 2026-10-31（レビュー指摘を受けた再判定も同日）。原稿: `content/articles/mcp-server-typescript-stdio.md`（342行）。

## A. このリポジトリで足しているゲート

| # | 条件 | 確かめ方と記録先 | 判定 | 根拠 |
|---|---|---|---|---|
| G01 | `ai-smell-lint.py` の FATAL が0件。frontmatter の行（`title`、`description`、`sources` の `title`）で出た `📎mention` は use として扱い、FATAL に当たる種類なら不合格（手順7の「frontmatter の扱い」）。warn は1件ずつ判断し、use か mention かを記録した | `lint/ai-smell.txt`、`lint/judgments.md` | OK | `lint/ai-smell.txt` 4行目 集計 use 0件 / 📎mention 0件、5行目 判定 `✅ 致命なし`、10行目 `exit=0`。frontmatter（原稿1-50行目）で出た mention も0件（mention 自体が0件）。warn 0件で判断対象なし（`lint/judgments.md`） |
| G02 | `writing-lint.py` の判定行が `### 判定: FATAL 0 / DENSITY超過 0 / SHOULD n` の形で、FATAL と DENSITY超過がどちらも 0。SHOULD、WATCH（出たときだけ）、INFO(要人間確認) は1件ずつ判断を記録した。この FATAL 0 では個人名を検出できない（`PERSONAL_NAMES` が空）ので、個人名は G09 で確かめる | `lint/writing-lint.txt`、`lint/judgments.md` | OK | `lint/writing-lint.txt` 21行目 `### 判定: FATAL 0 / DENSITY超過 0 / SHOULD 0`、23行目 `exit=0`。WATCH 節なし、INFO 0件（`lint/judgments.md`）。個人名は G09 で確認 |
| G03 | 下の B の全項目を満たす | `gate.md` | NG | B のうち C04 が NG（下表）。理由は guides/02 を権限設定で読めず、記事型テンプレートとの照合ができないため |
| G04 | 記事のコードを記事の形のまま実際に動かし、ログがある。API を呼ぶ記事で `ANTHROPIC_API_KEY` が無いときは不合格 | `code/`、`run/` | OK | `code/` の5ファイルが原稿のコードブロックと完全一致（Python で原稿のフェンス内文字列と比較し全て True を確認）。`run/01.log`〜`11.log` に日時、コマンド、node v22.22.0 / npm 10.9.4、終了コード、出力。09〜11 は再確認で、`code/` を作業フォルダにコピーして `npm install` から記事どおりに実行し直したもの（09: build・check・compare、10: console.log にして build と check、11: console.error に戻して build と check）。記事の実行結果のブロックは 09・10 の出力と一致（Python で照合）。`needs_api_key: false`（原稿40行目）で ANTHROPIC_API_KEY は不要 |
| G05 | 断定した事実すべてに一次情報の出典（URL とアクセス日）がある。料金の目安がある（API を呼ぶ記事は出典付きの金額、呼ばない記事は料金がかからないこと） | `sources.md`、frontmatter `sources` | OK | 断定ごとの出典は `sources.md` の表（11件、URL とアクセス日 2026-10-31）。frontmatter `sources` も同じ11件（原稿11-44行目）。実行で確かめた断定は `sources.md` 後半の表で run ログに対応付け。料金は原稿54行目と338行目「API の料金はかかりません」 |
| G06 | 既存記事と検索意図が重ならない | `selection.md` | OK | `selection.md`。`content/articles/` に既存記事0本で重なりなし。ただし CSV が無く、target_query は CSV の行ではない（ゲート外の逸脱として報告） |
| G07 | 講座の前後リンク（`prev`、`next` のうち存在するもの）と、既存記事が3本以上なら関連記事への内部リンクが本文にある。リンク先は公開済みか先に予約済み | `gate.md` にリンク先の slug を列挙 | OK | course_step 5 の前後の記事は存在しない（既存記事0本）ので `prev: null`、`next: null`。既存記事が3本未満（0本）のため関連記事への内部リンクは入れられない。リンク先の slug: なし |
| G08 | 本文の最後の段落が「AI 支援で執筆」を含む決まった表記になっている | 原稿の末尾 | OK | 原稿342行目（最終行）「AI 支援で執筆しました。コードは 2026-10-31 に実際に実行して確認しています。」。2026-10-31 は最後の実行日（`run/11.log` の date） |
| G09 | 原稿、ログ、frontmatter に秘密情報（API キー、トークン、パスワード）が無い。原稿に個人名（ユーザーや関係者の名前）が無い | `gate.md` に確かめ方を書く。個人名は手順7のとおり `grep -n` で0件を確かめる | OK | 秘密情報: 原稿と `logs/mcp-server-typescript-stdio/` 全体に `ANTHROPIC`、`sk-ant`、`token`、`password` を `grep -rn -i` して、該当は `run/05.log`、`run/10.log` と原稿284行目の `Unexpected token 'c'`（JSON のパースエラー文）だけで秘密ではない。`run/07.log` は使い捨ての HOME で実行し、絶対パスを置き換え済み。個人名: ユーザーの GitHub アカウント名、git のコミット作者名（英字表記と漢字表記の姓・名それぞれ）、ユーザーのメールアドレスのローカル部、CLAUDE.md の人格設定の人名（姓・名）を1語ずつ `grep -rn -i` で原稿と logs にかけ、全て0件。ローカルの絶対パス（`/root`、`/home/user`、`tmp/claude`）も0件 |

## B. checklist.md の全項目（原文のまま）

| # | 区分 | 項目 | 判定 | 根拠 |
|---|---|---|---|---|
| C01 | 設計（→ 01-seo-for-dev-blogs.md） | 「誰の、どんな検索に答える記事か」が1行で言える | OK | `brief.md` の C01 の1行 |
| C02 | 設計（→ 01-seo-for-dev-blogs.md） | タイトルにキーワードが含まれ、具体的（「徹底解説」「完全ガイド」を使っていない） | OK | 原稿2行目 title「MCPサーバーを TypeScript で自作する手順【API キー不要、stdio で動く最小構成】」。キーワード「MCPサーバー」を先頭に含み、「徹底解説」「完全ガイド」なし |
| C03 | 設計（→ 01-seo-for-dev-blogs.md） | リード文の3行で「何が解決するか」が伝わる | OK | 原稿52行目のリード3文で、作るもの（文字数ツールの MCP サーバー）、API キーなしで確かめる、Claude Code への登録と接続まで確かめた範囲、が伝わる。54行目で料金がかからないこと |
| C04 | 設計（→ 01-seo-for-dev-blogs.md） | 検索意図のタイプ（やり方/エラー/比較/概念）に構成が合っている | NG | 検索意図は「やり方」、型はチュートリアル（`brief.md`）。ただし guides/02-article-structures.md が `~/.claude/settings.json` の deny `Read(./**/vendor/**)` で読めず、チュートリアル型テンプレートの見出し骨格と照合できていない。スキル手順3の「テンプレートの見出し骨格を brief.md に写す」も未実施のため、合っていると判定できない |
| C05 | 構成（→ 02-article-structures.md） | 結論先行になっている（答え → 理由 → 詳細） | OK | リード（52-54行目）で答え（処理をツールにした MCP サーバーを書いて登録する、作るもの、料金なし）を先に置き、各節も見出しで結論を示す（例 264行目「stdout に書いた起動ログはクライアントに捨てられる」） |
| C06 | 構成（→ 02-article-structures.md） | 1見出し1トピック。見出しを読むだけで流れがわかる | OK | H2 は9本（56, 71, 79, 139, 180, 238, 264, 296, 336行目）で、版の選択、作るもの（MCP とツールの説明を含む）、準備、本体、確認、文字数の数え方、stdout、登録、料金の順に1トピックずつ。stdout の H2 は観察どおり「捨てられるのは起動ログの行」と書き、MCP のメッセージが失われるとは読めない形に直した |
| C07 | 構成（→ 02-article-structures.md） | 見出しが「作業の実況」でなく「内容」で書かれている | OK | 見出しはすべて内容で書いている（「サーバー本体は28行に収まる」「文字数は Intl.Segmenter で数える」など）。「〜してみる」「〜を見ていく」型の実況なし |
| C08 | 構成（→ 02-article-structures.md） | コードはコピペで動く形（import・前提を省略していない／実行結果を示した） | OK | package.json、tsconfig.json、server.ts、check.ts、compare.mjs を import 込みで全文掲載し、どれもファイル名と置き場所を本文で示した（compare.mjs は240行目「作業フォルダ `char-count-mcp` に `compare.mjs` という名前で保存します」）。コマンド（npm install、npm run build、npm run check、node compare.mjs、claude mcp add）と、その実行結果を `run/01,07,09,10.log` から写して掲載。stdout の節（268-271行目）も実行したコマンド `npm run build` と `npm run check` を示し、出力は `run/10.log` の2コマンド分をそのまま写した |
| C09 | AI臭（→ 03-anti-ai.md） | 書き手の態度が感じられる（全部同じ温度になっていない） | OK | v1.32.2 を選んだ理由と書き直す時期（69行目）、stdout の実験から「平気だと考えるのは危険です」と判断（292行目）など、書き手の判断を入れた節がある |
| C10 | AI臭（→ 03-anti-ai.md） | 各セクションに言い切りの文が最低1つある | OK | 各 H2 節に言い切りがある。例 58行目「1.32.2 を使います」、75行目「ツール1つだけです」、174行目「コードは要りません」、262行目「区切ります」、292行目「危険です」、338行目「かかりません」 |
| C11 | AI臭（→ 03-anti-ai.md） | ヘッジ（〜でしょう/かもしれません）が過剰でない | OK | ヘッジは「でしょう」1回（262行目）と「とされています」1回（67行目、出典の記述を伝える文）だけ。`grep -c 'でしょう\|かもしれ'` の結果 1 |
| C12 | AI臭（→ 03-anti-ai.md） | メタ発言（〜を解説します/見ていきましょう）を削った | OK | ai-smell-lint のメタ発言（②）検出0件、writing-lint の B-6 メタ談話予告 0回 |
| C13 | AI臭（→ 03-anti-ai.md） | 章境界アナウンス（ここから〜/ここまで〜してきました/次は〜）が無い | OK | ai-smell-lint の⑫章境界アナウンス検出0件、writing-lint SHOULD（章境界）0件 |
| C14 | AI臭（→ 03-anti-ai.md） | テンプレ比喩（地図/土台/車の両輪/潤滑油/スパイス…）を使っていない | OK | ai-smell-lint の⑬テンプレ比喩検出0件。比喩は使っていない |
| C15 | AI臭（→ 03-anti-ai.md） | 「〜じゃない。〜だ。」の対比構文が1記事に2回以上出ていない | OK | writing-lint B-1 対比構文 0回、ai-smell-lint ⑧ 0件。`grep -n 'ではな\|のではなく\|じゃない'` も0件 |
| C16 | AI臭（→ 03-anti-ai.md） | 文長に緩急がある（短文と長文が混ざっている） | OK | 短文（例 213行目「ビルドして実行します。」）と、理由を含む長めの文（55-60字前後）が混在。`lint/prose-check.txt` で100文、60字超0 |
| C17 | AI臭（→ 03-anti-ai.md） | 同じ語尾が3回以上連続していない | OK | `lint/prose-check.txt` で末尾3文字が同じ文の3連続（SAME3）0件。writing-lint B-2 三連反復 0（最初の超過は修正済み、`judgments.md`） |
| C18 | AI臭（→ 03-anti-ai.md） | 一文を短くしすぎて主語・目的語を削っていない（ブツ切り回避） | OK | 全100文を目視で読み、主語や目的語を落とした文がないことを確認（例 264-292行目は「起動ログの行は」「1.32.2 のクライアントは」と主語を明示） |
| C19 | AI臭（→ 03-anti-ai.md） | ですます/である調が統一されている（常体落ちが無い） | OK | 本文はすべてですます調。`grep` で「である。」「だ。」を地の文から探し0件（`prose-check.txt` の PAT 検出に出ていない） |
| C20 | コロケーション（→ 04-collocation.md） | 「課題・問題・エラー・目標・効果」に付く動詞が正しい | OK | 「エラー」は「エラーとして報告されました」「このエラーは画面に何も出ません」で使用。「課題・問題・目標・効果」は不使用。ai-smell-lint の CO（コロケーション崩れ候補）0件 |
| C21 | コロケーション（→ 04-collocation.md） | 漢語サ変動詞の助詞（が/を）が合っている（速度が向上する／速度を向上させる） | OK | サ変動詞は「実行しました」「確認しています」「登録します」「報告されました」など、が/を の取り違えなしを目視で確認 |
| C22 | コロケーション（→ 04-collocation.md） | 形容詞と名詞が合っている（理解は深い、精度は高い） | OK | 形容詞と名詞の組み合わせは「新しい系列」「使い捨てのディレクトリ」程度で崩れなし（目視） |
| C23 | コロケーション（→ 04-collocation.md） | 重言が無い（まず最初に／throwを投げる／約〜程度） | OK | 「まず最初に」「約〜程度」などの重言なし（目視、ai-smell-lint 0件） |
| C24 | コロケーション（→ 04-collocation.md） | 翻訳調が無い（影響を作る → 影響を与える） | OK | 翻訳調の言い回しなし（目視）。英語の引用（Invalid params）は「」でくくって原文として示した |
| C25 | 正確さ（→ 05-technical-writing.md） | 60字超の長文を分割した | OK | `lint/prose-check.txt` で 60字超の文 0（インラインコードを1字に数えた長さ）。最初の版の15文を分割済み（`judgments.md`） |
| C26 | 正確さ（→ 05-technical-writing.md） | 用語が記事全体で統一されている | OK | 用語を統一: 「MCP サーバー」（タイトルと tags はキーワード表記「MCPサーバー」）、「ツール」、「クライアント」、「stdout」「stderr」、「SDK」 |
| C27 | 正確さ（→ 05-technical-writing.md） | 数量・期間が具体的な数値（早めに → 1週間以内に） | OK | 数値は具体: SDK 1.32.2、Node.js 22.22.0、2026-07-27、少なくとも6か月、2027-01-27、15文字、8・5・1、28行 |
| C28 | 正確さ（→ 05-technical-writing.md） | AND/ORが明確（「AやB」で曖昧にしていない） | OK | 並列は「文字数、行数、UTF-8 のバイト数」のように読点で全列挙し、「AやB」の曖昧な並列なし（目視） |
| C29 | 正確さ（→ 05-technical-writing.md） | ですます/である調が混在していない | OK | C19 と同じ根拠。ですます調のみ |
| C30 | 記号（→ 03-anti-ai.md） | `**太字**` のアスタリスク残りが無い（コードブロック外） | OK | `prose-check.txt` の `**` 検出は118行目の `"src/**/*.ts"`（コードブロック内）だけ。コードブロック外の太字なし |
| C31 | 記号（→ 03-anti-ai.md） | `—`（em-dash）`──`（罫線）を使っていない | OK | `—`、`─`、`―` の検出0件（`prose-check.txt`）。writing-lint B-5 ダッシュ 0回 |
| C32 | 記号（→ 03-anti-ai.md） | `：`+半角スペース、`／`での概念並列を使っていない | OK | `： `（全角コロン+空白）と `／` の検出0件（`prose-check.txt`） |
| C33 | 機械チェック | `python3 scripts/ai-smell-lint.py 記事.md` を実行し、FATALがゼロ | OK | 手順7のコマンド `python3 -I vendor/tech-writing-pack/scripts/ai-smell-lint.py content/articles/mcp-server-typescript-stdio.md` で FATAL 0、`exit=0`（`lint/ai-smell.txt`） |
| C34 | 機械チェック | warnは目視で要否を判断した | OK | warn 0件。判断対象がないことを `lint/judgments.md` に記録 |
| C35 | 機械チェック | FATAL/warnが「自分が使っている(use)」か「悪い例の引用(📎mention)」かを確認した（引用なら合格） | OK | FATAL/warn/mention すべて0件で、use と mention の区別が必要な検出なし（`lint/judgments.md`） |
| C36 | 機械チェック | 悪い例を引用したときは、引用符でくくり・悪い例と明示し・直後に直し方を置いた | OK | 文章の悪い例は引用していない（該当なし）。console.log の実験はコードの挙動の比較で、悪い文例の引用ではない |
| C37 | 最後の一押し（人間にしかできない） | 自分の実体験・判断・動作確認した結果が入っている | OK | Claude が実際に動かした結果と判断: `run/05.log`（console.log にすると `client error:` が出るが呼び出しは成功）と `run/08.log`（onerror なしだと何も出ない）から、「平気だと考えるのは危険、確認用クライアントに onerror を付ける」と判断（原稿292行目）。`run/04.log` から text.length を使わない判断（262行目）。v1 を選んだ判断（69行目） |
| C38 | 最後の一押し（人間にしかできない） | コードを実際に動かして確認した | OK | 記事に載せたコードとコマンドはすべて実行した（`run/01.log`〜`11.log`。インストール、ビルド、実行、Claude Code への登録と `√ Connected` の接続確認）。C38 の対象は「コード」なのでこの判定は OK とする。ただし、Claude Code のセッションで Claude が count_chars を選んで呼ぶ経路は実行していない（このセッションでは `claude` を API キーも OAuth トークンも無い状態でしか起動できず、認証付きのセッションを作れなかった）。そこで本文の主張をこの範囲に合わせた。リード52行目は「Claude Code への登録と接続まで確かめました」、75行目は Claude が使える状態を「目指しました」と書き、334行目で未実行と明記。読者が最後に得たい「Claude が実際に呼ぶ」ことの証拠は無い、という制約はゲート外の3に残す |
| C39 | 最後の一押し（人間にしかできない） | 「答えを書かずに問いで終わる」箇所が1〜2箇所ある（任意） | 任意・あり | 原稿340行目「あなたのアプリのどの関数を、最初に Claude から呼べるようにしますか。」の1か所 |

## 集計

- A: OK 8 / NG 1（全9項目）
- B: OK 37 / NG 1 / 任意・あり 1（全39項目）

## 結論

G03（C04）が NG のため `status: draft` で止める。EmDash への投稿はしない（本番の MCP も未接続）。

## ゲート外で報告する逸脱と制約

1. `keywords/` に CSV が無い。スキル手順1-1 は「CSV 待ち」で止める定めだが、ワークフローの指示で講座の順番とキー不要の条件だけで選んだ。`target_query` は CSV の行ではない仮の値（`selection.md`）。
2. `vendor/tech-writing-pack/` 配下（checklist.md、guides/01・02・09・03・04・05、NOTICE.md）は `~/.claude/settings.json` の deny `Read(./**/vendor/**)` で読めなかった。lint スクリプトの実行はできた。checklist の項目はスキル本文に写された原文を使った。文体はスキル手順5の要約と lint に頼っており、guides 本文との照合は未実施。
3. Claude Code の中で Claude にツールを選ばせて呼ぶ経路は実行していない（本文334行目に明記）。認証付きの `claude` セッションを用意できる環境で、count_chars が呼ばれるログを `run/` に足すまでは、読者の最終目的（Claude が実際に呼ぶ）の動作確認は無いまま。リードと75行目はこの範囲を超える約束をしない書き方に直した。

## レビュー指摘への対応（2026-10-31 再判定）

| 指摘 | 判断 | 対応 |
|---|---|---|
| compare.mjs のファイル名と置き場所が本文に無い（C08） | 正しい | 240行目で保存先とファイル名を示し、実行コマンドの前に「Node.js でそのまま実行します。」を足した |
| stdout の H2「メッセージが1行捨てられる」が観察と違う（C06） | 正しい | 264行目を「stdout に書いた起動ログはクライアントに捨てられる」に直した。捨てられたのは起動ログの行だけで、MCP のメッセージはすべて届いた（`run/10.log`） |
| リードと75行目の約束（Claude が呼ぶ）に証拠が無い（C38） | 正しい（実行はできず） | 上の C38 のとおり、主張を確かめた範囲に合わせて書き直した。実行は環境の制約で未実施 |
| stdout の節の出力に grep の行があり、コマンドが示されていない | 正しい | grep の行を含まない `run/10.log` を取り直し、`npm run build` と `npm run check` のコマンドを本文に示した |
| 「1行目の char-count MCP server started」が実際は4行目 | 正しい | 232行目を「npm が出す2行と空行のあとにある」に直した |
| v1.x が 2026-07-28 版の仕様に対応しないことを書いていない | 正しい | 67行目に README の該当文（v1.x では対応しない予定、v2 が対応）を足した。出典は `sources.md` #1 |
| 「クライアントは文字列の結果として受け取れます」の出典が docs/server.md では言えていない | 正しい | 出典に頼る文をやめ、「v1.x の docs/server.md の例と同じ形」「次の節の実行結果のとおり、クライアントにはこの文字列がそのまま届きます」（`run/09.log`）に直した |
| MCP、MCP サーバー、ツールの説明が無い | 正しい | 73行目に MCP の公式サイトと仕様 2025-11-25 の Tools を出典にした説明を足した（`sources.md` #10、#11） |
