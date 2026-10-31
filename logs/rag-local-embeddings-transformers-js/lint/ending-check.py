# C19・C29 の補助: 本文の地の文（frontmatter、コードブロック、見出し、表、箇条書きを除く）の文末が
# ですます調かを調べる。文末の（出典n）は外してから判定する。かぎ括弧の中の「？」では文を切らない。
import re
lines = open("content/articles/rag-local-embeddings-transformers-js.md", encoding="utf-8").read().split("\n")
fm_end = [i for i, l in enumerate(lines, 1) if l == "---"][1]
inc = False; total = 0; bad = []
for i, l in enumerate(lines, 1):
    if i <= fm_end: continue
    if l.startswith("```"): inc = not inc; continue
    if inc or not l.strip() or l.startswith(("#", "|", "- ")): continue
    s = re.sub(r"「[^」]*」", "「」", l)
    for sent in re.findall(r"[^。？]+[。？]", s):
        total += 1
        e = re.sub(r"（出典[^）]*）", "", sent.strip())
        if not re.search(r"(です|ます|ません|でした|ました|ますか|ください)[。？]$", e):
            bad.append((i, sent.strip()))
print(f"sentences {total}, non-desu-masu {len(bad)}")
for b in bad: print(b)
