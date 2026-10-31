#!/usr/bin/env bash
# 使い方: run.sh <ログの番号> <作業フォルダ> <コマンド...>
# logs/zod-to-json-schema-tool-definition/code/extra/run.sh を写し、ICU の版の行を足したもの。
# 記事のコマンドを作業フォルダで実行し、logs/<slug>/run/<番号>.log に1回分を書く。
# 実行した場所の絶対パスは /path/to に置き換える。
set -u
num="$1"; dir="$2"; shift 2
log="$(cd "$(dirname "$0")/../.." && pwd)/run/${num}.log"
base="$(dirname "$dir")"
out="$(cd "$dir" && "$@" 2>&1)"; code=$?
{
  echo "date: $(date '+%Y-%m-%d %H:%M:%S %z')"
  echo "cwd: /path/to/$(basename "$dir")"
  echo "node: $(node -v)"
  echo "icu: $(node -p process.versions.icu)"
  echo "command: $*"
  echo "exit: ${code}"
  echo "--- stdout+stderr ---"
  printf '%s\n' "$out" | sed "s#${base}#/path/to#g"
} > "$log"
echo "wrote $log (exit ${code})"
