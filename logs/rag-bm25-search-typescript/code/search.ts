import { createSearch } from "./bm25.ts";
import { docs } from "./docs.ts";

const query = process.argv[2] ?? "";
const b = Number(process.argv[3] ?? "0.75");
const search = createSearch(docs, 1.2, b);

for (const hit of search(query)) {
  console.log(hit.score.toFixed(3), hit.doc.id);
}
