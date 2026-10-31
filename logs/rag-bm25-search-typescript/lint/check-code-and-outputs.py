# G04 の確認: 記事のコードブロックが code/ のファイルと1文字も違わないこと、
# 記事に載せた実行結果が run/ のログから機械的に取り出したものと一致することを調べる。
# logs/zod-validate-llm-json-output/lint/check-code-and-outputs.py を、この記事のファイル名と
# ログの書式（code/extra/run.sh の出力）に合わせて書き換えたもの。
# 使い方: python3 logs/rag-bm25-search-typescript/lint/check-code-and-outputs.py（リポジトリのルートで）
import re

L = "logs/rag-bm25-search-typescript/"
article = open("content/articles/rag-bm25-search-typescript.md", encoding="utf-8").read()
fences = [b for _, b in re.findall(r"```(\w+)\n(.*?)\n```", article, re.S)]

def run(n):
    t = open(L + f"run/{n:02d}.log", encoding="utf-8").read()
    cmd = re.search(r"^command: (.*)$", t, re.M).group(1)
    code = re.search(r"^exit: (\d+)$", t, re.M).group(1)
    out = t.split("--- stdout+stderr ---\n", 1)[1].rstrip("\n")
    return cmd, out, code

ok = True
for f in ["package.json", "tokenize.ts", "show-tokens.ts", "bm25.ts", "docs.ts", "search.ts", "context.ts"]:
    code = open(L + "code/" + f, encoding="utf-8").read().rstrip("\n")
    hit = code in fences
    ok &= hit
    print(f"code {f}: {hit}")

cmds = ["mkdir bm25-search\ncd bm25-search",
        'node show-tokens.ts "支払いにＰａｙＰａｙが使えます。"', 'node show-tokens.ts "使える支払い方法"',
        'node search.ts "返品できる期間は？"', 'node search.ts "使える支払い方法"', 'node search.ts "返金はいつ？"',
        'node search.ts "返品"', 'node search.ts "返品" 0',
        'node context.ts "返品できる期間は？"', 'node context.ts "返金はいつ？"']
for cmd in cmds:
    hit = cmd in fences
    ok &= hit
    print(f"command '{cmd.splitlines()[0]}': {hit}")

# 記事のコマンド（引用符つき）とログのコマンド（シェルが引用符を外したもの）が同じ引数か
for n, cmd in zip([4, 5, 7, 8, 9, 10, 11, 13, 14], cmds[1:]):
    logged = run(n)[0]
    same = cmd.replace('"', "") == logged
    ok &= same
    print(f"run/{n:02d}.log command matches article: {same} ({logged})")

for n in [4, 5, 7, 8, 9, 10, 11, 13, 14]:
    hit = run(n)[1] in fences
    ok &= hit
    print(f"output run/{n:02d}.log: {hit}")
for n in range(1, 18):
    print(f"run {n:02d} exit={run(n)[2]}")
print("ALL OK" if ok else "MISMATCH")
