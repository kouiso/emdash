# 記事のコードブロックと logs/<slug>/code/、記事のコマンドと run/ のログ、記事の実行結果と run/ の出力を突き合わせる。
import re, sys, os
base = os.path.dirname(os.path.abspath(__file__))
art = os.path.join(base, "../../../content/articles/rag-chunking-japanese-text.md")
t = open(art, encoding="utf-8").read()
blocks = [(m.group(1), m.group(2), t[:m.start()].count("\n") + 1) for m in re.finditer(r"^```(\w*)\n(.*?)^```$", t, re.S | re.M)]
def log(n):
    s = open(os.path.join(base, f"../run/{n}.log"), encoding="utf-8").read()
    head, out = s.split("--- stdout+stderr ---\n", 1)
    cmd = re.search(r"^command: (.*)$", head, re.M).group(1)
    code = re.search(r"^exit: (\d+)$", head, re.M).group(1)
    return cmd, code, out
ok = True
def check(cond, msg):
    global ok
    print(("OK   " if cond else "NG   ") + msg)
    ok &= cond
files = {4: "package.json", 5: "doc.md", 6: "naive.ts", 8: "sentences.ts", 9: "show-sentences.ts", 12: "sections.ts", 13: "chunk.ts", 14: "main.ts", 19: "stats.ts"}
for i, f in files.items():
    src = open(os.path.join(base, "../code", f), encoding="utf-8").read()
    check(blocks[i - 1][1] == src, f"block {i} (line {blocks[i-1][2]}) == code/{f}")
cmds = {3: None, 7: "04", 10: "06", 15: "08", 17: "09", 20: "11"}
for i, n in cmds.items():
    body = blocks[i - 1][1].strip()
    if n is None:
        check(body == "mkdir jp-chunker\ncd jp-chunker" and log("01")[0] == "mkdir jp-chunker", f"block {i} (line {blocks[i-1][2]}) mkdir/cd, run/01.log command = mkdir jp-chunker")
        continue
    cmd, code, _ = log(n)
    expect = body[len("bash -c "):] if False else body
    check(cmd == body or cmd == "bash -c " + body, f"block {i} (line {blocks[i-1][2]}) command '{body}' == run/{n}.log command '{cmd}', exit {code}")
    check(code == "0", f"run/{n}.log exit 0")
outs = {2: "04", 11: "06", 16: "08", 18: "09", 21: "11"}
for i, n in outs.items():
    check(blocks[i - 1][1] == log(n)[2], f"block {i} (line {blocks[i-1][2]}) output == run/{n}.log stdout")
b1 = blocks[0][1]
check(b1 in log("08")[2] and log("08")[2].split(b1)[0].endswith("\n"), f"block 1 (line {blocks[0][2]}) is a run of whole lines in run/08.log stdout")
check(len(blocks) == 21, f"21 code blocks in article (found {len(blocks)})")
print("ALL OK" if ok else "SOME NG")
