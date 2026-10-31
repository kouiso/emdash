---
title: "LLM API の 429・529 エラーとリトライ【SDK の自動リトライを手元のモックで確かめる】"
slug: "llm-api-429-retry-sdk-mock"
description: "Claude API の 429 は組織のレート制限、529 は API 全体の混雑です。公式 SDK はどちらも既定で2回まで自動でリトライします。その動きを手元のモックサーバーで確かめ、自前のリトライとの重複を外す直し方を書いています。"
tags: ["LLM API", "TypeScript", "Claude API"]
main_keyword: "LLM API"
target_query: null
course_step: 1
cost_estimate: "記事の手順は外部に通信しないので無料です。本物の API に送ると、トークン数に応じた料金がかかります。"
run_environment: "Node.js 22.22.0、@anthropic-ai/sdk 1.3.0"
verified_at: "2026-10-31"
prev: "llm-api-cost-estimate-js-tiktoken"
next: "claude-api-authentication-error"
sources:
  - url: "https://platform.claude.com/docs/en/api/errors"
    title: "Claude API errors"
    accessed: 2026-10-31
  - url: "https://platform.claude.com/docs/en/api/rate-limits"
    title: "Rate limits"
    accessed: 2026-10-31
  - url: "https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript"
    title: "TypeScript SDK"
    accessed: 2026-10-31
  - url: "https://github.com/anthropics/anthropic-sdk-typescript/blob/sdk-v1.3.0/src/client.ts"
    title: "anthropic-sdk-typescript sdk-v1.3.0 src/client.ts"
    accessed: 2026-10-31
  - url: "https://github.com/anthropics/anthropic-sdk-typescript/blob/sdk-v1.3.0/src/core/error.ts"
    title: "anthropic-sdk-typescript sdk-v1.3.0 src/core/error.ts"
    accessed: 2026-10-31
  - url: "https://www.npmjs.com/package/@anthropic-ai/sdk"
    title: "@anthropic-ai/sdk (npm)"
    accessed: 2026-10-31
  - url: "https://nodejs.org/docs/latest-v22.x/api/typescript.html"
    title: "Node.js v22 Modules: TypeScript"
    accessed: 2026-10-31
  - url: "https://platform.claude.com/docs/en/about-claude/pricing"
    title: "Pricing"
    accessed: 2026-10-31
ai_assisted: true
needs_api_key: false
status: draft
publish_at: null
updated: 2026-10-31
---

Claude API の 429 は組織のレート制限、529 は API 全体の混雑を表すエラーです（出典1）。公式の TypeScript SDK は、どちらも既定で2回まで自動でリトライします（出典3）。自分でリトライのループを書く必要はなく、SDK が諦めたあとのエラーだけを受け取れば足ります。

この記事では、SDK の `baseURL` を手元のモックサーバーに向けて、429 と 529 を返させました。キーにはダミーの文字列を渡すので、リクエストは手元の外に出ません。リトライの回数と間隔は、サーバーが受け取った時刻のログで確かめています。

対象は、JS か TypeScript で何か作ったことがあり、LLM の API をこれから組み込む人です。講座の前の記事は「[料金の見積もり](/llm-api-cost-estimate-js-tiktoken)」です。

## 結論は自前のリトライを外して maxRetries に任せること

直すのは、SDK の呼び出しを包む自前のループです。SDK の中でも2回リトライするので、送る回数が掛け算で増えます。

変更前のコードは、529 が返ったら1秒待って3回まで呼び直す `my-loop.ts` です。

```ts
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
```

いつも 529 を返すモックに向けて実行すると、ループの3回はすべて失敗します。

```text
attempt 1 failed: 529 {"type":"error","error":{"type":"overloaded_error","message":"mock: overloaded"},"request_id":"req_mock"}
attempt 2 failed: 529 {"type":"error","error":{"type":"overloaded_error","message":"mock: overloaded"},"request_id":"req_mock"}
attempt 3 failed: 529 {"type":"error","error":{"type":"overloaded_error","message":"mock: overloaded"},"request_id":"req_mock"}
```

