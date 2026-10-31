import { getEncoding } from "js-tiktoken";

// gpt-5.6-terra の Standard の単価（USD / 100万トークン、2026-10-31 確認）
const PRICE = { input: 2.0, output: 12.0 };
// 入力が 272,000 トークンを超えると、入力は2倍、出力は1.5倍の単価になる
const LONG_PROMPT_TOKENS = 272_000;

const enc = getEncoding("o200k_base");

function estimateMaxCost(prompt: string, maxOutputTokens: number) {
  const inputTokens = enc.encode(prompt).length;
  const isLong = inputTokens > LONG_PROMPT_TOKENS;
  const inputPrice = PRICE.input * (isLong ? 2 : 1);
  const outputPrice = PRICE.output * (isLong ? 1.5 : 1);
  const usd = (inputTokens * inputPrice + maxOutputTokens * outputPrice) / 1_000_000;
  return { inputTokens, maxOutputTokens, usd };
}

const prompt = [
  "あなたはサポート窓口の担当者です。",
  "次のお問い合わせを読み、要点を3行で要約してください。",
  "",
  "先週から、請求書のPDFをダウンロードしようとすると画面が真っ白になります。",
  "ブラウザはChromeとEdgeの両方で試しました。",
  "経理の締めが金曜日なので、それまでに3か月分の請求書が必要です。",
].join("\n");

const cases = [
  { prompt, maxOutputTokens: 1_000 },
  { prompt, maxOutputTokens: 25_000 },
  { prompt: prompt.repeat(3_000), maxOutputTokens: 1_000 },
];

for (const c of cases) {
  const r = estimateMaxCost(c.prompt, c.maxOutputTokens);
  const monthly = r.usd * 1_000 * 30;
  console.log(
    `入力 ${r.inputTokens} / 出力上限 ${r.maxOutputTokens} トークン: ` +
      `1回 $${r.usd.toFixed(6)}、1日1,000回で30日 $${monthly.toFixed(2)}`,
  );
}
