import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { addNote, listNotes, searchNotes, slugify } from "../src/notes.js";

let dir = "";
before(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "notes-test-"));
  await writeFile(path.join(dir, "a.md"), "# Alpha\nhello World\nbye\n");
  await writeFile(path.join(dir, "b.md"), "# Beta\nHELLO again\n");
  await writeFile(path.join(dir, "ignore.txt"), "hello from txt\n");
});
after(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("searchNotes", () => {
  it("大文字小文字を区別せず .md だけを検索する", async () => {
    const hits = await searchNotes(dir, "hello", 10);
    assert.deepEqual(hits, [
      { file: "a.md", line: 2, text: "hello World" },
      { file: "b.md", line: 2, text: "HELLO again" },
    ]);
  });
  it("limit で件数を打ち切る", async () => {
    assert.equal((await searchNotes(dir, "hello", 1)).length, 1);
  });
});

describe("まだ無いフォルダ", () => {
  it("検索も一覧も 0 件で返し、add_note でフォルダを作る", async () => {
    const missing = path.join(dir, "not-created-yet");
    assert.deepEqual(await searchNotes(missing, "hello", 10), []);
    assert.deepEqual(await listNotes(missing), []);
    assert.equal(await addNote(missing, "First", "body"), "first.md");
    assert.deepEqual((await listNotes(missing)).map((n) => n.file), ["first.md"]);
  });
});

describe("slugify", () => {
  it("パス区切りや ../ をファイル名に残さない", () => {
    assert.equal(slugify("../../etc/passwd"), "etc-passwd");
    assert.equal(slugify("会議 メモ 2026/10"), "会議-メモ-2026-10");
    assert.equal(slugify("///"), "note");
  });
});

describe("addNote / listNotes", () => {
  it("同名タイトルでも上書きせず連番にする", async () => {
    const first = await addNote(dir, "Todo", "one");
    const second = await addNote(dir, "Todo", "two");
    assert.equal(first, "todo.md");
    assert.equal(second, "todo-2.md");
    assert.equal(await readFile(path.join(dir, "todo.md"), "utf8"), "# Todo\n\none\n");
    assert.ok(!(await readdir(dir)).some((f) => f.includes("..")));
  });
  it("一覧は見出しをタイトルとして返す", async () => {
    const titles = (await listNotes(dir)).map((n) => [n.file, n.title]);
    assert.deepEqual(titles, [
      ["a.md", "Alpha"],
      ["b.md", "Beta"],
      ["todo-2.md", "Todo"],
      ["todo.md", "Todo"],
    ]);
  });
});
