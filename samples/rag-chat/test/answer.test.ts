import assert from "node:assert/strict";
import { it } from "node:test";
import Anthropic from "@anthropic-ai/sdk";
import { answerWithClaude, MAX_TOKENS } from "../src/answer.ts";
import { chunkMarkdown } from "../src/chunk.ts";

// ネットワークに出ずに確認するため、SDK の fetch を差し替えて固定のレスポンスを返す。
it("取り出したチャンクを送信し、text ブロックとトークン数を返す", async () => {
  let sentBody: { model?: string; messages?: { content: string }[] } = {};
  const fakeFetch = async (_url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    sentBody = JSON.parse(String(init?.body));
    const body = {
      id: "msg_test",
      type: "message",
      role: "assistant",
      model: "claude-sonnet-5-5",
      content: [{ type: "text", text: "文字 bigram を使います。(02-retrieval.md#1)" }],
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: { input_tokens: 420, output_tokens: 60 },
    };
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  };

  const client = new Anthropic({ apiKey: "test-key-not-real", fetch: fakeFetch, maxRetries: 0 });
  const [chunk] = chunkMarkdown("02-retrieval.md", "# トークン化\n\n文字 bigram を使います。");
  assert.ok(chunk);
  const result = await answerWithClaude(client, "claude-sonnet-5-5", "どう検索する？", [{ chunk, score: 1 }]);

  assert.equal(sentBody.model, "claude-sonnet-5-5");
  assert.match(sentBody.messages?.[0]?.content ?? "", /文字 bigram を使います/);
  assert.equal(result.text, "文字 bigram を使います。(02-retrieval.md#1)");
  assert.equal(result.inputTokens, 420);
  assert.equal(result.outputTokens, 60);
  assert.equal(result.stopReason, "end_turn");
});

// Sonnet 5.5 は既定で思考するので、レスポンスの先頭に thinking ブロックが来る。
// 思考で max_tokens を使い切ると stop_reason が "max_tokens" になり、text が短いか空になる。
it("思考と回答が入る max_tokens を送り、thinking ブロックを回答に混ぜない", async () => {
  let sentMaxTokens: number | undefined;
  const fakeFetch = async (_url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    sentMaxTokens = JSON.parse(String(init?.body)).max_tokens;
    const body = {
      id: "msg_test_thinking",
      type: "message",
      role: "assistant",
      model: "claude-sonnet-5-5",
      content: [
        { type: "thinking", thinking: "", signature: "sig-not-real" },
        { type: "text", text: "途中まで" },
      ],
      stop_reason: "max_tokens",
      stop_sequence: null,
      usage: { input_tokens: 500, output_tokens: MAX_TOKENS },
    };
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  };

  const client = new Anthropic({ apiKey: "test-key-not-real", fetch: fakeFetch, maxRetries: 0 });
  const [chunk] = chunkMarkdown("01-overview.md", "# 概要\n\nサンプルの説明です。");
  assert.ok(chunk);
  const result = await answerWithClaude(client, "claude-sonnet-5-5", "概要は？", [{ chunk, score: 1 }]);

  assert.equal(sentMaxTokens, MAX_TOKENS);
  assert.ok(MAX_TOKENS >= 4096, "思考の分を見込んで 4096 以上にする");
  assert.equal(result.text, "途中まで");
  assert.equal(result.stopReason, "max_tokens");
});
