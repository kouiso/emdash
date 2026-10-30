# CLAUDE.md

このリポジトリは、AI をアプリに組み込む開発を学びたい人向けのブログ「ai-eng-blog」です。テーマ選びから公開まで、Claude Code が EmDash の MCP を使ってどこまで任せられるかを確かめる PoC として動かしています。ユーザーはコマンドを書きません。PoC でも記事の質は落とさず、役に立つとわかった部分から作り込みます。

EmDash 自体の書き方（サーバーレンダリング必須、画像フィールドの扱い、タクソノミー名など）は [AGENTS.md](./AGENTS.md) と `.agents/skills/building-emdash-site/` に従います。このファイルは、その上に乗るブログ運用のルールだけを書いています。

## 売る教材はこのリポジトリに入れない

有料で売る教材は、どんな形でもこのリポジトリに入れません。このリポジトリは public です。特典のサンプルアプリ（`samples/`）はメルマガに登録しなくても GitHub から取れてしまいますが、PoC ではそれを受け入れています。有料で売る教材は別の非公開の場所に置きます。

## 読者と講座の順番

メインの読者は、JS/TS か Python で何か作ったことはあるけれど、LLM の API はまだ触っていないか、チャットを1回作った程度の人です。学生、個人開発者、業務で「うちのアプリにも AI を」と言われた人を想定しています。英語のドキュメントしかない、記事のコードが古くて動かない、料金が怖い、学ぶ順番がわからない、の4つでつまずきます。

サブの読者は、一度作ったものを評価、コスト、エラー処理まで含めて本番に出せる水準に上げたい人です。

入門ステップ講座は、次のメインキーワード6語の順で並べます。

1. LLM API
2. 構造化出力
3. RAG
4. AIエージェント
5. MCPサーバー
6. LLM 評価

「組み込み」はアプリに AI を組み込む意味で使います。組み込みシステム（エッジAI）の記事と検索で競合しないよう、タイトルには「アプリに組み込む」と書き、キーワードは「LLM API」のようなアプリ開発側の語を軸にします。

## どこに何を置くか

| 場所 | 中身 |
|---|---|
| `vendor/tech-writing-pack/` | 書き方の規約。上流のファイルをそのまま置いています。編集しません。出典は `vendor/NOTICE.md` |
| `.claude/skills/write-article/` | 記事を1本書いて公開するまでの手順と公開前ゲート |
| `content/articles/<slug>.md` | 記事の原稿。公開中の状態は EmDash、原稿と経緯はこのリポジトリが持ちます |
| `logs/<slug>/` | コードの実行ログ、lint の結果、キーワードを選んだ理由、checklist の各項目の根拠 |
| `keywords/<メインキーワード>.csv` | ユーザーがラッコキーワードから書き出して渡す CSV |
| `samples/rag-chat/`、`samples/mcp-server/` | メルマガ特典の TypeScript サンプルアプリ |

## 記事を書くときのルール

記事を書く、直す、公開する作業は、必ず `.claude/skills/write-article/SKILL.md` を読んでから始めます。手順と公開前ゲートの正本はそのスキルで、ここには要点だけを書きます。

公開前ゲートでは、`vendor/tech-writing-pack/checklist.md` の全項目をそのまま使います。こちらで緩めたり読み替えたりはしません。ひとつでも満たせない記事は下書きで止めて報告します。

- `ai-smell-lint.py` は checklist の「`python3 scripts/ai-smell-lint.py 記事.md` を実行し、FATALがゼロ」を満たすまで直します。warn は1件ずつ use か mention かを判断し、`logs/<slug>/` に記録します。
- `writing-lint.py` も FATAL 0件にし、DENSITY 超過は上限内まで間引きます（pack の `guides/09-ai-writing-manual.md` 2節）。
- checklist の「コードはコピペで動く形（import・前提を省略していない／実行結果を示した）」と「コードを実際に動かして確認した」を満たすため、記事のコードは Claude が実際に動かします。`ANTHROPIC_API_KEY` が無いあいだは、API を呼ぶコードの入った記事は公開しません。キーの要らないテーマ（MCP サーバー、zod での検証、RAG の検索部分）から書きます。
- 断定には一次情報の URL と確認した日付を付けます。既存の記事とテーマが重なる記事は書きません。
- 記事の末尾に「AI 支援で執筆」と入れます。公開後に誤りが見つかったら、リビジョンで戻すか下書きに戻します。直すときはスキルを通し、原稿と EmDash の両方を更新します。

