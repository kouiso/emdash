import { readFileSync } from "node:fs";

const text = readFileSync("doc.md", "utf8");
const size = 100;
for (let start = 0; start < 300; start += size) {
  console.log(JSON.stringify(text.slice(start, start + size)));
}
