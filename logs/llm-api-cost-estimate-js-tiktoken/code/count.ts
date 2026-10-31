import { getEncoding } from "js-tiktoken";

const enc = getEncoding("o200k_base");

const samples = [
  "Summarize this support ticket in three lines.",
  "このお問い合わせの内容を3行で要約してください。",
];

for (const text of samples) {
  const tokens = enc.encode(text);
  console.log(`${tokens.length} tokens / ${[...text].length} chars: ${text}`);
}
