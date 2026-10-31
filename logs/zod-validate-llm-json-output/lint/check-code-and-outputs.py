# G04 の確認: 記事のコードブロックが code/ のファイルと1文字も違わないこと、
# 記事に載せた実行結果が run/ のログから機械的に取り出したものと一致することを調べる。
# 使い方: python3 logs/zod-validate-llm-json-output/lint/check-code-and-outputs.py（リポジトリのルートで）
import re

L = "logs/zod-validate-llm-json-output/"
article = open("content/articles/zod-validate-llm-json-output.md", encoding="utf-8").read()
fences = [b for _, b in re.findall(r"```(\w+)\n(.*?)\n```", article, re.S)]

def run(n):
    t = open(L + f"run/{n:02d}.log", encoding="utf-8").read()
    m = re.search(r"^command: ([^\n]*)\n----- stdout\+stderr -----\n(.*?)\n?----- exit=(\d+) -----", t, re.M | re.S)
    return m.group(1), m.group(2).rstrip("\n"), m.group(3)

ok = True
for f in ["package.json", "schema.ts", "samples.ts", "check.ts", "retry-message.ts", "pretty-ja.ts", "strip.ts"]:
    code = open(L + "code/" + f, encoding="utf-8").read().rstrip("\n")
    hit = code in fences
    ok &= hit
    print(f"code {f}: {hit}")

for cmd in ["mkdir zod-llm-check\ncd zod-llm-check", "npm install", "node check.ts ok", "node check.ts wrong-type",
            "node check.ts bad-enum", "node check.ts extra-key", "node check.ts many",
            "node retry-message.ts", "node pretty-ja.ts", "node strip.ts"]:
    hit = cmd in fences
    ok &= hit
    print(f"command '{cmd.splitlines()[0]}': {hit}")

for n in [3, 5, 6, 7, 8, 9, 10, 11, 12]:
    hit = run(n)[1] in fences
    ok &= hit
    print(f"output run/{n:02d}.log ({run(n)[0]}): {hit}")
for n in range(1, 15):
    print(f"run {n:02d} exit={run(n)[2]}")
print("ALL OK" if ok else "MISMATCH")
