import re,sys
lines=open(sys.argv[1]).read().split("\n")
infm=False; fm=0; code=False; sents=[]
for i,l in enumerate(lines,1):
    if i==1 and l=="---": infm=True; continue
    if infm:
        if l=="---": infm=False
        continue
    if l.startswith("```"): code=not code; continue
    if code or not l.strip() or l.startswith("|") or l.startswith("#"): continue
    for s in re.findall(r"[^。]+。?", l):
        s=s.strip()
        if s: sents.append((i,s))
print("sentences:",len(sents))
for i,s in sents:
    plain=re.sub(r"`[^`]*`","X",s)
    if len(plain)>60: print("LONG",i,len(plain),s)
ends=[]
for i,s in sents:
    m=re.search(r"(.{0,4})。$",s); ends.append((i,s[-4:]))
for k in range(len(ends)-2):
    a,b,c=[e[1][-3:] for e in ends[k:k+3]]
    if a==b==c: print("SAME3",ends[k][0],a)
for pat in ["ではな","じゃな","ません。","**","—","─","―","： ","／","である。","だ。"]:
    for i,l in enumerate(lines,1):
        if pat in l and not l.startswith(("    ","```")): print("PAT",repr(pat),i,l[:80])
