import { docs } from "./docs.ts";
import { createVectorSearch } from "./vector-search.ts";

const query = process.argv[2] ?? "";
const topK = Number(process.argv[3] ?? "3");
const search = await createVectorSearch(docs);

for (const hit of await search(query, topK)) {
  console.log(hit.score.toFixed(3), hit.doc.id);
}
