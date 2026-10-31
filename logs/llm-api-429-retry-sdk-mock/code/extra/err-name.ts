import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: "dummy-key-not-sent-anywhere",
  baseURL: "http://127.0.0.1:4010/bad-request",
});
try {
  await client.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 64,
    messages: [{ role: "user", content: "こんにちは" }],
  });
} catch (err) {
  if (err instanceof Anthropic.APIError) {
    console.log("err.name:", err.name);
    console.log("err.constructor.name:", err.constructor.name);
    console.log("instanceof BadRequestError:", err instanceof Anthropic.BadRequestError);
  }
}
