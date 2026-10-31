# 使い方と設定

## 実行コマンド

npm start -- "質問文" の形で質問を渡します。質問を省略すると、サンプルの質問を使います。

## 環境変数

- ANTHROPIC_API_KEY: Claude API のキー。未設定なら検索結果だけを表示して終了します。
- ANTHROPIC_MODEL: 使うモデル ID。既定値は claude-sonnet-5-5 です。
- RAG_TOP_K: Claude に渡すチャンクの件数。既定値は 3 です。
- RAG_DOCS_DIR: 読み込む Markdown のフォルダ。既定値はサンプル内の docs です。

## 自分の資料で試す

RAG_DOCS_DIR に自分の Markdown フォルダを指定すると、その資料を元に答えます。
チャンクの大きさは src/chunk.ts の maxChars で変えられます。