モックサーバー側のログには、9回のリクエストが残りました。

```text
my-loop #1 +0ms -> 529
my-loop #2 +499ms -> 529
my-loop #3 +1477ms -> 529
my-loop #4 +2485ms -> 529
my-loop #5 +2869ms -> 529
my-loop #6 +3760ms -> 529
my-loop #7 +4765ms -> 529
my-loop #8 +5152ms -> 529
my-loop #9 +5982ms -> 529
```

自前の1回ごとに、SDK が最初の送信と2回のリトライで3回送っています。3回のループで、合わせて9回です。混雑している API に、6秒で9回送ったことになります。

変更後のコードが、次の `client.ts` です。ループを外し、回数は `maxRetries` で決めます。SDK が諦めたあとのエラーは、クラスで分けて受け取ります。

```ts
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
```

`maxRetries: 2` は既定値と同じ値で、変える場所を示すために書きました（出典3）。リクエストごとに変えるなら、第2引数に `{ maxRetries: 5 }` を渡します（出典3）。`baseURL` をシナリオ名で変えているのは、モックで試すためだけです。本物の API に送るときは、`baseURL` と `apiKey` の行を消します。

`isSpendCap` と `signal` が何のためにあるかは、後の「それでもダメなとき」で説明します。

## 429 は組織の上限、529 は API 全体の混雑

2つのエラーは、原因の持ち主が違います。どちらも SDK は自動でリトライしますが、待てば直るかどうかは別です。

| 項目 | 429 | 529 |
|---|---|---|
| エラーの type | `rate_limit_error` | `overloaded_error` |
| 原因 | 自分の組織がレート制限か利用の上限に達した | API が全ユーザーの通信で混雑している |
| retry-after ヘッダー | 付くことがある | 公式の説明に記載なし |
| SDK のエラーのクラス | `RateLimitError` | `InternalServerError` |

429 は組織単位の上限です（出典1）。レート制限は、1分あたりのリクエスト数、入力トークン数、出力トークン数の3つで決まります（出典2）。どれか1つを超えると 429 が返ります（出典2）。上限は組織の利用ティアで決まり、Console の Rate limits のページで見られます（出典2）。

529 は、API が一時的に混雑しているときのエラーです（出典1）。全ユーザーの通信が多いときに起きると書かれています（出典1）。原因が API 側にあるので、自分のコードを直しても 529 は減りません。

SDK のエラーのクラスは、ステータスコードで決まります。1.3.0 のソースでは、429 が `RateLimitError` です（出典5）。500 以上はまとめて `InternalServerError` なので、529 もこのクラスになります（出典5）。529 だけを見分けるなら、`err.status` か `err.type` を見ます。

## モックサーバーで SDK 1.3.0 のリトライを確かめる

SDK の送り先は `baseURL` で手元のサーバーに変えられます。サーバーは URL の最初の部分でシナリオを選び、決めたステータスコードを返します。

### 使うバージョンと準備

Node.js は 22.22.0、npm は 10.9.4 で動かしました。Node.js 22.18.0 以上は、`.ts` のファイルをそのまま実行できます（出典7）。型の注釈を空白に置き換えて実行し、型は調べません（出典7）。SDK は 2026-10-31 時点の latest の 1.3.0 です（出典6）。

作業フォルダを作って移動します。

```bash
mkdir retry-mock && cd retry-mock
```

作業フォルダに `package.json` を置きます。SDK のバージョンには `^` を付けず、記事と同じものを入れます。

```json
{
  "name": "retry-mock",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "@anthropic-ai/sdk": "1.3.0"
  }
}
```

同じフォルダに、モックサーバーの `server.ts` を置きます。シナリオごとにリクエストを数え、最初のリクエストからの経過時間を1行ずつ出します。

```ts
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
```

エラーの本文は、公式の説明にあるエラーの形に合わせました（出典1）。`type` と `message` を持つ `error` と、`request_id` の組です。前の節の `client.ts` と `my-loop.ts` も、同じフォルダに置きます。

ファイルがそろったら、依存を入れます。

