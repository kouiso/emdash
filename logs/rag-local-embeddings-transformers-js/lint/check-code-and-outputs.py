# G04 の確認: 記事のコードブロックが code/ のファイルと1文字も違わないこと、
# 記事に載せた実行結果が run/ のログから機械的に取り出したものと一致することを調べる。
# logs/rag-bm25-search-typescript/lint/check-code-and-outputs.py を、この記事のファイル名、コマンド、ログの番号に合わせて書き換えたもの。
# 使い方: python3 logs/rag-local-embeddings-transformers-js/lint/check-code-and-outputs.py（リポジトリのルートで）
import re

L = "logs/rag-local-embeddings-transformers-js/"
article = open("content/articles/rag-local-embeddings-transformers-js.md", encoding="utf-8").read()
fences = [b for _, b in re.findall(r"```(\w+)\n(.*?)\n```", article, re.S)]

def run(n):
    t = open(L + f"run/{n:02d}.log", encoding="utf-8").read()
    cmd = re.search(r"^command: (.*)$", t, re.M).group(1)
    code = re.search(r"^exit: (\d+)$", t, re.M).group(1)
    out = t.split("--- stdout+stderr ---\n", 1)[1].rstrip("\n")
    return cmd, out, code

ok = True
for f in ["package.json", "embed.ts", "show-vector.ts", "docs.ts", "vector-search.ts", "search.ts"]:
    code = open(L + "code/" + f, encoding="utf-8").read().rstrip("\n")
    hit = code in fences
    ok &= hit
    print(f"code {f}: {hit}")

cmds = ["mkdir local-embeddings\ncd local-embeddings",
        "npm install\ndu -sh node_modules",
        "ONNXRUNTIME_NODE_INSTALL=skip npm install",
        'node show-vector.ts "返金はいつ？"',
        "du -sh node_modules/@huggingface/transformers/.cache",
        'node search.ts "返金はいつ？"', 'node search.ts "家に届くまで何日？"', 'node search.ts "宿題を手伝って" 8']
for cmd in cmds:
    hit = cmd in fences
    ok &= hit
    print(f"command '{cmd.splitlines()[0]}': {hit}")

# 記事のコマンド（引用符つき）とログのコマンド（シェルが引用符を外したもの）が同じ引数か
pairs = [(1, "mkdir local-embeddings"), (3, "npm install"), (4, "du -sh node_modules"),
         (14, "bash -c ONNXRUNTIME_NODE_INSTALL=skip npm install"), (15, "du -sh node_modules"),
         (6, 'node show-vector.ts "返金はいつ？"'), (7, "du -sh node_modules/@huggingface/transformers/.cache"),
         (8, 'node show-vector.ts "返金はいつ？"'),
         (10, 'node search.ts "返金はいつ？"'), (11, 'node search.ts "家に届くまで何日？"'),
         (12, 'node search.ts "宿題を手伝って" 8'), (16, 'node search.ts "返金はいつ？"')]
for n, cmd in pairs:
    logged = run(n)[0]
    same = cmd.replace('"', "") == logged
    ok &= same
    print(f"run/{n:02d}.log command matches article: {same} ({logged})")

# 記事に載せた実行結果（コードブロック）がログの出力と一致するか
for n in [4, 6, 7, 10, 11, 12]:
    hit = run(n)[1] in fences
    ok &= hit
    print(f"output run/{n:02d}.log in article: {hit}")
# 冒頭の完成形（「返金はいつ？」の結果）は run/10 と同じブロックが2回出る
print("run/10 output appears twice:", fences.count(run(10)[1]) == 2)
ok &= fences.count(run(10)[1]) == 2
# 同じ結果になったログ（2回目の実行、skip、ネットワークなし）
same8 = run(8)[1] == run(6)[1]; same16 = run(16)[1] == run(10)[1]
off = run(17)[1]
same17 = all(run(n)[1] in off for n in [6, 10, 11, 12]) and off.count("exit=0") == 4 and "network: EAI_AGAIN" in off
ok &= same8 and same16 and same17
print(f"run/08 == run/06: {same8}; run/16 == run/10: {same16}; run/17 offline has 06/10/11/12 outputs, 4x exit=0, EAI_AGAIN: {same17}")
# 本文の数値の根拠
checks = {
    "run/03 added 46 packages": "added 46 packages" in run(3)[1],
    "run/15 484M": run(15)[1].startswith("484M\t"),
    "run/22 cuda 272054000": "272054000 " in run(22)[1] and "libonnxruntime_providers_cuda.so" in run(22)[1],
    "run/18 4 files incl. model_quantized 118308185": len(run(18)[1].splitlines()) == 4 and "118308185 Xenova/multilingual-e5-small/onnx/model_quantized.onnx" in run(18)[1],
    "run/24 onnxruntime-node largest": run(24)[1].splitlines()[-1].endswith("node_modules/onnxruntime-node"),
    "run/25 versions": "@huggingface/transformers@4.3.2" in run(25)[1] and "onnxruntime-node@1.30.0" in run(25)[1] and "Linux x86_64" in run(25)[1],
    "run/21 tsc_exit=0": "tsc_exit=0" in run(21)[1],
}
for k, v in checks.items():
    ok &= v
    print(f"{k}: {v}")
for n in range(1, 26):
    t = open(L + f"run/{n:02d}.log", encoding="utf-8").read()
    el = re.search(r"^elapsed: (\d+) ms$", t, re.M).group(1)
    print(f"run {n:02d} exit={run(n)[2]} elapsed={el}ms")
print("ALL OK" if ok else "MISMATCH")
