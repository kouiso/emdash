import { readFileSync } from "node:fs";
import { chunkMarkdown } from "./chunk.ts";
import { countChars } from "./sentences.ts";

const markdown = readFileSync("doc.md", "utf8");
console.log("上限\t重なり\t個数\t最長\t合計");
for (const [max, overlap] of [[80, 0], [80, 30], [120, 0], [120, 40], [200, 0]]) {
  const lengths = chunkMarkdown(markdown, max, overlap).map(countChars);
  const total = lengths.reduce((a, b) => a + b, 0);
  console.log(`${max}\t${overlap}\t${lengths.length}\t${Math.max(...lengths)}\t${total}`);
}
