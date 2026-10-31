# C19・C29 の補助。地の文（コードブロック、表、見出し、箇条書きを除く）と frontmatter の文字列の文末を調べ、
# ですます以外の文末を出す。インラインコードと鉤括弧の中の「。」では文を切らない（文字は消さない）。
import re, sys
lines = open(sys.argv[1], encoding="utf-8").read().split("\n")
inc = False; infm = False; n = 0; bad = []
def protect(v):
    v = re.sub(r"`[^`]*`", lambda m: m.group(0).replace("。", "\0"), v)
    out = []; depth = 0
    for ch in v:
        if ch == "「": depth += 1
        elif ch == "」" and depth: depth -= 1
        out.append("\0" if ch == "。" and depth else ch)
    return "".join(out)
for i, l in enumerate(lines, 1):
    if i == 1:
        infm = True; continue
    if infm:
        if l == "---":
            infm = False; continue
        if not l.startswith(("title:", "description:", "cost_estimate:", "run_environment:")):
            continue
        v = l.split(":", 1)[1].strip().strip('"')
    else:
        if l.startswith("```"):
            inc = not inc; continue
        if inc or not l.strip() or l.startswith(("|", "#", "- ")) or re.match(r"\d+\. ", l):
            continue
        v = l
    for s in re.findall(r"[^。]+。", protect(v)):
        n += 1
        s = s.replace("\0", "。")
        s2 = re.sub(r"（[^（）]*）。$", "。", s)
        if not re.search(r"(です|ます|ません|ました|でした|ください|ますか|ませんか)。$", s2):
            bad.append((i, s.strip()))
print("sentences ending with 。:", n)
for b in bad:
    print("NON-DESUMASU", *b)
print("non-desumasu:", len(bad))
