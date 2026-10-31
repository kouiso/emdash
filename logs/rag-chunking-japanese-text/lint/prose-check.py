# rag-chunking-japanese-text 用に logs/rag-bm25-search-typescript/lint/prose-check.py を写したもの（1行目のこの注記のほかは変えていない。PATS もそのまま）。
# 補助チェック（C16, C17, C25, C26, C28, C30-C32 の目視の補助）。
# checklist とガイドに無い除外は入れない: インラインコード、バッククオート、出典の番号も
# そのまま1字ずつ数える。frontmatter の文字列（title, description, cost_estimate,
# run_environment）も読者に見えるので数える。数えないのはコードブロックの中身と、
# 表のセルのうち URL だけのセル（文ではない）。どちらも件数を出力する。
import re, sys

path = sys.argv[1]
lines = open(path, encoding="utf-8").read().split("\n")
segs = []          # (line, kind, text)
code_lines = 0
url_cells = []
in_fm = False
in_code = False
FM_KEYS = ("title:", "description:", "cost_estimate:", "run_environment:")
for i, raw in enumerate(lines, 1):
    if i == 1 and raw == "---":
        in_fm = True
        continue
    if in_fm:
        if raw == "---":
            in_fm = False
        elif raw.startswith(FM_KEYS):
            val = raw.split(":", 1)[1].strip().strip('"')
            segs.append((i, "fm", val))
        continue
    if raw.startswith("```"):
        in_code = not in_code
        continue
    if in_code:
        code_lines += 1
        continue
    s = raw.strip()
    if not s:
        continue
    if s.startswith("|"):
        if re.fullmatch(r"\|[-| ]+\|", s):
            continue
        for cell in [c.strip() for c in s.strip("|").split("|")]:
            if re.fullmatch(r"https?://\S+", cell):
                url_cells.append(i)
            elif cell:
                segs.append((i, "cell", cell))
        continue
    if s.startswith("#"):
        segs.append((i, "heading", s.lstrip("#").strip()))
        continue
    segs.append((i, "prose", s))

sents = []
for i, kind, text in segs:
    for part in re.findall(r"[^。]+。?", text):
        part = part.strip()
        if part:
            sents.append((i, kind, part))

prose = [x for x in sents if x[1] in ("prose", "fm")]
print(f"sentences: {len(sents)} (prose+frontmatter {len(prose)}, headings {sum(1 for x in sents if x[1]=='heading')}, table cells {sum(1 for x in sents if x[1]=='cell')})")
print(f"not counted: code block lines {code_lines}, URL-only table cells {len(url_cells)} (lines {url_cells})")
over60 = [x for x in sents if len(x[2]) > 60]
over50 = [x for x in sents if 50 < len(x[2]) <= 60]
print(f"LONG>60: {len(over60)}  (50<len<=60: {len(over50)})")
for i, kind, s in over60:
    print("LONG", i, kind, len(s), s)
lens = [len(s) for _, k, s in prose]
if lens:
    print(f"prose length min {min(lens)} / max {max(lens)} / short(<=20) {sum(1 for n in lens if n <= 20)} / long(41-60) {sum(1 for n in lens if 40 < n <= 60)}")

def ending(s):
    s = s.rstrip("。")
    s = re.sub(r"（[^（）]*）$", "", s)
    return s[-3:]
body = [x for x in sents if x[1] == "prose"]
same3 = 0
for k in range(len(body) - 2):
    e = [ending(x[2]) for x in body[k:k + 3]]
    if e[0] == e[1] == e[2]:
        same3 += 1
        print("SAME3", body[k][0], body[k + 2][0], e[0])
print("SAME3:", same3)

PATS = ["ではな", "じゃな", "ではありません", "**", "—", "─", "―", "： ", "／", "である。", "だ。",
        "ディレクトリ", "版", "言語モデル", "次の節", "後の節", "次は", "ここから", "ここまで",
        "でしょう", "かもしれ", "徹底解説", "完全ガイド", " や ", "など", "等", "まとめ", "：", "いちばん多い"]
for pat in PATS:
    hits = [(i, s) for i, k, s in sents if pat in s]
    for i, s in hits:
        print("PAT", repr(pat), i, s[:70])
print("AND/OR candidates (や in prose, judge by eye):")
for i, k, s in sents:
    for m in re.finditer(r"[^\s、。]{1,12}や[^\s、。]{1,12}", s):
        print("  YA", i, m.group(0))
