import { readFileSync } from "node:fs";
import { chunkMarkdown } from "./chunk.ts";
import { countChars } from "./sentences.ts";

const [file = "doc.md", max = "120", overlap = "40"] = process.argv.slice(2);
const chunks = chunkMarkdown(readFileSync(file, "utf8"), Number(max), Number(overlap));
chunks.forEach((chunk, i) => {
  console.log(`--- #${i + 1} (${countChars(chunk)}字)`);
  console.log(chunk);
});
