const graphemes = new Intl.Segmenter("ja", { granularity: "grapheme" });

export function toChars(text: string): string[] {
  return [...graphemes.segment(text)].map((s) => s.segment);
}

export function countChars(text: string): number {
  return toChars(text).length;
}

const OPEN = "「『（";
const CLOSE = "」』）";
const END = "。！？";

export function splitSentences(text: string): string[] {
  const sentences: string[] = [];
  let current = "";
  let depth = 0;
  for (const ch of text) {
    current += ch;
    if (OPEN.includes(ch)) depth++;
    else if (CLOSE.includes(ch) && depth > 0) depth--;
    else if ((END.includes(ch) && depth === 0) || ch === "\n") {
      if (current.trim() !== "") sentences.push(current);
      current = "";
      depth = 0;
    }
  }
  if (current.trim() !== "") sentences.push(current);
  return sentences;
}