```bash
npm install
```

```text
added 8 packages, and audited 9 packages in 3s

found 0 vulnerabilities
```

### 実行するコマンドと結果

ターミナルを2つ使います。1つ目でモックサーバーを起動し、止めずにおきます。

```bash
node server.ts
```

2つ目のターミナルで、シナリオを1つずつ渡して `client.ts` を実行します。

```bash
node client.ts rate-limit
node client.ts overloaded
node client.ts bad-request
node client.ts spend-cap
node client.ts long-wait
```

2つ目のターミナルの出力です。

```text
$ node client.ts rate-limit
ok (2070ms): { type: 'text', text: 'mock: ok' }

$ node client.ts overloaded
InternalServerError (1306ms): status=529 type=overloaded_error

$ node client.ts bad-request
BadRequestError (63ms): status=400 type=invalid_request_error

$ node client.ts spend-cap
spend cap (1333ms): 来月まで待つか上限を上げる

$ node client.ts long-wait
APIUserAbortError (10003ms): status=undefined type=null
```

1つ目のターミナルには、サーバーが受け取ったリクエストが並びます。

```text
mock API: http://127.0.0.1:4010
rate-limit #1 +0ms -> 429
rate-limit #2 +1012ms -> 429
rate-limit #3 +2018ms -> 200
overloaded #1 +0ms -> 529
overloaded #2 +394ms -> 529
overloaded #3 +1251ms -> 529
bad-request #1 +0ms -> 400
spend-cap #1 +0ms -> 429
spend-cap #2 +444ms -> 429
spend-cap #3 +1276ms -> 429
long-wait #1 +0ms -> 429
```

`my-loop.ts` を試すときも、同じサーバーのまま `node my-loop.ts` を実行します。サーバーは Ctrl+C で止めます。

### 429 は retry-after の1秒を守って3回目に成功した

`rate-limit` は、2回目まで 429 と `retry-after: 1` を返すシナリオです。3回目は成功を返します。サーバーのログでは、3回のリクエストの間隔が 1012ms と 1006ms でした。

SDK は、応答に `retry-after` があれば、その秒数だけ待ってから送り直します（出典4）。クライアントには成功の結果だけが返り、2回の 429 はコードから見えません。429 のたびに自分で待つコードは要らない、と判断しています。

### 529 は約0.5秒、約1秒と間隔を倍にして3回で諦めた

`overloaded` のシナリオは、いつも 529 を返します。間隔は 394ms と 857ms で、3回目のあとに `InternalServerError` が投げられました。

`retry-after` が無いとき、SDK は待ち時間を自分で決めます。最初は0.5秒で、リトライのたびに倍にし、8秒を上限にします（出典4）。そこから最大25%を引いて、待ち時間をばらつかせます（出典4）。1回目は 375〜500ms、2回目は 750〜1000ms の範囲になる計算で、ログの値も収まっています。

### 400 はリトライせずに1回で終わった

`bad-request` のシナリオでは、サーバーに届いたのは1回だけでした。SDK がリトライするのは、408、409、429 と、500 以上のステータスコードです（出典4）。接続の失敗もリトライの対象です（出典3）。400 は、リクエストの形式か中身に問題があるときのエラーです（出典1）。同じリクエストを送り直しても結果は変わらないので、対象から外れています。

クラスの名前は `err.constructor.name` で出しました。公式の例は `err.name` で `BadRequestError` と出るように書いています（出典3）。1.3.0 で試すと、`err.name` は `Error` でした。分岐は `instanceof` で書くのが確実です。

## それでもダメなとき

SDK が諦めたあとも 429 か 529 が続くなら、次の3つを確かめます。

### retry-after の無い 429 は月の利用上限

利用ティアの月の上限に達すると、API は 429 を返し続けます（出典2）。この 429 には `retry-after` が付きません（出典2）。翌月1日の 00:00 UTC まで、SDK の自動リトライも含めて失敗し続けます（出典2）。

