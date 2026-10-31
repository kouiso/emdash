import { createSearch } from "./bm25.ts";
import { docs } from "./docs.ts";

const question = process.argv[2] ?? "";
const search = createSearch(docs);
const hits = search(question).filter((hit) => hit.score >= 0.1);

const context = hits
  .map((hit) => `<doc id="${hit.doc.id}">\n${hit.doc.text}\n</doc>`)
  .join("\n");

console.log(`次の資料だけを使って質問に答えてください。
資料に答えが無いときは「わかりません」と答えてください。

${context}

質問: ${question}`);
