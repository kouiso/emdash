import Anthropic from "@anthropic-ai/sdk";

const scenario = process.argv[2] ?? "rate-limit";
const client = new Anthropic({
  apiKey: "dummy-key-not-sent-anywhere",
  baseURL: `http://127.0.0.1:4010/${scenario}`,
  maxRetries: 2,
});

function isSpendCap(err: unknown): boolean {
  if (!(err instanceof Anthropic.RateLimitError)) return false;
  const body = err.error as { error?: { details?: { error_code?: string } } } | undefined;
  return body?.error?.details?.error_code === "enforced_spend_limit_reached";
}

const startedAt = Date.now();
try {
  const message = await client.messages.create(
    {
      model: "claude-opus-5-5",
      max_tokens: 64,
      messages: [{ role: "user", content: "こんにちは" }],
    },
    { signal: AbortSignal.timeout(10_000) },
  );
  console.log(`ok (${Date.now() - startedAt}ms):`, message.content[0]);
} catch (err) {
  const ms = Date.now() - startedAt;
  if (isSpendCap(err)) {
    console.log(`spend cap (${ms}ms): 来月まで待つか上限を上げる`);
  } else if (err instanceof Anthropic.APIError) {
    console.log(`${err.constructor.name} (${ms}ms): status=${err.status} type=${err.type}`);
  } else {
    throw err;
  }
}
