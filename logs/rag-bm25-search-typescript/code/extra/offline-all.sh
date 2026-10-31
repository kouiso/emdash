#!/bin/bash
# ネットワークの無い名前空間（unshare -rn）の中で、記事の node コマンドをすべて実行し直す
run() { echo "## node $*"; node "$@" > /dev/null; echo "exit=$?"; }
run show-tokens.ts "支払いにＰａｙＰａｙが使えます。"
run show-tokens.ts "使える支払い方法"
run search.ts "返品できる期間は？"
run search.ts "使える支払い方法"
run search.ts "返金はいつ？"
run search.ts "返品"
run search.ts "返品" 0
run context.ts "返品できる期間は？"
run context.ts "返金はいつ？"
echo "## outbound fetch"
node -e 'fetch("https://registry.npmjs.org/").then(r => console.log(r.status)).catch(e => console.log(e.cause?.code ?? e.message))'
