---
name: write-article
description: ブログ記事を1本、キーワード選びから EmDash への予約公開まで通して書くときに使う。keywords/*.csv から1語を選び、vendor/tech-writing-pack の guides と checklist.md に従って content/articles/<slug>.md と logs/<slug>/ を作り、公開前ゲートをすべて通ったものだけを MCP で予約公開する。公開済み記事を直すとき、取り下げるときもこのスキルを使う。
---

# write-article（記事を1本書いて公開する）

1回の実行で書く記事は1本だけです。途中のどこかで公開前ゲートに落ちたら、その記事は下書きのまま止めて、落ちた項目と理由を報告します。ゲートを緩めて先に進めることはしません。

書き方のルールの正本は `vendor/tech-writing-pack/`（CC BY 4.0、出典は `vendor/NOTICE.md`）です。このスキルは pack の手順をこのリポジトリでどう回すかだけを決めていて、pack の内容を言い換えたり緩めたりはしません。迷ったら pack の原文を読みます。

## 役割分担

| 担当 | やること | やらないこと |
|---|---|---|
| 執筆するエージェント（サブエージェントでもよい） | 手順1〜9。`content/articles/<slug>.md` と `logs/<slug>/` を書くところまで | EmDash への投稿、git のコミット |
| メインエージェント | 手順10〜11。ゲート結果を読み直してから MCP で予約公開し、記録を残す。コミットもここでまとめて行う | ゲートに落ちた記事の公開 |

原稿をリポジトリに置く理由は3つあります。サブエージェントが EmDash のコネクタを使えなくても執筆は止まりません。D1 が壊れても原稿から戻せます。何をどう書いたかを git の履歴で追えます。公開されている状態の正は EmDash、原稿と経緯の正はリポジトリです。

## 前提（読む順）

1. `vendor/tech-writing-pack/checklist.md`（公開前ゲートの本体。下の表に全項目を写してある）
2. `vendor/tech-writing-pack/guides/01-seo-for-dev-blogs.md`、`02-article-structures.md`、`09-ai-writing-manual.md`
3. 書いている途中で `03-anti-ai.md`、`04-collocation.md`、`05-technical-writing.md` を引く
4. `keywords/README.md`（CSV の置き場所と列）

### 読者

AI 組み込み開発、つまり「自分のアプリに LLM を組み込む開発」を学びたい人です。組み込みシステム（エッジ AI）の話は扱いません。

- メイン読者は、JS/TS か Python で何か作ったことはあるが、LLM の API はまだ触っていないか、チャットを1回作った程度の人です。英語のドキュメントしかない、記事のコードが古くて動かない、料金が怖い、学ぶ順番がわからない、の4点でつまずきます。
- サブ読者は、一度作ったものを本番に出せるレベル（評価・コスト・エラー処理）まで上げたい人です。

### 入門ステップ講座の順番

メインキーワード6語が、そのまま講座の順番です。`course_step` はこの番号を使います。

| course_step | メインキーワード | CSV |
|---|---|---|
| 1 | LLM API | `keywords/LLM API.csv` |
| 2 | 構造化出力 | `keywords/構造化出力.csv` |
| 3 | RAG | `keywords/RAG.csv` |
| 4 | AIエージェント | `keywords/AIエージェント.csv` |
| 5 | MCPサーバー | `keywords/MCPサーバー.csv` |
| 6 | LLM 評価 | `keywords/LLM 評価.csv` |

ファイル名に空白が入るので、シェルでは必ず引用符でくくります。

### 記事の必須条件（どの記事にも入れる）

- 一次情報の URL とアクセス日
- コピーして実行すれば動くコード。Claude が実際に動かしたもの
- 料金の目安。API を呼ぶ記事は、公式の料金ページの URL とアクセス日を添えて金額の目安を書く。API を呼ばない記事は、API の料金がかからないことを書く
- 文体はですます調で統一する（checklist の C19・C29 を満たすため、サイト全体で揃える）
- 言語は TypeScript を基本にする（特典のサンプルアプリと揃える）

## 手順

手順1〜9は執筆するエージェントが、10〜11はメインエージェントが担当します。どの手順も、記録先のファイルに結果を書いてから次へ進みます。

### 1. キーワードを選ぶ

1. `keywords/` にある CSV をすべて読む。CSV が1つも無ければ、その時点で止めて「CSV 待ち」と報告する。
2. 候補の絞り込みは次の順で行う。
   1. 既存記事と重ならないこと。`content/articles/*.md` の frontmatter（`title`、`main_keyword`、`target_query`）を全件読み、同じ検索意図に答える記事が既にある語は外す。表記ゆれ（「LLM API 使い方」と「LLM API 使い方 初心者」など）は同じ意図とみなす。
   2. `ANTHROPIC_API_KEY` の有無。`test -n "$ANTHROPIC_API_KEY" && echo set || echo unset` で確かめる（値そのものは表示しない、ログにも残さない）。`unset` のあいだは、API を呼ばずに書けるテーマ（MCP サーバー、zod での検証、RAG の検索部分など）を先に選ぶ。API を呼ぶ記事を書いた場合、その記事はゲートで下書き止まりになる。
   3. 講座の順番。`course_step` の小さい語を優先する。ただし上の2が優先。
   4. 検索ボリューム。同じ条件なら多い語を選ぶ。guides/01 の「ビッグキーワードを避けて、具体的なロングテールを狙う」に従い、メインキーワード単体は狙わない。
3. 選んだ理由を `logs/<slug>/selection.md` に書く（書式は「logs/<slug>/ の中身」を参照）。

### 2. 誰の何を解決するかを決める（guides/01）

- 検索意図を4タイプ（やり方・エラー・比較・概念）から1つ選ぶ。可能なら実際にそのキーワードで検索し、上位記事が何を書いているかを見て判断する。見られなかったときは、見られなかったと `brief.md` に書く。
- checklist の C01 の答えになる1行（「誰の、どんな検索に答える記事か」）を書く。
- 読み終えた人が何をできるようになるかを1行で書く（guides/02 の末尾にある方法）。
- slug を決める。英小文字・数字・ハイフンだけにする（例 `rag-search-without-api-key`）。EmDash が entry の slug に課す制約は、実装時にドキュメントで確認する。

### 3. 記事型を選ぶ（guides/02）

チュートリアル、解説、トラブル解決、比較の4つから、手順2の検索意図に合う型を選び、そのテンプレートの見出し骨格を `brief.md` に写す。トラブル解決ならエラーメッセージをそのままタイトルと見出しに入れる、比較なら比較表を入れて「結局どれか」を言い切る、のように型ごとの決まりもテンプレートの通りに守る。

### 4. 一次情報を調べる

- 公式ドキュメント、公式の料金ページ、仕様、リリースノート、GitHub のリポジトリを優先する。まとめ記事は一次情報に数えない。
- 記事の中で断定する事実（API の引数、制限値、料金、バージョン）には、1つずつ出典を付ける。出典が見つからない断定は書かない。
- 取得した URL、アクセス日、そのページで何を確かめたかを `logs/<slug>/sources.md` に書く。同じ URL とアクセス日を frontmatter の `sources` にも入れる。
- バージョンと日付は記事本文にも書く（guides/09 の §4「数値・年号は取得日とセットで書く」）。

### 5. 書く（guides/09 の文体規約）

guides/09 §1-2 の文体規約を、執筆前に自分への指示として読み込んでから書きます。要点は次のとおりですが、正本は guides/09 です。

- H2 の直下には必ずリード文を置く。リードの述語と節末の締め方は節ごとに変える
- 否定対比（「AではなくB」「〜ではない。」など）は記事全体で1回まで（checklist C15 と ai-smell-lint の ⑧ に合わせる。guides/09 の「2回まで」より厳しいほうを採る）。比喩は1系統・3回まで。ダッシュは使わない（checklist C31）
- 同じ強調語・同じ転用動詞は1記事1回まで
- 具体例は検証できるものだけ。出典のない伝聞は書かない
- 太字マークアップは使わない（checklist C30）。章境界アナウンスと、冒頭の主張を結末でそのまま繰り返す締めも使わない

lint で FATAL になりやすく、技術記事で書きがちな語があります。次の語は地の文に書きません。言い換えが必要なときは括弧内の形にします。この一覧は実際に FATAL になるのを確かめた例で、FATAL になる語をすべて挙げたものではありません。一覧に無い語でも FATAL になるので、合否は必ず手順7で lint を実行して決めます。

- 「仕様書」「設計書」（⑬テンプレ比喩として FATAL）→「仕様」「仕様のページ」「設計」
- 「地図」「レシピ」「スパイス」（同上。「スパイス」は1語だけの文でも FATAL になることを確かめた）→ 具体的な名前で書く
- 「ここから」「まとめます」「整理します」「ということです。」「〜を順番に見ていきます」（⑫章境界アナウンスとして FATAL。「具体的な特徴を順番に見ていきます。」の1文だけでも FATAL になる。「設定を見ていきます。」は ②メタ発言の warn にとどまる）→ 削るか、内容で書く
- 「── 」「—」「─」と、全角コロンの直後の空白（記号NG として FATAL）→ 読点、括弧、改行に開く
- 「――」（U+2015 の二重ダッシュ）は ai-smell-lint では検出されないが、writing-lint の DENSITY「B-5 ダッシュ」に数えられ、checklist C31 にも当たる → 同じく読点、括弧、改行に開く
- 否定対比（「〜ではない。」「〜のではなく」など）は本文で2回以上あると FATAL、見出しの中なら1回でも FATAL になる

悪い例として語を引用するときは、guides/03 の「悪い例を引用するときの書き方」の3点（引用符でくくる、悪い例だと明示する、直後に直し方を置く）を守ります。

記事の構成で守ること。

- 講座の前後リンク。`prev` があれば本文の冒頭近くに前の記事へのリンクを置く。`next` があれば末尾近くに次の記事へのリンクを置く。リンク先は公開済みか、この記事より前の日時で予約済みの記事に限る（リンク切れを出さない）。
- 関連記事への内部リンク。既存の記事（公開済みか、この記事より前に予約済みのもの）が3本以上あるときは、内容が関係する記事への内部リンクを本文中に1本以上入れる（guides/01 §5）。3本未満で入れられないときは、その事実を `gate.md` に書く。
- 末尾の表記。本文の最後の段落を次の形にする。日付はコードを最後に実行した日。

```
AI 支援で執筆しました。コードは YYYY-MM-DD に実際に実行して確認しています。
```

### 6. コードを実際に動かす

checklist の C08「コードはコピペで動く形（import・前提を省略していない／実行結果を示した）」と C38「コードを実際に動かして確認した」を満たすための手順です。省略できません。

1. 記事に載せるコードを、記事に書いた形のまま `logs/<slug>/code/` に置く。記事のコードと1文字でも違うものを動かしたら確認したことにならない。依存パッケージはバージョンを固定する（`package.json` に `^` を付けない）。
2. 記事に書いた手順どおりのコマンドで実行する。インストールから実行まで、記事の読者が打つコマンドと同じものを打つ。
3. 実行の記録を `logs/<slug>/run/` に残す。1回の実行で1ファイル（`01.log`、`02.log` …）。中身は、実行日時、実行したコマンド、`node -v` などのランタイムのバージョン、終了コード、標準出力と標準エラー。
4. 記事に載せる実行結果は、このログからそのまま写す。手で整えた出力を載せない。
5. API キーやトークンは、ログにも記事にも絶対に残さない。出力に混ざったら `***` に置き換えてから保存する。このリポジトリは public です。
6. `ANTHROPIC_API_KEY` が `unset` のときに API を呼ぶコードは、実行できないので C38 を満たせない。その記事は下書きで止める。Claude Code 自身の通信経路をサンプルコードから使うことは不正利用になるので、回避策として使わない。
7. 権限、ネットワーク、インストールの制限などで実行そのものができなかったときも、同じく下書きで止める。実行できなかった事実とエラーを `run/` に残す。

### 7. lint を2本とも回す

リポジトリのルートで実行します。出力と終了コードを `logs/<slug>/lint/` に保存します。保存先のディレクトリが無いとリダイレクトが失敗して lint が走らないので、最初に作ります。

```bash
mkdir -p logs/<slug>/lint

python3 vendor/tech-writing-pack/scripts/ai-smell-lint.py content/articles/<slug>.md \
  > logs/<slug>/lint/ai-smell.txt 2>&1; echo "exit=$?" >> logs/<slug>/lint/ai-smell.txt

python3 vendor/tech-writing-pack/scripts/writing-lint.py content/articles/<slug>.md --type article --register standard \
  > logs/<slug>/lint/writing-lint.txt 2>&1; echo "exit=$?" >> logs/<slug>/lint/writing-lint.txt
```

スクリプトのソースから読み取れる判定の仕組みは次のとおりです。

| スクリプト | 合格の条件（このゲートでの扱い） | 出力の読み方 |
|---|---|---|
| `ai-smell-lint.py` | 終了コード 0、かつ `🚨FATAL` が0件。加えて、下の「frontmatter の扱い」で FATAL に当たるものが0件 | `🚨FATAL` と `⚠️warn` は地の文での使用（use）、`📎mention` は引用符の中か「悪い例」などのマーカーがある行での検出。判定は `  --- 判定:` で始まる行に出る。この行は末尾から6行目で、後ろに `※` の注記4行と、スキルのコマンドが足す `exit=` の行が続く。合否は `exit=` の値と、判定行の中身の両方で読む。終了コード 1 は FATAL あり、2 はファイルが読めない |
| `writing-lint.py` | 終了コード 0、かつ判定行が `### 判定: FATAL 0 / DENSITY超過 0 / SHOULD n` の形で、FATAL と DENSITY超過がどちらも 0 | 出力は `### FATAL` `### DENSITY` `### SHOULD` `### INFO(要人間確認)` の節と、末尾から3行目の判定行（後ろに `→` の1行と `exit=` の行）。原稿に転用動詞（「テストが落ちる」「CIを回す」の落ちる系・回す系など）があるときだけ、DENSITY と SHOULD の間に `### WATCH（転用動詞・参考カウント: …）` の節も出る。無いときは節ごと出ない。FATAL があると終了コード 1。DENSITY 超過（`[🔴超過]` の行）はスクリプト上は終了コード 0 のまま「書き手の判断」になるが、このゲートでは pack の README と guides/09 §2 の「上限まで間引く」に従い、0 になるまで間引く。`SHOULD`、`WATCH`、`INFO(要人間確認)` は違反ではなく判定行にも数えられないが、1件ずつ判断して記録する |

両スクリプトとも frontmatter を含めたファイル全体を読みます（コードフェンスの中は対象外。`ai-smell-lint.py` はインラインコードも対象外）。下の「記事の frontmatter」の例にある `#` のコメントは説明用なので、原稿には写しません。コメントも lint の対象になり、常体のコメント（例「手順10で入れる」）が writing-lint の DENSITY「B-10 文体混在」の超過として出ることを確かめています。

frontmatter の扱い。`ai-smell-lint.py` は ASCII のダブルクオート `"` と鉤括弧「」の中を引用とみなし、そこで見つけた語を `📎mention` にして FATAL の判定から外します。frontmatter の値（`title`、`description`、`sources` の `title`）は `"` でくくるので、そこに FATAL の語があっても終了コードは 0 のままです（くくらなければ use として FATAL になります）。そこで次のように扱います。

1. frontmatter の範囲（1行目の `---` から次の `---` まで）の行番号を確かめる。
2. `ai-smell.txt` で、その範囲の行に出た `📎mention` を探す。出力の件数が表示された行数より多い症状は、下の「警告の扱い」の2つ目のとおり `grep -n` で残りを洗い出し、frontmatter の範囲に入るものを拾う。`--strict` を付けると mention も判定に入るが、本文で悪い例を引用しただけでも終了コードが 1 になるので、このゲートの合否には使わない。
3. frontmatter の行に出た `📎mention` は use として扱う。⑫章境界アナウンス、⑬テンプレ比喩、記号NG は1件で、⑧否定対比構文は本文の use と合わせて2件で FATAL とみなし、G01 と C33 の不合格として直すまで先へ進まない。
4. この扱いをしたことと、frontmatter の行で出た検出の一覧を `judgments.md` に書く。

writing-lint.py の FATAL のうち個人名の検出は、スクリプトの `PERSONAL_NAMES` が空のリストなので、実際には何も検出しません。`vendor/` は書き換えないので、guides/09 §1-1 の禁止事項「個人名なし」は別に確かめます。ユーザーの名前、アカウント名、関係者の名前を1つずつ `grep -n` で原稿にかけ、0件であることを確かめ、かけた語の種類（名前そのものではなく「ユーザーの GitHub アカウント名」のような書き方）と結果を、`gate.md` の G09 の行に秘密情報の確認と並べて書きます。

警告の扱い。

- `ai-smell-lint.py` の `⚠️warn` と `📎mention`、`writing-lint.py` の `SHOULD`、`WATCH`（出たときだけ）、`INFO(要人間確認)`（と、超過したときの DENSITY）は、1件ずつ `logs/<slug>/lint/judgments.md` に書く。書く内容は、行番号、検出された語、use か mention か、直したか残したか、残した理由。`WATCH` は「転用か、実体のある用法か」を判断し、転用なら具体的な動作に書き直す（例「テストが落ちる」→「テストが失敗する」）。
- 両スクリプトは、症状やカウンタごとに先頭の数件しか行番号を出さない（`ai-smell-lint.py` は1症状5件まで、`writing-lint.py` は SHOULD が12件、DENSITY が1カウンタ4件、WATCH が1動詞5件まで。INFO は9件まで全部出ることを確かめている）。出力にある件数（例「7件(use)」「SHOULD: 15件」）が表示された行数より多いときは、検出語で原稿を `grep -n` して残りの行番号を自分で洗い出し、全件を judgments.md に書く。スクリプトは書き換えない。
- `📎mention` と出ても地の文で使っていれば直す。悪い例の引用なのに `🚨FATAL`（use）と判定されたときは、guides/03「悪い例を引用するときの書き方」の3点に合わせて書き直し、lint が `📎mention` と判定する形にする。checklist の C35 は「引用なら合格」としているが、このゲートは C33「FATALがゼロ」も同時に求めるので、終了コード 0 になるまで書き直す。判断の経緯は judgments.md に書く。
- 直したら2本とも回し直し、最後の実行結果で上書きする。

### 8. checklist.md を1項目ずつ確かめる

下の「公開前ゲート」の表を `logs/<slug>/gate.md` に写し、全行の判定と根拠を埋めます。根拠は「どのファイルの何行目を見たか」「どのログのどの出力か」のように、後から人が確かめられる形で書きます。「問題なし」だけの行は不合格とみなします。

### 9. 原稿を書き出す

`content/articles/<slug>.md` に frontmatter と本文を書きます（書式は「記事の frontmatter」を参照）。ゲートを全部通ったら `status: ready`、1つでも落ちたら `status: draft` にして、執筆するエージェントの仕事はここで終わりです。報告には slug、`status`、落ちた項目を入れます。

### 10. 予約公開する（メインエージェント）

1. `logs/<slug>/gate.md` と lint の出力を読み直す。`status: ready` 以外は投稿しない。
2. 公開日を決める。1日1本。`content/articles/*.md` の `publish_at` で最も遅い日の翌日と、今日の翌日の、遅いほうにする。時刻は毎日同じにし、最初の記事で決めた時刻を README に書いて以後それに揃える。
3. EmDash の MCP（`/_emdash/api/mcp`、OAuth 2.1）で `posts` に記事を作り、予約公開にする。`posts` コレクションは `seed/seed.json` で `drafts`、`revisions`、`preview`、`scheduling` を持っていて、予約公開の実行は Worker の scheduled handler と毎分の cron（`wrangler.jsonc`）が担う。作成は `content_create`（`collection:"posts"`、`slug`、`data:{title, excerpt, content}`。既定で draft になる。`content` には Markdown の文字列をそのまま渡せば Portable Text に変換される）、予約は `content_get` で `_rev` を取ってから `content_schedule`（未来の ISO 8601。`+09:00` 付きでよい）で行う。`content_publish` は予約を消してすぐ公開するので、予約した記事には使わない。返った ULID の `id` を `publish.md` に記録する。根拠はローカルでの検証記録 `docs/verification/local-mcp.md`（2026-10-31）。予約時刻を過ぎた記事は Cron Trigger で scheduled handler が動いた時点で公開される。本番の Cron が実際に動くことは、deploy 後に確かめる。
4. MCP で予約公開ができなかったときは、記事を下書きとして投稿しておき、Claude Code の scheduled task で毎日1本ずつ公開する。scheduled task のプロンプトには「`publish_at` が今日の記事を1本だけ公開し、`publish.md` に記録する」と書く。
5. 投稿したら frontmatter の `status` を `scheduled` に、`publish_at` を予約日時に更新し、`logs/<slug>/publish.md` に記録する。
6. この記事の `prev` に当たる記事の `next` が空なら、その記事を手順「公開後に直す」で更新して、この記事へのリンクを足す。

### 11. 1本目（パイロット）のあと

`content/articles/` に `status: scheduled` か `published` の記事が無い状態で書いた1本目は、パイロットです。予約公開まで通したら、ゲートの結果と気になった点をユーザーに報告し、返事があるまで2本目に進みません。

## 公開前ゲート

ひとつでも落ちたら、その記事は下書きで止めて報告します。

### A. このリポジトリで足しているゲート

| # | 条件 | 確かめ方と記録先 |
|---|---|---|
| G01 | `ai-smell-lint.py` の FATAL が0件。frontmatter の行（`title`、`description`、`sources` の `title`）で出た `📎mention` は use として扱い、FATAL に当たる種類なら不合格（手順7の「frontmatter の扱い」）。warn は1件ずつ判断し、use か mention かを記録した | `lint/ai-smell.txt`、`lint/judgments.md` |
| G02 | `writing-lint.py` の判定行が `### 判定: FATAL 0 / DENSITY超過 0 / SHOULD n` の形で、FATAL と DENSITY超過がどちらも 0。SHOULD、WATCH（出たときだけ）、INFO(要人間確認) は1件ずつ判断を記録した。この FATAL 0 では個人名を検出できない（`PERSONAL_NAMES` が空）ので、個人名は G09 で確かめる | `lint/writing-lint.txt`、`lint/judgments.md` |
| G03 | 下の B の全項目を満たす | `gate.md` |
| G04 | 記事のコードを記事の形のまま実際に動かし、ログがある。API を呼ぶ記事で `ANTHROPIC_API_KEY` が無いときは不合格 | `code/`、`run/` |
| G05 | 断定した事実すべてに一次情報の出典（URL とアクセス日）がある。料金の目安がある（API を呼ぶ記事は出典付きの金額、呼ばない記事は料金がかからないこと） | `sources.md`、frontmatter `sources` |
| G06 | 既存記事と検索意図が重ならない | `selection.md` |
| G07 | 講座の前後リンク（`prev`、`next` のうち存在するもの）と、既存記事が3本以上なら関連記事への内部リンクが本文にある。リンク先は公開済みか先に予約済み | `gate.md` にリンク先の slug を列挙 |
| G08 | 本文の最後の段落が「AI 支援で執筆」を含む決まった表記になっている | 原稿の末尾 |
| G09 | 原稿、ログ、frontmatter に秘密情報（API キー、トークン、パスワード）が無い。原稿に個人名（ユーザーや関係者の名前）が無い | `gate.md` に確かめ方を書く。個人名は手順7のとおり `grep -n` で0件を確かめる |

### B. checklist.md の全項目（原文のまま）

`vendor/tech-writing-pack/checklist.md` の項目を、文言を変えずに全部写しています。区分の列は checklist の見出しそのままです。C33 のコマンドは pack のディレクトリから見たパスなので、このリポジトリでは手順7のコマンドで実行します。C39 は checklist 自身が「（任意）」としている項目なので、入れたかどうかを記録します。C37 の「実体験・判断・動作確認」は、Claude が実際に動かした結果（`run/` のログ）と、その結果から下した判断で満たし、どれを根拠にしたかを `gate.md` に書きます。満たせなければ下書きで止めます。

`gate.md` には、この表に「判定（OK / NG / 任意・なし）」と「根拠」の2列を足して写します。

| # | 区分 | 項目 |
|---|---|---|
| C01 | 設計（→ 01-seo-for-dev-blogs.md） | 「誰の、どんな検索に答える記事か」が1行で言える |
| C02 | 設計（→ 01-seo-for-dev-blogs.md） | タイトルにキーワードが含まれ、具体的（「徹底解説」「完全ガイド」を使っていない） |
| C03 | 設計（→ 01-seo-for-dev-blogs.md） | リード文の3行で「何が解決するか」が伝わる |
| C04 | 設計（→ 01-seo-for-dev-blogs.md） | 検索意図のタイプ（やり方/エラー/比較/概念）に構成が合っている |
| C05 | 構成（→ 02-article-structures.md） | 結論先行になっている（答え → 理由 → 詳細） |
| C06 | 構成（→ 02-article-structures.md） | 1見出し1トピック。見出しを読むだけで流れがわかる |
| C07 | 構成（→ 02-article-structures.md） | 見出しが「作業の実況」でなく「内容」で書かれている |
| C08 | 構成（→ 02-article-structures.md） | コードはコピペで動く形（import・前提を省略していない／実行結果を示した） |
| C09 | AI臭（→ 03-anti-ai.md） | 書き手の態度が感じられる（全部同じ温度になっていない） |
| C10 | AI臭（→ 03-anti-ai.md） | 各セクションに言い切りの文が最低1つある |
| C11 | AI臭（→ 03-anti-ai.md） | ヘッジ（〜でしょう/かもしれません）が過剰でない |
| C12 | AI臭（→ 03-anti-ai.md） | メタ発言（〜を解説します/見ていきましょう）を削った |
| C13 | AI臭（→ 03-anti-ai.md） | 章境界アナウンス（ここから〜/ここまで〜してきました/次は〜）が無い |
| C14 | AI臭（→ 03-anti-ai.md） | テンプレ比喩（地図/土台/車の両輪/潤滑油/スパイス…）を使っていない |
| C15 | AI臭（→ 03-anti-ai.md） | 「〜じゃない。〜だ。」の対比構文が1記事に2回以上出ていない |
| C16 | AI臭（→ 03-anti-ai.md） | 文長に緩急がある（短文と長文が混ざっている） |
| C17 | AI臭（→ 03-anti-ai.md） | 同じ語尾が3回以上連続していない |
| C18 | AI臭（→ 03-anti-ai.md） | 一文を短くしすぎて主語・目的語を削っていない（ブツ切り回避） |
| C19 | AI臭（→ 03-anti-ai.md） | ですます/である調が統一されている（常体落ちが無い） |
| C20 | コロケーション（→ 04-collocation.md） | 「課題・問題・エラー・目標・効果」に付く動詞が正しい |
| C21 | コロケーション（→ 04-collocation.md） | 漢語サ変動詞の助詞（が/を）が合っている（速度が向上する／速度を向上させる） |
| C22 | コロケーション（→ 04-collocation.md） | 形容詞と名詞が合っている（理解は深い、精度は高い） |
| C23 | コロケーション（→ 04-collocation.md） | 重言が無い（まず最初に／throwを投げる／約〜程度） |
| C24 | コロケーション（→ 04-collocation.md） | 翻訳調が無い（影響を作る → 影響を与える） |
| C25 | 正確さ（→ 05-technical-writing.md） | 60字超の長文を分割した |
| C26 | 正確さ（→ 05-technical-writing.md） | 用語が記事全体で統一されている |
| C27 | 正確さ（→ 05-technical-writing.md） | 数量・期間が具体的な数値（早めに → 1週間以内に） |
| C28 | 正確さ（→ 05-technical-writing.md） | AND/ORが明確（「AやB」で曖昧にしていない） |
| C29 | 正確さ（→ 05-technical-writing.md） | ですます/である調が混在していない |
| C30 | 記号（→ 03-anti-ai.md） | `**太字**` のアスタリスク残りが無い（コードブロック外） |
| C31 | 記号（→ 03-anti-ai.md） | `—`（em-dash）`──`（罫線）を使っていない |
| C32 | 記号（→ 03-anti-ai.md） | `：`+半角スペース、`／`での概念並列を使っていない |
| C33 | 機械チェック | `python3 scripts/ai-smell-lint.py 記事.md` を実行し、FATALがゼロ |
| C34 | 機械チェック | warnは目視で要否を判断した |
| C35 | 機械チェック | FATAL/warnが「自分が使っている(use)」か「悪い例の引用(📎mention)」かを確認した（引用なら合格） |
| C36 | 機械チェック | 悪い例を引用したときは、引用符でくくり・悪い例と明示し・直後に直し方を置いた |
| C37 | 最後の一押し（人間にしかできない） | 自分の実体験・判断・動作確認した結果が入っている |
| C38 | 最後の一押し（人間にしかできない） | コードを実際に動かして確認した |
| C39 | 最後の一押し（人間にしかできない） | 「答えを書かずに問いで終わる」箇所が1〜2箇所ある（任意） |

## 記事の frontmatter

```yaml
---
title: "RAG の検索部分だけを TypeScript で作る【API キーなしで動く】"
slug: "rag-search-without-api-key"
description: "リード文の要約を1〜2文で。EmDash の excerpt に入れる"
tags: ["RAG", "TypeScript"]
main_keyword: "RAG"
target_query: "rag 検索 仕組み typescript"
course_step: 3
prev: "structured-output-zod"   # 講座で1つ前の記事の slug。無ければ null
next: null                      # 講座で1つ後の記事の slug。まだ無ければ null
sources:
  - url: "https://example.com/official-doc"
    title: "ページの題名"
    accessed: 2026-10-30
ai_assisted: true
needs_api_key: false            # 本文のコードが LLM の API を呼ぶなら true
status: draft                   # draft / ready / scheduled / published
publish_at: null                # 予約日時（ISO 8601、タイムゾーン付き）。手順10で入れる
updated: 2026-10-30             # 最後に原稿を直した日
---
```

| フィールド | 必須 | 決まり |
|---|---|---|
| `title` | 必須 | 検索キーワードを前方に入れる。「徹底解説」「完全ガイド」を使わない（C02） |
| `slug` | 必須 | ファイル名と同じ。英小文字・数字・ハイフン |
| `description` | 必須 | リード文の要約。lint の対象になる |
| `tags` | 必須 | メインキーワードを1つ目に入れる |
| `main_keyword` | 必須 | 講座の表の6語のどれか |
| `target_query` | 必須 | 選んだ CSV の行のキーワードをそのまま |
| `course_step` | 必須 | 1〜6。講座の表の番号 |
| `prev` / `next` | 必須（値は null 可） | 講座の順番で前後にある記事の slug。同じ `course_step` の中は公開順で並べる |
| `sources` | 必須（1件以上） | `url`、`title`、`accessed`（YYYY-MM-DD）。`sources.md` と一致させる |
| `ai_assisted` | 必須 | 常に `true` |
| `needs_api_key` | 必須 | `true` で `ANTHROPIC_API_KEY` が無ければ、ゲート G04 で不合格 |
| `status` | 必須 | 手順9と10で更新する |
| `publish_at` | 予約後に必須 | 1日1本になるように入れる |
| `updated` | 必須 | 直すたびに更新する |

EmDash の `posts` は今のところ `title`、`featured_image`、`content`（Portable Text）、`excerpt` と、タクソノミー `category`、`tag` を持っています（`seed/seed.json`）。`title` は `title` に、`description` は `excerpt` に、本文は `content` に、`tags` は `tag` に入れます。`course_step`、`prev`、`next`、`sources` に当たるフィールドは今のスキーマに無いので、前後リンクと出典は本文に書いたものが読者に見える形になります。専用のフィールドを足すか、`seo` の欄に何を入れるかは、「実装時にドキュメントで確認する」項目です。

## logs/<slug>/ の中身

```
logs/<slug>/
├── selection.md      # 手順1 キーワードを選んだ理由
├── brief.md          # 手順2・3 誰の何を解決するか、記事型、見出し骨格
├── sources.md        # 手順4 一次情報（URL、アクセス日、確かめたこと）
├── code/             # 手順6 記事に載せたコードと同じもの（package.json はバージョン固定）
├── run/              # 手順6 実行ログ 01.log, 02.log …
├── lint/
│   ├── ai-smell.txt      # 手順7 最後の実行の出力と exit=
│   ├── writing-lint.txt  # 手順7 最後の実行の出力と exit=
│   └── judgments.md      # 手順7 warn・mention・SHOULD・WATCH・INFO を1件ずつ判断した記録
├── gate.md           # 手順8 公開前ゲートの表（A と B の全行に判定と根拠）
└── publish.md        # 手順10 以降 投稿・予約・公開・修正・取り下げの記録
```

`node_modules` はルートの `.gitignore` で除外されています。`code/` で依存を入れても、コミットに入らないことを `git status` で確かめます。

各ファイルの最低限の中身。

- `selection.md`: 読んだ CSV のファイル名、選んだ行（キーワードと、CSV にあったボリュームの値をそのまま）、外した候補と外した理由（重なり、API キー、講座の順番）、`ANTHROPIC_API_KEY` の確認結果（`set` か `unset` だけ）、選んだ日。
- `brief.md`: C01 の1行、検索意図のタイプ、上位記事を見たかどうかと見た結果、記事型、見出し骨格、読み終えた人ができるようになること。
- `sources.md`: 出典ごとに URL、題名、アクセス日、そのページで確かめた事実、記事のどの文の根拠か。
- `publish.md`: 日時、操作（作成、予約、公開、修正、下書きに戻す、リビジョンを戻す）、EmDash 側の entry の ID、予約日時、操作した理由。

## 公開後に直す、取り下げる

- 直すときは、必ず `content/articles/<slug>.md` と EmDash の両方を更新する。片方だけ直すと、どちらが正しいかわからなくなる。EmDash の管理画面で人が直した記事は、先にその内容を原稿へ取り込んでから手を入れる。
- 直した原稿は手順7と8をもう一度通し、`logs/<slug>/lint/` と `gate.md` を更新する。ゲートに落ちる直し方はしない。
- 直したら frontmatter の `updated` を更新し、`publish.md` に何をなぜ直したかを書く。
- 誤りが見つかって、すぐに直せないときは、EmDash のリビジョンで前の版に戻すか、記事を下書きに戻す（`posts` は `revisions` と `drafts` を持っている）。MCP では、リビジョンで戻すなら `revision_list`（`id` には slug ではなく ULID を渡す。slug を渡すとエラーにならずに空の一覧が返る）→ `revision_restore`（下書きが置き換わるだけ）→ `content_get` → `content_publish` の順に呼ぶ。下書きに戻すなら `content_get` → `content_unpublish` を呼ぶ（根拠は `docs/verification/local-mcp.md`）。原稿側は `status` を `draft` に戻し、git の履歴は消さずに新しいコミットで戻す。
- 前後リンクの更新（手順10の6）もこの手順で行う。

## 止めて報告する条件

次のどれかに当たったら、その場で止めて、何が起きたか、どのファイルに記録したかを報告します。

- `keywords/` に CSV が無い、または CSV の列が `keywords/README.md` の想定と違って読めない
- 公開前ゲートのどれかに落ちた（下書きで止める）
- コードを実行できなかった（権限、ネットワーク、API キー）
- 一次情報が見つからず、出典の無い断定が残る
- EmDash の MCP に接続できない（原稿は `ready` のまま残し、メインエージェントが接続を回復してから投稿する）