見分けるには、エラーの本文の `error.details.error_code` を見ます（出典2）。値が `enforced_spend_limit_reached` なら、この上限です（出典2）。`client.ts` の `isSpendCap` がこの判定です。`spend-cap` のシナリオでは `spend cap` の行が出ました。

ただし、SDK は判定の前に2回リトライしています。サーバーのログに3回のリクエストが残ったとおりです。この上限に達したら、アプリ側で呼び出しを止める処理を足してください。

### retry-after が長いと SDK はその秒数だけ待ち続ける

1.3.0 の SDK は、`retry-after` が正の値なら、その秒数をそのまま待ちます（出典4）。待ち時間の上限は、タイマーで表せる約24.8日です（出典4）。リクエストごとの `timeout` は、リトライの間の待ち時間を区切りません（出典4）。

`long-wait` のシナリオは、`retry-after: 30` を返します。`client.ts` は10秒の `AbortSignal.timeout` を `signal` に渡しています。そのため10秒で `APIUserAbortError` になりました。画面の向こうで人が待っているなら、待てる時間を `signal` で決めておくのが安全です。

### request-id と Console の Rate limits のページを見る

API の応答には、毎回 `request-id` ヘッダーが付きます（出典1）。サポートに問い合わせるときは、この ID を添えます（出典1）。応答のヘッダーには、残りのリクエスト数とトークン数も入っています（出典2）。

組織の使い方が急に増えると、加速の制限で 429 が出ることもあります（出典2）。公式の説明は、通信量を少しずつ増やすよう勧めています（出典2）。ストリーミングで 200 が返ったあとのエラーは、SDK の自動リトライとは別の扱いです（出典1）。

## 料金がかからない範囲

記事の手順は、モックサーバーにしかリクエストを送らないので無料です。かかるのは `npm install` の通信だけでした。ループバックしか無いネットワークでも、すべてのシナリオが同じ結果になることを確かめています。

本物の API に送ると、トークン数に応じた料金がかかります（出典8）。例として Claude Opus 5.5 は、100万トークンあたり入力 $4、出力 $20 です（出典8）。429 か 529 で失敗したリクエストに料金がかかるかは、料金のページで見つけられませんでした。この記事では確かめていません。

## 確認すること

429 か 529 が出たら、次の5つを見ます。

- SDK の呼び出しを、自前のリトライのループで包んでいないか
- リトライの回数を `maxRetries` で決めたか
- 529 を `err.status` か `err.type` で見分けられるか
- `retry-after` の無い 429 で、`error_code` を見ているか
- 待てる時間を `signal` で区切ったか

自分のアプリでは、ユーザーを何秒まで待たせますか。

講座の次の記事は「[認証エラーの直し方](/claude-api-authentication-error)」です。

## 出典

確認日は、どれも 2026-10-31 です。本文の（出典1）〜（出典8）は、この表の番号を指します。

| # | 題名 | URL | 確認日 |
|---|---|---|---|
| 1 | Claude API errors | https://platform.claude.com/docs/en/api/errors | 2026-10-31 |
| 2 | Rate limits | https://platform.claude.com/docs/en/api/rate-limits | 2026-10-31 |
| 3 | TypeScript SDK | https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript | 2026-10-31 |
| 4 | anthropic-sdk-typescript sdk-v1.3.0 src/client.ts | https://github.com/anthropics/anthropic-sdk-typescript/blob/sdk-v1.3.0/src/client.ts | 2026-10-31 |
| 5 | anthropic-sdk-typescript sdk-v1.3.0 src/core/error.ts | https://github.com/anthropics/anthropic-sdk-typescript/blob/sdk-v1.3.0/src/core/error.ts | 2026-10-31 |
| 6 | @anthropic-ai/sdk（npm） | https://www.npmjs.com/package/@anthropic-ai/sdk | 2026-10-31 |
| 7 | Node.js v22 Modules: TypeScript | https://nodejs.org/docs/latest-v22.x/api/typescript.html | 2026-10-31 |
| 8 | Pricing | https://platform.claude.com/docs/en/about-claude/pricing | 2026-10-31 |

AI 支援で執筆しました。コードは 2026-10-31 に実際に実行して確認しています。
