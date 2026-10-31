import { parseLlmJson } from "./extract-json.ts";
import { samples } from "./samples.ts";

for (const [name, text] of Object.entries(samples)) {
  try {
    console.log(`${name}:`, parseLlmJson(text));
  } catch (error) {
    console.log(`${name}: ${String(error)}`);
  }
}
