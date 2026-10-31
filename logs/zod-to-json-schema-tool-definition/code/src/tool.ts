import type Anthropic from "@anthropic-ai/sdk";
import * as z from "zod";
import { searchOrdersInput } from "./schema.ts";

function toInputSchema(schema: z.ZodType): Anthropic.Tool.InputSchema {
  const json = z.toJSONSchema(schema, { io: "input" });
  if (json.type !== "object") {
    throw new Error(`ツールの入力は object のスキーマにします（実際は ${String(json.type)}）`);
  }
  return { ...json, type: "object" };
}

const searchOrdersTool: Anthropic.Tool = {
  name: "search_orders",
  description:
    "ネットショップの注文を、注文した人のメールアドレスと注文の状態で検索する。新しい注文から順に、最大 limit 件の注文番号と注文日を返す。",
  input_schema: toInputSchema(searchOrdersInput),
};

console.log(JSON.stringify(searchOrdersTool, null, 2));
