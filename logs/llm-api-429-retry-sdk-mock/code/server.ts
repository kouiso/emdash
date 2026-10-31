import { createServer } from "node:http";

const counts = new Map<string, number>();
const firstAt = new Map<string, number>();

function errorBody(type: string, message: string, details?: object) {
  return { type: "error", error: { type, message, details }, request_id: "req_mock" };
}

const okBody = {
  id: "msg_mock",
  type: "message",
  role: "assistant",
  model: "claude-opus-5-5",
  content: [{ type: "text", text: "mock: ok" }],
  stop_reason: "end_turn",
  stop_sequence: null,
  usage: { input_tokens: 1, output_tokens: 1 },
};

createServer((req, res) => {
  const scenario = req.url?.split("/")[1] ?? "";
  const n = (counts.get(scenario) ?? 0) + 1;
  counts.set(scenario, n);
  if (n === 1) firstAt.set(scenario, Date.now());
  const elapsed = Date.now() - (firstAt.get(scenario) ?? Date.now());

  const send = (status: number, body: object, headers: Record<string, string> = {}) => {
    console.log(`${scenario} #${n} +${elapsed}ms -> ${status}`);
    res.writeHead(status, { "content-type": "application/json", ...headers });
    res.end(JSON.stringify(body));
  };

  if (scenario === "rate-limit" && n <= 2) {
    return send(429, errorBody("rate_limit_error", "mock: rate limited"), { "retry-after": "1" });
  }
  if (scenario === "overloaded" || scenario === "my-loop") {
    return send(529, errorBody("overloaded_error", "mock: overloaded"));
  }
  if (scenario === "spend-cap") {
    const details = { error_code: "enforced_spend_limit_reached" };
    return send(429, errorBody("rate_limit_error", "mock: spend cap", details));
  }
  if (scenario === "long-wait") {
    return send(429, errorBody("rate_limit_error", "mock: rate limited"), { "retry-after": "30" });
  }
  if (scenario === "bad-request") {
    return send(400, errorBody("invalid_request_error", "mock: bad request"));
  }
  send(200, okBody);
}).listen(4010, "127.0.0.1", () => console.log("mock API: http://127.0.0.1:4010"));
