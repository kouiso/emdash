export interface Chunk {
  id: string;
  source: string;
  heading: string;
  text: string;
}

export interface ChunkOptions {
  /** 1 チャンクの最大文字数。超えた段落は次のチャンクへ送る。 */
  maxChars?: number;
}

/**
 * Markdown を「見出しごと → 空行で区切った段落ごと」に分け、maxChars を超えない範囲で段落をまとめる。
 * 見出しをチャンクに残すのは、本文だけだと何の話か検索で拾えなくなるため。
 */
export function chunkMarkdown(source: string, markdown: string, options: ChunkOptions = {}): Chunk[] {
  const maxChars = options.maxChars ?? 400;
  const chunks: Chunk[] = [];
  let heading = "";
  let buffer: string[] = [];

  const flush = (): void => {
    const body = buffer.join("\n\n").trim();
    if (body.length > 0) {
      const text = heading ? `${heading}\n${body}` : body;
      chunks.push({ id: `${source}#${chunks.length}`, source, heading, text });
    }
    buffer = [];
  };

  const paragraphs = markdown.replace(/\r\n/g, "\n").split(/\n\s*\n/);
  for (const raw of paragraphs) {
    const paragraph = raw.trim();
    if (paragraph.length === 0) continue;

    const headingMatch = /^#{1,6}\s+(.+)$/.exec(paragraph.split("\n")[0] ?? "");
    if (headingMatch) {
      flush();
      heading = headingMatch[1]?.trim() ?? "";
      const rest = paragraph.split("\n").slice(1).join("\n").trim();
      if (rest.length > 0) buffer.push(rest);
      continue;
    }

    const currentLength = buffer.join("\n\n").length;
    if (buffer.length > 0 && currentLength + paragraph.length > maxChars) flush();
    buffer.push(paragraph);
  }
  flush();
  return chunks;
}
