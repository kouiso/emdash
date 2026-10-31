#!/usr/bin/env python3
"""原稿の地の文を機械的に調べる補助スクリプト（gate.md の C16、C17、C19、C25、C28、C30〜C32 の根拠）。

除外するのはコードブロックの中身（``` で始まる行から ``` で始まる行まで）と、URL だけの表のセルだけ。
インラインコード、Markdown のリンク（URL を含む）、（出典n）、見出し、表のセル、箇条書き、
frontmatter の title と description は、どれも書かれたとおりの文字数で数える。
使い方: python3 prose-check.py <原稿.md>
"""
import re
import sys

path = sys.argv[1]
lines = open(path, encoding="utf-8").read().split("\n")

# frontmatter の範囲
fm_end = next(i for i in range(1, len(lines)) if lines[i] == "---")
units = []  # (行番号, 種類, 文)
excluded_cells = 0
in_fence = False
for idx, ln in enumerate(lines):
    no = idx + 1
    if idx <= fm_end:
        m = re.match(r'^(title|description):\s*"(.*)"$', ln)
        if m:
            for s in re.split(r"(?<=[。！？])", m.group(2)):
                if s.strip():
                    units.append((no, "fm-" + m.group(1), s.strip()))
        continue
    if re.match(r"^\s*```", ln):
        in_fence = not in_fence
        continue
    if in_fence or not ln.strip():
        continue
    if ln.startswith("|"):
        if re.match(r"^\|[-|\s]+\|$", ln):
            continue
        for cell in ln.strip().strip("|").split("|"):
            c = cell.strip()
            if re.fullmatch(r"https?://\S+", c):
                excluded_cells += 1
                continue
            if c:
                units.append((no, "cell", c))
        continue
    kind = "heading" if ln.startswith("#") else ("bullet" if ln.startswith("- ") else "prose")
    body = re.sub(r"^(#+\s|-\s)", "", ln)
    for s in re.split(r"(?<=[。！？])", body):
        if s.strip():
            units.append((no, kind, s.strip()))

print(f"units={len(units)} excluded_url_only_cells={excluded_cells}")

# C25 文の長さ（句点を含めて数える）
over = [(n, k, len(s), s) for n, k, s in units if len(s) > 60]
lens = [len(s) for _, k, s in units if k in ("prose", "fm-description")]
print(f"C25 over60={len(over)} max={max(len(s) for _, _, s in units)}")
for o in over:
    print("  OVER", o)
print(f"C16 prose sentences={len(lens)} min={min(lens)} max={max(lens)} "
      f"le20={sum(1 for x in lens if x <= 20)} 41to60={sum(1 for x in lens if 41 <= x <= 60)}")

# C17 同じ語尾の3連続（地の文の文。末尾の（出典n）と句点を外し、末尾3字で比べる）
prose = [(n, s) for n, k, s in units if k == "prose"]
def ending(s):
    s = re.sub(r"[。！？]$", "", s)
    s = re.sub(r"（出典\d+）$", "", s)
    s = re.sub(r"[。！？]$", "", s)
    return s[-3:]
same3 = []
for i in range(len(prose) - 2):
    e = [ending(s) for _, s in prose[i:i + 3]]
    if e[0] == e[1] == e[2]:
        same3.append((prose[i][0], e[0]))
# 「ます」「です」など2字の語尾でも3連続を見る（厳しめ）
same3_2 = []
for i in range(len(prose) - 2):
    e = [ending(s)[-2:] for _, s in prose[i:i + 3]]
    if e[0] == e[1] == e[2]:
        same3_2.append((prose[i][0], e[0], [n for n, _ in prose[i:i + 3]]))
print(f"C17 SAME3(3字)={len(same3)} {same3}")
print(f"C17 SAME3(2字・参考)={len(same3_2)} {same3_2}")

# C19/C29 文末（地の文と frontmatter の description）
def is_desumasu(s):
    t = re.sub(r"[。！？]$", "", s)
    t = re.sub(r"（出典\d+）$", "", t)
    t = re.sub(r"\)$", "", t)
    return bool(re.search(r"(です|ます|ません|ました|でした|ください|でしょうか|ますか|ませんか)$", t))
non = [(n, s) for n, k, s in units if k in ("prose", "fm-description") and not is_desumasu(s)]
print(f"C19 non-desumasu prose={len(non)}")
for x in non:
    print("  NON", x)

# パターン（コードブロックの外。インラインコードは取り除いてから調べる）
pat = {
    "bold **": r"\*\*", "em-dash —": "—", "罫線 ─": "─", "― U+2015": "―",
    "全角コロン ：": "：", "全角スラッシュ ／": "／", "徹底解説": "徹底解説", "完全ガイド": "完全ガイド",
    "でしょう": "でしょう", "かもしれ": "かもしれ", "ここから": "ここから", "ここまで": "ここまで",
    "次は": "次は", "まとめ": "まとめ", "整理": "整理", "見ていき": "見ていき", "解説します": "解説します",
    "紹介します": "紹介します", "ではなく": "ではなく", "ではありません": "ではありません",
    "じゃない": "じゃない", "や（並列候補）": r"[^\sぁ-ん]や[^\sぁ-んっ]", "さまざま": "さまざま",
    "落ちる": "落ち", "効く": "効", "回す": "回す|回る", "仕様書": "仕様書", "地図": "地図",
}
body_lines = []
in_fence = False
for idx, ln in enumerate(lines):
    if idx <= fm_end:
        body_lines.append((idx + 1, ln))
        continue
    if re.match(r"^\s*```", ln):
        in_fence = not in_fence
        continue
    if not in_fence:
        body_lines.append((idx + 1, re.sub(r"`[^`]*`", "", ln)))
for name, rx in pat.items():
    hits = [(n, ln.strip()[:50]) for n, ln in body_lines if re.search(rx, ln)]
    print(f"PAT {name}: {len(hits)}")
    for h in hits:
        print("   ", h)
