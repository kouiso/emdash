import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { chunkMarkdown, type Chunk } from "./chunk.ts";

export async function loadMarkdownChunks(dir: string, maxChars?: number): Promise<Chunk[]> {
  const files = (await readdir(dir)).filter((f) => f.endsWith(".md")).sort();
  const chunks: Chunk[] = [];
  for (const file of files) {
    const text = await readFile(join(dir, file), "utf8");
    chunks.push(...chunkMarkdown(file, text, { maxChars }));
  }
  return chunks;
}
