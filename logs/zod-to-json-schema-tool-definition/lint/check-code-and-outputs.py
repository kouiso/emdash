# 記事のコードブロックと logs/<slug>/code/ のファイル、記事の出力ブロックと run/*.log の出力部分が
# 1文字も違わないかを比べる。記事の n 番目のコードブロックが何に当たるかは下の表で決める。
import re, sys, pathlib

slug = "zod-to-json-schema-tool-definition"
root = pathlib.Path(__file__).resolve().parents[3]
art = (root / "content/articles" / f"{slug}.md").read_text(encoding="utf-8")
logs = root / "logs" / slug
blocks = re.findall(r"^```([a-z]*)\n(.*?)^```$", art, flags=re.S | re.M)

def log_output(n):
    text = (logs / "run" / f"{n}.log").read_text(encoding="utf-8")
    return text.split("--- stdout+stderr ---\n", 1)[1]

def code(path):
    return (logs / "code" / path).read_text(encoding="utf-8")

def strip_npm_header(s):
    # npm run の出力は先頭の空行と "> name script" の2行、その後の空行を含む。記事には載せていない。
    return re.sub(r"^\n> [^\n]*\n> [^\n]*\n\n", "", s)

expect = [
    ("text", None, "file tree (not code)"),
    ("bash", "mkdir -p zod-tool-schema/src\ncd zod-tool-schema\n", "commands step1"),
    ("json", code("package.json"), "package.json"),
    ("json", code("tsconfig.json"), "tsconfig.json"),
    ("bash", "npm install\n", "command"),
    ("text", log_output("02").lstrip("\n"), "run/02 npm install output"),
    ("ts", code("src/schema.ts"), "src/schema.ts"),
    ("ts", code("src/tool.ts"), "src/tool.ts"),
    ("text", strip_npm_header(log_output("08")), "run/08 typecheck error (return json experiment)"),
    ("bash", "npm run typecheck\nnode src/tool.ts\n", "commands"),
    ("text", log_output("04"), "run/04 tool output"),
    ("ts", code("src/check-input.ts"), "src/check-input.ts"),
    ("bash", "node src/check-input.ts\n", "command"),
    ("text", log_output("06"), "run/06 check-input output"),
    ("ts", code("src/compare-io.ts"), "src/compare-io.ts"),
    ("bash", "node src/compare-io.ts\n", "command"),
    ("text", log_output("05"), "run/05 compare-io output"),
    ("ts", code("src/date-error.ts"), "src/date-error.ts"),
    ("bash", "node src/date-error.ts\n", "command"),
    ("text", log_output("07"), "run/07 date-error output"),
]
ok = True
if len(blocks) != len(expect):
    print(f"NG block count article={len(blocks)} expected={len(expect)}"); ok = False
for i, ((lang, body), (elang, ebody, label)) in enumerate(zip(blocks, expect), 1):
    if lang != elang:
        print(f"NG #{i} lang {lang} != {elang} ({label})"); ok = False; continue
    if ebody is None:
        print(f"skip #{i} {label}"); continue
    if body == ebody:
        print(f"OK #{i} {label}")
    else:
        ok = False
        print(f"NG #{i} {label}\n--- article\n{body!r}\n--- expected\n{ebody!r}")
# 記事のコマンドとログのコマンドの対応
cmds = {"01": "mkdir -p zod-tool-schema/src", "02": "npm install", "03": "npm run typecheck",
        "04": "node src/tool.ts", "05": "node src/compare-io.ts", "06": "node src/check-input.ts",
        "07": "node src/date-error.ts", "08": "npm run typecheck", "09": "npm run typecheck"}
for n, c in cmds.items():
    t = (logs / "run" / f"{n}.log").read_text(encoding="utf-8")
    m = re.search(r"^command: (.*)$", t, re.M); e = re.search(r"^exit: (\d+)$", t, re.M)
    print(f"run/{n}.log command={'OK' if m.group(1) == c else 'NG'} exit={e.group(1)}")
    if m.group(1) != c: ok = False
print("ALL OK" if ok else "SOME NG")