30本の進め方は次のとおりです。最初の1本をパイロットとして最後まで通し、結果をユーザーに報告してから残り29本に進みます。残りはサブエージェントが1本ずつ `content/articles/` と `logs/` まで書き、MCP での投稿はメインエージェントがまとめて行います。公開は1日1本の予約公開です。EmDash の MCP で予約公開ができるかどうかは、まだ確かめていません（実装時にドキュメントで確認する）。できなければ Claude Code の scheduled task で毎日1本公開します。通った本数と落ちた本数は数えて報告します。

## サイトと Cloudflare のルール

- 依存の版は `package.json` と `package-lock.json` で固定しています。`emdash` と `@emdash-cms/cloudflare` は 1.3.1 です。版を上げるときは記事の作業と混ぜず、`npm run build` と `npm run typecheck` が通ることを確かめてから入れます。
- パッケージマネージャーは npm です（ロックファイルが `package-lock.json` のため）。AGENTS.md の `pnpm dev` は upstream の starter の文面で、このリポジトリでは `npm run dev` が同じ動作です。ローカルで動かす手順は [README.md](./README.md) にあります。
- 動作確認の正式な経路は、README と VERIFICATION.md と同じ `npm run build` のあとの `npx wrangler dev --local` です。Playwright などで確かめるのは `http://localhost:8787/` と `http://localhost:8787/_emdash/admin` です。`npm run dev`（`astro dev`。AGENTS.md の記載では管理画面は `http://localhost:4321/_emdash/admin`）は、画面を直しながら見るときにだけ使い、その結果を動作確認として報告しません。
- Cloudflare の無料枠に収めます。サンドボックスで動くプラグインは使わないので、`sandboxRunner` と `LOADER` は設定に入れません。有料プランが要る機能かどうかは、deploy の前にドキュメントで確かめます。最初は `*.workers.dev` のドメインで動かします。
- EmDash の API や設定を確かめるときは、記憶に頼らず `https://docs.emdashcms.com/mcp` の `search_docs` を使います（AGENTS.md の Documentation 節と同じ方針です）。ただし docs の MCP はこのリポジトリでは未設定です。AGENTS.md は「`.mcp.json`、`.cursor/mcp.json`、`.vscode/mcp.json` が付属している」と書いていますが、このリポジトリにはどれもありません。docs の MCP が使えないときは、docs.emdashcms.com のページを直接読みます。

## 秘密情報のルール

- API トークンや PAT を手で作って持ち回りません。本番の MCP 接続は、ユーザーが claude.ai のコネクタで OAuth ログインした経路だけを使います。
- ローカルの MCP を試すためにローカル DB の中だけで使うトークンを発行することはあります。そのトークンは本番で使わず、コミットもしません。
- Turnstile のシークレットキーは、Worker の secret としてユーザーが Cloudflare のダッシュボードで登録します。リポジトリにも、`.dev.vars` の中身としてのコミットにも入れません。
- Search Console のデータを読むための認証も、手でトークンを作って渡す方法は使いません。ユーザーがログインして許可する方法（コネクタの OAuth など）にします。具体的な方法は「実装時にドキュメントで確認する」項目です。
- `.env`、`.dev.vars`、`.wrangler/` は `.gitignore` で除外済みです。秘密を書くファイルを増やしたら、同じコミットで `.gitignore` にも足します。
- push の前に GitHub の secret scanning（`run_secret_scanning`）をかけ、検出0件を確かめます。
