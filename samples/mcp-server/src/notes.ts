import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

/** 1 ファイルあたりに読み込む上限。巨大ファイルでメモリを食い潰さないための安全柵。 */
export const MAX_NOTE_BYTES = 256 * 1024;

export type NoteSummary = {
  file: string;
  title: string;
  bytes: number;
  updatedAt: string;
};

export type SearchHit = {
  file: string;
  line: number;
  text: string;
};

function titleOf(file: string, body: string): string {
  const heading = body.split("\n").find((l) => l.startsWith("# "));
  return heading ? heading.slice(2).trim() : path.basename(file, ".md");
}

function isMissingPath(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

/**
 * サブフォルダは見ない。直下の .md だけを対象にして、探索範囲を notesDir に閉じ込める。
 * notesDir は最初の add_note で作られるので、まだ無いときは「メモ 0 件」として扱う。
 * ENOENT 以外 (権限不足など) はそのまま投げて、ツールのエラーとして返す。
 */
async function markdownFiles(notesDir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(notesDir, { withFileTypes: true });
  } catch (error) {
    if (isMissingPath(error)) return [];
    throw error;
  }
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => e.name)
    .sort();
}

async function readNote(notesDir: string, file: string): Promise<string | null> {
  const full = path.join(notesDir, file);
  const info = await stat(full);
  if (info.size > MAX_NOTE_BYTES) return null;
  return readFile(full, "utf8");
}

export async function listNotes(notesDir: string): Promise<NoteSummary[]> {
  const result: NoteSummary[] = [];
  for (const file of await markdownFiles(notesDir)) {
    const info = await stat(path.join(notesDir, file));
    const body = info.size > MAX_NOTE_BYTES ? "" : await readFile(path.join(notesDir, file), "utf8");
    result.push({
      file,
      title: titleOf(file, body),
      bytes: info.size,
      updatedAt: info.mtime.toISOString(),
    });
  }
  return result;
}

export async function searchNotes(notesDir: string, query: string, limit: number): Promise<SearchHit[]> {
  const needle = query.toLowerCase();
  const hits: SearchHit[] = [];
  for (const file of await markdownFiles(notesDir)) {
    const body = await readNote(notesDir, file);
    if (body === null) continue;
    const lines = body.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const text = lines[i] ?? "";
      if (!text.toLowerCase().includes(needle)) continue;
      hits.push({ file, line: i + 1, text: text.trim() });
      if (hits.length >= limit) return hits;
    }
  }
  return hits;
}

/**
 * タイトルからファイル名を作る。利用者の入力をそのままパスに使うと "../" で
 * notesDir の外に書けてしまうので、英数字・日本語・ハイフン以外は落とす。
 */
export function slugify(title: string): string {
  const slug = title
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug === "" ? "note" : slug;
}

export async function addNote(notesDir: string, title: string, body: string): Promise<string> {
  await mkdir(notesDir, { recursive: true });
  const base = slugify(title);
  const existing = new Set(await markdownFiles(notesDir));
  let file = `${base}.md`;
  for (let n = 2; existing.has(file); n++) file = `${base}-${n}.md`;
  const content = `# ${title.trim()}\n\n${body.trim()}\n`;
  // flag "wx": 既存ファイルがあれば失敗させ、競合時の上書きを防ぐ。
  await writeFile(path.join(notesDir, file), content, { encoding: "utf8", flag: "wx" });
  return file;
}
