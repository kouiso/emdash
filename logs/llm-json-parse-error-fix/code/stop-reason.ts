import { parseLlmJson } from "./extract-json.ts";

// Messages API の応答のうち、ここで使う2つのフィールドだけを型にしています。
type MessageLike = {
  stop_reason: string;
  content: { type: string; text?: string }[];
};

function readJson(message: MessageLike): unknown {
  if (message.stop_reason === "max_tokens") {
    throw new Error("max_tokens で出力が切れています。上限を上げて取り直してください。");
  }
  const text = message.content
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");
  return parseLlmJson(text);
}

// 応答の形を手で作った見本です。
const cut: MessageLike = {
  stop_reason: "max_tokens",
  content: [{ type: "text", text: '{"category": "billing", "summary": "請求額が二重に' }],
};
const done: MessageLike = {
  stop_reason: "end_turn",
  content: [{ type: "text", text: '```json\n{"category": "billing", "priority": 1}\n```' }],
};

for (const message of [cut, done]) {
  try {
    console.log(message.stop_reason, readJson(message));
  } catch (error) {
    console.log(message.stop_reason, String(error));
  }
}
