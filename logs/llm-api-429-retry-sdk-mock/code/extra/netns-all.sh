#!/bin/sh
# ループバックしか無いネットワーク名前空間（unshare -rn）で、モックサーバーと全シナリオを動かす。
# 外向きの通信ができないことも同じ名前空間の中で確かめる。
python3 -I "$1"
node server.ts &
SP=$!
sleep 1
for s in rate-limit overloaded bad-request spend-cap long-wait; do
  echo "$ node client.ts $s"
  node client.ts "$s"
done
echo "$ node my-loop.ts"
node my-loop.ts
node -e 'fetch("https://api.anthropic.com").then(r => console.log("external:", r.status)).catch(e => console.log("external fetch failed:", e.cause?.code || e.message))'
kill -INT $SP
