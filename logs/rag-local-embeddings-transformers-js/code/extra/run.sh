#!/usr/bin/env bash
# 使い方: run.sh <ログの番号> <作業フォルダ> <コマンド...>
# logs/rag-bm25-search-typescript/code/extra/run.sh を写し、npm の版と実行にかかった時間（elapsed）の行、書いたログを標準出力に出す行を足したもの（ICU の行は外した）。
# 記事のコマンドを作業フォルダで実行し、logs/<slug>/run/<番号>.log に1回分を書く。
# 実行した場所の絶対パスは /path/to に置き換える。書いたログは確認のため標準出力にも出す。
set -u
num="$1"; dir="$2"; shift 2
log="$(cd "$(dirname "$0")/../.." && pwd)/run/${num}.log"
base="$(dirname "$dir")"
start=$(date +%s%N)
out="$(cd "$dir" && "$@" 2>&1)"; code=$?
end=$(date +%s%N)
{
  echo "date: $(date '+%Y-%m-%d %H:%M:%S %z')"
  echo "cwd: /path/to/$(basename "$dir")"
  echo "node: $(node -v)"
  echo "npm: $(npm -v)"
  echo "command: $*"
  echo "exit: ${code}"
  echo "elapsed: $(( (end - start) / 1000000 )) ms"
  echo "--- stdout+stderr ---"
  printf '%s\n' "$out" | sed "s#${base}#/path/to#g"
} > "$log"
echo "wrote $log (exit ${code})"
cat "$log"
