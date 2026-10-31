# G04 の確認: 記事のコードブロックが code/ のファイルと1文字も違わないこと、
# 記事に載せた実行結果が run/ のログの出力部分（"--- stdout+stderr ---" の後ろ）と一致することを調べる。
# 使い方: python3 logs/llm-api-cost-estimate-js-tiktoken/lint/check-code-and-outputs.py（リポジトリのルートで）
import re

L = "logs/llm-api-cost-estimate-js-tiktoken/"
article = open("content/articles/llm-api-cost-estimate-js-tiktoken.md", encoding="utf-8").read()
fences = [b for _, b in re.findall(r"```(\w+)\n(.*?)\n```", article, re.S)]

def log(n):
    t = open(L + f"run/{n}.log", encoding="utf-8").read()
    head, out = t.split("--- stdout+stderr ---\n", 1)
    cmd = re.search(r"^command: (.*)$", head, re.M).group(1)
    code = re.search(r"^exit: (\d+)$", head, re.M).group(1)
    return cmd, code, out.strip("\n")

ok = True
for f in ["package.json", "count.ts", "estimate.ts", "unknown-model.ts"]:
    code = open(L + "code/" + f, encoding="utf-8").read().rstrip("\n")
    hit = code in fences
    ok &= hit
    print(f"code {f}: {hit}")
expect = {"01": "mkdir token-cost-estimate", "02": "npm install", "03": "node count.ts",
          "04": "node estimate.ts", "05": "node unknown-model.ts"}
for n, cmd in expect.items():
    c, e, out = log(n)
    same_cmd = c == cmd and e == "0"
    ok &= same_cmd
    print(f"run {n} command == article command ({cmd}) and exit 0: {same_cmd}")
    if n != "01":
        hit = out in fences
        ok &= hit
        print(f"  output of run {n} appears verbatim in article: {hit}")
lead = log("04")[2].split("\n")[0]
hit = lead in fences
ok &= hit
print(f"lead line (run 04 first line) in article: {hit}")
off = log("09")[2]
same_offline = all(log(n)[2] in off for n in ["03", "04", "05"]) and "network: unreachable" in off
ok &= same_offline
print(f"run 09 (no network) reproduces 03/04/05 outputs: {same_offline}")
print("ALL OK" if ok else "MISMATCH")
