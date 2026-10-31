#!/usr/bin/env bash
# 記事の手順どおりに作業フォルダを作り、記事の node コマンドを1つずつ実行して run/NN.log に残す。
# 使い方: run-all.sh <作業場所の親フォルダ> <run ログの出力先>
set -u
WORK_PARENT="$1"
RUN_DIR="$2"
CODE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$RUN_DIR"

log_run() {
  local n="$1"; shift
  local cmd="$*"
  local f="$RUN_DIR/$n.log"
  {
    echo "date: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    echo "cwd: <work>/$(basename "$PWD")"
    echo "node: $(node -v) / npm: $(npm -v)"
    echo "command: ${cmd//$CODE_DIR/<code>}"
    echo "--- output (stdout+stderr) ---"
  } > "$f"
  bash -c "$cmd" >> "$f" 2>&1
  local code=$?
  echo "--- exit=$code" >> "$f"
}

cd "$WORK_PARENT"
rm -rf llm-json-parse
log_run 01 "node -v"
mkdir llm-json-parse
cd llm-json-parse
# 記事のコードブロックを、記事に書いたファイル名でそのまま置く（code/ は記事と1文字も違わないことを check-code-and-outputs.py で確かめている）
cp "$CODE_DIR"/package.json "$CODE_DIR"/samples.ts "$CODE_DIR"/reproduce.ts \
   "$CODE_DIR"/extract-json.ts "$CODE_DIR"/fix.ts "$CODE_DIR"/naive-repair.ts \
   "$CODE_DIR"/stop-reason.ts .
log_run 02 "node reproduce.ts"
log_run 03 "node fix.ts"
log_run 04 "node stop-reason.ts"
log_run 05 "node naive-repair.ts"
# 以下は記事に載せない確認用の実行
log_run 06 "node $CODE_DIR/extra/full-messages.ts"
