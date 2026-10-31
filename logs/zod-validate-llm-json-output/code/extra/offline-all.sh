#!/bin/bash
# ネットワークの無い名前空間（unshare -rn）の中で、記事の node コマンドをすべて実行し直す
for s in ok wrong-type bad-enum extra-key many; do
  echo "## node check.ts $s"; node check.ts "$s" > /dev/null; echo "exit=$?"
done
for f in retry-message.ts pretty-ja.ts strip.ts; do
  echo "## node $f"; node "$f" > /dev/null; echo "exit=$?"
done
echo "## outbound fetch"
node -e 'fetch("https://registry.npmjs.org/").then(r => console.log(r.status)).catch(e => console.log(e.cause?.code ?? e.message))'
