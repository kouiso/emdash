import Anthropic from "@anthropic-ai/sdk";
import { fileURLToPath } from "node:url";
import { answerWithClaude, formatContext } from "./answer.ts";
import { buildBm25Index } from "./bm25.ts";
import { loadMarkdownChunks } from "./loadDocs.ts";

const DEFAULT_QUESTION = "このサンプルは日本語の文章をどうやって検索していますか？";

function parseTopK(raw: string | undefined): number {
  const value = Number(raw ?? "3");
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`RAG_TOP_K は 1 以上の整数で指定してください（受け取った値: ${raw}）`);
  }
  return value;
}

async function main(): Promise<void> {
  const question = process.argv.slice(2).join(" ").trim() || DEFAULT_QUESTION;
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
  const topK = parseTopK(process.env.RAG_TOP_K);
  const docsDir = process.env.RAG_DOCS_DIR || fileURLToPath(new URL("../docs", import.meta.url));

  const chunks = await loadMarkdownChunks(docsDir);
  const hits = buildBm25Index(chunks).search(question, topK);

  console.log(`質問: ${question}`);
  console.log(`読み込んだチャンク数: ${chunks.length} / 取り出した件数: ${hits.length} (top-k=${topK})\n`);
  for (const [i, hit] of hits.entries()) {
    console.log(`[${i + 1}] ${hit.chunk.id}  score=${hit.score.toFixed(3)}  見出し: ${hit.chunk.heading}`);
  }

  if (hits.length === 0) {
    console.log("\n関係するチャンクが見つかりませんでした。質問の言葉を変えて試してください。");
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("\n--- Claude に渡す予定のコンテキスト ---");
    console.log(formatContext(hits));
    console.log(
      "\nANTHROPIC_API_KEY が未設定のため、Claude への問い合わせは行わずに終了します（検索部分の確認用）。",
    );
    return;
  }

  const client = new Anthropic();
  const result = await answerWithClaude(client, model, question, hits);
  console.log(`\n--- 回答 (${model}) ---`);
  console.log(result.text || "(テキストの回答がありませんでした)");
  if (result.stopReason === "max_tokens") {
    console.log("\n注意: max_tokens に達して回答が途中で切れています。src/answer.ts の MAX_TOKENS を増やしてください（思考の分も数えられます）。");
  }
  console.log(`\n使用トークン: 入力 ${result.inputTokens} / 出力 ${result.outputTokens}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
