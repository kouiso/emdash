#!/usr/bin/env bash
# 記事には載せない確認用。unshare -rn（ネットワークの無い名前空間）の中で実行する。
# モデルを一度ダウンロードしたあとの作業フォルダで、記事の node コマンドを全部実行し直す。
node -e 'fetch("https://huggingface.co").then(() => console.log("network: reachable")).catch((e) => console.log("network: " + (e.cause?.code ?? e.message)))'
for args in 'show-vector.ts|返金はいつ？' 'search.ts|返金はいつ？' 'search.ts|家に届くまで何日？' 'search.ts|宿題を手伝って|8'; do
  IFS='|' read -r -a a <<< "$args"
  echo "\$ node ${a[*]}"
  node "${a[@]}"
  echo "exit=$?"
done
