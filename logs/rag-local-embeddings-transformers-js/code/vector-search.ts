import type { Doc } from "./docs.ts";
import { embed } from "./embed.ts";

export type Hit = { doc: Doc; score: number };

function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

export async function createVectorSearch(docs: Doc[]) {
  const vectors = await embed(docs.map((doc) => `passage: ${doc.text}`));

  return async (query: string, topK = 3): Promise<Hit[]> => {
    const [q] = await embed([`query: ${query}`]);
    return docs
      .map((doc, i) => ({ doc, score: dot(q, vectors[i]) }))
      .sort((x, y) => y.score - x.score)
      .slice(0, topK);
  };
}
