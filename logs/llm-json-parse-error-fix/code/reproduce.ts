import { samples } from "./samples.ts";

for (const [name, text] of Object.entries(samples)) {
  try {
    JSON.parse(text);
    console.log(`${name}: OK`);
  } catch (error) {
    // 入力の先頭を引用する部分（, "...）より前だけを表示します。
    console.log(`${name}: ${String(error).split(', "')[0]}`);
  }
}
