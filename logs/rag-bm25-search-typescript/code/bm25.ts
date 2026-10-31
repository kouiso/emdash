import { tokenize } from "./tokenize.ts";

export type Doc = { id: string; text: string };
export type Hit = { doc: Doc; score: number };

export function createSearch(docs: Doc[], k1 = 1.2, b = 0.75) {
  const tfs = docs.map((doc) => {
    const tf = new Map<string, number>();
    for (const term of tokenize(doc.text)) {
      tf.set(term, (tf.get(term) ?? 0) + 1);
    }
    return tf;
  });
  const lengths = docs.map((doc) => tokenize(doc.text).length);
  const avgdl = lengths.reduce((sum, n) => sum + n, 0) / docs.length;

  const df = new Map<string, number>();
  for (const tf of tfs) {
    for (const term of tf.keys()) df.set(term, (df.get(term) ?? 0) + 1);
  }
  const idf = (term: string) => {
    const n = df.get(term) ?? 0;
    return Math.log(1 + (docs.length - n + 0.5) / (n + 0.5));
  };

  return (query: string, topK = 3): Hit[] => {
    const terms = new Set(tokenize(query));
    const hits = docs.map((doc, i) => {
      let score = 0;
      for (const term of terms) {
        const f = tfs[i].get(term) ?? 0;
        if (f === 0) continue;
        const norm = k1 * (1 - b + (b * lengths[i]) / avgdl);
        score += (idf(term) * f) / (f + norm);
      }
      return { doc, score };
    });
    return hits
      .filter((hit) => hit.score > 0)
      .sort((x, y) => y.score - x.score)
      .slice(0, topK);
  };
}
