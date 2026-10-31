import Anthropic from "@anthropic-ai/sdk";
import type { SearchHit } from "./bm25.ts";

export function formatContext(hits: SearchHit[]): string {
  return hits
    .map((h, i) => `<chunk index="${i + 1}" source="${h.chunk.id}">\n${h.chunk.text}\n</chunk>`)
    .join("\n\n");
}

// Claude Sonnet 5.5 は既定で思考し、思考を切ることもできない（thinking: {type: "disabled"} は 400 エラー）。
// 思考のトークンも max_tokens に数えられるので、思考と回答の両方が入る大きさにしておく。
// 課金は実際に出力したトークン分だけで、上限を上げただけでは料金は増えない。
// 出典: https://platform.claude.com/docs/en/build-with-claude/thinking （2026-10-31 参照）
export const MAX_TOKENS = 16000;

export interface AnswerResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  stopReason: string | null;
}

export async function answerWithClaude(
  client: Anthropic,
  model: string,
  question: string,
  hits: SearchHit[],
): Promise<AnswerResult> {
  const response = await client.messages.create({
    model,
    max_tokens: MAX_TOKENS,
    system:
      "あなたは資料に基づいて答えるアシスタントです。<chunk> タグの内容だけを根拠に日本語で答え、" +
      "使ったチャンクの source を文末に示してください。資料に答えがなければ「資料にはありません」と答えてください。",
    messages: [
      {
        role: "user",
        content: `資料:\n${formatContext(hits)}\n\n質問: ${question}`,
      },
    ],
  });

  // content には思考ブロックなどテキスト以外も入りうるので、type が "text" のものだけを連結する。
  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  return {
    text,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    stopReason: response.stop_reason,
  };
}
