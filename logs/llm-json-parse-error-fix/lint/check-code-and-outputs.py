#!/usr/bin/env python3
"""記事のコードブロックと logs の code/、run/ を突き合わせる（gate.md の G04、C08 の根拠）。

1. 記事の json/ts のコードブロックを、直前の段落で名前を挙げたファイル（code/ の同名ファイル）と1文字ずつ比べる
2. 記事の bash のコマンドが、run/ のログの command 行か run-all.sh の手順に入っているかを確かめる
3. 記事の text の実行結果を、対応する run/NN.log の出力部分と1文字ずつ比べる
使い方: python3 check-code-and-outputs.py <原稿.md> <logs/<slug> のパス>
"""
import re
import sys
from pathlib import Path

art = Path(sys.argv[1]).read_text(encoding="utf-8")
logs = Path(sys.argv[2])
blocks = [(m.group(1), m.group(2), art[:m.start()]) for m in
          re.finditer(r"^```(\w+)\n(.*?)^```$", art, flags=re.S | re.M)]

ok = True
code_map = {}
for lang, body, before in blocks:
    if lang in ("ts", "json"):
        # 直前の段落にある `xxx.ts` か `package.json` をファイル名とみなす
        names = re.findall(r"`([\w.-]+\.(?:ts|json))`", before.split("\n\n")[-1] if before.split("\n\n")[-1].strip() else before.split("\n\n")[-2])
        name = names[-1] if names else None
        if name in code_map:
            name = None
        src = (logs / "code" / name).read_text(encoding="utf-8") if name else None
        same = src == body
        ok &= same
        code_map[name] = same
        print(f"CODE {name}: {'SAME' if same else 'DIFF'}")

runs = {}
for f in sorted((logs / "run").glob("*.log")):
    t = f.read_text(encoding="utf-8")
    cmd = re.search(r"^command: (.*)$", t, re.M).group(1)
    out = t.split("--- output (stdout+stderr) ---\n", 1)[1].rsplit("--- exit=", 1)[0]
    code = re.search(r"--- exit=(\d+)", t).group(1)
    runs[cmd] = (f.name, out, code)

script = (logs / "code" / "extra" / "run-all.sh").read_text(encoding="utf-8")
last_cmd = None
for lang, body, before in blocks:
    if lang == "bash":
        for c in body.strip().split("\n"):
            if c in runs:
                print(f"CMD {c!r}: run/{runs[c][0]} exit={runs[c][2]}")
                ok &= runs[c][2] == "0"
                last_cmd = c
            elif re.search(r"^" + re.escape(c) + r"$", script, re.M):
                print(f"CMD {c!r}: run-all.sh の手順で実行（ログ行なし）")
            else:
                print(f"CMD {c!r}: NOT FOUND")
                ok = False
    if lang == "text":
        name, out, _ = runs[last_cmd]
        same = out == body
        ok &= same
        print(f"OUT after {last_cmd!r} vs run/{name}: {'SAME' if same else 'DIFF'}")

print("ALL OK" if ok else "NG")
