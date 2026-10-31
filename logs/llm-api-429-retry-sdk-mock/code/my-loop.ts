import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: "dummy-key-not-sent-anywhere",
  baseURL: "http://127.0.0.1:4010/my-loop",
});

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    await client.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 64,
      messages: [{ role: "user", content: "こんにちは" }],
    });
    break;
  } catch (err) {
    console.log(`attempt ${attempt} failed: ${(err as Error).message}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
