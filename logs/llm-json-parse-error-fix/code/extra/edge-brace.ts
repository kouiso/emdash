// 記事には載せない確認用。説明の文の中に { があると切り出す範囲がずれる、という本文の1文を確かめる。
import { extractJson, parseLlmJson } from "../extract-json.ts";

const text = '形式は {"category": 文字列} です。\n{"category": "billing", "priority": 1}';
console.log("切り出した範囲:", JSON.stringify(extractJson(text)));
try {
  console.log(parseLlmJson(text));
} catch (error) {
  console.log(String(error));
}
