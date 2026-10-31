import { countChars, splitSentences, toChars } from "./sentences.ts";
import { splitSections, type Section } from "./sections.ts";

function splitLong(sentence: string, limit: number): string[] {
  const chars = toChars(sentence);
  const pieces: string[] = [];
  for (let i = 0; i < chars.length; i += limit) {
    pieces.push(chars.slice(i, i + limit).join(""));
  }
  return pieces;
}

function takeTail(sentences: string[], limit: number): string[] {
  const tail: string[] = [];
  for (let i = sentences.length - 1; i >= 0; i--) {
    if (countChars([sentences[i], ...tail].join("")) > limit) break;
    tail.unshift(sentences[i]);
  }
  return tail;
}

export function chunkSection(section: Section, maxChars: number, overlapChars: number): string[] {
  const header = section.headings.join(" > ") + "\n";
  const budget = maxChars - countChars(header);
  if (budget <= 0) throw new Error(`上限 ${maxChars} 字が見出しの並びより短い: ${header.trim()}`);
  const pieces = splitSentences(section.body).flatMap((s) => splitLong(s, budget));
  const chunks: string[] = [];
  let current: string[] = [];
  for (const piece of pieces) {
    if (current.length > 0 && countChars(current.join("") + piece) > budget) {
      chunks.push(header + current.join("").trim());
      current = takeTail(current, overlapChars);
      while (current.length > 0 && countChars(current.join("") + piece) > budget) {
        current.shift();
      }
    }
    current.push(piece);
  }
  if (current.length > 0) chunks.push(header + current.join("").trim());
  return chunks;
}

export function chunkMarkdown(markdown: string, maxChars: number, overlapChars: number): string[] {
  return splitSections(markdown).flatMap((s) => chunkSection(s, maxChars, overlapChars));
}
