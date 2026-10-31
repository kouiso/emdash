import type { Chunk } from "./chunk.ts";

const CJK = /[぀-ヿ㐀-鿿豈-﫿]/;

/**
 * 英数字は単語単位、日本語（ひらがな・カタカナ・漢字）は隣り合う 2 文字の bigram に分ける。
 * 日本語は空白で単語が区切られないため、形態素解析なしで部分一致させる簡易な方法。
 */
export function tokenize(text: string): string[] {
  const tokens: string[] = [];
  const runs = text.toLowerCase().match(/[a-z0-9]+|[぀-ヿ㐀-鿿豈-﫿]+/g) ?? [];
  for (const run of runs) {
    if (!CJK.test(run)) {
      tokens.push(run);
      continue;
    }
    if (run.length === 1) {
      tokens.push(run);
      continue;
    }
    for (let i = 0; i < run.length - 1; i++) tokens.push(run.slice(i, i + 2));
  }
  return tokens;
}

export interface SearchHit {
  chunk: Chunk;
  score: number;
}

export interface Bm25Index {
  search(query: string, topK: number): SearchHit[];
}

export function buildBm25Index(chunks: Chunk[], k1 = 1.2, b = 0.75): Bm25Index {
  const docTokens = chunks.map((c) => tokenize(c.text));
  const avgLength = docTokens.reduce((sum, t) => sum + t.length, 0) / Math.max(docTokens.length, 1);

  const termFreqs = docTokens.map((tokens) => {
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    return tf;
  });

  // docFreq: そのトークンを含むチャンクの数。多いほどありふれた語として IDF が下がる。
  const docFreq = new Map<string, number>();
  for (const tf of termFreqs) {
    for (const term of tf.keys()) docFreq.set(term, (docFreq.get(term) ?? 0) + 1);
  }

  const n = chunks.length;
  const idf = (term: string): number => {
    const df = docFreq.get(term) ?? 0;
    return Math.log(1 + (n - df + 0.5) / (df + 0.5));
  };

  return {
    search(query: string, topK: number): SearchHit[] {
      const queryTerms = [...new Set(tokenize(query))];
      const hits: SearchHit[] = [];
      chunks.forEach((chunk, i) => {
        const tf = termFreqs[i];
        const length = docTokens[i]?.length ?? 0;
        if (!tf) return;
        let score = 0;
        for (const term of queryTerms) {
          const f = tf.get(term) ?? 0;
          if (f === 0) continue;
          score += (idf(term) * (f * (k1 + 1))) / (f + k1 * (1 - b + (b * length) / avgLength));
        }
        if (score > 0) hits.push({ chunk, score });
      });
      return hits.sort((a, b2) => b2.score - a.score).slice(0, topK);
    },
  };
}
