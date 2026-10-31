// 記事には載せない確認用。本文の数字と挙動の主張を、記事のコードで確かめる。
import { readFileSync } from "node:fs";
import { chunkMarkdown, chunkSection } from "./chunk.ts";
import { splitSections } from "./sections.ts";
import { countChars, splitSentences } from "./sentences.ts";

const md = readFileSync("doc.md", "utf8");
const sections = splitSections(md);
console.log("sections:", sections.length);
for (const s of sections) {
  const header = s.headings.join(" > ") + "\n";
  console.log(`  header=${countChars(header)} body=${countChars(s.body)} total=${countChars(header) + countChars(s.body)} ${s.headings.join(" > ")}`);
}

const c120 = chunkMarkdown(md, 120, 40);
console.log("120/40 last chars:", c120.map((c) => [...c].at(-1)).join(" "));
for (let i = 1; i < c120.length; i++) {
  const prevBody = c120[i - 1].split("\n").slice(1).join("\n");
  const body = c120[i].split("\n").slice(1).join("\n");
  const first = splitSentences(body)[0];
  const prevLast = splitSentences(prevBody).at(-1)!;
  console.log(`  #${i + 1} first=${countChars(first)}字 overlap=${first === prevLast} prevLast=${countChars(prevLast)}字`);
}

const c0 = chunkMarkdown(md, 120, 0).map(countChars).reduce((a, b) => a + b, 0);
const c40 = c120.map(countChars).reduce((a, b) => a + b, 0);
console.log("120: total overlap0 =", c0, "overlap40 =", c40, "diff =", c40 - c0);

const header = "ご利用ガイド > 返品について > 返品できる条件\n";
console.log("header chars (with newline):", countChars(header), "budget at 40:", 40 - countChars(header));

try {
  chunkSection({ headings: ["ご利用ガイド", "返品について", "返品できる条件"], body: "テスト。" }, 20, 0);
  console.log("guard: no error");
} catch (e) {
  console.log("guard:", (e as Error).message);
}

const fenced = "# A\n\n```bash\n# not a heading\necho hi\n```\n";
console.log("fence:", JSON.stringify(splitSections(fenced)));

const table = "| 列1 | 列2 |\n|---|---|\n| a | b |\n| c | d |";
console.log("table sentences:", JSON.stringify(splitSentences(table)));
