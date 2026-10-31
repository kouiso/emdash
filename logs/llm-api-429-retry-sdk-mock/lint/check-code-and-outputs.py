# G04 の確認: 記事のコードブロックが code/ のファイルと1文字も違わないこと、
# 記事に載せた実行結果が run/ のログから機械的に取り出したものと一致することを調べる。
# 使い方: python3 logs/llm-api-429-retry-sdk-mock/lint/check-code-and-outputs.py（リポジトリのルートで）
import re

L = "logs/llm-api-429-retry-sdk-mock/"
article = open("content/articles/llm-api-429-retry-sdk-mock.md", encoding="utf-8").read()
fences = [b for _, b in re.findall(r"```(\w+)\n(.*?)\n```", article, re.S)]

def run(n):
    t = open(L + f"run/{n:02d}.log", encoding="utf-8").read()
    m = re.search(r"^command: ([^\n]*)\n----- stdout\+stderr -----\n(.*?)\n?----- exit=(\d+) -----", t, re.M | re.S)
    return m.group(1), m.group(2).strip("\n"), m.group(3)

ok = True
for f in ["package.json", "server.ts", "client.ts", "my-loop.ts"]:
    code = open(L + "code/" + f, encoding="utf-8").read().rstrip("\n")
    hit = code in fences
    ok &= hit
    print(f"code {f}: {hit}")

server = run(3)[1].split("\n")
clients = "\n\n".join(f"$ {run(n)[0]}\n{run(n)[1]}" for n in range(4, 9))
checks = {
    "02 npm install": run(2)[1],
    "04-08 client outputs": clients,
    "03 server log (without my-loop)": "\n".join(l for l in server if not l.startswith("my-loop")),
    "03 server log (my-loop only)": "\n".join(l for l in server if l.startswith("my-loop")),
    "09 node my-loop.ts": run(9)[1],
}
for name, text in checks.items():
    hit = text in fences
    ok &= hit
    print(f"output {name}: {hit}")
for n in range(1, 13):
    print(f"run {n:02d} exit={run(n)[2]}")
print("ALL OK" if ok else "MISMATCH")
