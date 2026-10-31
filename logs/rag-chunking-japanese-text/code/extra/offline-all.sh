#!/bin/bash
# ネットワークの無い名前空間（unshare -rn）の中で、記事の node コマンドをすべて実行し直す
run() { echo "## $*"; bash -c "$*" > /dev/null; echo "exit=$?"; }
run node naive.ts
run node show-sentences.ts
run node main.ts doc.md 120 40
run "node main.ts doc.md 40 0 | head -n 6"
run node stats.ts
echo "## outbound fetch"
node -e 'fetch("https://registry.npmjs.org/").then(r => console.log(r.status)).catch(e => console.log(e.cause?.code ?? e.message))'
