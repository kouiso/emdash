import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { buildBm25Index, tokenize } from "../src/bm25.ts";
import { chunkMarkdown } from "../src/chunk.ts";
import { loadMarkdownChunks } from "../src/loadDocs.ts";

describe("tokenize", () => {
  it("英数字は単語、日本語は文字 bigram に分ける", () => {
    assert.deepEqual(tokenize("BM25 検索拡張"), ["bm25", "検索", "索拡", "拡張"]);
  });
});

describe("chunkMarkdown", () => {
  it("見出しごとに分け、見出しを本文の先頭に残す", () => {
    const md = "# A\n\nalpha\n\n## B\n\nbeta one\n\nbeta two";
    const chunks = chunkMarkdown("x.md", md);
    assert.equal(chunks.length, 2);
    assert.equal(chunks[0]?.text, "A\nalpha");
    assert.equal(chunks[1]?.heading, "B");
    assert.equal(chunks[1]?.text, "B\nbeta one\n\nbeta two");
    assert.equal(chunks[1]?.id, "x.md#1");
  });

  it("maxChars を超える分は次のチャンクへ送る", () => {
    const md = `# H\n\n${"a".repeat(30)}\n\n${"b".repeat(30)}`;
    const chunks = chunkMarkdown("y.md", md, { maxChars: 40 });
    assert.equal(chunks.length, 2);
    assert.ok(chunks.every((c) => c.heading === "H"));
  });
});

describe("BM25 search", () => {
  it("質問の語を多く含むチャンクが上位に来る", () => {
    const chunks = [
      ...chunkMarkdown("a.md", "# 料理\n\nカレーの作り方を説明します。"),
      ...chunkMarkdown("b.md", "# 検索\n\nBM25 は検索の点数を計算する式です。"),
    ];
    const hits = buildBm25Index(chunks).search("BM25 の検索", 2);
    assert.equal(hits[0]?.chunk.source, "b.md");
    assert.equal(hits.length, 1, "一致しないチャンクは返さない");
  });

  it("同梱 docs で日本語の検索方法を聞くと 02-retrieval.md が最上位になる", async () => {
    const docsDir = fileURLToPath(new URL("../docs", import.meta.url));
    const chunks = await loadMarkdownChunks(docsDir);
    const hits = buildBm25Index(chunks).search("日本語のトークン化はどうしていますか", 3);
    assert.ok(hits.length > 0);
    assert.equal(hits[0]?.chunk.source, "02-retrieval.md");
    assert.ok(hits.length <= 3);
  });
});
